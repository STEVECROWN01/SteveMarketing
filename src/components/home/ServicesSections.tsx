"use client";

import React from "react";
import {
  Building2,
  LayoutGrid,
  MousePointerClick,
  ShoppingCart,
  RefreshCcw,
  Network,
  PenTool,
  Search,
  BadgeCheck,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons, RichText } from "@/components/marketing/Marketing";
import { SERVICES_SUMMARY, INCLUDED } from "@/content/site-content";
import { useRouter } from "@/components/router-context";

const SERVICE_ICONS = [Building2, LayoutGrid, MousePointerClick, ShoppingCart, RefreshCcw, Network];
const INCLUDED_ICONS = [PenTool, Search];

/**
 * SECTION 06 — DES SOLUTIONS ADAPTÉES À VOS OBJECTIFS (fond clair)
 *  Résumé à TROIS cartes (Site Web Professionnel, Page de vente,
 *  Refonte de Site Web) alignées sur une seule rangée — demande de
 *  l'éditeur (13/11/2026) ; la page Services conserve le détail
 *  complet des six offres.
 * SECTION 07 — AVANTAGES INCLUS (fond sombre)
 *  NB : la section « DÉVELOPPER VOTRE VISIBILITÉ » (services
 *  complémentaires) a été supprimée de l'accueil à la demande de
 *  l'éditeur (13/11/2026) — elle reste détaillée sur la page
 *  Services.
 */
export function ServicesSection() {
  const router = useRouter();
  return (
    <section
      id="services"
      aria-labelledby="services-titre"
      className="section-light bg-grid-light scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={SERVICES_SUMMARY.eyebrow} title={SERVICES_SUMMARY.title} tone="light" className="max-w-2xl" />
          <Reveal direction="up" delay={0.15}>
            <a
              href="#/services"
              onClick={(e) => {
                e.preventDefault();
                router.navigate("services");
              }}
              className="group inline-flex items-center gap-2 rounded-full border border-[#1c1c1c]/20 px-5 py-2.5 text-sm font-medium text-[#1c1c1c] transition-colors duration-300 hover:border-[#1c1c1c] hover:bg-[#1c1c1c] hover:text-white"
            >
              Explorer Le Détail Des Services
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </Reveal>
        </div>

        {/* Trois cartes — une seule rangée (bureau) */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:mt-14">
          {SERVICES_SUMMARY.items.map((service, i) => {
            const Icon = SERVICE_ICONS[i] ?? Building2;
            return (
              <Reveal key={service.title} direction="up" delay={i * 0.05} as="article">
                <div className="group flex h-full flex-col rounded-2xl border border-[#e4e4e4] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(28,28,28,0.3)] sm:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1c1c1c] text-[#e4e4e4] transition-colors duration-300 group-hover:bg-[#e4e4e4] group-hover:text-[#1c1c1c]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-[#1c1c1c]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#555555]">{service.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal direction="up" delay={0.15}>
          <div className="mt-12 sm:mt-14">
            <CTAButton
              action={{ kind: "page", page: "devis" }}
              variant="ghostDark"
              size="lg"
              icon={CTAIcons.quote}
            >
              {SERVICES_SUMMARY.cta}
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function IncludedSection() {
  return (
    <section
      id="avantages-inclus"
      aria-labelledby="inclus-titre"
      className="section-dark scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <SectionHeading eyebrow={INCLUDED.eyebrow} title={INCLUDED.title} tone="dark" align="center" className="mx-auto" />

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:mt-14 md:grid-cols-2">
          {INCLUDED.items.map((item, i) => {
            const Icon = INCLUDED_ICONS[i] ?? BadgeCheck;
            return (
              <Reveal key={item.title} direction={i === 0 ? "right" : "left"} delay={0.1 * i} as="article">
                <div className="flex h-full flex-col rounded-2xl border border-[#e4e4e4]/25 bg-[#232323] p-7 sm:p-8">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4e4e4] text-[#1c1c1c]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <RichText
                    text={item.text}
                    className="mt-5 text-[15px] leading-relaxed text-[#c8c8c8]"
                  />
                  <p className="mt-auto inline-flex items-center gap-2 pt-6 text-xs font-medium tracking-widest text-[#e4e4e4]">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    INCLUS SANS FRAIS SUPPLÉMENTAIRES
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal direction="up" delay={0.2}>
          <p className="mx-auto mt-10 max-w-2xl text-center font-display text-lg font-medium text-white sm:text-xl">
            {INCLUDED.conclusion}
          </p>
          <div className="mt-7 text-center">
            <CTAButton
              action={{ kind: "calendly" }}
              variant="primary"
              size="lg"
              icon={CTAIcons.calendar}
            >
              {INCLUDED.cta}
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
