/**
 * VOLET 20 (26/11/2026) — DEVIS PRÉ-REMPLI DEPUIS UNE PROPOSITION
 * COMMERCIALE.
 *
 * Demande de l'éditeur : « au niveau des propositions commerciales,
 * lorsqu'on crée une proposition commerciale, il doit y avoir un
 * bouton ou une icône de génération de devis dessus. Et on peut
 * générer un devis pour cette proposition commerciale. Et lorsqu'on
 * clique sur le bouton de génération de devis pour cette
 * proposition commerciale, automatiquement toutes les informations
 * de la proposition commerciale sont récupérées et utilisées pour
 * pré-remplir le devis. Tu agis comme un expert en rédaction de
 * propositions commerciales et de devis… la rédaction doit être
 * très bien faite et très bien formatée. »
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
 * VOLET 22 (27/11/2026) — RÉSUMÉ INTELLIGENT DU PÉRIMÈTRE.
 *
 * Demande de l'éditeur : « prendre intact les périmètres de
 * prestation et remplir la colonne de description est un peu
 * robotique et les périmètres sont longs — on aura un devis très,
 * très long. Un devis ne devrait pas dépasser deux pages. Il faut
 * résumer de façon très intelligente, en prenant les informations
 * les plus importantes — pas de pointillés ni de lignes avec saut
 * d'espace : la description est rédigée PARAGRAPHE PAR PARAGRAPHE,
 * un paragraphe pour un point, chaque paragraphe TITRÉ avec le
 * périmètre en titre, MAXIMUM DIX paragraphes de QUATRE LIGNES. En
 * lisant la description, on doit comprendre tout ce qui sera à
 * faire, les conditions, tout. »
 *
 * Règles appliquées :
 *  - un périmètre (bloc A, B, C…) = UN paragraphe TITRÉ : titre en
 *    taille supérieure (une ligne), puis 3 lignes de texte coulant
 *    au maximum — jamais de listes à puces ni de lignes vides ;
 *  - le résumé priorise les POINTS (le concret du périmètre) puis
 *    l'introduction et la clôture, condensées à la première phrase ;
 *  - le calendrier est condensé en UN paragraphe titré final ;
 *  - plafond global : 10 paragraphes (9 périmètres + le calendrier).
 * ------------------------------------------------------------------ */

/** Budget du corps d'un paragraphe : ~2,5 lignes dans la colonne
 *  Description du tableau (~55 caractères par ligne) — le devis
 *  reste ainsi dans SES DEUX PAGES (demande de l'éditeur : « un
 *  devis ne devrait pas dépasser deux pages »). */
const BUDGET_CORPS = 130;
/** Budget du titre d'un paragraphe : une ligne. */
const BUDGET_TITRE = 62;

/** Première phrase d'un texte, resserrée à `max` caractères (coupe
 *  au mot près, ponctuation finale propre). */
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

/** Énumération fluide de points, dans un budget de caractères —
 *  uniquement des points ENTIERS (jamais coupé au milieu d'un
 *  point : c'est un résumé, les éléments qui ne rentrent pas
 *  passent). Les points sont mis en minuscule initiale pour se
 *  fondre dans la phrase. */
function enumerer(points: string[], budget: number): string {
  const retenus: string[] = [];
  let longueur = 0;
  for (const point of points) {
    const propre = point.replace(/\s+/g, " ").trim().replace(/[.;]+$/, "");
    if (!propre) continue;
    const cout = propre.length + (retenus.length ? 3 : 0);
    if (longueur + cout > budget && retenus.length) break;
    retenus.push(propre.charAt(0).toLowerCase() + propre.slice(1));
    longueur += cout;
  }
  return retenus.join(" ; ");
}

/** Un périmètre → un paragraphe TITRÉ (titre + 3 lignes de texte
 *  coulant). Renvoie null si le bloc ne contient rien. */
