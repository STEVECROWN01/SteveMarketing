/**
 * VOLET 29 (28/11/2026) — RECHERCHE DU DIRIGEANT D'UNE ENTREPRISE.
 *
 * Demande de l'éditeur : parmi les données que l'outil de scraping
 * doit chercher figure « le nom du propriétaire de l'entreprise, s'il
 * le trouve. S'il ne le trouve pas, ce n'est pas grave » — le nom est
 * alors simplement marqué « Non trouvé » dans les résultats.
 *
 * Méthode (autonome, sans service externe) : lire la PAGE D'ACCUEIL
 * du site de l'entreprise puis, si besoin, ses pages « équipe /
 * à propos » courantes, et repérer un nom propre AU VOISINAGE des
 * mentions de fonction (Gérant, Fondatrice, Dirigeant, CEO,
 * Propriétaire, Fondateur…) ou dans une tournure « fondé(e) par ».
 * Les pages sont limitées en taille et en nombre ; un site muet
 * renvoie undefined — sans jamais faire échouer le scraping.
 */
import { telechargerTexte, decoderEntites, nettoyerTexte } from "./http";

/** Pages courantes où les entreprises parlent de leur équipe. */
const CHEMINS_EQUIPE = [
  "/a-propos",
  "/a-propos-de-nous",
  "/a-propos/",
  "/about",
  "/about-us",
  "/equipe",
  "/notre-equipe",
  "/qui-sommes-nous",
  "/team",
  "/contact",
];

/** Mots de fonction qui introduisent souvent le nom du dirigeant. */
const MOTS_FONCTION =
  "(?:gérant|gérante|fondateur|fondatrice|dirigeant|dirigeante|propriétaire|ceo|c\\.e\\.o|founder|owner|président|directeur générale?|directrice générale?|co-?fondateur|co-?fondatrice)";

/** Tournures « fondé(e) par X » / « créé(e) par X » / « signé X ». */
const MOTS_FONDATION = "(?:fondé|fondée|créé|créée|dirigé|dirigée)\\s+(?:par|depuis)";

/** Mots à ne JAMAIS prendre pour un nom de personne. */
const NON_NOMS = new Set([
  "nous",
  "vous",
  "équipe",
  "equipe",
  "entreprise",
  "société",
  "societe",
  "contact",
  "adresse",
  "copyright",
  "tous",
  "droits",
  "réservés",
  "reserves",
  "notre",
  "votre",
  "site",
  "web",
  "more",
  "read",
  "lire",
  "suite",
  "en",
  "de",
  "la",
  "le",
  "les",
  "et",
]);

