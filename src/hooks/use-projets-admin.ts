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
 *
 * VOLET 22 (27/11/2026) — PILOTAGE DES RÉALISATIONS STATIQUES :
 * l'API renvoie aussi `statiquesMasques` (identifiants des
 * réalisations du code du site supprimées définitivement ou
 * converties en brouillon depuis l'espace admin). Dans la liste
 * combinée, un projet statique masqué disparaît ; un projet statique
 * administré (même identifiant) est REMPLACÉ par sa version admin à
 * sa position d'origine (le hero, qui référence PROJECTS[2] par
 * index, reste stable).
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
/* VOLET 22 — identifiants des réalisations STATIQUES masquées
 * (supprimées définitivement ou converties en brouillon). */
let masques: string[] = [];
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
    masques =
      res.ok && Array.isArray(data?.statiquesMasques) ? (data.statiquesMasques as string[]) : [];
    etat = "pret";
  } catch {
    projets = [];
    masques = [];
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
 *  l'effet.) VOLET 22 — expose AUSSI les identifiants des projets
 *  statiques masqués (l'espace admin pilote les réalisations du
 *  code du site : modification, dépublication, suppression). */
export function useProjetsAdmin(): {
  projets: ProjetPublic[];
  masques: string[];
  chargement: boolean;
} {
  const [liste, setListe] = useState<ProjetPublic[]>(projets);
  const [masquesCourants, setMasquesCourants] = useState<string[]>(masques);
  useEffect(() => {
    const abonne = (nouvelles: ProjetPublic[]) => setListe(nouvelles);
    abonnes.add(abonne);
    if (etat === "vide") charger();
    return () => {
      abonnes.delete(abonne);
    };
  }, []);
  return { projets: liste, masques: masquesCourants, chargement: etat !== "pret" };
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

/** Un projet ADMIN au format du site (ProjetSite). */
function versProjetSite(p: ProjetPublic, lang: string): ProjetSite {
  return {
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
  };
}

/** TOUS les projets du site : les QUATRE projets statiques (ordre et
 *  indices préservés — le hero référence PROJECTS[2]) suivis des
 *  projets publiés depuis l'admin, dans l'ordre chronologique. Les
 *  textes suivent la langue courante (traduction pour les statiques,
 *  champs anglais optionnels pour les admin).
 *
 *  VOLET 22 — PILOTAGE DES RÉALISATIONS STATIQUES DEPUIS L'ADMIN :
 *  - un projet statique SUPPRIMÉ ou DÉPUBLIÉ (converti en brouillon)
 *    n'apparaît plus (statiquesMasques) ;
 *  - un projet statique MODIFIÉ depuis l'admin est REMPLACÉ, à SA
 *    POSITION D'ORIGINE, par sa version administrée (même
 *    identifiant) — l'ordre des réalisations ne bouge pas ;
 *  - les autres projets admin s'ajoutent à la suite. */
export function useTousLesProjets(): {
  projets: ProjetSite[];
  chargement: boolean;
} {
  const { lang } = useLang();
  const { PROJECTS } = useSite();
  const { projets: admin, masques, chargement } = useProjetsAdmin();

  const tous = useMemo<ProjetSite[]>(() => {
    const statiques: ProjetSite[] = (PROJECTS as unknown as ProjetSite[])
      /* réalisations statiques masquées (supprimées / dépubliées) : hors site */
      .filter((p) => !masques.includes(p.id))
      .map((p) => {
        /* réalisation statique administrée : la version admin la
           remplace (même position, textes mis à jour, nouvelles
           captures éventuelles) */
        const remplacement = admin.find((a) => a.id === p.id);
        if (remplacement) return versProjetSite(remplacement, lang);
        return {
          ...p,
          desktop: String(p.desktop),
          mobile: p.mobile ? String(p.mobile) : undefined,
        } as ProjetSite;
      });
    const dynamiques: ProjetSite[] = admin
      /* les projets admin qui remplacent une réalisation statique sont
         déjà affichés à la position de l'original — pas de doublon */
      .filter((p) => !(PROJECTS as unknown as { id: string }[]).some((st) => st.id === p.id))
      .map((p) => versProjetSite(p, lang));
    return [...statiques, ...dynamiques];
  }, [PROJECTS, admin, masques, lang]);

  return { projets: tous, chargement };
}
