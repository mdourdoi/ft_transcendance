/**
 * Tests e2e du module mail : vérification d'email, 2FA par mail, suppression de
 * compte, export RGPD, et non-régression de la 2FA TOTP.
 *
 * Tape sur une API qui tourne vraiment (pas de mock) et crée ses propres comptes à
 * chaque exécution, donc relançable à volonté. Les comptes créés restent en base.
 *
 * Le backend DOIT tourner en mode console (SMTP_HOST vide) : les codes et liens
 * sont lus dans `docker logs`, et aucun vrai mail n'est envoyé aux adresses de test.
 *
 * Lancer (Node >= 22) :
 *   SMTP_HOST= docker compose up -d --build
 *   node backend/test/mail.e2e.mjs
 * Puis remettre le vrai SMTP :
 *   docker compose up -d backend
 *
 * Le script agit aussi directement sur la base (docker exec psql), uniquement sur
 * ses propres comptes, pour sauter le délai de 60 s entre deux envois et pour
 * simuler l'expiration d'un code ou d'un lien.
 *
 * Variables :
 *   API_URL=https://localhost:8443/api   cible (défaut, à travers le waf)
 *   BACKEND_CONTAINER=transcendance-backend
 *   DB_CONTAINER=transcendance-db
 *   REDIS_CONTAINER=transcendance-redis
 *   VERBOSE=1                            affiche le corps de chaque réponse et chaque mail capturé
 *
 * Légende de la sortie :
 *   ✔ passe   ✘ échoue   ✉ mail capturé dans les logs du backend
 */

import { spawnSync } from 'node:child_process';
import { crc32, deflateSync } from 'node:zlib';
import { generate } from 'otplib';

const API = process.env.API_URL ?? 'https://localhost:8443/api';
const BACKEND = process.env.BACKEND_CONTAINER ?? 'transcendance-backend';
const DB = process.env.DB_CONTAINER ?? 'transcendance-db';
const REDIS = process.env.REDIS_CONTAINER ?? 'transcendance-redis';
const VERBOSE = !!process.env.VERBOSE;
const RUN = Date.now().toString(36);
const PASSWORD = 'Passw0rd!';
const NEW_PASSWORD = 'N3wPassw0rd!';
const APP_URL_RE = /https?:\/\/[^\s]+\?token=([\w-]+)/;

if (/^https:\/\/(localhost|127\.0\.0\.1)[:/]/.test(API)) {
  process.removeAllListeners('warning');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// ─── Affichage ────────────────────────────────────────────────────────────────

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const c = {
  green: paint(32),
  red: paint(31),
  yellow: paint(33),
  cyan: paint(36),
  dim: paint(2),
  bold: paint(1),
};

const fmt = (v, max = 300) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s && s.length > max ? `${s.slice(0, max)}…` : s;
};

const section = (title) =>
  console.log(`\n${c.bold(`── ${title} `.padEnd(78, '─'))}`);

const stats = { pass: 0, fail: 0 };
const failures = [];

function report(title, request, results, { body } = {}) {
  const ok = results.every((r) => r.ok);
  if (ok) {
    stats.pass++;
  } else {
    stats.fail++;
    failures.push(title);
  }

  console.log(`  ${ok ? c.green('✔') : c.red('✘')} ${title}`);
  if (request) console.log(c.dim(`      ${request}`));
  for (const r of results) {
    const mark = r.ok ? c.green('✓') : c.red('✗');
    const got =
      r.ok || r.got === undefined ? '' : c.red(`  (reçu : ${fmt(r.got)})`);
    console.log(`      ${mark} ${r.label}${got}`);
  }
  if ((!ok || VERBOSE) && body !== undefined)
    console.log(c.dim(`      réponse : ${fmt(body)}`));
}

