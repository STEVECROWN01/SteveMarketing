/**
 * VOLET 20 (26/11/2026) — DEVIS PRÉ-REMPLI DEPUIS UNE PROPOSITION
 * COMMERCIALE.
 *
 * Demande de l'éditeur : « au niveau des propositions commerciales,
 * lorsqu'on crée une proposition commerciale, il doit y avoir un
 * bouton ou une icône de génération de devis dessus. Et on peut
 * générer un devis pour cette proposition commerciale. Et lorsqu'on
 * clique sur le bouton de génération de devis pour cette proposition
 * commerciale, automatiquement toutes les informations de la
 * proposition commerciale sont récupérées et utilisées pour
 * pré-remplir le devis. Tu agis comme un expert en rédaction de
 * propositions commerciales et de devis… la rédaction doit être très
 * bien faite et très bien formatée. »
 *
 * RÈGLES (précisées par l'éditeur) :
 *  - le NOM du client vient du DESTINATAIRE de la proposition
 *    (l'entreprise si le champ entreprise est renseigné, sinon le
 *    nom complet) ;
 *  - la localisation, le pays, l'email, le téléphone restent aux
 *    VALEURS PAR DÉFAUT des champs (« ce sera à moi de remplir
 *    cela dans les champs ») ;
 *  - le numéro CLIENT de la proposition est réutilisé (les
 *    documents d'un même client restent reliés) ;
 *  - le MONTANT de la proposition devient le prix de la prestation ;
 *  - le périmètre (blocs A, B, C…) est rédigé en texte RICHE mis en
 *    forme : sous-titres en gras, introductions en paragraphes,
 *    points en listes, calendrier en listes — directement dans la
 *    colonne Description du tableau « Détail » du devis.
 */

import type { PropositionRecord } from "./proposition";
import type { PreRemplissage } from "@/components/admin/GenerateurDocument";
import type { LigneDocument } from "./types";

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Nom du client du devis : l'ENTREPRISE du destinataire si
 *  renseignée, sinon son NOM COMPLET (demande de l'éditeur : « le
 *  nom sera utilisé pour le devis »). */
export function nomClientDeProposition(p: PropositionRecord): string {
  const entreprise = (p.destinataire?.entreprise ?? "").trim();
  const nomComplet = (p.destinataire?.nomComplet ?? "").trim();
  return entreprise || nomComplet;
}

/* ------------------------------------------------------------------
 * VOLET 23 (27/11/2026) — RÉDACTION PROFESSIONNELLE DES DESCRIPTIONS.
 *
 * Demande de l'éditeur : « le système doit S'INSPIRER du contenu des
 * différents périmètres de prestation pour RÉDIGER des descriptions
 * pour chaque périmètre — SANS mentionner la lettre du périmètre,
 * juste le périmètre EN GRAS et la description. Ce n'est pas
 * DÉCRIRE le périmètre en disant “ce périmètre, ce périmètre” : quand
 * le client lit, il doit sentir qu'on lui PARLE — ça doit parler du
 * CONTENU de ce qui sera fait, de façon professionnelle. Et l'espace
 * entre les titres et les descriptions, ainsi qu'entre les
 * paragraphes, est réduit (côté gabarit). »
 *
 * Règles appliquées :
 *  - un périmètre = UN paragraphe TITRÉ : titre du périmètre EN GRAS
 *    (taille supérieure, SANS lettre A/B/C), puis la description en
 *    prose — le client s'y sent interlocuteur, on lui parle de SON
 *    projet ;
 *  - la description S'INSPIRE du contenu réel du bloc : phrase
 *    d'amorce issue de l'introduction, points du périmètre intégrés
 *    dans une phrase naturelle à CADRE VARIÉ (jamais deux paragraphes
 *    avec la même formule), condition de clôture conservée ;
 *  - maximum DIX paragraphes (neuf périmètres + le calendrier),
 *    chacun tenu en QUATRE LIGNES (~200 caractères) — le devis
 *    reste dans ses deux pages.
 * ------------------------------------------------------------------ */

/** Budget du corps d'un paragraphe : QUATRE lignes MESURÉES dans la
 *  colonne Description (~48 caractères par ligne) — le devis reste
 *  dans SES DEUX PAGES. */
const BUDGET_CORPS = 188;
/** Budget du titre d'un paragraphe : une ligne. */
const BUDGET_TITRE = 62;

/** Première phrase d'un texte, resserrée à `max` caractères (coupe
 * au mot près, ponctuation finale propre). */
