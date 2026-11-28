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
| `RESEND_API_KEY` | Recommandée | **Emails des visiteurs uniquement (volet 30, 29/11/2026)** : chaque DEMANDE d'un visiteur du site public (devis, audit, contact) envoie la notification à `stevensakpovi@gmail.com` et l'accusé de réception au visiteur. Les documents, prospects et audits du back-office ne sont PLUS envoyés par email — tout est archivé dans le dépôt GitHub privé. Clé gratuite sur https://resend.com — domaine d'envoi à vérifier dans Resend, l'expéditeur par défaut `onboarding@resend.dev` permet d'envoyer uniquement vers l'adresse du compte Resend : créer le compte avec `stevensakpovi@gmail.com`. |
| `ADMIN_PASSWORD` | Oui | Mot de passe de l'espace administrateur `#/admin`. Générer une valeur forte (fournie dans le fichier de configuration remis, ou `openssl rand -base64 18`). |
| `ADMIN_SESSION_SECRET` | Oui | Secret de signature des sessions admin (HMAC-SHA256). Générer via `openssl rand -hex 32`. |
| `NEXT_PUBLIC_CALENDLY_URL` | Non | Rendez-vous de 30 minutes confirmé par l'éditeur — défaut : `https://calendly.com/stevensakpovi/30min` (l'URL `/20min` du cahier des charges renvoie 404). |
| `NEXT_PUBLIC_LEGAL_REGISTRATION` | Non | Identifiant professionnel de l'éditeur (IFU/RCCM) affiché dans les mentions légales dès qu'il est renseigné. |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Non | **Google Search Console** (volet 8 de l'audit, 19/11/2026). Quand elle est définie, le site rend `<meta name="google-site-verification" content="…">` — sinon aucune balise. Pour obtenir la valeur : https://search.google.com/search-console → *Ajouter une propriété* → **Préfixe d'URL** `https://stevensakpovi.vercel.app` → *Autres méthodes de validation* → **Balise HTML** → copier le contenu de l'attribut `content` (pas la balise entière) → le coller ici → *Redeploy* dans Vercel → revenir dans Search Console et cliquer **Valider**. Permet ensuite de soumettre `sitemap.xml`, suivre l'indexation et les requêtes qui amènent des visiteurs. |
| `NEXT_PUBLIC_GA_ID` | Non | **Google Analytics 4** (volet 8 de l'audit, 19/11/2026). Identifiant de mesure `G-XXXXXXXXXX` (https://analytics.google.com → *Admin* → *Flux de données* → Web). Quand il est défini, les scripts `gtag.js` sont chargés ; sinon le site n'envoie **aucune** requête à Google. Si vous l'activez : pensez à mettre à jour la page `#/mentions-legales` (mesure d'audience) — les mentions actuelles ne décrivent aucun traceur. |
| `DATABASE_URL` | Non | Uniquement si une base managée est branchée (voir §5). Sans base, le site fonctionne et les demandes sont relayées par email. |

Le modèle commenté complet figure dans `.env.example`.

## 3 bis. Back-office — documents commerciaux (volet 14, 24 novembre 2026)

L'espace `#/admin` est un BACK-OFFICE complet : consultation des
demandes, et GÉNÉRATION des documents commerciaux — proposition
commerciale, devis et facture (la facture se génère DEPUIS un devis
enregistré, avec cachet « PAYÉ »). Le système est celui du projet
K.Quotes de l'éditeur : PDF A4 produit par le serveur (Puppeteer),
téléchargement automatique dans le navigateur et archivage (volet 30 :
plus de copie email — la boîte mail ne reçoit plus les documents).

Variables spécifiques (toutes OPTIONNELLES pour la génération) :

| Variable | Rôle | Sans elle |
| --- | --- | --- |
| `GITHUB_DOCS_TOKEN` | Jeton GitHub (portée « repo ») : archivage des documents en JSON dans le dossier `documents/` du DÉPÔT PRIVÉ `STEVECROWN01/SteveMarketing-Documents` — et, depuis le volet 20 : les DEMANDES du site (devis, audits, messages) dans `demandes/`, les devis SIGNÉS téléversés dans `devis-signes/`, les projets du portfolio dans `portfolio/` — et, depuis le volet 29 : les PROSPECTS importés du scraping dans `prospects/` (source de vérité `prospects/prospects.json` + le CLASSEUR EXCEL `prospects/prospects.xlsx`, MIS À JOUR à chaque import — jamais un nouveau fichier) et les AUDITS COMPLETS enregistrés dans `audits/` (un JSON par audit, consultables dans l'historique de l'espace Audit) | La liste et l'archivement des documents existants attendent ; la GÉNÉRATION (PDF, téléchargement) fonctionne déjà ; les espaces Prospects et l'historique des audits signalent que le stockage n'est pas configuré |
| `GITHUB_DOCS_REPO` | Dépôt de stockage (défaut : `STEVECROWN01/SteveMarketing-Documents`) | Valeur par défaut utilisée |
| `GITHUB_DOCS_BRANCH` | Branche (défaut : `main`) | Valeur par défaut utilisée |

Pourquoi GitHub plutôt qu'une base payante (Railway PostgreSQL,
Supabase…) : les documents sont des JSON légers, le dépôt privé
dédié les conserve gratuitement, versionnés, et le back-office les
relit via l'API GitHub — aucune base managée n'est nécessaire. Le
dépôt du site étant PUBLIC, les documents des clients ne peuvent
y figurer : c'est le rôle du dépôt privé dédié (à créer une fois :
`SteveMarketing-Documents`, privé, vide — le dossier `documents/`
y est créé automatiquement au premier enregistrement).

