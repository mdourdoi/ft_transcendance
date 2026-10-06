/**
 * Tests e2e de la route POST /users/find (recherche d'un joueur par username).
 * La recherche est exacte : ni recherche partielle, ni tolérance sur la casse.
 *
 * Tape sur une API qui tourne vraiment (pas de mock) et crée ses propres comptes à
 * chaque exécution, donc relançable à volonté. Les comptes créés restent en base.
 *
 * Lancer (Node >= 18, pour fetch) :
 *   docker compose up -d --build
 *   node backend/test/users-find.e2e.mjs
 *
 * Variables :
 *   API_URL=https://localhost:8443/api   cible (défaut, à travers le waf)
 *   VERBOSE=1                            affiche le corps de chaque réponse, pas seulement des échecs
 *
 * Légende de la sortie :
 *   ✔ passe   ✘ échoue
 */

const API = process.env.API_URL ?? 'https://localhost:8443/api';
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

function report(title, request, results, body) {
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
async function test(
  title,
  { as, method = 'POST', path = '/users/find', body, status, checks },
) {
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
    let list = [];
    try {
      list = checks(res.body);
    } catch (e) {
      results.push({
        label: 'lecture de la réponse',
        ok: false,
        got: e.message,
      });
    }
    for (const [label, fn] of list) {
      try {
        results.push({ label, ok: fn() === true });
      } catch (e) {
        results.push({ label, ok: false, got: e.message });
      }
    }
  }

  report(title, request, results, res.body);
  return res.body;
}

// ─── Helpers métier ───────────────────────────────────────────────────────────

const invalidUsername = (b) => [
  [
    'message INVALID_USERNAME',
    () => [b.message].flat().includes('INVALID_USERNAME'),
  ],
];
const onlyId = (b) => [
  ['seul le champ id est renvoyé', () => Object.keys(b).join() === 'id'],
];
const found = (user) => (b) => [
  [`id = ${user.id}`, () => b.id === user.id],
  ...onlyId(b),
];
const notFound = (b) => [['id = null', () => b.id === null], ...onlyId(b)];

async function makeUser(name) {
  const username = `t${RUN}${name}`;
  const reg = await call(null, 'POST', '/auth/register', {
    email: `${username}@test.local`,
    username,
    password: PASSWORD,
  });
  if (reg.status !== 201)
    throw new Error(`register ${name} → ${reg.status} ${fmt(reg.body)}`);

  const login = await call(null, 'POST', '/auth/login', {
    email: `${username}@test.local`,
    password: PASSWORD,
  });
  if (login.status !== 200)
    throw new Error(`login ${name} → ${login.status} ${fmt(login.body)}`);

  const user = {
    name,
    username,
    id: reg.body.id,
    token: login.body.accessToken,
  };
  console.log(
    `  • ${name.padEnd(6)} id=${String(user.id).padEnd(5)} ${username}`,
  );
  return user;
}

// ══════════════════════════════════════════════════════════════════════════════

console.log(c.bold(`Tests e2e users/find → ${API}`));

try {
  await fetch(`${API}/`); // sans le / final, nginx redirige vers le port 443
} catch (e) {
  console.error(
    c.red(`\nAPI injoignable sur ${API} (${e.cause?.code ?? e.message}).`),
  );
  console.error('Lance la stack : docker compose up -d --build');
  process.exit(2);
}

section('0. Préparation — création des comptes');
const alice = await makeUser('alice');
const bob = await makeUser('bob');
const forged = {
  name: 'jeton forgé',
  token: 'eyJhbGciOiJIUzI1NiJ9.e30.invalide',
};

// ─── 1 ────────────────────────────────────────────────────────────────────────
section('1. Authentification — la route exige un JWT valide');

await test('Chercher sans jeton', {
  body: { username: bob.username },
  status: 401,
});
await test('Chercher avec un jeton forgé', {
  as: forged,
  body: { username: bob.username },
  status: 401,
});
await test('Un username invalide sans jeton reste un 401', {
  body: { username: '!' },
  status: 401,
});

// ─── 2 ────────────────────────────────────────────────────────────────────────
section('2. Validation du username');

