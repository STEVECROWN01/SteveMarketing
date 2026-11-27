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
 *  l'affiche tel quel en UN SEUL paragraphe coulant.
 *
 *  VOLET 23 (27/11/2026) — UN SEUL PARAGRAPHE, comme dans le champ
 *  (demande de l'éditeur : « le contenu de la colonne description
 *  pré-remplie est en paragraphe dans le champ, mais dans le tableau
 *  ce n'est pas en paragraphe — ça considère une phrase comme un
 *  paragraphe et c'est espacé. Quand dans le champ c'est en
 *  paragraphe, sur le document ça doit être également en
 *  paragraphe ») : le champ de rédaction affiche les lignes d'un
 *  texte brut comme UN bloc coulant (les retours à la ligne
 *  s'effacent à l'affichage) — le document rend désormais la MÊME
 *  chose : les lignes se rejoignent par des espaces dans UN SEUL
 *  paragraphe (plus un paragraphe espacé par phrase). */
export function htmlRicheOuTexteBrut(html: string | null | undefined): string {
  const riche = assainirHtmlRiche(html);
  if (!riche) return "";
  if (/<(p|br|b|strong|i|em|u|font|span|ul|ol|li|div)\b/i.test(riche)) {
    return riche;
  }
  /* texte brut : UN SEUL paragraphe coulant (comme dans le champ). */
  const lignes = riche
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => escapeHtml(l));
  if (!lignes.length) return "";
  return `<p>${lignes.join(" ")}</p>`;
}

/** Découpe une description riche en FRAGMENTS de bloc (un
 *  paragraphe, un élément de liste) — chaque fragment devient une
 *  ligne-bloc paginable du tableau : une description plus longue
 *  qu'une page se poursuit sur la page suivante, le tableau
 *  continue (VOLET 17).
 *
 *  VOLET 19 (26/11/2026) — GRANULARITÉ FINE : les listes
 *  (<ul>/<ol>) sont ÉCLATÉES élément par élément. Avant, une liste
 *  entière formait UN SEUL bloc : une description dense était
 *  repoussée EN BLOC sur la page suivante en laissant un grand vide
 *  en bas de la première page (bug signalé par l'éditeur : « le
 *  tableau ne finit pas la première page mais continue sur la page
 *  suivante, il y a suffisamment d'espace en bas… voire même
 *  disparaît de la première page »). Désormais CHAQUE <li> est son
 *  propre bloc paginable : le tableau remplit la page jusqu'en bas
 *  et se poursuit naturellement. Les fragments d'une même liste
 *  portent « li-suite » (+ --debut / --fin) : marges calquées sur
 *  celles d'une liste unique — visuellement RIEN ne change.
 *
 *  VOLET 21 (27/11/2026) — PARAGRAPHES LONGS : même correctif pour
 *  les <p> denses (bug reconfirmé par l'éditeur : une description
 *  rédigée en un long paragraphe formait UN SEUL bloc — le tableau
 *  ENTIER disparaissait de la page en laissant un grand vide, puis
 *  « reculait » encore d'une page en continuant de taper). Un
 *  paragraphe long est ÉCLATÉ PHRASE PAR PHRASE (p-suite) : le
 *  tableau se coupe en bas de page (près du pied) et se poursuit
 *  sur la page suivante, l'en-tête du tableau y est repris.
 *  Rendu visuel IDENTIQUE : les phrases se suivent sans marge,
 *  comme un paragraphe unique.
 *
 *  VOLET 23 (27/11/2026) — BLOCS <div> ENTIERS : un <div> complet
 *  (titre de périmètre + sa description, générés par le devis depuis
 *  proposition) reste UN SEUL fragment — le titre et sa description
 *  partagent la MÊME rangée du tableau, l'espace entre eux se réduisant
 *  au strict minimum (demande de l'éditeur : « l'espace entre les
 *  titres des périmètres et les descriptions est trop — réduis ça »).
 *  Le contenu qui suit la fermeture du <div> est découpé à son tour. */