### Obtenir `GITHUB_DOCS_TOKEN` (jeton « fine-grained », 2 minutes)

1. Sur github.com, connecté au compte **STEVECROWN01** : photo de
   profil (haut à droite) → **Settings**.
2. Tout en bas du menu de gauche : **Developer settings**.
3. **Personal access tokens** → **Fine-grained tokens** →
   **Generate new token**.
4. **Token name** : `stevens-documents`. **Expiration** : *Custom*
   → 1 an (ou *No expiration* ; notée pour renouvellement).
5. **Repository access** : **Only select repositories** →
   sélectionner **STEVECROWN01/SteveMarketing-Documents** (et lui
   seul — le jeton ne peut alors toucher AUCUN autre dépôt).
6. **Permissions** → *Repository permissions* → **Contents** :
   **Read and write** (seule permission nécessaire).
7. **Generate token** → COPIER tout de suite la valeur
   (commence par `github_pat_…`) : elle n'est plus affichée ensuite.
8. Dans Vercel : projet **stevensakpovi** → *Settings* →
   *Environment Variables* → clé `GITHUB_DOCS_TOKEN`, valeur du
   jeton, environnement **Production** → *Save*.
9. Deployments → menu **⋯** du dernier déploiement → **Redeploy**
   (les variables ne sont lues qu'au démarrage). L'état du système
   sur `#/admin` confirme alors « stockage configuré ».

`GITHUB_DOCS_REPO` et `GITHUB_DOCS_BRANCH` n'ont pas à être
définies : leurs valeurs par défaut sont déjà celles du dépôt
privé (`STEVECROWN01/SteveMarketing-Documents`, branche `main`).

`ADMIN_SESSION_SECRET` (section 3) est devenu OPTIONNEL : sans
elle, le secret de session est dérivé du mot de passe — la
connexion à l'espace administrateur fonctionne avec le seul
`ADMIN_PASSWORD` défini (correctif de l'incident « espace
administrateur non configuré » du 24/11/2026).

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

**Symptôme** : déploiements « Ready » et domaine valide (`stevensakpovi.vercel.app`), mais toutes les URL du site répondaient 404 — page « The page could not be found / NOT_FOUND » émise par la plateforme Vercel.

**Diagnostic (sondage HTTP direct du domaine)** : les fichiers statiques du dossier `public/` répondent 200 (`/favicon.svg`, `/og-image.jpg`) tandis que toutes les routes produites par le build Next.js répondent 404 (`/`, `/robots.txt`, `/sitemap.xml`, `/api/leads`). Signature d'un déploiement 100 % statique.

**Cause racine** : le projet Vercel a été importé alors que le dépôt GitHub ne contenait que les images (`public/assets`, sans `package.json`) — Vercel l'a donc classé « Other / statique » et ne publie que le dossier `public/`, ignorant la sortie Next.js. Les builds ultérieurs exécutaient bien `next build` (d'où les « Ready » et les erreurs du 12/11 sur l'URL invalide), mais sa sortie n'était jamais servie comme application.

**Correctif (tableau de bord Vercel — aucune modification de code)** :
1. Projet **stevemarketing** → **Settings → Build & Development Settings** ;
2. **Framework Preset : Next.js** (au lieu de « Other ») ;
3. **Output Directory : laisser VIDE** (surtout pas « public ») ;
4. Sauvegarder, puis **Deployments → ⋯ → Redeploy** du dernier déploiement.

**Vérification** : `/` affiche le site, `/robots.txt` et `/sitemap.xml` répondent 200, `POST /api/leads` répond (422 sur charge invalide).

**Résolution confirmée en production (12/11, sondage direct de `https://stevensakpovi.vercel.app`)** : `/` → 200 avec le hero complet ; `/robots.txt` → 200 ; `/sitemap.xml` → 200 (URLs canoniques correctes) ; `POST /api/leads` avec charge vide → 422 (route API active, validation serveur opérationnelle) ; `/favicon.svg` → 200. Note : si un « Redeploy » ne semble rien changer, vérifier qu'il ne s'agit pas de l'option « Redeploy with existing Build Artifacts » (qui ne relance pas le build) — un push sur `main` déclenche toujours un déploiement complet.

**Nota** : le durcissement `output: process.env.VERCEL ? undefined : "standalone"` (standalone réservé à l'auto-hébergement local) est conservé — c'est une sécurité complémentaire, pas la cause de l'incident.

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
