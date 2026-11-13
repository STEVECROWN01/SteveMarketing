"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Bouton blanc « style header » (pastille flèche ↗, style sheragency) :
 * fond #ffffff, bordure #e4e4e4, remplissage progressif, légère élévation.
 * Extrait du header pour être réutilisé par la section
 * « Comment ça fonctionne ? » (« Démarrons Votre Projet ») —
 * le libellé est paramétrable.
 */
export function StartProjectButton({
  label = "Démarrer Un Projet",
  className = "",
  onClick,
  ariaLabel,
}: {
  label?: string;
  className?: string;
  onClick: (e?: React.MouseEvent) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? `${label} — page de demande de devis`}
      className={`group/cta btn-fill inline-flex min-h-[52px] items-center gap-3 rounded-full border border-[#e4e4e4] bg-white py-2 pl-6 pr-1.5 font-medium tracking-[0.01em] text-[#1c1c1c] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#c9baac] focus-visible:outline-2 focus-visible:outline-offset-4 [&::before]:bg-[#e4e4e4] ${className}`}
    >
      <span className="text-[15px]">{label}</span>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e4e4e4] transition-colors duration-300 group-hover/cta:bg-[#1c1c1c]">
        <ArrowUpRight
          className="h-3.5 w-3.5 text-[#1c1c1c] transition-colors duration-300 group-hover/cta:text-white"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
