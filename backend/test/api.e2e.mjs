/**
 * Tests e2e des routes /friendships.
 *
 * Tape sur une API qui tourne vraiment (pas de mock) et crée ses propres comptes à
 * chaque exécution, donc relançable à volonté. Les comptes créés restent en base.
 *
 * Lancer (Node >= 18, pour fetch) :
 *   docker compose up -d --build db backend
 *   node backend/test/api.e2e.mjs
 *
 * Variables :
 *   API_URL=http://localhost:3000   cible (défaut)
 *   VERBOSE=1                       affiche le corps de chaque réponse, pas seulement des échecs
 *
 * Légende de la sortie :
 *   ✔ passe   ✘ échoue   ⚠ échoue, problème déjà connu (REVIEW-BACKEND.md)
 *   ★ passe alors qu'il était marqué connu → le problème semble corrigé, retirer `known`
 */

const API = 'http://localhost:3000';
const VERBOSE = !!process.env.VERBOSE;
const RUN = Date.now().toString(36);
const PASSWORD = 'Passw0rd!';
const NOPE = 2_000_000_000; // id qui n'existe pas mais tient dans un Int Postgres

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

const stats = { pass: 0, fail: 0, known: 0, fixed: 0 };
const failures = [];
const knownFailures = [];
const fixedKnown = [];

function report(title, request, results, { known, body } = {}) {
  const ok = results.every((r) => r.ok);
  let icon;
  let tag = '';

  if (ok && !known) {
    icon = c.green('✔');
    stats.pass++;
  } else if (ok) {
    icon = c.cyan('★');
    tag = c.cyan(
      `  [marqué connu (${known}) mais passe — retirer le marqueur ?]`,
    );
    stats.fixed++;
    fixedKnown.push(`${title} (${known})`);
  } else if (known) {
    icon = c.yellow('⚠');
    tag = c.yellow(`  [problème connu : ${known}]`);
    stats.known++;
    knownFailures.push(`${title} (${known})`);
  } else {
    icon = c.red('✘');
    stats.fail++;
    failures.push(title);
  }

  console.log(`  ${icon} ${title}${tag}`);
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
 * `known` référence une section de REVIEW-BACKEND.md quand l'échec est attendu.
 */
async function test(
  title,
  { as, method = 'GET', path, body, status, checks, known },
) {
  const who = as ? as.name : 'sans jeton';
  const payload = body === undefined ? '' : ` · ${fmt(body, 80)}`;
  const request = `${method} ${path} · ${who}${payload}`;

  let res;
  try {
    res = await call(as, method, path, body);
  } catch (e) {
    report(
      title,
      request,
      [{ label: 'requête HTTP', ok: false, got: e.message }],
      { known },
    );
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

  report(title, request, results, { known, body: res.body });
  return res.body;
}

// ─── Helpers métier ───────────────────────────────────────────────────────────

const entry = (list, user) =>
  Array.isArray(list) ? list.find((f) => f.user?.id === user.id) : undefined;
const has = (list, user) => entry(list, user) !== undefined;

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

console.log(c.bold(`Tests e2e friendships → ${API}`));

try {
  await fetch(API);
} catch (e) {
  console.error(
    c.red(`\nAPI injoignable sur ${API} (${e.cause?.code ?? e.message}).`),
  );
  console.error('Lance la stack : docker compose up -d --build db backend');
  process.exit(2);
}

section('0. Préparation — création des comptes');
const alice = await makeUser('alice');
const bob = await makeUser('bob');
const carol = await makeUser('carol'); // n'est jamais amie avec alice/bob : sert d'intruse
const dave = await makeUser('dave');
const forged = {
  name: 'jeton forgé',
  token: 'eyJhbGciOiJIUzI1NiJ9.e30.invalide',
};

// ─── 1 ────────────────────────────────────────────────────────────────────────
section('1. Authentification — toutes les routes exigent un JWT valide');

await test('Lister ses amis sans jeton', {
  path: '/friendships',
  status: 401,
});
await test('Lister ses amis avec un jeton forgé', {
  as: forged,
  path: '/friendships',
  status: 401,
});
await test('Envoyer une demande sans jeton', {
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 401,
});

// ─── 2 ────────────────────────────────────────────────────────────────────────
section('2. Validation des entrées des routes friendships');

await test('username absent', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: {},
  status: 400,
});
await test('username de type number', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: 42 },
  status: 400,
});
await test('username trop court', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: 'ab' },
  status: 400,
});
await test('username trop long', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: 'a'.repeat(25) },
  status: 400,
});
await test('username non alphanumérique', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: 'bob; --' },
  status: 400,
});
await test("S'envoyer une demande à soi-même", {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: alice.username },
  status: 403,
});
await test("Demande vers un utilisateur qui n'existe pas → 404 attendu", {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: `nope${RUN}` },
  status: 404,
});
await test("Accepter une demande d'un utilisateur inexistant", {
  as: alice,
  method: 'POST',
  path: '/friendships/accept',
  body: { targetId: NOPE },
  status: 403,
});

