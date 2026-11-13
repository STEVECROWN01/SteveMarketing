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

## Complément (13/11/2026, session suivante) — 5 corrections de l'éditeur

1. **Animations des sections rétablies dans les DEUX sens** : chaque bloc
   se révèle à l'entrée dans le viewport, se masque à la sortie et se
   réanime au retour (montée ET descente). Implémentation IntersectionObserver
   + transitions CSS (remplace les états `whileInView`) : l'opacité suit
   à tout instant l'état réel d'intersection — un texte ne peut plus
   rester bloqué invisible après un défilement rapide. Vérifié par sondes :
   opacité 1 en vue → 0 hors vue → 1 au retour.
2. **Mockups du hero présents sur mobile** (navigateur + smartphone,
   tailles et bords adaptés) — noir et blanc par défaut, couleur
   d'origine au survol/toucher (`forceMono`). Vérifié : grayscale(1) →
   grayscale(0) au survol, sur les deux mockups.
3. **Eyebrow du hero remplacé par la note** : cinq étoiles beige
   (#c9baac), la cinquième à moitié remplie horizontalement, suivie de
   « 4,9/5 ».
4. **Espace titre↔image accru sur mobile** (42 px mesurés) ; hero toujours
   exactement à la hauteur du viewport (844 px mesurés à 390×844, 900 px
   à 1440×900) — 100 % visible sans scroll.
5. **Section PROJETS RÉALISÉS** : bouton « Voir Nos Réalisations »
   (libellé corrigé) ; captures en noir et blanc par défaut sur tous les
   écrans, couleur au survol de la carte (grayscale(0) mesuré).
   Garde-fou global `overflow-x: clip` (html/body) : plus aucun
   débordement horizontal mobile (scrollWidth 390 = viewport).

## Complément (13/11/2026, 3e session) — purge beige + refonte Réalisations

1. **Purge de l'accent beige #c9baac** (demande explicite) : boutons beige →
   blanc #ffffff exact (style « Démarrer Un Projet » : connexion admin,
   soumission formulaires, export CSV, filtres admin, déclencheur Calendly,
   variante « primary » des CTA) ; tous les autres éléments (textes, pastilles,
   bordures, fonds de blocs, icônes, points de séparation, halos, sélection,
   focus, thème Calendly) → #e4e4e4 (couleur de survol du bouton blanc de
   référence). Le fond du bloc « Votre projet peut être notre prochaine
   réalisation. » → #e4e4e4. Seuls les SURVOLS de bordure des boutons blancs
   de référence conservent le beige (« à part ces boutons »). Audit navigateur :
   0 élément beige restant. Focus clavier lisible maintenu sur sections claires
   (contour encre sombre).
2. **Animations exclusivement au scroll-down** : entrée par descente animée
   (700 ms), entrée par remontée INSTANTANÉE (sans rejouer), sortie masquée.
   Vérifié par sondes sur les deux directions.
3. **Titre hero corrigé** : « Je crée des Sites Web Professionnels qui génèrent
   des Ventes. » — seule « qui génèrent des Ventes. » en gras (700), le reste
   en 400 (mesuré mot à mot). Éspace titre↔image mobile accru (50 px), hero
   toujours exactement à la hauteur du viewport (844 px à 390×844).
4. **Header** : logo agrandi (64 px bureau / 40 px mobile, pastilles 100×104),
   favicon régénéré en 512×512, espace à gauche de « Services » = espace entre
   liens (20 px = 20 px mesurés), soulignement actif PLEINE LARGEUR (65,7 px
   ≈ largeur du lien, left 0 — l'ancien bug demi-largeur décalée venait d'un
   conflit de classes left-1/2/w-0 vs left-0/w-full).
5. **Menu plein écran** : croix plus espacée (right-4/top-4), ouverture et
   fermeture douces et animées (fondu + translation verticale légère, 350 ms).
