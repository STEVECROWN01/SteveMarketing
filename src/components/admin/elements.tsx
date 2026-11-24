"use client";

import React from "react";

/**
 * Éléments d'interface partagés du back-office (VOLET 14) —
 * habillage du site (cartes #232323, bordures #e4e4e4/12, textes
 * blanc/#c8c8c8) : le back-office garde le DESIGN DU SITE avec un
 * rendu plus professionnel et élégant (demande de l'éditeur).
 */

export const styleInput =
  "min-h-[46px] w-full rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] px-3.5 py-2.5 text-sm text-white placeholder:text-[#c8c8c8]/45 focus:border-[#e4e4e4] focus:outline-none";

export function Champ({
  label,
  children,
  className = "",
  indicatif,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  indicatif?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-white">{label}</span>
        {indicatif ? <span className="text-[10px] text-[#c8c8c8]/70">{indicatif}</span> : null}
      </span>
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
  variant?: "principal" | "secondaire" | "danger";
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
