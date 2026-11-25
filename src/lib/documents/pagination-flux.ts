/**
 * PAGINATION PAR BLOCS — moteur commun (VOLET 17, 25/11/2026).
 *
 * Le contenu d'un document (proposition commerciale, devis, facture)
 * est généré en flux continu de blocs balisés `data-bloc` ; ce script
 * INLINE mesure chaque bloc et les répartit en pages A4 explicites
 * (.ppage) — chaque page porte son filigrane, son en-tête répété
 * (optionnel) et son pied numéroté. Constantes en PIXELS CSS
 * (page A4 de 794 px = 595,3 pt ; 1 pt = 4/3 px).
 *
 * Le script s'exécute aussi bien dans l'iframe d'aperçu (srcDoc) que
 * dans Chromium (route PDF, Puppeteer) ; il re-pagine quand les
 * polices web arrivent (hauteurs gonflées en police de repli —
 * mesuré : 12 pages au lieu de 6) et expose :
 *   window.__paginePc / __paginePcAt / __pagesPc
 * (contrat attendu par la route PDF et l'aperçu).
 *
 * Protocole d'aperçu (postMessage) :
 *  - enfant → parent : { source:'apercu-document', type:'pages', total }
 *  - parent → enfant : { type:'aller-page', page } (0 = toutes, impression)
 */

export type ConfPagination = {
  /** Limite basse du contenu, en px depuis le haut de la page. */
  limitePx: number;
  /** Début du contenu page 1, en px. */
  debutP1Px: number;
  /** Début du contenu pages suivantes, en px. */
  debutNPx: number;
  /** Pages 2+ : cloner l'en-tête compact (.entete-n) ? */
  enteteCompacte: boolean;
  /** Format de numérotation du pied : « belle » (01 / 06, en gras
   *  sur le numéro courant) ou « simple » (Page 1 sur 2). */
  formatPage?: "belle" | "simple";
};

/** Construit le script de pagination (chaîne littérale, aucune
 *  interpolation de valeurs dynamiques — uniquement les constantes
 *  de configuration, injectées sous forme de nombres). */
