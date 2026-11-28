/**
 * VOLET 29 (précision du 28/11/2026, nuit) — L'EMAIL PROPOSÉ À PARTIR
 * DE L'AUDIT COMPLET.
 *
 * Demande de l'éditeur : l'email n'est plus une colonne du tableau
 * des prospects — il est PROPOSÉ AU NIVEAU DE L'AUDIT GÉNÉRÉ, à côté
 * du rapport et du rapport d'amélioration, par un bouton « Proposer
 * l'email ». Rédigé sur l'EXEMPLE fourni par l'éditeur (email envoyé
 * à la propriétaire d'une clinique, dont les puces étaient les
 * améliorations trouvées sur SON site) : l'email est PERSONNALISÉ EN
 * FONCTION DU PROSPECT (nom de l'entreprise, dirigeant, email,
 * niche) et surtout EN FONCTION DES AMÉLIORATIONS IDENTIFIÉES PAR
 * L'AUDIT — les axes d'amélioration deviennent les puces de
 * l'email, reformulées pour un lecteur non technique. Prérempli, il
 * n'attend plus que « copier et envoyer ».
 */

import type { AuditComplet, AxeAmelioration } from "./complet";
import { compilerAxes } from "./complet";
import { NICHES_PROSPECTION } from "@/lib/scraping/niches";
import { argumentaireDe } from "@/lib/scraping/argumentaires";

/** L'email prêt à l'envoi (en-têtes + corps). */
export type MessageEmail = {
  /** Le destinataire (email de l'entreprise). */
  a: string;
  /** L'objet de l'email. */
  objet: string;
  /** L'expéditeur affiché dans l'exemple de l'éditeur. */
  de: string;
  /** Le corps complet de l'email. */
  corps: string;
};

/* ------------------------------------------------------------------
 * Les axes d'audit → des puces pour un lecteur NON TECHNIQUE.
 * Chaque libellé interne d'axe devient une promesse concrète,
 * dans l'esprit de l'exemple de l'éditeur (« Les appels à
 * l'action pour la prise de RDV. », « Un design moderne… »).
 * ------------------------------------------------------------------ */

const PUCES_DESIGN: Record<string, string> = {
  "Police personnalisée manquante": "Une identité visuelle soignée, avec une typographie qui vous ressemble.",
  "Mises en page rigides": "Un design moderne, au goût du jour et parfaitement adapté aux différentes tailles d'écrans.",
  "Profondeur visuelle absente": "Des reliefs visuels et une hiérarchie claire qui mettent vos services en valeur.",
  "Aucun mouvement": "Des animations subtiles qui rendent la navigation vivante et professionnelle.",
  "Images aux formats anciens": "De nouvelles images, modernes et légères, qui s'affichent instantanément.",
  "Bandeau d'en-tête absent": "Un en-tête clair qui identifie votre entreprise dès la première seconde.",
  "Navigation absente": "Une navigation simple qui guide vos visiteurs vers vos services.",
  "Pied de page absent": "Un pied de page complet (contact, mentions, liens) qui rassure vos visiteurs.",
  "Page trop courte en sections": "Des sections construites qui présentent vos services et répondent aux questions de vos visiteurs.",
  "Défilement horizontal": "Une page parfaitement calée sur tous les écrans, sans aucun débordement.",
  "Aucun titre principal": "Un message principal limpide, qui dit en quelques mots ce que vos visiteurs gagnent à vous choisir.",
  "Titre principal trop bref": "Un message principal limpide, qui dit en quelques mots ce que vos visiteurs gagnent à vous choisir.",
  "Titre trop long": "Un message principal limpide, qui dit en quelques mots ce que vos visiteurs gagnent à vous choisir.",
  "Presque aucun texte": "Un vrai copywriting qui explique vos services et donne envie d'aller plus loin.",
  "Le texte ne s'adresse pas au lecteur": "Un texte qui parle directement à vos clients, au lieu de se contenter de décrire.",
  "Aucun bénéfice mis en avant": "Des bénéfices clairement mis en avant : ce que vos clients gagnent à vous choisir.",
  "Texte de remplissage détecté": "Le vrai texte de votre entreprise, à la place du contenu provisoire encore en ligne.",
  "Aucun appel à l'action visible": "Des appels à l'action bien visibles qui guident vos visiteurs vers l'action (vous appeler, demander un devis, prendre rendez-vous).",
  "Aucun moyen de contact évident": "Vos coordonnées mises en avant, accessibles en un clic depuis chaque page.",
  "Aucune preuve sociale": "Des avis clients et des preuves rassurantes, à l'endroit exact où vos visiteurs décident.",
};

