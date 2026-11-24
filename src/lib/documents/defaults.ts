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

/** Émetteur — identité affichée en haut de chaque document. */
export const EMETTEUR = {
  societe: "Stevens Akpovi",
  subText: "Concepteur de sites web professionnels",
  ifu: "0202212825543",
  rccm: "RB/PKO/23 A 18020",
  contact: "Stevens AKPOVI",
  adresse: "Parakou, Borgou, Bénin",
  pays: "Bénin",
  siteWeb: "stevensakpovi.vercel.app",
  email: "stevensakpovi@gmail.com",
} as const;

/** Coordonnées bancaires par défaut (celles du projet K.Quotes). */
export const BANQUE_DEFAUT: CoordonneesBancaires = {
  titulaire: "TCHOGNON STEVENS AKPOVI",
  iban: "MT33CFTE28904000000000006119777",
  bic: "CFTEMTM1XXX",
  banque: "Moneco",
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

/** Validité par défaut des devis (jours) — comme K.Quotes. */
export const VALIDITE_JOURS = 5;

export const NOTE_DEFAUT =
  "Je reste à votre disposition pour toute question complémentaire et vous remercie pour votre confiance.";

function nouvelleLigne(partial: Partial<LigneDocument> & { designation: string; prixUnitaire: number }): LigneDocument {
  return {
    id: Math.random().toString(36).slice(2, 10),
    type: "Service",
    points: [],
    quantite: 1,
    ...partial,
  };
}

/** Pré-remplissage par défaut d'un NOUVEAU DEVIS : prestation type
 *  de l'offre de Stevens (site web professionnel), client à
 *  compléter. L'éditeur ajuste, génère, télécharge. */
export function devisParDefaut(): Omit<DemandeDocument, "docType" | "numeroClient" | "date"> {
  return {
    client: { nom: "", entreprise: "", ville: "", pays: "Bénin", telephone: "", email: "" },
    objet: "Création d'un site web professionnel",
    intro:
      "Le présent devis concerne la création d'un site web professionnel conçu pour valoriser votre activité, attirer les bons visiteurs et transformer leur intérêt en demandes concrètes.",
    items: [
      nouvelleLigne({
        type: "Service",
        designation: "Site Web Professionnel — Conception complète",
        points: [
          "Écoute stratégique et compréhension de votre activité",
          "Conception sur mesure au code pur, sans template générique",
          "Rédaction professionnelle des textes (copywriting inclus)",
          "Référencement de base (SEO) dès la conception",
          "Adaptation mobile, tablette et ordinateur",
          "Mise en ligne et livraison dans un délai très court",
        ],
        mentionLivraison: "Délai estimé : 7 à 14 jours | Livraison numérique",
        prixUnitaire: 350000,
      }),
    ],
    devise: "XOF",
    conditionsReglement: "À réception",
    modePaiement: "Virement bancaire",
    validiteJours: VALIDITE_JOURS,
    notes: NOTE_DEFAUT,
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
        type: "Service",
        designation: "Site Web Professionnel — 5 pages",
        points: [
          "Page d'accueil orientée conversion",
          "Présentation du cabinet et des expertises",
          "Détail des services et accompagnements",
          "Témoignages et questions fréquentes",
          "Formulaire de contact et prise de rendez-vous",
        ],
        mentionLivraison: "Délai estimé : 10 jours | Livraison numérique",
        prixUnitaire: 450000,
      }),
      nouvelleLigne({
        type: "Option",
        designation: "Rédaction professionnelle complète (copywriting)",
        points: [
          "Rédaction des textes de toutes les pages",
          "Ton professionnel adapté à votre clientèle",
        ],
        mentionLivraison: "Inclus dans le délai du site",
        prixUnitaire: 75000,
      }),
    ],
    phases: [
      { titre: "Écoute stratégique et cadrage du projet", delai: "Jours 1 à 2" },
      { titre: "Conception et rédaction professionnelles", delai: "Jours 3 à 6" },
      { titre: "Développement au code pur et ajustements", delai: "Jours 7 à 9" },
      { titre: "Mise en ligne et remise des accès", delai: "Jour 10" },
    ],
  };
}
