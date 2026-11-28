/**
 * NICHE DE PROSPECTION (28/11/2026) — données extraites du fichier
 * Excel « Pack_Prospection_2026.xlsx » de l'éditeur : 6 catégories,
 * 25 niches à fort potentiel avec leur FOURCHETTE PANIER VITRINE (prix
 * facturable pour un site web de la niche), la cible idéale, le score et
 * les upsells recommandés. Les ÉTOILES classent la qualité/priorité de
 * chaque niche (5 = potentiel le plus fort, classement du fichier), et
 * les CATÉGORIES portent la moyenne des étoiles de leurs niches.
 */

/** Une catégorie de prospection (regroupe des niches). */
export type CategorieProspection = {
  /** Nom affiché (celui du fichier). */
  nom: string;
  /** Étoiles du classement (moyenne des niches, sur 5). */
  etoiles: number;
  /** Panier moyen d'un site vitrine de la catégorie (fichier). */
  panierMoyen: number;
  /** Volume estimé d'entreprises cibles (fichier). */
  volume: string;
  /** Nombre de niches analysées dans la catégorie. */
  nbNiches: number;
  /** VOLET 29 — mot-clé par défaut du scraping de la catégorie
   *  quand AUCUNE niche n'est précisée (l'éditeur peut scraper sans
   *  niche : le système utilise alors ce terme sur le lieu choisi). */
  motCleDefaut: string;
};

/** Une niche de prospection, avec son prix facturable. */
export type NicheProspection = {
  /** Identifiant du fichier (ex. « #01 »). */
  cle: string;
  /** Nom affiché (celui du fichier). */
  nom: string;
  /** Catégorie parente (nom exact). */
  categorie: string;
  /** Étoiles du classement potentiel (5 = exceptionnel, 4 = très fort, 3 = solide, 2 = ciblé). */
  etoiles: number;
  /** Panier VITRINE minimum facturable (fichier). */
  panierMin: number;
  /** Panier VITRINE maximum facturable (fichier). */
  panierMax: number;
  /** Cible idéale (fichier : « > 300k€ de CA », « ≥ 3 employés »…). */
  cible: string;
  /** Score du fichier (panier moyen × volume moyen / 1 000 000). */
  score: number;
  /** Mots-clés utilisés par les outils de scraping pour la niche. */
  motsCles: string;
  /** Upsells recommandés après le site (fichier). */
  upsells: string[];
};

export const CATEGORIES_PROSPECTION: CategorieProspection[] = [
  {
    nom: "BTP / Rénovation",
    etoiles: 4,
    panierMoyen: 4083,
    volume: "≈ 170 000",
    nbNiches: 6,
    motCleDefaut: "entreprise",
  },
  {
    nom: "Santé / Bien-être",
    etoiles: 3,
    panierMoyen: 4437,
    volume: "≈ 49 000",
    nbNiches: 4,
    motCleDefaut: "cabinet médical",
  },
  {
    nom: "Services B2B",
    etoiles: 3,
    panierMoyen: 5071,
    volume: "≈ 82 000",
    nbNiches: 7,
    motCleDefaut: "cabinet",
  },
  {
    nom: "Services aux particuliers",
    etoiles: 3,
    panierMoyen: 4000,
    volume: "≈ 90 000",
    nbNiches: 5,
    motCleDefaut: "entreprise",
  },
  {
    nom: "Loisirs / Hôtellerie",
    etoiles: 2,
    panierMoyen: 5250,
    volume: "≈ 8 000",
    nbNiches: 2,
    motCleDefaut: "hôtel",
  },
  {
    nom: "Formation",
    etoiles: 3,
    panierMoyen: 5250,
    volume: "≈ 10 000",
    nbNiches: 1,
    motCleDefaut: "école",
  },
];

