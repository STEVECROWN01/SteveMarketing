# Compte rendu — Refonte UI (session du 13/11/2026)

## Contexte

Demandes de l'éditeur appliquées sur le dépôt local `STEVECROWN01/SteveMarketing`
(branche `main`, commit `2b0f29f`). Le zip / patch livrés incluent AUSSI les
changements des commits précédents jamais poussés (`Voir Nos Travaux`, Title Case,
assets officiels) : le site en ligne est encore à `bace6b6`, tout est donc couvert.

## Changements appliqués

1. **Header — « Accueil » supprimé** de la pilule de navigation bureau et du menu
   plein écran (le logo ramène à l'accueil ; le pied de page conserve le lien).
2. **Hero — hook supprimé** (« Votre entreprise mérite mieux… ») et espace
   resserré entre le titre et la description ; portrait agrandi
   (mobile 29svh/270px, bureau 64svh/570px).
3. **Hero — mentions supprimées** : « Copywriting inclus » et « Optimisation SEO
   de base incluse » (elles restent présentées dans la section « Avantages inclus »).
4. **Paragraphes resserrés partout** : nouveau composant `RichText` (espacement
   `mt-3` au lieu d'une ligne vide complète) — Problème, Remise en question,
   Transformation, Solution, À propos, FAQ finale, Avantages inclus (accueil,
   page Services, page À propos).
5. **2e image de « VOTRE ACTIVITÉ MÉRITE… » agrandie** : 52 % → 58 % de largeur.
6. **Boutons unifiés** :
   - **Blancs = #ffffff exact**, même style/hover que le bouton hero
     « Réserver Un Appel (30 Min) » : texte #1c1c1c, bordure #e4e4e4 → beige au
     survol, remplissage progressif #e4e4e4, légère élévation, flèche qui glisse
     (« Démarrer Un Projet » du header et du menu inclus).
   - **Noirs = #000000 exact**, même style/hover que l'ancien bouton hero
     « Audit gratuit de votre site actuel » : texte blanc, bordure claire
     discrète, remplissage progressif #3c3c3c au survol, élévation, flèche
     (variantes `dark` et `ghostLight` fusionnées vers ce style : « Voir Nos
     Travaux », « Demander Un Devis », « Parlons De Votre Projet », « Réserver
     Un Appel » des cartes beiges, bouton du menu plein écran…).
   - Les boutons beiges (#c9baac) et les boutons « contour » sur fond clair
     restent inchangés (ni blancs ni noirs).
7. **Menu plein écran entièrement visible sans scroll** : hauteur 100svh, contenu
   compact adaptatif (vérifié 390×844 et 320×568 : `scrollHeight` =
   `clientHeight`), + **croix de fermeture dédiée** en haut à droite du menu
   (la pastille hamburger devient aussi une croix).
8. **Section PROJETS RÉALISÉS refondue** façon sheragency.com « Websites We
   Created » : titre + double CTA (noir « Demander Un Devis », contour
   « Voir La Page Réalisations »), grille de grandes cartes — capture du site,
   nom, catégorie, bouton blanc « Voir Le Projet ». **Au clic → nouvelle page de
   présentation du projet** `#/projet/<id>` (comme les case studies de la
   référence) : en-tête projet + « Voir Le Site » (lien externe réel) +
   « Demander Un Devis », section « LE SITE » (aperçus bureau + mobile),
   « Autres Projets », appel à l'action final. La page Réalisations utilise la
   même présentation en grille.

## Vérifications effectuées (build de production + navigateur)

- Build Next.js : `✓ Compiled successfully` (10/10 pages) ; ESLint des fichiers
  modifiés : 0 erreur.
- Hero : exactement 844px = viewport en mobile 390×844 ; 900px = viewport en
  bureau 1440×900 → **100 % visible sans scroll**.
- Menu plein écran mobile : liens (Services, Réalisations, À propos, Contact),
  2 CTA, email/LinkedIn/WhatsApp et croix de fermeture tous visibles sans
  défilement ; fermeture par la croix dédiée testée (OK).
- Navigation projet : clic carte → `#/projet/mrsteveenglish`,
  `#/projet/prelaunch` (titre dynamique « MR STEVE ENGLISH — Projet web |
  Stevens Akpovi ») — OK.
- Couleurs mesurées dans le navigateur : « Démarrer Un Projet » =
  `rgb(255,255,255)` ; « Demander Un Devis Personnalisé » / « Réserver Un
  Appel » (cartes beiges) = `rgb(0,0,0)` — conformes.
- Meta : favicon `/assets/favicon.png`, `og:image /assets/OG.png` présents.

## Déploiement (à faire depuis GitHub)

1. Ouvrir https://github.com/STEVECROWN01/SteveMarketing (connecté au compte
   STEVECROWN01).
2. Bouton **Add file → Upload files**.
3. Extraire `maj-refonte-ui.zip` localement, puis glisser-déposer le **dossier
   `src`** entier dans la zone d'upload (les 24 fichiers remplacent ceux aux
   mêmes chemins ; `src/components/pages/ProjectPage.tsx` est un nouveau
   fichier). Ne pas téléverser le `.zip` lui-même.
4. Message de commit proposé : « Refonte UI : Accueil retiré, hero allégé,
   boutons unifiés blancs/noirs, menu plein écran sans scroll, projets façon
   case studies » puis **Commit changes**.
5. Vercel redéploie automatiquement (quelques minutes) :
   https://stevensakpovi.vercel.app.
6. Vérifs post-déploiement : le header sans « Accueil », le hero sans la phrase
   beige ni les deux mentions, les cartes PROJETS RÉALISÉS cliquables
   (`#/projet/mrsteveenglish`…), les boutons noirs bien #000000.

Alternative ligne de commande (si un terminal git est disponible) :

```bash
git apply maj-refonte-ui.patch   # depuis la racine du dépôt, à bace6b6
git add -A && git commit -m "Refonte UI façon sheragency"
git push origin main             # déploiement Vercel automatique
```

## Fichiers modifiés (24)

`src/app/layout.tsx`, `src/app/page.tsx`,
`src/components/forms/LeadForm.tsx`, `src/components/home/FaqFinal.tsx`,
`src/components/home/Hero.tsx`, `src/components/home/MethodAbout.tsx`,
`src/components/home/ProblemQuestioning.tsx`,
`src/components/home/ServicesSections.tsx`,
`src/components/home/TransformationSolution.tsx`,
`src/components/home/WorksSection.tsx`, `src/components/layout/Footer.tsx`,
`src/components/layout/Header.tsx`,
`src/components/marketing/Marketing.tsx`,
`src/components/marketing/ProjectCard.tsx`, `src/components/pages/AboutPage.tsx`,
`src/components/pages/AdminPage.tsx`, `src/components/pages/ContactPage.tsx`,
`src/components/pages/PortfolioPage.tsx`,
`src/components/pages/ProjectPage.tsx` (nouveau),
`src/components/pages/ServicesPage.tsx`, `src/components/router-context.tsx`,
`src/content/site-content.ts`, `src/lib/email.ts`, `src/lib/site.ts`.