6. **Réalisations — page** : seconde section présentée comme la page « Our
   Work » de sheragency.com (design uniquement) : fond sombre, chaque projet
   en ligne pleine largeur — pastille catégorie (#e4e4e4), grand titre blanc
   60 px poids 400, bouton blanc « Voir Le Projet », grande capture à droite
   (monochrome au repos, couleur au survol) ; 3 lignes, alternance de colonne.
   - **Accueil — section PROJETS RÉALISÉS** : les trois projets sur une seule
   ligne (3 colonnes) ; bouton « Voir Nos Réalisations » ; captures
   EXCLUSIVEMENT noir et blanc (grayscale(1) mesuré au survol ET sans survol),
   comme les deux mockups du hero et la deuxième image « VOTRE ACTIVITÉ ».
7. **Images épinglées** : la seconde image de « VOTRE ACTIVITÉ MÉRITE… », de
   « QUI SUIS-JE ? » et de la page À propos est désormais ÉPINGLÉE sur la
   partie inférieure de l'image principale, de façon oblique (rotate 3°),
   agrandie (58-60 %) — chevauchement mesuré (~150 px sur l'image principale ;
   correctif structurel : conteneurs `lg:self-start`, l'étirement des colonnes
   de grille plaçait l'épingle en bas de colonne).
8. **QUI SUIS-JE ?** : première image remplacée par le portrait officiel
   (stevens-akpovi-portrait.webp) ; les trois blocs « Approche », « Inclus
   dans chaque projet », « Mode de collaboration » sont supprimés.
9. **Page À propos** : image remplacée par APROPOS-PORTRAIT (WebP optimisé,
   59 Ko), épingle oblique idem.
10. **POUR QUI JE CONÇOIS CES SITES** : 3 mentions fusionnées (contenus des 3
    supprimées intégrés), 6 → 3 pastilles.
11. **Données projets** : AFRIBAYIT « Plateforme immobilière. » ; projet 2
    renommé « PRÉ-LAUNCH MR STEVE ENGLISH » (+ meta description) ; bouton
    « Réserver Un Appel » (sans « 30 Min ») partout.
12. **Assets mis à jour depuis GitHub** : APROPOS-PORTRAIT.png (converti
    WebP), problem-no-website.png (WebP régénéré depuis la nouvelle version).

---

## Complément 6 — Second lot du 13/11/2026 (soir) : pages Devis / Réservation / Contact + restructuration accueil

**Vérifications effectuées** : build Next 10/10 pages, zéro erreur console,
E2E formulaire de contact (redirection + enregistrement base constatés),
équilibrage hero mesuré (61/61 px à 1440×900, 50/50 à 1280×800, 58/59 à
1536×960), accordéons testés au clic, aucun débordement mobile
(scrollWidth = 390 px).

### Hero
1. **Équilibrage vertical de la description** : autant d'espace au-dessus
   qu'au-dessous de la description, sans bouger le titre ni les boutons —
   la description seule se déplace (ajustement mesuré côté client, car
   l'écart dépend de la hauteur du viewport qui dimensionne le portrait).
2. **« Réserver Un Appel »** : icône de gauche supprimée ; le bouton mène à
   la nouvelle page **Demander Un Devis** (comme « Démarrer Un Projet » du
   header). **« Voir Nos Travaux »** : flèche de droite supprimée.
3. **Fondu hero → section suivante** : le trait de séparation est remplacé
   par un dégradé (#070707 → #1c1c1c) sur ~112 px — plus de limite nette.

### Accueil
4. **VOTRE ACTIVITÉ MÉRITE…** : titre « Disposez-vous réellement d'un site
   web capable d'aider votre activité ? » + description réécrite (4
   paragraphes, conclusion « Car votre présence sur les réseaux sociaux… ») ;
   image épinglée agrandie (74 % de la largeur).
5. **Six bandes de questions** : sans le bloc-titre « VOUS AVEZ DÉJÀ UN
   SITE ? », présentées en **deux colonnes — trois rangées** (dès 640 px ;
   en dessous, une colonne pour rester lisible), puis bloc conclusion + CTA.
6. **ET SI VOTRE SITE DEVENAIT…** : « …même en votre absence. ».
7. **DES SOLUTIONS ADAPTÉES À VOS OBJECTIFS** : déplacée entre « ET SI… » et
   « COMMENT ÇA FONCTIONNE ? » ; résumée à **trois cartes** (Site Web
   Professionnel, Page de vente, Refonte de Site Web) sur une seule rangée —
   la page Services conserve le détail des six offres.
8. **« COMMENT ÇA FONCTIONNE ? »** (ex-UNE APPROCHE…) : titre « Un processus
   clair. Une collaboration structurée », texte « Je ne crée pas simplement
   des sites web… », **six cartes à accordéon « + »/« − »** (Échange &
   Compréhension, Planification du Parcours Utilisateur, Conception
   Visuelle, Rédaction de Contenu, Développement & Mise en Ligne,
   Génération de trafic) avec numéros stylisés en **haut-gauche**, plus de
   mention « Pilier 01 », suppression de la carte « Comprendre votre
   activité… » ; boutons « **Démarrons Votre Projet** » (blanc, identique au
   header) et « **Voir Nos Travaux** » (noir, identique à « Parlons De Votre
   Projet »).
9. **Sections supprimées** : « DÉVELOPPER VOTRE VISIBILITÉ » et « COMMENT
   NOUS ALLONS TRAVAILLER ENSEMBLE » (leurs contenus restent détaillés sur
   les pages Services et À propos).
10. **Images épinglées** (toutes, sauf hero) : encore agrandies (72-74 %).
    Page À propos : épingle remplacée par **stevens-akpovi-workspace.png**
    (convertie en WebP optimisé, 75 Ko).
11. **favicon.png** régénérée depuis le nouveau « Logo Favicon.png » (512 px).

### Nouvelles pages (routes par fragment)
12. **#/demander-un-devis** — calquée sur « /request-a-quote » de
    sheragency.com : page claire, grand titre centré « Parlons de votre
    futur site. », sous-texte, trois pastilles de bénéfices, badge 4,9/5
    (5 étoiles, la 5ᵉ à moitié remplie), formulaire devis en deux colonnes
    avec bouton noir pleine largeur (pas de vidéo : aucun asset disponible).
13. **#/reserver-un-appel** — la section « APPEL STRATÉGIQUE · 30 MINUTES »
    de l'ancienne page contact, présentée telle quelle (Calendly inline,
    vraies disponibilités).
14. **#/contact** — calquée sur « /contact-us » de sheragency.com : fond
    sombre + orbes lumineux ; à gauche titre « Contact », bouton blanc
    « Demander Un Devis » (vers la page dédiée) et note 4,9/5 ; à droite
    trois accordéons (Clients existants / Nouveaux clients / Vous avez
    déjà un site ?) puis « Laissez-moi un message » et le formulaire.
    **Le bouton du formulaire transmet les informations à
    stevensakpovi@gmail.com puis redirige vers #/reserver-un-appel.**

### Technique
15. **Envoi email automatique** : l'API /api/leads existante est réutilisée
    (notification Resend vers stevensakpovi@gmail.com + accusé de réception
    au visiteur). **Rappel : renseigner RESEND_API_KEY dans les variables
    d'environnement Vercel** (clé gratuite sur resend.com) pour que les
    envois partent — sans la clé, les demandes restent enregistrées en base
    et visibles dans l'espace admin (#/admin), qui affiche désormais aussi
    les messages de contact (filtres + export CSV mis à jour).
16. **Nouveau type « contact »** (validation Zod + email + admin) avec
    champ « Comment m'avez-vous découvert ? » (TikTok, Instagram, LinkedIn,
    YouTube, Google, WhatsApp, bouche à oreille, autre).
17. **Liens** : tous les boutons « Demander Un Devis » / « Démarrer Un
    Projet » / « Discuter De Mon Projet » mènent à #/demander-un-devis ;
    les CTA « audit » mènent à la page contact (formulaire de message).
    Correction du href des CTAButton (fragments réels via router.href).
18. **Sitemap** : #/demander-un-devis et #/reserver-un-appel ajoutées.

### Non applicable / choix d'interprétation
- La vidéo de présentation de la page « Request a quote » de la référence
  n'a pas d'équivalent (aucun asset) — remplacée par le badge de note.
- Les six bandes restent sur une colonne sous 640 px de large (lisibilité) ;
  dire si tu les veux aussi en deux colonnes sur mobile.
