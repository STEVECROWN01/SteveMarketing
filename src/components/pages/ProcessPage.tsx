"use client";

import React, { useState } from "react";
import { Plus, Minus, ArrowUpRight, Building2, ShoppingCart, RefreshCcw } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { useCalendly } from "@/components/calendly/CalendlyContext";
import { PageHero, CTAButton, RichText } from "@/components/marketing/Marketing";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { StartProjectButton } from "@/components/marketing/StartProjectButton";
import { SERVICES_SUMMARY, SOLUTION } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";

const SERVICE_ICONS = [Building2, ShoppingCart, RefreshCcw];

/**
 * PAGE MÉTHODE (ex « Mon Process », renommée à la demande de
 * l'éditeur, 15/11/2026) — elle remplace aussi l'ancienne page
 * Services (supprimée) : les trois cadres de l'offre y sont
 * reproduits. Structure voulue par l'éditeur :
 * 1. en-tête : titre « Processus : des sites web pensés pour
 *    convertir » puis bouton « Réserver Un Appel » (pastille flèche
 *    ↗ à l'intérieur droite, comme le header) ;
 * 2. section à deux colonnes : les trois cadres de l'offre (site web
 *    professionnel, page de vente, refonte) empilés à gauche ; à
 *    droite, le titre « Voici comment nous créons des sites web qui
 *    génèrent des ventes. » et le bouton « Demander Un Devis » ;
 * 3. section « MON PROCESSUS » : titre écrit verticalement (du bas
 *    vers le haut) à gauche, trait vertical de séparation à
 *    extrémités fondues, et à droite les six déroulés à accordéon
 *    « + »/« − » ;
 * 4. l'appel à l'action « Franchissons ensemble la première étape. »
 *    (conservé) ;
 * 5. puis la section réalisations : titre « Sites web que nous avons
 *    créés. » + bouton « Voir Plus De Projets » à gauche, la liste
 *    des trois réalisations à droite.
 */
