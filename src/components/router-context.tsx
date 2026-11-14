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

/**
 * Routeur applicatif du site (pages virtuelles dans la route `/`).
 * URLs propres par fragment : #/services, #/realisations, #/a-propos,
 * #/contact, #/demander-un-devis, #/reserver-un-appel,
 * #/mentions-legales, #/projet/<id> (page de présentation
 * d'une réalisation) — ancrage de section possible :
 * #/accueil/portfolio…
 */

export type AppPage =
  | "accueil"
  | "processus"
  | "services"
  | "realisations"
  | "projet"
  | "aPropos"
  | "contact"
  | "devis"
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
  services: "services",
  realisations: "realisations",
  projet: "realisations",
  aPropos: "aPropos",
  contact: "contact",
  devis: "devis",
  appel: "appel",
  legal: "legal",
  admin: "admin",
};

const SERVER_HASH = "";

/** Correspondance URL (fragment) → clé de page applicative. */
const HASH_TO_PAGE: Record<string, AppPage> = {
  accueil: "accueil",
  processus: "processus",
  services: "services",
  realisations: "realisations",
  projet: "projet",
  "a-propos": "aPropos",
  contact: "contact",
  "demander-un-devis": "devis",
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
  processus: "processus",
  services: "services",
  realisations: "realisations",
  projet: "projet",
  aPropos: "a-propos",
  contact: "contact",
  devis: "demander-un-devis",
  appel: "reserver-un-appel",
  legal: "mentions-legales",
  admin: "admin",
};

export function RouterProvider({ children }: { children: React.ReactNode }) {
  // Le hash est un système externe → useSyncExternalStore (SSR-safe)
  const hash = useSyncExternalStore(subscribe, getHash, getServerHash);
  const state = useMemo(() => parseHash(hash), [hash]);

  // Titre dynamique + défilement après changement de page.
  useEffect(() => {
    // Page projet : le fragment porte l'identifiant du projet (ex.
    // #/projet/mrsteveenglish) — titre dédié, retour en haut sans
    // tentative d'ancrage.
    if (state.page === "projet") {
      const project = PROJECTS.find((p) => p.id === state.section);
      if (typeof document !== "undefined") {
        document.title = project
          ? `${project.name} — Projet web | Stevens Akpovi`
          : "Réalisations — Projets web | Stevens Akpovi";
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const meta =
      state.page !== "admin"
        ? PAGES[PAGE_KEYS[state.page] as keyof typeof PAGES]
        : null;
    if (meta && typeof document !== "undefined") {
      document.title = meta.title;
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
  }, [state.page, state.section]);

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
