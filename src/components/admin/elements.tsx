"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Éléments d'interface partagés du back-office (VOLET 14) —
 * habillage du site (cartes #232323, bordures #e4e4e4/12, textes
 * blanc/#c8c8c8) : le back-office garde le DESIGN DU SITE avec un
 * rendu plus professionnel et élégant (demande de l'éditeur).
 */

export const styleInput =
  "min-h-[46px] w-full rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] px-3.5 py-2.5 text-sm text-white placeholder:text-[#c8c8c8]/45 focus:border-[#e4e4e4] focus:outline-none";

/* VOLET 20 (26/11/2026) — ICÔNE CALENDRIER BLANCHE : les champs
 * type="date" rendent leur pictogramme natif selon le « color
 * scheme » du navigateur ; sur fond sombre #1c1c1c il ressortait
 * noir, invisible. [color-scheme:dark] demande au navigateur un
 * rendu SOMBRE de ses contrôles natifs (calendrier blanc). */
export const styleInputDate = `${styleInput} [color-scheme:dark]`;

export function Champ({
  label,
  children,
  className = "",
  indicatif,
  /* VOLET 21 (27/11/2026) — `blocLibre` : le champ contient des
   * CONTRÔLES INTERACTIFS (éditeur riche, boutons…) : le conteneur
   * est un <div> et non un <label>. Un <label> transmet le clic à
   * son premier contrôle labellisable — pour l'éditeur de texte
   * riche, le clic dans la zone de rédaction activait le PREMIER
   * BOUTON de la barre d'outils et le curseur disparaissait
   * (demande de l'éditeur : « quand on clique dans le champ, le
   * curseur doit se positionner et on doit pouvoir écrire ; le
   * bouton d'en-tête ne doit pas s'activer »). */
  blocLibre = false,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  indicatif?: string;
  blocLibre?: boolean;
}) {
  const entete = (
    <span className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-xs font-medium text-white">{label}</span>
      {indicatif ? <span className="text-[10px] text-[#c8c8c8]/70">{indicatif}</span> : null}
    </span>
  );
  if (blocLibre) {
    return (
      <div className={`block ${className}`}>
        {entete}
        {children}
      </div>
    );
  }
  return (
    <label className={`block ${className}`}>
      {entete}
      {children}
    </label>
  );
}

export function Carte({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] ${className}`}>{children}</div>
  );
}

export function TitreSection({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="font-display text-base font-semibold text-white sm:text-lg">{children}</h3>
      {note ? <p className="text-xs text-[#c8c8c8]">{note}</p> : null}
    </div>
  );
}

export function BoutonAction({
  children,
  onClick,
  variant = "secondaire",
  disabled,
  titre,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "principal" | "secondaire" | "danger" | "attention";
  disabled?: boolean;
  titre?: string;
  className?: string;
}) {
  const styles: Record<string, string> = {
    principal:
      "border-[#e4e4e4] bg-white text-[#1c1c1c] hover:bg-[#e4e4e4] font-medium",
    secondaire:
      "border-[#e4e4e4]/25 text-white hover:border-[#e4e4e4] font-normal",
    danger:
      "border-[#ea384c]/40 text-[#ffdede] hover:border-[#ea384c] font-normal",
    /* CORRECTIF 28/11 — variante JAUNE pour les confirmations de
     * DÉPUBLICATION (alerte sans gravité — rien n'est supprimé) : la
     * couleur rouge reste réservée aux suppressions. */
    attention:
      "border-[#f5b700]/45 text-[#ffe9a3] hover:border-[#f5b700] font-normal",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titre}
      aria-label={titre}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Pastille({ children, ton = "neutre" }: { children: React.ReactNode; ton?: "neutre" | "valide" | "alerte" }) {
  const tons: Record<string, string> = {
    neutre: "bg-[#e4e4e4]/12 text-[#e4e4e4]",
    valide: "bg-[#22c55e]/15 text-[#86efac] border border-[#22c55e]/30",
    alerte: "bg-[#ea384c]/10 text-[#ffdede] border border-[#ea384c]/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tons[ton]}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------
 * VOLET 21 (27/11/2026) — BOUTON D'ICÔNE AVEC INFO-BULLE.
 *
 * Demande de l'éditeur : « au survol de chaque icône d'action des
 * listes (propositions, devis, factures), une INFO-BULLE explique
 * son rôle ». Ce bouton remplace les boutons d'action des listes :
 * même gabarit visuel (rond 36 px, bordures du back-office), plus
 * une info-bulle CSS AU-DESSUS de l'icône — visible immédiatement
 * au survol (le title natif mettait ~1 s à apparaître), accessible
 * (aria-label), et toujours lisible même sur un bouton désactivé.
 * ------------------------------------------------------------------ */
export function BoutonIcone({
  titre,
  children,
  onClick,
  disabled = false,
  ton = "neutre",
  className = "",
}: {
  /** Libellé de l'info-bulle ET de l'accessibilité. */
  titre: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ton?: "neutre" | "valide" | "danger";
  className?: string;
}) {
  const fonds: Record<string, string> = {
    neutre: "border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#e4e4e4] hover:text-[#e4e4e4]",
    valide: "border-[#22c55e]/30 text-[#86efac] hover:border-[#22c55e]",
    danger: "border-[#ea384c]/30 text-[#ffdede] hover:border-[#ea384c]",
  };
  return (
    <span className="group/bi relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={titre}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${fonds[ton]} ${className}`}
      >
        {children}
      </button>
      {/* Info-bulle : au-dessus de l'icône, flèche discrète vers le
          bas ; survol de la zone (bouton OU info-bulle) — marche
          aussi sur un bouton désactivé (pointer-events sur le span).
          VOLET 23 — ANCRE À DROITE : l'info-bulle s'étend vers la
          GAUCHE du bouton. Les boutons d'action des listes vivent
          ALIGNÉS À DROITE de leur carte : l'ancrage centré faisait
          déborder la dernière info-bulle HORS de la carte — c'est
          ELLE qui créait la barre de défilement horizontal (et une
          fois la carte clippée, l'info-bulle du dernier bouton
          aurait été coupée). Ancrée à droite, l'info-bulle ne
          dépasse JAMAIS le bord droit. */}
      <span
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden whitespace-nowrap rounded-md border border-[#e4e4e4]/15 bg-[#0f0f0f] px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-opacity duration-150 group-hover/bi:opacity-100 group-focus-within/bi:opacity-100 sm:block"
      >
        {titre}
        <span className="absolute right-[14px] top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[#e4e4e4]/15 bg-[#0f0f0f]" />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------
 * VOLET 22 (27/11/2026) — ICÔNE DE LA MODALE DE CONFIRMATION : ROUGE
 * et CENTRÉE horizontalement (demande de l'éditeur : « l'icône
 * d'alerte devrait être en rouge et centrée horizontalement, et non
 * à gauche du contenu du modal »). L'icône d'alerte (rouge pleine)
 * occupe sa propre ligne AU-DESSUS du titre, centrée ; le titre est
 * centré lui aussi, le message reste aligné à gauche (lisibilité des
 * avertissements en cascade).
 * CORRECTIF 28/11 — `ton="jaune"` : la modale de DÉPUBLICATION
 * devient une alerte JAUNE (demande de l'éditeur : « lorsqu'on
 * clique sur le bouton Dépublier, le modal qui s'ouvre a une couleur
 * d'alerte rouge. Non, je veux que ça soit une couleur d'alerte
 * jaune »). La suppression (rouge, irréversible) reste `ton` par
 * défaut ; le bouton de confirmation suit le ton.
 * ------------------------------------------------------------------ */
export function ModaleConfirmation({
  ouvert,
  titre,
  message,
  libelleAnnuler = "Annuler",
  libelleConfirmer = "Supprimer",
  enCours = false,
  ton = "rouge",
  onAnnuler,
  onConfirmer,
}: {
  ouvert: boolean;
  titre: string;
  /** Message d'avertissement — ReactNode (peut inclure un bloc
   *  d'avertissement en cascade). */
  message: React.ReactNode;
  libelleAnnuler?: string;
  libelleConfirmer?: string;
  enCours?: boolean;
  /** Couleur d'alerte : "rouge" (suppression — défaut) ou "jaune"
   *  (dépublication : rien n'est effacé). */
  ton?: "rouge" | "jaune";
  onAnnuler: () => void;
  onConfirmer: () => void;
}) {
  if (!ouvert) return null;
  const jaune = ton === "jaune";
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      onClick={(e) => e.target === e.currentTarget && !enCours && onAnnuler()}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-6 sm:p-7">
        {/* Icône d'alerte — CENTRÉE horizontalement (VOLET 22) ;
            ROUGE (suppression) ou JAUNE (dépublication — correctif
            28/11 : le retrait du site n'efface rien). */}
        <div className="flex justify-center">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              jaune ? "bg-[#f5b700]/12" : "bg-[#ea384c]/12"
            }`}
          >
            <AlertTriangle
              className={`h-7 w-7 ${jaune ? "text-[#f5b700]" : "text-[#ea384c]"}`}
              aria-hidden="true"
            />
          </span>
        </div>
        <h3 className="mt-4 text-center font-display text-lg font-semibold text-white">{titre}</h3>
        <div className="mt-2 text-sm leading-relaxed text-[#c8c8c8]">{message}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <BoutonAction onClick={onAnnuler} disabled={enCours}>
            {libelleAnnuler}
          </BoutonAction>
          <BoutonAction variant={jaune ? "attention" : "danger"} onClick={onConfirmer} disabled={enCours}>
            {enCours ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {libelleConfirmer}
          </BoutonAction>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * VOLET 22 (27/11/2026) — ANNEAU DE CHARGEMENT CIRCULAIRE 0 → 100 %.
 *
 * Demandé pour l'analyse du devis signé téléversé (« lors de
 * l'upload il doit y avoir un chargement de 0 à 100, un symbole
 * circulaire qui montre un chargement de 0 à 100 qui remplit de
 * façon verte, avec le pourcentage affiché au centre ») puis pour
 * le scraping d'un projet du portfolio. L'anneau se remplit en
 * VERT ; le pourcentage est affiché AU CENTRE.
 * ------------------------------------------------------------------ */
export function AnneauProgression({
  pourcentage,
  taille = 88,
}: {
  pourcentage: number;
  taille?: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(pourcentage)));
  const rayon = 42;
  const circonference = 2 * Math.PI * rayon;
  const rempli = (pct / 100) * circonference;
  return (
    <div
      className="relative"
      style={{ width: `${taille}px`, height: `${taille}px` }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Analyse en cours"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        {/* piste de fond */}
        <circle
          cx="50"
          cy="50"
          r={rayon}
          fill="none"
          stroke="#2f2f2f"
          strokeWidth="7"
        />
        {/* remplissage VERT, proportionnel au pourcentage */}
        <circle
          cx="50"
          cy="50"
          r={rayon}
          fill="none"
          stroke="#22c55e"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${rempli} ${circonference - rempli}`}
          style={{ transition: "stroke-dasharray 260ms linear" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-base font-semibold text-white">
        {pct}&nbsp;%
      </span>
    </div>
  );
}