// ─── 3 ────────────────────────────────────────────────────────────────────────
section('3. Cycle d’une demande — envoyer, annuler, refuser');

await test('alice envoie une demande à bob', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 201,
});
await test('alice renvoie la même demande (doublon)', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 403,
});
await test('alice voit bob dans ses demandes envoyées', {
  as: alice,
  path: '/friendships/pending',
  status: 200,
  checks: (list) => {
    const e = entry(list, bob);
    return [
      ['bob est présent', () => e !== undefined],
      ['status === PENDING', () => e.status === 'PENDING'],
      ['isSender === true', () => e.isSender === true],
      [
        'conversationId === null (pas encore amis)',
        () => e.conversationId === null,
      ],
      [
        'user.username est celui de bob',
        () => e.user.username === bob.username,
      ],
      [
        'user.avatarUrl est une string',
        () => typeof e.user.avatarUrl === 'string',
      ],
    ];
  },
});
await test('bob voit alice dans ses demandes reçues', {
  as: bob,
  path: '/friendships/requests',
  status: 200,
  checks: (list) => [
    ['alice est présente', () => has(list, alice)],
    ['isSender === false', () => entry(list, alice).isSender === false],
  ],
});
await test('alice ne voit pas bob dans ses demandes reçues', {
  as: alice,
  path: '/friendships/requests',
  status: 200,
  checks: (list) => [['bob absent', () => !has(list, bob)]],
});
await test('bob ne voit pas alice dans ses demandes envoyées', {
  as: bob,
  path: '/friendships/pending',
  status: 200,
  checks: (list) => [['alice absente', () => !has(list, alice)]],
});
await test("Une demande en attente n'apparaît pas dans la liste d'amis", {
  as: alice,
  path: '/friendships',
  status: 200,
  checks: (list) => [['bob absent', () => !has(list, bob)]],
});
await test('alice ne peut pas accepter sa propre demande', {
  as: alice,
  method: 'POST',
  path: '/friendships/accept',
  body: { targetId: bob.id },
  status: 403,
});
await test("bob ne peut pas annuler une demande qu'il n'a pas envoyée", {
  as: bob,
  method: 'POST',
  path: '/friendships/cancel',
  body: { targetId: alice.id },
  status: 403,
});
await test('alice annule sa demande', {
  as: alice,
  method: 'POST',
  path: '/friendships/cancel',
  body: { targetId: bob.id },
  status: 200,
});
await test('La demande annulée a disparu chez bob', {
  as: bob,
  path: '/friendships/requests',
  status: 200,
  checks: (list) => [['alice absente', () => !has(list, alice)]],
});
await test('alice renvoie une demande après annulation', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 201,
});
await test('alice ne peut pas refuser sa propre demande', {
  as: alice,
  method: 'POST',
  path: '/friendships/deny',
  body: { targetId: bob.id },
  status: 403,
});
await test('bob refuse la demande', {
  as: bob,
  method: 'POST',
  path: '/friendships/deny',
  body: { targetId: alice.id },
  status: 200,
});
await test('La demande refusée a disparu chez alice', {
  as: alice,
  path: '/friendships/pending',
  status: 200,
  checks: (list) => [['bob absent', () => !has(list, bob)]],
});

// ─── 4 ────────────────────────────────────────────────────────────────────────
section('4. Acceptation — l’amitié crée une conversation partagée');

await test('alice envoie une demande à bob', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 201,
});
await test('bob accepte', {
  as: bob,
  method: 'POST',
  path: '/friendships/accept',
  body: { targetId: alice.id },
  status: 200,
});
const aliceFriends = await test('alice voit bob dans ses amis', {
  as: alice,
  path: '/friendships',
  status: 200,
  checks: (list) => {
    const e = entry(list, bob);
    return [
      ['bob est présent', () => e !== undefined],
      ['status === ACCEPTED', () => e.status === 'ACCEPTED'],
      [
        'isSender === null (sans objet une fois amis)',
        () => e.isSender === null,
      ],
      [
        'conversationId est un entier',
        () => Number.isInteger(e.conversationId),
      ],
    ];
  },
});
const convAB = entry(aliceFriends, bob)?.conversationId;
await test('bob voit alice avec la même conversation', {
  as: bob,
  path: '/friendships',
  status: 200,
  checks: (list) => [
    ['alice est présente', () => has(list, alice)],
    [
      `conversationId === ${convAB}`,
      () => entry(list, alice).conversationId === convAB,
    ],
  ],
});
await test("La demande acceptée n'est plus dans les demandes reçues de bob", {
  as: bob,
  path: '/friendships/requests',
  status: 200,
  checks: (list) => [['alice absente', () => !has(list, alice)]],
});
await test('alice renvoie une demande alors qu’ils sont déjà amis', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 403,
});
await test('bob ré-accepte une demande déjà acceptée', {
  as: bob,
  method: 'POST',
  path: '/friendships/accept',
  body: { targetId: alice.id },
  status: 403,
});