const PUCES_SEO: Record<string, string> = {
  "Balise title manquante": "Un titre de page optimisé, pour que vos clients vous trouvent sur Google.",
  "Balise title présente mais hors plage": "Un titre de page optimisé, pour que vos clients vous trouvent sur Google.",
  "Balise title optimale (30-60 caractères)": "Un titre de page optimisé, pour que vos clients vous trouvent sur Google.",
  "Meta description manquante": "Une description qui donne envie de cliquer sur votre site dans les résultats Google.",
  "Meta description hors plage": "Une description qui donne envie de cliquer sur votre site dans les résultats Google.",
  "H1 trop court": "Une hiérarchie de titres claire, pour Google comme pour vos visiteurs.",
  "Aucun H1": "Une hiérarchie de titres claire, pour Google comme pour vos visiteurs.",
  "Plusieurs H1": "Une hiérarchie de titres claire, pour Google comme pour vos visiteurs.",
  "Structure de titres Hn pauvre": "Un contenu bien structuré, que Google comprend et classe mieux.",
  "Vue mobile manquante": "Une expérience mobile impeccable — la plupart de vos visiteurs viennent du téléphone.",
  "Contenu un peu court": "Un contenu plus riche, qui répond aux questions de vos clients et plait à Google.",
  "Contenu trop court": "Un contenu plus riche, qui répond aux questions de vos clients et plait à Google.",
  "Images sans texte alternatif": "Des images correctement décrites, pour Google et l'accessibilité.",
  "Textes alternatifs partiels": "Des images correctement décrites, pour Google et l'accessibilité.",
  "Maillage interne faible": "Des pages bien reliées entre elles, pour que Google valorise mieux votre site.",
  "Données structurées absentes": "Des données structurées, pour ressortir en grand dans les résultats Google (avis, horaires…).",
  "Open Graph manquant": "Un aperçu soigné quand votre site est partagé sur WhatsApp, Facebook ou LinkedIn.",
  "Open Graph partiel": "Un aperçu soigné quand votre site est partagé sur WhatsApp, Facebook ou LinkedIn.",
  "HTTPS manquant": "Un site sécurisé (HTTPS) — gage de confiance pour vos visiteurs et pour Google.",
  "Balise canonical absente": "Des adresses propres, qui évitent le contenu dupliqué aux yeux de Google.",
  "Page indexable": "Un site correctement indexable par Google.",
  "Temps de réponse du serveur": "Un serveur plus réactif, pour un site qui s'affiche plus vite.",
  "URL à assainir": "Des adresses de pages courtes et lisibles.",
  "Langue non déclarée": "La langue du site correctement déclarée pour Google.",
};

const PUCES_PERFORMANCE: Record<string, string> = {
  "Servir les images aux formats récents": "Des images modernes et légères, qui s'affichent quasi instantanément.",
  "Réduire le poids de la page": "Une page beaucoup plus légère, qui ne fait attendre aucun visiteur.",
  "Réduire le temps de réponse initial du serveur": "Un serveur plus rapide au premier contact — le site s'affiche plus tôt.",
  "Activer la compression des textes": "La compression activée, pour que chaque page arrive plus vite.",
  "Réduire le nombre de requêtes": "Moins de requêtes techniques, pour un chargement éclair.",
  "Limiter les polices web": "Des polices optimisées, qui ne ralentissent pas le site.",
  "Réduire le nombre de domaines": "Des ressources regroupées, pour un site plus rapide.",
  "Activer la mise en cache du navigateur": "Le cache activé : vos visiteurs récurrents retrouvent un site immédiat.",
};

/** Les puces de secours quand l'audit ne relève rien de précis. */
const PUCES_DE_SECOURS = [
  "Un design moderne, au goût du jour et parfaitement adapté aux différentes tailles d'écrans.",
  "Une vitesse de chargement optimale, pour ne perdre aucun visiteur en route.",
  "Une visibilité locale renforcée, pour être trouvé avant vos concurrents.",
];

/** Devine la niche du fichier la plus proche d'un libellé de niche
 *  scrapée (repli quand la clé du fichier manque). */