function runChecks(list) {
  return list.map(([label, fn]) => {
    try {
      return { label, ok: fn() === true };
    } catch (e) {
      return { label, ok: false, got: e.message };
    }
  });
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function call(as, method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (as?.token) headers.Authorization = `Bearer ${as.token}`;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
}

/**
 * Exécute une requête et vérifie le statut, puis chaque `checks` s'il correspond.
 * `checks(body)` renvoie une liste de [libellé, () => boolean].
 */
async function test(title, { as, method = 'GET', path, body, status, checks }) {
  const who = as ? as.name : 'sans jeton';
  const payload = body === undefined ? '' : ` · ${fmt(body, 80)}`;
  const request = `${method} ${path} · ${who}${payload}`;

  let res;
  try {
    res = await call(as, method, path, body);
  } catch (e) {
    report(title, request, [
      { label: 'requête HTTP', ok: false, got: e.message },
    ]);
    return undefined;
  }

  const results = [
    { label: `statut ${status}`, ok: res.status === status, got: res.status },
  ];
  if (res.status === status && checks) {
    try {
      results.push(...runChecks(checks(res.body)));
    } catch (e) {
      results.push({
        label: 'lecture de la réponse',
        ok: false,
        got: e.message,
      });
    }
  }

  report(title, request, results, { body: res.body });
  return res.body;
}

/** Vérification hors HTTP (base, logs, disque). */
function check(title, list) {
  report(title, null, runChecks(list));
}

// ─── Docker : base et logs ────────────────────────────────────────────────────

function docker(args) {
  const r = spawnSync('docker', args, { encoding: 'utf8' });
  if (r.error) throw r.error;
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

function sql(query) {
  const r = docker([
    'exec',
    DB,
    'sh',
    '-c',
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "$1"',
    'sh',
    query,
  ]);
  if (r.code !== 0) throw new Error(`psql : ${r.out.trim()}`);
  return r.out.trim();
}

function redis(...args) {
  const r = docker(['exec', REDIS, 'redis-cli', ...args]);
  if (r.code !== 0) throw new Error(`redis-cli : ${r.out.trim()}`);
  return r.out.trim();
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

function openSocket(namespace, token) {
  const nsp = namespace ? `${namespace},` : '';
  const ws = new WebSocket(
    `${API.replace(/^http/, 'ws')}/socket.io/?EIO=4&transport=websocket`,
  );
  const seen = new Set();
  const waiters = [];
  const fire = (event) => {
    seen.add(event);
    for (const w of waiters.filter((w) => w.event === event)) w.done();
  };

  ws.addEventListener('message', ({ data }) => {
    const text = String(data);
    if (text[0] === '0') ws.send(`40${nsp}${JSON.stringify({ token })}`);
    else if (text === '2') ws.send('3');
    else if (text.startsWith(`40${nsp}`)) fire('connect');
    else if (text.startsWith('41') || text.startsWith('44')) fire('disconnect');
    else if (text.startsWith(`42${nsp}`))
      fire(JSON.parse(text.slice(2 + nsp.length))[0]);
  });
  ws.addEventListener('close', () => fire('disconnect'));
  ws.addEventListener('error', () => fire('disconnect'));

  return {
    emit: (event, payload) =>
      ws.send(`42${nsp}${JSON.stringify([event, payload])}`),
    heard: (event, ms = 3000) =>
      new Promise((resolve) => {
        if (seen.has(event)) return resolve(true);
        const timer = setTimeout(() => resolve(false), ms);
        waiters.push({
          event,
          done: () => {
            clearTimeout(timer);
            resolve(true);
          },
        });
      }),
    close: () => ws.close(),
  };
}


const START = new Date().toISOString();
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

/** Mails écrits par MailService en mode console depuis le début du script. */
function mails() {
  const raw = stripAnsi(docker(['logs', '--since', START, BACKEND]).out);
  return raw
    .split('[MAIL] to=')
    .slice(1)
    .map((chunk) => {
      const text = chunk.split(/\n(?=\[Nest\])/)[0];
      return {
        to: text.slice(0, text.indexOf(' ')),
        subject: text.match(/subject="([^"]*)"/)?.[1],
        text,
      };
    });
}

const mailsTo = (user, subject) =>
  mails().filter(
    (m) => m.to === user.email && (!subject || m.subject.includes(subject)),
  );

/** Attend un nouveau mail (les notifications partent sans être attendues). */
async function waitMail(user, subject, before) {
  for (let i = 0; i < 20; i++) {
    const list = mailsTo(user, subject);
    if (list.length > before) {
      const m = list.at(-1);
      if (VERBOSE) console.log(c.cyan(`      ✉ ${m.to} · ${m.subject}`));
      return m;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return undefined;
}

function capture(kind, value) {
  console.log(c.cyan(`      ✉ ${kind} capturé : ${value ?? c.red('aucun')}`));
  return value;
}

async function lastCode(user, before) {
  const m = await waitMail(user, 'login code', before);
  return capture('code', m?.text.match(/Your code: (\d{6})/)?.[1]);
}

async function lastLink(user, subject, before) {
  const m = await waitMail(user, subject, before);
  const url = m?.text.match(APP_URL_RE)?.[0];
  capture('lien', url && `${url.slice(0, 60)}…`);
  return { url, token: m?.text.match(APP_URL_RE)?.[1] };
}

const count = (user, subject) => mailsTo(user, subject).length;

/** Fait comme si le dernier envoi datait d'il y a 2 min (délai anti-spam). */
const skipCooldown = (user) =>
  sql(
    `UPDATE "EmailToken" SET "createdAt" = now() - interval '2 minutes' WHERE "userId" = ${user.id}`,
  );

const expireActive = (user, type) =>
  sql(
    `UPDATE "EmailToken" SET "expiresAt" = now() - interval '1 second' WHERE "userId" = ${user.id} AND type = '${type}' AND "usedAt" IS NULL`,
  );

const userRow = (user, column) =>
  sql(`SELECT "${column}" FROM "User" WHERE id = ${user.id}`);

// ─── Helpers métier ───────────────────────────────────────────────────────────

async function makeUser(name) {
  const username = `m${RUN}_${name}`;
  const email = `${username}@test.local`;
  const reg = await call(null, 'POST', '/auth/register', {
    email,
    username,
    password: PASSWORD,
    acceptTerms: true,
  });
  if (reg.status !== 201)
    throw new Error(`register ${name} → ${reg.status} ${fmt(reg.body)}`);

  const login = await call(null, 'POST', '/auth/login', {
    username,
    password: PASSWORD,
  });
  if (login.status !== 200)
    throw new Error(`login ${name} → ${login.status} ${fmt(login.body)}`);

  const user = {
    name,
    username,
    email,
    id: reg.body.id,
    token: login.body.accessToken,
  };
  console.log(
    `  • ${name.padEnd(6)} id=${String(user.id).padEnd(5)} ${username}`,
  );
  return user;
}

const loginBody = (user, password, code) => ({
  username: user.username,
  password,
  ...(code ? { code } : {}),
});

const otherCode = (code) =>
  String((Number(code) + 1) % 1_000_000).padStart(6, '0');

function tinyPng() {
  const chunk = (type, data) => {
    const td = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ══════════════════════════════════════════════════════════════════════════════

console.log(c.bold(`Tests e2e mail → ${API}`));

try {
  await fetch(`${API}/`);
} catch (e) {
  console.error(
    c.red(`\nAPI injoignable sur ${API} (${e.cause?.code ?? e.message}).`),
  );
  console.error(
    'Lance la stack : SMTP_HOST= docker compose up -d --build',
  );
  process.exit(2);
}

{
  let logs;
  try {
    logs = stripAnsi(docker(['logs', BACKEND]).out);
    sql('SELECT 1');
  } catch (e) {
    console.error(c.red(`\nAccès docker impossible : ${e.message}`));
    console.error(`Conteneurs attendus : ${BACKEND}, ${DB}`);
    process.exit(2);
  }
  const lastBoot = logs.lastIndexOf('Starting Nest application');
  if (!logs.slice(lastBoot).includes('SMTP_HOST not set')) {
    console.error(
      c.red('\nLe backend utilise un vrai SMTP : les codes seraient envoyés'),
    );
    console.error(
      c.red('à de fausses adresses et le script ne pourrait pas les lire.'),
    );
    console.error(
      'Relance-le en mode console : SMTP_HOST= docker compose up -d backend',
    );
    process.exit(2);
  }
}

section('0. Préparation — création des comptes');
const alice = await makeUser('alice'); // parcours complet 2FA par mail
const bob = await makeUser('bob'); // email jamais vérifié, puis supprimé
const carol = await makeUser('carol'); // 2FA TOTP (non-régression)

// ─── 1 ────────────────────────────────────────────────────────────────────────
section("1. Vérification de l'email");

let n = count(alice, 'Verify');
await test('alice demande la vérification de son email', {
  as: alice,
  method: 'POST',
  path: '/users/me/verify-email',
  status: 204,
});
let link = await lastLink(alice, 'Verify', n);
check('Le mail contient un lien vers la page front /verify-email', [
  ['lien présent', () => link.url !== undefined],
  [
    'chemin /verify-email?token=',
    () => link.url.includes('/verify-email?token='),
  ],
]);
check('Le token est stocké hashé, jamais en clair', [
  [
    'aucune ligne ne contient le token brut',
    () =>
      sql(
        `SELECT count(*) FROM "EmailToken" WHERE "tokenHash" = '${link.token}'`,
      ) === '0',
  ],
  [
    'un token EMAIL_VERIFY actif',
    () =>
      sql(
        `SELECT count(*) FROM "EmailToken" WHERE "userId" = ${alice.id} AND type = 'EMAIL_VERIFY' AND "usedAt" IS NULL`,
      ) === '1',
  ],
]);
await test('Redemander moins de 60 s après → anti-spam', {
  as: alice,
  method: 'POST',
  path: '/users/me/verify-email',
  status: 429,
  checks: (b) => [
    ['MAIL_RATE_LIMITED', () => b.message === 'MAIL_RATE_LIMITED'],
  ],
});
await test('Demander sans jeton', {
  method: 'POST',
  path: '/users/me/verify-email',
  status: 401,
});
await test('Confirmer avec un token bidon', {
  method: 'POST',
  path: '/users/verify-email/confirm',
  body: { token: 'nope' },
  status: 400,
  checks: (b) => [['INVALID_TOKEN', () => b.message === 'INVALID_TOKEN']],
});
await test('Confirmer sans token (validation du DTO)', {
  method: 'POST',
  path: '/users/verify-email/confirm',
  body: {},
  status: 400,
});
await test('Confirmer avec le bon token', {
  method: 'POST',
  path: '/users/verify-email/confirm',
  body: { token: link.token },
  status: 204,
});
check('emailVerifiedAt est renseigné en base', [
  ['non nul', () => userRow(alice, 'emailVerifiedAt') !== ''],
]);
await test('Réutiliser le même lien', {
  method: 'POST',
  path: '/users/verify-email/confirm',
  body: { token: link.token },
  status: 400,
});
await test('Redemander alors que l’email est déjà vérifié', {
  as: alice,
  method: 'POST',
  path: '/users/me/verify-email',
  status: 409,
  checks: (b) => [
    ['EMAIL_ALREADY_VERIFIED', () => b.message === 'EMAIL_ALREADY_VERIFIED'],
  ],
});

section('1b. Lien expiré, lien remplacé');

n = count(carol, 'Verify');
await call(carol, 'POST', '/users/me/verify-email');
link = await lastLink(carol, 'Verify', n);
expireActive(carol, 'EMAIL_VERIFY');
await test('Un lien expiré est refusé', {
  method: 'POST',
  path: '/users/verify-email/confirm',
  body: { token: link.token },
  status: 400,
});

skipCooldown(carol);
n = count(carol, 'Verify');
await call(carol, 'POST', '/users/me/verify-email');
const oldLink = await lastLink(carol, 'Verify', n);
skipCooldown(carol);
n = count(carol, 'Verify');
await call(carol, 'POST', '/users/me/verify-email');
const newLink = await lastLink(carol, 'Verify', n);
await test("L'ancien lien ne marche plus après en avoir redemandé un", {
  method: 'POST',
  path: '/users/verify-email/confirm',
  body: { token: oldLink.token },
  status: 400,
});
await test('Le nouveau lien marche', {
  method: 'POST',
  path: '/users/verify-email/confirm',
  body: { token: newLink.token },
  status: 204,
});

// ─── 2 ────────────────────────────────────────────────────────────────────────
section('2. Activation de la 2FA par mail');

await test('bob (email non vérifié) ne peut pas lancer l’activation', {
  as: bob,
  method: 'POST',
  path: '/twofa/email/setup',
  status: 403,
  checks: (b) => [
    ['EMAIL_NOT_VERIFIED', () => b.message === 'EMAIL_NOT_VERIFIED'],
  ],
});
await test('…ni la valider', {
  as: bob,
  method: 'POST',
  path: '/twofa/email/verify',
  body: { code: '123456' },
  status: 403,
});

n = count(alice, 'login code');
await test('alice lance l’activation', {
  as: alice,
  method: 'POST',
  path: '/twofa/email/setup',
  status: 204,
});
let code = await lastCode(alice, n);
await test('Code mal formé (validation du DTO)', {
  as: alice,
  method: 'POST',
  path: '/twofa/email/verify',
  body: { code: '12' },
  status: 400,
});
await test('Mauvais code', {
  as: alice,
  method: 'POST',
  path: '/twofa/email/verify',
  body: { code: otherCode(code) },
  status: 401,
  checks: (b) => [
    ['INVALID_TWOFA_CODE', () => b.message === 'INVALID_TWOFA_CODE'],
  ],
});
check('Le mauvais essai est compté', [
  [
    'attempts = 1',
    () =>
      sql(
        `SELECT attempts FROM "EmailToken" WHERE "userId" = ${alice.id} AND type = 'TWOFA_LOGIN' AND "usedAt" IS NULL`,
      ) === '1',
  ],
]);
await test('Bon code → 2FA activée en mode EMAIL', {
  as: alice,
  method: 'POST',
  path: '/twofa/email/verify',
  body: { code },
  status: 201,
  checks: (b) => [
    ['twoFactorEnabled', () => b.twoFactorEnabled === true],
    ['twoFactorMethod = EMAIL', () => b.twoFactorMethod === 'EMAIL'],
  ],
});
await test('Relancer l’activation alors qu’elle est active', {
  as: alice,
  method: 'POST',
  path: '/twofa/email/setup',
  status: 409,
});
await test('Lancer un setup TOTP alors que la 2FA mail est active', {
  as: alice,
  method: 'POST',
  path: '/twofa/setup',
  status: 409,
});

// ─── 3 ────────────────────────────────────────────────────────────────────────
section('3. Login avec la 2FA par mail');

n = count(alice, 'login code');
await test('Mauvais mot de passe', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, 'wrong'),
  status: 401,
  checks: (b) => [
    ['INVALID_CREDENTIALS', () => b.message === 'INVALID_CREDENTIALS'],
  ],
});
check('Aucun mail envoyé sur un mauvais mot de passe', [
  ['pas de nouveau mail', () => count(alice, 'login code') === n],
]);

skipCooldown(alice);
await test('Bon mot de passe sans code → code requis', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, PASSWORD),
  status: 401,
  checks: (b) => [
    ['TWOFA_CODE_REQUIRED', () => b.message === 'TWOFA_CODE_REQUIRED'],
  ],
});
code = await lastCode(alice, n);
await test('Redemander moins de 60 s après → anti-spam', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, PASSWORD),
  status: 429,
});
const logged = await test('Login avec le code', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, PASSWORD, code),
  status: 200,
  checks: (b) => [['accessToken', () => typeof b.accessToken === 'string']],
});
if (logged?.accessToken) alice.token = logged.accessToken;
await test('Rejouer le même code', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, PASSWORD, code),
  status: 401,
});