export function decouperHtmlRiche(html: string | null | undefined): string[] {
  const riche = htmlRicheOuTexteBrut(html);
  if (!riche) return [];
  if (!/<(p|ul|ol|div|font)\b/i.test(riche)) {
    /* texte/inline sans bloc : chaque ligne devient UN PARAGRAPHE —
     *     long, il est éclaté en phrases paginables (CORRECTIF
     *     28/11, M21 : un contenu inline volumineux formait UNE RANGÉE
     *     GÉANTE repoussée en bloc sur la page suivante). */
    return riche
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .flatMap((l) => decouperParagraphe(`<p>${l}</p>`));
  }

  const fragments: string[] = [];
  /* VOLET 23 — pré-passe : extraire chaque <div>…</div> COMPLET comme
   * fragment unique, puis découper ce qui l'entoure comme avant. */
  let reste = riche;
  while (reste) {
    const debutDiv = reste.search(/<div\b/i);
    if (debutDiv === -1) {
      fragments.push(...decouperSegments(reste));
      reste = "";
      break;
    }
    if (debutDiv > 0) fragments.push(...decouperSegments(reste.slice(0, debutDiv)));
    const apresDiv = reste.slice(debutDiv);
    const fermeture = apresDiv.match(/<\/div\s*>/i);
    if (!fermeture || fermeture.index === undefined) {
      /* div jamais fermé : bloc entier (découpe tolérante — un div
       * sans fermeture ne peut pas être rééquilibré en phrases) */
      fragments.push(apresDiv);
      reste = "";
    } else {
      const finDiv = fermeture.index + fermeture[0].length;
      /* CORRECTIF 28/11 (M21) : le <div> EXTRAIT passe lui aussi par
       * decouperParagraphe — un <div> LONG au contenu INLINE (un
       * paragraphe tapé à l'éditeur, Entrée = <div>) est éclaté en
       * PHRASES paginables ; un <div> à contenu de BLOC (titre +
       * description d'un périmètre de proposition, VOLET 23) reste
       * ENTIER (rendu inchangé). */
      fragments.push(...decouperParagraphe(apresDiv.slice(0, finDiv)));
      reste = apresDiv.slice(finDiv);
    }
  }

  /* VOLET 22 (27/11/2026) — fragments VIDES retirés : l'éclatement
   *  phrase par phrase pouvait laisser un fragment sans texte visible
   *  (balises seules) — il s'imprimait comme une RANGÉE VIDE de ~10 px
   *  dans le tableau (une par paragraphe : ~80 px perdus sur un devis
   *  de huit paragraphes) et repoussait la fin du document à une
   *  page supplémentaire. */
  return fragments.filter(
    (f) => f.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim() !== "",
  );
}

/** Découpe un segment SANS <div> de premier niveau en fragments de
 *  bloc (paragraphe, liste, font) — l'éclatement <li> par <li> et la
 *  découpe phrase par phrase des longs paragraphes sont conservés. */
function decouperSegments(segment: string): string[] {
  const bruts = segment
    .split(/(?=<p\b|<ul\b|<ol\b|<div\b|<font\b)/i)
    .map((m) => m.trim())
    .filter(Boolean);

  const fragments: string[] = [];
  for (const brut of bruts) {
    /* CORRECTIF 28/11 (M21) : un segment TEXTUEL (sans balise de
     * bloc — l'éditeur laisse le premier paragraphe en texte brut
     * avant les <div> d'Entrée, un copier-coller aussi) devient UN
     * PARAGRAPHE coulant, éclaté en phrases paginables s'il est
     * long — plus jamais UNE rangée géante repoussée en bloc en
     * laissant un grand vide sous le tableau de la première page
     * (demande de l'éditeur : « ça doit OBLIGATOIREMENT finir la
     * première page avant de continuer sur une autre page »). */
    if (!/^<(p|ul|ol|div|font)\b/i.test(brut)) {
      fragments.push(...decouperParagraphe(`<p>${brut}</p>`));
      continue;
    }
    /* Fragment = UNE liste pure (sans liste imbriquée) → éclater. */
    const m = brut.match(/^<(ul|ol)\b[^>]*>([\s\S]*)<\/\1\s*>$/i);
    if (m) {
      const balise = m[1].toLowerCase();
      const nbListes = (m[2].match(/<(ul|ol)\b/gi) || []).length;
      if (nbListes === 0) {
        const items = m[2]
          .split(/(?=<li\b)/i)
          .map((s) => s.trim())
          .filter((s) => /^<li\b/i.test(s));
        if (items.length > 0) {
          items.forEach((item, i) => {
            const classes =
              "li-suite" +
              (i === 0 ? " li-suite--debut" : "") +
              (i === items.length - 1 ? " li-suite--fin" : "");
            fragments.push(
              balise === "ol"
                ? `<ol class="${classes}" start="${i + 1}">${item}</ol>`
                : `<ul class="${classes}">${item}</ul>`,
            );
          });
          continue;
        }
      }
    }
    /* paragraphe (éclaté en phrases si long, VOLET 21), div, liste
     *  imbriquée : blocs entiers */
    fragments.push(...decouperParagraphe(brut));
  }
  /* VOLET 22 (27/11/2026) — fragments VIDES retirés : l'éclatement
   *  phrase par phrase pouvait laisser un fragment sans texte visible
   *  (balises seules) — il s'imprimait comme une RANGÉE VIDE de ~10 px
   *  dans le tableau (une par paragraphe : ~80 px perdus sur un devis
   *  de huit paragraphes) et repoussait la fin du document à une
   *  page supplémentaire. */
  return fragments.filter(
    (f) => f.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim() !== "",
  );
}

