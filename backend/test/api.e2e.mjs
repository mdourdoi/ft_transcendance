/**
 * Tests e2e des routes /friendships et /conversations, et de l'envoi de messages par
 * WebSocket (événement `sendMessage`, diffusion `newMessage`).
 *
 * Tape sur une API qui tourne vraiment (pas de mock) et crée ses propres comptes à
 * chaque exécution, donc relançable à volonté. Les comptes créés restent en base.
 *
 * Lancer (Node >= 22, pour fetch et WebSocket) :
 *   docker compose up -d --build
 *   node backend/test/api.e2e.mjs
 *
 * Variables :
 *   API_URL=https://localhost:8443/api   cible (défaut, à travers le waf)
 *   VERBOSE=1                            affiche le corps de chaque réponse, pas seulement des échecs
 *
 * Légende de la sortie :
 *   ✔ passe   ✘ échoue   ⚠ échoue, problème déjà connu (REVIEW-BACKEND.md)
 *   ★ passe alors qu'il était marqué connu → le problème semble corrigé, retirer `known`
 */

const API = process.env.API_URL ?? 'https://localhost:8443/api';
const VERBOSE = !!process.env.VERBOSE;
const RUN = Date.now().toString(36);
const PASSWORD = 'Passw0rd!';
const NOPE = 2_000_000_000; // id qui n'existe pas mais tient dans un Int Postgres

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

// ─── WebSocket ────────────────────────────────────────────────────────────────

function openSocket(token) {
  const ws = new WebSocket(
    `${API.replace(/^http/, 'ws')}/socket.io/?EIO=4&transport=websocket`,
  );
  const received = [];
  const waiters = [];
  const acks = new Map();
  let nextAck = 0;

  const fire = (event, payload) => {
    const waiter = waiters.find((w) => w.event === event && w.match(payload));
    if (waiter) {
      waiters.splice(waiters.indexOf(waiter), 1);
      waiter.done(payload);
    } else {
      received.push({ event, payload });
    }
  };

  ws.addEventListener('message', ({ data }) => {
    const text = String(data);
    if (text[0] === '0') ws.send(`40${JSON.stringify(token ? { token } : {})}`);
    else if (text === '2') ws.send('3');
    else if (text.startsWith('40')) fire('connect');
    else if (text.startsWith('41') || text.startsWith('44')) fire('disconnect');
    else if (text.startsWith('43')) {
      const [, id, json] = text.match(/^43(\d+)(.*)$/s);
      acks.get(Number(id))?.(JSON.parse(json)[0]);
      acks.delete(Number(id));
    } else if (text.startsWith('42')) {
      const [event, payload] = JSON.parse(text.slice(2));
      fire(event, payload);
    }
  });
  ws.addEventListener('close', () => fire('disconnect'));
  ws.addEventListener('error', () => fire('disconnect'));

  return {
    emit: (event, payload, ms = 5000) =>
      new Promise((resolve, reject) => {
        const id = nextAck++;
        const timer = setTimeout(() => {
          acks.delete(id);
          reject(new Error(`pas de réponse à ${event}`));
        }, ms);
        acks.set(id, (response) => {
          clearTimeout(timer);
          resolve(response);
        });
        ws.send(`42${id}${JSON.stringify([event, payload])}`);
      }),
    heard: (event, match = () => true, ms = 2000) =>
      new Promise((resolve) => {
        const i = received.findIndex(
          (r) => r.event === event && match(r.payload),
        );
        if (i !== -1) return resolve(received.splice(i, 1)[0].payload ?? true);
        const timer = setTimeout(() => {
          waiters.splice(waiters.indexOf(waiter), 1);
          resolve(null);
        }, ms);
        const waiter = {
          event,
          match,
          done: (payload) => {
            clearTimeout(timer);
            resolve(payload ?? true);
          },
        };
        waiters.push(waiter);
      }),
    close: () => ws.close(),
  };
}

async function socketOf(user) {
  if (!user.socket) {
    user.socket = openSocket(user.token);
    if (!(await user.socket.heard('connect')))
      throw new Error(`connexion WebSocket de ${user.name} impossible`);
  }
  return user.socket;
}

