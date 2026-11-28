/**
 * VOLET 29 (28/11/2026) — ARGUMENTAIRES PAR NICHE (fichier de
 * prospection de l'éditeur « Pack_Prospection_2026.xlsx », feuille
 * « FICHES COMPLÈTES ») : pour chaque niche, le SERVICE recommandé
 * (ce que le site doit faire), le « POURQUOI ÇA MARCHE » (arguments
 * du fichier) et le BÉNÉFICE client — la promesse de l'objet de
 * l'email personnalisé rédigé pour le prospect.
 *
 * Fichier généré par scripts/preparer-argumentaires.py — ne pas
 * éditer à la main.
 */

/** Argumentaire d'une niche du fichier de prospection. */
export type ArgumentaireNiche = {
  /** Identifiant du fichier (ex. « #11 ») — rejoint NicheProspection.cle. */
  cle: string;
  /** Service recommandé par le fichier (ex. « Site vitrine — portfolio + preuves… »). */
  service: string;
  /** Bénéfice client — promesse de l'objet de l'email personnalisé. */
  benefice: string;
  /** « Pourquoi ça marche » : arguments du fichier pour cette niche. */
  pourquoiCaMarche: string;
};

/** Argumentaires des 25 niches (clé = cle de NicheProspection). */
export const ARGUMENTAIRES_NICHES: ArgumentaireNiche[] = [
  {
    cle: "#01",
    service: "Site vitrine — portfolio + preuves + demande de devis",
    benefice: "plus de demandes de devis",
    pourquoiCaMarche: "Le client démarre sur Google, ouvre 3 à 6 résultats, et compare en quelques minutes. Le site web sert à : 1) prouver la qualité via des exemples avant/après et des réalisations, 2) rassurer via des avis, garanties, process, 3) qualifier via des fourchettes de prix / zones géographiques / délais. Résultat : plus de demandes entrantes, mieux qualifiées, avec moins de négociation. Sans site solide, l'entreprise dépend du bouche-à-oreille et perd les prospects chauds captés par les concurrents visibles.",
  },
  {
    cle: "#02",
    service: "Site vitrine — spécialités + réalisations + demande de devis",
    benefice: "plus de chantiers qualifiés",
    pourquoiCaMarche: "Le prospect cherche à réduire le risque (enjeu fort : investissement élevé + qualité attendue). Il veut voir des chantiers, comprendre les spécialités (salle de bain, cuisine, extension…), vérifier la fiabilité (assurances, labels, équipe) puis prendre contact. Un site bien optimisé déclenche deux choses : il augmente le taux de conversion (confiance) et il élève la valeur perçue (donc panier moyen). Il permet aussi d'attirer des clients premium qui veulent de la qualité.",
  },
  {
    cle: "#03",
    service: "Site vitrine premium — portfolio + méthode + positionnement",
    benefice: "des projets alignés et mieux payés",
    pourquoiCaMarche: "Le choix est visuel et émotionnel, mais surtout basé sur la confiance. Le site permet de filtrer : style, gamme de budget, types de projets. Un bon site transforme l'architecte d'un prestataire 'comparable' en spécialiste identifiable. Impact direct : moins de leads low-cost, plus de projets alignés, capacité à augmenter les honoraires et à réduire le temps perdu en appels inutiles.",
  },
  {
    cle: "#04",
    service: "Site vitrine — offre claire + niches + prise de RDV",
    benefice: "plus de mandats entrants",
    pourquoiCaMarche: "Un dirigeant compare avant de confier ses chiffres. Le site doit démontrer : spécialisation (restauration, e-com, BTP…), son process d'onboarding, ses outils, son équipe, et donner une raison d'appeler. Impact business : génération de leads entrants, meilleure qualité de clients, et hausse de panier moyen via packages (mensuel). Un site 'positionné' remplace une partie de la prospection.",
  },
  {
    cle: "#05",
    service: "Site vitrine — preuve + spécialisation + offres + contact",
    benefice: "plus de mandats de recrutement",
    pourquoiCaMarche: "Le site valide la crédibilité avant qu'une entreprise confie un recrutement. Il doit prouver la spécialisation, le réseau, la méthode, les résultats (études de cas pour démontrer sa capacité), et permettre une prise de contact simple. Impact : plus de mandats entrants, meilleure perception (donc fees plus élevés), et différenciation face aux plateformes et cabinets généralistes.",
  },
  {
    cle: "#06",
    service: "Site vitrine — soins + preuves + RDV",
    benefice: "plus de nouveaux patients",
    pourquoiCaMarche: "Le patient recherche localement, compare les avis, les services (implants, ortho…), et veut être rassuré (hygiène, matériel, équipe). Le patient veut voir de l'humain et des avis clients — insistez là-dessus. Le site réduit l'incertitude et déclenche la prise de RDV. Impact business : augmentation du volume de nouveaux patients, meilleure qualité (soins à plus forte valeur), et réduction de dépendance aux plateformes.",
  },
  {
    cle: "#07",
    service: "Site vitrine — parcours patient + RDV",
    benefice: "plus de demandes de rendez-vous",
    pourquoiCaMarche: "Le site est souvent la première interaction. Il doit informer (actes, tarifs, praticiens), rassurer, et guider vers le bon parcours (appel, formulaire, RDV). La confiance est ultra-importante ici. Ne pas lésiner sur les avis clients et les avant/après. Impact business : plus de demandes, moins d'appels non qualifiés, et hausse de remplissage des créneaux (optimisation du CA).",
  },
  {
    cle: "#08",
    service: "Site vitrine orienté vente — programme + preuves + inscription",
    benefice: "plus d'inscriptions",
    pourquoiCaMarche: "Le site est le commercial. Il doit expliquer la promesse, montrer la crédibilité (témoignages, taux de réussite), répondre aux objections (financement, débouchés) et pousser à l'inscription. La concurrence est rude et les paniers moyens sont élevés ; le site est nécessaire pour se démarquer. Impact : hausse du taux de conversion, baisse du coût d'acquisition, capacité à vendre plus cher.",
  },
  {
    cle: "#09",
    service: "Site vitrine B2B — expertise + références + contact",
    benefice: "plus d'études confiées",
    pourquoiCaMarche: "Le donneur d'ordre veut réduire son risque et choisir un partenaire fiable. Le site doit prouver la compétence, les références, les secteurs préférés, les certifications, et clarifier l'offre. Le site doit faire la différence dans un appel d'offres. Impact : accès à des marchés plus gros, amélioration du taux de réponse aux AO, augmentation des demandes entrantes.",
  },
  {
    cle: "#10",
    service: "Site vitrine — positionnement + preuves + RDV",
    benefice: "plus de rendez-vous qualifiés",
    pourquoiCaMarche: "Le conseil est intangible, donc le site doit rendre la valeur concrète et visible : offres packagées, cas clients, méthode, résultats. Le service c'est de la confiance, donc le site doit créer un maximum de confiance. Impact : crédibilité instantanée, capacité à vendre plus cher, et génération de leads entrants. Un site fort remplace le 'réseau' pour une partie des deals.",
  },
  {
    cle: "#11",
    service: "Site vitrine — services + réalisations + demande de devis",
    benefice: "plus de chantiers de toiture",
    pourquoiCaMarche: "Le besoin est souvent urgent (fuite, infiltration, tempête) ou à forte valeur (réfection complète). Parcours client très clair : recherche Google → comparaison rapide → appel. Le site joue un rôle décisif pour : 1) rassurer sur le sérieux (assurances, garanties, certifications), 2) prouver la compétence via photos avant/après et chantiers, 3) qualifier la demande (type de toiture, zone, délais). Impact direct : plus d'appels entrants, meilleure qualité de chantiers, moins de mise en concurrence prix.",
  },
  {
    cle: "#12",
    service: "Site vitrine premium — pédagogie + confiance + RDV",
    benefice: "plus de clients confiants",
    pourquoiCaMarche: "Le prospect veut comprendre à qui il confie son argent. Le site sert à rassurer (méthode, conformité), qualifier (profil client, minimum d'investissement), et créer une image haut de gamme. Il y a une très forte concurrence parmi les CGP, le site est essentiel pour se démarquer. Impact : clients plus riches, meilleure démarcation concurrentielle, moins de 'curieux', leads plus qualifiés, panier moyen plus élevé.",
  },
  {
    cle: "#13",
    service: "Site vitrine — spécialités + RDV + équipe",
    benefice: "des créneaux bien remplis",
    pourquoiCaMarche: "Le patient compare disponibilité, spécialités (sport, périnatalité…), proximité et avis. Un site optimisé augmente les prises de RDV, réduit le no-show (infos claires) et remplit mieux les plannings. Attention à ne pas cibler les trop petits centres de kiné.",
  },
  {
    cle: "#14",
    service: "Site vitrine — expérience + essai + inscription",
    benefice: "plus d'abonnements",
    pourquoiCaMarche: "Le prospect achète une expérience. Le site doit vendre l'univers, l'accompagnement, les résultats et pousser vers un essai. Illustrer les résultats des membres, montrer des avant/après. Il faut vendre une vision, une atmosphère — pas juste les 'moyens' mis en place dans la salle. Impact : plus d'inscriptions, moins de churn (grâce à un bon ciblage), capacité à monter les prix.",
  },
  {
    cle: "#15",
    service: "Site vitrine — urgence + confiance + appel immédiat",
    benefice: "plus d'interventions urgentes",
    pourquoiCaMarche: "Beaucoup de concurrence et il s'agit d'une commodité (besoin de base) donc il y a un fort besoin de démarcation. Le site doit rassurer sur la méthode, la réactivité, la sécurité et permettre un contact instantané. Impact : plus d'appels entrants, meilleure conversion, et prise de marché locale.",
  },
  {
    cle: "#16",
    service: "Site vitrine — capacité + secteurs + demande de devis",
    benefice: "plus de contrats de transport",
    pourquoiCaMarche: "Les décideurs comparent la fiabilité, les zones couvertes, les délais, les garanties. Le site doit prouver la capacité et simplifier la demande de devis. La compétition est forte dans le transport, le site sert à se démarquer. Impact : leads B2B plus qualifiés et contrats plus gros.",
  },
  {
    cle: "#17",
    service: "Site vitrine — services + zones + devis",
    benefice: "plus d'installations planifiées",
    pourquoiCaMarche: "Recherche locale très intentionnelle, souvent saisonnière et urgente. Le site sert à capter la demande, rassurer (certifications, garanties), et convertir en devis. La concurrence est rude : il faut une omniprésence web pour un maximum de résultat. Impact : plus d'appels entrants, meilleure marge en sélectionnant les bons chantiers.",
  },
  {
    cle: "#18",
    service: "Site vitrine premium — branding + réservation directe",
    benefice: "plus de réservations directes",
    pourquoiCaMarche: "Le site influence directement la réservation. Le client compare photos, expérience, prestations et avis avant de réserver. Un site premium augmente la valeur perçue (donc le prix acceptable) et peut réduire la dépendance aux OTA (Booking), ce qui améliore la marge. La concurrence se fait en ligne : c'est là que l'hôtel doit être présent et démarqué.",
  },
  {
    cle: "#19",
    service: "Site vitrine — preuves + disponibilité + réservation",
    benefice: "un agenda bien rempli",
    pourquoiCaMarche: "Le propriétaire cherche un service local et veut être rassuré sur le fait que son animal sera bien traité (sécurité, expérience, avis). Le site crédibilise, montre des preuves (avant/après, installations) et transforme en prise de RDV. Impact : plus de clients réguliers, panier moyen plus haut via offres récurrentes.",
  },
  {
    cle: "#20",
    service: "Site vitrine + pages offre",
    benefice: "plus de clients accompagnés",
    pourquoiCaMarche: "Le coach vend une transformation, donc le site doit rendre la promesse tangible : méthode, preuves, témoignages, cas clients, et appel à l'action vers un call. Impact : hausse du taux de closing, montée en gamme, moins de temps perdu avec des prospects non qualifiés.",
  },
  {
    cle: "#21",
    service: "Site vitrine — scénarios + réservation + avis",
    benefice: "plus de réservations de parties",
    pourquoiCaMarche: "Le site vend une expérience. La concurrence est redoutable (les escape games sont à la mode). Les clients comparent les scénarios, le niveau d'immersion, les avis et les créneaux disponibles. Un site optimisé augmente les réservations et permet de pousser des offres groupe / entreprise plus rentables.",
  },
  {
    cle: "#22",
    service: "Site produit — vitrine + conversion vers démo",
    benefice: "plus d'essais et de démos",
    pourquoiCaMarche: "Le site est le premier commercial : il explique la valeur, répond aux objections, compare et pousse vers une démo ou un essai. Le site est la matérialisation du SaaS : il est essentiel aux ventes. Impact : plus de leads qualifiés, meilleur taux de démo, et meilleur coût d'acquisition grâce à une conversion plus forte.",
  },
  {
    cle: "#23",
    service: "Site vitrine premium",
    benefice: "des clients mieux qualifiés",
    pourquoiCaMarche: "Leur site est une preuve directe de leur compétence. Un site médiocre détruit la crédibilité avant même le premier call. Un site premium les aide à signer des budgets plus élevés et à filtrer les clients low-cost. Impact : plus de leads qualifiés et meilleur coût d'acquisition grâce à une conversion plus forte.",
  },
  {
    cle: "#24",
    service: "Site vitrine — galerie + demande de devis",
    benefice: "plus de projets sur mesure",
    pourquoiCaMarche: "Le client juge sur la qualité perçue, le style et les finitions. Le site permet de montrer le niveau, justifier le prix et attirer des projets rentables (sur-mesure). Les avant/après et les photos de réalisation sont essentiels ici. Impact : hausse du panier moyen et réduction de la concurrence sur les prix.",
  },
  {
    cle: "#25",
    service: "Site vitrine — aides + offres + devis",
    benefice: "plus de devis signés",
    pourquoiCaMarche: "Le prospect cherche des économies, des aides et une entreprise fiable. Le site doit simplifier un sujet complexe (aides, étapes, éligibilité) et convertir en demande de devis. Impact : plus de leads qualifiés, meilleure marge via sélection des chantiers, et croissance rapide sur une demande forte.",
  },
];

/** L'argumentaire d'une niche (null si la clé n'est pas du fichier). */
export function argumentaireDe(cle: string | undefined | null): ArgumentaireNiche | null {
  if (!cle) return null;
  return ARGUMENTAIRES_NICHES.find((a) => a.cle === cle) ?? null;
}
