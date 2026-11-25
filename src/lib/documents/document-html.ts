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
 *
 * VOLET 18 (26/11/2026) — BILINGUE FR/EN : la langue du document
 * (d.langue, défaut "fr") choisit les LIBELLÉS du gabarit (objet
 * LIBELLES ci-dessous), le montant en lettres et la date. Les
 * PROPOSITIONS commerciales restent TOUJOURS en français. Ni la
 * structure du HTML, ni le CSS, ni la pagination ne changent :
 * seuls les TEXTES suivent la langue.
 */

import { getPaymentMethodLogo } from "./payment-logos";
import { montantEnLettres, formatDate, formatDateCourte, formatCurrency } from "./format";
import { descriptionOuPoints, decouperHtmlRiche } from "./texte-riche";
import { fabriquerScriptPagination } from "./pagination-flux";
import { LABELS_DOC, type DocumentRecord } from "./types";
import { EMETTEUR, CONDITIONS_GENERALES, CONDITIONS_GENERALES_EN, TEXTES_DEFAUT } from "./defaults";

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

/* ------------------------------------------------------------------
 * VOLET 18 (26/11/2026) — INTERNATIONALISATION DU GABARIT
 *
 * Tous les libellés du gabarit devis/facture vivent dans LIBELLES,
 * extraits MOT POUR MOT du code existant (les valeurs "fr" sont la
 * référence historique). Le rendu choisit la colonne selon
 * d.langue ?? "fr" (const L en tête de renderDocumentHtml) : ni la
 * structure du HTML, ni le CSS, ni la pagination ne changent —
 * seuls les TEXTES suivent la langue du document.
 * ------------------------------------------------------------------ */
const LIBELLES: Record<"fr" | "en", Record<string, string>> = {
  fr: {
    /* Titres du document */
    titreDevis: "Devis",
    titreFacture: "Facture",
    /* Blocs émetteur / destinataire */
    emetteur: "Emetteur",
    destinataire: "Destinataire",
    professionnel: "Professionnel :",
    ifu: "IFU :",
    adresse: "Adresse :",
    pays: "Pays :",
    entreprise: "Entreprise :",
    nom: "Nom :",
    ville: "Ville :",
    telephone: "Téléphone :",
    email: "Email :",
    /* Introduction / remerciements */
    merci: "Merci pour votre confiance.",
    remerciementFacture: "Nous remercions notre client pour sa confiance.",
    /* Tableau « Détail » */
    detail: "Détail",
    colType: "Type",
    colDescription: "Description",
    colPrixUnitaire: "Prix unitaire",
    colQte: "Qté",
    colTotal: "Total",
    service: "Service",
    /* Total sous le tableau */
    total: "Total&nbsp;:",
    tvaNonApplicable: "TVA non applicable",
    /* Conditions / bon pour accord */
    cgv: "Conditions générales de vente",
    delaiEstime: "Délai estimé&nbsp;:",
    bonPourAccord: "Bon pour accord",
    dateSignature: "À _________________________ , le ____ / ____ / ______",
    signatureEtCachet: "Signature et cachet",
    qualiteSignataire: "Qualité de signataire",
    /* Validité + notes */
    validite: "Validité du document&nbsp;:",
    jours: "jours",
    notes: "Notes&nbsp;:",
    /* Coordonnées bancaires */
    coordonneesBancaires: "Coordonnées bancaires",
    iban: "IBAN&nbsp;:",
    bic: "BIC&nbsp;:",
    titulaireCompte: "Titulaire du compte&nbsp;:",
    modePaiement: "Mode de paiement&nbsp;:",
    conditionsReglement: "Conditions de règlement&nbsp;:",
    lienPaiement: "Lien de paiement en ligne",
    /* Facture : bloc paiement + cachet */
    paiement: "Paiement",
    statutPaiement: "Statut du paiement",
    paye: "PAYÉ",
    enAttente: "En attente",
    modeReglement: "Mode de règlement",
    dateReglement: "Date de règlement",
    devisOrigine: "Devis d'origine",
    le: "le",
    /* Proposition (déroulé — toujours affiché en français) */
    deroule: "Déroulé du projet",
    /* Pied de page */
    piedConfidentiel: "Document confidentiel — Stevens AKPOVI",
    page: "Page 1 sur 1",
  },
  en: {
    /* Document titles */
    titreDevis: "Quote",
    titreFacture: "Invoice",
    /* Issuer / recipient blocks */
    emetteur: "Issuer",
    destinataire: "Recipient",
    professionnel: "Professional:",
    ifu: "IFU:",
    adresse: "Address:",
    pays: "Country:",
    entreprise: "Company:",
    nom: "Name:",
    ville: "City:",
    telephone: "Phone:",
    email: "Email:",
    /* Introduction / thanks */
    merci: "Thank you for your trust.",
    remerciementFacture: "We thank our client for their trust.",
    /* Details table */
    detail: "Details",
    colType: "Type",
    colDescription: "Description",
    colPrixUnitaire: "Unit price",
    colQte: "Qty",
    colTotal: "Total",
    service: "Service",
    /* Total below the table */
    total: "Total:",
    tvaNonApplicable: "VAT not applicable",
    /* Terms / approval */
    cgv: "Terms and conditions",
    delaiEstime: "Estimated delivery time:",
    bonPourAccord: "Approved by",
    dateSignature: "At _________________________ , on ____ / ____ / ______",
    signatureEtCachet: "Signature and stamp",
    qualiteSignataire: "Signatory title",
    /* Validity + notes */
    validite: "Document validity:",
    jours: "days",
    notes: "Notes:",
    /* Bank details */
    coordonneesBancaires: "Bank details",
    iban: "IBAN:",
    bic: "BIC:",
    titulaireCompte: "Account holder:",
    modePaiement: "Payment method:",
    conditionsReglement: "Payment terms:",
    lienPaiement: "Online payment link",
    /* Invoice: payment block + stamp */
    paiement: "Payment",
    statutPaiement: "Payment status",
    paye: "PAID",
    enAttente: "Pending",
    modeReglement: "Payment method",
    dateReglement: "Payment date",
    devisOrigine: "Original quote",
    le: "on",
    /* Proposition (roadmap — propositions stay in French) */
    deroule: "Project roadmap",
    /* Footer */
    piedConfidentiel: "Confidential document — Stevens AKPOVI",
    page: "Page 1 of 1",
  },
};

