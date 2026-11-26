/**
 * RENDU HTML DE LA PROPOSITION COMMERCIALE — VOLET 17 (25/11/2026).
 *
 * Reproduction STRICTE du template personnel de l'éditeur (PDF fourni
 * en exemple le 25/11/2026). Toutes les valeurs du gabarit sont
 * MESURÉES SUR LE PDF (extraction PyMuPDF — scripts/extract-layout-*
 * du 25/11) et reportées ici en points typographiques :
 *
 *  - page A4, marges latérales 62,4 pt, fond blanc ;
 *  - page 1 : « PROPOSITION COMMERCIALE » Poppins Medium 8 pt #6b6b6b
 *    (haut à 56,3 pt), titre Poppins Bold 22 pt/27 pt #111111, logo
 *    à droite (hauteur 78,8 pt, haut à 83,1 pt) ;
 *  - bloc VOTRE PROJET / PRESTATAIRE / MONTANT TOTAL / DÉLAI ESTIMÉ :
 *    étiquettes 6,8 pt #6b6b6b, valeurs 11 pt Medium (montant 15 pt
 *    Bold), pas de 32,5 pt, filet clair #e6e6e6 ;
 *  - sections numérotées : numéro 34 pt Bold #e6e6e6 (colonne 62,3 pt),
 *    titre 15 pt Bold #111111, filet #111111 1,2 pt ;
 *  - corps 9,4 pt/15,2 pt, chapeaux 10,4 pt/17 pt Light, interligne
 *    de paragraphe +6,5 pt ;
 *  - périmètre : pastilles noires 21,2 pt (lettre blanche 10 pt Bold),
 *    sous-titres 11,2 pt Bold, tirets « – » 9,2 pt/14,4 pt ;
 *  - investissement : bandeau noir (montant 30 pt Bold blanc) ;
 *  - calendrier : étapes 28,3 pt à pastille noire 22,6 pt ;
 *  - modalités : blocs #f4f4f2 à filet supérieur noir 2 pt (50 % en
 *    26 pt Bold), 2 par rangée (3 par rangée s'il y a trois échéances) ;
 *  - signature : nom 11 pt Bold, titration et site 8,2 pt, filet ;
 *  - pied : « prestataire · Proposition commerciale · site » + « NN /
 *    NN », 7 pt, filet #e6e6e6 à 795,1 pt ;
 *  - filigrane logo (hauteur 353,4 pt, centré, haut à 258,4 pt,
 *    opacité 6 %) sur toutes les pages ;
 *  - en-tête compact pages suivantes : « Proposition commerciale » +
 *    projet 7 pt, logo 32,6 pt, filet clair.
 *
 * PAGINATION : moteur commun (pagination-flux.ts) — contenu en flux
 * de blocs, répartis en pages A4 explicites ; la capacité (contenu
 * jusqu'à 720 pt, départ page 1 à 56,3 pt, pages suivantes à 88 pt)
 * est calée sur l'exemple : avec le contenu par défaut, chaque
 * section démarre exactement à la page de l'exemple (02 en page 2,
 * C en page 3, F en page 4, 05 et 06 en page 5, 07-08 en page 6).
 */

import type { PropositionRecord } from "./proposition";
import { estPropositionV2 } from "./proposition";
import { fabriquerScriptPagination } from "./pagination-flux";

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Montant façon template : « 2 000 € » — sans décimales quand entier. */
function fmtMontant(n: number, devise: string): string {
  const arrondi = Number.isFinite(n) ? n : 0;
  const nb = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: Number.isInteger(arrondi) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(arrondi);
  const symboles: Record<string, string> = {
    EUR: "€", USD: "$", XOF: "FCFA", XAF: "FCFA", CAD: "$ CA", GBP: "£", CHF: "CHF",
  };
  const s = symboles[devise] ?? devise;
  return /[$£]/.test(s) ? `${s}${nb}` : `${nb} ${s}`;
}

/** VOLET 20 — date longue française (« 26 novembre 2026 ») pour la
 *  ligne « DATE D'ÉMISSION » de la première page. */
const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
function fmtDateLongue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

/* Constantes de pagination (pt → px CSS : × 4/3). */
const LIMITE_PX = Math.round(720 * 4 / 3);
const DEBUT_P1_PX = Math.round(56.3 * 4 / 3);
const DEBUT_N_PX = Math.round(88 * 4 / 3);