export const NICHES_PROSPECTION: NicheProspection[] = [
  {
    cle: "#01",
    nom: "Paysagistes pour particuliers",
    categorie: "BTP / Rénovation",
    etoiles: 5,
    panierMin: 2500,
    panierMax: 6000,
    cible: "> 300k€ de CA",
    score: 170.0,
    motsCles: "paysagiste",
    upsells: [
      "SEO — capter les recherches 'paysagiste + ville' sur la durée, baisse du coût d'acquisition.",
      "Google Ads — accélère la prise de parts de marché sur mots-clés à forte intention ('devis paysagiste').",
      "Google My Business — augmente le taux de conversion (meilleures informations d'accès + preuve sociale).",
    ],
  },
  {
    cle: "#02",
    nom: "Entreprises de rénovation générale",
    categorie: "BTP / Rénovation",
    etoiles: 5,
    panierMin: 3000,
    panierMax: 6000,
    cible: "> 300k€ de CA",
    score: 202.5,
    motsCles: "entreprise de rénovation",
    upsells: [
      "Pages par prestation + SEO — une page 'Rénovation salle de bain + ville' ranke et convertit mieux.",
      "Google Ads — les requêtes 'rénovation maison devis' sont très intentionnelles.",
      "Tracking / call tracking — savoir quels canaux génèrent des chantiers rentables.",
    ],
  },
  {
    cle: "#03",
    nom: "Architectes (petits et moyens cabinets)",
    categorie: "Services aux particuliers",
    etoiles: 4,
    panierMin: 2500,
    panierMax: 5000,
    cible: "≥ 3 employés ou > 300k€ de CA",
    score: 103.1,
    motsCles: "architecte",
    upsells: [
      "Branding — cohérence visuelle = hausse de la valeur perçue.",
      "SEO local — 'architecte maison contemporaine + ville'.",
      "Instagram / contenu — alimenter le portefeuille et créer de la préférence.",
    ],
  },
  {
    cle: "#04",
    nom: "Cabinets d'expertise-comptable indépendants",
    categorie: "Services B2B",
    etoiles: 3,
    panierMin: 3000,
    panierMax: 6000,
    cible: "> 400k€ de CA",
    score: 67.5,
    motsCles: "expert-comptable",
    upsells: [
      "SEO — capter 'expert-comptable + niche + ville'.",
      "Google Ads — accélère les leads sur une zone spécifique.",
      "Tunnel RDV + qualification — moins d'appels inutiles, plus de closings.",
    ],
  },
  {
    cle: "#05",
    nom: "Cabinets de recrutement spécialisés",
    categorie: "Services B2B",
    etoiles: 3,
    panierMin: 3000,
    panierMax: 6000,
    cible: "Niches IT, santé, industrie, sales — ≥ 3 employés",
    score: 40.5,
    motsCles: "cabinet de recrutement",
    upsells: [
      "SEO — 'cabinet recrutement développeur + ville'.",
      "LinkedIn Ads — toucher DRH / Dirigeants sur une niche précise.",
      "Landing pages par poste — conversion plus forte.",
    ],
  },
  {
    cle: "#06",
    nom: "Cliniques dentaires indépendantes",
    categorie: "Santé / Bien-être",
    etoiles: 3,
    panierMin: 3000,
    panierMax: 6000,
    cible: "Centres multi-praticiens — ≥ 4 employés",
    score: 49.5,
    motsCles: "dentiste",
    upsells: [
      "SEO local — trafic récurrent sur requêtes 'dentiste + ville'.",
      "Google Ads — capter les patients à forte intention.",
      "Google My Business + gestion des avis / e-réputation — augmente le taux de conversion général.",
    ],
  },
  {
    cle: "#07",
    nom: "Cliniques privées, esthétiques & centres médicaux",
    categorie: "Santé / Bien-être",
    etoiles: 2,
    panierMin: 4000,
    panierMax: 8000,
    cible: "≥ 4 employés",
    score: 36.0,
    motsCles: "clinique",
    upsells: [
      "SEO local — présence durable sur pathologies / services.",
      "Google Ads — accélère sur actes rentables.",
      "UX / conversion — réduire la friction = plus de RDV.",
    ],
  },
  {
    cle: "#08",
    nom: "Centres de formation privés & écoles privées",
    categorie: "Formation",
    etoiles: 3,
    panierMin: 3500,
    panierMax: 7000,
    cible: "≥ 5 employés",
    score: 44.6,
    motsCles: "organisme de formation",
    upsells: [
      "Landing pages par formation — conversion plus forte.",
      "Google Ads — capte 'formation + métier', très intentionnel.",
      "Email marketing — relance des abandons et nurturing.",
    ],
  },
  {
    cle: "#09",
    nom: "Bureaux d'études (thermique, structure, environnement)",
    categorie: "Services B2B",
    etoiles: 2,
    panierMin: 3000,
    panierMax: 6000,
    cible: "> 300k€ de CA",
    score: 31.5,
    motsCles: "bureau d'études",
    upsells: [
      "SEO ou Google Ads — 'bureau d'étude structure + ville'.",
      "Pages par secteurs (immobilier, industrie, public) — crédibilité accrue.",
      "LinkedIn Ads — cibler directement les décideurs.",
    ],
  },
  {
    cle: "#10",
    nom: "Cabinets de conseil B2B",
    categorie: "Services B2B",
    etoiles: 3,
    panierMin: 3500,
    panierMax: 7000,
    cible: "> 300k€ de CA",
    score: 70.9,
    motsCles: "conseil",
    upsells: [
      "Copywriting — clarifier l'offre = hausse des RDV.",
      "SEO — capter 'cabinet conseil + problème'.",
      "LinkedIn Ads — accélérer sur le ICP (client idéal).",
    ],
  },
  {
    cle: "#11",
    nom: "Couvreurs (réfection et rénovation de toitures)",
    categorie: "BTP / Rénovation",
    etoiles: 4,
    panierMin: 2500,
    panierMax: 5000,
    cible: "> 500k€ de CA",
    score: 80.6,
    motsCles: "couvreur",
    upsells: [
      "SEO local — 'couvreur + ville', 'réfection toiture + ville' → trafic durable à forte intention.",
      "Google Ads — capter l'urgence (fuites, réparations) et remplir le planning rapidement.",
      "Pages par service (ardoise, tuile, zinc, rénovation) — améliore la conversion et la qualification.",
    ],
  },
  {
    cle: "#12",
    nom: "Gestion de patrimoine indépendante",
    categorie: "Services aux particuliers",
    etoiles: 3,
    panierMin: 4000,
    panierMax: 8000,
    cible: "≥ 3 employés",
    score: 42.0,
    motsCles: "gestion de patrimoine",
    upsells: [
      "Branding — crédibilité = conversion.",
      "SEO — 'conseiller patrimoine + ville'.",
      "LinkedIn Ads — cibler dirigeants / cadres.",
    ],
  },
  {
    cle: "#13",
    nom: "Centres de kinésithérapie multi-praticiens",
    categorie: "Santé / Bien-être",
    etoiles: 3,
    panierMin: 2500,
    panierMax: 4500,
    cible: "> 300k€ de CA",
    score: 70.0,
    motsCles: "kinésithérapeute",
    upsells: [
      "SEO local — capter 'kiné sportif + ville'.",
      "Google Ads — remplir les créneaux rentables.",
      "Google My Business + gestion des avis — augmente la conversion.",
    ],
  },
  {
    cle: "#14",
    nom: "Salles de sport premium / studios privés",
    categorie: "Santé / Bien-être",
    etoiles: 2,
    panierMin: 2500,
    panierMax: 5000,
    cible: "> 500k€ de CA",
    score: 33.8,
    motsCles: "salle de sport",
    upsells: [
      "Meta Ads — acquisition locale rapide et illustrée.",
      "Community management — preuve sociale continue.",
      "Copywriting — essentiel pour motiver au passage à l'action.",
    ],
  },
  {
    cle: "#15",
    nom: "Dératisation / désinsectisation",
    categorie: "Services aux particuliers",
    etoiles: 2,
    panierMin: 2500,
    panierMax: 4500,
    cible: "> 500k€ de CA",
    score: 21.0,
    motsCles: "dératisation",
    upsells: [
      "Google Ads — capte l'urgence au bon moment.",
      "SEO local — présence durable.",
      "Google My Business + gestion des avis — augmente la conversion.",
    ],
  },
  {
    cle: "#16",
    nom: "Transport B2B (messagerie, logistique régionale)",
    categorie: "Services B2B",
    etoiles: 2,
    panierMin: 3000,
    panierMax: 6000,
    cible: "> 500k€ de CA",
    score: 36.0,
    motsCles: "transporteur",
    upsells: [
      "SEO + Google Ads — 'transport express + région'.",
      "LinkedIn Ads — cibler les directeurs logistiques.",
    ],
  },
  {
    cle: "#17",
    nom: "Climatisation / chauffage",
    categorie: "BTP / Rénovation",
    etoiles: 4,
    panierMin: 2500,
    panierMax: 5000,
    cible: "> 300k€ de CA",
    score: 84.4,
    motsCles: "climatisation",
    upsells: [
      "SEO local — trafic durable.",
      "Google Ads — accélération en saison.",
      "Pages par service (PAC, clim, entretien) — conversion et qualification.",
    ],
  },
  {
    cle: "#18",
    nom: "Hôtels 4 étoiles et plus",
    categorie: "Loisirs / Hôtellerie",
    etoiles: 2,
    panierMin: 4000,
    panierMax: 8000,
    cible: "> 500k€ de CA",
    score: 30.0,
    motsCles: "hôtel",
    upsells: [
      "SEO — capter 'hôtel 4 étoiles + ville'.",
      "Google Ads — remplir les périodes creuses.",
      "Optimisation conversion — plus de réservations directes = plus de marge.",
    ],
  },
  {
    cle: "#19",
    nom: "Services aux animaux (toilettage, garde, dressage)",
    categorie: "Services aux particuliers",
    etoiles: 3,
    panierMin: 2000,
    panierMax: 4000,
    cible: "> 300k€ de CA",
    score: 52.5,
    motsCles: "toilettage",
    upsells: [
      "SEO local — trafic durable 'toilettage + ville'.",
      "Google Ads — accélération immédiate.",
      "Google My Business + gestion du contenu — confiance et conversion.",
    ],
  },
  {
    cle: "#20",
    nom: "Coachs (sport, business, santé, carrière)",
    categorie: "Services aux particuliers",
    etoiles: 4,
    panierMin: 2500,
    panierMax: 5000,
    cible: "> 300k€ de CA",
    score: 84.4,
    motsCles: "coach",
    upsells: [
      "Tunnel / landing page — conversion et qualification.",
      "Ads (Meta / Google) — remplir l'agenda rapidement.",
      "Email nurturing — convertir les indécis.",
    ],
  },
  {
    cle: "#21",
    nom: "Escape Games et salles de loisirs",
    categorie: "Loisirs / Hôtellerie",
    etoiles: 2,
    panierMin: 3000,
    panierMax: 6000,
    cible: "> 300k€ de CA",
    score: 7.9,
    motsCles: "escape game",
    upsells: [
      "SEO local — 'escape game + ville'.",
      "Google Ads — capter les recherches intentionnelles.",
      "Pages entreprises — team building = panier moyen plus élevé.",
    ],
  },
  {
    cle: "#22",
    nom: "SaaS / startups (structurées)",
    categorie: "Services B2B",
    etoiles: 4,
    panierMin: 4000,
    panierMax: 10000,
    cible: "> 300k€ de CA — éviter les startups sans trésorerie",
    score: 87.5,
    motsCles: "logiciel",
    upsells: [
      "SEO — acquisition durable sur 'logiciel + problème'.",
      "Google + Meta Ads + tracking — scaler ce qui convertit.",
    ],
  },
  {
    cle: "#23",
    nom: "Agences de branding / communication",
    categorie: "Services B2B",
    etoiles: 3,
    panierMin: 3500,
    panierMax: 7000,
    cible: "> 300k€ de CA",
    score: 47.2,
    motsCles: "agence de communication",
    upsells: [
      "Positionnement / copywriting — clarifier l'offre = meilleurs leads.",
      "SEO — capter 'agence branding + ville'.",
      "LinkedIn + contenu — preuve sociale continue.",
    ],
  },
  {
    cle: "#24",
    nom: "Menuiserie haut de gamme (sur-mesure)",
    categorie: "BTP / Rénovation",
    etoiles: 3,
    panierMin: 3000,
    panierMax: 6000,
    cible: "> 300k€ de CA",
    score: 45.0,
    motsCles: "menuisier",
    upsells: [
      "SEO local — 'cuisine sur mesure + ville'.",
      "Google Ads — demandes de devis immédiates.",
      "Photographie / contenu — améliore la conversion.",
    ],
  },
  {
    cle: "#25",
    nom: "Isolation thermique / rénovation énergétique",
    categorie: "BTP / Rénovation",
    etoiles: 3,
    panierMin: 2500,
    panierMax: 5000,
    cible: "> 300k€ de CA",
    score: 56.2,
    motsCles: "isolation",
    upsells: [
      "SEO — capter 'isolation combles + ville'.",
      "Google Ads — capte l'intention immédiate.",
      "Pages par aide / service — conversion et qualification.",
    ],
  },
];

