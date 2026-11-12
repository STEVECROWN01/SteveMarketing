# COMPTE RENDU DE TESTS — SITE WEB STEVENS AKPOVI

**Date des tests :** 12 novembre 2026
**Environnement :** Next.js 16 (App Router, Turbopack, port 3000) — vérification navigateur automatisée (Chromium) + analyse visuelle assistée.

---

## 1. PAGES ET NAVIGATION

| Test | Résultat |
|---|---|
| Accueil (`#/accueil`) — 13 sections du copywriting intégrées | ✅ Rendu conforme, zéro erreur console |
| Services (`#/services`) | ✅ Titre dynamique + contenu complet |
| Réalisations (`#/realisations`) — 3 projets réels | ✅ Mockups desktop + mobile chargés |
| À propos (`#/a-propos`) | ✅ Portrait + texte intégral + FAQ extraits |
| Contact (`#/contact`) + ancres `#/contact/devis` et `#/contact/audit` | ✅ Ancrage fonctionnel aux deux formulaires |
| Mentions légales (`#/mentions-legales`) | ✅ |
| Espace admin (`#/admin`) — non listé publiquement | ✅ Connexion, consultation, statuts, export |
| Navigation retour / suivant du navigateur | ✅ |
| Menu mobile (ouverture, navigation, fermeture, déblocage du scroll) | ✅ |
| Titres de page dynamiques par page virtuelle | ✅ |

*Bug détecté et corrigé pendant les tests : correspondance kebab/camelCase entre les fragments d'URL et les clés de page (`#/a-propos`, `#/mentions-legales`) — corrigé par table de correspondance explicite.*

## 2. CTA ET CALENDLY

| Test | Résultat |
|---|---|
| Popup Calendly (bouton d'en-tête, CTA hero, CTA tertiaires, menu mobile) | ✅ Ouverture, fermeture (Échap / bouton / clic extérieur) |
| Embed Calendly inline sur la page Contact | ✅ Iframe officielle chargée |
| Vraies disponibilités (widget officiel Calendly — aucune simulation) | ✅ « Select a Date & Time » affiché |
| Mention « Gratuit, 30 minutes et sans engagement » partout | ✅ |
| Lien CTA → pages demandées (devis, audit) | ✅ |

**Note Calendly :** l'URL `calendly.com/stevensakpovi/20min` indiquée dans le cahier des charges renvoie **404**. L'événement réel du compte est `calendly.com/stevensakpovi/30min` — l'éditeur a confirmé que le rendez-vous stratégique dure **30 minutes** : toutes les mentions du site (hero, CTA, contact, FAQ, emails) ont été corrigées de 20 à 30 minutes. L'URL est modifiable via la variable d'environnement `NEXT_PUBLIC_CALENDLY_URL`.

## 3. FORMULAIRES ET DEMANDES

| Test | Résultat |
|---|---|
| Demande de devis — validation frontend (champs requis, email, URL) | ✅ Messages d'erreur ciblés |
| Demande de devis — soumission → API → enregistrement SQLite (Prisma) | ✅ Vérifié en base |
| Demande d'audit — site requis (superRefine) | ✅ |
| Demande d'audit — enregistrement complet (nom, email, URL, message) | ✅ Vérifié en base |
| Confirmation après enregistrement effectif (panneau + toast) | ✅ |
| Accusé de réception au visiteur (UI + email si configuré) | ✅ UI vérifiée |
| Validation backend (Zod) — rejet des charges invalides (422) | ✅ |
| Protection anti-spam : honeypot + piège temporel (> 3 s) + limite de débit (6/heure/IP) | ✅ Implémenté et actif |
| Gestion des erreurs (500, 429, réseau) | ✅ Messages clairs |
| Données de test | ✅ Purgeées — base livrée vide |

**Notifications email :** le module serveur (Resend, REST) est intégralement codé côté backend (`src/lib/email.ts`) — notification à `stevensakpovi@gmail.com` + accusé au visiteur. Il s'active dès l'ajout de la variable d'environnement `RESEND_API_KEY` (aucune clé n'étant disponible dans l'environnement de démonstration, l'envoi réel ne peut y être exécuté ; les demandes sont alors enregistrées de manière fiable en base et marquées `emailSent=false`). Aucun secret n'est exposé côté client.