function premierePhrase(texte: string, max: number): string {
  const propre = (texte ?? "").replace(/\s+/g, " ").trim();
  if (!propre) return "";
  const phrase = propre.split(/(?<=[.!?…])\s+/)[0] ?? propre;
  if (phrase.length <= max) return phrase;
  /* phrase seule trop longue : coupe à la DERNIÈRE VIRGULE (fin de
     proposition grammaticale), sinon au dernier mot */
  let coupe = phrase.slice(0, max);
  const virgule = coupe.lastIndexOf(", ");
  if (virgule > max * 0.5) coupe = coupe.slice(0, virgule);
  else {
    const dernierEspace = coupe.lastIndexOf(" ");
    if (dernierEspace > Math.floor(max / 3)) coupe = coupe.slice(0, dernierEspace);
  }
  return coupe.replace(/[\s,;:]+$/, "") + ".";
}

/** Majuscule en tête de CHAQUE phrase d'un paragraphe condensé. */
function capitaliserPhrases(t: string): string {
  return t.replace(/(^|[.!?]\s+)([\p{Ll}])/gu, (_m, amorce: string, lettre: string) => amorce + lettre.toUpperCase());
}

/** Coupe un titre à un budget, au mot près (sans ponctuation finale). */
function tronc(t: string, max: number): string {
  if (t.length <= max) return t;
  const coupe = t.slice(0, max);
  const espace = coupe.lastIndexOf(" ");
  return (espace > max / 3 ? coupe.slice(0, espace) : coupe).replace(/[\s,;:–-]+$/, "");
}

/* Phrases CADRES de l'énumération des points : tournées CLIENT (on
 * lui parle de ce qui sera fait pour lui) et VARIÉES d'un paragraphe
 * à l'autre — jamais deux paragraphes avec la même formule. */
const CADRES_ENUMERATION: ((l: string) => string)[] = [
  (l) => `La prestation comprend ${l}.`,
  (l) => `Je prends en charge ${l}.`,
  (l) => `Votre projet inclut ${l}.`,
  (l) => `Vous bénéficiez de l'ensemble suivant : ${l}.`,
  (l) => `La mise en œuvre couvre ${l}.`,
  (l) => `Concrètement, vous recevrez ${l}.`,
];

/** Liste fluide « x, y et z » (points en minuscule initiale — ils
 *  s'intègrent AU SEIN d'une phrase) ; les cadres « l'ensemble
 *  suivant » préfèrent les points virgules, et une SÉQUENCE
 *  d'étapes se relie par « puis » (naturel pour un calendrier). */
function listeNaturelle(
  points: string[],
  pointVirgules: boolean,
  conjonction: "et" | "puis" = "et",
): string {
  const ps = points.map((p) => p.charAt(0).toLowerCase() + p.slice(1));
  if (pointVirgules) return ps.join(" ; ");
  if (ps.length === 1) return ps[0];
  return ps.slice(0, -1).join(", ") + ` ${conjonction} ` + ps[ps.length - 1];
}

/** Retient les ENTIERS points qui tiennent dans le budget (jamais
 *  coupés au milieu d'un point : les éléments qui ne rentrent pas
 *  passent). */
function retenirPoints(points: string[], budget: number): string[] {
  const retenus: string[] = [];
  let longueur = 0;
  for (const point of points) {
    const cout = point.length + (retenus.length ? 3 : 0);
    if (longueur + cout > budget && retenus.length) break;
    retenus.push(point);
    longueur += cout;
  }
  return retenus;
}

/** Un périmètre → un paragraphe TITRÉ (titre en GRAS, sans lettre) +
 *  une description RÉDIGÉE qui parle au client de ce qui sera fait
 *  pour lui. Priorité au CONTENU (les points du périmètre), puis à
 *  la condition de clôture, l'amorce d'introduction n'entrant que
 *  s'il reste vraiment la place (le titre couvre déjà l'idée
 *  générale). Renvoie null si le bloc ne contient rien. */