export function ProcessPage() {
  const router = useRouter();
  const calendly = useCalendly();
  // Une seule étape ouverte à la fois — la première par défaut,
  // comme le déroulé de lecture de la section d'accueil.
  const [open, setOpen] = useState<number | null>(0);

  const goProject = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    router.navigate("projet", id);
  };

  return (
    <>
      {/* ---------- 1. En-tête de page : titre + « Réserver Un Appel » ---------- */}
      <PageHero
        eyebrow="MÉTHODE · COMMENT JE TRAVAILLE"
        title="Processus : des sites web pensés pour convertir"
      >
        {/* Bouton blanc style header (pastille flèche ↗ à l'intérieur
            droite) — ouvre la réservation d'appel Calendly, comme le
            libellé l'annonce. */}
        <StartProjectButton
          label="Réserver Un Appel"
          ariaLabel="Réserver un appel stratégique de 30 minutes avec Stevens Akpovi"
          onClick={() => calendly.openCalendly()}
          className="min-h-[52px]"
        />
      </PageHero>

      {/* ---------- 2. Les trois cadres de l'offre + titre/bouton ---------- */}
      <section
        aria-label="Offre : site web professionnel, page de vente et refonte de site web"
        className="section-light bg-grid-light py-20 sm:py-24 lg:py-32"
      >
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20">
            {/* Colonne gauche : les trois cadres actuels de l'offre
                (ex-page Services), reproduits en colonne — les mêmes
                cartes que la section « DES SOLUTIONS ADAPTÉES À VOS
                OBJECTIFS » de l'accueil (demande de l'éditeur). */}
            <div className="flex flex-col gap-4">
              {SERVICES_SUMMARY.items.map((service, i) => {
                const Icon = SERVICE_ICONS[i] ?? Building2;
                return (
                  <Reveal key={service.title} direction="up" delay={i * 0.05} as="article">
                    <div className="group flex h-full flex-col gap-4 rounded-2xl border border-[#e4e4e4] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(28,28,28,0.3)] sm:flex-row sm:items-start sm:gap-5 sm:p-7">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1c1c1c] text-[#e4e4e4] transition-colors duration-300 group-hover:bg-[#e4e4e4] group-hover:text-[#1c1c1c]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-lg font-semibold text-[#1c1c1c]">
                            {service.title}
                          </h3>
                          <span className="font-display text-sm font-semibold text-[#525252]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="mt-2.5 text-sm leading-relaxed text-[#555555]">
                          {service.text}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Colonne droite : titre + bouton « Demander Un Devis ». */}
            <div className="flex flex-col justify-center lg:py-4">
              <Reveal direction="left">
                <p className="text-eyebrow">DES SITES WEB QUI VENDENT</p>
              </Reveal>
              <RevealText
                as="h2"
                text="Voici comment nous créons des sites web qui génèrent des ventes."
                delay={0.08}
                className="text-section-title mt-4 max-w-xl text-[#1c1c1c]"
              />
              <Reveal direction="up" delay={0.16}>
                <p className="text-body mt-5 max-w-xl text-[#555555]">
                  Chaque projet suit la même exigence : comprendre votre activité, concevoir un
                  parcours clair et amener vos visiteurs à passer à l'action.
                </p>
                <div className="mt-8">
                  <CTAButton
                    action={{ kind: "page", page: "devis" }}
                    variant="ghostDark"
                    size="lg"
                  >
                    Demander Un Devis
                  </CTAButton>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 3. « MON PROCESSUS » : titre vertical + déroulés ----------
          À gauche, le titre écrit verticalement, du bas vers le haut,
          suivi d'un trait vertical de séparation à extrémités fondues
          (fondu haut et bas, comme tous les traits du site) ; à droite
          du trait, les six déroulés du processus. Sur mobile : titre
          horizontal, trait de séparation horizontal fondu, déroulés. */}
      <section
        aria-labelledby="methode-processus-titre"
        className="section-dark relative py-20 sm:py-24 lg:py-32"
      >
        {/* Barre de séparation à extrémités fondues — comme toutes les
            barres de séparation du site. */}
        <div aria-hidden="true" className="separator-fade absolute inset-x-0 top-0" />
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-14 xl:gap-20">
            {/* Titre vertical (bureau) — du bas vers le haut */}
            <div className="hidden items-stretch gap-7 py-1 lg:flex">
              <h2
                id="methode-processus-titre"
                className="font-display text-[15px] font-semibold uppercase tracking-[0.35em] text-white [writing-mode:vertical-rl] rotate-180"
              >
                Mon processus
              </h2>
              {/* Trait vertical de séparation — fondu en haut et en bas */}
              <div
                aria-hidden="true"
                className="w-px bg-gradient-to-b from-transparent via-[#e4e4e4]/40 to-transparent"
              />
            </div>

            {/* Titre horizontal (mobile/tablette) + trait fondu */}
            <div className="lg:hidden">
              <h2 id="methode-processus-titre" className="text-section-title text-white">
                Mon processus
              </h2>
              <div aria-hidden="true" className="separator-fade mt-6" />
            </div>

            {/* Les six étapes à accordéon « + »/« − » — mêmes cartes que
                la section « Comment ça fonctionne ? » de l'accueil. */}
            <ol className="mx-auto flex w-full max-w-3xl flex-col gap-4">
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
        </div>
      </section>

      {/* ---------- 4. Appel à l'action « Franchissons ensemble… » (conservé) ---------- */}
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
              <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg">
                Réserver Un Appel
              </CTAButton>
              <CTAButton action={{ kind: "page", page: "devis" }} variant="secondary" size="lg">
                Demander Un Devis Personnalisé
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- 5. Réalisations : titre + « Voir Plus De Projets » à
          gauche, liste des trois réalisations à droite (demande de
          l'éditeur, 15/11/2026 — le bouton mène au portfolio, « Nos
          Réalisations »). ---------- */}
      <section
        aria-label="Sites web que nous avons créés — nos réalisations"
        className="section-bright py-20 sm:py-24 lg:py-32"
      >
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 xl:gap-20">
            {/* Colonne gauche : titre + bouton */}
            <div>
              <Reveal direction="up">
                <p className="text-eyebrow">NOS RÉALISATIONS</p>
              </Reveal>
              <RevealText
                as="h2"
                text="Sites web que nous avons créés."
                delay={0.08}
                className="text-section-title mt-4 max-w-md text-[#1c1c1c]"
              />
              <Reveal direction="up" delay={0.16}>
                <div className="mt-8">
                  <CTAButton
                    action={{ kind: "page", page: "realisations" }}
                    variant="dark"
                    size="lg"
                  >
                    Voir Plus De Projets
                  </CTAButton>
                </div>
              </Reveal>
            </div>

            {/* Colonne droite : la liste des trois réalisations */}
            <div>
              {PROJECTS.map((project, i) => (
                <div key={project.id}>
                  {i > 0 && <div aria-hidden="true" className="separator-fade" />}
                  <Reveal direction="left" delay={0.08 * i}>
                    <a
                      href={`#/projet/${project.id}`}
                      onClick={(e) => goProject(e, project.id)}
                      aria-label={`Voir Le Projet — ${project.name}`}
                      className="group flex items-center justify-between gap-6 py-6 focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      <div className="min-w-0">
                        <p className="text-eyebrow">Projet {String(i + 1).padStart(2, "0")}</p>
                        <h3 className="relative mt-2 inline-block text-card-title text-[#1c1c1c] after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:bg-[#1c1c1c] after:transition-all after:duration-300 group-hover:after:left-0 group-hover:after:w-full">
                          {project.name}
                        </h3>
                        <p className="mt-1 text-sm text-[#525252]">{project.category}</p>
                      </div>
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e4e4e4] text-[#1c1c1c] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                      >
                        <ArrowUpRight className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                    </a>
                  </Reveal>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