/** Étoiles « ★★★★★ » (remplies selon le classement). */
export function etoilesAffichees(n: number): string {
  return "★".repeat(Math.max(0, Math.min(5, Math.round(n))));
}

/** Prix français : « 2 500 € – 6 000 € » (la fourchette du fichier). */
export function fourchettePanier(min: number, max: number): string {
  const eur = (v: number) => v.toLocaleString("fr-FR") + " €";
  return `${eur(min)} – ${eur(max)}`;
}

/** Niches d'une catégorie (l'ordre du fichier). */
export function nichesDeCategorie(categorie: string): NicheProspection[] {
  return NICHES_PROSPECTION.filter((n) => n.categorie === categorie);
}

/* ------------------------------------------------------------------
 * VOLET 29 (28/11/2026 soir) — DEMANDES DE L'ÉDITEUR.
 *
 * 1) ORDRE DES DROP-DOWNS : les CATÉGORIES sont ordonnées de la
 *    mieux notée à la moins bien notée (jamais 5 étoiles puis 2 puis
 *    4), et les NICHES pareil — à l'intérieur d'une catégorie comme
 *    dans la modale de lancement.
 * 2) RECOMMANDATIONS AJUSTÉES : la cible idéale de chiffre d'affaires
 *    et le PANIER VITRINE recommandés affichent la MOITIÉ ENVISAGÉE
 *    PAR L'ÉDITEUR des montants du fichier (demande : « il faut
 *    considérer la moitié » — pour un couvreur, le fichier dit
 *    « > 500k€ de CA » et « 2 500 € – 5 000 € », l'éditeur retient
 *    « > 300 000 € de CA » et « 2 000 € – 5 000 € »). Ce sont des
 *    RECOMMANDATIONS de travail, jamais des filtres : le scraping
 *    n'en tient PAS compte.
 * ------------------------------------------------------------------ */

