/**
 * Valeurs pré-remplies des générateurs — système de K.Quotes
 * (src/lib/defaults.ts) transposé à l'identité « Stevens Akpovi » :
 * l'éditeur retrouve SES coordonnées d'émetteur et SES coordonnées
 * bancaires (celles du projet K.Quotes) déjà en place, modifiables
 * document par document.
 *
 * Les coordonnées bancaires et identifiants (IFU, RCCM) sont ceux
 * que l'éditeur publie lui-même dans son projet K.Quotes public ;
 * ils figurent de toute façon imprimés sur chaque document émis.
 */

import type { CoordonneesBancaires, DemandeDocument, LigneDocument } from "./types";

/** Émetteur — identité affichée en haut de chaque document.
 *  VOLET 17 : « Professionnel : Stevens AKPOVI » (majuscules,
 *    demande de l'éditeur).
 *  VOLET 18 — sous-texte et pays possèdent leur équivalent ANGLAIS
 *    (subTextEn / paysEn) : le gabarit les choisit selon la langue
 *    du document ; les valeurs françaises restent la référence. */
export const EMETTEUR = {
  societe: "Stevens AKPOVI",
  subText: "Concepteur de sites web professionnels",
  subTextEn: "Professional website designer",
  ifu: "0202212825543",
  rccm: "RB/PKO/23 A 18020",
  contact: "Stevens AKPOVI",
  adresse: "Parakou, Borgou, Bénin",
  pays: "Bénin",
  paysEn: "Benin",
  siteWeb: "stevensakpovi.vercel.app",
  email: "stevensakpovi@gmail.com",
} as const;

/** Coordonnées bancaires par défaut (celles du projet K.Quotes) —
 *  VOLET 17 : plus de champ « Banque » (ligne supprimée). */
export const BANQUE_DEFAUT: CoordonneesBancaires = {
  titulaire: "TCHOGNON STEVENS AKPOVI",
  iban: "MT33CFTE28904000000000006119777",
  bic: "CFTEMTM1XXX",
};

/** Conditions générales de vente — celles de K.Quotes, adaptées aux
 *  prestations de création de sites web. */
export const CONDITIONS_GENERALES: string[] = [
  "Mission réalisée à distance.",
  "Livraison des livrables au format numérique.",
  "Démarrage du travail après réception du règlement.",
  "Une série d'ajustements mineurs est incluse après livraison.",
  "Les informations transmises par le client restent strictement confidentielles.",
];

/** VOLET 18 — CGV ANGLAISES : traduction fidèle ligne à ligne de
 *  CONDITIONS_GENERALES, imprimées par le gabarit des documents en
 *  langue "en" (devis/factures). */
export const CONDITIONS_GENERALES_EN: string[] = [
  "The assignment is carried out remotely.",
  "Deliverables are provided in digital format.",
  "Work starts once payment has been received.",
  "One round of minor adjustments is included after delivery.",
  "Any information provided by the client remains strictly confidential.",
];

/** Validité par défaut des devis (jours) — 15 jours (volet 15). */
export const VALIDITE_JOURS = 15;

export const NOTE_DEFAUT =
  "Je reste à votre disposition pour toute question complémentaire et vous remercie pour votre confiance.";

/* ------------------------------------------------------------------
 * VOLET 18 — TEXTES PAR DÉFAUT PAR LANGUE
 *
 * Référence unique des textes pré-remplis d'un NOUVEAU devis : le
 * formulaire s'en sert (1) pour pré-remplir selon la langue choisie,
 * (2) pour DÉTECTER les champs encore « par défaut » au moment du
 * switch FR/EN — seul un texte NON personnalisé est traduit, jamais
 * un texte rédigé. Les valeurs FR sont les textes historiques,
 * MOT POUR MOT (le comportement français reste identique).
 * ------------------------------------------------------------------ */

/** Clés des textes par défaut testables (champs texte du devis). */
export type CleTexteDefaut =
  | "intro"
  | "conditionsReglement"
  | "modePaiement"
  | "notes"
  | "delaiEstime"
  | "designationLigne"
  | "descriptionLigne";

/** Textes par défaut FR/EN — ex. TEXTES_DEFAUT.en.intro. */
export const TEXTES_DEFAUT: Record<"fr" | "en", Record<CleTexteDefaut, string>> = {
  fr: {
    intro:
      "Le présent devis concerne la création d'un site web professionnel conçu pour valoriser votre activité, attirer les bons visiteurs et transformer leur intérêt en demandes concrètes.",
    conditionsReglement: "À réception",
    modePaiement: "Virement bancaire",
    notes: NOTE_DEFAUT,
    delaiEstime: "02 à 03 semaines",
    designationLigne: "Site Web Professionnel — Conception complète",
    descriptionLigne: [
      "Écoute stratégique et compréhension de votre activité.",
      "Conception sur mesure au code pur, sans template générique.",
      "Rédaction professionnelle des textes (copywriting inclus).",
      "Référencement de base (SEO) dès la conception.",
      "Adaptation mobile, tablette et ordinateur.",
      "Mise en ligne et livraison dans un délai très court.",
    ].join("\n"),
  },
  en: {
    intro:
      "This quote concerns the creation of a professional website designed to showcase your business, attract the right visitors and turn their interest into concrete enquiries.",
    conditionsReglement: "Upon receipt",
    modePaiement: "Bank transfer",
    notes:
      "I remain at your disposal for any further questions and thank you for your trust.",
    delaiEstime: "02 to 03 weeks",
    designationLigne: "Professional Website — Complete design",
    descriptionLigne: [
      "Strategic listening and understanding of your business.",
      "Tailor-made design in pure code, with no generic template.",
      "Professional copywriting (text writing included).",
      "Basic search engine optimisation (SEO) built in from the design stage.",
      "Mobile, tablet and desktop responsiveness.",
      "Go-live and delivery within a very short timeframe.",
    ].join("\n"),
  },
};