section('3b. Force brute, expiration, concurrence');

skipCooldown(alice);
n = count(alice, 'login code');
await call(null, 'POST', '/auth/login', loginBody(alice, PASSWORD));
code = await lastCode(alice, n);
for (let i = 0; i < 5; i++)
  await call(
    null,
    'POST',
    '/auth/login',
    loginBody(alice, PASSWORD, otherCode(code)),
  );
await test('Après 5 mauvais codes, même le bon est refusé', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, PASSWORD, code),
  status: 401,
});

skipCooldown(alice);
n = count(alice, 'login code');
await call(null, 'POST', '/auth/login', loginBody(alice, PASSWORD));
code = await lastCode(alice, n);
expireActive(alice, 'TWOFA_LOGIN');
await test('Un code expiré est refusé', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, PASSWORD, code),
  status: 401,
});

skipCooldown(alice);
n = count(alice, 'login code');
await call(null, 'POST', '/auth/login', loginBody(alice, PASSWORD));
code = await lastCode(alice, n);
const race = await Promise.all(
  Array.from({ length: 6 }, () =>
    call(null, 'POST', '/auth/login', loginBody(alice, PASSWORD, code)),
  ),
);
check('6 logins simultanés avec le même code → un seul passe', [
  [
    `statuts : ${race.map((r) => r.status).join(', ')}`,
    () => race.filter((r) => r.status === 200).length === 1,
  ],
]);