/* VOLET 18 — valeurs ENREGISTRÉES connues, traduites à l'AFFICHAGE :
 * mode de paiement et condition de règlement par défaut. La table
 * est BIDIRECTIONNELLE — un document français téléchargé en version
 * anglaise affiche « Bank transfer »/« Upon receipt », un document
 * créé en anglais puis téléchargé en français retrouve « Virement
 * bancaire »/« À réception » ; une valeur inconnue (texte
 * personnalisé) reste telle quelle. */
const TRADUCTIONS_VALEURS: Record<string, string> = {
  [TEXTES_DEFAUT.fr.modePaiement]: TEXTES_DEFAUT.en.modePaiement,
  [TEXTES_DEFAUT.fr.conditionsReglement]: TEXTES_DEFAUT.en.conditionsReglement,
};
const TRADUCTIONS_INVERSEES: Record<string, string> = Object.fromEntries(
  Object.entries(TRADUCTIONS_VALEURS).map(([fr, en]) => [en, fr]),
);

function traduireValeur(valeur: string, langue: "fr" | "en"): string {
  if (langue === "en") return TRADUCTIONS_VALEURS[valeur] ?? valeur;
  return TRADUCTIONS_INVERSEES[valeur] ?? valeur;
}

/* VOLET 18 — badge du mode de paiement (bloc Paiement des
 * factures) : le LOGO vit sous les clés FRANÇAISES de
 * payment-logos.ts — si la valeur enregistrée est déjà la
 * traduction anglaise, on cherche la clé d'origine ; le LIBELLÉ
 * affiché suit la langue du document. */
