/**
 * BUDGETS DE CARACTÈRES DE LA PROPOSITION COMMERCIALE (VOLET 24,
 * 27/11/2026).
 *
 * Demande de l'éditeur : « le contenu de la présentation du projet
 * peut être long mais ne doit JAMAIS DÉPASSER LA PREMIÈRE PAGE — il
 * peut remplir la page jusqu'au pied en gardant AU MOINS UNE LIGNE
 * d'espace. Et pareil pour les autres contenus : les contenus rédigés
 * doivent être de MÊME QUANTITÉ que ceux du MODÈLE PAR DÉFAUT, pour
 * que le document garde TOUJOURS le même nombre de pages et ses
 * parties À LEUR PLACE. Il faut CALCULER le nombre de caractères que
 * chaque espace réservé supporte et MENTIONNER ce maximum au niveau
 * des champs du formulaire. »
 *
 * CALCUL (mesures Chromium + moteur de pagination, 27/11/2026 —
 * scripts/mesure-budget-presentation.ts, mesure-moule-proposition.ts,
 * controle-budget-p1.ts) :
 *  - le gabarit est CALÉ sur l'exemple de l'éditeur : chaque espace
 *    réservé supporte la quantité du modèle (page 1 remplie à 930 px
 *    des 960 px de limite du moteur ; pages 2-5 : 13 à 115 px de
 *    réserve) — les budgets reprennent donc la quantité du MODÈLE,
 *    arrondie au multiple de 5 supérieur (le modèle charge toujours
 *    dans ses propres budgets) ;
 *  - PRÉSENTATION (page 1) : en PLUS des caractères, un budget de
 *    LIGNES — le pire cas en caractères (3 paragraphes de 215 + 1 de
 *    105) monte à 11 lignes rendues / 950 px, mais des distributions
 *    « courtes mais nombreuses en lignes » (4 paragraphes de ~176
 *    caractères) peuvent atteindre 12 lignes → 970 px : DÉPASSE. Le
 *    budget de lignes estimées (≤ 10, soit la quantité du modèle)
 *    l'empêche : 10 lignes rendues = 930 px, une ligne d'espace
 *    minimum avant le filet du pied (le pied est à 795,1 pt, 75 pt
 *    sous la limite de contenu).
 *
 * Le formulaire (GenerateurProposition) AFFICHE ces maximums au
 * niveau de chaque champ (« x/N caractères ») et BORNE la saisie
 * (maxLength / découpe) : le document ne peut plus déborder de ses
 * espaces réservés.
 */

import { propositionV2ParDefaut } from "./proposition";

/** Arrondit au multiple de 5 supérieur (compteurs lisibles ; le
 *  modèle charge toujours dans ses propres budgets). */
function plafond5(n: number): number {
  return Math.ceil(n / 5) * 5;
}

/** Longueur maximale des lignes d'une liste du modèle. */
function ligneMax(arr: string[]): number {
  return arr.reduce((m, l) => Math.max(m, l.length), 0);
}

export type BudgetListe = { maxLignes: number; maxParLigne: number };

/** Somme des longueurs des lignes (hors retours à la ligne). */
export function sommeLignes(lignes: string[]): number {
  return lignes.reduce((s, l) => s + l.length, 0);
}

/**
 * Borne une saisie multi-lignes à son budget : chaque ligne au
 * maximum de caractères, le nombre de lignes au maximum du modèle, le
 * total au maximum du champ. Les caractères au-delà sont retenus à la
 * fin de la dernière ligne (saisie contrôlée).
 */
export function bornerLignes(
  lignes: string[],
  budget: BudgetListe,
  maxTotal = budget.maxLignes * budget.maxParLigne,
): string[] {
  let borne = lignes.map((l) => l.slice(0, budget.maxParLigne)).slice(0, budget.maxLignes);
  let excedent = sommeLignes(borne) - maxTotal;
  while (excedent > 0 && borne.length) {
    const i = borne.length - 1;
    const coupe = Math.min(borne[i].length, excedent);
    borne[i] = borne[i].slice(0, borne[i].length - coupe);
    excedent -= coupe;
    /* la ligne vidée par le plafond total disparaît (plus de place) */
    if (!borne[i] && borne.length > 1) borne = borne.slice(0, i);
    else if (!borne[i]) break;
  }
  return borne;
}