// ─── 4 ────────────────────────────────────────────────────────────────────────
section('4. Changement de mot de passe avec la 2FA par mail');

skipCooldown(alice);
n = count(alice, 'login code');
await test('Sans code → code requis (mail envoyé)', {
  as: alice,
  method: 'PATCH',
  path: '/users/me/password',
  body: { oldPassword: PASSWORD, newPassword: NEW_PASSWORD },
  status: 401,
  checks: (b) => [
    ['TWOFA_CODE_REQUIRED', () => b.message === 'TWOFA_CODE_REQUIRED'],
  ],
});
code = await lastCode(alice, n);
n = count(alice, 'Password changed');
await test('Avec le code', {
  as: alice,
  method: 'PATCH',
  path: '/users/me/password',
  body: { oldPassword: PASSWORD, newPassword: NEW_PASSWORD, code },
  status: 200,
});
const notif = await waitMail(alice, 'Password changed', n);
check('Mail « Password changed » envoyé', [
  ['reçu', () => notif !== undefined],
]);
await test("L'ancien mot de passe ne marche plus", {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, PASSWORD),
  status: 401,
  checks: (b) => [
    ['INVALID_CREDENTIALS', () => b.message === 'INVALID_CREDENTIALS'],
  ],
});

// ─── 5 ────────────────────────────────────────────────────────────────────────
section('5. Désactivation de la 2FA par mail');

