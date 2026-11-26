"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { PAGES, PROJECTS, type PageKey } from "@/lib/site";
import { traduit, traduitModele, useLang } from "@/i18n";

/**
 * Routeur applicatif du site (pages virtuelles dans la route `/`).
 * URLs propres par fragment : #/methode, #/referencement-seo,
 * #/publicite-meta-ads, #/realisations, #/a-propos, #/contact,
 * #/demander-un-devis, #/audit-gratuit, #/reserver-un-appel,
 * #/mentions-legales, #/projet/<id> (page de présentation d'une
 * réalisation) — ancrage de section possible : #/accueil/portfolio…
 */

export type AppPage =
  | "accueil"
  | "processus"
  | "referencement"
  | "publicite"
  | "realisations"
  | "projet"
  | "aPropos"
  | "contact"
  | "devis"
  | "devisSeo"
  | "devisMetaAds"
  | "audit"
  | "appel"
  | "legal"
  | "admin";

interface RouterState {
  page: AppPage;
  section: string | null;
}

interface RouterContextValue extends RouterState {
  navigate: (page: AppPage, section?: string | null) => void;
  href: (page: AppPage, section?: string | null) => string;
}

const RouterContext = createContext<RouterContextValue | null>(null);

const PAGE_KEYS: Record<AppPage, keyof typeof PAGES | "admin"> = {
  accueil: "accueil",
  processus: "processus",
  referencement: "referencement",
  publicite: "publicite",
  realisations: "realisations",
  projet: "realisations",
  aPropos: "aPropos",
  contact: "contact",
  devis: "devis",
  devisSeo: "devisSeo",
  devisMetaAds: "devisMetaAds",
  audit: "audit",
  appel: "appel",
  legal: "legal",
  admin: "admin",
};

const SERVER_HASH = "";

/** Correspondance URL (fragment) → clé de page applicative.
 *  Anciens fragments conservés en alias : « processus » (page
 *  renommée « méthode », 15/11/2026) et « services » (page
 *  supprimée — ses contenus vivent désormais sur la page Méthode :
 *  l'ancienne URL y ramène). */
const HASH_TO_PAGE: Record<string, AppPage> = {
  accueil: "accueil",
  methode: "processus",
  processus: "processus",
  services: "processus",
  "referencement-seo": "referencement",
  "publicite-meta-ads": "publicite",
  realisations: "realisations",
  projet: "projet",
  "a-propos": "aPropos",
  contact: "contact",
  "demander-un-devis": "devis",
  "devis-referencement-seo": "devisSeo",
  "devis-publicite-meta-ads": "devisMetaAds",
  "audit-gratuit": "audit",
  "reserver-un-appel": "appel",
  "mentions-legales": "legal",
  admin: "admin",
};

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getHash(): string {
  return window.location.hash;
}

function getServerHash(): string {
  return SERVER_HASH;
}

/* ---------- Garde-fou anti-écrasement des métadonnées ----------
   (audit intégral du site, 18/11/2026). Constat : au CHARGEMENT
   DIRECT d'une page profonde (lien partagé #/methode, sitemap,
   indexation), le useEffect ci-dessous applique le bon <title> —
   puis l'hydratation des métadonnées STATIQUES de Next.js
   (layout.tsx : titre et description de l'accueil) le RÉÉCRIT
   ~50 ms plus tard. Résultat : mauvais titre et mauvaise
   description d'onglet pour toute entrée autre que #/accueil,
   contrairement à l'objectif du dispositif SEO du 16/11 (« les
   moteurs et aperçus qui exécutent le JavaScript voient les méta
   de CHAQUE page »). Solution : un MutationObserver sur <head>
   ré-applique les métadonnées attendues de la page courante dès
   qu'une écriture externe les remplace. Boucle impossible : on
   n'écrit QUE lorsque la valeur courante diffère de l'attendue —
   la ré-écriture converge et l'observateur se calme. */
let metaAttendue: { titre: string; description: string } | null = null;
let metaGardeInstallee = false;

function installerGardeMeta(): void {
  if (metaGardeInstallee || typeof document === "undefined") return;
  metaGardeInstallee = true;
  const reappliquer = () => {
    if (!metaAttendue) return;
    const titre = document.querySelector("title");
    if (titre && titre.textContent !== metaAttendue.titre) {
      titre.textContent = metaAttendue.titre;
    }
    const cibles: Array<[string, string]> = [
      ['meta[name="description"]', metaAttendue.description],
      ['meta[property="og:title"]', metaAttendue.titre],
      ['meta[property="og:description"]', metaAttendue.description],
      ['meta[name="twitter:title"]', metaAttendue.titre],
      ['meta[name="twitter:description"]', metaAttendue.description],
    ];
    for (const [sel, attendu] of cibles) {
      const el = document.querySelector(sel);
      if (el && el.getAttribute("content") !== attendu) {
        el.setAttribute("content", attendu);
      }
    }
  };
  new MutationObserver(reappliquer).observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["content"],
  });
}

