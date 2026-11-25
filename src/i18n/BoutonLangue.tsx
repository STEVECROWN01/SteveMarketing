"use client";

/**
 * VOLET 18 (25/11/2026) — BOUTON DE SWITCH BILINGUE.
 *
 * Bouton ROND (plein cercle) : drapeau de la langue courante à
 * GAUCHE, code de la langue à DROITE (« FR » en français, « EN » en
 * anglais — demande de l'éditeur). Au survol, le bouton devient
 * BLANC (texte sombre). Un clic bascule le site entier en l'autre
 * langue, SANS rechargement, en conservant la page visualisée
 * (voir src/i18n/index.tsx).
 *
 * Deux emplacements (demande de l'éditeur) :
 * - la pilule de navigation du header, À DROITE du bouton
 *   « Démarrer un projet » (bureau uniquement — la pilule est
 *   masquée sous lg) ;
 * - le panneau plein écran du menu hamburger, À GAUCHE du bouton
 *   de fermeture (toutes tailles).
 *
 * Drapeaux : SVG inline (aucune image externe, aucun emoji — les
 * emoji-drapeux ne s'affichent pas sous Windows). Union Jack
 * simplifié pour l'anglais, drapeau tricolore pour le français.
 */

import React from "react";
import { useLang } from "@/i18n";

export function DrapeauFR({ className = "h-3.5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true" focusable="false">
      <rect width="20" height="40" fill="#002395" />
      <rect x="20" width="20" height="40" fill="#ffffff" />
      <rect x="40" width="20" height="40" fill="#ED2939" />
    </svg>
  );
}

export function DrapeauEN({ className = "h-3.5 w-auto" }: { className?: string }) {
  /* Union Jack simplifié (diagonales centrées — indiscernable à
     cette taille) : champ bleu, croix de Saint-André blanche puis
     rouge, croix de Saint-Georges blanche puis rouge. */
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true" focusable="false">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
      <rect x="24" width="12" height="40" fill="#ffffff" />
      <rect x="0" y="14" width="60" height="12" fill="#ffffff" />
      <rect x="26.5" width="7" height="40" fill="#C8102E" />
      <rect x="0" y="16.5" width="60" height="7" fill="#C8102E" />
    </svg>
  );
}

type Props = {
  /** Taille : « header » (pilule de navigation, bureau) ou
   *  « panneau » (menu plein écran). */
  taille?: "header" | "panneau";
  className?: string;
};

export function BoutonLangue({ taille = "header", className = "" }: Props) {
  const { lang, bascule } = useLang();

  const libelle =
    lang === "fr" ? "Passer le site en anglais" : "Switch the site to French";

  return (
    <button
      type="button"
      onClick={bascule}
      aria-label={libelle}
      title={libelle}
      className={`group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#e4e4e4]/25 bg-[#232323] font-semibold text-white transition-colors duration-300 hover:border-[#e4e4e4] hover:bg-[#e4e4e4] hover:text-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-4 ${
        taille === "panneau"
          ? "h-12 px-4 text-[13px] sm:h-14 sm:px-5"
          : /* VOLET 19 (26/11/2026) — hauteur ALIGNÉE sur le bouton CTA
             * « Démarrer Un Projet » du header (min-h-[52px], demande de
             * l'éditeur : « augmente un peu sa taille pour que sa hauteur
             * vienne avec la hauteur du bouton du CTA du header »). */
            "h-[52px] px-[18px] text-[13px]"
      } ${className}`}
    >
      {lang === "fr" ? <DrapeauFR /> : <DrapeauEN />}
      <span className="leading-none tracking-[0.04em]">{lang.toUpperCase()}</span>
    </button>
  );
}
