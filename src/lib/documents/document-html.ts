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

import { getPaymentMethodLogo, HAUTEUR_BADGE_PAIEMENT } from "./payment-logos";
import { formatDate, formatDateCourte, formatCurrency } from "./format";
import { descriptionOuPoints, decouperHtmlRiche } from "./texte-riche";
import { fabriquerScriptPagination } from "./pagination-flux";
import { LABELS_DOC, type DocumentRecord } from "./types";
import { EMETTEUR, CONDITIONS_GENERALES, CONDITIONS_GENERALES_EN, TEXTES_DEFAUT, NOTE_DEFAUT } from "./defaults";

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Pagination du devis : marges latérales 16 mm, contenu jusqu'à
 * 279 mm (le pied de page occupe le bas). VOLET 19 : les pages de
 * SUITE démarrent à 88 pt du haut — la place de l'EN-TÊTE COMPACT
 * cloné sur chaque page 2+ (comme la proposition commerciale,
 * demande de l'éditeur : « tu devrais faire d'entête comme on a
 * fait d'entête pour la proposition »). */
const LIMITE_PX = Math.round((279 / 25.4) * 96);
const DEBUT_PX = Math.round((16 / 25.4) * 96);
const DEBUT_N_PX = Math.round(88 * 4 / 3);

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
    /* Total sous le tableau — VOLET 19 : lignes à pointillés */
    totalCourt: "Total",
    tvaCourt: "TVA",
    tvaNonApplicable: "Non applicable",
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
    /* VOLET 24 — titre du bloc de paiement des DEVIS (demande de
       l'éditeur : « renomme ce bloc modalité de paiement en
       PAIEMENT ») : le libellé devient « Paiement » — la feuille de
       style du bloc l'affiche EN MAJUSCULES (« PAIEMENT »), exactement
       comme le bloc Paiement des factures. */
    modalitePaiement: "Paiement",
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
    /* Total below the table — VOLET 19: dotted leader lines */
    totalCourt: "Total",
    tvaCourt: "VAT",
    tvaNonApplicable: "Not applicable",
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
    /* VOLET 24 — devis payment block title (renamed « Paiement »). */
    modalitePaiement: "Payment",
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
 * affiché suit la langue du document.
 * VOLET 24 — le badge est affiché à 22 px de HAUT (16 px avant) :
 * le texte « Bank Transfer » y est enfin LISIBLE (demande de
 * l'éditeur), sur les devis comme sur les factures. */
function badgeModePaiement(mode: string, langue: "fr" | "en"): string {
  const libelle = traduireValeur(mode, langue);
  const logoUri =
    getPaymentMethodLogo(mode) ??
    getPaymentMethodLogo(TRADUCTIONS_INVERSEES[mode] ?? mode);
  if (!logoUri) return esc(libelle);
  return `<img src="${logoUri}" alt="${esc(libelle)}" style="height:${HAUTEUR_BADGE_PAIEMENT}px; vertical-align:middle; margin-right:7px;" />${esc(libelle)}`;
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
  /* VOLET 19 — logo recadré SERRÉ (celui du PDF d'exemple) : voir
   * logo-base64.ts / public/assets/logo-noir-doc.png. */
  logoSrc: string = "/assets/logo-noir-doc.png",
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
   * par l'éditeur : elle reste telle quelle).
   * VOLET 22 (27/11/2026) — FACTURE : le bloc d'introduction
   * (« Merci pour votre confiance. » + intro rédigée) REVIENT sur la
   * facture (demande de l'éditeur : « le contenu texte qui est entre
   * le bloc émetteur/destinataire et le tableau détail — le texte
   * qui dit "merci pour…" — je veux que tu mettes ce contenu texte
   * sur la facture également ») — même emplacement que sur un devis. */
  const remerciement = `${esc(d.intro)}`;
  const blocRemerciement = `
  <div class="thank-you" data-bloc>
    <div class="thank-you-prefix">${L.merci}</div>
    <div class="thank-you-body">${remerciement}</div>
  </div>`;

  /* CACHET — VOLET 20 (26/11/2026), reproduction EXACTE du cachet du
     reçu d'exemple (mesuré sur le PDF : 213 × 85 px à 827 px de page
     → 153 × 61 pt, double filet — extérieur 3,2 pt, écart 2,2 pt,
     intérieur 1,8 pt — angles vifs, rotation −17° antihoraire, vert
     #008000 PLEIN, « PAYÉ » gras serif ~37 pt + « le JJ/MM/AAAA »
     10 pt sans-serif centré dessous) : factures PAYÉES → cachet vert
     « PAYÉ » AVEC la date de règlement ; factures EN ATTENTE → le
     MÊME cachet en GRIS avec « EN ATTENTE » SANS date. Le cachet est
     posé SUR les deux lignes à pointillés (Total + TVA), centré
     verticalement et horizontalement sur l'ensemble des deux
     lignes (demande de l'éditeur). */
  const estPaye = d.statutPaiement === "Payé";
  /* VOLET 18 — statut AFFICHÉ : la valeur enregistrée reste
   * française ("Payé"/"En attente", donnée du document) ; la
   * version anglaise affiche PAID / Pending. */
  const statutAffiche = estPaye
    ? L.paye
    : langue === "en"
      ? L.enAttente
      : d.statutPaiement ?? "En attente";
  const cachet = estFacture
    ? `
      <div class="cachet-overlay${estPaye ? "" : " cachet-overlay--attente"}" role="img" aria-label="Cachet ${estPaye ? L.paye : L.enAttente}">
        <div class="cachet-paye">
          <span class="cp-texte"><span class="cp-paye">${estPaye ? L.paye : L.enAttente.toUpperCase()}</span>${estPaye ? `<span class="cp-date">${L.le} ${datePaiementLabel}</span>` : ""}</span>
        </div>
      </div>`
    : "";

  /* Bloc Paiement (factures) — VOLET 18 : libellés traduits, mode
     de paiement affiché dans la langue (badge conservé). */
  const blocPaiement = estFacture
    ? `
      <div class="invoice-payment-block" data-bloc>
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
   * dans Word).
   * CORRECTIF 28/11/2026 (M20 — retour de l'éditeur : « dans le champ
   * c'est sous forme de paragraphe, mais dans le tableau ça considère
   * chaque PHRASE comme un PARAGRAPHE et ça met un ESPACE entre les
   * phrases ») : les rangées qui SE SUIVENT au sein d'un MÊME
   * paragraphe (phrases p-suite) ou d'une même LISTE (li-suite)
   * portent suite-apres / suite-avant : la MARGE INTÉRIEURE des
   * cellules (5 px + 5 px) est ANNULÉE ENTRE elles — les phrases se
   * suivent AU FIL DE LA LIGNE, comme l'UNIQUE paragraphe du champ
   * de rédaction. La découpe ne sert qu'à la PAGINATION (remplir la
   * page), jamais à l'apparence. */
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
        /* CORRECTIF 28/11 (M20) : suite d'un MÊME paragraphe / d'une
         * même liste → marges intérieures annulées entre les rangées
         * (le fragment POURSUIT le précédent ou se poursuit au-
         * delà). Détection : classes p-suite / li-suite POSÉES par le
         * découpage (texte-riche.ts) — --debut marque la PREMIÈRE
         * rangée du paragraphe, --fin la DERNIÈRE. */
        const suiteAvant =
          /(?:p|li)-suite(?!-)/.test(fragment) && !/(?:p|li)-suite--debut/.test(fragment);
        const suiteApres =
          /(?:p|li)-suite(?!-)/.test(fragment) && !/(?:p|li)-suite--fin/.test(fragment);
        const suite =
          suiteAvant || suiteApres
            ? `${suiteAvant ? " suite-avant" : ""}${suiteApres ? " suite-apres" : ""}`
            : "";
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
  <div class="svc-part${debut}${fin}${suite}" data-bloc>
    ${tete}
  </div>`;
      });
      return parties.join("");
    })
    .join("");

  /* VOLET 22 (27/11/2026) — PIED NOIR DU TABLEAU : la rangée noire
   *  supprimée avec l'ancien total REVIENT, mais elle porte
   *  désormais le DÉLAI ESTIMÉ — « Délai estimé : » à gauche dans la
   *  rangée, la valeur TOTALEMENT à droite (demande de l'éditeur :
   *  « on ramène le footer des tableaux mais pas avec le contenu
   *  total — on affiche “Délai estimé :” et totalement à droite le
   *  délai estimé sera affiché, un peu comme le total était affiché
   *  dans le footer du tableau »). Dernière rangée du tableau, même
   *  habillage noir que l'en-tête. */
  const piedTableau = `
  <div class="svc-foot" data-bloc>
    <span class="svc-foot-libelle">${L.delaiEstime}</span>
    <span class="svc-foot-valeur">${delaiEstime ? esc(delaiEstime) : "—"}</span>
  </div>`;

  /* Total SOUS le tableau — VOLET 19 : « Total » et « TVA » EN GRAS
   * ET GROS à gauche, pointillés jusqu'au prix à droite. VOLET 20
   * (26/11/2026) : le montant en LETTRES (parenthèses) est
   * SUPPRIMÉ des devis comme des factures (demande de l'éditeur) ;
   * sur les FACTURES l'espace entre le tableau et le total est
   * AUGMENTÉ (10 mm) et le CACHET (PAYÉ / EN ATTENTE) se pose SUR
   * les deux lignes à pointillés, centré verticalement et
   * horizontalement. VOLET 21 (27/11/2026) : le cachet passe
   * AU-DESSUS des pointillés (z-index) — son encre et sa date
   * restent ENTIÈREMENT lisibles (demande de l'éditeur). */
  const blocTotal = `
  <div class="total-sous-tableau${estFacture ? " total-sous-tableau--facture" : ""}" data-bloc>
    <div class="total-ligne">
      <span class="total-libelle">${L.totalCourt}</span>
      <span class="total-pointilles" aria-hidden="true"></span>
      <span class="total-valeur">${formatCurrency(total, d.devise)}</span>
    </div>
    <div class="total-ligne total-ligne--tva">
      <span class="total-libelle">${L.tvaCourt}</span>
      <span class="total-pointilles" aria-hidden="true"></span>
      <span class="total-valeur">${L.tvaNonApplicable}</span>
    </div>
    ${cachet}
  </div>`;

  /* Conditions + Bon pour accord (devis et propositions) — VOLET
   * 22 : le DÉLAI ESTIMÉ ne suit plus les CGV (il vit désormais
   * dans le PIED NOIR DU TABLEAU, comme l'ancien total) ; l'espace
   * de signature est RÉDUIT pour s'aligner avec la dernière ligne de
   * la colonne des CGV (demande de l'éditeur). VOLET 18 : CGV,
   * libellés et lignes de signature traduits. */
  const cgv = langue === "en" ? CONDITIONS_GENERALES_EN : CONDITIONS_GENERALES;
  const blocConditions = !estFacture
    ? `
    <div class="conditions-block" data-bloc>
      <div class="cb-left">
        <div class="cb-title">${L.cgv}</div>
        <ul class="cb-conditions-list">
          ${cgv.map((cond) => `<li>${esc(cond)}</li>`).join("")}
        </ul>
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

  /* Validité + notes — VOLET 18 : libellés traduits.
   * VOLET 20 — FACTURE : la ligne « Validité du document : … » est
   * SUPPRIMÉE (demande de l'éditeur) ; seules les NOTES éventuelles
   * restent imprimées.
   * VOLET 21 (27/11/2026) — ORDRE : ce bloc passe APRÈS les
   * coordonnées bancaires.
   * VOLET 23 — FACTURE : la note est TOUJOURS la note affichée sur
   * les devis (demande de l'éditeur : « je veux que cette note soit
   * la même note affichée sur les devis : “Notes : Je reste à votre
   * disposition pour toute question complémentaire et vous
   * remercie pour votre confiance.” ») — les modalités de la
   * proposition ne s'invitent plus sur les factures. */
  const blocValiditeNotes = estFacture
    ? `
  <div class="validite-notes" data-bloc>
    <p><span class="vn-lbl">${L.notes}</span> ${esc(langue === "en" ? TEXTES_DEFAUT.en.notes : NOTE_DEFAUT)}</p>
  </div>`
    : `
  <div class="validite-notes" data-bloc>
    <p><span class="vn-lbl">${L.validite}</span> ${Number(d.validiteJours) || 5} ${L.jours}</p>
    ${d.notes ? `<p><span class="vn-lbl">${L.notes}</span> ${esc(d.notes)}</p>` : ""}
  </div>`;

  /* VOLET 23 — BLOC « MODALITÉ DE PAIEMENT » DES DEVIS (et des
   * propositions à l'ancien gabarit) : le bloc « Coordonnées
   * bancaires » adopte le DESIGN ET L'ORGANISATION du bloc Paiement
   * des factures (demande de l'éditeur : « le design ainsi que
   * l'organisation de ce bloc paiement me plaît beaucoup — applique
   * ce design au bloc coordonnées bancaires de tous les devis ; le
   * bloc ne sera plus nommé coordonnées bancaires mais modalité de
   * paiement, ou simplement paiement. À l'intérieur on aura la
   * mention mode de paiement virement bancaire et les éléments des
   * coordonnées en dessous ») : même habillage (fond, filet, rangées
   * libellé/valeur), « Mode de paiement : Virement bancaire » en
   * tête, puis IBAN, BIC, titulaire et condition de règlement.
   * VOLET 20 — FACTURE : ce bloc reste SUPPRIMÉ des factures. */
  const blocBanque = !estFacture
    ? `
  <div class="invoice-payment-block invoice-payment-block--devis" data-bloc>
    <div class="ipb-title">${L.modalitePaiement}</div>
    <div class="ipb-row">
      <span class="ipb-label">${L.modePaiement}</span>
      <span class="ipb-value">${badgeModePaiement(d.modePaiement, langue)}</span>
    </div>
    <div class="ipb-row">
      <span class="ipb-label">${L.iban}</span>
      <span class="ipb-value">${esc(d.banque.iban)}</span>
    </div>
    <div class="ipb-row">
      <span class="ipb-label">${L.bic}</span>
      <span class="ipb-value">${esc(d.banque.bic)}</span>
    </div>
    <div class="ipb-row">
      <span class="ipb-label">${L.titulaireCompte}</span>
      <span class="ipb-value">${esc(d.banque.titulaire)}</span>
    </div>
    <div class="ipb-row">
      <span class="ipb-label">${L.conditionsReglement}</span>
      <span class="ipb-value">${esc(traduireValeur(d.conditionsReglement, langue))}</span>
    </div>
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
  }`
    : "";

  /* VOLET 20 (26/11/2026) — FACTURE : la signature manuscrite
   * « Stevens Akpovi / Stevens AKPOVI — Concepteur de sites web
   * professionnels · stevensakpovi@gmail.com » est SUPPRIMÉE de la
   * facture (demande de l'éditeur). */

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
  /* VOLET 19 — pages de SUITE : contenu à 88 pt du haut, SOUS
     l'en-tête compact (comme la proposition commerciale). */
  .ppage-n { padding-top: 88pt; }
  @media print {
    body { background: #ffffff; }
    .ppage { margin: 0; box-shadow: none; }
  }
  .corps { position: relative; z-index: 1; }

  /* ---- En-tête compact des pages de suite — VOLET 19 ----
     Calqué sur celui de la proposition commerciale (mêmes mesures
     que l'exemple : logo à droite, 32,6 pt de haut, POSÉ à 31,2 pt
     du haut de page — taille et position verticale réelle de
     l'exemple ; sur-titre + numéro/client à gauche, filet clair). */
  .entete-n { position: absolute; top: 0; left: 16mm; right: 16mm; z-index: 1; }
  .en-textes { position: relative; padding-right: 56pt; }
  .en-surtitre {
    margin: 36.4pt 0 0 0;
    font-size: 7pt; font-weight: 600;
    letter-spacing: 0.05em;
    line-height: 1.4;
    text-transform: uppercase;
    color: #374151;
  }
  .en-sous { margin: 0; font-size: 7pt; font-weight: 400; line-height: 1.4; color: #6b7280; }
  .en-filet { margin-top: 11pt; border-top: 0.5pt solid #d1d5db; }
  .en-logo { position: absolute; right: 0; top: 31.2pt; }
  .en-logo img { height: 32.6pt; width: auto; display: block; }

  /* ---- Filigrane — VOLET 19 : DIMENSIONS DE L'EXEMPLE de la
     proposition commerciale (demande de l'éditeur : le filigrane
     des devis et factures doit correspondre à celui du document de
     référence) : hauteur 353,4 pt, haut à 258,4 pt, centré
     horizontalement, opacité 6 %. ---- */
  .wm {
    position: absolute; top: 258.4pt; left: 50%;
    transform: translateX(-50%);
    height: 353.4pt;
    opacity: 0.06;
    pointer-events: none;
    z-index: 0;
  }
  .wm img { height: 353.4pt; width: auto; display: block; }

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
  /* VOLET 23 — fragment qui FERME une page coupée : quand le tableau
     se poursuit sur la page suivante, la portion laissée sur la page
     en cours se TERMINE par un trait horizontal FIN, comme les bords
     du tableau (demande de l'éditeur : « en bas, là où le tableau
     s'est arrêté, il doit avoir la fin du tableau — un trait
     horizontal fin comme les bords du tableau — puis continuer sur
     la page suivante avec l'entête du tableau ; ne pas laisser le
     tableau ouvert en bas »). */
  .svc-part.fin-page { border-bottom: 1px solid #000000; }
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
  /* VOLET 22 — PIED NOIR DU TABLEAU (délai estimé) : rangée noire
     finale du tableau, même habillage que l'en-tête (fond noir,
     texte blanc) — « Délai estimé : » à gauche, valeur TOTALEMENT à
     droite (comme l'ancien total dans le footer du tableau). */
  .svc-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: #000000;
    border: 1px solid #000000;
    padding: 6px 8px;
  }
  .svc-foot .svc-foot-libelle {
    color: #ffffff;
    font-size: 10pt;
    font-weight: 600;
    letter-spacing: 0.5px;
    line-height: 1.35;
  }
  .svc-foot .svc-foot-valeur {
    color: #ffffff;
    font-size: 10.5pt;
    font-weight: 700;
    line-height: 1.35;
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
     plus de puces carrées.
     VOLET 23 — paragraphes RESSERRÉS (demande de l'éditeur : « l'espace
     entre les titres des périmètres et leurs descriptions est trop —
     réduis ça ; l'espace entre les paragraphes aussi ») : 3 px → 1 px. */
  .desc-riche p { margin: 0 0 1px 0; font-size: 9pt; line-height: 1.5; color: #374151; }
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
  /* VOLET 19 — fragments de liste éclatés (pagination fine, voir
     texte-riche.ts) : une suite de <ul class="li-suite"> d'un seul
     <li> ressemble à UNE liste unique — marges annulées sauf aux
     extrémités (--debut / --fin reprennent les 2 px / 4 px d'origine). */
  .desc-riche ul.li-suite, .desc-riche ol.li-suite { margin: 0; }
  .desc-riche ul.li-suite--debut, .desc-riche ol.li-suite--debut { margin-top: 2px; }
  .desc-riche ul.li-suite--fin, .desc-riche ol.li-suite--fin { margin-bottom: 4px; }
  /* VOLET 21 (27/11/2026) — phrases éclatées (paragraphes LONGS
     découpés pour la pagination fine, voir texte-riche.ts) : les
     phrases d'un même paragraphe se suivent SANS marge — même
     rendu qu'un paragraphe unique ; la dernière phrase garde la
     marge basse d'origine. Le tableau se remplit jusqu'en bas de
     page et se poursuit en page suivante (en-tête repris).
     CORRECTIF 28/11/2026 (M20) — SUITE DE RANGÉES : les rangées qui
     se suivent au sein d'un MÊME paragraphe (p-suite) ou d'une même
     liste (li-suite) annulent AUSSI la MARGE INTÉRIEURE des cellules
     (5 px en haut + 5 px en bas = 10 px d'écart visible — chaque
     phrase paraissait être un paragraphe séparé). Désormais les
     phrases se suivent AU FIL DE LA LIGNE : le rendu est celui du
     PARAGRAPHE UNIQUE du champ de rédaction (demande de l'éditeur :
     « tant que dans le champ c'est sous forme de paragraphe, dans le
     devis ça devrait être aussi sous forme de paragraphe »). */
  .desc-riche p.p-suite { margin: 0; }
  .desc-riche p.p-suite--fin { margin-bottom: 1px; }
  .svc-part.suite-avant .cell { padding-top: 0; }
  .svc-part.suite-apres .cell { padding-bottom: 0; }

  /* ---- Total SOUS le tableau — VOLET 19 : lignes à POINTILLÉS.
     « Total » et « TVA » en GRAS ET GROS à gauche, la valeur
     totalement à droite, pointillés entre les deux (demande de
     l'éditeur). VOLET 20 : le montant en lettres disparaît ; sur
     les FACTURES l'espace tableau → total est AUGMENTÉ (10 mm) et
     le CACHET se pose sur les deux lignes à pointillés.
     VOLET 21 : le CACHET couvre les pointillés (z-index supérieur)
     — l'encre et la date du cachet restent lisibles. ---- */
  .total-sous-tableau { margin-top: 4mm; position: relative; }
  /* VOLET 22 — FACTURE : le bloc total est dégagé du tableau
     (12 mm au-dessus) ET du bloc suivant (9 mm au-dessous) : le
     CACHET (PAYÉ / EN ATTENTE — posé sur les lignes à pointillés,
     boîte ~36 mm de haut une fois inclinée) ne touche plus le
     contenu qui suit (demande de l'éditeur : « pousse ça un peu
     vers le bas pour que le cachet ne le touche pas »). */
  .total-sous-tableau--facture { margin-top: 12mm; margin-bottom: 9mm; }
  .total-sous-tableau .total-ligne,
  .total-sous-tableau .total-ligne + .total-ligne { position: relative; z-index: 1; }
  .total-ligne { display: flex; align-items: baseline; margin: 0; }
  .total-ligne + .total-ligne { margin-top: 2.5mm; }
  .total-libelle {
    font-size: 15pt;
    font-weight: 800;
    color: #000000;
    letter-spacing: -0.2px;
    line-height: 1.25;
  }
  .total-valeur {
    font-size: 15pt;
    font-weight: 700;
    color: #000000;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    line-height: 1.25;
  }
  .total-ligne--tva .total-libelle { font-size: 13pt; }
  .total-ligne--tva .total-valeur { font-size: 13pt; font-weight: 600; }
  .total-pointilles {
    flex: 1 1 auto;
    min-width: 24px;
    border-bottom: 1.1mm dotted #000000;
    margin: 0 8px 2.5px;
  }

  /* ---- CACHET (VOLET 20, 26/11/2026) — reproduction EXACTE du
     reçu d'exemple : rectangle 153 × 61 pt (2,5 : 1) à angles vifs,
     DOUBLE filet (extérieur 3,2 pt, écart 2,2 pt, intérieur
     1,8 pt), rotation −17° (oblique ASCENDANT), encre PLEINE —
     VERT #008000 pour « PAYÉ » (avec « le JJ/MM/AAAA » dessous,
     gras serif ~36 pt + sans-serif 10 pt), GRIS FONCÉ pour
     « EN ATTENTE » (sans date). Le cachet est posé SUR les deux
     lignes à pointillés du bloc Total : centré VERTICALEMENT et
     HORIZONTALEMENT sur l'ensemble des deux lignes. ---- */
  .cachet-overlay {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .cachet-paye {
    position: relative;
    width: 153pt;
    height: 61pt;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-17deg);
  }
  /* VOLET 21 (27/11/2026) — cachet EN ATTENTE : PLUS D'ESPACE à
     gauche et à droite du texte (boîte élargie 172 → 200 pt) et
     encre GRIS FONCÉ (#4b5563 / #374151 — l'ancien #6b7280 était
     presque invisible sur le document imprimé, demande de
     l'éditeur). */
  .cachet-overlay--attente .cachet-paye { width: 200pt; }
  .cachet-paye::before {
    content: "";
    position: absolute;
    inset: 0;
    border: 3.2pt solid #008000;
    border-radius: 2pt;
  }
  .cachet-paye::after {
    content: "";
    position: absolute;
    inset: 5.4pt;
    border: 1.8pt solid #008000;
    border-radius: 1pt;
  }
  .cachet-paye .cp-texte {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: -3pt;
  }
  .cachet-paye .cp-paye {
    font-family: 'Times New Roman', Times, serif;
    font-weight: 700;
    font-size: 36pt;
    line-height: 0.95;
    color: #008000;
    letter-spacing: 0;
  }
  .cachet-overlay--attente .cachet-paye .cp-paye {
    font-size: 23pt;
    letter-spacing: 2pt;
  }
  .cachet-paye .cp-date {
    margin-top: 2.5pt;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 10pt;
    color: #008000;
  }
  /* Cachet EN ATTENTE : la même matrice, encre GRISE FONCÉE
     (VOLET 21 — lisible à l'impression). */
  .cachet-overlay--attente .cachet-paye::before,
  .cachet-overlay--attente .cachet-paye::after { border-color: #4b5563; }
  .cachet-overlay--attente .cachet-paye .cp-paye { color: #374151; }
  .cachet-overlay--attente .cachet-paye .cp-date { color: #4b5563; }

  /* ---- Conditions / Bon pour accord ---- */
  .conditions-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8mm;
    margin-top: 9mm;
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
  /* Délai estimé : retiré des CGV au VOLET 22 — il vit désormais
     dans le PIED NOIR DU TABLEAU (.svc-foot). */
  .cb-right { padding-left: 0; border-left: none; }
  .cb-right .cb-title { margin-bottom: 8mm; }
  .cb-right .cb-date-line {
    font-size: 9pt;
    color: #6b7280;
    margin-bottom: 10mm;
  }
  /* VOLET 22 — espace de signature RÉDUIT (30 mm → 12 mm) : la ligne
     « Signature et cachet » s'aligne désormais avec la DERNIÈRE
     ligne du contenu de la colonne des CGV (demande de l'éditeur :
     « réduis un peu l'espace réservé à la signature pour
     s'aligner avec la dernière ligne du contenu de la colonne
     conditions générales de vente »). */
  .signature-line {
    margin-top: 23mm;
    border-top: 1px solid #000000;
    padding-top: 3px;
    font-size: 8.5pt;
    color: #6b7280;
  }
  .signature-line .sig-label { font-weight: 600; color: #000000; }
  .signature-line .sig-separator { color: #6b7280; margin: 0 4px; font-weight: 400; }
  .signature-line .sig-quality-inline { color: #6b7280; font-weight: 400; font-style: italic; }

  /* ---- Validité + notes ---- */
  .validite-notes { margin-top: 6mm; }
  .validite-notes p { margin: 0 0 3px 0; font-size: 9pt; line-height: 1.5; color: #1f2937; }
  .validite-notes .vn-lbl { color: #000000; font-weight: 600; }

  /* ---- Bloc Paiement (factures) — VOLET 23 : le bloc des DEVIS
     (« Paiement » — renommé VOLET 24, affiché « PAIEMENT ») adopte le
     MÊME habillage (demande de l'éditeur : « le design de ce bloc
     paiement me plaît beaucoup — applique-le aux coordonnées
     bancaires des devis ») ; il prend la place de l'ancien titre de
     section + bloc bancaire, avec la marge haute d'un titre de
     section. ---- */
  .invoice-payment-block {
    background: rgba(75, 138, 107, 0.08);
    border: 1px solid rgba(75, 138, 107, 0.3);
    padding: 5px 12px;
    margin-top: 4mm;
    border-radius: 2px;
  }
  .invoice-payment-block--devis { margin-top: 8mm; }
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

  /* ---- Signature manuscrite ---- */
  .signature-steve { margin-top: 8mm; }
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
    margin: 8mm 0 3mm 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #d1d5db;
  }
  .bank-block { margin-top: 3mm; }
  .bank-row {
    display: flex;
    font-size: 10.5pt;
    padding: 2.5px 0;
    line-height: 1.45;
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

  ${blocRemerciement}

  <div class="detail-heading" data-bloc data-heading>${L.detail}</div>

  <div class="svc-head" data-bloc data-heading>
    <div class="cell">${L.colType}</div>
    <div class="cell">${L.colDescription}</div>
    <div class="cell num">${L.colPrixUnitaire}</div>
    <div class="cell center">${L.colQte}</div>
    <div class="cell num">${L.colTotal}</div>
  </div>
  ${lignesTableau}
  ${piedTableau}
  ${blocTotal}

  ${blocPaiement}
  ${blocConditions}
  ${blocPhases}
  ${blocBanque}
  ${blocValiditeNotes}
</div>

<!-- Gabarits clonés par le script de pagination -->
<div id="pc-gabarits" aria-hidden="true">
  <!-- VOLET 19 — EN-TÊTE COMPACT des pages de suite (comme la
       proposition commerciale) : type + numéro/client à gauche,
       logo 32,6 pt à droite, filet clair. -->
  <div class="entete-n">
    <div class="en-textes">
      <p class="en-surtitre">${label}</p>
      <p class="en-sous">${esc(d.numero)} · ${esc(d.client.nom)}${d.client.entreprise ? " · " + esc(d.client.entreprise) : ""}</p>
    </div>
    <div class="en-filet"></div>
    <div class="en-logo"><img src="${esc(logoSrc)}" alt="Stevens Akpovi"></div>
  </div>
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
    debutNPx: DEBUT_N_PX,
    enteteCompacte: true,
    formatPage: "simple",
    /* VOLET 22 — réserve basse : espace minimal garanti entre le bas
       du tableau (quand il remplit la page, PREMIÈRE page comme les
       suivantes) et le pied de page (demande de l'éditeur) — la
       proposition commerciale garde sa pagination calée sur
       l'exemple (aucune réserve). */
    reserveBasPx: Math.round(10 * 96 / 25.4),
  })}</script>
${langue === "en" ? `<script>${SCRIPT_PIED_PAGE_EN}</script>` : ""}
</body>
</html>`;

  return html;
}
