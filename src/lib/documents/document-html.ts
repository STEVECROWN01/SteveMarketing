/**
 * Rendu HTML des documents (VOLET 14, 24/11/2026) — A4, deux pages
 * pour les devis et propositions, une page pour les factures.
 *
 * TEMPLATE COPIÉ DU PROJET K.QUOTES de l'éditeur
 * (github.com/STEVECROWN01/K.Quotes — src/components/keter/
 * document-html.ts) : même organisation visuelle, mêmes couleurs
 * (bandeaux noirs, typographie Inter, filets gris), mêmes blocs
 * (Émetteur/Destinataire, « Merci pour votre confiance. », tableau
 * Détail, bandeau TOTAL noir, Conditions/Bon pour accord, page
 * Coordonnées bancaires, mentions de bas de page), adapté à
 * l'identité « Stevens Akpovi » :
 *  - lignes de prestations LIBRES (au lieu des prestations fixes
 *    CV/LinkedIn de K.Quotes) ;
 *  - logo et wordmark STEVENS AKPOVI (public/assets/logo-noir.png) ;
 *  - SIGNATURE MANUSCRITE de Stevens (police cursive Great Vibes)
 *    sur chaque document — demande de l'éditeur : « tous les
 *    documents doivent porter mon logo. Voilà. Et ma signature. » ;
 *  - FACTURE : CACHET « PAYÉ » reproduit du projet MRSTEVEENGLISH
 *    de l'éditeur (github.com/STEVECROWN01/MrSteveEnglish —
 *    src/lib/receipt.ts) : cadre DOUBLE vert pur #008000 (150×58 pt
 *    à l'extérieur, trait 2,4 pt ; intérieur 141×49 pt, trait
 *    0,9 pt), inclinaison MONTANTE « / » de −17°, « PAYÉ » en Times
 *    bold 38 pt, date « le JJ/MM/AAAA » en 9 pt dessous, opacité
 *    0,92 — posé dans une bande dédiée, sous les totaux, comme dans
 *    le reçu original ;
 *  - PROPOSITION COMMERCIALE : mêmes codes, page 2 enrichie du
 *    DÉROULÉ DU PROJET (phases et délais).
 *
 * Utilisé par :
 *  - l'aperçu en direct du back-office (iframe srcDoc, ApercuDocument) ;
 *  - la route /api/documents/pdf (Puppeteer setContent → page.pdf).
 * Le marqueur « PAGE 2 » ci-dessous sert au découpage de l'aperçu.
 */