/* ------------------------------------------------------------------
 * VOLET 21 (27/11/2026) — ÉCLATEMENT PHRASE PAR PHRASE DES
 * PARAGRAPHES LONGS (voir decouperHtmlRiche).
 * ------------------------------------------------------------------ */

/** Seuil (caractères de texte) au-delà duquel un paragraphe est
 *  éclaté en phrases paginables. */
const SEUIL_PHRASES = 120;

/** Abréviations courantes : le point qui les suit ne TERMINE PAS
 *  une phrase (p. ex., etc., M., Dr.…). */
const ABREVIATIONS = new Set([
  "etc", "ex", "exx", "cf", "p", "av", "art", "vol", "chap", "fig",
  "no", "n", "nr", "mr", "mme", "dr", "pr", "st", "ste", "bd",
  "janv", "févr", "fevr", "avr", "juil", "sept", "oct", "nov", "déc", "dec",
]);

/** Balises EN LIGNE qui peuvent enjamber une coupure de phrase —
 *  elles sont refermées / rouvertes proprement de part et d'autre
 *  (attributs d'origine conservés, p. ex. <font size="5">). */
const BALISES_EN_LIGNE = new Set(["b", "strong", "i", "em", "u", "font", "span"]);

/** Coupure de phrase : [. ! ? …] suivi d'espaces — ou de la FIN
 *  du segment de texte (la phrase suivante peut commencer après
 *  une balise : « <b>phrase.</b> Suite… ») — et le caractère
 *  visible suivant COMMENCE une phrase (majuscule, chiffre,
 *  guillemet, parenthèse…). */
