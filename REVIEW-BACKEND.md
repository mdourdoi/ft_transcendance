# Review backend — reliquat (modules `messages` & `friendships`)

> **Pour l'agent qui reprend ce fichier :** c'est le compte-rendu de 4 tours de review sur la
> branche `feat/friendships-system`. Tout ce qui était **bloquant est corrigé** — l'image Docker
> se construit. Ce qui suit est le reliquat, plus les décisions déjà tranchées à ne pas
> re-soulever. Commence par la section « Contexte » puis attaque par ordre.
>
> Dernière mise à jour : 2026-09-16.

---

## Contexte — état vérifié

- Branche `feat/friendships-system`, 9 fichiers modifiés non commités.
- `docker build ./backend` **passe** (vérifié : `npm install` → `prisma generate` → `nest build`).
- `npx tsc --noEmit` ne remonte **aucune** erreur imputable au code (voir « Env local » plus bas
  pour les 3 erreurs fantômes).
- **Suite e2e disponible** : `node backend/test/api.e2e.mjs` (Node ≥ 18, stack lancée).
  105 tests sur toutes les routes des deux modules. Dernier run : 101 ✔, 1 ✘ (§2.5),
  3 ⚠ connus (§2.2 ×2, §3.7). Le scénario du §1 y est couvert (sections 4, 8 et 9 du script).

Corrections déjà validées sur les 4 tours (ne pas re-signaler) :
`exports: [MessagesService]` • `conversation?.id || null` + DTO nullable • garde `cursor &&` sur
le `findUnique` • condition de validation du curseur remise à l'endroit • curseur scopé à
`conversationId` • `ParseIntPipe` + clamp `Math.min(Math.max(take,1),100)` •
`orderBy: [{createdAt:'desc'},{id:'desc'}]` • `deleteConversationForFriendship(friendshipId)` •
`isSender` renseigné pour `PENDING` et `BLOCKED` • `users.add()` dans la dédup •
`TinyUserDto.id` • `conversationId` pris depuis l'URL et retiré du body • cascades Prisma.

---

## 1. Scénario de bout en bout — ✅ vérifié par la suite e2e

Passe intégralement (le bloqué reçoit bien un 403). Gardé ici pour référence ; c'est
automatisé dans `backend/test/api.e2e.mjs`.

```
docker compose up -d --build
# puis, avec deux comptes A et B :
A → POST /friendships/send    {targetId: B}
B → GET  /friendships/requests        → doit lister A, isSender=false, conversationId=null
B → POST /friendships/accept  {targetId: A}
B → GET  /friendships                 → conversationId NON null
A → POST /conversations/:id/send      → 201
B → GET  /conversations/:id/messages  → voit le message
A → POST /friendships/block   {targetId: B}
B → POST /conversations/:id/send      → doit être 403
```

