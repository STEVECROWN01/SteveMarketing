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
  /** VOLET 22 (27/11/2026) — RÉSERVE BASSE (px) : espace minimal
   *  garanti entre le BAS du dernier bloc de la page (le tableau
   *  quand il remplit la page) et le PIED DE PAGE. Sans réserve,
   * un tableau qui remplit la PREMIÈRE page venait coller le pied
   * (demande de l'éditeur : « sur la première page, ça coince le
   *  footer ; l'espace tableau-footer doit être comme celui des
   *  pages suivantes »). 0 = comportement inchangé (propositions :
   *  pagination calée sur l'exemple, ne pas toucher). */
  reserveBasPx?: number;
  /** CORRECTIF M29 (28/11/2026) — ÉCLATEMENT AU NIVEAU LIGNE : quand
   *  une rangée du tableau ne tient plus sur la page, son dernier
   *  paragraphe (ou élément de liste à texte simple) est COUPÉ AU MOT
   *  PRÈS pour remplir la page EXACTEMENT — il ne reste qu'UNE LIGNE
   *  d'espace entre le bas du tableau et le pied avant de poursuivre
   *  sur la page suivante (retour de l'éditeur, demandé à trois
   *  reprises : « le tableau doit arriver jusqu'à un niveau où il ne
   *  reste qu'une ligne d'espace proche du footer avant de poursuivre
   *  sur la page suivante — pour toutes les pages, devis des
   *  propositions comme devis directs et factures »). Le reste
   *  poursuit en tête de page suivante (rangée de continuation,
   *  cellules vides à droite — comme dans Word). FALSE (propositions)
   *  : pagination calée sur l'exemple, ne pas toucher. */
  eclatementLigne?: boolean;
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
  var RESERVE_BAS = ${Math.max(0, Math.round(conf.reserveBasPx ?? 0))};
  var ECLATEMENT = ${conf.eclatementLigne ? "true" : "false"};
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

    /* CORRECTIF M29 — FUSION DES ÉCLATEMENTS D'UNE PASSE PRÉCÉDENTE :
       la pagination est RELANCÉE quand les polices web arrivent (les
       métriques changent) ; les coupures au niveau ligne calculées
       pendant une passe antérieure (avec les mauvaises métriques de la
       police de repli) doivent être ANNULÉES avant de repaginer : la
       rangée d'ORIGINE est reconstituée (texte et classes d'origine),
       la rangée de continuation est retirée — la passe courante
       recalcule TOUTES les coupures avec les métriques finales. Sans
       cela, les points de coupure restaient figés sur les mesures
       d'avant les polices (écart mesuré sur le PDF réel : une ligne
       de trop sous le tableau). */
    for (var fm = blocs.length - 1; fm >= 0; fm--) {
      var pf = blocs[fm];
      if (!pf.getAttribute || !pf.getAttribute('data-split-suite')) continue;
      var po = fm > 0 ? blocs[fm - 1] : null;
      if (!po || !po.getAttribute || !po.getAttribute('data-split')) continue;
      try {
        var richePo = null;
        var cellPo = null;
        for (var cp = 0; cp < po.children.length; cp++) {
          if (po.children[cp].classList && po.children[cp].classList.contains('desc-cell')) {
            cellPo = po.children[cp];
          }
        }
        if (cellPo) {
          for (var rp = 0; rp < cellPo.children.length; rp++) {
            if (
              cellPo.children[rp].classList &&
              cellPo.children[rp].classList.contains('desc-riche')
            ) {
              richePo = cellPo.children[rp];
            }
          }
        }
        if (richePo) {
          var dernierPo = richePo.lastElementChild;
          var ciblePo = dernierPo;
          if (
            dernierPo &&
            (dernierPo.tagName === 'UL' || dernierPo.tagName === 'OL') &&
            dernierPo.children.length === 1
          ) {
            ciblePo = dernierPo.children[0];
          }
          if (ciblePo && ciblePo.childNodes.length === 1 && ciblePo.childNodes[0].nodeType === 3) {
            ciblePo.childNodes[0].nodeValue = po.getAttribute('data-split-txt');
          }
          if (dernierPo) {
            dernierPo.setAttribute('class', po.getAttribute('data-split-cls') || '');
          }
        }
        po.classList.remove('suite-apres');
        if (po.getAttribute('data-split-fin')) po.classList.add('svc-fin');
        po.removeAttribute('data-split');
        po.removeAttribute('data-split-txt');
        po.removeAttribute('data-split-cls');
        po.removeAttribute('data-split-fin');
        pf.remove();
        blocs.splice(fm, 1);
      } catch (em) {}
    }

    for (var r = 0; r < blocs.length; r++) {
      blocs[r].style.marginTop = '';
      blocs[r].classList.remove('debut-page');
      blocs[r].classList.remove('fin-page');
      flux.appendChild(blocs[r]);
    }

    /* VOLET 20 (26/11/2026) — EN-TÊTE DU TABLEAU « Détail » : quand
       le tableau se POURSUIT sur une page suivante (une ligne-bloc
       svc-part ouvre la page), l'en-tête du tableau (svc-head) est
       REPRIS en tête de cette page (demande de l'éditeur : « sur la
       page où ça continue, l'entête du tableau doit être repris sur
       cette page suivante-là aussi pour qu'on reconnaisse les
       colonnes »). Sans svc-head (proposition commerciale), tout
       reste inchangé. */
    var enteteTableau = null;
    for (var e = 0; e < blocs.length; e++) {
      if (blocs[e].classList && blocs[e].classList.contains('svc-head')) {
        enteteTableau = blocs[e];
        break;
      }
    }
    var hEnteteTableau = enteteTableau ? enteteTableau.offsetHeight : 0;

    var hauteurs = blocs.map(hPx);

    /* CORRECTIF M29 (28/11/2026) — ÉCLATEMENT AU NIVEAU LIGNE (activé
       pour les DEVIS et FACTURES via conf.eclatementLigne) : quand une
       rangée du tableau ne tient plus dans l'espace restant de la
       page, son DERNIER élément à TEXTE SIMPLE (le <p> d'une phrase,
       ou l'<ul>/<ol> d'un seul <li> à texte simple) est COUPÉ AU MOT
       PRÈS (recherche binaire) : la partie haute REMPLIT la page
       jusqu'à la réserve basse, le reste devient une RANGÉE DE
       CONTINUATION en tête de la page suivante (cellules vides à
       droite — comme dans Word). Le tableau arrive ainsi à UNE LIGNE
       du pied de page avant de poursuivre (demande de l'éditeur,
       répétée trois fois). Échec silencieux = comportement d'avant
       (bloc entier sur la page suivante). */
    function tenterEclatement(j, disponible) {
      var b = blocs[j];
      var noeud = null;
      var texte = null;
      try {
        if (!ECLATEMENT || disponible <= 24) return false;
        if (!b.classList || !b.classList.contains('svc-part')) return false;
        if (b.getAttribute('data-split')) return false;
        var cellule = null;
        for (var ci = 0; ci < b.children.length; ci++) {
          if (b.children[ci].classList && b.children[ci].classList.contains('desc-cell')) {
            cellule = b.children[ci];
          }
        }
        if (!cellule) return false;
        var riche = null;
        for (var ri = 0; ri < cellule.children.length; ri++) {
          if (
            cellule.children[ri].classList &&
            cellule.children[ri].classList.contains('desc-riche')
          ) {
            riche = cellule.children[ri];
          }
        }
        if (!riche) return false;
        var dernier = riche.lastElementChild;
        if (!dernier) return false;
        var conteneur = dernier;
        var dansListe = false;
        if (dernier.tagName === 'UL' || dernier.tagName === 'OL') {
          if (dernier.children.length !== 1) return false;
          conteneur = dernier.children[0];
          if (conteneur.tagName !== 'LI') return false;
          dansListe = true;
        }
        if (conteneur.tagName !== 'P' && conteneur.tagName !== 'LI') return false;
        if (conteneur.childNodes.length !== 1 || conteneur.childNodes[0].nodeType !== 3) {
          return false;
        }
        noeud = conteneur.childNodes[0];
        texte = noeud.nodeValue;
        if (!texte || !texte.trim()) return false;
        var mots = texte.split(/\s+/);
        if (mots.length < 3) return false;

        /* recherche binaire : le plus grand nombre de mots (au moins
           deux) dont la rangée tienne encore dans l'espace restant. */
        var bas = 2;
        var haut = mots.length - 1;
        var retenu = -1;
        while (bas <= haut) {
          var milieu = (bas + haut) >> 1;
          noeud.nodeValue = mots.slice(0, milieu).join(' ');
          if (hPx(b) <= disponible) {
            retenu = milieu;
            bas = milieu + 1;
          } else {
            haut = milieu - 1;
          }
        }
        if (retenu < 2) {
          noeud.nodeValue = texte;
          return false;
        }
        var texte2 = mots.slice(retenu).join(' ');
        if (!texte2.trim()) {
          noeud.nodeValue = texte;
          return false;
        }

        /* PARTIE 1 — le texte coupé : la rangée se POURSUIT (marge
           intérieure basse annulée, le tableau ne se ferme pas ici).
           Attributs data-split-* : la FUSION en tête de la passe
           suivante reconstituera la rangée d'ORIGINE (texte et classes)
           si les polices arrivent après coup (métriques différentes). */
        noeud.nodeValue = mots.slice(0, retenu).join(' ');
        var classesP = conteneur.getAttribute('class') || '';
        var classesOrigine = dansListe ? dernier.getAttribute('class') || '' : classesP;
        conteneur.setAttribute('class', classesP.replace(/\s*--fin/g, ''));
        var classesBloc = b.getAttribute('class') || '';
        var fermeBloc = /svc-fin/.test(classesBloc);
        if (fermeBloc) b.classList.remove('svc-fin');
        b.classList.add('suite-apres');
        b.setAttribute('data-split', '1');
        b.setAttribute('data-split-txt', texte);
        b.setAttribute('data-split-cls', classesOrigine);
        if (fermeBloc) b.setAttribute('data-split-fin', '1');

        /* PARTIE 2 — le reste du texte : RANGÉE DE CONTINUATION en
           tête de la page suivante (cellules vides à droite). */
        var suite2 = document.createElement(dansListe ? dernier.tagName : 'P');
        if (dansListe) {
          suite2.setAttribute(
            'class',
            (dernier.getAttribute('class') || '').replace(/\s*--debut/g, ''),
          );
          var li2 = document.createElement('LI');
          li2.setAttribute('class', 'sans-puce');
          li2.appendChild(document.createTextNode(texte2));
          suite2.appendChild(li2);
        } else {
          suite2.setAttribute('class', classesP.replace(/\s*--debut/g, ''));
          suite2.appendChild(document.createTextNode(texte2));
        }
        var r2 = document.createElement('DIV');
        r2.setAttribute('data-bloc', '');
        r2.setAttribute('data-split', '1');
        r2.setAttribute('data-split-suite', '1');
        r2.setAttribute('class', 'svc-part suite-avant' + (fermeBloc ? ' svc-fin' : ''));
        for (var c2 = 0; c2 < b.children.length; c2++) {
          var orig = b.children[c2];
          if (orig.classList && orig.classList.contains('desc-cell')) {
            var dCell = document.createElement('DIV');
            dCell.setAttribute('class', 'cell desc-cell');
            var dRiche = document.createElement('DIV');
            dRiche.setAttribute('class', 'desc-riche');
            dRiche.appendChild(suite2);
            dCell.appendChild(dRiche);
            r2.appendChild(dCell);
          } else {
            var vide = document.createElement('DIV');
            vide.setAttribute('class', 'cell cell-vide');
            r2.appendChild(vide);
          }
        }
        flux.insertBefore(r2, b.nextSibling);
        blocs.splice(j + 1, 0, r2);
        hauteurs.splice(j + 1, 0, hPx(r2));
        hauteurs[j] = hPx(b);
        return true;
      } catch (e) {
        try {
          if (noeud && texte !== null) noeud.nodeValue = texte;
        } catch (e2) {}
        return false;
      }
    }

    /* Répartition : la page 1 démarre à DEBUT_P1, les suivantes à
       DEBUT_N ; un titre de section (data-heading) ne reste jamais
       orphelin en bas de page — il exige de la place pour lui et
       le début du bloc qui suit.
       NOTE : le PREMIER bloc d'une page de suite voit sa marge
       haute ANNULÉE au montage (marginTop = 0) — elle ne doit donc
       pas compter dans la capacité (bug mesuré : pages sur-numéraires).
       VOLET 20 : une page qui OUVRIRA avec une ligne du tableau
       (continuation) voit sa capacité réduite de la hauteur de
       l'en-tête du tableau qui y est REPRIS. */
    var repartis = [[]];
    var avecEntete = [false];
    var h = 0;
    var cap = LIMITE - DEBUT_P1 - RESERVE_BAS;
    for (var j = 0; j < blocs.length; j++) {
      var b = blocs[j];
      var bh = hauteurs[j];
      var premierDePage = repartis[repartis.length - 1].length === 0;
      if (premierDePage && repartis.length > 1) {
        bh = b.offsetHeight; /* marge haute annulée → hors capacité */
      }
      var heading = b.hasAttribute('data-heading');
      /* CORRECTIF 28/11/2026 (retour de l'éditeur) : « il y a
         suffisamment d'espace sous le bloc paiement, mais tu as
         envoyé la validité du document ainsi que la note sur AUTRE
         PAGE. Tant qu'il y a de l'espace et que ça ne va pas coincer
         au footer, il faut le mettre là au lieu d'aller sur une
         autre page. »
         CAUSE : la réserve basse (VOLET 22 — espace tableau↔pied)
         était retranchée pour TOUS les blocs : le bloc validité+notes
         (33 px) manquait la place de 2 px et partait seul sur une
         page supplémentaire, avec ~250 px de vide sous le bloc
         PAIEMENT.
         CORRECTIF : la réserve basse protège le CONTACT TABLEAU↔PIED
         — elle ne réduit PAS la place des blocs LÉGERS qui suivent
         le tableau (total, CGV, PAIEMENT, validité et notes) : tant
         qu'ils tiennent au-dessus de la limite du contenu (elle-même
         au-dessus du pied), ils RESTENT sur la page. Le tableau garde
         sa réserve (VOLET 22 inchangé). */
      var estBlocTableau =
        b.classList &&
        (b.classList.contains('svc-part') || b.classList.contains('svc-foot'));
      var capBloc = estBlocTableau ? cap : cap + RESERVE_BAS;
      var reste = capBloc - (h + bh);
      /* Garantie anti-orphelin (calée sur l'exemple de l'éditeur) :
         un titre ne reste en bas de page que si lui-même + les DEUX
         blocs suivants tiennent (pastille + intro + appel de liste).
         La contribution du 2e bloc est plafonnée (blocs très hauts
         comme une rangée d'échéances). */
      var garder = 0;
      if (heading && j + 1 < blocs.length) {
        var suite = hauteurs[j + 1];
        if (j + 2 < blocs.length) suite += Math.min(hauteurs[j + 2], 48);
        garder = Math.min(suite + 12, hauteurs[j + 1] + 112);
      }
      /* CORRECTIF M29 — la rangée ne tient pas : tenter l'ÉCLATEMENT
         AU NIVEAU LIGNE d'abord (le texte coupé REMPLIT la page, le
         reste poursuit en page suivante) ; en cas d'échec, la rangée
         part entière sur la page suivante (comportement d'avant). */
      if (reste < 0 && estBlocTableau && !(premierDePage && repartis.length === 1)) {
        if (tenterEclatement(j, capBloc - h)) {
          bh = hauteurs[j];
          reste = capBloc - (h + bh);
        }
      }
      if (premierDePage && repartis.length === 1) {
        /* blocs fixes d'en-tête de la page 1 : jamais déplacés */
      } else if (reste < 0 || (heading && reste < garder)) {
        repartis.push([]);
        h = 0;
        /* VOLET 20 — la page qui s'ouvre sur une LIGNE DU TABLEAU
           (svc-part) est une page de CONTINUATION : l'en-tête du
           tableau y est repris — sa hauteur est retranchée de la
           capacité pour ne rien déborder. */
        if (
          enteteTableau &&
          b.classList &&
          b.classList.contains('svc-part')
        ) {
          avecEntete.push(true);
          cap = LIMITE - DEBUT_N - hEnteteTableau - RESERVE_BAS;
        } else {
          avecEntete.push(false);
          cap = LIMITE - DEBUT_N - RESERVE_BAS;
        }
        bh = b.offsetHeight; /* premier de la nouvelle page */
      }
      repartis[repartis.length - 1].push(b);
      h += bh;
    }

    /* VOLET 23 — TRAIT DE FERMETURE EN BAS DE PAGE COUPÉE : quand le
       tableau se POURSUIT sur la page suivante (le premier bloc de
       la page suivante est une ligne du tableau ou son pied noir),
       la portion laissée sur la page en cours se TERMINE par un
       filet FIN (.fin-page — trait horizontal comme les bords du
       tableau, demande de l'éditeur : « en bas, là où le tableau
       s'est arrêté, il doit avoir la fin du tableau — un trait
       horizontal fin — puis continuer sur la page suivante avec
       l'entête »). Le tableau ne reste JAMAIS « ouvert » en bas de
       page. */
    for (var fp = 0; fp < repartis.length - 1; fp++) {
      var blocsPage = repartis[fp];
      var blocsPageSuivante = repartis[fp + 1];
      if (!blocsPage.length || !blocsPageSuivante.length) continue;
      var dernierBloc = blocsPage[blocsPage.length - 1];
      var premierBlocSuivant = blocsPageSuivante[0];
      if (
        dernierBloc.classList &&
        dernierBloc.classList.contains('svc-part') &&
        premierBlocSuivant.classList &&
        (premierBlocSuivant.classList.contains('svc-part') ||
          premierBlocSuivant.classList.contains('svc-foot'))
      ) {
        dernierBloc.classList.add('fin-page');
      }
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
      /* VOLET 20 — page de CONTINUATION du tableau : l'en-tête du
         tableau (svc-head) est REPRIS en tête de page (clone sans
         data-bloc — jamais re-collecté lors d'une re-pagination). */
      if (p > 0 && avecEntete[p] && enteteTableau) {
        var cloneEntete = enteteTableau.cloneNode(true);
        cloneEntete.removeAttribute('data-bloc');
        cloneEntete.removeAttribute('data-heading');
        corps.appendChild(cloneEntete);
      }
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