export function fabriquerScriptPagination(conf: ConfPagination): string {
  return `
(function () {
  var FLUX_ID = 'pc-flux';
  var LIMITE = ${conf.limitePx};
  var DEBUT_P1 = ${conf.debutP1Px};
  var DEBUT_N = ${conf.debutNPx};
  var ENTETE_COMPACTE = ${conf.enteteCompacte ? "true" : "false"};
  var FORMAT_SIMPLE = ${conf.formatPage === "simple" ? "true" : "false"};
  var pages = [];
  var pagine = false;
  var pageDemandee = 0;

  function hPx(el) {
    var cs = getComputedStyle(el);
    return el.offsetHeight + (parseFloat(cs.marginTop) || 0);
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
    var blocs = Array.prototype.slice.call(
      document.querySelectorAll('#pc-flux [data-bloc], .ppage [data-bloc]'),
    );
    if (!blocs.length) return;
    for (var i = 0; i < pages.length; i++) pages[i].remove();
    pages = [];
    for (var r = 0; r < blocs.length; r++) {
      blocs[r].style.marginTop = '';
      blocs[r].classList.remove('debut-page');
      flux.appendChild(blocs[r]);
    }

    var hauteurs = blocs.map(hPx);

    /* Répartition : la page 1 démarre à DEBUT_P1, les suivantes à
       DEBUT_N ; un titre de section (data-heading) ne reste jamais
       orphelin en bas de page — il exige de la place pour lui et
       le début du bloc qui suit.
       NOTE : le PREMIER bloc d'une page de suite voit sa marge
       haute ANNULÉE au montage (marginTop = 0) — elle ne doit donc
       pas compter dans la capacité (bug mesuré : pages sur-numéraires). */
    var repartis = [[]];
    var h = 0;
    var cap = LIMITE - DEBUT_P1;
    for (var j = 0; j < blocs.length; j++) {
      var b = blocs[j];
      var bh = hauteurs[j];
      var premierDePage = repartis[repartis.length - 1].length === 0;
      if (premierDePage && repartis.length > 1) {
        bh = b.offsetHeight; /* marge haute annulée → hors capacité */
      }
      var heading = b.hasAttribute('data-heading');
      var reste = cap - (h + bh);
      /* Garantie anti-orphelin (calée sur l'exemple de l'éditeur) :
         un titre ne reste en bas de page que si lui-même + les DEUX
         blocs suivants tiennent (pastille + intro + appel de liste).
         La contribution du 2e bloc est plafonnée (blocs très hauts
         comme une rangée d'échéances). */
      var garder = 0;
      if (heading && j + 1 < blocs.length) {
        var suite = hauteurs[j + 1];
        if (j + 2 < blocs.length) suite += Math.min(hauteurs[j + 2], 100);
        garder = Math.min(suite + 12, hauteurs[j + 1] + 112);
      }
      if (premierDePage && repartis.length === 1) {
        /* blocs fixes d'en-tête de la page 1 : jamais déplacés */
      } else if (reste < 0 || (heading && reste < garder)) {
        repartis.push([]);
        h = 0;
        cap = LIMITE - DEBUT_N;
        bh = b.offsetHeight; /* premier de la nouvelle page */
      }
      repartis[repartis.length - 1].push(b);
      h += bh;
    }

    var gabarit = document.getElementById('pc-gabarits');
    var enteteN = gabarit ? gabarit.querySelector('.entete-n') : null;
    var piedN = gabarit ? gabarit.querySelector('.pied') : null;
    var wm = gabarit ? gabarit.querySelector('.wm') : null;
    var total = repartis.length;
    for (var p = 0; p < total; p++) {
      var page = document.createElement('div');
      page.className = 'ppage' + (p === 0 ? ' ppage1' : ' ppage-n') + (p === total - 1 ? ' ppage-fin' : '');
      page.setAttribute('data-page', String(p + 1));
      if (wm) page.appendChild(wm.cloneNode(true));
      if (p > 0 && ENTETE_COMPACTE && enteteN) {
        page.appendChild(enteteN.cloneNode(true));
      }
      var corps = document.createElement('div');
      corps.className = 'corps';
      for (var k = 0; k < repartis[p].length; k++) {
        var bloc = repartis[p][k];
        if (k === 0 && p > 0) {
          bloc.style.marginTop = '0';
          /* marque le premier bloc d'une page de suite (filet
             supérieur du tableau qui reprend, par exemple) */
          bloc.classList.add('debut-page');
        }
        corps.appendChild(bloc);
      }
      page.appendChild(corps);
      if (piedN) {
        var pd = piedN.cloneNode(true);
        var numEl = pd.querySelector('.p-num');
        if (numEl) {
          if (FORMAT_SIMPLE) {
            numEl.innerHTML = 'Page ' + (p + 1) + ' sur ' + total;
          } else {
            numEl.innerHTML = '<b>' + (p + 1 < 10 ? '0' + (p + 1) : p + 1) + '</b> / ' + (total < 10 ? '0' + total : total);
          }
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
    var prets = Promise.resolve();
    if (document.fonts && document.fonts.load) {
      prets = Promise.all([
        document.fonts.load('300 10pt Poppins'),
        document.fonts.load('400 10pt Poppins'),
        document.fonts.load('500 10pt Poppins'),
        document.fonts.load('600 10pt Poppins'),
        document.fonts.load('700 10pt Poppins'),
        document.fonts.load('400 10pt Inter'),
        document.fonts.load('600 10pt Inter'),
        document.fonts.load('700 10pt Inter'),
      ]).catch(function () {});
    }
    Promise.race([prets, new Promise(function (r) { setTimeout(r, 4000); })]).then(function () {
      try { paginer(); } catch (e) { /* repli : flux continu */ }
      setTimeout(function () { try { paginer(); } catch (e) {} }, 600);
      setTimeout(function () { try { paginer(); } catch (e) {} }, 1600);
      setTimeout(function () { try { paginer(); } catch (e) {} }, 3200);
    });
  }
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () {
      setTimeout(function () { if (pagine) { try { paginer(); } catch (e) {} } }, 80);
    });
  }
  lancer();
})();
`;
}