function redigerBloc(
  b: {
    titre?: string | null;
    intro?: string | null;
    lead?: string | null;
    points?: (string | null)[] | null;
    post?: string | null;
  },
  index: number,
): string | null {
  const titre = (b.titre ?? "").replace(/\s+/g, " ").trim();
  const intro = premierePhrase(b.intro ?? "", 108);
  const post = premierePhrase(b.post ?? "", 100);
  const points = (b.points ?? [])
    .map((pt) => (pt ?? "").replace(/\s+/g, " ").trim().replace(/[.;]+$/, ""))
    .filter(Boolean);

  const cadre = CADRES_ENUMERATION[index % CADRES_ENUMERATION.length];
  const pointVirgules = index % 3 === 2;
  /* ~30 caractères partent dans le cadre de la phrase. */
  const coutCadre = CADRES_ENUMERATION[index % CADRES_ENUMERATION.length]("").length;

  /* 1) LES POINTS D'ABORD — la clôture (condition) réserve sa place ;
   *    si même le premier point ne tient pas avec elle, on réessaie
   *    sans clôture (le contenu passe avant). */
  let avecPost = Boolean(post);
  let retenus = retenirPoints(
    points,
    Math.max(40, BUDGET_CORPS - (avecPost ? post.length + 1 : 0) - coutCadre - 4),
  );
  if (points.length && retenus.length === 0 && avecPost) {
    avecPost = false;
    retenus = retenirPoints(points, Math.max(40, BUDGET_CORPS - coutCadre - 4));
  }

  const parties: string[] = [];
  if (retenus.length) parties.push(cadre(listeNaturelle(retenus, pointVirgules)));
  /* 2) la condition de clôture, si elle tient. */
  if (
    avecPost &&
    post &&
    parties.join(" ").length + post.length + 1 <= BUDGET_CORPS
  ) {
    parties.push(post);
  }
  /* 3) l'amorce d'introduction, seulement s'il reste la place. */
  if (intro && parties.join(" ").length + intro.length + 1 <= BUDGET_CORPS) {
    parties.unshift(intro);
  }
  /* Sans points : l'introduction (ou l'appel de liste) ouvre le
   * paragraphe, la clôture le referme si la place le permet. */
  if (!parties.length) {
    const base = intro || premierePhrase(b.lead ?? "", BUDGET_CORPS);
    let corps = [base, post].filter(Boolean).join(" ");
    if (corps.length > BUDGET_CORPS) {
      const coupe = corps.slice(0, BUDGET_CORPS);
      const espace = coupe.lastIndexOf(" ");
      corps = coupe.slice(0, espace > 50 ? espace : BUDGET_CORPS).replace(/[\s,;]+$/, "") + ".";
    }
    if (!corps) return null;
    return (
      `<div><p><font size="5"><b>${esc(tronc(titre || "Prestation", BUDGET_TITRE))}</b></font></p>` +
      `<p>${esc(capitaliserPhrases(corps))}</p></div>`
    );
  }

  const corps = parties.join(" ");
  if (!corps) return null;
  const titreParagraphe = titre || "Prestation";
  /* VOLET 23 — TITRE + DESCRIPTION dans la MÊME rangée du tableau
   * (un seul <div>) : l'espace entre le titre et sa description se
   * réduit au strict minimum (plus de rangée séparée qui espaçait
   * les deux — demande de l'éditeur : « l'espace entre les titres
   * des périmètres et les descriptions est trop — réduis ça »). */
  return (
    `<div><p><font size="5"><b>${esc(tronc(titreParagraphe, BUDGET_TITRE))}</b></font></p>` +
    `<p>${esc(capitaliserPhrases(corps))}</p></div>`
  );
}

/** Rédaction EXPERTE et CONDENSÉE de la description de la prestation
 *  (VOLET 22 → VOLET 23) : un paragraphe TITRÉ par périmètre
 *  (maximum 9), puis le calendrier condensé en un paragraphe titré —
 *  soit au plus DIX paragraphes de quatre lignes. Le devis reste
 *  lisible en deux pages tout en couvrant tout le périmètre et les
 *  conditions. */
