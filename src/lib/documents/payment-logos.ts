/**
 * Badges des modes de paiement — copie de K.Quotes (src/lib/payment-logos.ts)
 * adaptée VOLET 24 (27/11/2026) : SVG embarqués en data URI, aucune
 * dépendance fichier, fonctionnels dans l'aperçu iframe comme dans le
 * PDF Puppeteer.
 *
 * VOLET 24 — LISIBILITÉ (demande de l'éditeur : « le badge gris
 * “Bank transfer” du mode de paiement n'est pas lisible — même en
 * zoomant. Ça doit être lisible, sur les devis comme sur les
 * factures ») : les badges passent d'un canvas de 18 px de haut
 * (polices 8-10 px, affiché à 16 px) à un canvas de 24 px de haut
 * avec des polices de 13,5 px — affiché à 22 px dans le document,
 * soit une écriture ~62 % plus grande, comparable au corps du texte
 * environnant (10 pt). Les largeurs suivent la longueur du libellé.
 */

function svgToDataUri(svg: string): string {
  const base64 =
    typeof btoa !== "undefined"
      ? btoa(svg)
      : Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/** Canvas commun : 24 px de haut, texte Arial gras 13,5 px centré
 *  (baseline 16,5), coin arrondi 3,5 px. */
const H = 24;
const Y = 16.5;
const FS = 13.5;

function badge(largeur: number, fond: string, texte: string, couleur: string): string {
  return svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${H}" viewBox="0 0 ${largeur} ${H}">` +
      `<rect width="${largeur}" height="${H}" fill="${fond}" rx="3.5"/>` +
      `<text x="${largeur / 2}" y="${Y}" font-family="Arial,sans-serif" font-size="${FS}" font-weight="bold" fill="${couleur}" text-anchor="middle" letter-spacing="0.3">${texte}</text>` +
      `</svg>`,
  );
}

const SVG_LOGOS: Record<string, string> = {
  "MTN Mobile Money": badge(60, "#FFCC00", "MTN", "#000"),
  "Moov Money": badge(66, "#0066B3", "Moov", "#fff"),
  "Orange Money": badge(78, "#FF7900", "Orange", "#fff"),
  "Wave": badge(66, "#1DC8FF", "Wave", "#fff"),
  "Celtiis Cash": badge(84, "#00A651", "Celtiis", "#fff"),
  "M-Pesa": badge(80, "#4CAF50", "M-PESA", "#fff"),
  "PayPal": badge(78, "#003087", "PayPal", "#fff"),
  "Virement bancaire": badge(124, "#374151", "Bank Transfer", "#fff"),
};

/** Hauteur d'affichage du badge dans le document (px CSS) — VOLET 24 :
 *  22 px (16 px avant), pour une écriture enfin lisible. */
export const HAUTEUR_BADGE_PAIEMENT = 22;

export function getPaymentMethodLogo(methodName: string): string | null {
  return SVG_LOGOS[methodName] ?? null;
}

/** Badge + libellé, pour le bloc Paiement des factures. */
export function formatPaymentMethodWithLogo(methodName: string): string {
  const logoUri = getPaymentMethodLogo(methodName);
  if (logoUri) {
    return `<img src="${logoUri}" alt="${methodName}" style="height:${HAUTEUR_BADGE_PAIEMENT}px; vertical-align:middle; margin-right:7px;" />${methodName}`;
  }
  return methodName;
}
