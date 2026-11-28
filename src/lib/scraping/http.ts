/**
 * VOLET 27 — téléchargement HTTP partagé des outils de scraping :
 * décodage d'entités et timeout — aucune dépendance externe (fetch
 * global), aucune clé d'API.
 *
 * AGENT : identité HONNÊTE d'application (recommandée par la politique
 * d'usage de Nominatim). Un faux User-Agent de navigateur est
 * repéré et bloqué par les protections anti-robots des sources
 * (mesuré : « Chrome/120.0.0.0 » → refus Nominatim 629 et LinkedIn
 * 403 ; l'identité d'application → 200 sur les deux). */
export const UA_NAVIGATEUR =
  "SteveMarketing-Scraping/1.0 (back-office; https://stevensakpovi.vercel.app)";

/** Télécharge un texte (HTML / CSS / JSON) ; null si indisponible. */
export async function telechargerTexte(
  url: string,
  options: { timeoutMs?: number; entetes?: Record<string, string> } = {},
): Promise<string | null> {
  const { timeoutMs = 15000, entetes = {} } = options;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": UA_NAVIGATEUR,
        "Accept-Language": "fr,fr-FR;q=0.9,en;q=0.6",
        ...entetes,
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Décode les entités HTML courantes (numériques + nommées usuelles). */
export function decoderEntites(t: string): string {
  return t
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç")
    .replace(/&ocirc;/g, "ô")
    .replace(/&hellip;/g, "…")
    .replace(/&rsquo;/g, "’");
}

/** Nettoie un texte extrait : entités, espaces, longueur. */
export function nettoyerTexte(t: string | undefined | null, max = 200): string {
  if (!t) return "";
  const propre = decoderEntites(String(t))
    .replace(/\s+/g, " ")
    .trim();
  return propre.length > max ? propre.slice(0, max).trim() : propre;
}
