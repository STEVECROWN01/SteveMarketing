"use client";

import React, { Suspense, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RouterProvider, useRouter } from "@/components/router-context";
import { CalendlyProvider } from "@/components/calendly/CalendlyContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePage } from "@/components/home/HomePage";
import { Toaster } from "@/components/ui/toaster";
import { PROJECTS } from "@/lib/site";

/**
 * Coquille applicative : routeur de pages (URLs propres par
 * fragment dans la route unique visible), transitions de page
 * fluides, en-tête, pied de page et popup Calendly global.
 *
 * PERFORMANCE (15/11/2026 — « le site est trop lent ») : seule la
 * page d'accueil est dans le paquet JavaScript initial. Toutes les
 * autres pages (services, réalisations, projet, à propos, contact,
 * devis, appel, mentions, admin) sont découpées en morceaux chargés
 * à la demande (React.lazy) — puis PRÉCHARGÉES dès que le navigateur
 * est inactif : la première visite n'emporte plus le code des pages
 * non consultées, et les navigations restent instantanées.
 */

/* Pages secondaires — morceaux séparés, préchargés à l'inactivité. */
const ServicesPage = React.lazy(() =>
  import("@/components/pages/ServicesPage").then((m) => ({ default: m.ServicesPage })),
);
const ProcessPage = React.lazy(() =>
  import("@/components/pages/ProcessPage").then((m) => ({ default: m.ProcessPage })),
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
  () => import("@/components/pages/ServicesPage"),
  () => import("@/components/pages/PortfolioPage"),
  () => import("@/components/pages/ProjectPage"),
  () => import("@/components/pages/AboutPage"),
  () => import("@/components/pages/ContactPage"),
  () => import("@/components/pages/DevisPage"),
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
      case "services":
        return <ServicesPage />;
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

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pageKey}
        id="contenu-principal"
        className="flex flex-col"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Attente discrète pendant le (rare) chargement d'un morceau :
            les morceaux sont préchargés à l'inactivité, la navigation
            normale reste instantanée. */}
        <Suspense
          fallback={
            <div className="flex min-h-[70vh] items-center justify-center" aria-hidden="true">
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
        <AdminPage />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1c1c1c] text-white">
      <Header />
      <PageSwitch />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <CalendlyProvider>
        <Shell />
        <Toaster />
      </CalendlyProvider>
    </RouterProvider>
  );
}
