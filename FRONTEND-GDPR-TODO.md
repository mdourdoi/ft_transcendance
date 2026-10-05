# Frontend GDPR — Liste des tâches

## 1. Routes à ajouter dans `App.svelte`

| Route | Composant | Auth requise | Description |
|---|---|---|---|
| `/privacy` | `Privacy.svelte` | Oui (JWT) | Page "Mes données" (export + suppression) |
| `/account/delete` | `AccountDelete.svelte` | Non | Confirmation suppression via `?token=...` depuis l'email |
| `/privacy-policy` | `PrivacyPolicy.svelte` | Non | Politique de confidentialité |
| `/terms` | `Terms.svelte` | Non | Conditions d'utilisation |
| `/verify-email` | `VerifyEmail.svelte` | Non | Confirmation email via `?token=...` depuis l'email |

## 2. Page "Mes données" (`Privacy.svelte`)

- Vérifier que l'utilisateur est connecté, sinon afficher un message
- **Bouton "Télécharger mes données"** → `GET /users/me/export` (JWT), déclenche le téléchargement du JSON + un email de confirmation est envoyé par le backend
- **Bouton "Supprimer mon compte"** → afficher un warning + confirmation → `POST /users/me/delete-request` (JWT, 204) → le backend envoie un email avec un lien
- Gérer les statuts : succès export, lien envoyé, rate limit (60s), erreur

## 3. Page de confirmation de suppression (`AccountDelete.svelte`)

- Lire le `?token=` dans l'URL
- Appeler `POST /users/delete-confirm` avec `{ token }` (pas de JWT, 204)
- Afficher "Compte supprimé" en cas de succès
- Afficher "Lien invalide ou expiré" en cas d'erreur

## 4. Page de confirmation d'email (`VerifyEmail.svelte`)

- Lire le `?token=` dans l'URL
- Appeler `POST /users/verify-email/confirm` avec `{ token }` (pas de JWT, 204)
- Afficher succès ou erreur (token invalide/expiré)

## 5. Politique de confidentialité (`PrivacyPolicy.svelte`)

Sections à afficher (texte statique i18n) :

- **Données collectées** — email, pseudo, avatar, hash mdp, secret 2FA chiffré, amitiés, messages, matchs, classement
- **Pourquoi** — uniquement pour faire tourner le jeu, pas de vente/pub
- **Durée de conservation** — tant que le compte existe, suppression immédiate et irréversible
- **Vos droits** — export JSON + suppression depuis la page "Mes données", correction depuis le profil
- **Contact** — onitama.transcendance@gmail.com

## 6. Conditions d'utilisation (`Terms.svelte`)

Sections (texte statique i18n) :

- Le service
- Votre compte
- Fair-play
- Fin de compte
- Responsabilité

## 7. Checkbox de consentement dans le formulaire d'inscription

- Ajouter un checkbox : "J'ai lu et j'accepte la Politique de confidentialité et les Conditions d'utilisation" avec liens vers `/privacy-policy` et `/terms`
- Désactiver le bouton d'inscription tant que non coché
- Envoyer `acceptTerms: true` dans le body du `POST /auth/register`
- Le backend refuse avec `CONSENT_REQUIRED` si absent ou `false`

## 8. Clés i18n à ajouter dans `en.json` et `fr.json`

```
REGISTER.ACCEPT_TERMS

PRIVACY.TITLE, PRIVACY.SUBTITLE, PRIVACY.LOGIN_REQUIRED,
PRIVACY.EXPORT, PRIVACY.DELETE, PRIVACY.DELETE_WARNING,
PRIVACY.DELETE_CONFIRM, PRIVACY.CANCEL,
PRIVACY.STATUS_EXPORTED, PRIVACY.STATUS_SENT,
PRIVACY.STATUS_RATE, PRIVACY.STATUS_ERROR

ACCOUNT_DELETE.TITLE, ACCOUNT_DELETE.DONE, ACCOUNT_DELETE.INVALID

POLICY.TITLE, POLICY.DATA_TITLE, POLICY.DATA_BODY,
POLICY.PURPOSE_TITLE, POLICY.PURPOSE_BODY,
POLICY.RETENTION_TITLE, POLICY.RETENTION_BODY,
POLICY.RIGHTS_TITLE, POLICY.RIGHTS_BODY,
POLICY.CONTACT_TITLE, POLICY.CONTACT_BODY

TERMS.TITLE, TERMS.SERVICE_TITLE, TERMS.SERVICE_BODY,
TERMS.ACCOUNT_TITLE, TERMS.ACCOUNT_BODY,
TERMS.CONDUCT_TITLE, TERMS.CONDUCT_BODY,
TERMS.TERMINATION_TITLE, TERMS.TERMINATION_BODY,
TERMS.LIABILITY_TITLE, TERMS.LIABILITY_BODY

LEGAL.UPDATED
```

## 9. Liens de navigation

- Ajouter des liens vers `/privacy-policy` et `/terms` dans le footer ou la page d'accueil
- Ajouter un lien vers `/privacy` ("Mes données") dans les paramètres utilisateur
