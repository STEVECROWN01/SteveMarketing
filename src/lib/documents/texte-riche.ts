/**
 * ASSAINISSEMENT DU TEXTE RICHE (VOLET 17, 25/11/2026).
 *
 * La description des prestations du devis se RÉDIGE dans un éditeur
 * enrichi (gras, italique, taille supérieure, listes) et le HTML
 * produit transite par le formulaire puis le document imprimé.
 * Cette fonction ne conserve QUE les balises de mise en forme
 * autorisées — tout le reste (scripts, styles, attributs, handlers)
 * est retiré. Utilisée côté client (enregistrement) comme côté
 * serveur (rendu du PDF).
 */

const BALISES_AUTORISEES = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "font", "span",
  "ul", "ol", "li", "div",
]);

/** Nettoie un fragment HTML riche (sortie d'éditeur contentEditable
 *  ou document enregistré) : balises autorisées, attribut unique
 *  `size` conservé sur <font>, tout le reste supprimé. */
export function assainirHtmlRiche(html: string | null | undefined): string {
  if (!html) return "";
  let out = String(html);
  /* retirer les blocs dangereux dans leur intégrité */
  out = out.replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?<\/\1\s*>/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  /* retirer les balises auto-fermantes dangereuses */
  out = out.replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*\/?>/gi, "");
  /* retirer les balises non autorisées (paires et isolées) */
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g, (balise, nom) => {
    const n = String(nom).toLowerCase();
    if (!BALISES_AUTORISEES.has(n)) return "";
    /* ne conserver AUCUN attribut sauf size (police plus grande) */
    if (/^<font\b/i.test(balise)) {
      const m = balise.match(/\ssize\s*=\s*"?(\d+)"?/i);
      return m ? `<font size="${m[1]}">` : "<font>";
    }
    return `<${balise.startsWith("</") ? "/" : ""}${n}>`;
  });
  return out.trim();
}

/** Le texte riche est-il vide (pas de texte, pas de liste) ? */
export function htmlRicheVide(html: string | null | undefined): boolean {
  if (!html) return true;
  const texte = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return texte.length === 0;
}

/** La description (nouveau format) ou, à défaut pour les ANCIENS
 *  documents, les puces converties en paragraphes successifs. */
export function descriptionOuPoints(item: {
  description?: string;
  points?: string[];
}): string {
  const riche = assainirHtmlRiche(item.description);
  if (riche && !htmlRicheVide(riche)) return riche;
  const points = (item.points ?? []).filter((p) => p && p.trim());
  return points.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

function escapeHtml(v: string): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Le texte riche est-il VRAIMENT du HTML (balises) ? Sinon, on
 *  l'affiche tel quel ligne par ligne (texte brut multi-lignes). */
export function htmlRicheOuTexteBrut(html: string | null | undefined): string {
  const riche = assainirHtmlRiche(html);
  if (!riche) return "";
  if (/<(p|br|b|strong|i|em|u|font|span|ul|ol|li|div)\b/i.test(riche)) {
    return riche;
  }
  /* texte brut : chaque ligne devient un paragraphe */
  return riche
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join("");
}

/** Découpe une description riche en FRAGMENTS de bloc (un paragraphe
 *  ou une liste) — chaque fragment devient une ligne-bloc paginable
 *  du tableau : une description plus longue qu'une page se poursuit
 *  sur la page suivante, le tableau continue (VOLET 17). */
export function decouperHtmlRiche(html: string | null | undefined): string[] {
  const riche = htmlRicheOuTexteBrut(html);
  if (!riche) return [];
  if (!/<(p|ul|ol|div|font)\b/i.test(riche)) {
    /* texte brut sans balise : un fragment par ligne */
    return riche
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return riche
    .split(/(?=<p\b|<ul\b|<ol\b|<div\b|<font\b)/i)
    .map((m) => m.trim())
    .filter(Boolean);
}
