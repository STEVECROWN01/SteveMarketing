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
    "J'accompagne entreprises, PME, agences, coachs, infopreneurs et freelances dans la création de sites web stratégiques qui valorisent leur activité, attirent des visiteurs qualifiés et transforment leur intérêt en clients.",
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

/** Pages du site (routes du routeur applicatif). */
export const PAGES = {
  accueil: {
    hash: "#/accueil",
    label: "Accueil",
    title: "Stevens Akpovi — Je crée des sites web qui génèrent des ventes",
    description:
      "Sites vitrines, multipages, landing pages et pages de vente pensés pour convertir. Copywriting et SEO de base inclus. Appelez Stevens Akpovi ou demandez votre devis.",
  },
  services: {
    hash: "#/services",
    label: "Services",
    title: "Services — Sites web orientés conversion | Stevens Akpovi",
    description:
      "Sites vitrines professionnels, sites multipages, landing pages, pages de vente, refontes et systèmes d'acquisition client. Meta Ads et référencement approfondi en options.",
  },
  realisations: {
    hash: "#/realisations",
    label: "Réalisations",
    title: "Réalisations — Projets web | Stevens Akpovi",
    description:
      "Découvrez les projets conçus par Stevens Akpovi : MR Steve English, pré-lancement MR Steve English et AfriBayit.",
  },
  aPropos: {
    hash: "#/a-propos",
    label: "À propos",
    title: "À propos — Stevens Akpovi, concepteur de sites web",
    description:
      "Je suis Stevens Akpovi. Je conçois des sites web professionnels qui servent le business qu'ils représentent. Collaboration à distance, au-delà des frontières.",
  },
  contact: {
    hash: "#/contact",
    label: "Contact",
    title: "Contact — Demande de projet | Stevens Akpovi",
    description:
      "Réservez un appel de 30 minutes (gratuit, sans engagement), demandez un devis personnalisé ou un audit gratuit de votre site actuel.",
  },
  legal: {
    hash: "#/mentions-legales",
    label: "Mentions légales",
    title: "Mentions légales | Stevens Akpovi",
    description: "Mentions légales, éditeur du site, données personnelles et cookies.",
  },
} as const;

export type PageKey = keyof typeof PAGES | "admin";

/** Navigation publique (ordre éditorial). */
export const NAV_ITEMS: { key: PageKey; label: string }[] = [
  { key: "accueil", label: "Accueil" },
  { key: "services", label: "Services" },
  { key: "realisations", label: "Réalisations" },
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
    mobile: "/assets/projects/mrsteveenglish-mobile.webp",
  },
  {
    id: "prelaunch",
    name: "PRÉ-LANCEMENT MR STEVE ENGLISH",
    category: "Page de vente",
    description:
      "Une page commerciale conçue pour présenter une offre de coaching, valoriser ses bénéfices et guider le visiteur vers l'inscription.",
    cta: "Voir La Page De Vente",
    url: "https://mrsteveenglish.vercel.app/pre-launch",
    desktop: "/assets/projects/prelaunch-desktop.webp",
    mobile: "/assets/projects/prelaunch-mobile.webp",
  },
  {
    id: "afribayit",
    name: "AFRIBAYIT",
    category: "Site web de plateforme immobilière",
    description:
      "Une expérience digitale dédiée au secteur immobilier, pensée pour présenter une plateforme et faciliter la découverte de ses offres.",
    cta: "Découvrir Le Projet",
    url: "https://afribayit.vercel.app",
    desktop: "/assets/projects/afribayit-desktop.webp",
    mobile: "/assets/projects/afribayit-mobile.webp",
  },
] as const;

/** Assets fournis dans le dépôt officiel du projet. */
export const ASSETS = {
  portrait: "/assets/stevens-akpovi-portrait.webp",
  workspaceDesktop: "/assets/stevens-akpovi-workspace-desktop.webp",
  workspaceMobile: "/assets/stevens-akpovi-workspace-mobile.webp",
  strategyWork: "/assets/stevens-strategy-work.webp",
  benefitGrowth: "/assets/benefit-business-growth.webp",
  problemNoWebsite: "/assets/problem-no-website.webp",
  problemIneffective: "/assets/problem-ineffective-website.webp",
  /** Logo officiel — version blanche (pour fonds noirs/sombres). */
  logoLight: "/assets/logo-blanc.png",
  /** Logo officiel — version noire (pour fonds blancs/clairs). */
  logoDark: "/assets/logo-noir.png",
  /** Vignette de partage de lien (Open Graph), fournie par l'éditeur. */
  ogImage: "/assets/OG.png",
} as const;