function nicheProche(nicheScrapee: string | undefined): string | undefined {
  const n = (nicheScrapee || "").toLowerCase();
  if (!n) return undefined;
  let meilleur: { cle: string; points: number } | null = null;
  for (const candidate of NICHES_PROSPECTION) {
    const mots = candidate.motsCles.toLowerCase().split(/\s+/).filter((m) => m.length > 2);
    const points = mots.reduce((s, m) => s + (n.includes(m) ? 1 : 0), 0);
    if (points > 0 && (!meilleur || points > meilleur.points)) {
      meilleur = { cle: candidate.cle, points };
    }
  }
  return meilleur?.cle;
}

/** Convertit les axes d'amélioration de l'audit en puces concrètes,
 *  par ordre de priorité (les plus impactantes d'abord), sans
 *  doublon — au plus 5, comme l'exemple de l'éditeur. */
function compilerPuces(audit: AuditComplet): string[] {
  const axes: AxeAmelioration[] = compilerAxes(audit);
  const puces: string[] = [];
  for (const axe of axes) {
    if (puces.length >= 5) break;
    const table =
      axe.bloc === "Performance" ? PUCES_PERFORMANCE : axe.bloc === "SEO" ? PUCES_SEO : PUCES_DESIGN;
    const puce = table[axe.titre];
    if (!puce || puces.includes(puce)) continue;
    puces.push(puce);
  }
  if (puces.length === 0) {
    return [...PUCES_DE_SECOURS];
  }
  /* Complète avec les puces de secours si l'audit n'a donné qu'une
   *  ou deux puces, pour un email aussi étoffé que l'exemple. */
  for (const secours of PUCES_DE_SECOURS) {
    if (puces.length >= 3) break;
    if (!puces.includes(secours)) puces.push(secours);
  }
  return puces;
}

/** Rédige l'email proposé pour un audit complet — sur le gabarit de
 *  l'exemple de l'éditeur, personnalisé selon le prospect et les
 *  améliorations identifiées par l'audit. */
export function genererEmailAudit(audit: AuditComplet): MessageEmail {
  const prospect = audit.prospect;
  const entreprise = (prospect?.nom || audit.hote || "votre entreprise").trim();
  const dirigeant = prospect?.dirigeant?.trim();
  const email = prospect?.email?.trim() || "";
  /* La niche : celle du fichier si la clé est là, sinon la plus
   *  proche de la niche scrapée — pour le bénéfice de la phrase
   *  « notamment sur… ». */
  const cleNiche = prospect?.nicheProspection ?? nicheProche(prospect?.niche);
  const benefice = argumentaireDe(cleNiche)?.benefice ?? "plus de clients";

  const salutation = dirigeant ? `Bonjour ${dirigeant},` : "Bonjour,";
  const destinataireObjet = dirigeant ? dirigeant : entreprise;
  const puces = compilerPuces(audit);

  const corps = [
    salutation,
    "",
    "J'espère que vous allez bien.",
    "",
    "Je me permets de vous contacter car mon équipe et moi-même avons analysé le site web de votre entreprise.",
    "",
    `Et nous sommes confiants dans le fait que nous pourrions vous aider à en augmenter les résultats, notamment pour ${benefice}.`,
    "",
    "Nous pourrions travailler sur différents axes d'amélioration, notamment :",
    ...puces.map((p) => `- ${p}`),
    "",
    "J'aimerais beaucoup vous partager l'analyse que nous avons faite de votre site web lors d'un rendez-vous d'environ 15 à 20 minutes, que nous pourrions faire en visio, au moment de votre choix.",
    "",
    "Évidemment, ça ne vous engage à rien, et que vous décidiez ou non de faire affaires avec nous, je vous partagerai les axes d'amélioration que nous avons identifiés pour votre site web, au cas où ça puisse vous servir !",
    "",
    "Au plaisir d'échanger prochainement avec vous,",
    "",
    "Stevens Akpovi",
  ].join("\n");

  return {
    a: email,
    objet: `Informations pour ${destinataireObjet}`,
    de: "Stevens Akpovi – stevensakpovi@gmail.com",
    corps,
  };
}

/** L'email complet en texte brut (tel que copié dans le
 *  presse-papiers), en-têtes compris — le format de l'exemple. */
export function emailEnTexte(message: MessageEmail): string {
  const lignes = message.a ? [`À : ${message.a}`] : ["À : (email de l'entreprise)"];
  lignes.push(`Objet : ${message.objet}`, `De : ${message.de}`, "", message.corps);
  return lignes.join("\n");
}
