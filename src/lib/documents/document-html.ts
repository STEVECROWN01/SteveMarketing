/**
 * Rendu HTML des documents — DEVIS et FACTURES (VOLET 17, 25/11/2026).
 *
 * TEMPLATE PERSONNEL DE L'ÉDITEUR —
 * corrections demandées une à une au fil des volets, toutes
 * appliquées ici :
 *
 *  - ENTÊTE : logo seul à droite (le wordmark sous le logo est
 *    SUPPRIMÉ), hauteur alignée sur le bloc « numéro + date » ;
 *  - ÉMETTEUR : « Professionnel : Stevens AKPOVI » (lignes RCCM et
 *    « Votre contact » supprimées) ;
 *  - DESTINATAIRE : nom complet EN GRAS ;
 *  - ligne « Objet : » SUPPRIMÉE sous le bloc émetteur/destinataire ;
 *  - TABLEAU « Détail » : la description est RÉDIGÉE (texte riche :
 *    gras, italique, taille supérieure, listes Word-like) — plus de
 *    puces carrées ; le type est toujours « Service » ; le tableau
 *    PEUT SE POURSUIVRE sur la page suivante (une ligne = un bloc
 *    paginable) ;
 *  - délai estimé : PLUS DANS LE TABLEAU — affiché à la suite des
 *    conditions générales de vente, sans décalage : « Délai estimé :
 *    … » (libellé en gras) ;
 *  - TOTAL : la rangée noire du pied de tableau est SUPPRIMÉE — le
 *    total s'écrit SOUS le tableau : « Total : 350 000,00 € (trois
 *    cent cinquante mille euros) — TVA non applicable » (montant en
 *    chiffres ET en lettres) ;
 *  - espace de signature du « Bon pour accord » agrandi ;
 *  - COORDONNÉES BANCAIRES : IBAN, BIC puis « Titulaire du compte »
 *    (ligne « Banque » supprimée du document et du formulaire) ;
 *  - la signature manuscrite « Stevens Akpovi » + les deux lignes de
 *    texte qui l'accompagnaient APRÈS la note sont SUPPRIMÉES (devis) ;
 *  - FACTURE : cachet « PAYÉ » conservé, signature conservée.
 *
 * PAGINATION : moteur commun (pagination-flux.ts) — le contenu
 * s'écoule en blocs et se répartit en pages A4 explicites (filigrane
 * et pied numéroté sur chaque page) ; le tableau se poursuit donc
 * naturellement d'une page sur l'autre.
 */

import { formatPaymentMethodWithLogo } from "./payment-logos";
import { montantEnLettres, formatDate, formatDateCourte, formatCurrency } from "./format";
import { descriptionOuPoints, decouperHtmlRiche } from "./texte-riche";
import { fabriquerScriptPagination } from "./pagination-flux";
import { LABELS_DOC, type DocumentRecord } from "./types";
import { EMETTEUR, CONDITIONS_GENERALES } from "./defaults";

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Pagination du devis : marges 16 mm, contenu jusqu'à 279 mm
 * (le pied de page occupe le bas). */
const LIMITE_PX = Math.round((279 / 25.4) * 96);
const DEBUT_PX = Math.round((16 / 25.4) * 96);