/* ------------------------------------------------------------------ */
/* PRÉSENTATION — budget de LIGNES (page 1, jamais dépassée)           */
/* ------------------------------------------------------------------ */

/** Caractères par ligne du gabarit (mesurés) : chapeau (10,4 pt)
 *  ~72, paragraphes (9,4 pt) ~85. L'estimation est conservative :
 *  une ligne estimée n'est JAMAIS plus courte que la ligne rendue. */
const CPL_CHAPEAU = 72;
const CPL_PARA = 85;

/** Lignes estimées d'une présentation (chapeau + paragraphes). */
export function lignesEstimeesPresentation(lignes: string[]): number {
  if (!lignes.length) return 0;
  const chapeau = Math.ceil(lignes[0].length / CPL_CHAPEAU);
  const paras = lignes
    .slice(1)
    .reduce((s, l) => s + Math.ceil(l.length / CPL_PARA), 0);
  return chapeau + paras;
}

/**
 * Borne la PRÉSENTATION (section 01 — page 1) à son budget COMPLET :
 * 4 paragraphes maximum, 215 caractères par paragraphe, 750 au total,
 * et 10 lignes estimées maximum (la quantité du modèle) — le contenu
 * ne peut plus dépasser la première page (950 px mesurés au pire cas
 * en caractères ; ~930 px en lignes, une ligne d'espace au moins
 * avant le pied).
 */
export function bornerPresentation(lignes: string[]): string[] {
  const budget = { maxLignes: 4, maxParLigne: 215, maxTotal: 750 };
  let borne = lignes.map((l) => l.slice(0, budget.maxParLigne)).slice(0, budget.maxLignes);
  /* 1) total de caractères */
  let excedent = sommeLignes(borne) - budget.maxTotal;
  while (excedent > 0 && borne.length) {
    const i = borne.length - 1;
    const coupe = Math.min(borne[i].length, excedent);
    borne[i] = borne[i].slice(0, borne[i].length - coupe);
    excedent -= coupe;
    if (!borne[i] && borne.length > 1) borne = borne.slice(0, i);
    else if (!borne[i]) break;
  }
  /* 2) lignes estimées : la dernière ligne du dernier paragraphe
     raccourcit jusqu'à rentrer dans le budget (10 lignes). */
  let ecart = lignesEstimeesPresentation(borne) - 10;
  while (ecart > 0 && borne.length) {
    const i = borne.length - 1;
    /* retrancher de quoi retirer une ligne estimée à ce paragraphe */
    const cpl = i === 0 ? CPL_CHAPEAU : CPL_PARA;
    const lignesPara = Math.ceil(borne[i].length / cpl);
    const cible = (lignesPara - ecart) * cpl - (lignesPara - ecart > 0 ? 1 : 0);
    const coupe = Math.max(1, borne[i].length - Math.max(0, cible));
    borne[i] = borne[i].slice(0, Math.max(0, borne[i].length - coupe));
    ecart = lignesEstimeesPresentation(borne) - 10;
    if (!borne[i]) {
      if (borne.length > 1) borne = borne.slice(0, i);
      else break;
    }
  }
  return borne;
}

/* ------------------------------------------------------------------ */
/* BUDGETS — calculés UNE FOIS depuis le modèle par défaut             */
/* ------------------------------------------------------------------ */

