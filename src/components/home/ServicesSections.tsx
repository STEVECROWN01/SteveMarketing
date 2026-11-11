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
  Megaphone,
  BadgeCheck,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons } from "@/components/marketing/Marketing";
import { SERVICES, INCLUDED, COMPLEMENTARY } from "@/content/site-content";
import { useRouter } from "@/components/router-context";

const SERVICE_ICONS = [Building2, LayoutGrid, MousePointerClick, ShoppingCart, RefreshCcw, Network];
const INCLUDED_ICONS = [PenTool, Search];
const COMPLEMENTARY_ICONS = [Megaphone, Search];

/**
 * SECTION 06 — SERVICES (fond clair)
 * SECTION 07 — AVANTAGES INCLUS (fond sombre)
 * SECTION 08 — SERVICES COMPLÉMENTAIRES (fond sombre relevé)
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
          <SectionHeading eyebrow={SERVICES.eyebrow} title={SERVICES.title} tone="light" className="max-w-2xl" />
          <Reveal direction="up" delay={0.15}>
            <a
              href="#/services"
              onClick={(e) => {
                e.preventDefault();
                router.navigate("services");
              }}
              className="group inline-flex items-center gap-2 rounded-full border border-[#1c1c1c]/20 px-5 py-2.5 text-sm font-medium text-[#1c1c1c] transition-colors duration-300 hover:border-[#1c1c1c] hover:bg-[#1c1c1c] hover:text-white"
            >
              Explorer le détail des services
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:mt-14">
          {SERVICES.items.map((service, i) => {
            const Icon = SERVICE_ICONS[i] ?? Building2;
            return (
              <Reveal key={service.title} direction="up" delay={i * 0.05} as="article">
                <div className="group flex h-full flex-col rounded-2xl border border-[#e4e4e4] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(28,28,28,0.3)] sm:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1c1c1c] text-[#c9baac] transition-colors duration-300 group-hover:bg-[#c9baac] group-hover:text-[#1c1c1c]">
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
              action={{ kind: "page", page: "contact", section: "devis" }}
              variant="ghostDark"
              size="lg"
              icon={CTAIcons.quote}
            >
              {SERVICES.cta}
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
                <div className="flex h-full flex-col rounded-2xl border border-[#c9baac]/25 bg-[#232323] p-7 sm:p-8">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c9baac] text-[#1c1c1c]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-[#c8c8c8]">
                    {item.text}
                  </p>
                  <p className="mt-auto inline-flex items-center gap-2 pt-6 text-xs font-medium tracking-widest text-[#c9baac]">
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

export function ComplementarySection() {
  return (
    <section
      id="services-complementaires"
      aria-labelledby="complementaires-titre"
      className="bg-[#232323] scroll-mt-20 py-20 text-white sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading eyebrow={COMPLEMENTARY.eyebrow} title={COMPLEMENTARY.title} tone="dark" />
            <Reveal direction="up" delay={0.18}>
              <div className="mt-9">
                <CTAButton
                  action={{ kind: "page", page: "contact", section: "devis" }}
                  variant="secondary"
                  size="lg"
                  icon={CTAIcons.quote}
                >
                  {COMPLEMENTARY.cta}
                </CTAButton>
              </div>
            </Reveal>
          </div>

          <ul className="flex flex-col gap-5">
            {COMPLEMENTARY.items.map((item, i) => {
              const Icon = COMPLEMENTARY_ICONS[i] ?? Megaphone;
              return (
                <Reveal key={item.title} direction="left" delay={0.1 * i} as="li">
                  <div className="group rounded-2xl border border-[#e4e4e4]/12 bg-[#1c1c1c] p-7 transition-colors duration-300 hover:border-[#c9baac]/35 sm:p-9">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9baac]/12 text-[#c9baac]">
                        <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                      </span>
                      <span className="text-eyebrow">Prestation complémentaire</span>
                    </div>
                    <h3 className="mt-6 font-display text-xl font-semibold text-white sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-3.5 text-[15px] leading-relaxed text-[#c8c8c8]">{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
