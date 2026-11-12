# DÉPLOIEMENT PRODUCTION — VERCEL

Guide officiel de mise en ligne du site de **Stevens Akpovi** à partir du dépôt
GitHub `STEVECROWN01/SteveMarketing` (branche `main`).

---

## 1. Prérequis

- Le dépôt GitHub contient l'intégralité du projet (code, assets optimisés WebP,
  sources PNG préservées dans `public/assets/sources/`).
- Compte Vercel : https://vercel.com/signup (le forfait Hobby gratuit suffit).
- Le site est une application **Next.js 16** (App Router) — détectée
  automatiquement par Vercel, aucune configuration serveur n'est nécessaire.

## 2. Import du projet dans Vercel

1. Vercel → **Add New… → Project**.
2. Importer le dépôt **SteveMarketing** (branche `main`).
3. Framework Preset : **Next.js** (détection automatique).
4. Build Command : laisser par défaut — le script `vercel-build` du fichier
   `package.json` (`prisma generate && next build`) est exécuté par Vercel et
   garantit la génération du client Prisma avant la compilation.
5. **Définir les variables d'environnement (voir §3) avant de cliquer sur
   Deploy** — ou les ajouter juste après puis faire **Redeploy**.

## 3. Variables d'environnement de production

À définir dans *Project Settings → Environment Variables* (environnement
*Production*) :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Oui | URL canonique finale (canonical, sitemap, Open Graph, JSON-LD). **Format obligatoire : `https://…`** (protocole inclus, sans guillemets ni espaces). Ex. : `https://stevensakpovi.vercel.app`. Depuis la correction du 12/11, une valeur mal saisie ne casse plus le build : protocole manquant ajouté automatiquement, guillemets/espaces retirés, valeur invalide remplacée par le défaut. |
| `RESEND_API_KEY` | Recommandée | Active la notification des demandes à `stevensakpovi@gmail.com` **et** l'accusé de réception au visiteur. Clé gratuite sur https://resend.com — domaine d'envoi à vérifier dans Resend, l'expéditeur par défaut `onboarding@resend.dev` permet d'envoyer uniquement vers l'adresse du compte Resend : créer le compte avec `stevensakpovi@gmail.com`. |
| `ADMIN_PASSWORD` | Oui | Mot de passe de l'espace administrateur `#/admin`. Générer une valeur forte (fournie dans le fichier de configuration remis, ou `openssl rand -base64 18`). |
| `ADMIN_SESSION_SECRET` | Oui | Secret de signature des sessions admin (HMAC-SHA256). Générer via `openssl rand -hex 32`. |
| `NEXT_PUBLIC_CALENDLY_URL` | Non | Rendez-vous de 30 minutes confirmé par l'éditeur — défaut : `https://calendly.com/stevensakpovi/30min` (l'URL `/20min` du cahier des charges renvoie 404). |
| `NEXT_PUBLIC_LEGAL_REGISTRATION` | Non | Identifiant professionnel de l'éditeur (IFU/RCCM) affiché dans les mentions légales dès qu'il est renseigné. |
| `DATABASE_URL` | Non | Uniquement si une base managée est branchée (voir §5). Sans base, le site fonctionne et les demandes sont relayées par email. |

Le modèle commenté complet figure dans `.env.example`.

## 4. Comportement des demandes (devis / audit) en production

- **Avec `RESEND_API_KEY`** : chaque demande déclenche la notification à
  `stevensakpovi@gmail.com` et l'accusé de réception au visiteur — c'est le
  canal d'enregistrement fiable sur Vercel.
- **Base de données** : Vercel n'offre pas de système de fichiers persistant
  pour SQLite. Sans base managée, l'API consigne l'échec d'écriture en journal
  et la notification email fait foi ; si ni base ni email ne sont disponibles,
  le formulaire refuse honnêtement la soumission avec un message clair au
  visiteur (aucune demande n'est jamais silencieusement perdue).
- **Espace admin `#/admin`** : accessible avec `ADMIN_PASSWORD` ; la
  consultation des demandes nécessite une base persistante (§5) — sans base,
  un message explicite s'affiche.

## 5. Option recommandée : persistance des demandes (base managée)

Pour retrouver les demandes dans l'espace administrateur (statuts, export
CSV), brancher une base PostgreSQL managée :

1. Vercel → **Storage** → créer une base **Postgres** (Neon, forfait gratuit
   disponible) et l'attacher au projet → la variable `DATABASE_URL` est
   injectée automatiquement.
2. Dans `prisma/schema.prisma`, remplacer la ligne `provider = "sqlite"` par
   `provider = "postgresql"`, puis committer.
3. Créer le schéma dans la base :
   `DATABASE_URL="<connexion Neon>" npx prisma db push` (en local ou via le
   CLI Vercel).
4. Redéployer. L'espace administrateur liste alors toutes les demandes,
   avec filtres, statuts et export CSV.

## 6. Après le déploiement — liste de vérification

- [ ] Page d'accueil : hero, portrait, CTA « Réserver un appel stratégique ».
- [ ] Popup Calendly : vraies disponibilités affichées (aucune simulation),
      mention « Gratuit, 30 minutes et sans engagement ».
- [ ] Soumettre une **vraie demande de test** (devis) → vérifier la réception
      de l'email de notification + l'accusé de réception au visiteur, puis
      supprimer la demande de test.
- [ ] Espace `#/admin` : connexion, déconnexion.
- [ ] Liens LinkedIn / WhatsApp / email fonctionnels.
- [ ] `sitemap.xml` et `robots.txt` accessibles (HTTP 200).
- [ ] Console du navigateur : aucune erreur.
- [ ] Après ajout d'un éventuel domaine personnalisé : mettre à jour
      `NEXT_PUBLIC_SITE_URL` puis **Redeploy** (canonical / OG / sitemap).

## 6 bis. Incident résolu — 404 après déploiement réussi (12 novembre 2026)

**Symptôme** : déploiement « Ready » et domaine valide (`stevensakpovi.vercel.app`), mais toutes les URL répondaient 404 — la page « The page could not be found / NOT_FOUND » de l'application elle-même.

**Cause** : `output: "standalone"` dans `next.config.ts`. Ce mode est destiné à l'auto-hébergement (prévisualisation locale) et est incompatible avec le runtime Vercel : le build réussit mais les routes ne sont pas enregistrées côté plateforme.

**Correctif** : `output: process.env.VERCEL ? undefined : "standalone"` — standalone reste actif pour l'auto-hébergement local, désactivé automatiquement sur Vercel (la variable `VERCEL` est positionnée par la plateforme au build). Le domaine de production réel est désormais le défaut du code : `https://stevensakpovi.vercel.app`.

## 7. Mises à jour ultérieures

Pousser sur la branche `main` du dépôt GitHub : Vercel reconstruit et
redéploie automatiquement (intégration continue native).

## 8. Sécurité — rappels

- Aucune clé secrète n'est committée (`.env*` ignoré, seul `.env.example`
  documenté est versionné).
- Les secrets ne vivent que dans les variables d'environnement Vercel.
- Les jetons d'accès GitHub partagés en clair (PAT) doivent être **révoqués
  après usage** : GitHub → Settings → Developer settings → Personal access
  tokens.
- En cas de changement de `ADMIN_PASSWORD`, invalider les sessions en
  changeant également `ADMIN_SESSION_SECRET`.