await test('username absent', {
  as: alice,
  body: {},
  status: 400,
  checks: invalidUsername,
});
await test('corps absent', {
  as: alice,
  status: 400,
  checks: invalidUsername,
});
await test('username null', {
  as: alice,
  body: { username: null },
  status: 400,
  checks: invalidUsername,
});
await test('username de type number', {
  as: alice,
  body: { username: 12345 },
  status: 400,
  checks: invalidUsername,
});
await test('username de type tableau', {
  as: alice,
  body: { username: [bob.username] },
  status: 400,
  checks: invalidUsername,
});
await test('username de type objet', {
  as: alice,
  body: { username: { contains: 'a' } },
  status: 400,
  checks: invalidUsername,
});
await test('username vide', {
  as: alice,
  body: { username: '' },
  status: 400,
  checks: invalidUsername,
});
await test('username trop court (2)', {
  as: alice,
  body: { username: 'ab' },
  status: 400,
  checks: invalidUsername,
});
await test('username trop long (25)', {
  as: alice,
  body: { username: 'a'.repeat(25) },
  status: 400,
  checks: invalidUsername,
});
await test('username avec un espace', {
  as: alice,
  body: { username: 'ali ce' },
  status: 400,
  checks: invalidUsername,
});
await test('username entouré d’espaces', {
  as: alice,
  body: { username: ` ${bob.username} ` },
  status: 400,
  checks: invalidUsername,
});
await test('username avec un underscore', {
  as: alice,
  body: { username: 'ali_ce' },
  status: 400,
  checks: invalidUsername,
});
await test('username avec un joker SQL', {
  as: alice,
  body: { username: 'ali%' },
  status: 400,
  checks: invalidUsername,
});
await test('username avec une injection SQL', {
  as: alice,
  body: { username: "a' OR '1'='1" },
  status: 400,
  checks: invalidUsername,
});

// ─── 3 ────────────────────────────────────────────────────────────────────────
section('3. Recherche');

await test('alice trouve bob', {
  as: alice,
  body: { username: bob.username },
  status: 200,
  checks: found(bob),
});
await test('bob trouve alice', {
  as: bob,
  body: { username: alice.username },
  status: 200,
  checks: found(alice),
});
await test('alice se trouve elle-même', {
  as: alice,
  body: { username: alice.username },
  status: 200,
  checks: found(alice),
});
await test('username inconnu', {
  as: alice,
  body: { username: `t${RUN}nobody` },
  status: 200,
  checks: notFound,
});
await test('username inconnu de longueur minimale (3)', {
  as: alice,
  body: { username: 'zq7' },
  status: 200,
  checks: notFound,
});
await test('username inconnu de longueur maximale (24)', {
  as: alice,
  body: { username: `t${RUN}`.padEnd(24, 'z') },
  status: 200,
  checks: notFound,
});
await test('Les champs en trop sont ignorés', {
  as: alice,
  body: { username: bob.username, id: alice.id, email: 'x@test.local' },
  status: 200,
  checks: found(bob),
});

// ─── 4 ────────────────────────────────────────────────────────────────────────
section('4. Correspondance exacte — le username doit être identique');

await test('Un préfixe du username ne suffit pas', {
  as: alice,
  body: { username: bob.username.slice(0, -1) },
  status: 200,
  checks: notFound,
});
await test('Un suffixe du username ne suffit pas', {
  as: alice,
  body: { username: bob.username.slice(1) },
  status: 200,
  checks: notFound,
});
await test('Un fragment du username ne suffit pas', {
  as: alice,
  body: { username: bob.username.slice(1, -1) },
  status: 200,
  checks: notFound,
});
await test('Le username suivi d’un caractère en trop ne correspond pas', {
  as: alice,
  body: { username: `${bob.username}x` },
  status: 200,
  checks: notFound,
});
await test('Le username précédé d’un caractère en trop ne correspond pas', {
  as: alice,
  body: { username: `x${bob.username}` },
  status: 200,
  checks: notFound,
});
await test('La casse compte : tout en majuscules', {
  as: alice,
  body: { username: bob.username.toUpperCase() },
  status: 200,
  checks: notFound,
});
await test('La casse compte : première lettre en majuscule', {
  as: alice,
  body: { username: `T${bob.username.slice(1)}` },
  status: 200,
  checks: notFound,
});
await test('La casse compte : dernière lettre en majuscule', {
  as: alice,
  body: { username: `${bob.username.slice(0, -1)}B` },
  status: 200,
  checks: notFound,
});

// ─── 5 ────────────────────────────────────────────────────────────────────────
section('5. Méthode HTTP');

await test('GET /users/find n’existe pas', {
  as: alice,
  method: 'GET',
  status: 404,
});

// ─── Bilan ────────────────────────────────────────────────────────────────────

const ran = stats.pass + stats.fail;
console.log(`\n${c.bold('─'.repeat(78))}`);
console.log(
  `${c.bold(`${ran} tests`)}  ` +
    `${c.green(`${stats.pass} ✔`)}  ${c.red(`${stats.fail} ✘`)}`,
);
if (failures.length) {
  console.log(c.red('\nÉchecs inattendus :'));
  for (const f of failures) console.log(c.red(`  ✘ ${f}`));
}

process.exit(stats.fail > 0 ? 1 : 0);