## 4. IMAGES ET COMPORTEMENT MONOCHROME

| Test | Résultat |
|---|---|
| Images en noir et blanc par défaut sur desktop | ✅ Vérifié (filtre calculé `grayscale(1)` + contrôle visuel) |
| Retour progressif aux couleurs au survol + zoom léger (1.035) | ✅ Vérifié (filtre calculé `grayscale(0)`) |
| Survol au niveau de la carte (toute la carte du projet réagit) | ✅ |
| Icône directionnelle au survol des visuels cliquables | ✅ |
| Couleur naturelle directe sur mobile/tactile (390 px) | ✅ Vérifié (filtre calculé `grayscale(0)` + contrôle visuel) |
| Aucun étirement (ratios fixes, `object-cover`) | ✅ |
| Portrait du hero NON cliquable | ✅ |
| Lazy loading + dimensions explicites (zéro CLS) | ✅ |

## 5. RÉALISATIONS

| Test | Résultat |
|---|---|
| 3 projets réels uniquement (MR STEVE ENGLISH, pré-lancement, AFRIBAYIT) | ✅ |
| Cartes entièrement cliquables → nouvel onglet (`target="_blank" rel="noopener"`) | ✅ |
| Mockups navigateur + smartphone avec captures réelles des sites | ✅ |
| Aucun témoignage, résultat ou donnée inventée | ✅ |

## 6. ANIMATIONS

| Test | Résultat |
|---|---|
| Fade-in / translations au scroll, descendant et remontant (`once: false`) | ✅ |
| Révélation des titres mot à mot | ✅ |
| Transitions de page fluides (AnimatePresence) | ✅ |
| Flèches animées, remplissage progressif des boutons | ✅ |
| Pas de scroll-jacking | ✅ (défilement natif) |
| `prefers-reduced-motion` : animations désactivées (framer-motion + CSS) | ✅ |

## 7. CONTACT

| Test | Résultat |
|---|---|
| Email `stevensakpovi@gmail.com` (mailto) | ✅ |
| LinkedIn (profil réel) | ✅ |
| WhatsApp : lien `wa.me` fonctionnel, **numéro jamais affiché en clair** (vérifié par recherche globale dans le code) | ✅ |

## 8. ESPACE ADMINISTRATEUR

| Test | Résultat |
|---|---|
| Accès protégé (`#/admin`, absent de la navigation publique) | ✅ |
| Connexion par mot de passe (comparaison à temps constant) | ✅ |
| Session par cookie HttpOnly signé HMAC-SHA256 (8 h) | ✅ |
| API `/api/admin/*` → 401 sans session valide | ✅ |
| Consultation des demandes + filtres (statut, type) | ✅ |
| Changement de statut persisté en base | ✅ |
| Export CSV (UTF-8 BOM, points-virgules) | ✅ |
| Déconnexion | ✅ |

**Périmètre assumé (conformément au cahier des charges, section 15) :** fonctionnalités opérationnelles = consultation des demandes, gestion des prospects (statuts), export. La génération de devis/factures et le suivi détaillé des projets relèvent de l'architecture prévue (modèle extensible) et ne sont **pas** présentés comme opérationnels — l'interface le mentionne explicitement.

## 9. SEO ET PERFORMANCES