À vérifier aussi au démarrage : `Nest application successfully started` dans les logs
(c'est ce qui valide la résolution de `MessagesService` dans `FriendshipsService`).

---

## 2. Correctness — pas bloquant mais réel

### 2.1 Ordre des opérations dans `blockUser`
`backend/src/friendships/friendships.service.ts:150-163`

`updateMany` (→ `BLOCKED`) s'exécute **avant** `deleteConversationForFriendship`. Sans
transaction (choix assumé), si la suppression échoue on obtient `BLOCKED` avec une conversation
vivante : c'est le trou de sécurité « le bloqué peut encore écrire », et il devient **permanent**
car aucun chemin ne repasse supprimer.

**Fix :** inverser les deux appels. Un échec laisse alors au pire une conversation supprimée sans
blocage appliqué — récupérable en réessayant.

### 2.2 `targetId` inexistant → 500
`friendships.service.ts:89` (`sendRequest`) et `:142` (`blockUser`)

Le DTO ne valide que `@IsNumber @IsPositive`. Rien ne vérifie l'existence de la cible :
`prisma.friendship.create({ receiverId: 99999 })` part en violation de clé étrangère **P2003**
non catchée → 500 au lieu de 404.

**Fix :** `user.findUnique` avant le `create` → `NotFoundException(ErrorCode.USER_NOT_FOUND)`,
ou catcher P2003. Deviendra visible dès que l'endpoint de recherche d'utilisateur existera.

### 2.3 `createConversationForFriendship` non idempotente
`backend/src/messages/messages.service.ts:114`

`create` sec sur `friendshipId` qui est `@unique` → P2002 si jamais rappelée. Aucun chemin
actuel ne le fait (`acceptRequest` exige `PENDING`, `sendRequest` exige `not_friend_with`), mais
c'est fragile.

Conséquence liée, `friendships.service.ts:174-182` : `startFriendship_` n'est pas atomique. Si
`updateFriendship_` passe (statut `ACCEPTED`) et que la création de conversation échoue,
on obtient deux amis sans conversation, **irrécupérable** — `acceptRequest` refusera désormais
(plus `PENDING`).

**Fix :** `upsert` au lieu de `create`, sur la conversation et sur les `conversationAccess`
(clé composite `conversationId_userId`). Le retry devient inoffensif, sans transaction.

```ts
await this.prisma.conversation.upsert({
  where: { friendshipId }, create: { friendshipId }, update: {},
});
```

### 2.5 `targetId` décimal → contourne l'interdiction de s'ajouter soi-même
Les 7 DTO de `backend/src/friendships/dto/` · trouvé par la suite e2e

Les DTO utilisent `@IsNumber()`, qui accepte les décimaux. `POST /friendships/send
{"targetId": 1.5}` envoyé par l'utilisateur 1 passe le test `userId === dto.targetId`
(`1 !== 1.5`), puis Prisma tronque à `1` à l'insertion → **ligne `Friendship` 1→1 `PENDING`
créée en base** (constaté). L'utilisateur se retrouve dans ses propres demandes envoyées.

**Fix :** `@IsInt()` à la place de `@IsNumber({ allowNaN: false })` dans les 7 DTO.

### 2.6 `?take=abc` renvoie 20 messages au lieu d'un 400
`backend/src/messages/messages.controller.ts:41` · trouvé par la suite e2e

Le `ValidationPipe` global (`transform: true`) convertit le paramètre typé `number` via
`+value` **avant** les pipes du paramètre. `'abc'` devient `NaN`, que `DefaultValuePipe`
remplace par 20 ; `''` devient `0`, ramené à 1 par le clamp. `ParseIntPipe` ne voit jamais la
chaîne d'origine. Incohérence : `?take=12.7` donne bien un 400.

Pas de crash, pas de fuite : c'est un choix de contrat. Pour un vrai 400, typer le paramètre
`take: string` (le `ValidationPipe` ne convertit plus) et laisser `ParseIntPipe` faire son
travail.

### 2.4 Code d'erreur inadapté
`messages.service.ts:112` — `NotFoundException(ErrorCode.FORBIDDEN_CONVERSATION)` alors que le
cas est « friendship introuvable », pas un problème de droits.

---

## 3. Mineurs reportés (review #2, à traiter à froid)

### 3.1 Les `@Expose()` ne servent à rien
Aucun `ClassSerializerInterceptor` n'est enregistré (ni dans `main.ts`, ni par contrôleur). Les
décorateurs `class-transformer` ne sont lus que par `plainToInstance` — donc les DTO sont de la
documentation de types, ce qui part au client est l'objet brut via `JSON.stringify`.

Risque : le jour où quelqu'un écrit `return user` avec une entité Prisma, `passwordHash` part au
client et rien ne l'arrête.

Deux sorties cohérentes, **choisir l'une** :
- **(a) activer** `app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))`
  — mais attention, avec `excludeExtraneousValues` il faut de **vraies instances**. Or c'est
  mélangé aujourd'hui : `getMessages` fait `new MessageDto(…)` mais retourne un littéral
  `{items, nextCursor, hasMore}`, `sendMessage` retourne un littéral, `getFriendships` fait
  `res.push({…})`. Activer en l'état viderait ces réponses.
- **(b) assumer** : passer les DTO de sortie en `interface` TypeScript, retirer les décorateurs.
  Zéro coût runtime, zéro illusion. Recommandé pour la taille du projet.

### 3.2 `avatarUrl` — trois formats différents selon l'endpoint
`User.avatarUrl` stocke un **nom de fichier** (cf. `users.service.updateAvatar`), servi sous
`/avatars` par `ServeStaticModule`.

- `friendships.service.ts:62`, `messages.service.ts:56` et `:99` → toujours `DEFAULT_AVATAR_URL`,
  le champ réel est ignoré ;
- `messages.service.ts:39` → `select: { id: true, username: true }`, `avatarUrl` n'est même pas
  chargé ;
- `users.service.me()` → renvoie `row.avatarUrl` **brut**, donc le nom de fichier sans préfixe.

**Fix :** un helper unique appelé partout, `me()` compris :
```ts
const toAvatarUrl = (f: string | null) => f ? `/avatars/${f}` : DEFAULT_AVATAR_URL;
```

⚠️ `DEFAULT_AVATAR_URL` (`backend/src/constants.ts:2`) est une URL Discord **signée qui expire**
(`?ex=…&is=…&hm=…`). Elle cassera toute seule. Mettre un `default.png` local et servir
`/avatars/default.png`.

### 3.3 `getFriendships` charge des hashes bcrypt pour rien
`friendships.service.ts:41-45` — `include: { sender: true, receiver: true }` charge l'entité
`User` complète (`email`, `passwordHash`) pour deux users par friendship, alors que seuls `id` et
`username` sont utilisés.

**Fix :** `select: { id: true, username: true, avatarUrl: true }`. Au-delà de la perf, c'est un
garde-fou : on ne peut pas leaker ce qui n'a pas été chargé. Même remarque pour
`include: { conversation: true }` sur les statuts `PENDING`/`BLOCKED`, où il n'y a jamais rien à
joindre.

### 3.4 `mustBe_` : `default: return true` est un fail-**open**
`friendships.service.ts:291-292` — le `default` ne `break` pas, il `return true` : il sort de la
fonction en annonçant « toutes les conditions sont remplies », ignorant celles déjà évaluées et
celles qui suivent.

Inatteignable aujourd'hui grâce à l'union de types. Mais si quelqu'un ajoute `'muted_by'` au type
sans écrire le `case`, alors `mustBe_(A, B, ['blocked_by', 'muted_by'])` renvoie `true` et le
`blocked_by` passe à la trappe silencieusement.

**Fix :** `return false`, ou mieux `throw new Error(\`unhandled check: ${s}\`)`.

### 3.5 `mustBe_` : bruit et requêtes redondantes
- `(friendship && X) || false` est une conversion en booléen déguisée → `!!friendship && X`.
  Le `|| false` final est un no-op dans les 5 `case`.
- `not_blocked_by` : la 3ᵉ clause n'est atteinte que si la 2ᵉ est fausse, donc
  `friendship.status === BLOCKED` y est toujours vrai — tautologie. Se réduit à
  `!f || f.status !== BLOCKED || f.senderId !== B`.
- **Le plus gênant :** `mustBe_` refait un `findFirst` à chaque appel. `sendRequest` l'appelle
  deux fois **plus** `getFriendship_` → **3 requêtes identiques** sur la même ligne. Charger la
  friendship une fois et la passer en paramètre divise par trois.

### 3.6 Codes HTTP
`friendships.controller.ts:180` — `POST /friendships/block` renvoie `201 CREATED` alors que la
branche `else` est un `updateMany` : rien n'est créé, body vide. `200 OK` est plus juste.

`friendships.controller.ts:105` — `POST /friendships/send` renvoie 201 y compris quand il
**accepte** une demande existante (auto-accept, `friendships.service.ts:99-100`). Le front n'a
aucun moyen de distinguer « demande envoyée » de « vous êtes maintenant amis » : même code, même
body vide. Renvoyer le statut résultant serait utile.

### 3.7 `@IsNotEmpty()` laisse passer les espaces
`content = "   "` passe (`IsNotEmpty` teste seulement `!== ''`). Le `ValidationPipe` global a
déjà `transform: true`, donc :
```ts
@Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
@IsString() @IsNotEmpty() @MaxLength(1024)
```
L'ordre compte : `@Transform` s'applique avant la validation.

Notes : `MaxLength(1024)` compte des **UTF-16 code units** (un emoji en consomme 2). Le contenu
est stocké brut — correct côté API, mais le front **doit** échapper à l'affichage
(`textContent`, jamais `innerHTML`), sinon XSS stocké.

### 3.8 Double source de vérité sur l'accès
`Conversation.friendshipId` et `Conversation.accesses` décrivent tous deux « qui a le droit d'être
là », et rien ne les synchronise — c'était la cause racine du trou de blocage.

Symptôme : `removeAccess` a fini par être supprimée du service faute de cas d'usage, alors que
c'était exactement la méthode pour le blocage non destructif.

Deux designs cohérents, **en choisir un** :
- `ConversationAccess` seule vérité → maintenir les lignes à chaque transition de statut. Plus de
  code, mais généralise aux futurs salons de groupe.
- La friendship seule vérité → `hasAccess_` joint `Conversation → Friendship` et vérifie
  `status === ACCEPTED`. `ConversationAccess` devient supprimable. Plus simple, mais enferme dans
  le 1-à-1.

### 3.9 Divers
- `friendships.service.ts:58` — `?? null` plutôt que `|| null`. Inoffensif ici (un
  `autoincrement()` Postgres démarre à 1), mais `??` dit précisément ce qu'on veut.
- `friendships.service.ts:163` — `currentFs?.id` : le `?.` est inutile, TypeScript sait que
  `currentFs` est non-null dans ce `else`.
- `backend/package.json` — `"start:prod": "node dist/main"` alors que `rootDir: "."` produit
  `dist/src/main.js`. Le Dockerfile a le bon chemin, seul le lancement local hors Docker casse.
- `prisma/user.prisma` — `ConversationAccess.conversation` est `Conversation?` avec un
  `conversationId Int` requis. `prisma validate` l'accepte, mais le client généré sort un
  `| null` pour une FK qui ne peut jamais l'être → des `?.` inutiles à traîner.
- `?take=` (paramètre présent mais vide) → 1 message, pas un 400 (voir §2.6 pour le mécanisme).

---

## 4. Env local — à régler pour ne plus être aveugle

`npm ci` n'a pas pris. `node_modules` diverge du lock (qui est **sain**, les 3 bonnes versions y
sont) :