export function renderDocumentHtml(
  d: DocumentRecord,
  logoSrc: string = "/assets/logo-noir.png",
): string {
  const label = LABELS_DOC[d.docType];
  const estProposition = d.docType === "proposition";
  const estFacture = d.docType === "facture";
  const dateLabel = formatDate(d.date);
  const datePaiementLabel = d.datePaiement ? formatDateCourte(d.datePaiement) : formatDateCourte(d.date);

  const total = d.items.reduce((s, it) => s + (Number(it.quantite) || 0) * (Number(it.prixUnitaire) || 0), 0);

  /* Délai estimé : champ du document, sinon mention de la première
   * ligne (anciens documents). */
  const delaiEstime =
    (d.delaiEstime ?? "").trim() ||
    (d.items.find((it) => (it.mentionLivraison ?? "").trim())?.mentionLivraison ?? "");

  const emetteurRows: [string, string][] = [
    ["Professionnel :", `<strong>${esc(EMETTEUR.societe)}</strong>`],
    ["IFU :", EMETTEUR.ifu],
    ["Adresse :", EMETTEUR.adresse],
    ["Pays :", EMETTEUR.pays],
  ];
  const emetteurSubText = EMETTEUR.subText;

  const c = d.client;
  const destinataireRows: [string, string][] = [
    ...(c.entreprise ? ([["Entreprise :", esc(c.entreprise)]] as [string, string][]) : []),
    ["Nom :", `<strong>${esc(c.nom) || "—"}</strong>`],
    ["Ville :", esc(c.ville) || "—"],
    ["Pays :", esc(c.pays) || "—"],
    ["Téléphone :", esc(c.telephone) || "—"],
    [
      "Email :",
      c.email
        ? `<a href="mailto:${esc(c.email)}" style="color:#2563eb;text-decoration:none;font-weight:500;">${esc(c.email)}</a>`
        : "—",
    ],
  ];

  const remerciement =
    estFacture
      ? `${esc(d.intro)} Nous remercions notre client pour sa confiance.`
      : esc(d.intro);

  /* Cachet « PAYÉ » — reproduction du style MrSteveEnglish (voir
     l'historique) ; factures réglées uniquement. */
  const estPaye = d.statutPaiement === "Payé";
  const cachetPaye = estFacture
    ? estPaye
      ? `
      <div class="cachet-bande">
        <div class="cachet-paye" role="img" aria-label="Cachet payé">
          <span class="cp-texte"><span class="cp-paye">PAYÉ</span><span class="cp-date">le ${datePaiementLabel}</span></span>
        </div>
      </div>`
      : ""
    : "";

  /* Bloc Paiement (factures). */
  const blocPaiement = estFacture
    ? `
      <div class="invoice-payment-block">
        <div class="ipb-title">Paiement</div>
        <div class="ipb-row">
          <span class="ipb-label">Statut du paiement</span>
          <span class="ipb-value ${estPaye ? "paid" : ""}">${estPaye ? "PAYÉ" : esc(d.statutPaiement ?? "En attente")}</span>
        </div>
        <div class="ipb-row">
          <span class="ipb-label">Mode de règlement</span>
          <span class="ipb-value">${formatPaymentMethodWithLogo(esc(d.modePaiement))}</span>
        </div>
        <div class="ipb-row">
          <span class="ipb-label">Date de règlement</span>
          <span class="ipb-value">${estPaye ? `le ${datePaiementLabel}` : "—"}</span>
        </div>
        ${d.devisSource ? `<div class="ipb-row"><span class="ipb-label">Devis d'origine</span><span class="ipb-value">${esc(d.devisSource)}</span></div>` : ""}
      </div>`
    : "";

  /* Déroulé du projet (proposition commerciale ancien gabarit). */
  const blocPhases =
    estProposition && d.phases && d.phases.length
      ? `
    <div class="section-heading" data-bloc data-heading>Déroulé du projet</div>
    <ul class="conditions-list phases-list" data-bloc>
      ${d.phases
        .map(
          (p) =>
            `<li><span class="phase-titre">${esc(p.titre)}</span><span class="phase-delai">${esc(p.delai)}</span></li>`,
        )
        .join("")}
    </ul>`
      : "";

  /* Lignes du tableau : la description est DÉCOUPÉE en fragments
   * (paragraphe / liste) et CHAQUE fragment est un bloc paginable —
   * une description plus longue qu'une page se poursuit sur la page
   * suivante, le tableau continue (cellules vides alignées, comme
   * dans Word). */
  const lignesTableau = d.items
    .map((it) => {
      const fragments = decouperHtmlRiche(descriptionOuPoints(it));
      const prix = formatCurrency(Number(it.prixUnitaire) || 0, d.devise);
      const totalLigne = formatCurrency((Number(it.quantite) || 0) * (Number(it.prixUnitaire) || 0), d.devise);
      if (!fragments.length) {
        return `
  <div class="svc-part svc-debut svc-fin" data-bloc>
    <div class="cell type-cell">${esc(it.type || "Service")}</div>
    <div class="cell desc-cell"><div class="service-name">${esc(it.designation)}</div></div>
    <div class="cell price-cell">${prix}</div>
    <div class="cell qty-cell">${Number(it.quantite) || 0}</div>
    <div class="cell total-cell">${totalLigne}</div>
  </div>`;
      }
      const parties = fragments.map((fragment, k) => {
        const debut = k === 0 ? " svc-debut" : "";
        const fin = k === fragments.length - 1 ? " svc-fin" : "";
        const tete = k === 0
          ? `<div class="cell type-cell">${esc(it.type || "Service")}</div>
    <div class="cell desc-cell"><div class="service-name">${esc(it.designation)}</div><div class="desc-riche">${fragment}</div></div>
    <div class="cell price-cell">${prix}</div>
    <div class="cell qty-cell">${Number(it.quantite) || 0}</div>
    <div class="cell total-cell">${totalLigne}</div>`
          : `<div class="cell cell-vide"></div>
    <div class="cell desc-cell"><div class="desc-riche">${fragment}</div></div>
    <div class="cell cell-vide"></div>
    <div class="cell cell-vide"></div>
    <div class="cell cell-vide"></div>`;
        return `
  <div class="svc-part${debut}${fin}" data-bloc>
    ${tete}
  </div>`;
      });
      return parties.join("");
    })
    .join("");

  /* Total SOUS le tableau : chiffres + lettres + TVA non
   * applicable (la rangée noire du pied de tableau est supprimée). */
  const blocTotal = `
  <div class="total-sous-tableau" data-bloc>
    <p><strong>Total&nbsp;:</strong> ${formatCurrency(total, d.devise)} <span class="total-lettres">(${esc(montantEnLettres(total, d.devise))})</span> — TVA non applicable</p>
  </div>`;

  /* Conditions + Bon pour accord (devis et propositions) — le délai
   * estimé suit IMMÉDIATEMENT la liste des CGV (« sans espace de
   * décalage ») ; l'espace de signature est agrandi. */
  const blocConditions = !estFacture
    ? `
    <div class="conditions-block" data-bloc>
      <div class="cb-left">
        <div class="cb-title">Conditions générales de vente</div>
        <ul class="cb-conditions-list">
          ${CONDITIONS_GENERALES.map((cond) => `<li>${esc(cond)}</li>`).join("")}
        </ul>
        ${delaiEstime ? `<p class="delai-apres-cgv"><strong>Délai estimé&nbsp;:</strong> ${esc(delaiEstime)}</p>` : ""}
      </div>
      <div class="cb-right">
        <div class="cb-title">Bon pour accord</div>
        <div class="cb-date-line">À _________________________ , le ____ / ____ / ______</div>
        <div class="signature-line">
          <div class="sig-label">Signature et cachet <span class="sig-separator">|</span> <span class="sig-quality-inline">Qualité de signataire</span></div>
        </div>
      </div>
    </div>`
    : "";

  /* Validité + notes. */
  const blocValiditeNotes = `
  <div class="validite-notes" data-bloc>
    <p><span class="vn-lbl">Validité du document&nbsp;:</span> ${Number(d.validiteJours) || 5} jours</p>
    ${d.notes ? `<p><span class="vn-lbl">Notes&nbsp;:</span> ${esc(d.notes)}</p>` : ""}
  </div>`;

  /* Coordonnées bancaires — VOLET 17 : IBAN, BIC puis TITULAIRE (la
   * ligne « Banque » est supprimée). */
  const blocBanque = `
  <div class="section-heading" data-bloc data-heading>Coordonnées bancaires</div>
  <div class="bank-block" data-bloc>
    <div class="bank-row"><span class="lbl">IBAN&nbsp;:</span> <span class="val">${esc(d.banque.iban)}</span></div>
    <div class="bank-row"><span class="lbl">BIC&nbsp;:</span> <span class="val">${esc(d.banque.bic)}</span></div>
    <div class="bank-row"><span class="lbl">Titulaire du compte&nbsp;:</span> <span class="val">${esc(d.banque.titulaire)}</span></div>
    <div class="bank-row"><span class="lbl">Mode de paiement&nbsp;:</span> <span class="val">${esc(d.modePaiement)}</span></div>
    <div class="bank-row"><span class="lbl">Conditions de règlement&nbsp;:</span> <span class="val">${esc(d.conditionsReglement)}</span></div>
  </div>
  ${
    d.lienPaiement
      ? `<div class="payment-link-section" data-bloc>
    <div class="section-heading" data-bloc data-heading>Lien de paiement en ligne</div>
    <div class="payment-link-block" data-bloc>
      <a class="payment-link-url" href="${esc(d.lienPaiement)}" target="_blank" rel="noopener noreferrer">${esc(d.lienPaiement)}</a>
    </div>
  </div>`
      : ""
  }`;

  /* FACTURE : signature manuscrite conservée. */
  const blocSignatureFacture = estFacture
    ? `
    <div class="signature-steve signature-steve--facture" data-bloc>
      <div class="sig-cursive">Stevens Akpovi</div>
      <div class="sig-caption">Stevens AKPOVI — ${esc(EMETTEUR.subText)} · ${esc(EMETTEUR.email)}</div>
    </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>${label} ${esc(d.numero)} — ${esc(d.client.nom)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #000000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* ---- Pages : A4, flux de blocs, marge 16 mm ---- */
  .ppage {
    position: relative;
    width: 210mm;
    height: 297mm;
    margin: 0 auto 8mm;
    background: #ffffff;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(0,0,0,0.28);
    padding: ${DEBUT_PX / 96 * 25.4}mm 16mm 0 16mm;
    break-after: page;
    page-break-after: always;
  }
  .ppage.ppage-fin { break-after: auto; page-break-after: auto; }
  @media print {
    body { background: #ffffff; }
    .ppage { margin: 0; box-shadow: none; }
  }
  .corps { position: relative; z-index: 1; }

  /* ---- Filigrane ---- */
  .wm {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    max-width: 150mm;
    opacity: 0.08;
    pointer-events: none;
    z-index: 0;
  }
  .wm img { width: 100%; height: auto; display: block; }

  /* ---- Entête ---- */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    margin-bottom: 2mm;
    min-height: 17mm;
  }
  .doc-header-left { display: flex; flex-direction: column; justify-content: center; }
  .doc-title {
    font-size: 26pt;
    font-weight: 800;
    color: #000000;
    line-height: 1.1;
    letter-spacing: -0.5px;
  }
  .doc-title.doc-title--long { font-size: 19pt; }
  .doc-title .doc-num { color: #000000; margin-left: 4px; }
  .doc-date {
    margin-top: 4px;
    font-size: 11pt;
    color: #6b7280;
    font-weight: 400;
  }
  /* VOLET 17 : le wordmark sous le logo est SUPPRIMÉ ; la hauteur
     du logo s'aligne sur le bloc « numéro + date » (17 mm). */
  .doc-header-right { display: flex; align-items: center; }
  .doc-logo { height: 17mm; width: auto; }

  .hr { border: 0; border-top: 1px solid #d1d5db; margin: 2mm 0; }

  /* ---- Émetteur / Destinataire ---- */
  .parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8mm;
    margin: 4mm 0;
  }
  .party-block .party-label {
    font-size: 9pt;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
    font-weight: 600;
  }
  .party-block .party-row {
    display: flex;
    font-size: 10pt;
    line-height: 1.6;
    margin-bottom: 0;
  }
  .party-block .party-row .lbl {
    color: #000000;
    min-width: 30mm;
    font-weight: 600;
  }
  .party-block .party-row .val {
    color: #000000;
    font-weight: 400;
  }
  .party-subtext {
    font-size: 9pt;
    color: #9ca3af;
    font-style: italic;
    margin: 0 0 1px 0;
    padding-left: 30mm;
    line-height: 1.4;
  }

  /* ---- Bloc remerciement (plus de ligne « Objet : ») ---- */
  .thank-you { margin: 2mm 0 4mm 0; }
  .thank-you-prefix {
    font-weight: 700;
    font-size: 11pt;
    color: #000000;
    margin-bottom: 2px;
  }
  .thank-you-body {
    font-size: 10pt;
    color: #1f2937;
    line-height: 1.4;
    max-width: 100%;
  }

  /* ---- Titre « Détail » ---- */
  .detail-heading {
    font-size: 13pt;
    font-weight: 700;
    color: #000000;
    margin: 4mm 0 3mm 0;
  }

  /* ---- Tableau des prestations : lignes-blocs paginables ---- */
  .svc-head, .svc-part {
    display: grid;
    grid-template-columns: 10% 49% 18% 7% 16%;
    width: 100%;
  }
  .svc-head {
    background: #000000;
    border: 1px solid #000000;
  }
  .svc-head .cell {
    color: #ffffff;
    font-size: 9.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 6px 8px;
    line-height: 1.35;
  }
  .svc-head .cell.num { text-align: right; }
  .svc-head .cell.center { text-align: center; }
  .svc-head .cell:first-child { text-align: center; }
  .svc-part {
    border-left: 1px solid #000000;
    border-right: 1px solid #000000;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  /* Dernier fragment d'une ligne : ferme le bas du tableau. */
  .svc-part.svc-fin { border-bottom: 1px solid #000000; }
  /* Fragment qui OUVRE une page : le tableau reprend avec un filet
     supérieur (posé par le moteur de pagination). */
  .svc-part.debut-page { border-top: 1px solid #000000; }
  .svc-part .cell {
    padding: 5px 8px;
    font-size: 9pt;
    line-height: 1.35;
    color: #1f2937;
    border-right: 1px solid #000000;
    vertical-align: top;
  }
  .svc-part .cell:last-child { border-right: 1px solid #000000; }
  .svc-part .cell.type-cell {
    font-weight: 600;
    color: #000000;
    text-align: center;
  }
  .svc-part .cell.price-cell { text-align: right; font-variant-numeric: tabular-nums; }
  .svc-part .cell.qty-cell { text-align: center; }
  .svc-part .cell.total-cell { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .service-name {
    font-weight: 700;
    color: #000000;
    margin-bottom: 3px;
    font-size: 10pt;
  }
  /* Description RÉDIGÉE (texte riche, mise en forme Word-like) —
     plus de puces carrées. */
  .desc-riche p { margin: 0 0 3px 0; font-size: 9pt; line-height: 1.5; color: #374151; }
  .desc-riche p:last-child { margin-bottom: 0; }
  .desc-riche b, .desc-riche strong { font-weight: 700; color: #111111; }
  .desc-riche i, .desc-riche em { font-style: italic; }
  .desc-riche u { text-decoration: underline; }
  /* « taille supérieure » (font size 5) : sous-titre */
  .desc-riche font[size="5"], .desc-riche .txt-sup {
    font-size: 10.5pt;
    font-weight: 600;
    color: #000000;
  }
  .desc-riche ul, .desc-riche ol { margin: 2px 0 4px 0; padding-left: 16px; }
  .desc-riche li { font-size: 9pt; line-height: 1.5; color: #374151; margin-bottom: 1px; }
  .desc-riche ul li { list-style-type: disc; }
  .desc-riche ol li { list-style-type: decimal; }

  /* ---- Total SOUS le tableau (plus de rangée noire) ---- */
  .total-sous-tableau { margin-top: 4mm; }
  .total-sous-tableau p {
    margin: 0;
    font-size: 11pt;
    color: #000000;
    line-height: 1.5;
  }
  .total-sous-tableau .total-lettres { color: #374151; font-style: italic; }

  /* ---- Conditions / Bon pour accord ---- */
  .conditions-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8mm;
    margin-top: 12mm;
  }
  .cb-left .cb-title, .cb-right .cb-title {
    font-size: 10.5pt;
    font-weight: 700;
    margin-bottom: 12px;
    color: #000000;
  }
  .cb-conditions-list { margin: 0; padding: 0; list-style: none; }
  .cb-conditions-list li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 4px;
    font-size: 9pt;
    color: #1f2937;
    line-height: 1.5;
  }
  .cb-conditions-list li::before {
    content: "■";
    color: #000000;
    position: absolute;
    left: 0;
    top: 0;
    font-size: 7pt;
    line-height: 1.8;
  }
  /* Délai estimé : À LA SUITE des CGV, sans décalage. */
  .delai-apres-cgv {
    margin: 2px 0 0 0;
    font-size: 9pt;
    color: #1f2937;
    line-height: 1.5;
  }
  .cb-right { padding-left: 0; border-left: none; }
  .cb-right .cb-title { margin-bottom: 8mm; }
  .cb-right .cb-date-line {
    font-size: 9pt;
    color: #6b7280;
    margin-bottom: 10mm;
  }
  /* VOLET 17 : espace de signature AGRANDI (18 mm → 30 mm). */
  .signature-line {
    margin-top: 30mm;
    border-top: 1px solid #000000;
    padding-top: 3px;
    font-size: 8.5pt;
    color: #6b7280;
  }
  .signature-line .sig-label { font-weight: 600; color: #000000; }
  .signature-line .sig-separator { color: #6b7280; margin: 0 4px; font-weight: 400; }
  .signature-line .sig-quality-inline { color: #6b7280; font-weight: 400; font-style: italic; }

  /* ---- Validité + notes ---- */
  .validite-notes { margin-top: 10mm; }
  .validite-notes p { margin: 0 0 3px 0; font-size: 9pt; line-height: 1.5; color: #1f2937; }
  .validite-notes .vn-lbl { color: #000000; font-weight: 600; }

  /* ---- Bloc Paiement (factures) ---- */
  .invoice-payment-block {
    background: rgba(75, 138, 107, 0.08);
    border: 1px solid rgba(75, 138, 107, 0.3);
    padding: 5px 12px;
    margin-top: 4mm;
    border-radius: 2px;
  }
  .ipb-title {
    font-size: 11pt;
    font-weight: 700;
    color: #000000;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .ipb-row {
    display: flex;
    justify-content: space-between;
    font-size: 10pt;
    padding: 3px 0;
  }
  .ipb-label { color: #6b7280; font-weight: 500; }
  .ipb-value { color: #000000; font-weight: 600; }
  .ipb-value.paid { color: #2E7D32; font-weight: 700; }

  /* ---- CACHET « PAYÉ » ---- */
  .cachet-bande {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 3mm;
    min-height: 0;
  }
  .cachet-paye {
    position: relative;
    width: 150pt;
    height: 58pt;
    transform: rotate(-17deg);
    opacity: 0.92;
  }
  .cachet-paye::before {
    content: "";
    position: absolute;
    inset: 0;
    border: 2.4pt solid #008000;
    border-radius: 2pt;
  }
  .cachet-paye::after {
    content: "";
    position: absolute;
    inset: 4.5pt;
    border: 0.9pt solid #008000;
    border-radius: 1pt;
  }
  .cachet-paye .cp-texte {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .cachet-paye .cp-paye {
    font-family: 'Times New Roman', Times, serif;
    font-weight: 700;
    font-size: 38pt;
    line-height: 0.95;
    color: #008000;
    letter-spacing: 1pt;
  }
  .cachet-paye .cp-date {
    margin-top: 1pt;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 9pt;
    color: #008000;
  }

  /* ---- Signature manuscrite (FACTURE uniquement) ---- */
  .signature-steve { margin-top: 8mm; }
  .signature-steve.signature-steve--facture { margin-top: 3mm; }
  .signature-steve .sig-cursive {
    font-family: 'Great Vibes', cursive;
    font-size: 21pt;
    line-height: 1.05;
    color: #1f2937;
  }
  .signature-steve .sig-caption {
    margin-top: 1pt;
    font-size: 8pt;
    color: #6b7280;
    line-height: 1.3;
  }

  /* ---- Coordonnées bancaires ---- */
  .section-heading {
    font-size: 14pt;
    font-weight: 700;
    color: #000000;
    margin: 14mm 0 4mm 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #d1d5db;
  }
  .bank-block { margin-top: 4mm; }
  .bank-row {
    display: flex;
    font-size: 10.5pt;
    padding: 3px 0;
    line-height: 1.5;
  }
  .bank-row .lbl {
    color: #000000;
    font-weight: 600;
    min-width: 50mm;
  }
  .bank-row .val {
    color: #000000;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
  .payment-link-section { margin-top: 12mm; }
  .payment-link-block { margin-top: 3mm; padding: 4mm 0; }
  .payment-link-url {
    color: #2563eb;
    font-weight: 500;
    text-decoration: underline;
    word-break: break-all;
    font-size: 10.5pt;
  }

  .conditions-list { margin: 4mm 0 0 0; padding: 0; list-style: none; }
  .conditions-list li {
    position: relative;
    padding-left: 16px;
    margin-bottom: 6px;
    font-size: 10.5pt;
    color: #1f2937;
    line-height: 1.5;
  }
  .conditions-list li::before {
    content: "■";
    color: #000000;
    position: absolute;
    left: 0;
    top: 0;
    font-size: 8pt;
    line-height: 1.8;
  }
  .phases-list li {
    display: flex;
    justify-content: space-between;
    gap: 8mm;
  }
  .phases-list .phase-titre { font-weight: 600; color: #000000; }
  .phases-list .phase-delai { color: #6b7280; font-size: 10pt; white-space: nowrap; }

  /* ---- Pied de page ---- */
  .pied {
    position: absolute;
    left: 16mm;
    right: 16mm;
    bottom: 6mm;
    z-index: 2;
  }
  .pied .footer-hr {
    border: 0;
    border-top: 1px solid #e5e7eb;
    margin-bottom: 4px;
  }
  .pied .footer-row {
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #6b7280;
  }
  .pied .footer-left .line-1 { font-weight: 400; color: #9ca3af; }
  .pied .footer-left .line-2 { color: #bcbcbc; }
  .pied .p-num { font-size: 8.5pt; color: #6b7280; }

  /* ---- Flux continu (repli sans script) ---- */
  #pc-flux { width: 178mm; margin: 0 auto; }
  #pc-gabarits { display: none; }
</style>
</head>
<body>

<div id="pc-flux">
  <!-- Entête : numéro + date à gauche, LOGO SEUL à droite -->
  <div class="doc-header" data-bloc>
    <div class="doc-header-left">
      <div class="doc-title ${estProposition ? "doc-title--long" : ""}">${label} <span class="doc-num">${esc(d.numero)}</span></div>
      <div class="doc-date">${dateLabel}</div>
    </div>
    <div class="doc-header-right">
      <img class="doc-logo" src="${esc(logoSrc)}" alt="Stevens Akpovi" />
    </div>
  </div>

  <div class="hr" data-bloc></div>

  <div class="parties" data-bloc>
    <div class="party-block">
      <div class="party-label">Emetteur</div>
      ${emetteurRows
        .map((r, i) => {
          const subText = i === 0 ? `<div class="party-subtext">${esc(emetteurSubText)}</div>` : "";
          return `<div class="party-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>${subText}`;
        })
        .join("")}
    </div>
    <div class="party-block">
      <div class="party-label">Destinataire</div>
      ${destinataireRows
        .map((r) => `<div class="party-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`)
        .join("")}
    </div>
  </div>

  <div class="hr" data-bloc></div>

  <div class="thank-you" data-bloc>
    <div class="thank-you-prefix">Merci pour votre confiance.</div>
    <div class="thank-you-body">${remerciement}</div>
  </div>

  <div class="detail-heading" data-bloc data-heading>Détail</div>

  <div class="svc-head" data-bloc data-heading>
    <div class="cell">Type</div>
    <div class="cell">Description</div>
    <div class="cell num">Prix unitaire</div>
    <div class="cell center">Qté</div>
    <div class="cell num">Total</div>
  </div>
  ${lignesTableau}
  ${blocTotal}

  ${cachetPaye}
  ${blocPaiement}
  ${blocConditions}
  ${blocValiditeNotes}
  ${blocPhases}
  ${blocBanque}
  ${blocSignatureFacture}
</div>

<!-- Gabarits clonés par le script de pagination -->
<div id="pc-gabarits" aria-hidden="true">
  <div class="pied">
    <hr class="footer-hr" />
    <div class="footer-row">
      <div class="footer-left">
        <div class="line-1">${label} ${esc(d.numero)}</div>
        <div class="line-2">Document confidentiel — Stevens AKPOVI</div>
      </div>
      <div class="p-num">Page 1 sur 1</div>
    </div>
  </div>
  <div class="wm"><img src="${esc(logoSrc)}" alt="Filigrane Stevens Akpovi" /></div>
</div>

<script>${fabriquerScriptPagination({
    limitePx: LIMITE_PX,
    debutP1Px: DEBUT_PX,
    debutNPx: DEBUT_PX,
    enteteCompacte: false,
    formatPage: "simple",
  })}</script>
</body>
</html>`;

  return html;
}
