"use client";

import React from "react";
import { Building2, LayoutGrid, MousePointerClick, ShoppingCart, RefreshCcw, Network, PenTool, Search, Megaphone, Check } from "lucide-react";
import { PageHero, SectionHeading, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { SERVICES, INCLUDED, COMPLEMENTARY, METHOD, FAQ } from "@/content/site-content";

const SERVICE_ICONS = [Building2, LayoutGrid, MousePointerClick, ShoppingCart, RefreshCcw, Network];
const INCLUDED_ICONS = [PenTool, Search];
const COMPLEMENTARY_ICONS = [Megaphone, Search];

/** PAGE SERVICES — présentation détaillée de l'offre. */
export function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="SERVICES · CONCEPTION WEB ORIENTÉE CONVERSION"
        title="Des sites web pensés pour votre activité, vos clients et vos objectifs."
        intro="Sites vitrines, sites multipages, landing pages, pages de vente, refontes et systèmes d'acquisition client — avec copywriting professionnel et optimisation SEO de base inclus dans chaque projet."
      >
        <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
          <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg" icon={CTAIcons.calendar}>
            Réserver Un Appel
          </CTAButton>
          <CTAButton action={{ kind: "page", page: "contact", section: "devis" }} variant="ghostLight" size="lg" icon={CTAIcons.quote}>
            Demander Un Devis Personnalisé
          </CTAButton>
        </div>
        <ReassuranceBar className="mt-6" />
      </PageHero>

      {/* Services principaux */}
      <section aria-labelledby="services-detail-titre" className="section-light bg-grid-light py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading eyebrow={SERVICES.eyebrow} title={SERVICES.title} tone="light" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.items.map((service, i) => {
              const Icon = SERVICE_ICONS[i] ?? Building2;
              return (
                <Reveal key={service.title} direction="up" delay={i * 0.05} as="article">
                  <div className="group flex h-full flex-col rounded-2xl border border-[#e4e4e4] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(28,28,28,0.3)]">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1c1c1c] text-[#c9baac] transition-colors duration-300 group-hover:bg-[#c9baac] group-hover:text-[#1c1c1c]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-sm font-semibold text-[#525252]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold text-[#1c1c1c]">{service.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#555555]">{service.text}</p>
                    <div className="mt-auto pt-5">
                      <CTAButton
                        action={{ kind: "page", page: "contact", section: "devis" }}
                        variant="ghostDark"
                        className="px-4 py-2 text-[13px]"
                        ariaLabel={`Demander un devis pour : ${service.title}`}
                      >
                        Demander Un Devis
                      </CTAButton>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Avantages inclus */}
      <section aria-labelledby="services-inclus-titre" className="section-dark py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading eyebrow={INCLUDED.eyebrow} title={INCLUDED.title} tone="dark" />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {INCLUDED.items.map((item, i) => {
              const Icon = INCLUDED_ICONS[i] ?? Check;
              return (
                <Reveal key={item.title} direction={i === 0 ? "right" : "left"} delay={0.1 * i} as="article">
                  <div className="h-full rounded-2xl border border-[#c9baac]/25 bg-[#232323] p-7 sm:p-8">
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c9baac] text-[#1c1c1c]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                    </div>
                    <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-[#c8c8c8]">{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal direction="up" delay={0.15}>
            <p className="mt-9 font-display text-lg font-medium text-white sm:text-xl">{INCLUDED.conclusion}</p>
          </Reveal>
        </div>
      </section>

      {/* Services complémentaires */}
      <section aria-labelledby="services-comp-titre" className="bg-[#232323] py-20 text-white sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading
            eyebrow="SERVICES COMPLÉMENTAIRES · VISIBILITÉ"
            title={COMPLEMENTARY.title}
            tone="dark"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {COMPLEMENTARY.items.map((item, i) => {
              const Icon = COMPLEMENTARY_ICONS[i] ?? Megaphone;
              return (
                <Reveal key={item.title} direction="up" delay={i * 0.08} as="article">
                  <div className="h-full rounded-2xl border border-[#e4e4e4]/12 bg-[#1c1c1c] p-7 sm:p-8">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9baac]/12 text-[#c9baac]">
                      <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 font-display text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#c8c8c8]">{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal direction="up" delay={0.15}>
            <div className="mt-10 rounded-2xl bg-[#c9baac] p-7 sm:p-8">
              <p className="font-display text-lg font-semibold leading-snug text-[#1c1c1c] sm:text-xl">
                Discuter de ma stratégie digitale
              </p>
              <CTAButton action={{ kind: "page", page: "contact", section: "devis" }} variant="dark" className="mt-5" icon={CTAIcons.quote}>
                Discuter De Ma Stratégie Digitale
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Méthode (rappel) */}
      <section aria-labelledby="services-methode-titre" className="section-light py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading eyebrow={METHOD.eyebrow} title={METHOD.title} tone="light" />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METHOD.steps.map((step, i) => (
              <Reveal key={step.name} direction="up" delay={i * 0.05} as="li">
                <div className="h-full rounded-2xl border border-[#e4e4e4] bg-white p-6 sm:p-7">
                  <p className="text-[11px] font-semibold tracking-widest text-[#525252] uppercase">
                    Étape {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[#1c1c1c]">{step.name}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#555555]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Conversion */}
      <section aria-labelledby="services-cta-titre" className="section-deep relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="container-site relative text-center">
          <Reveal direction="up">
            <p className="text-eyebrow">PARLONS DE VOTRE PROJET</p>
            <h2 className="text-section-title mx-auto mt-4 max-w-2xl text-white">
              Trouver la solution adaptée à mon activité
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.12}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg" icon={CTAIcons.calendar}>
                Réserver Un Appel
              </CTAButton>
              <CTAButton action={{ kind: "page", page: "contact", section: "devis" }} variant="secondary" size="lg" icon={CTAIcons.quote}>
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