/** Catégories triées par étoiles décroissantes (puis score de
 *  fichier) — l'ordre du drop-down de catégorie. */
export function categoriesTrieesParEtoiles(): CategorieProspection[] {
  const parScore = (nom: string) =>
    Math.max(
      ...nichesDeCategorie(nom).map((n) => n.score),
      0,
    );
  return [...CATEGORIES_PROSPECTION].sort(
    (a, b) => b.etoiles - a.etoiles || parScore(b.nom) - parScore(a.nom),
  );
}

/** Niches d'une catégorie triées par étoiles décroissantes (puis
 *  score de fichier) — l'ordre du drop-down de niche et de la modale. */
export function nichesTrieesParEtoiles(categorie: string): NicheProspection[] {
  return nichesDeCategorie(categorie).sort((a, b) => b.etoiles - a.etoiles || b.score - a.score);
}

/** Toutes les niches du fichier, triées par étoiles décroissantes
 *  (modale de lancement sans catégorie choisie). */
export function toutesNichesTrieesParEtoiles(): NicheProspection[] {
  return [...NICHES_PROSPECTION].sort(
    (a, b) => b.etoiles - a.etoiles || b.score - a.score,
  );
}

/** Une recommandation ajustée (la moitié envisagée par l'éditeur). */
export type RecoAjustee = {
  /** Cible idéale affichée (montants de CA du fichier × 0,6, arrondis
   *  au-dessus — « > 500k€ » devient « > 300 000 € »). */
  cible: string;
  /** Panier vitrine minimum ajusté (× 0,8, arrondi à 100 €). */
  panierMin: number;
  /** Panier vitrine maximum (celui du fichier). */
  panierMax: number;
};

/** Ajuste la cible idéale d'une niche : chaque montant « Nk€ de CA »
 *  du fichier devient N×0,6 en euros complets (500k€ → 300 000 €,
 *  300k€ → 180 000 €, 400k€ → 240 000 €). */
export function cibleAjustee(cible: string): string {
  return cible.replace(/(\d+)\s*k€/g, (_, n: string) => {
    const ajuste = Math.round(Number(n) * 0.6) * 1000;
    return `${ajuste.toLocaleString("fr-FR")} €`;
  });
}

/** La recommandation ajustée d'une niche (cible + panier). */
export function recoAjustee(n: NicheProspection): RecoAjustee {
  return {
    cible: cibleAjustee(n.cible),
    panierMin: Math.round((n.panierMin * 0.8) / 100) * 100,
    panierMax: n.panierMax,
  };
}

/** Le panier moyen ajusté d'une catégorie (× 0,8, arrondi à 50 €). */
export function panierMoyenAjuste(c: CategorieProspection): number {
  return Math.round((c.panierMoyen * 0.8) / 50) * 50;
}
