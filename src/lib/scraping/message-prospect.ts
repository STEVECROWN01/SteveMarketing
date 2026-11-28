/**
 * VOLET 29 (28/11/2026) — MESSAGE EMAIL PERSONNALISÉ PAR PROSPECT.
 *
 * Demande de l'éditeur : la colonne « Message » de l'espace Prospects
 * porte « le message email approprié à envoyer à l'entreprise », rédigé
 * sur le FORMAT de sa proposition commerciale (ton professionnel,
 * vouvoiement, phrases courtes, bénéfices concrets — voir le PDF
 * « Proposition commerciale » joint) et ADAPTÉ À LA NICHE (arguments
 * du fichier de prospection : « pourquoi ça marche », service
 * recommandé) avec le nom de l'entreprise, sa ville et le nom du
 * dirigeant quand il a été trouvé. Le message est un SUGGESTION
 * d'envoi : rien n'est envoyé automatiquement.
 */
import type { EntrepriseScraped } from "./types";
import { NICHES_PROSPECTION, type NicheProspection } from "./niches";
import { argumentaireDe, type ArgumentaireNiche } from "./argumentaires";

/** Le message email d'un prospect : objet + corps complet. */
export type MessageProspect = {
  /** Objet de l'email. */
  objet: string;
  /** Corps complet ( prêt à copier-coller). */
  corps: string;
};

/** Devine la niche du fichier la plus proche de la niche scrapée
 *  (mots-clés de la niche du fichier retrouvés dans ce que fait
 *  l'entreprise) — null si aucune ne correspond. */
function nicheProche(nicheScrapee: string): NicheProspection | null {
  const n = (nicheScrapee || "").toLowerCase();
  if (!n) return null;
  let meilleur: { niche: NicheProspection; points: number } | null = null;
  for (const candidate of NICHES_PROSPECTION) {
    const mots = candidate.motsCles.toLowerCase().split(/\s+/).filter((m) => m.length > 2);
    const points = mots.reduce((s, m) => s + (n.includes(m) ? 1 : 0), 0);
    if (points > 0 && (!meilleur || points > meilleur.points)) {
      meilleur = { niche: candidate, points };
    }
  }
  return meilleur?.niche ?? null;
}

/** Le début personnalisé : qui écrit et à propos de quoi. */
function salutation(e: EntrepriseScraped): string {
  if (e.dirigeant) {
    return `Bonjour ${e.dirigeant},`;
  }
  return `Bonjour,\n\nJe me permets de vous contacter au sujet de ${e.nom}.`;
}

/** La phrase de reconnaissance du métier (adaptée à la niche). */
function phraseMetier(e: EntrepriseScraped, niche: NicheProspection | null, argumentaire: ArgumentaireNiche | null): string {
  const ville = e.localisation?.split(",")[0]?.trim();
  const lieu = ville && ville.length <= 40 ? ` à ${ville}` : "";
  if (niche && argumentaire) {
    const metier = niche.nom.split(" (")[0].toLowerCase();
    return `Parmi les entreprises de ${metier}${lieu}, ${e.nom} s'est bâti une réputation de sérieux et de confiance — c'est exactement le genre d'entreprise que l'on a envie de recommander.`;
  }
  const metier = e.niche?.toLowerCase();
  if (metier) {
    return `En parcourant les entreprises de ${metier}${lieu}, ${e.nom} m'a interpellé : un métier de confiance, où chaque client compte.`;
  }
  return `En découvrant ${e.nom}${lieu}, j'ai relevé une entreprise dont le travail mérite d'être vu.`;
}

/** Le cœur du message : pourquoi un site professionnel paie, ADAPTÉ à
 *  la niche via les arguments du fichier de prospection. */
function phraseValeur(e: EntrepriseScraped, niche: NicheProspection | null, argumentaire: ArgumentaireNiche | null): string {
  const base = argumentaire?.pourquoiCaMarche;
  let coeur: string;
  if (base) {
    /* Les arguments du fichier sont longs : on retient la première
     * phrase, qui porte l'idée centrale, reformulée sobrement. */
    const premiere = base.split(/(?<=\.)\s+/).slice(0, 2).join(" ");
    coeur = `Aujourd'hui, vos clients vous comparent en ligne avant même de vous appeler. ${premiere}`;
  } else {
    coeur =
      "Aujourd'hui, vos clients vous comparent en ligne avant même de vous appeler : un site web professionnel rassure, convainc et fait gagner des demandes mieux qualifiées.";
  }
  const service = argumentaire?.service;
  const precisions = niche
    ? " Votre site présenterait clairement vos réalisations, vos zones d'intervention et un moyen simple de demander un devis."
    : " Votre site présenterait clairement ce que vous faites, vos réalisations et un moyen simple de vous contacter.";
  if (!e.siteWebPresent) {
    return `${coeur}\n\nVous n'avez pas encore de site web : chaque recherche de vos prospects part chez un concurrent visible en ligne. ${service ? `Le format adapté à votre métier : ${service.charAt(0).toLowerCase() + service.slice(1)}.` : ""}${precisions}`;
  }
  return `${coeur}\n\nVotre site actuel est une bonne base — mais il peut travailler bien plus fort pour vous : plus rapide, mieux référencé localement, et pensé pour transformer vos visiteurs en demandes concrètes.${precisions}`;
}

/** Rédige le message email personnalisé d'un prospect. */
export function genererMessageProspect(e: EntrepriseScraped): MessageProspect {
  /* La niche : celle de la recherche si elle vient du fichier,
   * sinon la plus proche de la niche scrapée. */
  const niche = e.nicheProspection
    ? (NICHES_PROSPECTION.find((n) => n.cle === e.nicheProspection) ?? nicheProche(e.niche))
    : nicheProche(e.niche);
  const argumentaire = argumentaireDe(niche?.cle);
  const benefice = argumentaire?.benefice ?? "plus de clients";

  const objet = `${e.nom} : ${benefice} grâce à votre présence en ligne`;

  const corps = [
    salutation(e),
    "",
    phraseMetier(e, niche, argumentaire),
    "",
    phraseValeur(e, niche, argumentaire),
    "",
    "Je conçois des sites web professionnels sur mesure : clairs, rapides et pensés pour convertir vos visiteurs en clients — et référencés localement pour que l'on vous trouve avant vos concurrents.",
    "",
    "Vous pouvez juger sur pièces : stevensakpovi.vercel.app",
    "",
    `Auriez-vous 15 minutes cette semaine pour échanger ? Je vous montrerais concrètement ce que cela changerait pour ${e.nom}.`,
    "",
    "Bien cordialement,",
    "",
    "Stevens AKPOVI",
    "Concepteur de sites web professionnels",
    "stevensakpovi.vercel.app",
  ].join("\n");

  return { objet, corps };
}
