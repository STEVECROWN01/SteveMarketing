/**
 * VOLET 28 (28/11/2026) — TYPES DES TROIS OUTILS D'AUDIT.
 *
 * Espace « Audit » du back-office :
 *  - PERFORMANCE : note A-F, scores
 *    Performance et Structure, Web Vitals (LCP, TBT, CLS, FCP),
 *    détails de la page (poids, requêtes par type), audits et
 *    cascade des requêtes ;
 *  - SEO : score sur 100, note A-F, verdict,
 *    familles de critères et plan d'action priorisé ;
 *  - AUDIT COMPLET : design, structure, copywriting et conversion,
 *    avec capture d'écran de la page.
 */

/* ==================== PERFORMANCE ==================== */

/** Une métrique Web Vitale mesurée dans un vrai navigateur. */
export type Vital = {
  /** Code court (LCP, TBT, CLS, FCP, SI). */
  code: "lcp" | "tbt" | "cls" | "fcp" | "si";
  libelle: string;
  /** Valeur mesurée (secondes, ou sans unité pour CLS). */
  valeur: number;
  unite: "s" | "";
  /** Seuil « bien » (100) et « mal » (0) de la courbe de score. */
  bon: number;
  mauvais: number;
  /** Score de la métrique sur 100. */
  score: number;
};

/** Détail de la page : requêtes et poids par type de ressource. */
export type DetailType = {
  type: "JavaScript" | "CSS" | "Images" | "Polices" | "HTML" | "Autre";
  nb: number;
  octets: number;
};

/** Un audit de structure (recommandation). */
export type AuditPerf = {
  titre: string;
  /** Priorité de la recommandation. */
  impact: "élevé" | "moyen" | "faible";
  /** Points de Structure Score perdus. */
  points: number;
  detail: string;
  conseil: string;
};

/** Une ligne de la cascade (waterfall simplifié). */
export type LigneCascade = {
  ordre: number;
  url: string;
  type: DetailType["type"];
  octets: number;
  /** Millisecondes depuis le début. */
  debut: number;
  duree: number;
  statut: number;
};

/** Résultat complet de l'outil Performance. */
export type RelevePerformance = {
  ok: true;
  url: string;
  /** Note globale (60 % performance + 40 % structure). */
  note: string;
  scorePerformance: number;
  scoreStructure: number;
  vitals: Vital[];
  /** Temps de chargement complet (ms). */
  chargeComplete: number;
  /** Première réponse du serveur (ms). */
  ttfb: number;
  poidsTotal: number;
  nbRequetes: number;
  domaines: number;
  detailsTypes: DetailType[];
  audits: AuditPerf[];
  cascade: LigneCascade[];
  avertissement?: string;
};

/* ==================== SEO ==================== */

/** État d'un critère SEO vérifié. */
export type EtatCritere = "ok" | "moyen" | "ko";

/** Un critère vérifié avec son poids dans le score sur 100. */
export type CritereSeo = {
  libelle: string;
  etat: EtatCritere;
  /** Poids total du critère sur 100. */
  points: number;
  /** Points obtenus. */
  obtenu: number;
  /** Ce qui a été mesuré. */
  detail: string;
  /** Comment corriger. */
  conseil: string;
};

/** Une famille de critères (balises, contenu…). */
export type FamilleSeo = {
  nom: string;
  criteres: CritereSeo[];
};

/** Résultat complet de l'outil SEO. */
export type ReleveSeo = {
  ok: true;
  url: string;
  score: number;
  note: string;
  verdict: string;
  familles: FamilleSeo[];
  plan: CritereSeo[];
  apercu: { titre: string; description: string; url: string };
  avertissement?: string;
};

/* ==================== AUDIT COMPLET (design…) ==================== */

/** Un axe noté de l'audit complet. */
export type AxeDesign = {
  nom: string;
  score: number;
  avis: string;
};

/** Résultat complet de l'outil d'audit complet. */
export type ReleveDesign = {
  ok: true;
  url: string;
  scoreGlobal: number;
  note: string;
  axes: AxeDesign[];
  /** Capture d'écran de la page (data URL JPEG). */
  capture: string;
  forces: string[];
  ameliorations: { titre: string; detail: string }[];
  avertissement?: string;
};

/* ==================== Partagé ==================== */

/** Note A-F (barème : A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60,
 *  E ≥ 50, F en dessous). */
export function noteDepuisScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
}