function badgeModePaiement(mode: string, langue: "fr" | "en"): string {
  const libelle = traduireValeur(mode, langue);
  const logoUri =
    getPaymentMethodLogo(mode) ??
    getPaymentMethodLogo(TRADUCTIONS_INVERSEES[mode] ?? mode);
  if (!logoUri) return esc(libelle);
  return `<img src="${logoUri}" alt="${esc(libelle)}" style="height:16px; vertical-align:middle; margin-right:6px;" />${esc(libelle)}`;
}

/* VOLET 18 — PIED DE PAGE ANGLAIS : le moteur de pagination
 * (pagination-flux.ts, NON modifiable) écrit « Page X sur Y » en
 * français. Ce petit observateur — embarqué UNIQUEMENT dans les
 * documents anglais — réécrit « Page X of Y » après chaque passe de
 * pagination (les pages sont reconstruites quand les polices web
 * arrivent). Aucune structure ni CSS n'est touchée : seul le TEXTE
 * du numéro de page change. */
const SCRIPT_PIED_PAGE_EN = `
(function () {
  var RE = /^Page (\\d+) sur (\\d+)$/;
  function traduire() {
    var elts = document.querySelectorAll('.p-num');
    for (var i = 0; i < elts.length; i++) {
      var m = RE.exec((elts[i].textContent || '').trim());
      if (m) elts[i].textContent = 'Page ' + m[1] + ' of ' + m[2];
    }
  }
  traduire();
  if (window.MutationObserver) {
    new MutationObserver(traduire).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
})();
`;