| Test | Résultat |
|---|---|
| Titles + meta descriptions par page | ✅ |
| Canonical, Open Graph, Twitter Card, `og-image.jpg` (1200×630) | ✅ Servie (HTTP 200) |
| `sitemap.xml` (6 URLs) | ✅ HTTP 200 |
| `robots.txt` (`/api/` bloqué) | ✅ HTTP 200 — conflit avec le fichier statique du scaffold détecté et résolu |
| Données structurées JSON-LD (Person + ProfessionalService + WebSite) | ✅ |
| Hiérarchie H1 unique / H2 / H3 | ✅ |
| Images WebP optimisées (sources PNG préservées) | ✅ |
| Fonts Sora + Inter via `next/font` (swap, fallbacks) | ✅ |
| URLs propres par fragment (`#/services`, …) | ✅ |

## 10. RESPONSIVE

| Test | Résultat |
|---|---|
| Desktop large 1440 px | ✅ |
| Desktop standard | ✅ |
| Mobile 390 px (hero, portrait couleur, CTA ≥ 44 px, menu) | ✅ |
| Empilement des colonnes, mockups adaptés, textes lisibles | ✅ |

## 11. ERREURS ET SÉCURITÉ

| Test | Résultat |
|---|---|
| Erreurs console sur toutes les pages | ✅ Aucune (une erreur provenait du script tiers Calendly heurtant une classe CSS homonyme — résolue en renommant la classe du point de montage) |
| Validation backend systématique (Zod) | ✅ |
| Secrets uniquement côté serveur (`RESEND_API_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`) | ✅ |
| Cookies HttpOnly + SameSite | ✅ |

---

## CONFIGURATION AU DÉPLOIEMENT (variables d'environnement)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL canonique du site (metadata, OG, sitemap) |
| `NEXT_PUBLIC_CALENDLY_URL` | URL de l'événement Calendly (défaut : événement réel 30 min du compte) |
| `RESEND_API_KEY` | Active l'envoi des notifications et accusés de réception |
| `ADMIN_PASSWORD` | Mot de passe de l'espace administrateur (défaut à changer : `stevens-admin-2026`) |
| `ADMIN_SESSION_SECRET` | Secret de signature des sessions admin |
| `NEXT_PUBLIC_LEGAL_REGISTRATION` | Identifiant professionnel de l'éditeur (IFU/RCCM), affiché dans les mentions légales dès qu'il est renseigné |
| `DATABASE_URL` | Base de données (SQLite local ; base managée en production — voir DEPLOIEMENT.md §5) |

Le modèle commenté complet est versionné dans `.env.example` ; les valeurs de production fortes (mot de passe admin, secret de session) sont remises hors dépôt dans `variables-production.txt`. Guide complet : `DEPLOIEMENT.md`.

## MENTIONS LÉGALES — COMPLÉTION PRODUCTION