skipCooldown(alice);
n = count(alice, 'login code');
await test('Sans code → code requis (mail envoyé)', {
  as: alice,
  method: 'POST',
  path: '/twofa/delete',
  body: {},
  status: 401,
  checks: (b) => [
    ['TWOFA_CODE_REQUIRED', () => b.message === 'TWOFA_CODE_REQUIRED'],
  ],
});
code = await lastCode(alice, n);
await test('Avec le code', {
  as: alice,
  method: 'POST',
  path: '/twofa/delete',
  body: { code },
  status: 201,
  checks: (b) => [
    ['twoFactorEnabled = false', () => b.twoFactorEnabled === false],
  ],
});
check('La méthode revient à TOTP', [
  [
    'twoFactorMethod = TOTP',
    () => userRow(alice, 'twoFactorMethod') === 'TOTP',
  ],
]);
await test('Login sans 2FA', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(alice, NEW_PASSWORD),
  status: 200,
});
await test('Désactiver alors que ce n’est plus actif', {
  as: alice,
  method: 'POST',
  path: '/twofa/delete',
  body: {},
  status: 409,
});

// ─── 6 ────────────────────────────────────────────────────────────────────────
section('6. Non-régression 2FA TOTP (carol)');

const setup = await test('Setup TOTP', {
  as: carol,
  method: 'POST',
  path: '/twofa/setup',
  status: 201,
  checks: (b) => [
    ['secret renvoyé', () => typeof b.twoFactorSecret === 'string'],
  ],
});
const totp = () => generate({ secret: setup.twoFactorSecret });
await test('Activation TOTP', {
  as: carol,
  method: 'POST',
  path: '/twofa/verify',
  body: { code: await totp() },
  status: 201,
});
n = mailsTo(carol).length;
await test('Login sans code → code requis', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(carol, PASSWORD),
  status: 401,
  checks: (b) => [
    ['TWOFA_CODE_REQUIRED', () => b.message === 'TWOFA_CODE_REQUIRED'],
  ],
});
await test('Login avec un mauvais code TOTP', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(carol, PASSWORD, '000000'),
  status: 401,
});
await test('Login avec le code TOTP', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(carol, PASSWORD, await totp()),
  status: 200,
});
await test('Changement de mot de passe avec TOTP', {
  as: carol,
  method: 'PATCH',
  path: '/users/me/password',
  body: {
    oldPassword: PASSWORD,
    newPassword: NEW_PASSWORD,
    code: await totp(),
  },
  status: 200,
});
await test('Désactivation TOTP avec le code', {
  as: carol,
  method: 'POST',
  path: '/twofa/delete',
  body: { code: await totp() },
  status: 201,
});
check('Aucun code 2FA envoyé par mail à un utilisateur TOTP', [
  [
    'seulement la notif « Password changed »',
    () =>
      mailsTo(carol)
        .slice(n)
        .every((m) => m.subject === 'Password changed'),
  ],
]);