function resumerBloc(b: {
  titre?: string | null;
  intro?: string | null;
  lead?: string | null;
  points?: (string | null)[] | null;
  post?: string | null;
}, lettre: string): string | null {
  const titre = (b.titre ?? "").replace(/\s+/g, " ").trim();
  const intro = premierePhrase(b.intro ?? "", 108);
  const post = premierePhrase(b.post ?? "", 100);
  const points = (b.points ?? [])
    .map((pt) => (pt ?? "").replace(/\s+/g, " ").trim().replace(/[.;]+$/, ""))
    .filter(Boolean);

  let corps = "";
  if (points.length) {
    /* Priorité aux POINTS (le concret), complétés par la première
     * phrase de l'introduction quand elle est très courte. */
    const amorce = intro && intro.length <= 60 ? intro : "";
    const place = BUDGET_CORPS - (amorce ? amorce.length + 1 : 0);
    const enumeration = enumerer(points, Math.max(50, place - 14));
    const amorceListe = amorce ? "Le périmètre couvre" : "Ce périmètre couvre";
    corps = [amorce, enumeration ? `${amorceListe} : ${enumeration}.` : ""]
      .filter(Boolean)
      .join(" ");
  } else {
    /* Sans points : introduction (ou lead) condensée + clôture si la
     * place le permet. */
    const base = intro || premierePhrase(b.lead ?? "", BUDGET_CORPS);
    corps = [base, post].filter(Boolean).join(" ");
    if (corps.length > BUDGET_CORPS) {
      const coupe = corps.slice(0, BUDGET_CORPS);
      const espace = coupe.lastIndexOf(" ");
      corps = coupe.slice(0, espace > 50 ? espace : BUDGET_CORPS).replace(/[\s,;]+$/, "") + ".";
    }
  }
  if (!corps) return null;
  const titreParagraphe = titre || "Prestation";
  return (
    `<p><font size="5">${lettre}. ${esc(tronc(titreParagraphe, BUDGET_TITRE))}</font></p>` +
    `<p>${esc(capitaliserPhrases(corps))}</p>`
  );
}

/** Coupe un titre à un budget, au mot près (sans ponctuation finale). */
function tronc(t: string, max: number): string {
  if (t.length <= max) return t;
  const coupe = t.slice(0, max);
  const espace = coupe.lastIndexOf(" ");
  return (espace > max / 3 ? coupe.slice(0, espace) : coupe).replace(/[\s,;:–-]+$/, "");
}

/** Rédaction EXPERTE et CONDENSÉE de la description de la prestation
 *  (VOLET 22) : un paragraphe TITRÉ par périmètre (maximum 9), puis
 *  le calendrier condensé en un paragraphe titré — soit au plus
 *  DIX paragraphes de quatre lignes. Le devis reste lisible en deux
 *  pages tout en couvrant tout le périmètre et les conditions. */
function redigerDescription(p: PropositionRecord): string {
  const morceaux: string[] = [];
  const s = p.sections;
  const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /* ---- Périmètre : un paragraphe titré par bloc (9 max) ---- */
  const perimetre = (s.perimetre ?? []).filter(
    (b) => (b.titre ?? "").trim() || (b.intro ?? "").trim() || (b.points ?? []).length,
  );
  let paragraphes = 0;
  for (const bloc of perimetre) {
    if (paragraphes >= 9) break;
    const resume = resumerBloc(bloc, lettres[paragraphes % 26]);
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
    const place = BUDGET_CORPS - (introCal ? introCal.length + 1 : 0);
    const enumeration = enumerer(etapes, Math.max(60, place - 10));
    const phraseDelai = (p.delai ?? "").trim()
      ? `Délai estimé de réalisation : ${esc((p.delai ?? "").trim())}.`
      : "";
    const corps = [introCal, enumeration ? `Déroulé : ${enumeration}.` : "", phraseDelai]
      .filter(Boolean)
      .join(" ");
    if (corps) {
      morceaux.push(
        `<p><font size="5">Calendrier de réalisation</font></p>` +
          `<p>${esc(capitaliserPhrases(corps.slice(0, BUDGET_CORPS + 40)))}</p>`,
      );
    }
  }

  return morceaux.join("");
}

/** Modalités de règlement de la proposition, rédigées pour la
 *  ligne « Notes » du devis (les CGV et le délai estimé suivent les
 *  conventions du gabarit). */
function redigerNotes(p: PropositionRecord): string {
  const echeances = (p.sections.paiements ?? []).filter(
    (e) => Number(e.pourcentage) > 0 || (e.libelle ?? "").trim(),
  );
  if (!echeances.length) return "";
  const n = echeances.length === 1 ? "en une étape" : `en ${echeances.length} étapes`;
  const details = echeances
    .map((e) => {
      const pct = Math.round(Number(e.pourcentage) || 0);
      return pct > 0 ? `${pct} % ${e.libelle ? `— ${e.libelle.toLowerCase()}` : ""}` : e.libelle ?? "";
    })
    .filter(Boolean)
    .join(" ; ");
  return `Modalités issues de la proposition : règlement ${n} — ${details}.`;
}

/** Construit le pré-remplissage complet du générateur de devis
 *  depuis une proposition commerciale (bouton « générer le devis »
 *  de la liste des propositions). */
export function preRemplissageDevisDepuisProposition(
  p: PropositionRecord,
): PreRemplissage {
  const nom = nomClientDeProposition(p);
  const description = redigerDescription(p);
  const notes = redigerNotes(p);

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
      ...(notes ? { notes } : {}),
    },
  };
}
