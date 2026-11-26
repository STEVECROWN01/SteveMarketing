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

/* ------------------------------------------------------------------
 * VOLET 20 (26/11/2026) — MODALE DE CONFIRMATION PERSONNALISÉE.
 *
 * Demande de l'éditeur : « lorsqu'on clique sur le bouton de
 * suppression de document (devis, facture, proposition) pour la
 * supprimer, un modal de confirmation personnalisé devrait
 * s'ouvrir, et non modal browser par défaut » — même exigence pour
 * la suppression d'un projet du portfolio. Cette modale remplace
 * window.confirm partout dans le back-office : design du site
 * (fond #232323, bordures #e4e4e4), icône d'alerte, message libre
 * (peut avertir d'effets en cascade), actions Annuler / Confirmer
 * (variante « danger » sur la confirmation).
 * ------------------------------------------------------------------ */
export function ModaleConfirmation({
  ouvert,
  titre,
  message,
  libelleAnnuler = "Annuler",
  libelleConfirmer = "Supprimer",
  enCours = false,
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
  onAnnuler: () => void;
  onConfirmer: () => void;
}) {
  if (!ouvert) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      onClick={(e) => e.target === e.currentTarget && !enCours && onAnnuler()}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ea384c]/30 bg-[#ea384c]/10">
            <AlertTriangle className="h-5 w-5 text-[#ff8080]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-white">{titre}</h3>
            <div className="mt-2 text-sm leading-relaxed text-[#c8c8c8]">{message}</div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <BoutonAction onClick={onAnnuler} disabled={enCours}>
            {libelleAnnuler}
          </BoutonAction>
          <BoutonAction variant="danger" onClick={onConfirmer} disabled={enCours}>
            {enCours ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {libelleConfirmer}
          </BoutonAction>
        </div>
      </div>
    </div>
  );
}
