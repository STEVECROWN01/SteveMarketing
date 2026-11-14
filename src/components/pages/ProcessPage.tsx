"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { PageHero, SectionHeading, CTAButton, CTAIcons, ReassuranceBar, RichText } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { StartProjectButton } from "@/components/marketing/StartProjectButton";
import { SOLUTION } from "@/content/site-content";

/**
 * PAGE PROCESS — présentation dédiée du processus de collaboration,
 * calquée sur la section « Comment ça fonctionne ? » de la page
 * d'accueil (demande de l'éditeur, 15/11/2026) : mêmes six étapes,
 * mêmes cartes à accordéon « + »/« − », numéros stylisés en angle
 * supérieur gauche. La page ajoute un en-tête de page (PageHero) et
 * un appel à l'action final.
 */
export function ProcessPage() {
  const router = useRouter();
  // Une seule étape ouverte à la fois — la première par défaut,
  // comme le déroulé de lecture de la section d'accueil.
  const [open, setOpen] = useState<number | null>(0);

  const goToDevis = () => router.navigate("devis");

  return (
    <>
      {/* ---------- En-tête de page ---------- */}
      <PageHero
        eyebrow="PROCESS · COMMENT ÇA FONCTIONNE ?"
        title={SOLUTION.title}
        intro={SOLUTION.text}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* Bouton blanc « Démarrons Votre Projet » — exactement comme
              celui de la section d'accueil (style header, pastille ↗) ;
              mène à la page de demande de devis. */}
          <StartProjectButton label={SOLUTION.cta1} onClick={goToDevis} className="min-h-[52px]" />
          {/* Bouton noir « Voir Nos Travaux » — mène aux réalisations. */}
          <CTAButton action={{ kind: "page", page: "realisations" }} variant="dark" size="lg">
            {SOLUTION.cta2}
          </CTAButton>
        </div>
        <ReassuranceBar className="mt-6" />
      </PageHero>

      {/* ---------- Les six étapes à accordéon « + »/« − » ----------
          Mêmes cartes que la section « Comment ça fonctionne ? » de
          l'accueil : numéro stylisé en angle supérieur gauche, bascule
          « + »/« − » à droite, panneau à hauteur animée. */}
      <section
        aria-labelledby="process-etapes-titre"
        className="section-dark relative py-20 sm:py-24 lg:py-32"
      >
        {/* Barre de séparation à extrémités fondues — fade-in à
            gauche, fade-out à droite, comme toutes les barres de
            séparation du site (demande de l'éditeur, 15/11/2026) ;
            remplace l'ancienne bordure pleine. */}
        <div aria-hidden="true" className="separator-fade absolute inset-x-0 top-0" />
        <div className="container-site">
          <SectionHeading
            eyebrow="LES ÉTAPES"
            title="De l'échange initial à la génération de trafic."
            tone="dark"
          />
          <ol className="mx-auto mt-12 flex max-w-3xl flex-col gap-4">
            {SOLUTION.steps.map((step, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={step.name} direction="left" delay={0.06 * i} as="li">
                  <div
                    className={`relative overflow-hidden rounded-2xl border bg-[#232323] transition-colors duration-300 ${
                      isOpen ? "border-[#e4e4e4]/35" : "border-[#e4e4e4]/12"
                    }`}
                  >
                    {/* Numérotation stylisée — angle supérieur gauche */}
                    <span
                      aria-hidden="true"
                      className="font-display pointer-events-none absolute -left-2 -top-6 select-none text-[5.5rem] font-bold leading-none text-[#e4e4e4]/10"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`process-etape-panneau-${i}`}
                      id={`process-etape-bouton-${i}`}
                      className="relative flex w-full items-center justify-between gap-4 px-6 py-6 text-left focus-visible:outline-2 focus-visible:outline-offset-4 sm:px-8"
                    >
                      <span className="font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                        {step.name}
                      </span>
                      {/* Bascule « + »/« − » à droite de la carte */}
                      <span
                        aria-hidden="true"
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                          isOpen
                            ? "border-[#e4e4e4] bg-[#e4e4e4] text-[#1c1c1c]"
                            : "border-[#e4e4e4]/25 text-[#e4e4e4]"
                        }`}
                      >
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>

                    {/* Panneau : hauteur animée via grid-template-rows */}
                    <div
                      id={`process-etape-panneau-${i}`}
                      role="region"
                      aria-labelledby={`process-etape-bouton-${i}`}
                      className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-7 sm:px-8">
                          <RichText
                            text={step.text}
                            className="max-w-xl text-[15px] leading-relaxed text-[#c8c8c8]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---------- Appel à l'action final ---------- */}
      <section aria-labelledby="process-cta-titre" className="section-deep relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="container-site relative text-center">
          <Reveal direction="up">
            <p className="text-eyebrow">PARLONS DE VOTRE PROJET</p>
            <h2 id="process-cta-titre" className="text-section-title mx-auto mt-4 max-w-2xl text-white">
              Franchissons ensemble la première étape.
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.12}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg" icon={CTAIcons.calendar}>
                Réserver Un Appel
              </CTAButton>
              <CTAButton action={{ kind: "page", page: "devis" }} variant="secondary" size="lg" icon={CTAIcons.quote}>
                Demander Un Devis Personnalisé
              </CTAButton>
            </div>
            <ReassuranceBar className="mt-7 justify-center" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
