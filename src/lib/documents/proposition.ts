/**
 * PROPOSITION COMMERCIALE — VOLET 16 (25/11/2026).
 *
 * La proposition commerciale quitte le gabarit « devis » : elle suit
 * désormais EXCLUSIVEMENT le template personnel de l'éditeur (PDF
 * fourni en exemple, 25/11/2026) — structure en huit sections
 * numérotées (Présentation, Objectifs, Périmètre, Investissement,
 * Calendrier, Modalités de paiement, Validation, Conclusion),
 * en-tête « PROPOSITION COMMERCIALE » + titre + logo, bloc VOTRE
 * PROJET / PRESTATAIRE / MONTANT TOTAL / DÉLAI ESTIMÉ, filigrane
 * logo sur chaque page, pied de page « prestataire · Proposition
 * commerciale · site » + numérotation. Rendu : proposition-html.ts.
 *
 * Les valeurs par défaut reprennent le CONTENU de l'exemple fourni
 * (demande de l'éditeur) — les informations personnelles du client
 * de l'exemple (nom, ville, situation) ne sont PAS reproduites :
 * les formulations trop spécifiques ont été neutralisées.
 */

/** Échéance de paiement (section 06) — le montant se calcule
 *  automatiquement : montant total × pourcentage. */
export type EcheancePaiement = {
  id: string;
  pourcentage: number;
  libelle: string;
  description: string;
};

/** Sous-bloc du périmètre de la prestation (section 03) — lettré
 *  A, B, C… automatiquement selon la position dans la liste. */
export type BlocPerimetre = {
  id: string;
  titre: string;
  /** Paragraphe d'introduction (une ou deux phrases). */
  intro: string;
  /** Phrase d'appel avant la liste à tirets (peut être vide). */
  lead: string;
  /** Items « – » (un par ligne). */
  points: string[];
  /** Paragraphe de clôture sous la liste (peut être vide). */
  post: string;
};

export type SectionsProposition = {
  /** 01 — un paragraphe par ligne. */
  presentation: string[];
  /** 02 — phrase d'appel + un objectif par ligne. */
  objectifsIntro: string;
  objectifs: string[];
  /** 03 — sous-blocs A, B, C… */
  perimetre: BlocPerimetre[];
  /** 04 — texte à droite du montant dans le bandeau noir. */
  investissementTexte: string;
  /** 04 — lignes en petits caractères sous le bandeau. */
  investissementNotes: string[];
  /** 05 — paragraphe d'accroche. */
  calendrierIntro: string;
  /** 05 — phrase d'appel avant les étapes. */
  calendrierEtapesIntro: string;
  /** 05 — une étape par ligne. */
  calendrierEtapes: string[];
  /** 05 — ligne en petits caractères sous les étapes. */
  calendrierNote: string;
  /** 06 — phrase d'appel avant les blocs de règlement. */
  paiementsIntro: string;
  /** 06 — 2, 3 ou 4 échéances. */
  paiements: EcheancePaiement[];
  /** 07 — un paragraphe par ligne. */
  validation: string[];
  /** 08 — un paragraphe par ligne. */
  conclusion: string[];
};

export type PropositionRecord = {
  id: string;
  /** PC2600001. */
  numero: string;
  docType: "proposition";
  /** Numéro client (relie les documents d'un même client). */
  numeroClient: number;
  /** Date d'émission (ISO yyyy-mm-dd). */
  date: string;

  /** Titre sous « PROPOSITION COMMERCIALE » (champ du formulaire). */
  titre: string;
  /** Bloc « VOTRE PROJET ». */
  projet: string;
  /** Bloc « PRESTATAIRE ». */
  prestataire: string;
  /** Bloc « MONTANT TOTAL ». */
  montant: number;
  devise: string;
  /** Bloc « DÉLAI ESTIMÉ » (aussi en tête de la section 05). */
  delai: string;

  sections: SectionsProposition;

  /** Bloc signature (fin de la section 08). */
  signature: { nom: string; titre: string; site: string };

  createdAt: string;
  updatedAt: string;
};

/** Corps accepté par la route PDF (le serveur produit identifiant,
 *  numéro et horodatages). */
export type DemandeProposition = Omit<
  PropositionRecord,
  "id" | "numero" | "createdAt" | "updatedAt"
> & {
  id?: string;
  numero?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Toute donnée proposition (complète ou partielle) — sert de
 *  discriminant entre l'ANCIEN format (gabarit devis, conservé pour
 *  les documents déjà enregistrés) et le NOUVEAU template. */
