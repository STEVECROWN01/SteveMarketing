"use client";

import React, { Suspense, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RouterProvider, useRouter } from "@/components/router-context";
import { CalendlyProvider } from "@/components/calendly/CalendlyContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePage } from "@/components/home/HomePage";
import { InteractionCouleurs } from "@/components/media/InteractionCouleurs";
import { Toaster } from "@/components/ui/toaster";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { PROJECTS } from "@/lib/site";

/**
 * Coquille applicative : routeur de pages (URLs propres par
 * fragment dans la route unique visible), transitions de page
 * fluides, en-tête, pied de page et popup Calendly global.
 *
 * PERFORMANCE (15/11/2026 — « le site est trop lent ») : seule la
 * page d'accueil est dans le paquet JavaScript initial. Toutes les
 * autres pages (méthode, référencement SEO, publicité Meta Ads,
 * réalisations, projet, à propos, contact, devis, appel, mentions,
 * admin) sont découpées en morceaux chargés à la demande
 * (React.lazy) — puis PRÉCHARGÉES dès que le navigateur est
 * inactif : la première visite n'emporte plus le code des pages non
 * consultées, et les navigations restent instantanées. La page
 * « Services » a été supprimée (demande de l'éditeur, 15/11/2026)
 * au profit des pages Méthode / Référencement / Publicité.
 */

