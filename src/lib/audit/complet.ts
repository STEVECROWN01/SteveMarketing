/**
 * VOLET 29 (28/11/2026) — L'AUDIT COMPLET EN UN SEUL OUTIL.
 *
 * Demande de l'éditeur : l'espace Audit ne porte plus trois boutons
 * mais UN SEUL outil — on colle l'URL, l'analyse fait tout à la
 * fois : la PERFORMANCE de chargement, le SEO on-page et la
 * structure / le design / le copywriting / la conversion. Le rapport
 * complet est présenté à l'écran PAR BLOCS (rapport performance,
 * rapport SEO, rapport structure & design), téléchargeable en PDF
 * (« AUDIT COMPLET »), avec ses AXES D'AMÉLIORATION dans une modale
 * (eux aussi téléchargeables en PDF) — et sauvegardé dans le dépôt
 * GitHub privé de stockage du back-office avec l'historique des
 * audits précédents.
 */
import type { ReleveDesign, RelevePerformance, ReleveSeo } from "./types";
import { noteDepuisScore } from "./types";

/** Le prospect à l'origine d'un audit (transmis par l'espace
 *  Prospects, bouton « Analyser ») : il personnalise l'EMAIL proposé
 *  à partir du rapport — nom de l'entreprise, dirigeant, email,
 *  niche du fichier de prospection. */
export type ProspectAudit = {
  /** Nom de l'entreprise prospectée. */
  nom: string;
  /** Email de l'entreprise (si connu). */
  email?: string;
  /** Nom du dirigeant / propriétaire (s'il a été trouvé). */
  dirigeant?: string;
  /** Clé de la niche du fichier de prospection (ex. « #11 »). */
  nicheProspection?: string;
  /** La niche scrapée (libellé) — repli pour deviner la niche. */
  niche?: string;
};

/** Un audit complet enregistré (les trois relevés + identité). */
export type AuditComplet = {
  /** Identifiant du fichier (audit-20261128-154201-example-fr). */
  id: string;
  /** URL analysée. */
  url: string;
  /** Nom d'hôte analysé (example.fr). */
  hote: string;
  /** Date et heure de l'audit (ISO). */
  date: string;
  /** Rapport de performance. */
  performance: RelevePerformance;
  /** Rapport SEO. */
  seo: ReleveSeo;
  /** Rapport structure / design / copywriting / conversion. */
  design: ReleveDesign;
  /** Score global sur 100 (moyenne des trois blocs). */
  scoreGlobal: number;
  /** Note A-F du score global. */
  note: string;
  /** Le prospect à l'origine de l'audit (bouton « Analyser » de
   *  l'espace Prospects) — personnalise l'email proposé. */
  prospect?: ProspectAudit;
};

/** Le bloc d'un axe d'amélioration. */
export type BlocAudit = "Performance" | "SEO" | "Structure / Design";

/** Un axe d'amélioration priorisé (ce qu'il faut corriger pour
 *  amener le site à 100 %). */
export type AxeAmelioration = {
  /** Le bloc concerné. */
  bloc: BlocAudit;
  /** Titre de l'axe. */
  titre: string;
  /** Priorité : élevée / moyenne / faible. */
  priorite: "élevée" | "moyenne" | "faible";
  /** Ce qui a été mesuré. */
  detail: string;
  /** Comment corriger. */
  conseil: string;
};

/** Score composite de performance (60 % performance + 40 %
 *  structure — la note globale du bloc performance). */
export function scorePerformanceComposite(r: RelevePerformance): number {
  return Math.round(0.6 * r.scorePerformance + 0.4 * r.scoreStructure);
}

/** Construit un audit complet à partir des trois relevés. */
export function construireAudit(
  url: string,
  performance: RelevePerformance,
  seo: ReleveSeo,
  design: ReleveDesign,
  prospect?: ProspectAudit,
): AuditComplet {
  const scoreGlobal = Math.round(
    (scorePerformanceComposite(performance) + seo.score + design.scoreGlobal) / 3,
  );
  const maintenant = new Date();
  const horodate = [
    maintenant.getFullYear(),
    String(maintenant.getMonth() + 1).padStart(2, "0"),
    String(maintenant.getDate()).padStart(2, "0"),
    "-",
    String(maintenant.getHours()).padStart(2, "0"),
    String(maintenant.getMinutes()).padStart(2, "0"),
    String(maintenant.getSeconds()).padStart(2, "0"),
  ].join("");
  let hote = url;
  try {
    hote = new URL(url).hostname;
  } catch {
    /* gardé tel quel */
  }
  return {
    id: `audit-${horodate}-${hote.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40)}`,
    url,
    hote,
    date: maintenant.toISOString(),
    performance,
    seo,
    design,
    scoreGlobal,
    note: noteDepuisScore(scoreGlobal),
    prospect,
  };
}

/** L'ordre de priorité d'affichage. */
const ORDRE_PRIORITE = { "élevée": 0, "moyenne": 1, "faible": 2 } as const;

/** Compile TOUS les axes d'amélioration d'un audit, groupés par bloc
 *  et priorisés (ce qu'il faut faire pour amener le site à 100 %). */
export function compilerAxes(a: AuditComplet): AxeAmelioration[] {
  const axes: AxeAmelioration[] = [];

  /* Performance : chaque recommandation de structure est un axe. */
  for (const audit of a.performance.audits) {
    const priorite: AxeAmelioration["priorite"] =
      audit.impact === "élevé" ? "élevée" : audit.impact === "moyen" ? "moyenne" : "faible";
    axes.push({
      bloc: "Performance",
      titre: audit.titre,
      priorite,
      detail: audit.detail,
      conseil: audit.conseil,
    });
  }

  /* SEO : chaque critère non à 100 % du plan d'action est un axe,
   * priorisé par les points restants. */
  for (const critere of a.seo.plan) {
    if (critere.etat === "ok") continue;
    const restants = critere.points - critere.obtenu;
    axes.push({
      bloc: "SEO",
      titre: critere.libelle,
      priorite: restants >= 10 ? "élevée" : restants >= 5 ? "moyenne" : "faible",
      detail: critere.detail,
      conseil: critere.conseil || "Corriger ce critère SEO on-page.",
    });
  }

  /* Structure / design : chaque amélioration repérée est un axe. */
  for (const amelioration of a.design.ameliorations) {
    axes.push({
      bloc: "Structure / Design",
      titre: amelioration.titre,
      priorite: "moyenne",
      detail: amelioration.detail,
      conseil: "Voir le rapport structure & design pour le détail complet.",
    });
  }

  return axes.sort(
    (x, y) =>
      ORDRE_PRIORITE[x.priorite] - ORDRE_PRIORITE[y.priorite] || x.bloc.localeCompare(y.bloc),
  );
}

/** Version allégée d'un audit pour la LISTE des audits précédents
 *  (sans la capture d'écran, lourde). */
export type AuditResume = {
  id: string;
  url: string;
  hote: string;
  date: string;
  scoreGlobal: number;
  note: string;
  scores: { performance: number; seo: number; design: number };
  nbAxes: number;
};

/** L'aperçu (allégé) d'un audit complet. */
export function resumerAudit(a: AuditComplet): AuditResume {
  return {
    id: a.id,
    url: a.url,
    hote: a.hote,
    date: a.date,
    scoreGlobal: a.scoreGlobal,
    note: a.note,
    scores: {
      performance: scorePerformanceComposite(a.performance),
      seo: a.seo.score,
      design: a.design.scoreGlobal,
    },
    nbAxes: compilerAxes(a).length,
  };
}