async function chatRefused(token) {
  const socket = openSocket(token);
  const refused = (await socket.heard('disconnect')) !== null;
  socket.close();
  return refused;
}

async function testSend(title, { as, body, error, checks, known }) {
  const request = `WS sendMessage · ${as.name} · ${fmt(body, 80)}`;

  let ack;
  try {
    ack = await (await socketOf(as)).emit('sendMessage', body);
  } catch (e) {
    report(
      title,
      request,
      [{ label: 'accusé de réception', ok: false, got: e.message }],
      { known },
    );
    return undefined;
  }

  const results = [
    error
      ? {
          label: `refusé (${error})`,
          ok: ack?.ok === false && ack.error === error,
          got: ack?.ok ? 'accepté' : ack?.error,
        }
      : { label: 'accepté', ok: ack?.ok === true, got: ack?.error },
  ];
  if (!error && ack?.ok && checks) {
    for (const [label, fn] of checks(ack.message)) {
      try {
        results.push({ label, ok: fn() === true });
      } catch (e) {
        results.push({ label, ok: false, got: e.message });
      }
    }
  }

  report(title, request, results, { known, body: ack });
  return ack?.message;
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
    acceptTerms: true,
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
  await fetch(`${API}/`);
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
await test('Lire une conversation sans jeton', {
  path: '/conversations/1/messages',
  status: 401,
});
{
  const noToken = await chatRefused(undefined);
  const forgedToken = await chatRefused(forged.token);
  report('Se connecter au chat (WebSocket) sans jeton valide', null, [
    { label: 'sans jeton → déconnecté', ok: noToken },
    { label: 'jeton forgé → déconnecté', ok: forgedToken },
  ]);
}

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

await test('carol (étrangère) ne peut pas lire la conversation alice↔bob', {
  as: carol,
  path: `/conversations/${convAB}/messages`,
  status: 403,
});
await testSend('carol (étrangère) ne peut pas y écrire', {
  as: carol,
  body: { conversationId: convAB, content: 'intrusion' },
  error: 'FORBIDDEN_CONVERSATION',
});
await test('Conversation inexistante', {
  as: alice,
  path: `/conversations/${NOPE}/messages`,
  status: 403,
});
await test("conversationId non numérique dans l’URL", {
  as: alice,
  path: '/conversations/abc/messages',
  status: 400,
});
await testSend('Écrire dans une conversation inexistante', {
  as: alice,
  body: { conversationId: NOPE, content: 'x' },
  error: 'FORBIDDEN_CONVERSATION',
});
await testSend('conversationId absent', {
  as: alice,
  body: { content: 'x' },
  error: 'INVALID_CONVERSATION_ID',
});
await testSend('conversationId non numérique', {
  as: alice,
  body: { conversationId: 'abc', content: 'x' },
  error: 'INVALID_CONVERSATION_ID',
});
await testSend('content absent', {
  as: alice,
  body: { conversationId: convAB },
  error: 'INVALID_MESSAGE',
});
await testSend('content vide', {
  as: alice,
  body: { conversationId: convAB, content: '' },
  error: 'EMPTY_MESSAGE',
});
await testSend('content de type number', {
  as: alice,
  body: { conversationId: convAB, content: 123 },
  error: 'INVALID_MESSAGE',
});
await testSend('content de 1025 caractères (limite 1024)', {
  as: alice,
  body: { conversationId: convAB, content: 'x'.repeat(1025) },
  error: 'INVALID_MESSAGE',
});
await testSend('content composé uniquement d’espaces', {
  as: alice,
  body: { conversationId: convAB, content: '   ' },
  error: 'EMPTY_MESSAGE',
});
await testSend('content de exactement 1024 caractères', {
  as: alice,
  body: { conversationId: convAB, content: 'x'.repeat(1024) },
});
await socketOf(bob);
await socketOf(carol);
const hello = await testSend('alice envoie un message', {
  as: alice,
  body: { conversationId: convAB, content: '  Salut bob  ' },
  checks: (m) => [
    ['id est une string', () => typeof m.id === 'string'],
    ['content sans les espaces autour', () => m.content === 'Salut bob'],
    [
      'createdAt est une date valide',
      () => !Number.isNaN(Date.parse(m.createdAt)),
    ],
    ['sender.id === alice', () => m.sender.id === alice.id],
    ['sender.username === alice', () => m.sender.username === alice.username],
  ],
});
{
  const isHello = (m) => m?.id === hello?.id;
  const toBob = await bob.socket.heard('newMessage', isHello);
  const toAlice = await alice.socket.heard('newMessage', isHello);
  const toCarol = await carol.socket.heard('newMessage', isHello, 300);
  report(
    'Le message est diffusé en direct aux membres de la conversation',
    null,
    [
      { label: 'bob reçoit newMessage', ok: toBob !== null },
      { label: 'même contenu', ok: toBob?.content === 'Salut bob' },
      { label: 'alice le reçoit aussi (autres onglets)', ok: toAlice !== null },
      { label: 'carol (étrangère) ne reçoit rien', ok: toCarol === null },
    ],
  );
}
await test('bob reçoit le message en dernière position', {
  as: bob,
  path: `/conversations/${convAB}/messages`,
  status: 200,
  checks: (page) => {
    const last = page.items.at(-1);
    return [
      ['dernier message === "Salut bob"', () => last.content === 'Salut bob'],
      ['envoyé par alice', () => last.sender.id === alice.id],
    ];
  },
});

// ─── 7 ────────────────────────────────────────────────────────────────────────
section('7. Messages — pagination par curseur');

const before = await call(
  alice,
  'GET',
  `/conversations/${convAB}/messages?take=100`,
);
const initial = before.body?.items?.length ?? 0;
{
  const socket = await socketOf(bob);
  const bad = [];
  for (let i = 1; i <= 25; i++) {
    const ack = await socket.emit('sendMessage', {
      conversationId: convAB,
      content: `page-${String(i).padStart(2, '0')}`,
    });
    if (!ack?.ok) bad.push(ack?.error);
  }
  report(
    `bob envoie 25 messages d’affilée (${initial} déjà présents)`,
    `WS sendMessage · bob · ×25`,
    [{ label: '25 × accepté', ok: bad.length === 0, got: bad.join(',') }],
  );
}
const total = initial + 25;

const page1 = await test('Page 1 sans curseur (take par défaut = 20)', {
  as: alice,
  path: `/conversations/${convAB}/messages`,
  status: 200,
  checks: (p) => [
    ['20 messages', () => p.items.length === 20],
    ['hasMore === true', () => p.hasMore === true],
    [
      'nextCursor === id du plus ancien de la page (items[0])',
      () => p.nextCursor === p.items[0].id,
    ],
    ['ordre chronologique croissant', () => chronological(p.items)],
    [
      'le dernier est le plus récent (page-25)',
      () => p.items.at(-1).content === 'page-25',
    ],
  ],
});
const page2 = await test('Page 2 avec le curseur de la page 1', {
  as: alice,
  path: `/conversations/${convAB}/messages?cursor=${page1?.nextCursor}`,
  status: 200,
  checks: (p) => [
    [`${total - 20} messages restants`, () => p.items.length === total - 20],
    ['hasMore === false', () => p.hasMore === false],
    ['nextCursor === null', () => p.nextCursor === null],
    ['ordre chronologique croissant', () => chronological(p.items)],
    [
      'aucun doublon avec la page 1',
      () => !p.items.some((m) => ids(page1).includes(m.id)),
    ],
    [
      'tous plus anciens que la page 1',
      () =>
        new Date(p.items.at(-1).createdAt) <=
        new Date(page1.items[0].createdAt),
    ],
  ],
});
{
  const all = [...ids(page2), ...ids(page1)];
  report('Pages 1 + 2 couvrent toute la conversation', null, [
    {
      label: `${total} messages au total`,
      ok: all.length === total,
      got: all.length,
    },
    { label: 'tous distincts', ok: new Set(all).size === all.length },
  ]);
}
await test('take=5', {
  as: alice,
  path: `/conversations/${convAB}/messages?take=5`,
  status: 200,
  checks: (p) => [
    ['5 messages', () => p.items.length === 5],
    ['hasMore === true', () => p.hasMore === true],
  ],
});
await test('take=0 est ramené à 1', {
  as: alice,
  path: `/conversations/${convAB}/messages?take=0`,
  status: 200,
  checks: (p) => [['1 message', () => p.items.length === 1]],
});
await test('take=-5 est ramené à 1', {
  as: alice,
  path: `/conversations/${convAB}/messages?take=-5`,
  status: 200,
  checks: (p) => [['1 message', () => p.items.length === 1]],
});
await test('take=1000 est plafonné à 100', {
  as: alice,
  path: `/conversations/${convAB}/messages?take=1000`,
  status: 200,
  checks: (p) => [
    [
      `${Math.min(total, 100)} messages`,
      () => p.items.length === Math.min(total, 100),
    ],
    ['hasMore cohérent', () => p.hasMore === total > 100],
  ],
});
// Le ValidationPipe global (transform: true) convertit `take` via `+value` AVANT les pipes
// du paramètre : 'abc' → NaN, que DefaultValuePipe remplace par 20 ; '' → 0, ramené à 1.
// ParseIntPipe ne voit donc jamais la chaîne d’origine.
await test('take=abc → silencieusement remplacé par 20 (pas de 400)', {
  as: alice,
  path: `/conversations/${convAB}/messages?take=abc`,
  status: 200,
  checks: (p) => [['20 messages', () => p.items.length === 20]],
});
await test('take= (vide) → converti en 0 puis ramené à 1', {
  as: alice,
  path: `/conversations/${convAB}/messages?take=`,
  status: 200,
  checks: (p) => [['1 message', () => p.items.length === 1]],
});
await test('take=12.7 → refusé par ParseIntPipe (incohérent avec take=abc)', {
  as: alice,
  path: `/conversations/${convAB}/messages?take=12.7`,
  status: 400,
});
await test('Curseur inexistant → retombe sur la page 1', {
  as: alice,
  path: `/conversations/${convAB}/messages?cursor=nexistepas`,
  status: 200,
  checks: (p) => [
    ['mêmes messages que la page 1', () => sameIds(ids(p), ids(page1))],
  ],
});

// Curseur venant d’une autre conversation : il faut une seconde conversation avec un message.
await call(dave, 'POST', '/friendships/send', { username: bob.username });
await call(bob, 'POST', '/friendships/accept', { targetId: dave.id });
const bobFriends = await call(bob, 'GET', '/friendships');
const convBD = entry(bobFriends.body, dave)?.conversationId;
const foreign = await (
  await socketOf(dave)
).emit('sendMessage', { conversationId: convBD, content: 'ailleurs' });
report(
  'Préparation : bob↔dave amis, dave écrit dans leur conversation',
  `conversation ${convBD}, message ${foreign?.message?.id}`,
  [
    { label: 'conversation créée', ok: Number.isInteger(convBD), got: convBD },
    { label: 'message créé', ok: foreign?.ok === true, got: foreign?.error },
  ],
);
await test("Curseur d’une autre conversation → ignoré, retombe sur la page 1", {
  as: bob,
  path: `/conversations/${convAB}/messages?cursor=${foreign?.message?.id}`,
  status: 200,
  checks: (p) => [
    ['mêmes messages que la page 1', () => sameIds(ids(p), ids(page1))],
  ],
});

// ─── 8 ────────────────────────────────────────────────────────────────────────
section('8. Blocage d’un ami — le bloqué ne doit plus pouvoir écrire');

await testSend('Avant blocage : bob peut écrire à alice', {
  as: bob,
  body: { conversationId: convAB, content: 'encore là' },
});
await test('alice bloque bob', {
  as: alice,
  method: 'POST',
  path: '/friendships/block',
  body: { targetId: bob.id },
  status: 201,
});
await testSend('bob (bloqué) tente d’écrire → refusé', {
  as: bob,
  body: { conversationId: convAB, content: 'tu me lis ?' },
  error: 'FORBIDDEN_CONVERSATION',
});
await test('bob (bloqué) tente de lire → refusé', {
  as: bob,
  path: `/conversations/${convAB}/messages`,
  status: 403,
});
await test(
  "alice n’a plus accès non plus (historique supprimé, choix assumé §5)",
  {
    as: alice,
    path: `/conversations/${convAB}/messages`,
    status: 403,
  },
);
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