export function renderDocumentHtml(
  d: DocumentRecord,
  logoSrc: string = "/assets/logo-noir.png",
): string {
  /* VOLET 18 — LANGUE DU DOCUMENT : les devis et factures suivent
   * d.langue ("fr" par défaut) ; les PROPOSITIONS commerciales
   * restent TOUJOURS en français (template calibré — consigne de
   * l'éditeur). Tous les libellés du gabarit passent par L. */
  const langue: "fr" | "en" = d.docType === "proposition" ? "fr" : d.langue ?? "fr";
  const L = LIBELLES[langue];
  const estProposition = d.docType === "proposition";
  const estFacture = d.docType === "facture";
  /* Titre du document : traduit pour devis/facture ; LABELS_DOC
   * (français) pour la proposition commerciale. */
  const label = estProposition
    ? LABELS_DOC[d.docType]
    : estFacture
      ? L.titreFacture
      : L.titreDevis;
  const dateLabel = formatDate(d.date, langue);
  const datePaiementLabel = d.datePaiement ? formatDateCourte(d.datePaiement) : formatDateCourte(d.date);

  const total = d.items.reduce((s, it) => s + (Number(it.quantite) || 0) * (Number(it.prixUnitaire) || 0), 0);

  /* Délai estimé : champ du document, sinon mention de la première
   * ligne (anciens documents). */
  const delaiEstime =
    (d.delaiEstime ?? "").trim() ||
    (d.items.find((it) => (it.mentionLivraison ?? "").trim())?.mentionLivraison ?? "");

  const emetteurRows: [string, string][] = [
    [L.professionnel, `<strong>${esc(EMETTEUR.societe)}</strong>`],
    [L.ifu, EMETTEUR.ifu],
    [L.adresse, EMETTEUR.adresse],
    [L.pays, langue === "en" ? EMETTEUR.paysEn : EMETTEUR.pays],
  ];
  /* VOLET 18 — sous-texte de l'émetteur traduit (defaults.ts). */
  const emetteurSubText = langue === "en" ? EMETTEUR.subTextEn : EMETTEUR.subText;

  const c = d.client;
  const destinataireRows: [string, string][] = [
    ...(c.entreprise ? ([[L.entreprise, esc(c.entreprise)]] as [string, string][]) : []),
    [L.nom, `<strong>${esc(c.nom) || "—"}</strong>`],
    [L.ville, esc(c.ville) || "—"],
    [L.pays, esc(c.pays) || "—"],
    [L.telephone, esc(c.telephone) || "—"],
    [
      L.email,
      c.email
        ? `<a href="mailto:${esc(c.email)}" style="color:#2563eb;text-decoration:none;font-weight:500;">${esc(c.email)}</a>`
        : "—",
    ],
  ];

  /* VOLET 18 — remerciement de facture traduit (l'intro est rédigée
   * par l'éditeur : elle reste telle quelle). */
  const remerciement = estFacture
    ? `${esc(d.intro)} ${L.remerciementFacture}`
    : esc(d.intro);

  /* Cachet « PAYÉ » — reproduction du style MrSteveEnglish (voir
     l'historique) ; factures réglées uniquement. VOLET 18 : libellé
     et préfixe de date traduits. */
  const estPaye = d.statutPaiement === "Payé";
  /* VOLET 18 — statut AFFICHÉ : la valeur enregistrée reste
   * française ("Payé"/"En attente", donnée du document) ; la
   * version anglaise affiche PAID / Pending. */
  const statutAffiche = estPaye
    ? L.paye
    : langue === "en"
      ? L.enAttente
      : d.statutPaiement ?? "En attente";
  const cachetPaye = estFacture
    ? estPaye
      ? `
      <div class="cachet-bande">
        <div class="cachet-paye" role="img" aria-label="Cachet payé">
          <span class="cp-texte"><span class="cp-paye">${L.paye}</span><span class="cp-date">${L.le} ${datePaiementLabel}</span></span>
        </div>
      </div>`
      : ""
    : "";

  /* Bloc Paiement (factures) — VOLET 18 : libellés traduits, mode
     de paiement affiché dans la langue (badge conservé). */
  const blocPaiement = estFacture
    ? `
      <div class="invoice-payment-block">
        <div class="ipb-title">${L.paiement}</div>
        <div class="ipb-row">
          <span class="ipb-label">${L.statutPaiement}</span>
          <span class="ipb-value ${estPaye ? "paid" : ""}">${statutAffiche}</span>
        </div>
        <div class="ipb-row">
          <span class="ipb-label">${L.modeReglement}</span>
          <span class="ipb-value">${badgeModePaiement(d.modePaiement, langue)}</span>
        </div>
        <div class="ipb-row">
          <span class="ipb-label">${L.dateReglement}</span>
          <span class="ipb-value">${estPaye ? `${L.le} ${datePaiementLabel}` : "—"}</span>
        </div>
        ${d.devisSource ? `<div class="ipb-row"><span class="ipb-label">${L.devisOrigine}</span><span class="ipb-value">${esc(d.devisSource)}</span></div>` : ""}
      </div>`
    : "";

  /* Déroulé du projet (proposition commerciale ancien gabarit) —
     VOLET 18 : les propositions restent en français (L = fr). */
  const blocPhases =
    estProposition && d.phases && d.phases.length
      ? `
    <div class="section-heading" data-bloc data-heading>${L.deroule}</div>
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
    <div class="cell type-cell">${esc(it.type || L.service)}</div>
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
          ? `<div class="cell type-cell">${esc(it.type || L.service)}</div>
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
   * applicable (la rangée noire du pied de tableau est supprimée).
   * VOLET 18 — libellés traduits, montant en lettres dans la
   * LANGUE du document. */
  const blocTotal = `
  <div class="total-sous-tableau" data-bloc>
    <p><strong>${L.total}</strong> ${formatCurrency(total, d.devise)} <span class="total-lettres">(${esc(montantEnLettres(total, d.devise, langue))})</span> — ${L.tvaNonApplicable}</p>
  </div>`;

  /* Conditions + Bon pour accord (devis et propositions) — le délai
   * estimé suit IMMÉDIATEMENT la liste des CGV (« sans espace de
   * décalage ») ; l'espace de signature est agrandi. VOLET 18 :
   * CGV, libellés et lignes de signature traduits. */
  const cgv = langue === "en" ? CONDITIONS_GENERALES_EN : CONDITIONS_GENERALES;
  const blocConditions = !estFacture
    ? `
    <div class="conditions-block" data-bloc>
      <div class="cb-left">
        <div class="cb-title">${L.cgv}</div>
        <ul class="cb-conditions-list">
          ${cgv.map((cond) => `<li>${esc(cond)}</li>`).join("")}
        </ul>
        ${delaiEstime ? `<p class="delai-apres-cgv"><strong>${L.delaiEstime}</strong> ${esc(delaiEstime)}</p>` : ""}
      </div>
      <div class="cb-right">
        <div class="cb-title">${L.bonPourAccord}</div>
        <div class="cb-date-line">${L.dateSignature}</div>
        <div class="signature-line">
          <div class="sig-label">${L.signatureEtCachet} <span class="sig-separator">|</span> <span class="sig-quality-inline">${L.qualiteSignataire}</span></div>
        </div>
      </div>
    </div>`
    : "";

  /* Validité + notes — VOLET 18 : libellés traduits. */
  const blocValiditeNotes = `
  <div class="validite-notes" data-bloc>
    <p><span class="vn-lbl">${L.validite}</span> ${Number(d.validiteJours) || 5} ${L.jours}</p>
    ${d.notes ? `<p><span class="vn-lbl">${L.notes}</span> ${esc(d.notes)}</p>` : ""}
  </div>`;

  /* Coordonnées bancaires — VOLET 17 : IBAN, BIC puis TITULAIRE (la
   * ligne « Banque » est supprimée). VOLET 18 : libellés traduits,
   * valeurs système (mode de paiement, condition de règlement par
   * défaut) affichées dans la langue. */
  const blocBanque = `
  <div class="section-heading" data-bloc data-heading>${L.coordonneesBancaires}</div>
  <div class="bank-block" data-bloc>
    <div class="bank-row"><span class="lbl">${L.iban}</span> <span class="val">${esc(d.banque.iban)}</span></div>
    <div class="bank-row"><span class="lbl">${L.bic}</span> <span class="val">${esc(d.banque.bic)}</span></div>
    <div class="bank-row"><span class="lbl">${L.titulaireCompte}</span> <span class="val">${esc(d.banque.titulaire)}</span></div>
    <div class="bank-row"><span class="lbl">${L.modePaiement}</span> <span class="val">${esc(traduireValeur(d.modePaiement, langue))}</span></div>
    <div class="bank-row"><span class="lbl">${L.conditionsReglement}</span> <span class="val">${esc(traduireValeur(d.conditionsReglement, langue))}</span></div>
  </div>
  ${
    d.lienPaiement
      ? `<div class="payment-link-section" data-bloc>
    <div class="section-heading" data-bloc data-heading>${L.lienPaiement}</div>
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
      <div class="sig-caption">Stevens AKPOVI — ${esc(emetteurSubText)} · ${esc(EMETTEUR.email)}</div>
    </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${langue}">
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
      <div class="party-label">${L.emetteur}</div>
      ${emetteurRows
        .map((r, i) => {
          const subText = i === 0 ? `<div class="party-subtext">${esc(emetteurSubText)}</div>` : "";
          return `<div class="party-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>${subText}`;
        })
        .join("")}
    </div>
    <div class="party-block">
      <div class="party-label">${L.destinataire}</div>
      ${destinataireRows
        .map((r) => `<div class="party-row"><span class="lbl">${r[0]}</span><span class="val">${r[1]}</span></div>`)
        .join("")}
    </div>
  </div>

  <div class="hr" data-bloc></div>

  <div class="thank-you" data-bloc>
    <div class="thank-you-prefix">${L.merci}</div>
    <div class="thank-you-body">${remerciement}</div>
  </div>

  <div class="detail-heading" data-bloc data-heading>${L.detail}</div>

  <div class="svc-head" data-bloc data-heading>
    <div class="cell">${L.colType}</div>
    <div class="cell">${L.colDescription}</div>
    <div class="cell num">${L.colPrixUnitaire}</div>
    <div class="cell center">${L.colQte}</div>
    <div class="cell num">${L.colTotal}</div>
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
        <div class="line-2">${L.piedConfidentiel}</div>
      </div>
      <div class="p-num">${L.page}</div>
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
${langue === "en" ? `<script>${SCRIPT_PIED_PAGE_EN}</script>` : ""}
</body>
</html>`;

  return html;
}
