"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RouterProvider, useRouter } from "@/components/router-context";
import { CalendlyProvider } from "@/components/calendly/CalendlyContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePage } from "@/components/home/HomePage";
import { ServicesPage } from "@/components/pages/ServicesPage";
import { PortfolioPage } from "@/components/pages/PortfolioPage";
import { AboutPage } from "@/components/pages/AboutPage";
import { ContactPage } from "@/components/pages/ContactPage";
import { LegalPage } from "@/components/pages/LegalPage";
import { AdminPage } from "@/components/pages/AdminPage";
import { Toaster } from "@/components/ui/toaster";

/**
 * Coquille applicative : routeur de pages (URLs propres par
 * fragment dans la route unique visible), transitions de page
 * fluides, en-tête, pied de page et popup Calendly global.
 */

function PageSwitch() {
  const { page } = useRouter();
  const reduce = useReducedMotion();

  const content = (() => {
    switch (page) {
      case "services":
        return <ServicesPage />;
      case "realisations":
        return <PortfolioPage />;
      case "aPropos":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "legal":
        return <LegalPage />;
      case "admin":
        return <AdminPage />;
      default:
        return <HomePage />;
    }
  })();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={page}
        id="contenu-principal"
        className="flex flex-col"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {content}
      </motion.main>
    </AnimatePresence>
  );
}

function Shell() {
  const { page } = useRouter();

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