function nouvelleLigne(partial: Partial<LigneDocument> & { designation: string; prixUnitaire: number }): LigneDocument {
  return {
    id: Math.random().toString(36).slice(2, 10),
    type: "Service",
    description: "",
    quantite: 1,
    ...partial,
  };
}

/** Pré-remplissage par défaut d'un NOUVEAU DEVIS : prestation type
 *  de l'offre de Stevens (site web professionnel), client à
 *  compléter. VOLET 17 : description RÉDIGÉE (texte riche) au lieu
 *  des puces, délai estimé porté par le document.
 *  VOLET 18 — paramètre `langue` ("fr" par défaut) : les textes par
 *  défaut et la langue du document suivent la langue choisie ; les
 *  valeurs FR restent identiques mot pour mot. */
export function devisParDefaut(
  langue: "fr" | "en" = "fr",
): Omit<DemandeDocument, "docType" | "numeroClient" | "date"> {
  const t = TEXTES_DEFAUT[langue];
  return {
    langue,
    client: { nom: "", entreprise: "", ville: "", pays: "Bénin", telephone: "", email: "" },
    objet: "Création d'un site web professionnel",
    intro: t.intro,
    items: [
      nouvelleLigne({
        designation: t.designationLigne,
        description: t.descriptionLigne,
        prixUnitaire: 350000,
      }),
    ],
    devise: "EUR",
    delaiEstime: t.delaiEstime,
    conditionsReglement: t.conditionsReglement,
    modePaiement: t.modePaiement,
    validiteJours: VALIDITE_JOURS,
    notes: t.notes,
    banque: { ...BANQUE_DEFAUT },
  };
}

/** Pré-remplissage par défaut d'une NOUVELLE PROPOSITION
 *  COMMERCIALE. */
export function propositionParDefaut(): Omit<DemandeDocument, "docType" | "numeroClient" | "date"> & {
  phases: { titre: string; delai: string }[];
} {
  return {
    ...devisParDefaut(),
    objet: "Création d'un site web professionnel — Proposition commerciale",
    intro:
      "Après l'étude de votre activité et de vos objectifs, voici la proposition d'accompagnement que je vous recommande pour disposer d'un site web professionnel qui travaille pour vous.",
    phases: [
      { titre: "Écoute stratégique et cadrage du projet", delai: "Jours 1 à 2" },
      { titre: "Conception et rédaction professionnelles", delai: "Jours 3 à 7" },
      { titre: "Développement au code pur et ajustements", delai: "Jours 8 à 12" },
      { titre: "Mise en ligne et remise des accès", delai: "Jours 13 à 14" },
    ],
  };
}

/** EXEMPLE-MODÈLE (demande de l'éditeur : « il y aura un exemplaire
 *  comme modèle pour faire savoir ce que serait le document quand on
 *  va le générer ») : client de démonstration fictif, complet et
 *  réaliste — chargeable en un clic dans le formulaire pour voir le
 *  rendu final avant le premier vrai document. */
export function exempleModele(): Partial<DemandeDocument> & { phases: { titre: string; delai: string }[] } {
  return {
    client: {
      nom: "Aïcha DOSSOU",
      entreprise: "Cabinet Essentiel & Stratégie",
      ville: "Cotonou",
      pays: "Bénin",
      telephone: "+229 01 00 00 00 00",
      email: "exemple@demo.fr",
    },
    objet: "Création d'un site web professionnel — Cabinet de conseil",
    intro:
      "Le présent document concerne la création d'un site web professionnel pour le Cabinet Essentiel & Stratégie : présenter vos expertises, rassurer vos futurs clients et faciliter la prise de rendez-vous.",
    items: [
      nouvelleLigne({
        designation: "Site Web Professionnel — 5 pages",
        description: [
          "Page d'accueil orientée conversion.",
          "Présentation du cabinet et des expertises.",
          "Détail des services et accompagnements.",
          "Témoignages et questions fréquentes.",
          "Formulaire de contact et prise de rendez-vous.",
        ].join("\n"),
        prixUnitaire: 450000,
      }),
      nouvelleLigne({
        designation: "Rédaction professionnelle complète (copywriting)",
        description: [
          "Rédaction des textes de toutes les pages.",
          "Ton professionnel adapté à votre clientèle.",
        ].join("\n"),
        prixUnitaire: 75000,
      }),
    ],
    delaiEstime: "10 jours",
    phases: [
      { titre: "Écoute stratégique et cadrage du projet", delai: "Jours 1 à 2" },
      { titre: "Conception et rédaction professionnelles", delai: "Jours 3 à 6" },
      { titre: "Développement au code pur et ajustements", delai: "Jours 7 à 9" },
      { titre: "Mise en ligne et remise des accès", delai: "Jour 10" },
    ],
  };
}
