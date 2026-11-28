/**
 * VOLET 32 (29/11/2026) — DIAGNOSTIC DE QUALITÉ DU SITE WEB D'UN PROSPECT.
 *
 * L'idée de l'outil (demande de l'éditeur : « analyse un outil de
 * scraping de sites « moches » — trouve les entreprises dont le site
 * a de vrais problèmes que tu peux résoudre ») : à côté des
 * coordonnées, chaque prospect avec un site web reçoit un DIAGNOSTIC
 * de sa page d'accueil —
 *  - la PLATEFORME du site (WordPress, Wix, Shopify, Squarespace…) ;
 *  - l'ANNÉE DE DERNIÈRE MISE À JOUR (année du copyright) ;
 *  - les ÉLÉMENTS QUI MANQUENT : HTTPS, version mobile (viewport),
 *    titre de page, description Google, titre principal (H1) ;
 *  - le POIDS de la page ;
 *  - un SCORE de 0 à 100 et un VERDICT : « À refaire » (le site a
 *    de vrais problèmes — c'est le prospect idéal pour un nouveau
 *    site), « Moyen » ou « Correct » ;
 *  - la LISTE DES PROBLÈMES en français, prête à servir dans la
 *    prospection ;
 *  - au passage : l'EMAIL de l'entreprise s'il figure sur la page
 *    (mailto ou texte), et le NOM DU DIRIGEANT (recherche existante).
 *
 * Méthode : UNE SEULE lecture de la page d'accueil par entreprise
 * (la même lecture sert au dirigeant, à l'email et au diagnostic),
 * dans un budget de temps borné — jamais d'échec du scraping.
 */
import { telechargerTexte } from "./http";
import { chercherDirigeant } from "./proprietaire";
import type { EntrepriseScraped } from "./types";

/** Verdict de la qualité du site d'un prospect. */
export type VerdictSite = "a-refaire" | "moyen" | "correct";

/** Diagnostic du site web d'un prospect (page d'accueil). */
export type QualiteSite = {
  /** Plateforme / constructeur du site (WordPress, Wix…). */
  plateforme?: string;
  /** Année de dernière mise à jour (année du copyright), si trouvée. */
  anneeMiseAJour?: number;
  /** Le site est-il servi en HTTPS ? */
  https: boolean;
  /** La page déclare-t-elle une version mobile (meta viewport) ? */
  mobile: boolean;
  /** La page a-t-elle un titre (<title>) ? */
  titre: boolean;
  /** La page a-t-elle une meta description ? */
  metaDescription: boolean;
  /** La page a-t-elle un titre principal (H1) ? */
  h1: boolean;
  /** Poids du HTML de la page d'accueil (Ko). */
  poidsKo: number;
  /** Score de qualité du site, de 0 (à refaire) à 100 (correct). */
  score: number;
  /** Verdict lisible : « À refaire », « Moyen » ou « Correct ». */
  verdict: VerdictSite;
  /** Les problèmes trouvés, en français, dans l'ordre d'importance. */
  problemes: string[];
};

/** Libellés affichables des verdicts. */
export const VERDICTS_LIBELLES: Record<VerdictSite, string> = {
  "a-refaire": "Site à refaire",
  moyen: "Site moyen",
  correct: "Site correct",
};

/** Ton de pastille correspondant au verdict (éléments.tsx). */
export const VERDICTS_TONS: Record<VerdictSite, "alerte" | "neutre" | "valide"> = {
  "a-refaire": "alerte",
  moyen: "neutre",
  correct: "valide",
};

/* ---------- Détection de la plateforme du site ---------- */