// ─── 5 ────────────────────────────────────────────────────────────────────────
section('5. Auto-acceptation et suppression d’ami');

await test('dave envoie une demande à alice', {
  as: dave,
  method: 'POST',
  path: '/friendships/send',
  body: { username: alice.username },
  status: 201,
});
await test(
  'alice envoie une demande à dave en retour → acceptation automatique',
  {
    as: alice,
    method: 'POST',
    path: '/friendships/send',
    body: { username: dave.username },
    status: 201,
  },
);
await test('alice et dave sont amis, avec une conversation', {
  as: alice,
  path: '/friendships',
  status: 200,
  checks: (list) => [
    ['dave est présent', () => has(list, dave)],
    ['status === ACCEPTED', () => entry(list, dave).status === 'ACCEPTED'],
    [
      'conversationId est un entier',
      () => Number.isInteger(entry(list, dave).conversationId),
    ],
  ],
});
await test("alice ne peut pas retirer carol, qui n'est pas son amie", {
  as: alice,
  method: 'POST',
  path: '/friendships/remove',
  body: { targetId: carol.id },
  status: 403,
});
await test('alice retire dave de ses amis', {
  as: alice,
  method: 'POST',
  path: '/friendships/remove',
  body: { targetId: dave.id },
  status: 200,
});
await test("dave n'est plus dans les amis d'alice", {
  as: alice,
  path: '/friendships',
  status: 200,
  checks: (list) => [['dave absent', () => !has(list, dave)]],
});
await test('alice retire dave une seconde fois', {
  as: alice,
  method: 'POST',
  path: '/friendships/remove',
  body: { targetId: dave.id },
  status: 403,
});

// ─── 6 ────────────────────────────────────────────────────────────────────────
section('6. Blocage d’un ami');

await test('alice bloque bob', {
  as: alice,
  method: 'POST',
  path: '/friendships/block',
  body: { targetId: bob.id },
  status: 201,
});
await test('alice voit bob dans ses bloqués', {
  as: alice,
  path: '/friendships/blocked',
  status: 200,
  checks: (list) => {
    const e = entry(list, bob);
    return [
      ['bob est présent', () => e !== undefined],
      ['status === BLOCKED', () => e.status === 'BLOCKED'],
      ['isSender === true (c’est alice qui bloque)', () => e.isSender === true],
      ['conversationId === null', () => e.conversationId === null],
    ];
  },
});
await test(
  'bob ne voit pas alice dans ses bloqués (il est le bloqué, pas le bloqueur)',
  {
    as: bob,
    path: '/friendships/blocked',
    status: 200,
    checks: (list) => [['alice absente', () => !has(list, alice)]],
  },
);
await test("bob n'est plus dans les amis d'alice", {
  as: alice,
  path: '/friendships',
  status: 200,
  checks: (list) => [['bob absent', () => !has(list, bob)]],
});
await test("alice n'est plus dans les amis de bob", {
  as: bob,
  path: '/friendships',
  status: 200,
  checks: (list) => [['alice absente', () => !has(list, alice)]],
});
await test('bob (bloqué) envoie une demande à alice', {
  as: bob,
  method: 'POST',
  path: '/friendships/send',
  body: { username: alice.username },
  status: 403,
});
await test('alice (bloqueuse) envoie une demande à bob', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 403,
});
await test(
  'bob bloque alice en retour (blocage mutuel impossible, choix assumé §5)',
  {
    as: bob,
    method: 'POST',
    path: '/friendships/block',
    body: { targetId: alice.id },
    status: 403,
  },
);
await test("bob tente de débloquer alice, qu'il n'a pas bloquée", {
  as: bob,
  method: 'POST',
  path: '/friendships/unblock',
  body: { targetId: alice.id },
  status: 403,
});
await test('alice re-bloque bob (idempotent)', {
  as: alice,
  method: 'POST',
  path: '/friendships/block',
  body: { targetId: bob.id },
  status: 201,
});

// ─── 7 ────────────────────────────────────────────────────────────────────────
section('7. Déblocage — la relation repart de zéro');

