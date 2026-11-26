"use client";

/**
 * PROJETS DU PORTFOLIO ÉVOLUTIF — HOOK PARTAGÉ (VOLET 19, 26/11/2026).
 *
 * Charge UNE fois (cache au niveau du module + abonnés) la liste des
 * projets PUBLIÉS depuis l'espace admin (GET /api/projects) et la met
 * à la disposition de tous les composants du site : section
 * Réalisations de l'accueil, page Réalisations, pages projet.
 *
 * Tolérance de pannes : échec réseau ou stockage non configuré →
 * liste VIDE silencieuse — le site retombe sur ses projets statiques
 * (src/lib/site.ts), jamais de page cassée.
 */

import { useEffect, useMemo, useState } from "react";
import { useLang, useSite, traduit } from "@/i18n";
import type { ProjetPublic, TraductionProjet } from "@/lib/portfolio/types";

/** Projet au format du site (voir ProjectCard / pages). */
export type ProjetSite = {
  id: string;
  name: string;
  category: string;
  description: string;
  cta: string;
  url: string;
  desktop: string;
  desktop2x?: string;
  desktopSmall?: string;
  mobile?: string;
  mobile2x?: string;
  /** Dimensions réelles (admin) pour la réserve de place — zéro CLS. */
  largeurDesktop?: number;
  hauteurDesktop?: number;
  largeurMobile?: number | null;
  hauteurMobile?: number | null;
};

/* ------------------------------------------------------------------ */
/* Magasin partagé (une requête pour toute l'application)             */
/* ------------------------------------------------------------------ */

type Etat = "vide" | "chargement" | "pret" | "erreur";

let projets: ProjetPublic[] = [];
let etat: Etat = "vide";
const abonnes = new Set<(projets: ProjetPublic[]) => void>();

function notifier() {
  for (const abonne of abonnes) abonne(projets);
}

async function charger() {
  etat = "chargement";
  try {
    const res = await fetch("/api/projects", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    projets = res.ok && data?.ok ? ((data.projets ?? []) as ProjetPublic[]) : [];
    etat = "pret";
  } catch {
    projets = [];
    etat = "erreur";
  }
  notifier();
}

/** Force un rechargement (après une publication, depuis l'admin). */
export function rafraichirProjetsAdmin() {
  if (etat === "chargement") return;
  charger();
}

/** Projets publiés depuis l'admin + état de chargement.
 *  (L'état initial capture le magasin AU MONTAGE ; les mises à
 *  jour arrivent par l'abonnement — jamais de setState direct dans
 *  l'effet.) */
export function useProjetsAdmin(): { projets: ProjetPublic[]; chargement: boolean } {
  const [liste, setListe] = useState<ProjetPublic[]>(projets);
  useEffect(() => {
    const abonne = (nouvelles: ProjetPublic[]) => setListe(nouvelles);
    abonnes.add(abonne);
    if (etat === "vide") charger();
    return () => {
      abonnes.delete(abonne);
    };
  }, []);
  return { projets: liste, chargement: etat !== "pret" };
}

/* ------------------------------------------------------------------ */
/* Liste COMBINÉE : projets statiques (traduits) + projets admin      */
/* ------------------------------------------------------------------ */

/** Version anglaise d'un champ admin (retombe sur le français).
 *  VOLET 20 (26/11/2026) — « ce n'est pas à moi de mettre la version
 *  anglaise lors de l'ajout du projet : c'est le site qui s'occupe de
 *  ça, qui traduit ça » : plus de champs anglais dans le back-office —
 *  le champ anglais manuel disparaît, et le SITE traduit lui-même les
 *  textes du projet (couche de traduction globale : une traduction
 *  présente s'applique, sinon le texte français reste affiché). */
function tradAdmin<T extends keyof TraductionProjet>(
  p: ProjetPublic,
  champ: T,
  langue: string,
): string {
  const texte = String(p[champ as keyof ProjetPublic] ?? "");
  if (langue === "en") {
    const manuelle = p.en?.[champ];
    if (typeof manuelle === "string" && manuelle.trim()) return manuelle;
  }
  return traduit(texte, langue === "en" ? "en" : "fr");
}

/** TOUS les projets du site : les QUATRE projets statiques (ordre et
 *  indices préservés — le hero référence PROJECTS[2]) suivis des
 *  projets publiés depuis l'admin, dans l'ordre chronologique. Les
 *  textes suivent la langue courante (traduction pour les statiques,
 *  champs anglais optionnels pour les admin). */
export function useTousLesProjets(): {
  projets: ProjetSite[];
  chargement: boolean;
} {
  const { lang } = useLang();
  const { PROJECTS } = useSite();
  const { projets: admin, chargement } = useProjetsAdmin();

  const tous = useMemo<ProjetSite[]>(() => {
    const statiques: ProjetSite[] = (PROJECTS as unknown as ProjetSite[]).map((p) => ({
      ...p,
      desktop: String(p.desktop),
      mobile: p.mobile ? String(p.mobile) : undefined,
    }));
    const dynamiques: ProjetSite[] = admin.map((p) => ({
      id: p.id,
      name: tradAdmin(p, "nom", lang),
      category: tradAdmin(p, "categorie", lang),
      description: tradAdmin(p, "description", lang),
      cta: tradAdmin(p, "cta", lang) || "Voir Le Site",
      url: p.url,
      desktop: p.desktop,
      mobile: p.mobile ?? undefined,
      largeurDesktop: p.largeurDesktop,
      hauteurDesktop: p.hauteurDesktop,
      largeurMobile: p.largeurMobile,
      hauteurMobile: p.hauteurMobile,
    }));
    return [...statiques, ...dynamiques];
  }, [PROJECTS, admin, lang]);

  return { projets: tous, chargement };
}