import type { DocumentRecord } from "./types";
import { LABELS_DOC } from "./types";
import { formatDate, formatDateCourte, formatCurrency } from "./format";
import { EMETTEUR, CONDITIONS_GENERALES } from "./defaults";
import { formatPaymentMethodWithLogo } from "./payment-logos";

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDocumentHtml(
  d: DocumentRecord,
  logoSrc: string = "/assets/logo-noir.png",
): string {
  const label = LABELS_DOC[d.docType];
  const estProposition = d.docType === "proposition";
  const estFacture = d.docType === "facture";
  const nbPages = estFacture ? 1 : 2;
  const dateLabel = formatDate(d.date);
  const datePaiementLabel = d.datePaiement ? formatDateCourte(d.datePaiement) : formatDateCourte(d.date);

  const total = d.items.reduce((s, it) => s + (Number(it.quantite) || 0) * (Number(it.prixUnitaire) || 0), 0);

  const emetteurRows: [string, string][] = [
    ["Société :", EMETTEUR.societe],
    ["IFU :", EMETTEUR.ifu],
    ["RCCM :", EMETTEUR.rccm],
    ["Votre contact :", EMETTEUR.contact],
    ["Adresse :", EMETTEUR.adresse],
    ["Pays :", EMETTEUR.pays],
  ];
  const emetteurSubText = EMETTEUR.subText;

  const c = d.client;
  const destinataireRows: [string, string][] = [
    ...(c.entreprise ? ([["Entreprise :", esc(c.entreprise)]] as [string, string][]) : []),
    ["Nom :", esc(c.nom) || "—"],
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
     l'en-tête du fichier). Affiché sur les factures réglées ; la
     bande dédiée centrée sous les totaux ne masque aucune ligne. */
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

  /* Bloc Paiement (factures) — structure K.Quotes. */
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

  /* Conditions + Bon pour accord (devis et propositions). */
  const blocConditions = !estFacture
    ? `
    <div class="conditions-block ${d.items.length > 1 ? "conditions-block-multi" : ""}">
      <div class="cb-left">
        <div class="cb-title">Conditions générales de vente</div>
        <ul class="cb-conditions-list">
          ${CONDITIONS_GENERALES.map((cond) => `<li>${esc(cond)}</li>`).join("")}
        </ul>
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

  /* Déroulé du projet (proposition, page 2). */
  const blocPhases =
    estProposition && d.phases && d.phases.length
      ? `
    <div class="section-heading">Déroulé du projet</div>
    <ul class="conditions-list phases-list">
      ${d.phases
        .map(
          (p) =>
            `<li><span class="phase-titre">${esc(p.titre)}</span><span class="phase-delai">${esc(p.delai)}</span></li>`,
        )
        .join("")}
    </ul>`
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>${label} ${esc(d.numero)} — ${esc(d.client.nom)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet">
<style>
  /* ---- Page : A4, marge nulle, une ou deux pages ---- */
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
  .page {
    position: relative;
    width: 210mm;
    height: 297mm;
    padding: 16mm 16mm 10mm 16mm;
    background: #ffffff;
    overflow: hidden;
  }
  .page.page1 { page-break-after: always; }
  .page.page1.no-next { page-break-after: auto; }

  /* ---- Filigrane (à peine visible) ---- */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    max-width: 150mm;
    opacity: 0.08;
    pointer-events: none;
    z-index: 0;
  }
  .watermark img { width: 100%; height: auto; display: block; }

  .page-content, .page2-content { position: relative; z-index: 1; }

  /* ---- Page 1 : entête ---- */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2mm;
  }
  .doc-header-left { display: flex; flex-direction: column; }
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
  .doc-header-right { display: flex; align-items: flex-start; }
  .doc-logo { width: 14mm; height: auto; }
  .doc-logo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5mm;
  }
  .doc-logo-wordmark {
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-align: center;
    line-height: 1;
    white-space: nowrap;
    color: #000000;
  }

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

  /* ---- Bloc remerciement / objet ---- */
  .thank-you { margin: 2mm 0 4mm 0; }
  .thank-you-prefix {
    font-weight: 700;
    font-size: 11pt;
    color: #000000;
    margin-bottom: 2px;
  }
  .thank-you-objet {
    font-weight: 600;
    font-size: 10pt;
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

  /* ---- Tableau des prestations ---- */
  .services-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border: 1px solid #000000;
  }
  .services-table thead th {
    background: #000000;
    color: #ffffff;
    font-size: 9.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 6px 8px;
    text-align: left;
    border-right: 1px solid #333333;
  }
  .services-table thead th:last-child { border-right: none; }
  .services-table thead th.num { text-align: right; }
  .services-table thead th.center { text-align: center; }
  .services-table thead th:first-child { text-align: center; }

  .services-table tbody td {
    padding: 5px 8px;
    vertical-align: top;
    border-bottom: 1px solid #000000;
    border-right: 1px solid #000000;
    font-size: 9pt;
    line-height: 1.35;
    color: #1f2937;
  }
  .services-table tbody td:last-child { border-right: 1px solid #000000; }
  .services-table tbody td.type-cell {
    font-weight: 600;
    color: #000000;
    font-size: 9pt;
    width: 10%;
    text-align: center;
  }
  .services-table tbody td.desc-cell { width: 49%; }
  .services-table tbody td.price-cell { width: 18%; text-align: right; font-variant-numeric: tabular-nums; }
  .services-table tbody td.qty-cell { width: 7%; text-align: center; }
  .services-table tbody td.total-cell { width: 16%; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }

  .service-name {
    font-weight: 700;
    color: #000000;
    margin-bottom: 2px;
    font-size: 10pt;
  }
  .service-bullets { margin: 0 0 3px 0; padding: 0; list-style: none; }
  .service-bullets li {
    position: relative;
    padding-left: 10px;
    margin-bottom: 0;
    font-size: 9pt;
    color: #374151;
    line-height: 1.5;
  }
  .service-bullets li::before {
    content: "■";
    color: #000000;
    position: absolute;
    left: 0;
    top: 0;
    font-size: 8pt;
    line-height: 1.7;
  }
  .service-delivery {
    font-style: italic;
    color: #6b7280;
    font-size: 9pt;
    margin-top: 3px;
    line-height: 1.4;
  }

  /* TOTAL — bandeau noir unique, sans division verticale */
  .services-table tfoot tr { background: #000000; }
  .services-table tfoot td {
    background: #000000;
    color: #ffffff;
    padding: 8px 10px;
    font-weight: 700;
    font-size: 10.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: none !important;
  }
  .services-table tfoot td.total-label {
    text-align: left;
    width: 50%;
    white-space: nowrap;
  }
  .services-table tfoot td.total-amount {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    width: 50%;
    min-width: 0;
    padding-left: 4px;
  }

  /* ---- Conditions / Bon pour accord ---- */
  .conditions-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8mm;
    margin-top: 12mm;
  }
  .conditions-block.conditions-block-multi { margin-top: 6mm; }
  .cb-left .cb-title, .cb-right .cb-title {
    font-size: 10.5pt;
    font-weight: 700;
    margin-bottom: 12px;
    color: #000000;
  }
  .cb-left .cb-row {
    font-size: 9pt;
    margin-bottom: 1px;
    line-height: 1.5;
    color: #1f2937;
  }
  .cb-left .cb-row .lbl { color: #000000; font-weight: 600; }
  .cb-left .cb-row .val { color: #000000; font-weight: 400; }
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
  .cb-right { padding-left: 0; border-left: none; }
  .cb-right .cb-title { margin-bottom: 8mm; }
  .cb-right .cb-date-line {
    font-size: 9pt;
    color: #6b7280;
    margin-bottom: 10mm;
  }
  .signature-line {
    margin-top: 18mm;
    border-top: 1px solid #000000;
    padding-top: 3px;
    font-size: 8.5pt;
    color: #6b7280;
  }
  .signature-line .sig-label { font-weight: 600; color: #000000; }
  .signature-line .sig-separator { color: #6b7280; margin: 0 4px; font-weight: 400; }
  .signature-line .sig-quality-inline { color: #6b7280; font-weight: 400; font-style: italic; }

  /* ---- Bloc Paiement (factures) — structure K.Quotes ---- */
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

  /* ---- CACHET « PAYÉ » — style MrSteveEnglish (reproduction) ----
     Cadre double vert pur #008000 : extérieur 150×58 pt (trait
     2,4 pt), intérieur (trait 0,9 pt à 4,5 pt du bord), inclinaison
     MONTANTE « / » de −17°, « PAYÉ » Times bold 38 pt + date 9 pt,
     opacité 0,92. Bande dédiée centrée sous les totaux : ne masque
     aucune ligne (leçon QA du reçu original). */
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

  /* ---- Signature manuscrite de Stevens ---- */
  .signature-steve { margin-top: 8mm; }
  /* FACTURE : signature compacte — la page unique accumule cachet et
     bloc Paiement ; sans compacité, la signature descendait dans le
     pied de page (chevauchement mesuré au contrôle visuel volet 14). */
  .signature-steve.signature-steve--facture { margin-top: 3mm; }
  .signature-steve .sig-cursive {
    font-family: 'Great Vibes', cursive;
    font-size: 26pt;
    line-height: 1.05;
    color: #1f2937;
  }
  .signature-steve.signature-steve--facture .sig-cursive { font-size: 21pt; }
  .signature-steve .sig-caption {
    margin-top: 1pt;
    font-size: 8.5pt;
    color: #6b7280;
    line-height: 1.3;
  }
  .signature-steve.signature-steve--facture .sig-caption { font-size: 8pt; }

  /* ---- Pied de page ---- */
  .doc-footer {
    position: absolute;
    left: 16mm;
    right: 16mm;
    bottom: 6mm;
    z-index: 2;
  }
  .doc-footer .footer-hr {
    border: 0;
    border-top: 1px solid #e5e7eb;
    margin-bottom: 4px;
  }
  .doc-footer .footer-row {
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #6b7280;
  }
  .doc-footer .footer-left .line-1 { font-weight: 400; color: #9ca3af; }
  .doc-footer .footer-left .line-2 { color: #bcbcbc; }

  /* ---- Page 2 : banque + déroulé + conditions ---- */
  .section-heading {
    font-size: 14pt;
    font-weight: 700;
    color: #000000;
    margin: 0 0 4mm 0;
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
  .payment-link-row {
    display: flex;
    margin-top: 3px;
    padding: 3px 0;
    font-size: 10.5pt;
    line-height: 1.5;
  }
  .payment-link-row .lbl {
    color: #000000;
    font-weight: 600;
    min-width: 50mm;
  }
  .payment-link-row .val {
    color: #000000;
    font-weight: 400;
    word-break: break-all;
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

  .conditions-section { margin-top: 14mm; }
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

  .shalom {
    margin-top: 12mm;
    text-align: center;
    font-weight: 800;
    color: #000000;
    font-size: 13pt;
    letter-spacing: 1px;
  }
</style>
</head>
<body>

<!-- ============ PAGE 1 ============ -->
<div class="page page1 ${estFacture ? "no-next" : ""}">
  <div class="watermark"><img src="${logoSrc}" alt="Filigrane Stevens Akpovi" /></div>

  <div class="page-content">
    <div class="doc-header">
      <div class="doc-header-left">
        <div class="doc-title ${estProposition ? "doc-title--long" : ""}">${label} <span class="doc-num">${esc(d.numero)}</span></div>
        <div class="doc-date">${dateLabel}</div>
      </div>
      <div class="doc-header-right">
        <div class="doc-logo-container">
          <img class="doc-logo" src="${logoSrc}" alt="Stevens Akpovi" />
          <div class="doc-logo-wordmark">STEVENS AKPOVI</div>
        </div>
      </div>
    </div>

    <hr class="hr" />

    <div class="parties">
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

    <hr class="hr" />

    <div class="thank-you">
      <div class="thank-you-prefix">Merci pour votre confiance.</div>
      <div class="thank-you-objet">Objet : ${esc(d.objet)}.</div>
      <div class="thank-you-body">${remerciement}</div>
    </div>

    <div class="detail-heading">Détail</div>

    <table class="services-table">
      <thead>
        <tr>
          <th style="width: 10%">Type</th>
          <th style="width: 49%">Description</th>
          <th class="num" style="width: 18%">Prix unitaire</th>
          <th class="center" style="width: 7%">Qté</th>
          <th class="num" style="width: 16%">Total</th>
        </tr>
      </thead>
      <tbody>
        ${d.items
          .map(
            (it) => `
        <tr>
          <td class="type-cell">${esc(it.type)}</td>
          <td class="desc-cell">
            <div class="service-name">${esc(it.designation)}</div>
            ${(it.points && it.points.length)
              ? `<ul class="service-bullets">
                ${it.points.filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join("")}
              </ul>`
              : ""}
            ${it.mentionLivraison ? `<div class="service-delivery">${esc(it.mentionLivraison)}</div>` : ""}
          </td>
          <td class="price-cell">${formatCurrency(Number(it.prixUnitaire) || 0, d.devise)}</td>
          <td class="qty-cell">${Number(it.quantite) || 0}</td>
          <td class="total-cell">${formatCurrency((Number(it.quantite) || 0) * (Number(it.prixUnitaire) || 0), d.devise)}</td>
        </tr>`,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="total-label">TOTAL</td>
          <td colspan="2" class="total-amount">${formatCurrency(total, d.devise)}</td>
        </tr>
      </tfoot>
    </table>

    ${cachetPaye}
    ${blocPaiement}
    ${blocConditions}
    ${estFacture ? `
    <div class="signature-steve signature-steve--facture">
      <div class="sig-cursive">Stevens Akpovi</div>
      <div class="sig-caption">Stevens AKPOVI — ${esc(EMETTEUR.subText)} · ${esc(EMETTEUR.email)}</div>
    </div>` : ""}
  </div>

  <div class="doc-footer">
    <hr class="footer-hr" />
    <div class="footer-row">
      <div class="footer-left">
        <div class="line-1">${label} ${esc(d.numero)}</div>
        <div class="line-2">Document confidentiel — Stevens AKPOVI</div>
      </div>
      <div class="footer-right">Page 1 sur ${nbPages}</div>
    </div>
  </div>
</div>

${
  estFacture
    ? ""
    : `
<!-- ============ PAGE 2 ============ -->
<div class="page">
  <div class="watermark"><img src="${logoSrc}" alt="Filigrane Stevens Akpovi" /></div>

  <div class="page2-content">
    ${blocPhases}

    <div class="section-heading" style="${blocPhases ? "margin-top:12mm" : ""}">Coordonnées bancaires</div>

    <div class="bank-block">
      <div class="bank-row"><span class="lbl">Titulaire du compte :</span> <span class="val">${esc(d.banque.titulaire)}</span></div>
      <div class="bank-row"><span class="lbl">IBAN :</span> <span class="val">${esc(d.banque.iban)}</span></div>
      <div class="bank-row"><span class="lbl">BIC :</span> <span class="val">${esc(d.banque.bic)}</span></div>
      <div class="bank-row"><span class="lbl">Banque :</span> <span class="val">${esc(d.banque.banque)}</span></div>
      <div class="bank-row"><span class="lbl">Mode de paiement :</span> <span class="val">${esc(d.modePaiement)}</span></div>
      <div class="bank-row"><span class="lbl">Conditions de règlement :</span> <span class="val">${esc(d.conditionsReglement)}</span></div>
    </div>

    ${
      d.lienPaiement
        ? `<div class="payment-link-section">
             <div class="section-heading">Lien de paiement en ligne</div>
             <div class="payment-link-block">
               <a class="payment-link-url" href="${esc(d.lienPaiement)}" target="_blank" rel="noopener noreferrer">${esc(d.lienPaiement)}</a>
             </div>
           </div>`
        : ""
    }

    <div class="conditions-section">
      <div class="cb-row" style="font-size:9pt;margin-bottom:3px;line-height:1.5;color:#1f2937;">
        <span style="color:#000000;font-weight:600;">Validité du document :</span>
        <span style="color:#000000;font-weight:400;"> ${Number(d.validiteJours) || 5} jours</span>
      </div>
      <div class="cb-row" style="font-size:9pt;margin-bottom:3px;line-height:1.5;color:#1f2937;">
        <span style="color:#000000;font-weight:600;">Notes :</span>
        <span style="color:#000000;font-weight:400;"> ${esc(d.notes)}</span>
      </div>
      <div class="signature-steve">
        <div class="sig-cursive">Stevens Akpovi</div>
        <div class="sig-caption">Stevens AKPOVI — ${esc(EMETTEUR.subText)}<br/>${esc(EMETTEUR.email)} · ${esc(EMETTEUR.siteWeb)}</div>
      </div>
      <div class="shalom">SHALOM ALEIKHEM</div>
    </div>
  </div>

  <div class="doc-footer">
    <hr class="footer-hr" />
    <div class="footer-row">
      <div class="footer-left">
        <div class="line-1">${label} ${esc(d.numero)}</div>
        <div class="line-2">Document confidentiel — Stevens AKPOVI</div>
      </div>
      <div class="footer-right">Page 2 sur 2</div>
    </div>
  </div>
</div>
`
}

</body>
</html>`;
}