await test('alice débloque bob', {
  as: alice,
  method: 'POST',
  path: '/friendships/unblock',
  body: { targetId: bob.id },
  status: 200,
});
await test("bob n'est plus dans les bloqués d'alice", {
  as: alice,
  path: '/friendships/blocked',
  status: 200,
  checks: (list) => [['bob absent', () => !has(list, bob)]],
});
await test("Débloquer n'a pas restauré l'amitié", {
  as: alice,
  path: '/friendships',
  status: 200,
  checks: (list) => [['bob absent', () => !has(list, bob)]],
});
await test('alice débloque bob une seconde fois', {
  as: alice,
  method: 'POST',
  path: '/friendships/unblock',
  body: { targetId: bob.id },
  status: 403,
});
await test('alice peut de nouveau envoyer une demande à bob', {
  as: alice,
  method: 'POST',
  path: '/friendships/send',
  body: { username: bob.username },
  status: 201,
});
await test('bob accepte', {
  as: bob,
  method: 'POST',
  path: '/friendships/accept',
  body: { targetId: alice.id },
  status: 200,
});
await test('Nouvelle amitié → nouvelle conversation', {
  as: alice,
  path: '/friendships',
  status: 200,
  checks: (list) => [
    ['bob est présent', () => has(list, bob)],
    [
      `conversationId différent de l'ancienne (${convAB})`,
      () =>
        Number.isInteger(entry(list, bob).conversationId) &&
        entry(list, bob).conversationId !== convAB,
    ],
  ],
});

// ─── 8 ────────────────────────────────────────────────────────────────────────
section('8. Blocage sans amitié préalable');

await test("S'auto-bloquer", {
  as: alice,
  method: 'POST',
  path: '/friendships/block',
  body: { targetId: alice.id },
  status: 403,
});
await test('Bloquer un utilisateur inexistant → 404 attendu', {
  as: alice,
  method: 'POST',
  path: '/friendships/block',
  body: { targetId: NOPE },
  status: 404,
  known: '§2.2',
});
await test('alice bloque carol, sans aucune relation', {
  as: alice,
  method: 'POST',
  path: '/friendships/block',
  body: { targetId: carol.id },
  status: 201,
});
await test('carol apparaît dans les bloqués d’alice', {
  as: alice,
  path: '/friendships/blocked',
  status: 200,
  checks: (list) => [
    ['carol présente', () => has(list, carol)],
    ['isSender === true', () => entry(list, carol).isSender === true],
  ],
});
await test('carol (bloquée) envoie une demande à alice', {
  as: carol,
  method: 'POST',
  path: '/friendships/send',
  body: { username: alice.username },
  status: 403,
});
await test('alice débloque carol', {
  as: alice,
  method: 'POST',
  path: '/friendships/unblock',
  body: { targetId: carol.id },
  status: 200,
});
await test('carol envoie une demande à alice', {
  as: carol,
  method: 'POST',
  path: '/friendships/send',
  body: { username: alice.username },
  status: 201,
});
await test('alice bloque carol alors que sa demande est en attente', {
  as: alice,
  method: 'POST',
  path: '/friendships/block',
  body: { targetId: carol.id },
  status: 201,
});
await test("La demande de carol a disparu des demandes reçues d'alice", {
  as: alice,
  path: '/friendships/requests',
  status: 200,
  checks: (list) => [['carol absente', () => !has(list, carol)]],
});
await test('…et des demandes envoyées de carol', {
  as: carol,
  path: '/friendships/pending',
  status: 200,
  checks: (list) => [['alice absente', () => !has(list, alice)]],
});
await test('…carol est bien dans les bloqués d’alice', {
  as: alice,
  path: '/friendships/blocked',
  status: 200,
  checks: (list) => [['carol présente', () => has(list, carol)]],
});

// ─── Bilan ────────────────────────────────────────────────────────────────────

const ran = stats.pass + stats.fail + stats.known + stats.fixed;
console.log(`\n${c.bold('─'.repeat(78))}`);
console.log(
  `${c.bold(`${ran} tests`)}  ` +
    `${c.green(`${stats.pass} ✔`)}  ${c.red(`${stats.fail} ✘`)}  ` +
    `${c.yellow(`${stats.known} ⚠ connus`)}  ${c.cyan(`${stats.fixed} ★`)}`,
);
if (failures.length) {
  console.log(c.red('\nÉchecs inattendus :'));
  for (const f of failures) console.log(c.red(`  ✘ ${f}`));
}
if (knownFailures.length) {
  console.log(c.yellow('\nProblèmes connus encore présents :'));
  for (const f of knownFailures) console.log(c.yellow(`  ⚠ ${f}`));
}
if (fixedKnown.length) {
  console.log(c.cyan('\nMarqués connus mais qui passent désormais :'));
  for (const f of fixedKnown) console.log(c.cyan(`  ★ ${f}`));
}

process.exit(stats.fail > 0 ? 1 : 0);