function parseHash(hash: string): RouterState {
  const clean = hash.replace(/^#\/?/, "");
  if (!clean || clean === "accueil") return { page: "accueil", section: null };
  const [rawPage, rawSection] = clean.split("/");
  const page = HASH_TO_PAGE[rawPage] ?? "accueil";
  const section = rawSection && rawSection.length > 0 ? rawSection : null;
  return { page, section };
}

/** Clé de page → fragment d'URL propre. */
const PAGE_TO_HASH: Record<AppPage, string> = {
  accueil: "accueil",
  processus: "methode",
  referencement: "referencement-seo",
  publicite: "publicite-meta-ads",
  realisations: "realisations",
  projet: "projet",
  aPropos: "a-propos",
  contact: "contact",
  devis: "demander-un-devis",
  devisSeo: "devis-referencement-seo",
  devisMetaAds: "devis-publicite-meta-ads",
  audit: "audit-gratuit",
  appel: "reserver-un-appel",
  legal: "mentions-legales",
  admin: "admin",
};

export function RouterProvider({ children }: { children: React.ReactNode }) {
  // Le hash est un système externe → useSyncExternalStore (SSR-safe)
  const hash = useSyncExternalStore(subscribe, getHash, getServerHash);
  const state = useMemo(() => parseHash(hash), [hash]);
  /* VOLET 18 — les TITRES et méta descriptions de pages suivent la
     LANGUE courante (PAGES est traduit via traduit()) : le changement
     de langue ré-applique les méta de la page visualisée — la garde
     anti-écrasement ré-écrit désormais les valeurs traduites. */
  const { lang } = useLang();

  // Titre + méta description dynamiques, puis défilement après changement
  // de page.
  useEffect(() => {
    /** SEO (16/11/2026) : chaque page virtuelle applique AUSSI sa
     *  méta description et ses balises Open Graph / Twitter — le titre
     *  était déjà dynamique, la description et les balises de partage
     *  suivent désormais la page affichée. Les moteurs et aperçus qui
     *  exécutent le JavaScript voient ainsi les méta de CHAQUE page,
     *  pas seulement celles de l'accueil. */
    const applyMeta = (title: string, description: string) => {
      // Enregistrer les valeurs attendues AVANT d'écrire : la garde
      // anti-écrasement (installée au premier passage) les
      // ré-appliquera si l'hydratation Next.js les écrase ensuite.
      metaAttendue = { titre: title, description };
      installerGardeMeta();
      document.title = title;
      const setContent = (selector: string, value: string) => {
        document
          .querySelectorAll(selector)
          .forEach((el) => el.setAttribute("content", value));
      };
      setContent('meta[name="description"]', description);
      setContent('meta[property="og:title"]', title);
      setContent('meta[property="og:description"]', description);
      setContent('meta[name="twitter:title"]', title);
      setContent('meta[name="twitter:description"]', description);
    };
    // Page projet : le fragment porte l'identifiant du projet (ex.
    // #/projet/mrsteveenglish) — titre dédié, retour en haut sans
    // tentative d'ancrage.
    if (state.page === "projet") {
      const project = PROJECTS.find((p) => p.id === state.section);
      if (typeof document !== "undefined") {
        applyMeta(
          project
            ? traduitModele("{name} — Projet web | Stevens Akpovi", { name: project.name }, lang)
            : traduit("Réalisations — Projets web | Stevens Akpovi", lang),
          project ? traduit(project.description, lang) : traduit(PAGES.realisations.description, lang)
        );
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const meta =
      state.page !== "admin"
        ? PAGES[PAGE_KEYS[state.page] as keyof typeof PAGES]
        : null;
    if (meta && typeof document !== "undefined") {
      applyMeta(traduit(meta.title, lang), traduit(meta.description, lang));
    }
    // Laisse le nouveau contenu monter avant l'ancrage : la transition
    // de page (AnimatePresence mode="wait") retarde le montage du
    // composant cible — on réessaie jusqu'à ce que la section existe
    // (borné ~1 s), sinon retour en haut.
    let tries = 0;
    let rafId = 0;
    const attempt = () => {
      if (state.section) {
        const el = document.getElementById(state.section);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (tries++ < 60) {
          rafId = requestAnimationFrame(attempt);
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    rafId = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(rafId);
  }, [state.page, state.section, lang]);

  const navigate = useCallback((page: AppPage, section: string | null = null) => {
    const fragment = PAGE_TO_HASH[page] ?? "accueil";
    const target = `#/${fragment}${section ? `/${section}` : ""}`;
    if (window.location.hash === target) {
      // Même cible : forcer l'ancrage / le retour en haut
      if (section) {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    window.location.hash = target;
  }, []);

  const href = useCallback(
    (page: AppPage, section: string | null = null) => {
      const fragment = PAGE_TO_HASH[page] ?? "accueil";
      return `#/${fragment}${section ? `/${section}` : ""}`;
    },
    []
  );

  const value = useMemo<RouterContextValue>(
    () => ({ ...state, navigate, href }),
    [state, navigate, href]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter doit être utilisé dans RouterProvider");
  return ctx;
}

export { PAGE_KEYS };
