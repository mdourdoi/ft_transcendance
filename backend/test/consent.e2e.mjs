/**
 * Tests e2e du consentement RGPD à l'inscription : le champ acceptTerms doit
 * être présent et valoir true, et la date de consentement doit être stockée.
 *
 * Tape sur une API qui tourne vraiment (pas de mock) et crée ses propres comptes à
 * chaque exécution, donc relançable à volonté. Les comptes créés restent en base.
 *
 * Lancer (Node >= 22) :
 *   docker compose up -d --build
 *   node backend/test/consent.e2e.mjs
 *
 * Variables :
 *   API_URL=https://localhost:8443/api   cible (défaut, à travers le waf)
 *   DB_CONTAINER=transcendance-db
 *   VERBOSE=1                            affiche le corps de chaque réponse
 *
 * Légende de la sortie :
 *   ✔ passe   ✘ échoue
 */

import { spawnSync } from 'node:child_process';

const API = process.env.API_URL ?? 'https://localhost:8443/api';
const DB = process.env.DB_CONTAINER ?? 'transcendance-db';
const VERBOSE = !!process.env.VERBOSE;
const RUN = Date.now().toString(36);
const PASSWORD = 'Passw0rd!';

// Le waf sert un certificat auto-signé : on ne le vérifie pas en local.
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

function check(title, list) {
  report(title, null, runChecks(list));
}

// ─── Docker : base ───────────────────────────────────────────────────────────

function sql(query) {
  const r = spawnSync(
    'docker',
    [
      'exec',
      DB,
      'sh',
      '-c',
      'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "$1"',
      'sh',
      query,
    ],
    { encoding: 'utf8' },
  );
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`psql : ${(r.stdout + r.stderr).trim()}`);
  return (r.stdout + r.stderr).trim();
}

const userRow = (id, column) =>
  sql(`SELECT "${column}" FROM "User" WHERE id = ${id}`);

// ══════════════════════════════════════════════════════════════════════════════

console.log(c.bold(`Tests e2e consentement RGPD → ${API}`));

try {
  await fetch(`${API}/`);
} catch (e) {
  console.error(
    c.red(`\nAPI injoignable sur ${API} (${e.cause?.code ?? e.message}).`),
  );
  console.error(
    'Lance la stack : docker compose up -d --build',
  );
  process.exit(2);
}

try {
  sql('SELECT 1');
} catch (e) {
  console.error(c.red(`\nAccès docker/psql impossible : ${e.message}`));
  console.error(`Conteneur attendu : ${DB}`);
  process.exit(2);
}

// ─── 1 ────────────────────────────────────────────────────────────────────────
section('1. Inscription sans acceptTerms → refusée');

const base = {
  email: `c${RUN}a@test.local`,
  username: `c${RUN}a`,
  password: PASSWORD,
};

await test('acceptTerms absent', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base },
  status: 400,
  checks: (b) => [
    [
      'message contient CONSENT_REQUIRED',
      () => JSON.stringify(b.message).includes('CONSENT_REQUIRED'),
    ],
  ],
});

await test('acceptTerms = false', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base, acceptTerms: false },
  status: 400,
  checks: (b) => [
    [
      'message contient CONSENT_REQUIRED',
      () => JSON.stringify(b.message).includes('CONSENT_REQUIRED'),
    ],
  ],
});

await test('acceptTerms = "true" (string au lieu de boolean)', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base, acceptTerms: 'true' },
  status: 400,
});

await test('acceptTerms = null', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base, acceptTerms: null },
  status: 400,
});

await test('acceptTerms = 1 (number au lieu de boolean)', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base, acceptTerms: 1 },
  status: 400,
});

// ─── 2 ────────────────────────────────────────────────────────────────────────
section('2. Inscription avec acceptTerms = true → acceptée');

const reg = await test('Inscription valide avec acceptTerms = true', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base, acceptTerms: true },
  status: 201,
  checks: (b) => [
    ['id est un entier', () => Number.isInteger(b.id)],
    ['username correct', () => b.username === base.username],
    ['createdAt est une date', () => !Number.isNaN(Date.parse(b.createdAt))],
  ],
});

const userId = reg?.id;

// ─── 3 ────────────────────────────────────────────────────────────────────────
section('3. consentedAt est stocké en base');

if (userId) {
  const consentedAt = userRow(userId, 'consentedAt');
  check('consentedAt est renseigné', [
    ['non vide', () => consentedAt !== ''],
    ['date valide', () => !Number.isNaN(Date.parse(consentedAt))],
  ]);

  const createdAt = userRow(userId, 'createdAt');
  check('consentedAt est cohérent avec createdAt', [
    [
      'écart < 5 secondes',
      () => Math.abs(Date.parse(consentedAt) - Date.parse(createdAt)) < 5000,
    ],
  ]);
} else {
  check('consentedAt (inscription échouée, test ignoré)', [
    ['inscription réussie requise', () => false],
  ]);
}

// ─── 4 ────────────────────────────────────────────────────────────────────────
section("4. consentedAt apparaît dans l'export");

if (userId) {
  const login = await call(null, 'POST', '/auth/login', {
    email: base.email,
    password: PASSWORD,
  });
  const user = { name: 'consent_user', token: login.body?.accessToken };

  await test('Export contient consentedAt', {
    as: user,
    path: '/users/me/export',
    status: 200,
    checks: (b) => [
      [
        'profile.consentedAt présent',
        () => b.profile.consentedAt !== undefined,
      ],
      [
        'profile.consentedAt est une date',
        () => !Number.isNaN(Date.parse(b.profile.consentedAt)),
      ],
    ],
  });
} else {
  check('Export consentedAt (inscription échouée, test ignoré)', [
    ['inscription réussie requise', () => false],
  ]);
}

// ─── 5 ────────────────────────────────────────────────────────────────────────
section('5. Doublon — le même username/email est toujours rejeté');

await test('Réinscription avec le même email', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base, acceptTerms: true },
  status: 409,
  checks: (b) => [
    [
      'USERNAME_OR_EMAIL_ALREADY_TAKEN',
      () => b.message === 'USERNAME_OR_EMAIL_ALREADY_TAKEN',
    ],
  ],
});

await test('Réinscription avec le même email mais sans acceptTerms', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base },
  status: 400,
  checks: (b) => [
    [
      'validation avant le conflit (CONSENT_REQUIRED)',
      () => JSON.stringify(b.message).includes('CONSENT_REQUIRED'),
    ],
  ],
});

// ─── 6 ────────────────────────────────────────────────────────────────────────
section('6. Deuxième utilisateur — vérification indépendante');

const base2 = {
  email: `c${RUN}b@test.local`,
  username: `c${RUN}b`,
  password: PASSWORD,
};

const reg2 = await test('Deuxième inscription valide', {
  method: 'POST',
  path: '/auth/register',
  body: { ...base2, acceptTerms: true },
  status: 201,
  checks: (b) => [['id différent', () => b.id !== userId]],
});

if (reg2?.id) {
  const consentedAt2 = userRow(reg2.id, 'consentedAt');
  check('consentedAt du second utilisateur', [
    ['non vide', () => consentedAt2 !== ''],
    ['date valide', () => !Number.isNaN(Date.parse(consentedAt2))],
  ]);
}

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