/** Rendu complet (HTML autonome) de la proposition commerciale. */
export function renderPropositionHtml(
  p: PropositionRecord,
  /* VOLET 19 — logo recadré SERRÉ sur le glyphe (celui du PDF
   * d'exemple) : l'ancien logo-noir.png portait ~25 % de marges
   * transparentes et la marque apparaissait trop petite à hauteur
   * fixe. Le PDF (serverless) passe un data URI ; l'aperçu
   * navigateur sert l'asset public. */
  logoSrc: string = "/assets/logo-noir-doc.png",
): string {
  const s = p.sections;
  const siteUrl = p.signature.site
    ? /^https?:\/\//i.test(p.signature.site)
      ? p.signature.site
      : `https://${p.signature.site}`
    : "";
  const montantF = fmtMontant(p.montant, p.devise);

  /* Échéances : 2 → une rangée de 2 ; 3 → une rangée de 3 ;
   * 4 → deux rangées de 2 (règle de l'éditeur). */
  const echs = (s.paiements ?? []).map((e) => ({
    ...e,
    montantF: fmtMontant((p.montant * (Number(e.pourcentage) || 0)) / 100, p.devise),
  }));
  const parRangee = echs.length === 3 ? 3 : 2;
  const rangees: typeof echs[] = [];
  for (let i = 0; i < echs.length; i += parRangee) rangees.push(echs.slice(i, i + parRangee));

  const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /* Chapeau (premier paragraphe, 10,4 pt Light) + paragraphes. */
  const chapeauEtParas = (arr: string[]) => {
    const lignes = (arr ?? []).filter((t) => t && t.trim());
    if (!lignes.length) return "";
    return `<p class="chapeau" data-bloc>${esc(lignes[0])}</p>\n${lignes
      .slice(1)
      .map((t) => `<p class="para" data-bloc>${esc(t)}</p>`)
      .join("\n")}`;
  };

  const blocsPerimetre = (s.perimetre ?? [])
    .map((b, i) => {
      const lettre = lettres[i % 26] ?? "A";
      const items = (b.points ?? []).filter(Boolean);
      /* Le bloc suit un paragraphe de clôture (post) → espace plus
         grand (mesuré sur l'exemple : 19,4 pt contre 16,2 pt). */
      const precedent = (s.perimetre ?? [])[i - 1];
      const apresPoste = i > 0 && precedent?.post ? " apres-poste" : "";
      const premier = i === 0 ? " premier" : "";
      return `<div class="perim-tete${premier}${apresPoste}" data-bloc data-heading>
  <div class="pt-carre">${lettre}</div>
  <p class="pt-titre">${esc(b.titre)}</p>
</div>
${b.intro ? `<p class="para pt-intro" data-bloc>${esc(b.intro)}</p>` : ""}
${b.lead ? `<p class="pt-lead" data-bloc>${esc(b.lead)}</p>` : ""}
${items
  .map(
    (it, k) =>
      `<p class="tiret${k === 0 ? " premier" : ""}" data-bloc>–&emsp;${esc(it)}</p>`,
  )
  .join("\n")}
${b.post ? `<p class="para pt-post" data-bloc>${esc(b.post)}</p>` : ""}`;
    })
    .join("\n");

  const blocsObjectifs = (s.objectifs ?? [])
    .map((o, i) => {
      const n = (s.objectifs ?? []).length;
      const classe = `${i === 0 ? " premiere" : ""}${i === n - 1 ? " derniere" : ""}`;
      return `<div class="obj-ligne${classe}" data-bloc>
  <span class="obj-num">${String(i + 1).padStart(2, "0")}</span>
  <p class="obj-texte">${esc(o)}</p>
</div>`;
    })
    .join("\n");

  const blocsEtapes = (s.calendrierEtapes ?? [])
    .map((e, i) => {
      const n = (s.calendrierEtapes ?? []).length;
      const classe = `${i === 0 ? " premiere" : ""}${i === n - 1 ? " derniere" : ""}`;
      return `<div class="etape${classe}" data-bloc>
  <div class="etape-carre">${i + 1}</div>
  <p class="etape-texte">${esc(e)}</p>
</div>`;
    })
    .join("\n");

  const blocsPaiements = rangees
    .map(
      (r) => `<div class="paiements-rangee${r.length === 3 ? " trois" : ""}" data-bloc>
${r
  .map(
    (e) => `  <div class="paie-bloc">
    <p class="paie-pct">${esc(String(e.pourcentage))}&nbsp;%</p>
    <p class="paie-montant">${esc(e.montantF)}</p>
    <div class="paie-filet"></div>
    <p class="paie-libelle">${esc(e.libelle)}</p>
    ${e.description ? `<p class="paie-desc">${esc(e.description)}</p>` : ""}
  </div>`,
  )
  .join("\n")}
</div>`,
    )
    .join("\n");

  const section = (num: string, titre: string, suite: string, premiereClasse = "") => `
<div class="s-head${premiereClasse}" data-bloc data-heading>
  <div class="s-ligne">
    <span class="s-num">${num}</span>
    <p class="s-titre">${esc(titre)}</p>
  </div>
  <div class="s-filet"></div>
</div>
${suite}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Proposition commerciale ${esc(p.numero)} — ${esc(p.projet)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #525252;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #111111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* ---- Pages : marges mesurées (62,4 pt = 22 mm) ---- */
  .ppage {
    position: relative;
    width: 210mm; height: 297mm;
    margin: 0 auto 8mm;
    background: #ffffff;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(0,0,0,0.28);
    padding: 0 62.4pt;
    break-after: page;
    page-break-after: always;
  }
  .ppage1 { padding-top: 56.3pt; }
  .ppage-n { padding-top: 88pt; }
  .ppage.ppage-fin { break-after: auto; page-break-after: auto; }
  @media print {
    body { background: #ffffff; }
    .ppage { margin: 0; box-shadow: none; }
  }
  .corps { position: relative; z-index: 1; }

  /* ---- Filigrane : hauteur 353,4 pt, centré, haut à 258,4 pt ---- */
  .wm {
    position: absolute;
    top: 258.4pt;
    left: 50%;
    transform: translateX(-50%);
    height: 353.4pt;
    opacity: 0.06;
    pointer-events: none;
    z-index: 0;
  }
  .wm img { height: 353.4pt; width: auto; display: block; }

  /* ---- En-tête page 1 ---- */
  /* VOLET 19 (26/11/2026) — LOGO À DROITE : sa HAUTEUR s'aligne sur
   * la hauteur qu'occupe le TITRE à gauche (demande de l'éditeur :
   * « sa taille est augmentée afin que sa hauteur s'aligne avec la
   * hauteur qu'occupe le titre du document qui est sur la même
   * horizontale que lui à gauche »). Le petit script ALIGNEMENT
   * LOGO TITRE (fin de gabarit) mesure le titre et cale la hauteur
   * du logo — 78,8 pt au minimum (la valeur de l'exemple, pour un
   * titre de 3 lignes) : un titre plus court garde le logo de
   * l'exemple, un titre plus long l'agrandit. */
  .entete1 { position: relative; min-height: 78.8pt; }
  .e1-surtitre {
    margin: 0;
    font-size: 8pt; font-weight: 500;
    letter-spacing: 0.02em;
    color: #6b6b6b;
  }
  .e1-titre {
    margin: 12.5pt 0 0 0;
    max-width: 300pt;
    font-size: 22pt; font-weight: 700;
    line-height: 27pt;
    color: #111111;
  }
  .e1-logo { position: absolute; right: 0; top: 26.8pt; }
  .e1-logo img { height: 78.8pt; width: auto; display: block; }

  /* ---- Bloc d'informations (pas de 32,5 pt) ---- */
  .infos { margin-top: 47pt; }
  .paire + .paire { margin-top: 7.9pt; }
  .paire .lbl {
    margin: 0 0 2.7pt 0;
    font-size: 6.8pt; font-weight: 500;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: #6b6b6b;
  }
  .paire .val { margin: 0; font-size: 11pt; font-weight: 500; line-height: 1.2; color: #111111; }
  .paire .val.montant { font-size: 15pt; font-weight: 700; }
  .filet-clair { margin: 16.5pt 0 0 0; border-top: 0.6pt solid #e6e6e6; }
  /* VOLET 20 (26/11/2026) — DATE D'ÉMISSION sous le trait de
     séparation : l'espace qui sépare le trait et la date (ci-dessous)
     ÉGALE l'espace qui sépare le trait et le délai estimé ci-dessus
     (16,5 pt — demande de l'éditeur). */
  .paire-date { margin: 16.5pt 0 0 0; }

  /* ---- En-tête compact (pages suivantes) ---- */
  .entete-n { position: absolute; top: 0; left: 62.4pt; right: 62.4pt; z-index: 1; }
  .en-textes { position: relative; padding-right: 48pt; }
  .en-surtitre {
    margin: 36.4pt 0 0 0;
    font-size: 7pt; font-weight: 500;
    letter-spacing: 0.02em;
    line-height: 1.4;
    color: #6b6b6b;
  }
  .en-sous { margin: 0; font-size: 7pt; font-weight: 400; line-height: 1.4; color: #6b6b6b; }
  .en-filet { margin-top: 11pt; border-top: 0.5pt solid #e6e6e6; }
  .en-logo { position: absolute; right: 0; top: 31.2pt; }
  .en-logo img { height: 32.6pt; width: auto; display: block; }

  /* ---- Pied de page (filet à 795,1 pt) ---- */
  .pied { position: absolute; left: 62.4pt; right: 62.4pt; bottom: 29.5pt; z-index: 1; }
  .pied .pied-filet { border-top: 0.5pt solid #e6e6e6; margin-bottom: 6.8pt; }
  .pied .pied-ligne { display: flex; align-items: baseline; justify-content: space-between; }
  .pied .p-gauche { margin: 0; font-size: 7pt; font-weight: 400; line-height: 1.5; color: #6b6b6b; }
  .pied .p-gauche a { color: #111111; text-decoration: none; }
  .pied .p-num { margin: 0; font-size: 7pt; font-weight: 500; color: #111111; }
  .pied .p-num b { font-weight: 500; }

  /* ---- Titres de section ---- */
  .s-head { margin-top: 29.6pt; }
  .s-head.t01 { margin-top: 69.75pt; }
  .s-head.t03 { margin-top: 32.9pt; }
  .s-head.t04 { margin-top: 27.85pt; }
  .s-head.t06 { margin-top: 29.6pt; }
  .s-head.t08 { margin-top: 29.6pt; }
  .s-head .s-ligne { display: flex; align-items: flex-start; }
  .s-num {
    display: block;
    width: 62.3pt; flex: 0 0 62.3pt;
    font-size: 34pt; font-weight: 700; line-height: 48.1pt;
    color: #e6e6e6;
  }
  .s-titre { margin: 0; padding-top: 17.8pt; font-size: 15pt; line-height: 1.25; font-weight: 700; color: #111111; }
  .s-filet { margin-top: 0; border-top: 1.2pt solid #111111; }

  /* ---- Corps de texte (9,4 pt / 15,2 pt) ---- */
  .chapeau { margin: 12.3pt 0 3.2pt 0; font-size: 10.4pt; font-weight: 300; line-height: 17pt; color: #111111; }
  .para { margin: 6pt 0 0 0; font-size: 9.4pt; font-weight: 400; line-height: 15.2pt; color: #111111; }
  .para.apres-filet { margin-top: 9.4pt; }
  .para.apres-filet-95 { margin-top: 8.5pt; }

  /* ---- 02 Objectifs ---- */
  .obj-ligne { display: flex; align-items: flex-start; margin-top: 6.3pt; padding-bottom: 8pt; border-bottom: 0.5pt solid #e6e6e6; }
  .obj-ligne.premiere { margin-top: 11.4pt; }
  .obj-ligne.derniere { border-bottom: none; padding-bottom: 0; }
  .obj-num { flex: 0 0 36.8pt; margin-top: 2.4pt; font-size: 13pt; font-weight: 700; line-height: 12.5pt; color: #b5b5b5; }
  .obj-texte { margin: 0; font-size: 9.4pt; line-height: 15.2pt; color: #111111; }

  /* ---- 03 Périmètre ---- */
  .perim-tete { display: flex; align-items: center; margin-top: 16.2pt; }
  .perim-tete.apres-poste { margin-top: 19.4pt; }
  .perim-tete.premier { margin-top: 16pt; }
  .pt-carre {
    flex: 0 0 21.2pt; width: 21.2pt; height: 21.2pt;
    margin-right: 10pt;
    display: flex; align-items: center; justify-content: center;
    background: #111111; color: #ffffff;
    font-size: 10pt; font-weight: 700;
  }
  .pt-titre { margin: 0; font-size: 11.2pt; line-height: 1.25; font-weight: 700; color: #111111; }
  .pt-intro { margin-top: 5.5pt; }
  .pt-lead { margin: 5.2pt 0 0 0; font-size: 9.2pt; font-weight: 500; line-height: 14.4pt; color: #6b6b6b; }
  .tiret {
    margin: 0;
    padding-left: 14pt; text-indent: -14pt;
    font-size: 9.2pt; font-weight: 400; line-height: 14.4pt;
    color: #111111;
  }
  .tiret.premier { margin-top: 3.6pt; }
  .pt-post { margin-top: 4.8pt; }

  /* ---- 04 Investissement ---- */
  .invest {
    margin-top: 12.8pt;
    background: #111111; color: #ffffff;
    padding: 18.35pt 20pt 14.5pt;
    display: flex; align-items: center;
  }
  .invest-g { flex: 0 0 204pt; }
  .invest-lbl {
    margin: 0;
    font-size: 7.5pt; font-weight: 500;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: #b5b5b5;
  }
  .invest-montant { margin: 6.15pt 0 0 0; font-size: 30pt; font-weight: 700; line-height: 1.2; color: #ffffff; }
  .invest-d { margin: 0 0 0 22pt; flex: 1 1 auto; font-size: 9.6pt; font-weight: 300; line-height: 15pt; color: #ffffff; }
  .fines { margin-top: 13.5pt; border-left: 2pt solid #e6e6e6; padding-left: 12pt; }
  .fine { margin: 0; font-size: 8.2pt; font-weight: 400; line-height: 12.5pt; color: #6b6b6b; }
  .fine + .fine { margin-top: 6.1pt; }

  /* ---- 05 Calendrier ---- */
  .delai-ligne { display: flex; align-items: baseline; margin-top: 14.2pt; }
  .delai-valeur { flex: 0 0 147.4pt; margin: 0; font-size: 15pt; line-height: 1.25; font-weight: 700; color: #111111; }
  .delai-libelle { margin: 0; font-size: 8.2pt; line-height: 1.2; color: #6b6b6b; }
  .cal-intro { margin-top: 9.45pt; }
  .cal-lead { margin: 5.25pt 0 0 0; font-size: 9.2pt; font-weight: 500; line-height: 14.4pt; color: #6b6b6b; }
  .etape { display: flex; align-items: center; height: 28.3pt; }
  .etape.premiere { margin-top: 6.85pt; }
  .etape-carre {
    flex: 0 0 22.6pt; width: 22.6pt; height: 28.3pt;
    margin-right: 14pt;
    display: flex; align-items: center; justify-content: center;
    background: #111111; color: #ffffff;
    font-size: 9.5pt; font-weight: 700;
  }
  .etape-texte {
    margin: 0 0 0 -14pt; padding-left: 14pt;
    flex: 1 1 auto; height: 100%;
    display: flex; align-items: center;
    font-size: 9.6pt; font-weight: 500; line-height: 1.2;
    color: #111111;
  }
  .etape:not(.derniere) .etape-texte { border-bottom: 0.5pt solid #e6e6e6; }
  .etape:not(.derniere) .etape-carre { border-bottom: 4pt solid #ffffff; }
  .cal-note { margin: 6.5pt 0 0 0; font-size: 8.2pt; font-weight: 400; line-height: 12.5pt; color: #6b6b6b; }

  /* ---- 06 Modalités de paiement ---- */
  .paiements-rangee { display: grid; grid-template-columns: 1fr 1fr; gap: 11.3pt; margin-top: 9.4pt; }
  .paiements-rangee.trois { grid-template-columns: 1fr 1fr 1fr; }
  .paie-bloc { background: #f4f4f2; border-top: 2pt solid #111111; padding: 16pt 16pt 12pt; }
  .paie-pct { margin: 0; font-size: 26pt; font-weight: 700; line-height: 1.05; color: #111111; }
  .paie-montant { margin: 4pt 0 0 0; font-size: 11pt; font-weight: 500; line-height: 1.25; color: #6b6b6b; }
  .paie-filet { border-top: 0.6pt solid #b5b5b5; margin: 11.3pt 0 7.6pt; }
  .paie-libelle { margin: 0; font-size: 9.4pt; font-weight: 700; line-height: 1.25; color: #111111; }
  .paie-desc { margin: 3.2pt 0 0 0; font-size: 8.2pt; font-weight: 400; line-height: 12.5pt; color: #6b6b6b; }

  /* ---- 08 Conclusion / signature ---- */
  .cordialement { margin: 13pt 0 0 0; font-size: 9.4pt; font-weight: 400; line-height: 15.2pt; color: #111111; }
  .signature { margin-top: 5pt; }
  .signature .sig-nom { margin: 0; font-size: 11pt; font-weight: 700; line-height: 1; color: #111111; }
  .signature .sig-titre { margin: 1.9pt 0 0 0; font-size: 8.2pt; font-weight: 400; line-height: 1.2; color: #6b6b6b; }
  .signature .sig-site { margin: 2.7pt 0 0 0; font-size: 8.2pt; font-weight: 400; line-height: 1.2; color: #111111; }
  .signature .sig-site a { color: #111111; text-decoration: none; }
  .signature .sig-filet { margin-top: 1pt; width: 103.6pt; border-top: 1pt solid #111111; }

  /* ---- Flux continu (repli sans script) ---- */
  #pc-flux { width: 470.5pt; margin: 0 auto; }
  #pc-gabarits { display: none; }
</style>
</head>
<body>

<div id="pc-flux">
  <!-- En-tête page 1 : sur-titre + titre + logo -->
  <div class="entete1" data-bloc>
    <p class="e1-surtitre">PROPOSITION COMMERCIALE</p>
    <h1 class="e1-titre">${esc(p.titre)}</h1>
    <div class="e1-logo"><img src="${esc(logoSrc)}" alt="${esc(p.prestataire)}"></div>
  </div>

  <!-- Bloc d'informations -->
  <div class="infos" data-bloc>
    <div class="paire">
      <p class="lbl">VOTRE PROJET</p>
      <p class="val">${esc(p.projet)}</p>
    </div>
    <!-- VOLET 20 — DESTINATAIRE : nom complet de celui à qui la
         proposition est adressée (et son entreprise le cas échéant)
         — c'est ce nom qui pré-remplit le client du devis généré
         depuis la proposition. -->
    ${
      (p.destinataire?.nomComplet || "").trim() || (p.destinataire?.entreprise || "").trim()
        ? `<div class="paire">
      <p class="lbl">DESTINATAIRE</p>
      <p class="val">${esc(
        [(p.destinataire?.nomComplet || "").trim(), (p.destinataire?.entreprise || "").trim()]
          .filter(Boolean)
          .join(" — "),
      )}</p>
    </div>`
        : ""
    }
    <div class="paire">
      <p class="lbl">PRESTATAIRE</p>
      <p class="val">${esc(p.prestataire)}</p>
    </div>
    <div class="paire">
      <p class="lbl">MONTANT TOTAL</p>
      <p class="val montant">${esc(montantF)}</p>
    </div>
    <div class="paire">
      <p class="lbl">DÉLAI ESTIMÉ</p>
      <p class="val">${esc(p.delai)}</p>
    </div>
  </div>
  <div class="filet-clair" data-bloc></div>
  <!-- VOLET 20 — DATE D'ÉMISSION sous le trait de séparation :
       l'espace trait → date égale l'espace délai estimé → trait
       (16,5 pt de part et d'autre — demande de l'éditeur). -->
  <div class="paire paire-date" data-bloc>
    <p class="lbl">DATE D'ÉMISSION</p>
    <p class="val">${esc(fmtDateLongue(p.date))}</p>
  </div>

  ${section("01", "Présentation de votre projet", chapeauEtParas(s.presentation ?? []), " t01")}

  ${section(
    "02",
    "Objectifs de votre site",
    `<p class="para apres-filet-95" data-bloc>${esc(s.objectifsIntro)}</p>
${blocsObjectifs}`,
  )}

  ${section("03", "Périmètre de la prestation", blocsPerimetre, " t03")}

  ${section("04", "Investissement", `<div class="invest" data-bloc>
  <div class="invest-g">
    <p class="invest-lbl">MONTANT TOTAL DE LA PRESTATION</p>
    <p class="invest-montant">${esc(montantF)}</p>
  </div>
  <p class="invest-d">${esc(s.investissementTexte)}</p>
</div>
${(s.investissementNotes ?? []).length ? `<div class="fines" data-bloc>
${(s.investissementNotes ?? []).map((n) => `  <p class="fine">${esc(n)}</p>`).join("\n")}
</div>` : ""}`)}

  ${section("05", "Calendrier de réalisation", `<div class="delai-ligne" data-bloc>
  <p class="delai-valeur">${esc(p.delai)}</p>
  <p class="delai-libelle">Délai estimé de réalisation</p>
</div>
<p class="para cal-intro" data-bloc>${esc(s.calendrierIntro)}</p>
<p class="cal-lead" data-bloc>${esc(s.calendrierEtapesIntro)}</p>
${blocsEtapes}
${s.calendrierNote ? `<p class="cal-note" data-bloc>${esc(s.calendrierNote)}</p>` : ""}`, " t05")}

  ${section("06", "Modalités de paiement", `<p class="para apres-filet" data-bloc>${esc(s.paiementsIntro)}</p>
${blocsPaiements}`, " t06")}

  ${section("07", "Validation et démarrage", (s.validation ?? []).map((t) => `<p class="para${(s.validation ?? []).indexOf(t) === 0 ? " apres-filet" : ""}" data-bloc>${esc(t)}</p>`).join("\n"))}

  ${section("08", "Conclusion", `${chapeauEtParas(s.conclusion ?? [])}
<p class="cordialement" data-bloc>Bien cordialement,</p>
<div class="signature" data-bloc>
  <p class="sig-nom">${esc(p.signature.nom)}</p>
  <p class="sig-titre">${esc(p.signature.titre)}</p>
  <p class="sig-site"><a href="${esc(siteUrl)}">${esc(p.signature.site)}</a></p>
  <div class="sig-filet"></div>
</div>`, " t08")}
</div>

<!-- Gabarits clonés par le script de pagination -->
<div id="pc-gabarits" aria-hidden="true">
  <div class="entete-n">
    <div class="en-textes">
      <p class="en-surtitre">PROPOSITION COMMERCIALE</p>
      <p class="en-sous">${esc(p.projet)}</p>
    </div>
    <div class="en-filet"></div>
    <div class="en-logo"><img src="${esc(logoSrc)}" alt="${esc(p.prestataire)}"></div>
  </div>
  <div class="pied">
    <div class="pied-filet"></div>
    <div class="pied-ligne">
      <p class="p-gauche">${esc(p.signature.nom)}&nbsp;&nbsp;·&nbsp;&nbsp;Proposition commerciale&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${esc(siteUrl)}">${esc(p.signature.site)}</a></p>
      <p class="p-num"><b>01</b> / 01</p>
    </div>
  </div>
  <div class="wm"><img src="${esc(logoSrc)}" alt=""></div>
</div>

<script>${fabriquerScriptPagination({
    limitePx: LIMITE_PX,
    debutP1Px: DEBUT_P1_PX,
    debutNPx: DEBUT_N_PX,
    enteteCompacte: true,
  })}</script>
<script>
/* VOLET 19 — ALIGNEMENT LOGO ↔ TITRE (page 1) : la hauteur du logo
   suit la hauteur du TITRE (min. 78,8 pt = valeur de l'exemple).
   Rejoué quand les polices web arrivent (le titre peut se
   re-calculer) ; l'élément étant positionné en absolu, ce
   recaliblage n'a AUCUN effet sur la pagination. */
(function () {
  function alignerLogoTitre() {
    var t = document.querySelector('.e1-titre');
    var img = document.querySelector('.e1-logo img');
    if (!t || !img) return;
    var hTitre = t.getBoundingClientRect().height;
    var cible = Math.max(hTitre - 2.2 * 4 / 3, 78.8 * 4 / 3);
    img.style.height = cible + 'px';
    img.style.width = 'auto';
  }
  alignerLogoTitre();
  window.addEventListener('load', alignerLogoTitre);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(alignerLogoTitre).catch(function () {});
  }
})();
</script>
</body>
</html>`;

  return html;
}

/** Dispatch : proposition v2 → template dédié ; sinon null. */
export function renderPropositionSiV2(
  d: unknown,
  logoSrc?: string,
): string | null {
  if (estPropositionV2(d)) return renderPropositionHtml(d, logoSrc);
  return null;
}
