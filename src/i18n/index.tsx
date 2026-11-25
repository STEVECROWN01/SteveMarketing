"use client";

/**
 * VOLET 18 (25/11/2026) — SITE BILINGUE FRANÇAIS / ANGLAIS.
 *
 * Principe : le français reste la SOURCE UNIQUE (tous les textes du
 * site restent écrits en français dans site-content.ts, lib/site.ts
 * et dans les composants) ; l'anglais est une COUCHE de traduction
 * appliquée au rendu — deux cartes « chaîne FR exacte → chaîne EN »
 * (trad-site-en.ts pour le contenu central, trad-ui-en.ts pour les
 * textes en dur des composants). Toute chaîne absente des cartes
 * retombe sur le français : le site ne peut jamais « casser » en
 * anglais, au pire un texte reste français.
 *
 * - LangProvider : contexte de langue, persisté en localStorage
 *   (« site-langue »), sans rechargement de page — le rendu change
 *   en place et la page visualisée est conservée (routeur par
 *   fragment inchangé) ;
 * - useT() : fonction t(chaîne) réactive à la langue ;
 * - useContenu() : les exports de site-content.ts (HERO, PROBLEM…)
 *   traduits en profondeur — les composants remplacent l'import
 *   statique par ce hook, le JSX reste identique ;
 * - useSite() : PAGES / NAV_ITEMS / PROJECTS (lib/site.ts) traduits
 *   en profondeur (titres de pages, libellés de menu, descriptions
 *   de projets) ;
 * - l'attribut <html lang> suit la langue (lecteurs d'écran).
 *
 * L'ESPACE ADMINISTRATEUR n'utilise AUCUN de ces hooks : il demeure
 * en français (demande de l'éditeur) — seuls les boutons de
 * traduction des demandes et la langue des documents (volet
 * documents bilingues) s'y ajoutent.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as CONTENU from "@/content/site-content";
import { NAV_ITEMS, PAGES, PROJECTS, SITE } from "@/lib/site";
import { TRAD_SITE } from "./trad-site-en";
import { TRAD_UI } from "./trad-ui-en";

export type Langue = "fr" | "en";

export const CLE_STOCKAGE_LANGUE = "site-langue";

/** Fusion des deux cartes de traduction (l'ordre importe peu : les
 *  clés FR exactes sont uniques à travers les deux fichiers —
 *  vérifié à la génération). */
export const TRADUCTIONS: Record<string, string> = {
  ...TRAD_UI,
  ...TRAD_SITE,
};

/** Traduit UNE chaîne — retombe sur le français si absente. */
export function traduit(texte: string, lang: Langue): string {
  if (lang !== "en") return texte;
  return TRADUCTIONS[texte] ?? texte;
}

/** Traduit un GABARIT interpolé — clé = chaîne française avec
 *  marqueurs {nom} ; les valeurs remplacent les marqueurs dans la
 *  version traduite (les gabarits anglais gardent les mêmes
 *  marqueurs). Retombe sur le gabarit français si absent. */
export function traduitModele(
  modele: string,
  valeurs: Record<string, string | number>,
  lang: Langue,
): string {
  const gabarit = lang === "en" ? TRADUCTIONS[modele] ?? modele : modele;
  return gabarit.replace(/\{(\w+)\}/g, (_complet, cle: string) =>
    cle in valeurs ? String(valeurs[cle]) : `{${cle}}`,
  );
}

/** Traduit en profondeur un objet / tableau de contenu : chaque
 *  chaîne passe par traduit(), la structure est préservée. */
function traduitProfond<T>(valeur: T, lang: Langue): T {
  if (typeof valeur === "string") return traduit(valeur, lang) as unknown as T;
  if (Array.isArray(valeur)) {
    return valeur.map((element) => traduitProfond(element, lang)) as unknown as T;
  }
  if (valeur && typeof valeur === "object") {
    const resultat: Record<string, unknown> = {};
    for (const cle of Object.keys(valeur as Record<string, unknown>)) {
      resultat[cle] = traduitProfond((valeur as Record<string, unknown>)[cle], lang);
    }
    return resultat as T;
  }
  return valeur;
}