const PLATEFORMES: { nom: string; motifs: RegExp }[] = [
  { nom: "WordPress", motifs: /\/wp-content\/|\/wp-includes\/|wp-emoji|wp-json|name=["']generator["'][^>]*content=["']WordPress/i },
  { nom: "Wix", motifs: /wix(?:static|static\.com)|X-Wix|name=["']generator["'][^>]*content=["']Wix|\.wix\.com/i },
  { nom: "Shopify", motifs: /cdn\.shopify\.com|shopify\.theme|Shopify\.analytics/i },
  { nom: "Squarespace", motifs: /squarespace|static1\.squarespace|name=["']generator["'][^>]*content=["']Squarespace/i },
  { nom: "Webflow", motifs: /webflow|wf-page|wf-site|assets\.website-files\.com/i },
  { nom: "Joomla", motifs: /name=["']generator["'][^>]*content=["']Joomla|\/media\/jui\//i },
  { nom: "Drupal", motifs: /name=["']generator["'][^>]*content=["']Drupal|\/sites\/default\/files\//i },
  { nom: "PrestaShop", motifs: /prestashop/i },
  { nom: "GoDaddy", motifs: /godaddywebsites|img1\.wsimg\.com|starfield/i },
  { nom: "Jimdo", motifs: /jimdo|jimstatic/i },
  { nom: "Weebly", motifs: /weebly/i },
  { nom: "Duda", motifs: /duda|dudasites|dudamobile/i },
  { nom: "Odoo", motifs: /odoo|\/web\/static\/lib\//i },
  { nom: "E-monsite", motifs: /e-monsite|emonsite/i },
  { nom: "SiteW", motifs: /sitew/i },
  { nom: "Blogger", motifs: /blogger|blogspot/i },
  { nom: "Carrd", motifs: /carrd\.co/i },
  { nom: "Tilda", motifs: /tilda|tildacdn/i },
  { nom: "Ghost", motifs: /ghost-sdk|content\/images\/size/i },
];

/** Détecte la plateforme depuis le HTML de la page d'accueil. */
function detecterPlateforme(html: string): string | undefined {
  for (const p of PLATEFORMES) {
    if (p.motifs.test(html)) return p.nom;
  }
  /* Repli honnête : la balise generator quand elle existe. */
  const m = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']{2,40})["']/i);
  if (m) return m[1].trim();
  return undefined;
}

/* ---------- Année de dernière mise à jour (copyright) ---------- */

/** Dernière année de copyright mentionnée sur la page (la plus
 *  récente des mentions © / Copyright / (c) suivies d'une année). */
function extraireAnneeMaj(html: string): number | undefined {
  const annees: number[] = [];
  const re = /(?:©|&copy;|&#169;|copyright|\(c\))[\s\u00A0:;-]{0,24}((?:19|20)\d{2})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const a = Number(m[1]);
    if (a >= 1995 && a <= new Date().getFullYear() + 1) annees.push(a);
  }
  return annees.length ? Math.max(...annees) : undefined;
}

/* ---------- Email de l'entreprise sur la page ---------- */

/** Domaines d'images/pièces à ne jamais prendre pour un email. */
const EXTENSIONS_INTERDITES = /\.(png|jpe?g|gif|webp|svg|css|js|pdf|ico|woff2?|mp4)$/i;

/** Cherche un email de contact sur la page (mailto d'abord, puis
 *  texte) — ignore les emails d'images et les adresses techniques. */
export function chercherEmailDansHtml(html: string): string | undefined {
  const candidats: string[] = [];
  const mailto = html.matchAll(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi);
  for (const m of mailto) candidats.push(m[1]);
  const texte = html.replace(/<[^>]+>/g, " ");
  const brut = texte.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi);
  for (const m of brut) candidats.push(m[0]);
  for (const c of candidats) {
    const e = c.toLowerCase().replace(/[.,;:]+$/, "");
    if (EXTENSIONS_INTERDITES.test(e)) continue;
    /* Adresses techniques / d'exemple à ignorer. */
    if (/(sentry|example|wixpress|\.png|\.jpg|domaine|email@|test@|no-?reply|noreply)/i.test(e)) continue;
    return e;
  }
  return undefined;
}

/* ---------- Le diagnostic complet d'une page d'accueil ---------- */