/* Pages secondaires — morceaux séparés, préchargés à l'inactivité. */
const ProcessPage = React.lazy(() =>
  import("@/components/pages/ProcessPage").then((m) => ({ default: m.ProcessPage })),
);
const SeoPage = React.lazy(() =>
  import("@/components/pages/SeoPage").then((m) => ({ default: m.SeoPage })),
);
const MetaAdsPage = React.lazy(() =>
  import("@/components/pages/MetaAdsPage").then((m) => ({ default: m.MetaAdsPage })),
);
const PortfolioPage = React.lazy(() =>
  import("@/components/pages/PortfolioPage").then((m) => ({ default: m.PortfolioPage })),
);
const ProjectPage = React.lazy(() =>
  import("@/components/pages/ProjectPage").then((m) => ({ default: m.ProjectPage })),
);
const AboutPage = React.lazy(() =>
  import("@/components/pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const ContactPage = React.lazy(() =>
  import("@/components/pages/ContactPage").then((m) => ({ default: m.ContactPage })),
);
const DevisPage = React.lazy(() =>
  import("@/components/pages/DevisPage").then((m) => ({ default: m.DevisPage })),
);
const AuditPage = React.lazy(() =>
  import("@/components/pages/AuditPage").then((m) => ({ default: m.AuditPage })),
);
const CallBookingPage = React.lazy(() =>
  import("@/components/pages/CallBookingPage").then((m) => ({ default: m.CallBookingPage })),
);
const LegalPage = React.lazy(() =>
  import("@/components/pages/LegalPage").then((m) => ({ default: m.LegalPage })),
);
const AdminPage = React.lazy(() =>
  import("@/components/pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);

/** Préchargement à l'inactivité : le visiteur qui reste sur la page
 *  d'accueil récupère en arrière-plan les morceaux des autres pages —
 *  navigations instantanées sans rien ajouter au chargement initial. */
const PREFETCH_PAGES = [
  () => import("@/components/pages/ProcessPage"),
  () => import("@/components/pages/SeoPage"),
  () => import("@/components/pages/MetaAdsPage"),
  () => import("@/components/pages/PortfolioPage"),
  () => import("@/components/pages/ProjectPage"),
  () => import("@/components/pages/AboutPage"),
  () => import("@/components/pages/ContactPage"),
  () => import("@/components/pages/DevisPage"),
  () => import("@/components/pages/AuditPage"),
  () => import("@/components/pages/CallBookingPage"),
  () => import("@/components/pages/LegalPage"),
];

function PageSwitch() {
  const { page, section } = useRouter();
  const reduce = useReducedMotion();

  // Page projet : le fragment porte l'identifiant (#/projet/<id>).
  // Identifiant inconnu → repli sur la liste des réalisations.
  const content = (() => {
    switch (page) {
      case "processus":
        return <ProcessPage />;
      case "referencement":
        return <SeoPage />;
      case "publicite":
        return <MetaAdsPage />;
      case "realisations":
        return <PortfolioPage />;
      case "projet": {
        const known = PROJECTS.some((p) => p.id === section);
        return known && section ? <ProjectPage projectId={section} /> : <PortfolioPage />;
      }
      case "aPropos":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "devis":
        return <DevisPage />;
      case "audit":
        return <AuditPage />;
      case "appel":
        return <CallBookingPage />;
      case "legal":
        return <LegalPage />;
      case "admin":
        return <AdminPage />;
      default:
        return <HomePage />;
    }
  })();

  // Clé d'animation : les pages projets se distinguent par leur
  // identifiant pour que la transition se joue entre deux projets.
  const pageKey = page === "projet" ? `projet-${section}` : page;

  /* PREMIÈRE RÉSOLUTION SANS ANIMATION DE SORTIE (volet 7 de
   * l'audit, 19/11/2026 — LCP ≤ 1 s). Au chargement DIRECT d'une
   * page profonde (lien partagé #/methode, résultat de recherche),
   * le serveur ne voit jamais le fragment : il sert le HTML de
   * l'ACCUEIL, que l'hydratation remplace aussitôt par la page
   * demandée. AnimatePresence mode="wait" attendait pourtant
   * l'animation de SORTIE de ce contenu intermédiaire (320 ms)
   * avant de monter la page cible — 320 ms perdues sur le chemin
   * critique du LCP pour fondre un contenu que le visiteur n'a
   * pas eu le temps de voir. La clé « boot » → « app » REMONTE
   * AnimatePresence à la première résolution d'une page ≠ accueil
   * : l'ancien contenu est démonté immédiatement, la page cible
   * monte aussitôt (initial={false} : pas d'animation d'entrée
   * non plus). Les navigations SUIVANTES gardent le comportement
   * normal — sortie PUIS entrée — car la clé ne change plus. */
  const routeResolue = useRef(false);
  if (pageKey !== "accueil") routeResolue.current = true;

  return (
    <AnimatePresence mode="wait" initial={false} key={routeResolue.current ? "app" : "boot"}>
      <motion.main
        key={pageKey}
        id="contenu-principal"
        className="flex flex-col"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Volet 7 : lève l'écran d'amorçage des liens profonds dès
            que la page demandée est réellement montée — voir
            NettoyageAmorcage en bas de fichier. */}
        {pageKey !== "accueil" && <NettoyageAmorcage />}
        {/* Attente discrète pendant le (rare) chargement d'un morceau :
            les morceaux sont préchargés à l'inactivité, la navigation
            normale reste instantanée.
            CLS (audit perf du 19/11, sonde diagnostic-cls-2026-11-19.js) :
            à 70vh, l'écran d'attente plaçait le pied de page PILE dans
            la zone visible (70vh + 270px de footer = 100vh) — or au
            chargement direct d'une page profonde, la hauteur du contenu
            oscille (écran d'attente SSR → contenu streamé → retour à
            l'écran d'attente pendant le lazy → page cible), et CHAQUE
            oscillation déplaçait le footer visible : CLS 0,9 mesuré
            (seuil Google 0,1). À 100svh+2px, le footer reste SOUS le
            pli pendant toute la séquence : plus rien de visible ne
            bouge, CLS 0. */}
        <Suspense
          fallback={
            <div className="flex min-h-[calc(100svh+2px)] items-center justify-center" aria-hidden="true">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#e4e4e4]/30 border-t-[#e4e4e4]" />
            </div>
          }
        >
          {content}
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );
}

function Shell() {
  const { page } = useRouter();

  // Préchargement des pages secondaires une fois le navigateur inactif
  // (après le rendu initial) — sans bloquer le chargement en cours.
  useEffect(() => {
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 2500) as unknown as number);
    const cancel =
      (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback ??
      ((id: number) => window.clearTimeout(id));
    const id = idle(() => {
      PREFETCH_PAGES.forEach((load) => {
        load().catch(() => undefined);
      });
    });
    return () => cancel(id);
  }, []);

  // L'espace administrateur se présente sans navigation publique
  if (page === "admin") {
    return (
      <div className="section-deep flex min-h-screen flex-col">
        {/* Volet 7 : l'écran d'amorçage des liens profonds concerne
            aussi #/admin — la branche publique (PageSwitch) n'étant
            pas rendue ici, la levée y est portée par ce clone. */}
        <NettoyageAmorcage />
        <AdminPage />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1c1c1c] text-white">
      <Header />
      {/* VOLET 14 (24/11/2026) — révélation de couleur à l'appui sur
          les écrans tactiles : monté UNE fois ici (la branche publique),
          il survit aux changements de page du routeur par fragment —
          ses écouteurs couvrent toutes les images de toutes les pages
          (voir le composant). Rend null : aucun nœud dans le DOM. */}
      <InteractionCouleurs />
      <PageSwitch />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <CalendlyProvider>
        {/* Défilement fluide à la sheragency (inertie douce de la
            molette) — composant « sans rendu » monté une seule fois. */}
        <SmoothScroll />
        <Shell />
        <Toaster />
      </CalendlyProvider>
    </RouterProvider>
  );
}

/* ---------- Levée de l'écran d'amorçage (volet 7) ----------
   Le script « boot-deep-route » (layout.tsx, beforeInteractive)
   détecte au chargement direct d'une page profonde que le HTML
   servi (celui de l'accueil — le serveur ne voit pas le fragment)
   n'est PAS la page demandée : il pose alors l'attribut
   data-boot="deep" sur <html> — le visuel (voile + spinner) est
   porté par les règles CSS statiques de globals.css, AUCUN nœud
   n'est inséré (React hydrate <html>/<body> : une insertion
   casserait l'hydratation à la racine — mesuré au volet 7).
   Ce composant retire l'attribut AU MOMENT où la page demandée
   est réellement montée — rendu UNIQUEMENT dans le main d'une page
   ≠ accueil (ou dans la branche admin) : au chargement direct, le
   main hydraté (accueil SSR) ne le contient pas, donc l'écran
   couvre sans interruption toute la séquence : SSR caché →
   résolution de route → page cible. Sans attribut data-boot
   (chargement normal de l'accueil ou navigation interne), il ne
   fait rien. */
function NettoyageAmorcage() {
  useEffect(() => {
    document.documentElement.removeAttribute("data-boot");
  }, []);
  return null;
}
