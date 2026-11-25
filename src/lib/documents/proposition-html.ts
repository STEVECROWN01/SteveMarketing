/**
 * RENDU HTML DE LA PROPOSITION COMMERCIALE — VOLET 16 (25/11/2026).
 *
 * Reproduction du template personnel de l'éditeur (PDF fourni en
 * exemple le 25/11/2026) : Poppins, palette monochrome (fond
 * #F8F8F8, encre #141414, filets #DCDAD6, fantômes #E3E1DD),
 * marges 22 mm, structure en huit sections numérotées, filigrane
 * logo pleine page, en-têtes spécifiques (grande page 1 + en-tête
 * compact répété) et pied de page « prestataire · Proposition
 * commerciale · site — NN / NN ».
 *
 * PAGINATION AUTOMATIQUE : le contenu est généré en flux continu
 * (blocs balisés data-bloc) puis un script INLINE mesure chaque
 * bloc et les répartit en pages A4 explicites (.ppage) — chaque
 * page porte son en-tête, son filigrane et son pied numéroté.
 * Le script s'exécute aussi bien dans l'iframe d'aperçu (srcDoc)
 * que dans Chromium (route PDF, via Puppeteer).
 *
 * Protocole d'aperçu (postMessage) :
 *  - enfant → parent : { source:'apercu-document', type:'pages', total }
 *  - parent → enfant : { type:'aller-page', page } (une page à la fois)
 */

import type { PropositionRecord } from "./proposition";
import { estPropositionV2 } from "./proposition";

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Montant façon template : « 2 000 € » — sans décimales when entier. */
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

