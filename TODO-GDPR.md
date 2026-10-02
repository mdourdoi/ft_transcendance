# Roadmap GDPR

Module mineur « GDPR compliance features » : demande des données, suppression avec confirmation, export lisible, mails de confirmation.

## Déjà en place

- Export JSON : `GET /users/me/export` (profil, amitiés, messages envoyés).
- Suppression avec confirmation par mail : `POST /users/me/delete-request` puis `POST /users/delete-confirm`.
- Mails « lien de suppression » et « compte supprimé ».
- Tests e2e de l'export et de la suppression dans [mail.e2e.mjs](backend/test/mail.e2e.mjs).

## Étape 0 — Décisions à prendre en équipe (bloquant)

- [X] **Matchs à la suppression** : cascade (l'adversaire perd aussi le match de son historique) ou anonymisation (« joueur supprimé »). Recommandation : anonymiser.
Décision : suppression en cascade.
- [X] **Messages à la suppression** : garder la cascade actuelle ou anonymiser l'expéditeur. Recommandation : garder la cascade.
Décision : suppression en cascade.
- [X] **Flux d'export** : téléchargement direct + mail de notification, ou lien envoyé par mail. Recommandation : téléchargement direct + notification.
Décision : téléchargement direct + notification.

## Étape 1 — Backend : export

- [ ] Ajouter les matchs (adversaire, mode, statut, gagnant, dates) et le `rating` dans `exportData` ([users.service.ts](backend/src/users/users.service.ts#L238)).
- [X] Ajouter l'en-tête `Content-Disposition` sur `GET /users/me/export` pour obtenir un fichier nommé.
- [X] Ajouter une méthode de mail « vos données ont été exportées » dans [mail.service.ts](backend/src/mail/mail.service.ts).
- [X] Envoyer ce mail à chaque export, sans bloquer la réponse si l'envoi échoue.
- [ ] Étendre la section 8 de [mail.e2e.mjs](backend/test/mail.e2e.mjs) : présence des matchs, du rating et du mail.

## Étape 2 — Backend : suppression

- [?] Si anonymisation retenue : rendre `playerOneId` / `playerTwoId` nullables avec `SetNull` dans [queue.prisma](backend/prisma/queue.prisma).
- [?] Adapter [matches.service.ts](backend/src/matches/matches.service.ts) aux joueurs nuls (signalement de résultat, calcul du rating).
- [ ] À la confirmation : retirer l'utilisateur de la file Redis (`leaveAllModes`).
- [ ] À la confirmation : déconnecter ses sockets dans [events.gateway.ts](backend/src/events/events.gateway.ts) et [queue.gateway.ts](backend/src/queue/queue.gateway.ts).
- [ ] Vérifier qu'un JWT d'un compte supprimé ne donne plus accès à rien (au minimum un 401/404 propre sur toutes les routes).
- [ ] Ajouter les tests e2e : historique de l'adversaire après suppression, token refusé après suppression.

## Étape 3 — Frontend : prérequis

- [ ] Login et stockage du JWT côté front (absent sur la branche `feat/email-service` ; à vérifier sur les autres branches de l'équipe).
- [ ] Un client API qui ajoute le header `Authorization`.

## Étape 4 — Frontend : pages GDPR

- [ ] Page paramètres / confidentialité avec le bouton « Télécharger mes données ».
- [ ] Bouton « Supprimer mon compte » avec modale d'avertissement, puis message « un mail vous a été envoyé ».
- [ ] Page `/account/delete` : lit le token, affiche l'avertissement, n'appelle `delete-confirm` qu'au clic (pas au chargement : certains clients mail pré-chargent les liens).
- [ ] Gestion des erreurs : token invalide ou expiré, limite d'envoi de mail (429), échec SMTP (503).
- [ ] Après suppression : effacer le JWT et rediriger vers l'accueil.
- [ ] Enregistrer les routes dans [App.svelte](frontend/src/App.svelte).
- [ ] Traductions dans [en.json](frontend/src/lib/i18n/locales/en.json) et [fr.json](frontend/src/lib/i18n/locales/fr.json).

## Étape 5 — Pages légales

- [ ] Page Privacy Policy : données collectées, durée de conservation, droits d'export et de suppression.
- [ ] Page Terms of Service.
- [ ] Liens vers ces pages depuis le pied de page ou l'accueil.

## Étape 6 — Validation

- [ ] Lancer les deux suites e2e sur une base propre.
- [ ] Dérouler la démo complète avec le vrai SMTP : export, mail reçu, demande de suppression, clic sur le lien, confirmation, mail final, login impossible.
- [ ] Vérifier en base qu'il ne reste rien de l'utilisateur (tokens mail, amitiés, messages, fichier avatar).
- [ ] Documenter le module dans le [README.md](README.md).

## Ordre et dépendances

- L'étape 0 bloque l'étape 2 (schéma Prisma).
- L'étape 1 est indépendante et peut démarrer tout de suite.
- L'étape 3 bloque l'étape 4 ; si le login front est fait par quelqu'un d'autre, se synchroniser avant.
- L'étape 5 peut se faire en parallèle de tout le reste.