/** Extrait un nom propre plausible d'un fragment de texte. */
function nomPropre(fragment: string): string | undefined {
  const mots = fragment
    .replace(/&nbsp;/g, " ")
    .split(/[\s\u00A0]+/)
    .filter(Boolean);
  const nom: string[] = [];
  for (const mot of mots) {
    const propre = mot.replace(/[,;:.!?"'»›)»]+$/g, "").replace(/^[(««‹]+/g, "");
    if (!propre) break;
    /* Un nom : commence par une majuscule et reste raisonnable
     * (lettres, tirets, apostrophes) — pas un chiffre, un mail, une URL. */
    const plausible =
      /^[A-ZÀ-Þ][A-Za-zÀ-ÿ'’-]{1,24}$/.test(propre) &&
      !NON_NOMS.has(propre.toLowerCase()) &&
      !/^(https?|www|com|fr|net|org)$/i.test(propre);
    if (!plausible) break;
    nom.push(propre);
    if (nom.length >= 3) break; // Prénom + NOM + complément court
  }
  if (nom.length < 2) return undefined; // un seul mot : trop incertain
  const candidat = nom.join(" ");
  return candidat.length <= 42 ? candidat : undefined;
}

/** Cherche le dirigeant dans un texte de page (HTML ou texte brut). */
function chercherDansTexte(html: string): string | undefined {
  const texte = decoderEntites(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ");

  /* 1) « Gérant : Jean Dupont » / « Fondatrice — Marie Martin » … */
  const apresFonction = new RegExp(
    `${MOTS_FONCTION}\\s*(?:de\\s+la\\s+société|de\\s+l'entreprise)?\\s*[:\\-–—]\\s*([A-ZÀ-Þ][\\wÀ-ÿ'’\\-]+(?:\\s+[A-ZÀ-Þ][\\wÀ-ÿ'’\\-]+){0,3})`,
  );
  const m1 = texte.match(apresFonction);
  if (m1) {
    const n = nomPropre(m1[1]);
    if (n) return n;
  }
  /* 2) « fondée par Jean Dupont » … */
  const m2 = texte.match(new RegExp(`${MOTS_FONDATION}\\s+([A-ZÀ-Þ][\\wÀ-ÿ'’\\-]+(?:\\s+[A-ZÀ-Þ][\\wÀ-ÿ'’\\-]+){0,3})`));
  if (m2) {
    const n = nomPropre(m2[1]);
    if (n) return n;
  }
  /* 3) « Jean Dupont, gérant » (nom AVANT la fonction). */
  const m3 = texte.match(
    new RegExp(
      `([A-ZÀ-Þ][\\wÀ-ÿ'’\\-]+(?:\\s+[A-ZÀ-Þ][\\wÀ-ÿ'’\\-]+){1,2})\\s*[,;]\\s*(?:${MOTS_FONCTION}|${MOTS_FONCTION}\\s+de\\s+(?:l'entreprise|la\\s+société))\\b`,
    ),
  );
  if (m3) {
    const n = nomPropre(m3[1]);
    if (n) return n;
  }
  /* 4) Balise meta author, souvent le dirigeant sur les petits sites. */
  const m4 = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']{3,60})["']/i);
  if (m4) {
    const n = nomPropre(nettoyerTexte(m4[1], 60));
    if (n) return n;
  }
  return undefined;
}

/** Cherche le nom du dirigeant sur le site web d'une entreprise.
 *  Retourne undefined si le site ne le révèle pas (ce n'est pas grave). */
export async function chercherDirigeant(siteWeb: string | undefined): Promise<string | undefined> {
  if (!siteWeb) return undefined;
  let base: URL;
  try {
    base = new URL(/^https?:\/\//i.test(siteWeb) ? siteWeb : `https://${siteWeb}`);
  } catch {
    return undefined;
  }
  /* La page d'accueil d'abord — puis au plus 4 pages d'équipe. */
  const pages: string[] = [base.toString()];
  for (const chemin of CHEMINS_EQUIPE) {
    if (pages.length >= 5) break;
    pages.push(new URL(chemin, base).toString());
  }
  for (const page of pages) {
    const html = await telechargerTexte(page, { timeoutMs: 4500 });
    if (!html) continue;
    const trouve = chercherDansTexte(html.slice(0, 400_000));
    if (trouve) return trouve;
  }
  return undefined;
}

/** Recherche du dirigeant pour un lot d'entreprises : seules celles
 *  qui ONT un site web sont candidates, au plus `max` sites, par
 *  vagues de `parallele` pages — et le tout dans un BUDGET DE TEMPS
 *  (`budgetMs`) pour que la réponse du scraping reste rapide : quand
 *  le budget est écoulé, les sites restants restent sans dirigeant
 *  (« Non trouvé » — ce n'est pas grave).
 *  Les entreprises sans site restent sans dirigeant. */
export async function enrichirDirigeants<T extends { siteWeb?: string; dirigeant?: string }>(
  entreprises: T[],
  options: { max?: number; parallele?: number; budgetMs?: number } = {},
): Promise<void> {
  const max = options.max ?? 12;
  const parallele = options.parallele ?? 3;
  const budgetMs = options.budgetMs ?? 24_000;
  const cibles = entreprises.filter((e) => e.siteWeb && !e.dirigeant).slice(0, max);
  const debut = Date.now();
  for (let i = 0; i < cibles.length; i += parallele) {
    if (Date.now() - debut > budgetMs) break; // budget écoulé : on s'arrête là
    const lot = cibles.slice(i, i + parallele);
    await Promise.all(
      lot.map(async (e) => {
        e.dirigeant = await chercherDirigeant(e.siteWeb);
      }),
    );
  }
}