/** Analyse le HTML d'une page d'accueil → diagnostic + score. */
export function analyserPageSite(
  html: string,
  infos: { https: boolean; tailleOctets: number; url: string },
): QualiteSite {
  const problemes: string[] = [];
  let score = 100;

  /* HTTPS */
  const https = infos.https;
  if (!https) {
    score -= 25;
    problemes.push("Le site n'est pas sécurisé (pas de HTTPS) — les navigateurs affichent « non sécurisé »");
  }
  /* Version mobile */
  const mobile = /<meta[^>]+name=["']viewport["']/i.test(html);
  if (!mobile) {
    score -= 20;
    problemes.push("Pas de version mobile : le site est difficile à lire sur téléphone");
  }
  /* Titre de page */
  const titre = /<title[^>]*>\s*\S[\s\S]{0,200}?<\/title>/i.test(html);
  if (!titre) {
    score -= 10;
    problemes.push("Titre de page manquant (le nom de l'onglet et le résultat Google)");
  }
  /* Meta description */
  const metaDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}["']/i.test(html);
  if (!metaDescription) {
    score -= 10;
    problemes.push("Description Google manquante (le texte sous le site dans les résultats)");
  }
  /* H1 */
  const h1 = /<h1[\s>]/i.test(html);
  if (!h1) {
    score -= 10;
    problemes.push("Titre principal (H1) manquant — compliqué pour Google");
  }
  /* Poids de la page */
  const poidsKo = Math.max(1, Math.round(infos.tailleOctets / 1024));
  if (poidsKo > 1500) {
    score -= 18;
    problemes.push(`Page très lourde (${poidsKo} Ko de HTML seul)`);
  } else if (poidsKo > 750) {
    score -= 10;
    problemes.push(`Page lourde (${poidsKo} Ko de HTML seul)`);
  }
  /* Année de mise à jour */
  const anneeMiseAJour = extraireAnneeMaj(html);
  if (anneeMiseAJour) {
    const ecart = new Date().getFullYear() - anneeMiseAJour;
    if (ecart >= 7) {
      score -= 18;
      problemes.push(`Site qui semble ne plus être mis à jour depuis ${anneeMiseAJour}`);
    } else if (ecart >= 4) {
      score -= 10;
      problemes.push(`Dernière mise à jour visible : ${anneeMiseAJour}`);
    }
  }
  /* Technologies mortes */
  if (/<object[^>]+\.swf|<embed[^>]+\.swf/i.test(html)) {
    score -= 20;
    problemes.push("Technologie Flash obsolète (plus lisible par les navigateurs)");
  }
  if (/<frameset/i.test(html)) {
    score -= 15;
    problemes.push("Structure « frames » des années 2000");
  }

  score = Math.max(4, Math.min(100, score));
  const verdict: VerdictSite = score < 55 ? "a-refaire" : score < 75 ? "moyen" : "correct";
  return {
    plateforme: detecterPlateforme(html),
    anneeMiseAJour,
    https,
    mobile,
    titre,
    metaDescription,
    h1,
    poidsKo,
    score,
    verdict,
    problemes,
  };
}

/* ---------- Enrichissement d'un lot d'entreprises ---------- */

/** Diagnostic du site web d'une entreprise : UNE SEULE lecture de sa
 *  page d'accueil, qui sert AUSSI au nom du dirigeant et à l'email.
 *  Retourne null si le site ne répond pas (rien n'échoue). */
async function diagnostiquerSite(
  siteWeb: string,
): Promise<{ html: string; https: boolean; taille: number } | null> {
  let base: URL;
  try {
    base = new URL(/^https?:\/\//i.test(siteWeb) ? siteWeb : `https://${siteWeb}`);
  } catch {
    return null;
  }
  try {
    const res = await fetch(base.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "SteveMarketing-Scraping/1.0 (back-office; https://stevensakpovi.vercel.app)",
        "Accept-Language": "fr,fr-FR;q=0.9,en;q=0.6",
      },
    });
    if (!res.ok && res.status >= 500) return null;
    const texte = await res.text().catch(() => null);
    if (!texte) return null;
    const httpsFinal = new URL(res.url).protocol === "https:";
    return { html: texte, https: httpsFinal, taille: texte.length };
  } catch {
    return null;
  }
}

/** Enrichit les entreprises QUI ONT UN SITE WEB : diagnostic complet
 *  (qualité, plateforme, année, problèmes) + email de la page +
 *  nom du dirigeant — au plus `max` sites, par vagues de
 *  `parallele`, dans un BUDGET DE TEMPS pour garder la réponse
 *  rapide. Une seule lecture de page d'accueil par entreprise. */
export async function enrichirSites(
  entreprises: EntrepriseScraped[],
  options: { max?: number; parallele?: number; budgetMs?: number } = {},
): Promise<void> {
  const max = options.max ?? 12;
  const parallele = options.parallele ?? 4;
  const budgetMs = options.budgetMs ?? 26_000;
  const cibles = entreprises.filter((e) => e.siteWeb && e.siteWebPresent).slice(0, max);
  const debut = Date.now();
  for (let i = 0; i < cibles.length; i += parallele) {
    if (Date.now() - debut > budgetMs) break; // budget écoulé : on s'arrête là
    const lot = cibles.slice(i, i + parallele);
    await Promise.all(
      lot.map(async (e) => {
        const page = await diagnostiquerSite(e.siteWeb as string);
        if (!page) return; // site muet : pas de diagnostic, c'est tout
        e.qualiteSite = analyserPageSite(page.html, {
          https: page.https,
          tailleOctets: page.taille,
          url: e.siteWeb as string,
        });
        if (!e.email) {
          const email = chercherEmailDansHtml(page.html);
          if (email) e.email = email;
        }
        e.dirigeant = await chercherDirigeant(e.siteWeb, page.html);
      }),
    );
  }
}
