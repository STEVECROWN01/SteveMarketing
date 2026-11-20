/**
 * Configuration centrale du site — données réelles du projet.
 */

/**
 * Normalisation défensive d'une URL d'environnement : le build ne doit
 * jamais planter sur une valeur mal saisie dans le tableau de bord
 * (protocole absent, guillemets copiés, espaces parasites, valeur vide
 * ou invalide). Repli sur le fallback plutôt que crash.
 */
function normalizeUrl(raw: string | undefined, fallback: string): string {
  const value = (raw ?? "").trim().replace(/^["']+|["']+$/g, "");
  if (!value) return fallback;
  const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)
    ? value
    : `https://${value}`;
  try {
    return new URL(withProtocol).toString().replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

// Domaine de production réel attribué par Vercel (Project Domains).
const DEFAULT_SITE_URL = "https://stevensakpovi.vercel.app";
const DEFAULT_CALENDLY_URL = "https://calendly.com/stevensakpovi/30min";

export const SITE = {
  name: "Stevens Akpovi",
  role: "Concepteur de sites web professionnels orientés conversion",
  positioning: "Je crée des sites web qui génèrent des ventes.",
  description:
    "J'accompagne entreprises, PME, agences, coachs, infopreneurs et freelances dans la création de sites web stratégiques qui valorisent leur activité, attirent les bons visiteurs et transforment leur intérêt en clients.",
  url: normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL),
  email: "stevensakpovi@gmail.com",
  // Événement Calendly réel du compte stevensakpovi — rendez-vous
  // stratégique de 30 minutes (confirmé par l'éditeur).
  // Configurable via NEXT_PUBLIC_CALENDLY_URL.
  calendly: normalizeUrl(process.env.NEXT_PUBLIC_CALENDLY_URL, DEFAULT_CALENDLY_URL),
  calendlyMention: "Gratuit, 30 minutes et sans engagement.",
  linkedin: "https://www.linkedin.com/in/stevensakpovi",
  whatsapp: "https://wa.me/2290199909258",
  // Mentions légales — identifiant professionnel de l'éditeur (IFU, RCCM…).
  // Renseignable sans toucher au code via NEXT_PUBLIC_LEGAL_REGISTRATION
  // (voir DEPLOIEMENT.md). Tant qu'il n'est pas communiqué par l'éditeur,
  // la mention affiche un libellé honnête — aucune donnée inventée.
  legalRegistration:
    process.env.NEXT_PUBLIC_LEGAL_REGISTRATION?.trim() ||
    "Activité exercée à titre indépendant — identifiant professionnel non communiqué par l'éditeur.",
  // Hébergeur de production (décision de déploiement : Vercel).
  // Coordonnées publiques de Vercel Inc. (vercel.com/legal/privacy-notice).
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
    url: "https://vercel.com",
  },
} as const;

/** Pages virtuelles du site (métadonnées SEO par page).
 *  CONTRAT DE LONGUEUR (recommandation de l'audit intégral du
 *  18/11/2026, appliquée le même jour) : title ≤ 60 caractères et
 *  description ≤ 155 caractères — seuils de troncature de Google,
 *  qui coupe vers 60 pour le titre d'onglet et 155-160 pour l'extrait.
 *  Vérification : python3 scripts/mesurer-metas-2026-11-18.py. */
export const PAGES = {
  accueil: {
    hash: "#/accueil",
    label: "Accueil",
    title: "Stevens Akpovi — Votre site web qui travaille pour vous",
    description:
      "Sites vitrines, multipages, landing pages et pages de vente pensés pour convertir. Copywriting et SEO de base inclus. Demandez votre devis personnalisé.",
  },
  processus: {
    hash: "#/methode",
    label: "Méthode",
    title: "Méthode — Comment je travaille | Stevens Akpovi",
    description:
      "La méthode de Stevens Akpovi : compréhension de votre activité, parcours de vos visiteurs, conception, rédaction, développement et mise en ligne.",
  },
  referencement: {
    hash: "#/referencement-seo",
    label: "Référencement SEO",
    title: "Référencement SEO — Positionnement Google | Stevens Akpovi",
    description:
      "Améliorez votre positionnement sur Google et attirez des visiteurs sur la durée, sans dépendre de la publicité : référencement adapté à votre marché.",
  },
  publicite: {
    hash: "#/publicite-meta-ads",
    label: "Publicité Meta Ads",
    title: "Publicité Meta Ads — Facebook & Instagram | Stevens Akpovi",
    description:
      "Développez votre présence sur Facebook et Instagram grâce à des campagnes publicitaires ciblées et structurées autour de vos objectifs.",
  },
  realisations: {
    hash: "#/realisations",
    label: "Réalisations",
    title: "Réalisations — Projets web | Stevens Akpovi",
    description:
      "Découvrez les projets conçus par Stevens Akpovi : MR STEVE ENGLISH, PRÉ-LAUNCH MR STEVE ENGLISH et AFRIBAYIT.",
  },
  aPropos: {
    hash: "#/a-propos",
    label: "À propos",
    title: "À propos — Stevens Akpovi, concepteur de sites web",
    description:
      "Je conçois des sites web professionnels qui servent le business qu'ils représentent. Collaboration à distance, au-delà des frontières.",
  },
  contact: {
    hash: "#/contact",
    label: "Contact",
    title: "Contact — Stevens Akpovi",
    description:
      "Contactez Stevens Akpovi : laissez un message, demandez un devis personnalisé ou réservez un appel stratégique de 30 minutes — gratuit et sans engagement.",
  },
  devis: {
    hash: "#/demander-un-devis",
    label: "Demander Un Devis",
    title: "Demander Un Devis — Stevens Akpovi",
    description:
      "Décrivez votre activité et votre projet : Stevens Akpovi vous répond avec un devis personnalisé, établi à partir de votre besoin.",
  },
  audit: {
    hash: "#/audit-gratuit",
    label: "Audit Gratuit",
    title: "Audit Gratuit De Votre Site — Stevens Akpovi",
    description:
      "Votre site vous rapporte-t-il assez de clients ? Recevez un audit concret : ce qui fonctionne, ce qui freine vos visiteurs, les priorités — gratuitement.",
  },
  appel: {
    hash: "#/reserver-un-appel",
    label: "Réserver Un Appel",
    title: "Réserver Un Appel — 30 minutes | Stevens Akpovi",
    description:
      "Réservez votre créneau d'appel stratégique de 30 minutes avec Stevens Akpovi — gratuit et sans engagement, en visioconférence.",
  },
  legal: {
    hash: "#/mentions-legales",
    label: "Mentions légales",
    title: "Mentions légales | Stevens Akpovi",
    description: "Mentions légales, éditeur du site, données personnelles et cookies.",
  },
} as const;

export type PageKey = keyof typeof PAGES | "admin";

/** Navigation publique (ordre éditorial) — pages « Services » supprimée
 *  (demande de l'éditeur, 15/11/2026) : le header présente Méthode,
 *  Référencement, Publicité, Portfolio et À propos (le menu Contact
 *  a été retiré du header à la demande de l'éditeur ; il reste dans
 *  le menu plein écran, colonne « Autre », et dans le pied de page). */
export const NAV_ITEMS: { key: PageKey; label: string }[] = [
  { key: "accueil", label: "Accueil" },
  { key: "processus", label: "Méthode" },
  { key: "referencement", label: "Référencement" },
  { key: "publicite", label: "Publicité" },
  { key: "realisations", label: "Portfolio" },
  { key: "aPropos", label: "À propos" },
  { key: "contact", label: "Contact" },
];

/** Les trois réalisations réelles — données factuelles uniquement. */
export const PROJECTS = [
  {
    id: "mrsteveenglish",
    name: "MR STEVE ENGLISH",
    category: "Site web professionnel pour coach",
    description:
      "Un espace professionnel consacré à la présentation d'une activité de coaching en anglais, de ses programmes et de son accompagnement.",
    cta: "Voir Le Site",
    url: "https://mrsteveenglish.vercel.app",
    desktop: "/assets/projects/mrsteveenglish-desktop.webp",
    desktop2x: "/assets/projects/mrsteveenglish-desktop@2x.webp",
    /* Variante légère 640 px (volet 8 de l'audit, 19/11/2026 —
       Lighthouse image-delivery) : candidat d'entrée du srcset du
       mockup navigateur du hero, affiché à 130-290 px CSS. */
    desktopSmall: "/assets/projects/mrsteveenglish-desktop-640.webp",
    mobile: "/assets/projects/mrsteveenglish-mobile.webp",
    mobile2x: "/assets/projects/mrsteveenglish-mobile@2x.webp",
  },
  {
    id: "prelaunch",
    name: "PRÉ-LAUNCH MR STEVE ENGLISH",
    category: "Page de vente",
    description:
      "Une page commerciale conçue pour présenter une offre de coaching, valoriser ses bénéfices et guider le visiteur vers l'inscription.",
    cta: "Voir La Page De Vente",
    url: "https://mrsteveenglish.vercel.app/pre-launch",
    desktop: "/assets/projects/prelaunch-desktop.webp",
    desktop2x: "/assets/projects/prelaunch-desktop@2x.webp",
    mobile: "/assets/projects/prelaunch-mobile.webp",
    mobile2x: "/assets/projects/prelaunch-mobile@2x.webp",
  },
  {
    id: "afribayit",
    name: "AFRIBAYIT",
    category: "Plateforme immobilière",
    description:
      "Une expérience digitale dédiée au secteur immobilier, pensée pour présenter une plateforme et faciliter la découverte de ses offres.",
    cta: "Voir Le Site",
    url: "https://afribayit.vercel.app",
    desktop: "/assets/projects/afribayit-desktop.webp",
    desktop2x: "/assets/projects/afribayit-desktop@2x.webp",
    mobile: "/assets/projects/afribayit-mobile.webp",
    mobile2x: "/assets/projects/afribayit-mobile@2x.webp",
    /* Variante légère 290 px (volet 8 de l'audit, 19/11/2026) :
       candidat d'entrée du srcset du mockup téléphone du hero,
       affiché à 68-145 px CSS (68 px × DPR 3 = 204 px ≤ 290 px). */
    mobileSmall: "/assets/projects/afribayit-mobile-290.webp",
  },
] as const;

/** Assets fournis dans le dépôt officiel du projet. */
export const ASSETS = {
  portrait: "/assets/stevens-akpovi-portrait.webp",
  /** Portrait paysage (espace de travail, 1672×941) — grand visuel du
   *  hero horizontal bureau (demande de l'éditeur, 16/11/2026) ;
   *  dérivé WebP q90 du PNG source conservé dans le dépôt. */
  portraitLong: "/assets/stevens-akpovi-portrait-long.webp",
  workspaceDesktop: "/assets/stevens-akpovi-workspace-desktop.webp",
  workspaceMobile: "/assets/stevens-akpovi-workspace-mobile.webp",
  /** Espace de travail (version webp optimisée du PNG fourni par
   *  l'éditeur) — image épinglée de la page « À propos ». */
  workspace: "/assets/stevens-akpovi-workspace.webp",
  strategyWork: "/assets/stevens-strategy-work.webp",
  benefitGrowth: "/assets/benefit-business-growth.webp",
  problemNoWebsite: "/assets/problem-no-website.webp",
  problemIneffective: "/assets/problem-ineffective-website.webp",
  /** Portrait dédié de la page « À propos » (fourni par l'éditeur). */
  aboutPortrait: "/assets/apropos-portrait.webp",
  /** Logo officiel — version blanche sur fond TRANSPARENT (RGBA,
   *  fond noir supprimé du fichier, 15/11/2026) pour en-tête, pied de
   *  page et emails sur fonds sombres. Paramètre de version : force le
   *  rechargement par les navigateurs qui ont mis l'ancien PNG (avec
   *  fond) en cache. */
  logoLight: "/assets/logo-blanc.png?v=2026-11-15",
  /** Logo officiel — version noire sur fond TRANSPARENT (RGBA, fond
   *  blanc supprimé du fichier, 15/11/2026) pour fonds clairs. */
  logoDark: "/assets/logo-noir.png?v=2026-11-15",
  /** Vignette de partage de lien (Open Graph) — 1200×630, 102 Ko.
   *  COMPOSITION DE L'ÉDITEUR (deuxième itération du correctif du
   *  20/11/2026) : l'éditeur a fourni sa propre vignette au bon ratio
   *  paysage (public/assets/OG-image.png, 1733×908 — portrait à
   *  gauche, logo et nom en haut à droite, accroche « Des Sites Web
   *  Professionnels qui vendent », trois icônes de services en bas à
   *  droite ; commits 919d8f4 + 1f463a8). Le PNG (1 823 Ko) ne peut
   *  pas être servi tel quel : WhatsApp n'affiche pas les aperçus
   *  au-delà d'environ 600 Ko (l'image échoue silencieusement —
   *  incident du 16/11 avec le OG.png de 1,9 Mo, cause première des
   *  aperçus manquants). Dérivé JPEG optimisé par
   *  scripts/og-editeur-2026-11-20.py : redimensionnement homothétique
   *  1733×908 → 1200×630 (écart de ratio 0,2 %, AUCUN recadrage),
   *  qualité 85, fidélité 1,39/255, validé visuellement (textes nets,
   *  aucun artefact). NOUVEAU NOM DATÉ -v2 : la première correction du
   *  jour (OG-2026-11-20.jpg, carré centré) vient d'être scrapée par
   *  les plateformes — un nom nouveau force chaque edge à
   *  re-télécharger la version de l'éditeur. Sources conservées dans
   *  le dépôt : OG-image.png (éditeur), OG.png + OG.jpg (historique,
   *  d'anciens caches de plateformes pointent encore vers eux). */
  ogImage: "/assets/OG-2026-11-20-v2.jpg",
} as const;