// ─── 7 ────────────────────────────────────────────────────────────────────────
section("7. Changer d'email annule la vérification");

alice.email = `m${RUN}_alice2@test.local`;
await test('alice change son email', {
  as: alice,
  method: 'PATCH',
  path: '/users/me',
  body: { email: alice.email },
  status: 200,
});
check('emailVerifiedAt repasse à null', [
  ['null', () => userRow(alice, 'emailVerifiedAt') === ''],
]);
await test('La 2FA par mail est de nouveau refusée', {
  as: alice,
  method: 'POST',
  path: '/twofa/email/setup',
  status: 403,
});

// ─── 8 ────────────────────────────────────────────────────────────────────────
section('8. Export des données (RGPD)');

await test('alice envoie une demande d’ami à bob', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 201,
});
const fid = sql(
  `SELECT id FROM "Friendship" WHERE "senderId" = ${alice.id} AND "receiverId" = ${bob.id}`,
);
sql(
  `INSERT INTO "Conversation" ("friendshipId") VALUES (${fid}) ON CONFLICT DO NOTHING`,
);
const convId = sql(
  `SELECT id FROM "Conversation" WHERE "friendshipId" = ${fid}`,
);
sql(
  `INSERT INTO "Message" (id, content, "senderId", "conversationId") VALUES ` +
    `('m${RUN}_1', 'hello from alice', ${alice.id}, ${convId}), ` +
    `('m${RUN}_2', 'hello from bob', ${bob.id}, ${convId})`,
);
console.log(c.dim('      (2 messages insérés en base pour le test)'));
sql(
  `INSERT INTO "Match" (mode, status, "playerOneId", "playerTwoId", "winnerId", "finishedAt") ` +
    `VALUES ('RANKED', 'FINISHED', ${alice.id}, ${bob.id}, ${alice.id}, now())`,
);
console.log(c.dim('      (1 match classé alice > bob inséré en base)'));