function redigerDescription(p: PropositionRecord): string {
  const morceaux: string[] = [];
  const s = p.sections;

  /* ---- Périmètre : un paragraphe titré par bloc (9 max) ---- */
  const perimetre = (s.perimetre ?? []).filter(
    (b) => (b.titre ?? "").trim() || (b.intro ?? "").trim() || (b.points ?? []).length,
  );
  let paragraphes = 0;
  for (const bloc of perimetre) {
    if (paragraphes >= 9) break;
    const resume = redigerBloc(bloc, paragraphes);
    if (resume) {
      morceaux.push(resume);
      paragraphes++;
    }
  }

  /* ---- Calendrier : UN paragraphe titré, condensé ---- */
  const etapes = (s.calendrierEtapes ?? [])
    .map((e) => (e ?? "").replace(/\s+/g, " ").trim().replace(/[.;]+$/, ""))
    .filter(Boolean);
  const introCal = premierePhrase(s.calendrierIntro ?? "", 80);
  if (etapes.length || introCal || (p.delai ?? "").trim()) {
    const retenus = retenirPoints(etapes, BUDGET_CORPS - 46 - 34);
    const phraseDelai = (p.delai ?? "").trim()
      ? `Délai estimé de réalisation : ${esc((p.delai ?? "").trim())}.`
      : "";
    /* VOLET 23 — pas de redondance : si l'introduction du calendrier
     * se termine par « : », elle introduit ELLE-MÊME la liste des
     * étapes ; sinon la formule « Le projet se déroulera par étapes »
     * ouvre la phrase. */
    const finitParDeuxPoints = Boolean(introCal) && /[:：]\s*$/.test(introCal);
    const ouverture = finitParDeuxPoints
      ? introCal.trim()
      : introCal
        ? `${introCal} Le projet se déroulera par étapes :`
        : "Le projet se déroulera par étapes :";
    const phraseEtapes = retenus.length
      ? `${ouverture} ${listeNaturelle(retenus, false, "puis")}.`
      : `${ouverture.replace(/[:：]\s*$/, "")}.`;
    const corps = [phraseEtapes, phraseDelai].filter(Boolean).join(" ");
    if (corps) {
      /* VOLET 23 — même rangée unique pour le titre et sa description. */
      morceaux.push(
        `<div><p><font size="5"><b>Calendrier de réalisation</b></font></p>` +
          `<p>${esc(capitaliserPhrases(corps))}</p></div>`,
      );
    }
  }

  return morceaux.join("");
}

/** Construit le pré-remplissage complet du générateur de devis
 *  depuis une proposition commerciale (bouton « générer le devis »
 *  de la liste des propositions).
 *
 *  VOLET 23 — NOTES : plus AUCUNE note n'est imposée ici : le devis
 *  garde la note standard (« Je reste à votre disposition pour toute
 *  question complémentaire et vous remercie pour votre confiance. »)
 *  — la même note est ainsi affichée sur le devis ET sur la facture
 *  qui en découle (demande de l'éditeur). */
export function preRemplissageDevisDepuisProposition(
  p: PropositionRecord,
): PreRemplissage {
  const nom = nomClientDeProposition(p);
  const description = redigerDescription(p);

  /* Une PRESTATION unique au montant de la proposition : le
   * périmètre détaillé vit dans la description rédigée (les
   * « prix et autres » du tableau sont récupérés : le montant total
   * de la proposition devient le prix de la prestation). */
  const ligne: LigneDocument = {
    id: Math.random().toString(36).slice(2, 10),
    type: "Service",
    designation: (p.titre ?? "").trim() || "Prestation décrite dans la proposition commerciale",
    description,
    quantite: 1,
    prixUnitaire: Number(p.montant) || 0,
  };

  /* Résumé de la proposition affiché en tête du formulaire (carte
   * « Proposition à l'origine de ce devis »). */
  const resume = [
    `Projet : ${p.projet}`,
    `Montant : ${p.montant} ${p.devise}`,
    `Délai estimé : ${p.delai}`,
    `Périmètre : ${(p.sections.perimetre ?? []).length} bloc${(p.sections.perimetre ?? []).length > 1 ? "s" : ""} — ${(p.sections.perimetre ?? []).map((b) => b.titre).filter(Boolean).join(" · ")}`,
    `Destinataire : ${nom || "—"}`,
    `Émise le ${p.date}`,
  ].join("\n");

  return {
    client: {
      nom,
      /* Les autres coordonnées (ville, pays, email, téléphone)
       * restent aux valeurs PAR DÉFAUT des champs du formulaire :
       * l'éditeur les complète lui-même (demande explicite). */
    },
    origine: {
      titre: "Proposition à l'origine de ce devis",
      nom: `Proposition ${p.numero} — ${p.projet}`,
      date: `émise le ${p.date}`,
      message: resume,
    },
    numeroClient: Number(p.numeroClient) || undefined,
    champs: {
      objet: (p.titre ?? "").trim() || "Création d'un site web professionnel",
      intro:
        (p.sections.presentation ?? []).find((par) => par && par.trim()) ??
        "Le présent devis fait suite à la proposition commerciale qui vous a été adressée ; il en reprend exactement le périmètre, le montant et le calendrier.",
      delaiEstime: (p.delai ?? "").trim() || undefined,
      devise: p.devise,
      items: description ? [ligne] : [{ ...ligne, description: "" }],
    },
  };
}