const RE_BORDURE = /([.!\u2026])(?:(?:\s+|&nbsp;)+|$)/g;
const RE_DEBUT_PHRASE = /^[A-ZÀ-ÖØ-Þ0-9«"'\u201c\u2018(]/;

/** Découpe un HTML INLINE en PHRASES brutes — coupure uniquement
 *  HORS des balises, après . ! ? … suivi d'un espace (ou en fin de
 *  segment si la phrase suivante commence après des balises) ; le
 *  mot précédant le point n'est pas une abréviation. Les balises
 *  FERMANTES qui suivent la fin de phrase restent avec la phrase
 *  terminée ; les balises OUVRANTES partent avec la suivante. */
function fragmenterPhrase(html: string): string[] {
  /* 1) Segmenter en balises / texte. */
  const morceaux: { balise: boolean; valeur: string }[] = [];
  let dernier = 0;
  for (const m of html.matchAll(/<[^>]+>/g)) {
    const debut = m.index ?? 0;
    if (debut > dernier) morceaux.push({ balise: false, valeur: html.slice(dernier, debut) });
    morceaux.push({ balise: true, valeur: m[0] });
    dernier = debut + m[0].length;
  }
  if (dernier < html.length) morceaux.push({ balise: false, valeur: html.slice(dernier) });

  /* Premier caractère VISIBLE après le morceau `depuis` (les
   *  balises ne comptent pas, les espaces de tête sont ignorés) —
   *  reconnaît le début d'une phrase AU-DELÀ d'une balise. */
  const premierVisibleApres = (depuis: number): string => {
    for (let i = depuis; i < morceaux.length; i++) {
      const mo = morceaux[i];
      if (mo.balise) continue;
      const ch = mo.valeur.replace(/^[\s\u00a0]+/, "");
      if (ch.length > 0) return ch.charAt(0);
    }
    return "";
  };

  /* 2) Passe unique, phrase par phrase. `enAttente` marque une fin
   *    de phrase au bord d'un segment : la coupure part APRÈS les
   *    balises fermantes qui suivent (elles ferment la phrase
   *    terminée) ; une balise OUVRANTE ou un texte démarre la
   *    phrase suivante. */
  const phrases: string[] = [];
  let courante = "";
  let textePhrase = "";
  let enAttente = false;
  const clorePhrase = () => {
    phrases.push(courante);
    courante = "";
    textePhrase = "";
    enAttente = false;
  };

  for (let i = 0; i < morceaux.length; i++) {
    const morceau = morceaux[i];
    if (morceau.balise) {
      if (enAttente && !morceau.valeur.startsWith("</")) clorePhrase();
      courante += morceau.valeur;
      continue;
    }
    if (enAttente) clorePhrase();
    const segment = morceau.valeur;

    /* Coupures DANS le segment : après [.!?…] + espaces. */
    const bordures: number[] = [];
    RE_BORDURE.lastIndex = 0;
    let mm: RegExpExecArray | null;
    while ((mm = RE_BORDURE.exec(segment)) !== null) {
      const fin = mm.index + mm[0].length;
      const premier =
        fin < segment.length ? segment.charAt(fin) : premierVisibleApres(i + 1);
      if (!RE_DEBUT_PHRASE.test(premier)) continue;
      /* abréviation ? le mot qui précède le point. */
      const texteAvant = (textePhrase + segment.slice(0, mm.index)).replace(/[\s\u00a0]+$/, "");
      const mMot = /([A-Za-zÀ-\u017f]+)$/.exec(texteAvant);
      if (mMot) {
        const mot = mMot[1].toLowerCase();
        if (ABREVIATIONS.has(mot) || /^[A-ZÀ-ÖØ-Þ]$/.test(mMot[1])) continue;
      }
      if (fin < segment.length) bordures.push(fin);
      else enAttente = true;
    }
    let base = 0;
    for (const b of bordures) {
      courante += segment.slice(base, b);
      clorePhrase();
      base = b;
    }
    const reste = segment.slice(base);
    courante += reste;
    textePhrase += reste;
  }
  if (courante.trim()) phrases.push(courante);
  return phrases;
}

/** Rééquilibre les balises EN LIGNE autour de chaque coupure : les
 *  balises restées ouvertes en fin de phrase sont refermées puis
 *  rouvertes (attributs d'origine) en tête de la phrase suivante. */
function equilibrerPhrases(phrasesBrutes: string[]): string[] {
  const heritees: { nom: string; brute: string }[] = [];
  return phrasesBrutes.map((brute) => {
    const ouverture = heritees.map((b) => b.brute).join("");
    const locales: { nom: string; brute: string }[] = [];
    let sortie = "";
    let dernier = 0;
    for (const m of brute.matchAll(/<[^>]+>/g)) {
      sortie += brute.slice(dernier, m.index);
      sortie += m[0];
      dernier = (m.index ?? 0) + m[0].length;
      const mNom = /^<\/?([a-zA-Z][a-zA-Z0-9-]*)/.exec(m[0]);
      const nom = mNom?.[1]?.toLowerCase();
      if (!nom || !BALISES_EN_LIGNE.has(nom)) continue;
      if (m[0].startsWith("</")) {
        const idxLocal = [...locales].reverse().findIndex((b) => b.nom === nom);
        if (idxLocal !== -1) {
          locales.splice(locales.length - 1 - idxLocal, 1);
        } else {
          const idxH = [...heritees].reverse().findIndex((b) => b.nom === nom);
          if (idxH !== -1) heritees.splice(heritees.length - 1 - idxH, 1);
        }
      } else {
        locales.push({ nom, brute: m[0] });
      }
    }
    sortie += brute.slice(dernier);
    for (let i = locales.length - 1; i >= 0; i--) sortie += `</${locales[i].nom}>`;
    heritees.push(...locales);
    return ouverture + sortie;
  });
}

/** Éclate un fragment <p> OU <div> (l'éditeur produit des <div> à
 *  chaque Entrée) en phrases paginables (p-suite) quand il est LONG ;
 * les paragraphes courts, les <div> à contenu de BLOC (blocs de
 * périmètre des propositions — titre + description, VOLET 23), les
 * <font> et listes imbriquées restent DES BLOCS ENTIERS (rendu
 * inchangé).
 * CORRECTIF 28/11 (M21) : un <div> LONG au contenu INLINE (un
 * paragraphe tapé à l'éditeur) est désormais éclaté PHRASE PAR
 * PHRASE comme un <p> — sinon il formait UNE rangée géante et le
 * tableau laissait un grand vide en bas de première page avant de
 * continuer sur la suivante (bug reconfirmé par l'éditeur). */
function decouperParagraphe(brut: string): string[] {
  const m = /^<(p|div)\b[^>]*>([\s\S]*)<\/\1\s*>$/i.exec(brut);
  if (!m) return [brut];
  const interieur = m[2];
  if (/<(p|div|ul|ol|li|table|h[1-6])\b/i.test(interieur)) return [brut];
  const texte = interieur.replace(/<[^>]+>/g, "");
  if (texte.length <= SEUIL_PHRASES) {
    /* paragraphe court : les <div> de l'éditeur deviennent des <p>
     * — même rendu (marges) que les autres paragraphes. */
    return m[1].toLowerCase() === "div" ? [`<p>${interieur}</p>`] : [brut];
  }
  const phrases = equilibrerPhrases(fragmenterPhrase(interieur).filter((p) => p.trim()));
  if (phrases.length <= 1) {
    return m[1].toLowerCase() === "div" ? [`<p>${interieur}</p>`] : [brut];
  }
  return phrases.map(
    (ph, i) =>
      `<p class="p-suite${i === 0 ? " p-suite--debut" : ""}${i === phrases.length - 1 ? " p-suite--fin" : ""}">${ph}</p>`,
  );
}