n = count(alice, 'Data exported');
await test('alice exporte ses données', {
  as: alice,
  path: '/users/me/export',
  status: 200,
  checks: (b) => [
    [
      'profil',
      () => b.profile.id === alice.id && b.profile.email === alice.email,
    ],
    [
      'amitié avec bob (envoyée)',
      () =>
        b.friendships.some(
          (f) => f.with === bob.username && f.direction === 'sent',
        ),
    ],
    [
      'seulement ses propres messages',
      () =>
        JSON.stringify(b.messages.map((m) => m.content)) ===
        '["hello from alice"]',
    ],
    ['rating', () => typeof b.profile.rating === 'number'],
    [
      'match classé gagné contre bob',
      () =>
        b.matches.length === 1 &&
        b.matches[0].opponent === bob.username &&
        b.matches[0].mode === 'RANKED' &&
        b.matches[0].status === 'FINISHED' &&
        b.matches[0].won === true,
    ],
    [
      'aucun identifiant interne dans les matchs',
      () => !/playerOneId|playerTwoId|winnerId/.test(JSON.stringify(b.matches)),
    ],
    [
      'aucun secret',
      () => !/passwordHash|twoFactorSecret|tokenHash/i.test(JSON.stringify(b)),
    ],
  ],
});
const exported = await waitMail(alice, 'Data exported', n);
const exportRes = await fetch(`${API}/users/me/export`, {
  headers: { Authorization: `Bearer ${alice.token}` },
});
check('Export : mail de confirmation et fichier nommé', [
  ['mail « Data exported » envoyé', () => exported !== undefined],
  [
    'Content-Disposition attachment .json',
    () =>
      /^attachment; filename=".+\.json"$/.test(
        exportRes.headers.get('content-disposition') ?? '',
      ),
  ],
]);
await test('bob voit le même match, perdu', {
  as: bob,
  path: '/users/me/export',
  status: 200,
  checks: (b) => [
    [
      'match perdu contre alice',
      () =>
        b.matches.length === 1 &&
        b.matches[0].opponent === alice.username &&
        b.matches[0].won === false,
    ],
  ],
});
await test('Export sans jeton', { path: '/users/me/export', status: 401 });

// ─── 9 ────────────────────────────────────────────────────────────────────────
section('9. Suppression de compte (bob)');