/** Paragraphes = lignes non vides. */
function lignes(t: string | undefined): string[] {
  return (t ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------
 * SCRIPT DE PAGINATION — exécuté dans la page (iframe ou Puppeteer).
 * Aucune interpolation TypeScript : chaîne littérale.
 * ------------------------------------------------------------------ */
const SCRIPT_PAGINATION = `
(function () {
  var FLUX_ID = 'pc-flux';
  var MM = 25.4 / 96; /* 1 px CSS = MM mm */
  var LIMITE_BAS = 271; /* le contenu ne descend jamais sous 271 mm (filet du pied à 279) */
  var CAP_P1 = LIMITE_BAS - 13; /* page 1 : corps dès 13 mm */
  var CAP_N = LIMITE_BAS - 26; /* pages suivantes : corps dès 26 mm (sous l'en-tête compact) */
  var pages = [];
  var pagine = false;
  var pageDemandee = 0; /* 0 = toutes les pages visibles (mode impression) */

  function hMm(el) {
    var cs = getComputedStyle(el);
    /* marginTop est renvoyé en PIXELS — conversion en mm incluse
       (bug mesuré : marge comptée en px comme des mm, pages
       sur-numéraires). */
    return (el.offsetHeight + (parseFloat(cs.marginTop) || 0)) * MM;
  }

  function envoyerPages() {
    try {
      window.parent.postMessage({ source: 'apercu-document', type: 'pages', total: pages.length }, '*');
    } catch (e) {}
  }

  function montrerPage(n) {
    if (!pages.length) return;
    if (!n) {
      for (var i = 0; i < pages.length; i++) pages[i].style.display = '';
      pageDemandee = 0;
      return;
    }
    pageDemandee = Math.min(Math.max(1, n || 1), pages.length);
    for (var i2 = 0; i2 < pages.length; i2++) {
      pages[i2].style.display = i2 === pageDemandee - 1 ? '' : 'none';
    }
  }

  function paginer() {
    var flux = document.getElementById(FLUX_ID);
    if (!flux) return;
    /* blocs où qu'ils soient (première passe : dans le flux ;
       repasse : dans les pages déjà construites) */
    var blocs = Array.prototype.slice.call(
      document.querySelectorAll('#pc-flux [data-bloc], .ppage [data-bloc]'),
    );
    if (!blocs.length) return;
    /* détruire les pages d'une éventuelle passe précédente */
    for (var i = 0; i < pages.length; i++) pages[i].remove();
    pages = [];
    /* remettre les blocs dans le flux, marges inline neutralisées */
    for (var r = 0; r < blocs.length; r++) {
      blocs[r].style.marginTop = '';
      flux.appendChild(blocs[r]);
    }

    /* 1. mesurer (le flux est visible, largeur 166 mm) */
    var hauteurs = blocs.map(hMm);

    /* 2. répartir */
    var repartis = [[]];
    var h = 0;
    var cap = CAP_P1;
    for (var j = 0; j < blocs.length; j++) {
      var b = blocs[j];
      var bh = hauteurs[j];
      var heading = b.hasAttribute('data-heading');
      var reste = cap - (h + bh);
      var garder = heading && j + 1 < blocs.length
        ? Math.min(hauteurs[j + 1] + 3, 22)
        : 0;
      if (repartis[repartis.length - 1].length === 0 && repartis.length === 1) {
        /* les blocs d'en-tête de la page 1 restent sur la page 1 */
      } else if (reste < 0 || (heading && reste < garder)) {
        repartis.push([]);
        h = 0;
        cap = CAP_N;
      }
      repartis[repartis.length - 1].push(b);
      h += bh;
    }

    /* 3. construire les pages */
    var gabarit = document.getElementById('pc-gabarits');
    var enteteN = gabarit ? gabarit.querySelector('.entete-n') : null;
    var piedN = gabarit ? gabarit.querySelector('.pied') : null;
    var wm = gabarit ? gabarit.querySelector('.wm') : null;
    var total = repartis.length;
    for (var p = 0; p < total; p++) {
      var page = document.createElement('div');
      page.className = 'ppage' + (p === 0 ? ' ppage1' : ' ppage-n') + (p === total - 1 ? ' ppage-fin' : '');
      var num = p + 1;
      page.setAttribute('data-page', String(num));
      if (wm) page.appendChild(wm.cloneNode(true));
      if (p > 0 && enteteN) {
        var en = enteteN.cloneNode(true);
        page.appendChild(en);
      }
      var corps = document.createElement('div');
      corps.className = 'corps' + (p === 0 ? ' corps1' : ' corps-n');
      for (var k = 0; k < repartis[p].length; k++) {
        var bloc = repartis[p][k];
        if (k === 0 && p > 0) bloc.style.marginTop = '4mm';
        corps.appendChild(bloc);
      }
      page.appendChild(corps);
      if (piedN) {
        var pd = piedN.cloneNode(true);
        var numEl = pd.querySelector('.p-num');
        if (numEl) {
          numEl.innerHTML = '<b>' + (num < 10 ? '0' + num : num) + '</b> / ' + (total < 10 ? '0' + total : total);
        }
        page.appendChild(pd);
      }
      flux.parentNode.insertBefore(page, flux);
      pages.push(page);
    }
    pagine = true;
    window.__pagesPc = total;
    window.__paginePc = true;
    window.__paginePcAt = Date.now();
    montrerPage(pageDemandee);
    envoyerPages();
  }
  window.addEventListener('message', function (ev) {
    var m = ev.data || {};
    if (m && m.type === 'aller-page') {
      if (pagine) montrerPage(m.page);
      else pageDemandee = m.page || 1;
    } else if (m && m.type === 'demander-pages') {
      envoyerPages();
    }
  });

  function lancer() {
    /* Forcer le chargement des graisses Poppins (best effort) puis
       paginer — et RE-paginer à intervalles réguliers : la feuille
       de style Google Fonts est ASYNCHRONE, les hauteurs mesurées
       avec la police de repli sont gonflées (mesuré : 12 pages au
       lieu de 6). Chaque passe relève l'horodatage __paginePcAt —
       le générateur PDF attend une pagination STABLE. */
    var prets = Promise.resolve();
    if (document.fonts && document.fonts.load) {
      prets = Promise.all([
        document.fonts.load('300 10pt Poppins'),
        document.fonts.load('400 10pt Poppins'),
        document.fonts.load('500 10pt Poppins'),
        document.fonts.load('600 10pt Poppins'),
        document.fonts.load('700 10pt Poppins'),
      ]).catch(function () {});
    }
    Promise.race([prets, new Promise(function (r) { setTimeout(r, 4000); })]).then(function () {
      try { paginer(); } catch (e) { /* repli : flux continu */ }
      setTimeout(function () { try { paginer(); } catch (e) {} }, 600);
      setTimeout(function () { try { paginer(); } catch (e) {} }, 1600);
      setTimeout(function () { try { paginer(); } catch (e) {} }, 3200);
    });
  }
  /* Une police qui arrive EN RETARD déclenche aussi un re-paginage. */
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () {
      setTimeout(function () { if (pagine) { try { paginer(); } catch (e) {} } }, 80);
    });
  }
  lancer();
})();
`;

/** Rendu complet (HTML autonome) de la proposition commerciale. */
export function renderPropositionHtml(
  p: PropositionRecord,
  logoSrc: string = "/assets/logo-noir.png",
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

  const paras = (arr: string[]) =>
    arr.map((t) => `<p class="para" data-bloc>${esc(t)}</p>`).join("\n");

  const blocsPerimetre = (s.perimetre ?? [])
    .map((b, i) => {
      const lettre = lettres[i % 26] ?? "A";
      const items = (b.points ?? []).filter(Boolean);
      const tete = items.length || b.post ? "" : " seul";
      return `
<div class="perim-tete${tete}" data-bloc>
  <div class="pt-ligne"><span class="pt-carre">${lettre}</span><p class="pt-titre">${esc(b.titre)}</p></div>
  ${b.intro ? `<p class="para pt-intro">${esc(b.intro)}</p>` : ""}
  ${b.lead ? `<p class="para pt-lead">${esc(b.lead)}</p>` : ""}
</div>
${
  items.length || b.post
    ? `<div class="perim-corps" data-bloc>
${items.map((it) => `  <p class="tiret">–&ensp;${esc(it)}</p>`).join("\n")}
${b.post ? `  <p class="para pt-post">${esc(b.post)}</p>` : ""}
</div>`
    : ""
}`;
    })
    .join("\n");

  const blocsObjectifs = (s.objectifs ?? [])
    .map(
      (o, i) => `<div class="obj-ligne" data-bloc>
  <span class="obj-num">${String(i + 1).padStart(2, "0")}</span>
  <p class="obj-texte">${esc(o)}</p>
</div>`,
    )
    .join("\n");

  const blocsEtapes = (s.calendrierEtapes ?? [])
    .map(
      (e, i) => `<div class="etape" data-bloc>
  <span class="etape-carre">${i + 1}</span>
  <p class="etape-texte">${esc(e)}</p>
</div>`,
    )
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

  const section = (num: string, titre: string, suite: string) => `
<div class="s-head" data-bloc data-heading>
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
    color: #141414;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* ---- Pages ---- */
  .ppage {
    position: relative;
    width: 210mm; height: 297mm;
    margin: 0 auto 8mm;
    background: #F8F8F8;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(0,0,0,0.28);
    padding: 13mm 22mm 10mm 22mm;
    break-after: page;
    page-break-after: always;
  }
  .ppage:last-of-type, .ppage.ppage-fin { break-after: auto; page-break-after: auto; }
  @media print {
    body { background: #F8F8F8; }
    .ppage { margin: 0; box-shadow: none; }
  }
  .corps { position: relative; z-index: 1; }
  .corps-n { margin-top: 13mm; }

  /* ---- Filigrane ---- */
  .wm {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 168mm;
    opacity: 0.05;
    pointer-events: none;
    z-index: 0;
  }
  .wm img { width: 100%; height: auto; display: block; }

  /* ---- En-tête page 1 ---- */
  .entete1 { position: relative; padding-right: 26mm; }
  .e1-surtitre {
    margin: 0;
    font-size: 8.5pt; font-weight: 600;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: #141414;
  }
  .e1-titre {
    margin: 4mm 0 0 0;
    max-width: 118mm;
    font-size: 24pt; font-weight: 700;
    line-height: 1.15;
    color: #141414;
  }
  .e1-logo { position: absolute; right: 0; top: 2mm; width: 24mm; }
  .e1-logo img { width: 100%; height: auto; display: block; }

  /* ---- Bloc d'informations ---- */
  .infos { margin-top: 13.5mm; }
  .paire + .paire { margin-top: 2.2mm; }
  .paire .lbl {
    margin: 0 0 0.4mm 0;
    font-size: 7.5pt; font-weight: 600;
    letter-spacing: 0.11em; text-transform: uppercase;
    color: #9A9A9A;
  }
  .paire .val { margin: 0; font-size: 12.5pt; font-weight: 600; color: #141414; }
  .paire .val.montant { font-size: 17pt; }
  .filet { margin-top: 6mm; border-top: 1px solid #DCDAD6; }

  /* ---- En-tête compact (pages suivantes) ---- */
  .entete-n {
    position: absolute; top: 12.9mm; left: 22mm; right: 22mm;
    z-index: 1;
  }
  .en-ligne { position: relative; padding-right: 16mm; border-bottom: 1px solid #DCDAD6; padding-bottom: 2.2mm; }
  .en-surtitre {
    margin: 0;
    font-size: 7.5pt; font-weight: 600;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #141414;
  }
  .en-sous {
    margin: 1.2mm 0 0 0;
    font-size: 7pt; font-weight: 400;
    color: #9A9A9A;
  }
  .en-logo { position: absolute; right: 0; top: -1mm; width: 12mm; }
  .en-logo img { width: 100%; height: auto; display: block; }

  /* ---- Pied de page ---- */
  .pied { position: absolute; left: 22mm; right: 22mm; bottom: 10.5mm; z-index: 1; }
  .pied .pied-filet { border-top: 1px solid #DCDAD6; margin-bottom: 1.6mm; }
  .pied .pied-ligne { display: flex; align-items: baseline; justify-content: space-between; }
  .pied .p-gauche { font-size: 7.5pt; color: #9A9A9A; }
  .pied .p-gauche b { font-weight: 600; color: #141414; }
  .pied .p-sep { margin: 0 1.6mm; color: #B0B0B0; }
  .pied .p-url { color: #6E6E6E; text-decoration: none; }
  .pied .p-num { font-size: 7.5pt; color: #9A9A9A; }
  .pied .p-num b { font-weight: 600; color: #141414; }

  /* ---- Titres de section ---- */
  .s-head { margin-top: 10mm; }
  .s-head .s-ligne { display: flex; align-items: center; }
  .s-num {
    display: block;
    width: 20mm; flex: 0 0 20mm;
    margin-top: 2.6mm;
    font-size: 40pt; font-weight: 700; line-height: 1;
    color: #E3E1DD;
  }
  .s-titre { margin: 0; font-size: 17pt; font-weight: 700; color: #141414; }
  .s-filet { margin-top: 4.5mm; border-top: 1.5px solid #141414; }

  /* ---- Corps de texte ---- */
  .para { margin: 3.2mm 0 0 0; font-size: 10.5pt; font-weight: 400; line-height: 1.45; color: #141414; }

  /* ---- 02 Objectifs ---- */
  .obj-intro { margin-top: 4mm; }
  .obj-ligne { display: flex; align-items: baseline; margin-top: 1.6mm; border-bottom: 1px solid #DCDAD6; padding-bottom: 1.6mm; }
  .obj-num { flex: 0 0 12mm; font-size: 10.5pt; font-weight: 600; color: #C8C6C2; }
  .obj-texte { margin: 0; font-size: 10.5pt; line-height: 1.45; color: #141414; }

  /* ---- 03 Périmètre ---- */
  .perim-tete { margin-top: 5.2mm; }
  .pt-ligne { display: flex; align-items: center; gap: 5.5mm; }
  .pt-carre {
    flex: 0 0 8mm; width: 8mm; height: 8mm;
    display: flex; align-items: center; justify-content: center;
    background: #141414; color: #FFFFFF;
    font-size: 12.5pt; font-weight: 600;
  }
  .pt-titre { margin: 0; font-size: 12.5pt; font-weight: 700; color: #141414; }
  .pt-intro { margin-top: 2.2mm; }
  .pt-lead { margin-top: 2.2mm; }
  .perim-corps { margin-top: 2mm; }
  .tiret { margin: 1.1mm 0 0 0; padding-left: 6mm; text-indent: -4.2mm; font-size: 10.5pt; line-height: 1.4; color: #141414; }
  .pt-post { margin-top: 2.2mm; }

  /* ---- 04 Investissement ---- */
  .invest { margin-top: 5mm; background: #141414; color: #FFFFFF; padding: 5.5mm 6mm; display: flex; align-items: center; gap: 8mm; }
  .invest-g { flex: 1 1 auto; }
  .invest-lbl { margin: 0; font-size: 7.5pt; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.85); }
  .invest-montant { margin: 2mm 0 0 0; font-size: 22pt; font-weight: 700; color: #FFFFFF; }
  .invest-d { flex: 0 0 45%; font-size: 9.5pt; font-weight: 400; line-height: 1.5; color: rgba(255,255,255,0.94); }
  .fine { margin: 2.5mm 0 0 0; font-size: 8pt; line-height: 1.45; color: #6E6E6E; }

  /* ---- 05 Calendrier ---- */
  .delai-ligne { display: flex; align-items: baseline; gap: 8mm; margin-top: 5mm; }
  .delai-valeur { margin: 0; font-size: 16.5pt; font-weight: 700; color: #141414; }
  .delai-libelle { margin: 0; font-size: 9.5pt; color: #9A9A9A; }
  .etape { display: flex; align-items: center; margin-top: 1.6mm; }
  .etape-carre {
    flex: 0 0 6.5mm; width: 6.5mm; height: 6.5mm;
    display: flex; align-items: center; justify-content: center;
    background: #141414; color: #FFFFFF;
    font-size: 10.5pt; font-weight: 600;
  }
  .etape-texte { margin: 0 0 0 5mm; flex: 1 1 auto; padding-bottom: 2mm; border-bottom: 1px solid #DCDAD6; font-size: 10.5pt; color: #141414; }

  /* ---- 06 Modalités de paiement ---- */
  .paiements-rangee { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-top: 4.5mm; }
  .paiements-rangee.trois { grid-template-columns: 1fr 1fr 1fr; }
  .paie-bloc { background: #F1F0EC; border-top: 3px solid #141414; padding: 4.5mm 5mm; }
  .paie-pct { margin: 0; font-size: 24pt; font-weight: 700; line-height: 1.1; color: #141414; }
  .paie-montant { margin: 1.5mm 0 0 0; font-size: 10.5pt; color: #6E6E6E; }
  .paie-filet { border-top: 1px solid #DCDAD6; margin: 3mm 0; }
  .paie-libelle { margin: 0; font-size: 10.5pt; font-weight: 700; color: #141414; }
  .paie-desc { margin: 1.8mm 0 0 0; font-size: 8.5pt; line-height: 1.45; color: #6E6E6E; }

  /* ---- 08 Conclusion / signature ---- */
  .cordialement { margin-top: 5.5mm; font-size: 10.5pt; color: #141414; }
  .signature { margin-top: 4mm; }
  .signature .sig-nom { margin: 0; font-size: 10.5pt; font-weight: 700; color: #141414; }
  .signature .sig-titre { margin: 1.2mm 0 0 0; font-size: 9pt; color: #6E6E6E; }
  .signature .sig-site { margin: 1.2mm 0 0 0; font-size: 9pt; }
  .signature .sig-site a { color: #6E6E6E; text-decoration: underline; }

  /* ---- Flux continu (repli sans script) ---- */
  #pc-flux { width: 166mm; margin: 0 auto; }
  #pc-gabarits { display: none; }
</style>
</head>
<body>

<div id="pc-flux">
  <!-- En-tête page 1 : sur-titre + titre + logo -->
  <div class="entete1" data-bloc>
    <p class="e1-surtitre">Proposition commerciale</p>
    <h1 class="e1-titre">${esc(p.titre)}</h1>
    <div class="e1-logo"><img src="${esc(logoSrc)}" alt="${esc(p.prestataire)}"></div>
  </div>

  <!-- Bloc d'informations -->
  <div class="infos" data-bloc>
    <div class="paire">
      <p class="lbl">Votre projet</p>
      <p class="val">${esc(p.projet)}</p>
    </div>
    <div class="paire">
      <p class="lbl">Prestataire</p>
      <p class="val">${esc(p.prestataire)}</p>
    </div>
    <div class="paire">
      <p class="lbl">Montant total</p>
      <p class="val montant">${esc(montantF)}</p>
    </div>
    <div class="paire">
      <p class="lbl">Délai estimé</p>
      <p class="val">${esc(p.delai)}</p>
    </div>
  </div>
  <div class="filet" data-bloc></div>

  ${section("01", "Présentation de votre projet", paras(s.presentation ?? []))}

  ${section("02", "Objectifs de votre site", `<p class="para obj-intro" data-bloc>${esc(s.objectifsIntro)}</p>
${blocsObjectifs}`)}

  ${section("03", "Périmètre de la prestation", blocsPerimetre)}

  ${section("04", "Investissement", `<div class="invest" data-bloc>
  <div class="invest-g">
    <p class="invest-lbl">Montant total de la prestation</p>
    <p class="invest-montant">${esc(montantF)}</p>
  </div>
  <div class="invest-d">${esc(s.investissementTexte)}</div>
</div>
${(s.investissementNotes ?? []).map((n) => `<p class="fine" data-bloc>${esc(n)}</p>`).join("\n")}`)}

  ${section("05", "Calendrier de réalisation", `<div class="delai-ligne" data-bloc>
  <p class="delai-valeur">${esc(p.delai)}</p>
  <p class="delai-libelle">Délai estimé de réalisation</p>
</div>
<p class="para" data-bloc>${esc(s.calendrierIntro)}</p>
<p class="para" data-bloc>${esc(s.calendrierEtapesIntro)}</p>
${blocsEtapes}
${s.calendrierNote ? `<p class="fine" data-bloc>${esc(s.calendrierNote)}</p>` : ""}`)}

  ${section("06", "Modalités de paiement", `<p class="para" data-bloc>${esc(s.paiementsIntro)}</p>
${blocsPaiements}`)}

  ${section("07", "Validation et démarrage", paras(s.validation ?? []))}

  ${section("08", "Conclusion", `${paras(s.conclusion ?? [])}
<p class="para cordialement" data-bloc>Bien cordialement,</p>
<div class="signature" data-bloc>
  <p class="sig-nom">${esc(p.signature.nom)}</p>
  <p class="sig-titre">${esc(p.signature.titre)}</p>
  <p class="sig-site"><a href="${esc(siteUrl)}">${esc(p.signature.site)}</a></p>
</div>`)}
</div>

<!-- Gabarits clonés par le script de pagination -->
<div id="pc-gabarits" aria-hidden="true">
  <div class="entete-n">
    <div class="en-ligne">
      <p class="en-surtitre">Proposition commerciale</p>
      <p class="en-sous">${esc(p.projet)}</p>
      <div class="en-logo"><img src="${esc(logoSrc)}" alt="${esc(p.prestataire)}"></div>
    </div>
  </div>
  <div class="pied">
    <div class="pied-filet"></div>
    <div class="pied-ligne">
      <p class="p-gauche"><b>${esc(p.signature.nom)}</b><span class="p-sep">·</span>Proposition commerciale<span class="p-sep">·</span><a class="p-url" href="${esc(siteUrl)}">${esc(p.signature.site)}</a></p>
      <p class="p-num"><b>01</b> / 01</p>
    </div>
  </div>
  <div class="wm"><img src="${esc(logoSrc)}" alt=""></div>
</div>

<script>${SCRIPT_PAGINATION}</script>
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