function calculerBudgets() {
  const m = propositionV2ParDefaut();
  const s = m.sections;

  const blocs = s.perimetre;
  const titreBlocMax = blocs.reduce((x, b) => Math.max(x, (b.titre ?? "").length), 0);
  const introBlocMax = blocs.reduce((x, b) => Math.max(x, (b.intro ?? "").length), 0);
  const leadBlocMax = blocs.reduce((x, b) => Math.max(x, (b.lead ?? "").length), 0);
  const postBlocMax = blocs.reduce((x, b) => Math.max(x, (b.post ?? "").length), 0);
  /* POINTS : le budget s'entend PAR BLOC — nombre de lignes du bloc
     le plus fourni du modèle, et caractères du plus long point. */
  const nbPointsBlocMax = blocs.reduce(
    (x, b) => Math.max(x, (b.points ?? []).filter((p) => p && p.trim()).length),
    0,
  );
  const pointsBloc = blocs.flatMap((b) => b.points ?? []).filter((p) => p && p.trim());

  const echs = s.paiements;
  const libelleEchMax = echs.reduce((x, e) => Math.max(x, (e.libelle ?? "").length), 0);
  const descEchMax = echs.reduce((x, e) => Math.max(x, (e.description ?? "").length), 0);

  return {
    /* ---- En-tête du document ---- */
    titre: plafond5(m.titre.length),
    projet: plafond5(m.projet.length),
    prestataire: Math.max(30, plafond5(m.prestataire.length)),
    destinataireNom: 45,
    destinataireEntreprise: 55,
    delai: Math.max(25, plafond5(m.delai.length)),
    /* ---- 01 Présentation : page 1 JAMAIS dépassée — 4 paragraphes,
       215 car./paragraphe, 750 au total, 10 lignes (mesuré, cf.
       bornerPresentation). ---- */
    presentation: { maxLignes: 4, maxParLigne: 215, maxTotal: 750 } as BudgetListe & {
      maxTotal: number;
    },
    /* ---- 02 Objectifs ---- */
    objectifsIntro: plafond5(s.objectifsIntro.length),
    objectifs: {
      maxLignes: s.objectifs.filter((o) => o && o.trim()).length,
      maxParLigne: plafond5(ligneMax(s.objectifs.filter((o) => o && o.trim()))),
    } as BudgetListe,
    /* ---- 03 Périmètre (par bloc) ---- */
    perimetre: {
      maxBlocs: blocs.length,
      titre: plafond5(titreBlocMax),
      intro: plafond5(introBlocMax),
      lead: plafond5(leadBlocMax),
      points: {
        maxLignes: nbPointsBlocMax,
        maxParLigne: plafond5(ligneMax(pointsBloc)),
      },
      post: plafond5(postBlocMax),
    },
    /* ---- 04 Investissement ---- */
    investissementTexte: plafond5(s.investissementTexte.length),
    investissementNotes: {
      maxLignes: s.investissementNotes.filter((n) => n && n.trim()).length,
      maxParLigne: plafond5(ligneMax(s.investissementNotes.filter((n) => n && n.trim()))),
    } as BudgetListe,
    /* ---- 05 Calendrier ---- */
    calendrierIntro: plafond5(s.calendrierIntro.length),
    calendrierEtapesIntro: plafond5(s.calendrierEtapesIntro.length),
    calendrierEtapes: {
      maxLignes: s.calendrierEtapes.filter((e) => e && e.trim()).length,
      maxParLigne: plafond5(ligneMax(s.calendrierEtapes.filter((e) => e && e.trim()))),
    } as BudgetListe,
    calendrierNote: plafond5(s.calendrierNote.length),
    /* ---- 06 Modalités de paiement ---- */
    paiementsIntro: plafond5(s.paiementsIntro.length),
    echeance: {
      /* le gabarit dispose les échéances par rangées de 2 (ou 3) —
         maximum 4 (règle d'origine du gabarit). */
      max: 4,
      libelle: plafond5(libelleEchMax),
      description: plafond5(descEchMax),
    },
    /* ---- 07 Validation / 08 Conclusion ---- */
    validation: {
      maxLignes: s.validation.filter((v) => v && v.trim()).length,
      maxParLigne: plafond5(ligneMax(s.validation.filter((v) => v && v.trim()))),
    } as BudgetListe,
    conclusion: {
      maxLignes: s.conclusion.filter((c) => c && c.trim()).length,
      maxParLigne: plafond5(ligneMax(s.conclusion.filter((c) => c && c.trim()))),
    } as BudgetListe,
    /* ---- Signature ---- */
    signature: {
      nom: Math.max(30, plafond5(m.signature.nom.length)),
      titre: plafond5(m.signature.titre.length),
      site: plafond5(m.signature.site.length),
    },
  };
}

export type BudgetsProposition = ReturnType<typeof calculerBudgets>;

/** Budgets calculés depuis le modèle par défaut (une fois par session). */
export const BUDGETS_PROPOSITION: BudgetsProposition = calculerBudgets();