/* ------------------------------------------------------------------ */
/* Contexte de langue                                                  */
/* ------------------------------------------------------------------ */

type ContexteLangue = {
  lang: Langue;
  setLang: (lang: Langue) => void;
  bascule: () => void;
};

const LangContext = createContext<ContexteLangue>({
  lang: "fr",
  setLang: () => undefined,
  bascule: () => undefined,
});

export function useLang(): ContexteLangue {
  return useContext(LangContext);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Langue>("fr");

  /* Restauration du choix persisté (après l'hydratation — l'état
   *  initial du rendu serveur reste « fr », puis la langue mémorisée
   *  s'applique dès le premier effet : un court instant en français
   *  pour un visiteur anglophone revenant, sans erreur
   *  d'hydratation). */
  useEffect(() => {
    try {
      const stockee = window.localStorage.getItem(CLE_STOCKAGE_LANGUE);
      if (stockee === "en" || stockee === "fr") setLangState(stockee);
    } catch {
      /* localStorage indisponible (navigation privée stricte) : fr. */
    }
  }, []);

  /* <html lang> suit la langue (lecteurs d'écran, moteurs). */
  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "fr";
  }, [lang]);

  const setLang = (nouvelle: Langue) => {
    setLangState(nouvelle);
    try {
      window.localStorage.setItem(CLE_STOCKAGE_LANGUE, nouvelle);
    } catch {
      /* Stockage indisponible : le choix ne persiste pas. */
    }
  };

  const bascule = () => setLang(lang === "fr" ? "en" : "fr");

  const valeur = useMemo<ContexteLangue>(
    () => ({ lang, setLang, bascule }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );

  return <LangContext.Provider value={valeur}>{children}</LangContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Hooks de rendu                                                      */
/* ------------------------------------------------------------------ */

/** t(chaîne) — traduction réactive d'une chaîne littérale ;
 *  tf(gabarit, valeurs) — traduction d'une chaîne interpolée
 *  (les marqueurs {nom} du gabarit reçoivent les valeurs). */
export function useT() {
  const { lang } = useLang();
  return useMemo(() => {
    const t = (texte: string): string =>
      lang === "en" ? (TRADUCTIONS[texte] ?? texte) : texte;
    const tf = (
      modele: string,
      valeurs: Record<string, string | number>,
    ): string => traduitModele(modele, valeurs, lang);
    return { t, tf, lang };
  }, [lang]);
}

/** Exports de site-content.ts traduits en profondeur — même
 *  structure, mêmes noms : les composants remplacent l'import
 *  statique par « const { HERO } = useContenu() ». */
export function useContenu() {
  const { lang } = useLang();
  return useMemo(
    () =>
      traduitProfond(
        {
          CTA_LABELS: CONTENU.CTA_LABELS,
          HERO: CONTENU.HERO,
          PROBLEM: CONTENU.PROBLEM,
          QUESTIONING: CONTENU.QUESTIONING,
          TRANSFORMATION: CONTENU.TRANSFORMATION,
          SOLUTION: CONTENU.SOLUTION,
          ABOUT_APPROACH: CONTENU.ABOUT_APPROACH,
          SERVICES_SUMMARY: CONTENU.SERVICES_SUMMARY,
          SERVICES: CONTENU.SERVICES,
          INCLUDED: CONTENU.INCLUDED,
          COMPLEMENTARY: CONTENU.COMPLEMENTARY,
          WORKS: CONTENU.WORKS,
          METHOD: CONTENU.METHOD,
          ABOUT: CONTENU.ABOUT,
          FAQ: CONTENU.FAQ,
          FINAL_CTA: CONTENU.FINAL_CTA,
          TARGETS: CONTENU.TARGETS,
        },
        lang,
      ),
    [lang],
  );
}

/** PAGES / NAV_ITEMS / PROJECTS / SITE (lib/site.ts) traduits en
 *  profondeur — titres de pages virtuelles, libellés de menus,
 *  descriptions de projets, textes de contact. */
export function useSite() {
  const { lang } = useLang();
  return useMemo(
    () =>
      traduitProfond(
        { PAGES, NAV_ITEMS, PROJECTS, SITE },
        lang,
      ),
    [lang],
  );
}