const form = new FormData();
form.append('file', new Blob([tinyPng()], { type: 'image/png' }), 'a.png');
const avatarRes = await fetch(`${API}/users/me/avatar`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${bob.token}` },
  body: form,
});
const avatar = (await avatarRes.json()).avatarUrl;
const avatarOnDisk = () =>
  docker(['exec', BACKEND, 'test', '-f', `/app/uploads/avatars/${avatar}`])
    .code === 0;
check('bob a un avatar sur le disque', [[`${avatar}`, () => avatarOnDisk()]]);

n = count(bob, 'deletion');
await test('bob demande la suppression', {
  as: bob,
  method: 'POST',
  path: '/users/me/delete-request',
  status: 204,
});
link = await lastLink(bob, 'deletion', n);
check('Le mail pointe vers la page front /account/delete', [
  [
    'chemin /account/delete?token=',
    () => link.url.includes('/account/delete?token='),
  ],
]);
await test('Le token de suppression ne marche pas pour vérifier un email', {
  method: 'POST',
  path: '/users/verify-email/confirm',
  body: { token: link.token },
  status: 400,
});
await test('Confirmer avec un token bidon', {
  method: 'POST',
  path: '/users/delete-confirm',
  body: { token: 'nope' },
  status: 400,
});
const bobMatches = () =>
  sql(
    `SELECT count(*) FROM "Match" WHERE "playerOneId" = ${bob.id} OR "playerTwoId" = ${bob.id}`,
  );
check('Avant suppression : amitié, message, match et tokens de bob', [
  ['1 match', () => bobMatches() === '1'],
  [
    '1 amitié',
    () =>
      sql(
        `SELECT count(*) FROM "Friendship" WHERE "receiverId" = ${bob.id}`,
      ) === '1',
  ],
  [
    '1 message',
    () =>
      sql(`SELECT count(*) FROM "Message" WHERE "senderId" = ${bob.id}`) ===
      '1',
  ],
  [
    'des tokens',
    () =>
      sql(`SELECT count(*) FROM "EmailToken" WHERE "userId" = ${bob.id}`) !==
      '0',
  ],
]);
const bobChat = openSocket('', bob.token);
const bobQueue = openSocket('/queue', bob.token);
const bobQueueEntry = () => redis('EXISTS', `queue:entry:UNRANKED:${bob.id}`);
const chatOpen = await bobChat.heard('connect');
const queueOpen = await bobQueue.heard('connect');
if (queueOpen) bobQueue.emit('queue.join', { mode: 'UNRANKED' });
const queueJoined = await bobQueue.heard('queue.joined');
check('Avant suppression : bob est connecté et en file', [
  ['socket du chat ouvert', () => chatOpen],
  ['socket de la file ouvert', () => queueOpen],
  ['file rejointe', () => queueJoined],
  ['entrée dans Redis', () => bobQueueEntry() === '1'],
]);

n = count(bob, 'Account deleted');
await test('Confirmer avec le bon token', {
  method: 'POST',
  path: '/users/delete-confirm',
  body: { token: link.token },
  status: 204,
});
const bye = await waitMail(bob, ‘Account deleted’, n);
const chatClosed = await bobChat.heard(‘disconnect’);
const queueClosed = await bobQueue.heard(‘disconnect’);
await new Promise((r) => setTimeout(r, 300));
check(‘Les sessions temps réel de bob sont fermées’, [
  [‘socket du chat déconnecté’, () => chatClosed],
  [‘socket de la file déconnecté’, () => queueClosed],
  [‘plus d’entrée dans Redis’, () => bobQueueEntry() === ‘0’],
  [
    ‘plus dans la liste d’attente’,
    () =>
      !redis(‘LRANGE’, ‘queue:unranked:list’, ‘0’, ‘-1’)
        .split(‘\n’)
        .includes(String(bob.id)),
  ],
]);
bobChat.close();
bobQueue.close();
check('Tout ce qui concerne bob a disparu', [
  [
    'ligne User',
    () => sql(`SELECT count(*) FROM "User" WHERE id = ${bob.id}`) === '0',
  ],
  [
    'tokens, amitiés, messages (cascade)',
    () =>
      sql(
        `SELECT (SELECT count(*) FROM "EmailToken" WHERE "userId" = ${bob.id})` +
          ` + (SELECT count(*) FROM "Friendship" WHERE "senderId" = ${bob.id} OR "receiverId" = ${bob.id})` +
          ` + (SELECT count(*) FROM "Message" WHERE "senderId" = ${bob.id})`,
      ) === '0',
  ],
  ['matchs (cascade)', () => bobMatches() === '0'],
  ['fichier avatar', () => !avatarOnDisk()],
  ['mail « Account deleted » envoyé', () => bye !== undefined],
  [
    'alice existe toujours',
    () => sql(`SELECT count(*) FROM "User" WHERE id = ${alice.id}`) === '1',
  ],
]);
await test("Le match a disparu de l'historique d'alice (cascade)", {
  as: alice,
  path: '/users/me/export',
  status: 200,
  checks: (b) => [['aucun match', () => b.matches.length === 0]],
});
await test('Réutiliser le lien de suppression', {
  method: 'POST',
  path: '/users/delete-confirm',
  body: { token: link.token },
  status: 400,
});
await test('bob ne peut plus se connecter', {
  method: 'POST',
  path: '/auth/login',
  body: loginBody(bob, PASSWORD),
  status: 401,
});
await test("L'ancien JWT de bob est refusé", {
  as: bob,
  path: '/users/me',
  status: 401,
});
await test("L'ancien JWT de bob ne permet plus d'exporter", {
  as: bob,
  path: '/users/me/export',
  status: 401,
});
await test("L'ancien JWT de bob ne permet plus d'écrire", {
  as: bob,
  method: 'POST',
  path: '/friendships/send',
  body: { username: alice.username },
  status: 401,
});
const ghostChat = openSocket('', bob.token);
const ghostQueue = openSocket('/queue', bob.token);
const ghostChatClosed = await ghostChat.heard('disconnect');
const ghostQueueClosed = await ghostQueue.heard('disconnect');
check("L'ancien JWT de bob ne permet plus de se connecter en WebSocket", [
  ['chat refusé', () => ghostChatClosed],
  ['file refusée', () => ghostQueueClosed],
]);
ghostChat.close();
ghostQueue.close();

// ─── Bilan ────────────────────────────────────────────────────────────────────

const ran = stats.pass + stats.fail;
console.log(`\n${c.bold('─'.repeat(78))}`);
console.log(
  `${c.bold(`${ran} tests`)}  ${c.green(`${stats.pass} ✔`)}  ${c.red(`${stats.fail} ✘`)}`,
);
if (failures.length) {
  console.log(c.red('\nÉchecs :'));
  for (const f of failures) console.log(c.red(`  ✘ ${f}`));
}

process.exit(stats.fail > 0 ? 1 : 0);