```
@nestjs/serve-static   ABSENT      (lock: 4.0.2)
@types/multer          ABSENT      (lock: 2.2.0)
file-type              20.4.1      (lock: 16.5.4 — la v20 a renommé fromFile → fileTypeFromFile)
```

Conséquence : `tsc` et VSCode affichent en permanence 3 erreurs qui n'existent pas dans le
conteneur (`app.module.ts:3`, `users.controller.ts:64`, `users.service.ts:69`). C'est ce qui a
fait rater un vrai `TS2353` au tour #3.

**Fix :** `rm -rf node_modules && npm ci`, en regardant la sortie.

---

## 5. Décisions déjà prises — ne pas re-soulever

| Sujet | Décision |
|---|---|
| Transactions / `$transaction` | Écartées volontairement : pas de scalabilité visée. Les TOCTOU de `sendRequest`/`blockUser` sont assumés. |
| Blocage mutuel impossible | « C'est normal ». Le modèle à une seule ligne `Friendship` par paire ne permet pas à A de bloquer B si B a bloqué A. |
| Bloquer détruit l'historique des deux côtés | Assumé. La cascade `Conversation → Message` fait que A perd aussi ses propres messages. |
| `removeFriend` détruit l'historique | Assumé. Se réajouter repart d'une conversation vide. |
| `unblockUser` supprime la relation entière | Signalé, non contesté. Débloquer ne restaure pas l'amitié antérieure. |
| `@@unique([senderId, receiverId])` directionnel | Les doublons `(A,B)` + `(B,A)` restent possibles sous concurrence. Accepté avec l'absence de transactions. |
| WebSockets / temps réel | Plus tard. Le chat est en polling pour l'instant. |
| Endpoint de recherche d'utilisateur | Plus tard. C'est lui qui rendra le point 2.2 visible. |

---

## 6. Ordre suggéré

1. `rm -rf node_modules && npm ci` (§4) — pour travailler avec un `tsc` fiable.
2. `@IsInt()` dans les DTO friendships (§2.5) — une ligne par fichier, vrai bug.
   Après chaque correction : `node backend/test/api.e2e.mjs`.
3. Inverser l'ordre dans `blockUser` (§2.1) — 30 secondes, évite un état irrécupérable.
4. `upsert` dans `createConversationForFriendship` (§2.3) — même raison.
5. Existence de `targetId` (§2.2).
6. Trancher §3.1 (sérialisation) et §3.8 (source de vérité) — ce sont des choix d'architecture,
   les autres mineurs en découlent en partie.
7. Le reste des mineurs au fil de l'eau.