export function estPropositionV2(
  d: unknown,
): d is PropositionRecord {
  return Boolean(
    d &&
    typeof d === "object" &&
    (d as { docType?: string }).docType === "proposition" &&
    "sections" in (d as Record<string, unknown>),
  );
}

function blocId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Valeurs par défaut d'une nouvelle proposition commerciale — le
 * CONTENU de l'exemple fourni par l'éditeur (neutralisé : aucune
 * information personnelle du client de l'exemple).
 */
export function propositionV2ParDefaut(): Omit<
  PropositionRecord,
  "id" | "numero" | "numeroClient" | "date" | "createdAt" | "updatedAt" | "docType"
> {
  return {
    titre: "Conception et développement de votre site web professionnel",
    projet: "Site web professionnel, éditorial et évolutif",
    prestataire: "Stevens AKPOVI",
    montant: 2000,
    devise: "EUR",
    delai: "02 à 03 semaines",
    sections: {
      presentation: [
        "Dans un environnement professionnel où la visibilité, la crédibilité et la qualité de présentation jouent un rôle déterminant, disposer d’un espace numérique personnel constitue un véritable levier de développement.",
        "Je vous propose la conception et le développement d’un site web professionnel sur mesure, destiné à valoriser votre expertise, vos activités et vos réalisations.",
        "Pensé comme un véritable espace de présentation et de communication professionnelle, votre site offrira à vos interlocuteurs une vision claire de votre positionnement et de vos domaines d’intervention.",
        "Il sera conçu pour accompagner l’évolution de vos activités et faciliter vos échanges avec les partenaires, clients et organisations susceptibles de collaborer avec vous.",
      ],
      objectifsIntro: "Votre site aura pour objectifs de :",
      objectifs: [
        "Renforcer votre présence et votre visibilité professionnelles.",
        "Présenter clairement vos activités et vos domaines d’expertise.",
        "Valoriser vos réalisations et vos productions.",
        "Faciliter la découverte de votre travail par de nouveaux interlocuteurs.",
        "Centraliser vos contenus professionnels dans un espace qui vous appartient.",
        "Simplifier les prises de contact et les demandes de collaboration.",
        "Vous permettre de faire évoluer vos contenus de manière autonome.",
      ],
      perimetre: [
        {
          id: blocId(),
          titre: "Conception et développement sur mesure",
          intro:
            "Création d’un site web professionnel adapté à votre activité et à votre positionnement.",
          lead: "La prestation comprend :",
          points: [
            "La conception et le développement sur mesure.",
            "L’intégration du design validé.",
            "Une interface responsive adaptée aux ordinateurs, tablettes et smartphones.",
            "Une navigation claire et cohérente.",
            "L’intégration des animations et interactions prévues dans le projet.",
            "L’intégration des contenus et des éléments visuels validés.",
          ],
          post: "",
        },
        {
          id: blocId(),
          titre: "Site bilingue français / anglais",
          intro: "Votre site sera disponible en français et en anglais.",
          lead:
            "La prestation comprend l’intégration des contenus validés dans les deux langues et la mise en place d’un système de navigation entre les versions linguistiques.",
          points: [],
          post: "",
        },
        {
          id: blocId(),
          titre: "Copywriting professionnel",
          intro:
            "La rédaction et l’optimisation des contenus des pages de votre site sont incluses.",
          lead: "Le copywriting sera conçu pour :",
          points: [
            "Présenter clairement votre activité.",
            "Valoriser votre expertise et votre positionnement.",
            "Mettre en évidence vos domaines d’intervention.",
            "Faciliter la compréhension de votre offre professionnelle.",
            "Encourager les prises de contact et les demandes de collaboration.",
          ],
          post: "Les contenus seront soumis à votre validation avant leur publication.",
        },
        {
          id: blocId(),
          titre: "Espace éditorial et publications",
          intro:
            "Votre site comprendra un espace éditorial permettant de présenter vos articles, analyses et publications.",
          lead: "Cet espace comprendra notamment :",
          points: [
            "Une page regroupant vos publications.",
            "Des pages individuelles pour vos articles.",
            "Une organisation des contenus par catégories.",
            "Une navigation entre les publications.",
            "Des éléments permettant de présenter vos contenus de manière claire et professionnelle.",
          ],
          post: "",
        },
        {
          id: blocId(),
          titre: "Back-office personnalisé",
          intro:
            "Un espace d’administration personnalisé sera développé afin de vous permettre de gérer vos contenus sans intervention technique pour chaque modification.",
          lead: "Le back-office vous permettra notamment de :",
          points: [
            "Créer de nouveaux contenus.",
            "Modifier les contenus existants.",
            "Supprimer des publications.",
            "Enregistrer des brouillons.",
            "Publier ou dépublier des contenus.",
            "Gérer les titres, résumés, catégories et contenus.",
            "Ajouter et modifier les images de couverture.",
          ],
          post: "Une prise en main du back-office sera prévue à la livraison.",
        },
        {
          id: blocId(),
          titre: "Optimisation SEO de base",
          intro:
            "Une optimisation SEO de base sera intégrée à votre site afin de faciliter sa compréhension par les moteurs de recherche.",
          lead: "Elle comprendra notamment :",
          points: [
            "La structuration des titres et des contenus.",
            "L’intégration des métadonnées SEO des pages principales.",
            "L’optimisation des titres et descriptions.",
            "La mise en place d’URLs lisibles.",
            "Les optimisations techniques de base prévues dans le projet.",
          ],
          post:
            "Cette prestation ne constitue pas une garantie de positionnement dans les résultats des moteurs de recherche.",
        },
        {
          id: blocId(),
          titre: "Tests et mise en ligne",
          intro:
            "Avant la livraison, votre site fera l’objet de vérifications portant notamment sur :",
          lead: "",
          points: [
            "Le fonctionnement des pages et des liens.",
            "La navigation entre les langues.",
            "L’affichage sur les différents formats d’écran.",
            "Le fonctionnement des formulaires et du back-office.",
            "La cohérence des contenus intégrés.",
          ],
          post:
            "La mise en ligne sera réalisée après votre validation du site et la réception des éléments nécessaires au déploiement.",
        },
      ],
      investissementTexte:
        "Ce montant couvre l’ensemble des prestations décrites dans le présent document.",
      investissementNotes: [
        "Les frais éventuels de nom de domaine, d’hébergement, de services tiers payants et de maintenance après livraison ne sont pas inclus, sauf accord écrit contraire.",
        "Aucun coût supplémentaire lié aux prestations incluses ne sera engagé sans votre accord préalable.",
      ],
      calendrierIntro:
        "Le calendrier définitif sera confirmé après validation du devis, réception du premier règlement et mise à disposition des éléments nécessaires au projet.",
      calendrierEtapesIntro: "Les principales étapes seront :",
      calendrierEtapes: [
        "Cadrage et validation des contenus.",
        "Conception et développement du site.",
        "Intégration des contenus français et anglais.",
        "Développement et intégration du back-office.",
        "Tests, corrections et validation.",
        "Mise en ligne et prise en main.",
      ],
      calendrierNote:
        "Les délais de validation et de transmission des contenus de votre part peuvent avoir une incidence sur le calendrier.",
      paiementsIntro: "Le règlement sera effectué en deux étapes :",
      paiements: [
        {
          id: blocId(),
          pourcentage: 50,
          libelle: "Avant le démarrage du projet",
          description:
            "Le démarrage effectif intervient après réception du premier règlement et des éléments nécessaires à la réalisation.",
        },
        {
          id: blocId(),
          pourcentage: 50,
          libelle: "Avant la mise en ligne définitive",
          description:
            "Le solde est réglé après validation de la version complète du site et avant sa mise en ligne définitive.",
        },
      ],
      validation: [
        "La validation de cette proposition permettra de formaliser le devis et de confirmer le calendrier de réalisation.",
        "Les éléments nécessaires au démarrage vous seront communiqués après validation.",
        "Le projet sera réalisé sur la base du périmètre défini dans la présente proposition.",
        "Toute demande supplémentaire ou modification importante du périmètre initial fera l’objet d’une évaluation préalable et, si nécessaire, d’un accord complémentaire.",
      ],
      conclusion: [
        "Cette proposition vise à vous fournir un espace professionnel qui vous appartient, conçu pour valoriser votre expertise, centraliser vos activités et accompagner l’évolution de votre parcours.",
        "L’objectif est de vous livrer une solution professionnelle, évolutive et simple à administrer, qui puisse soutenir durablement votre visibilité et vos collaborations.",
        "Je reste à votre disposition pour toute précision complémentaire et serai ravi de vous accompagner dans la réalisation de ce projet.",
      ],
    },
    signature: {
      nom: "Stevens AKPOVI",
      titre: "Conception et développement web",
      site: "stevensakpovi.vercel.app",
    },
  };
}