- **Hébergeur** : complété — Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (coordonnées publiques vérifiées sur vercel.com), la plateforme de déploiement retenue étant Vercel.
- **Identifiant professionnel de l'éditeur** : la mention n'était pas fournie — aucune donnée inventée. Le site affiche un libellé honnête (« activité exercée à titre indépendant — identifiant professionnel non communiqué par l'éditeur »), remplaçable sans toucher au code via `NEXT_PUBLIC_LEGAL_REGISTRATION` (ex. numéro IFU/RCCM).
- Vérification navigateur sur build de production : plus aucun marqueur « à compléter » ne subsiste, les deux mentions s'affichent.

## TESTS COMPLÉMENTAIRES DE MISE EN PRODUCTION

Exécutés après les corrections de déploiement (build de production standalone, serveur exact de ce que Vercel exécutera) :

| Test | Résultat |
|---|---|
| Build de production (`vercel-build` = `prisma generate && next build`) | ✅ Compilation sans erreur, 10 pages statiques générées |
| Schéma Prisma piloté par `env("DATABASE_URL")` (corrige la résolution relative SQLite en bundle standalone) | ✅ Le client honore désormais la variable d'environnement |
| Client Prisma paresseux (proxy) — erreur de base levée dans les try/catch des routes, jamais au chargement | ✅ |
| POST `/api/leads` avec base disponible → HTTP 201, demande persistée (vérifiée en base) puis purge de test | ✅ |
| POST `/api/leads` **sans base ni service email** (premier déploiement serverless nu) → refus honnête HTTP 500 avec message clair — aucune demande silencieusement perdue | ✅ |
| `GET /api/admin/leads` authentifié sans base → HTTP 503 JSON explicite (renvoi vers DEPLOIEMENT.md) | ✅ |
| `GET /api/admin/leads` sans session valide → HTTP 401 (l'authentification précède l'accès base) | ✅ |
| Connexion admin (`/api/admin/login`) sur les deux profils d'environnement | ✅ |
| Console navigateur sur la page mentions légales (build production) | ✅ Aucune erreur |
| Server dev relancé après corrections — page d'accueil HTTP 200 | ✅ |

## INCIDENT DE DÉPLOIEMENT RÉSOLU — VARIABLES D'ENVIRONNEMENT (12 novembre 2026)

**Symptôme** : sur Vercel, trois déploiements consécutifs en « Error » (32-56 s) après l'ajout des variables d'environnement — alors que le même code (commit `f70373f`) avait déployé en « Ready » juste avant.

**Cause (reproduite en local à l'identique)** : `NEXT_PUBLIC_SITE_URL` malformé — typiquement saisi sans protocole (`stevemarketing.vercel.app` au lieu de `https://stevemarketing.vercel.app`), ou avec guillemets/espaces parasites. La ligne `metadataBase: new URL(SITE.url)` de `layout.tsx` s'exécute **au build** (génération des pages statiques) : `TypeError: Invalid URL` → échec du build. Vérifications croisées : `prisma generate` est insensible au contenu de `DATABASE_URL` (testé avec URL Postgres), les variables serveur (`ADMIN_*`, `RESEND_API_KEY`) n'interviennent qu'à l'exécution.

**Correctif (définitif)** : normalisation défensive des URL d'environnement dans `src/lib/site.ts` — protocole manquant ajouté automatiquement (`https://`), guillemets et espaces retirés, valeur vide ou invalide remplacée par le défaut ; idem pour `NEXT_PUBLIC_CALENDLY_URL` ; `NEXT_PUBLIC_LEGAL_REGISTRATION` vide ou blanc replie sur le libellé honnête par défaut. `new URL()` ne peut plus jamais lever au build, quelle que soit la saisie.

**Tests du correctif** : build complet avec (1) URL sans protocole, (2) URL entre guillemets, (3) valeur aberrante — les trois cas, auparavant fatals, compilent et génèrent les 10 pages ; l'URL normalisée est vérifiée injectée dans le sitemap et les pages statiques.

## INCIDENT RÉSOLU — 404 EN PRODUCTION MALGRÉ DÉPLOIEMENT « READY » (12 novembre 2026)

**Symptôme** : déploiements Vercel « Ready », domaine `stevensakpovi.vercel.app` en « Valid Configuration », mais toutes les URL du site répondaient 404 — page « The page could not be found / NOT_FOUND » émise par la plateforme Vercel (prouvé par sondage HTTP direct).

**Diagnostic (sondage du domaine en production)** : les fichiers statiques du dossier `public/` répondent 200 (`/favicon.svg`, `/og-image.jpg`) tandis que toutes les routes produites par le build Next.js répondent 404 (`/`, `/robots.txt`, `/sitemap.xml`, `/api/leads`) — signature d'un déploiement 100 % statique.

**Cause racine** : le projet Vercel avait été importé alors que le dépôt GitHub ne contenait que les images (`public/assets`, sans `package.json`) — Vercel l'a classé « Other / statique » et ne publie que le dossier `public/`, ignorant la sortie Next.js. Les builds exécutaient bien `next build` (d'où les statuts « Ready » et les erreurs du même jour sur l'URL invalide), mais sa sortie n'était jamais servie comme application.

**Correctif (côté tableau de bord Vercel, sans code)** : Settings → Build & Development Settings → Framework Preset **Next.js** (au lieu de « Other »), Output Directory **vide**, puis Redeploy. Le durcissement `output: standalone` conditionné à la variable `VERCEL` est conservé comme sécurité complémentaire (standalone réservé à l'auto-hébergement local — pas la cause de l'incident).

**Vérifications attendues après correctif** : `/` affiche le site ; `/robots.txt` et `/sitemap.xml` répondent 200 ; `POST /api/leads` répond 422 sur charge invalide (route API enregistrée).

**Résolution confirmée en production (12/11)** : sondage direct de `https://stevensakpovi.vercel.app` — `/` → 200 (hero « Je crée des sites web qui génèrent des ventes » rendu), `/robots.txt` → 200, `/sitemap.xml` → 200 avec URLs canoniques correctes, `POST /api/leads` (charge vide) → 422 (route API et validation serveur opérationnelles), `/favicon.svg` → 200. Le premier Redeploy effectué après le changement de preset n'avait pas reconstruit (option « existing Build Artifacts ») ; un déploiement complet déclenché par push sur `main` a confirmé le fonctionnement.

## INCIDENT DE DÉPLOIEMENT RÉSOLU — VARIABLES D'ENVIRONNEMENT (12 novembre 2026)

**Symptôme** : sur Vercel, trois déploiements consécutifs en « Error » (32-56 s) après l'ajout des variables d'environnement — alors que le même code (commit `f70373f`) avait déployé en « Ready » juste avant.

**Cause (reproduite en local à l'identique)** : `NEXT_PUBLIC_SITE_URL` malformé — typiquement saisi sans protocole (`stevemarketing.vercel.app` au lieu de `https://stevemarketing.vercel.app`), ou avec guillemets/espaces parasites. La ligne `metadataBase: new URL(SITE.url)` de `layout.tsx` s'exécute **au build** (génération des pages statiques) : `TypeError: Invalid URL` → échec du build. Vérifications croisées : `prisma generate` est insensible au contenu de `DATABASE_URL` (testé avec URL Postgres), les variables serveur (`ADMIN_*`, `RESEND_API_KEY`) n'interviennent qu'à l'exécution.

**Correctif (définitif)** : normalisation défensive des URL d'environnement dans `src/lib/site.ts` — protocole manquant ajouté automatiquement (`https://`), guillemets et espaces retirés, valeur vide ou invalide remplacée par le défaut ; idem pour `NEXT_PUBLIC_CALENDLY_URL` ; `NEXT_PUBLIC_LEGAL_REGISTRATION` vide ou blanc replie sur le libellé honnête par défaut. `new URL()` ne peut plus jamais lever au build, quelle que soit la saisie.

**Tests du correctif** : build complet avec (1) URL sans protocole, (2) URL entre guillemets, (3) valeur aberrante — les trois cas, auparavant fatals, compilent et génèrent les 10 pages ; l'URL normalisée est vérifiée injectée dans le sitemap et les pages statiques.

## INCIDENT RÉSOLU — 404 EN PRODUCTION MALGRÉ DÉPLOIEMENT « READY » (12 novembre 2026)

**Symptôme** : déploiement Vercel « Ready » (commit `4480e65`), domaine `stevensakpovi.vercel.app` en « Valid Configuration », mais la racine du site répondait 404 — avec le corps « The page could not be found / NOT_FOUND », soit la page d'absence de l'application elle-même (prouvé par sondage HTTP direct du domaine).

**Cause** : `output: "standalone"` dans `next.config.ts` — mode conçu pour l'auto-hébergement, incompatible avec le runtime Vercel (build réussi, routes non enregistrées). Ce réglage servait exclusivement à la prévisualisation sur la plateforme de développement.

**Correctif** : `output: process.env.VERCEL ? undefined : "standalone"` — la variable `VERCEL`, positionnée automatiquement par Vercel au build, désactive standalone sur Vercel et le conserve pour l'auto-hébergement. Le domaine de production réel (`https://stevensakpovi.vercel.app`) devient le défaut du code. Vérifications locales : build sans `VERCEL` → standalone produit, serveur autonome HTTP 200 avec hero complet ; build avec `VERCEL=1` → standalone absent (sortie standard attendue par Vercel).

## AJUSTEMENT HERO MOBILE (12 novembre 2026) — demande de l'éditeur

**Demande** : sur mobile, placer le portrait entre le hook et la description.

**Mise en œuvre** : le hero est restructuré en trois blocs dans la grille — bloc texte haut (eyebrow + H1 + hook), bloc visuel (portrait + mockups), bloc texte bas (description + CTA + réassurance + badges). Placement explicite par `lg:col-start/lg:row-start` : sur desktop, la composition deux colonnes est inchangée (texte à gauche empilé, visuel à droite sur les deux lignes) ; sur mobile (ordre naturel), l'image s'insère entre le hook (« Votre entreprise mérite mieux… ») et la description (« Vous n'avez pas encore de site web ? … Je conçois des sites web professionnels… »), suivie des CTA.

**Vérifications (navigateur, viewport 390×844)** : positions mesurées — H1 187px < hook 330px < portrait 461px < description 1060px < CTA 1282px (ordre exact demandé) ; inspection visuelle de la capture : aucun chevauchement ni coupure anormale, décor de fond intact. Desktop 1440px : titre à gauche (x=136), portrait à droite (x=797), CTA sous le titre dans la colonne gauche — composition inchangée. Console : aucune erreur.

## CORRECTION POST-LIVRAISON — DURÉE DU RENDEZ-VOUS (12 novembre 2026)

L'éditeur a confirmé que le rendez-vous stratégique Calendly dure **30 minutes** (et non 20 minutes comme rédigé dans le cahier des charges). Correction appliquée partout : hero et CTA « Réserver un appel stratégique (30 min) », éléments de réassurance (« 30 minutes · Gratuit · Sans engagement · À distance »), popup Calendly et aria-labels, page Contact (titre de section et inline), FAQ finale, page À propos, meta description, accusés de réception email, `.env.example` et guides de déploiement. Vérification par recherche globale : plus aucune mention « 20 min » dans le code livré.

## ÉLÉMENTS RESTANT À L'INITIATIVE DE L'ÉDITEUR

- Renseigner `NEXT_PUBLIC_LEGAL_REGISTRATION` (numéro IFU/RCCM) dès qu'il est disponible — sans code à modifier.
- Créer la clé Resend (`RESEND_API_KEY`) depuis un compte créé avec stevensakpovi@gmail.com.
- (Recommandé) Brancher une base PostgreSQL managée pour la persistance des demandes dans l'espace admin — procédure pas à pas dans DEPLOIEMENT.md §5.

## DÉCISIONS DOCUMENTÉES

1. **Palette :** empruntée exclusivement à sheragency.com (extraite du code réel : `#1c1c1c`, `#070707`, `#232323`, `#2f2f2f`, `#3c3c3c`, `#525252`, `#f5f5f5`, `#ffffff`, `#e4e4e4`, `#c8c8c8`, `#d9d9d9`, `#555555`, accent signature `#c9baac`, erreur `#ea384c`). Aucun autre élément de Sher Agency n'est copié (composition, hiérarchie et interactions propres).
2. **Architecture :** pages virtuelles dans la route unique visible de la plateforme (`#/services`, `#/realisations`…), avec titres dynamiques, ancrage de sections et transitions. Le modèle de déploiement Next.js permet une migration directe vers des routes physiques si nécessaire.
3. **Calendly :** URL réelle fonctionnelle utilisée (durée 30 minutes) — voir note section 2.
