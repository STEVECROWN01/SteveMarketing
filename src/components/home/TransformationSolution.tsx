"use client";

import React from "react";
import { Clock, TrendingUp, Users, Home, RefreshCw } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons, RichText } from "@/components/marketing/Marketing";
import { MonoImage } from "@/components/media/Media";
import { TRANSFORMATION, SOLUTION } from "@/content/site-content";
import { ASSETS } from "@/lib/site";

const BENEFIT_ICONS = [Clock, TrendingUp, Users, Home, RefreshCw];

/**
 * SECTION 04 — LA TRANSFORMATION (fond sombre)
 * SECTION 05 — MA SOLUTION (fond sombre, trois piliers)
 */
export function TransformationSection() {
  return (
    <section
      id="transformation"
      aria-labelledby="transformation-titre"
      className="section-dark scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 xl:gap-24">
          {/* Visuel */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:order-2">
            <div
              aria-hidden="true"
              className="absolute -inset-3 -rotate-[2.5deg] rounded-[2rem] bg-[#c9baac] opacity-[0.12]"
            />
            <Reveal direction="right">
              <MonoImage
                src={ASSETS.benefitGrowth}
                alt="Illustration : croissance de l'activité grâce à une présence professionnelle en ligne"
                width={1280}
                height={853}
                className="relative rounded-2xl border border-[#e4e4e4]/12 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)]"
              />
            </Reveal>
          </div>

          {/* Texte */}
          <div className="lg:order-1">
            <SectionHeading eyebrow={TRANSFORMATION.eyebrow} title={TRANSFORMATION.title} tone="dark" />
            <Reveal direction="up" delay={0.15}>
              <RichText text={TRANSFORMATION.text} className="text-body mt-6 max-w-xl on-dark-muted" />
            </Reveal>
          </div>
        </div>

        {/* Bénéfices */}
        <div className="mt-16 sm:mt-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TRANSFORMATION.benefits.map((benefit, i) => {
              const Icon = BENEFIT_ICONS[i] ?? TrendingUp;
              return (
                <Reveal key={benefit.title} direction="up" delay={i * 0.06} as="article">
                  <div className="group h-full rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#c9baac]/35">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c9baac]/12 text-[#c9baac]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-base font-semibold text-white">
                      {benefit.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#c8c8c8]">{benefit.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal direction="up" delay={0.15}>
            <div className="mt-12">
              <CTAButton
                action={{ kind: "page", page: "contact", section: "devis" }}
                variant="primary"
                size="lg"
                icon={CTAIcons.quote}
              >
                {TRANSFORMATION.cta}
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function SolutionSection() {
  return (
    <section
      id="solution"
      aria-labelledby="solution-titre"
      className="section-dark border-t border-[#e4e4e4]/10 scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow={SOLUTION.eyebrow} title={SOLUTION.title} tone="dark" />
            <Reveal direction="up" delay={0.15}>
              <RichText text={SOLUTION.text} className="text-body mt-6 max-w-xl on-dark-muted" />
            </Reveal>
            <Reveal direction="up" delay={0.2}>
              <div className="mt-9 rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-2">
                <MonoImage
                  src={ASSETS.strategyWork}
                  alt="Illustration : travail de stratégie et de conception web orientés conversion"
                  width={1280}
                  height={853}
                  className="rounded-xl"
                />
              </div>
            </Reveal>
          </div>

          {/* Trois piliers */}
          <div className="flex flex-col gap-5 lg:pt-4">
            {SOLUTION.pillars.map((pillar, i) => (
              <Reveal key={pillar.name} direction="left" delay={0.1 + i * 0.08} as="article">
                <div className="group relative overflow-hidden rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-7 transition-colors duration-300 hover:border-[#c9baac]/35 sm:p-8">
                  <span
                    aria-hidden="true"
                    className="font-display absolute -right-2 -top-5 select-none text-[7rem] font-bold leading-none text-[#c9baac]/10 transition-colors duration-300 group-hover:text-[#c9baac]/16"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-eyebrow">Pilier {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                    {pillar.name}
                  </h3>
                  <p className="relative mt-3 max-w-md text-[15px] leading-relaxed text-[#c8c8c8]">
                    {pillar.text}
                  </p>
                </div>
              </Reveal>
            ))}

            <Reveal direction="up" delay={0.35}>
              <div className="rounded-2xl bg-[#c9baac] p-7 sm:p-8">
                <p className="font-display text-lg font-semibold leading-snug text-[#1c1c1c] sm:text-xl">
                  Comprendre votre activité avant de concevoir votre site.
                </p>
                <CTAButton
                  action={{ kind: "calendly" }}
                  variant="dark"
                  className="mt-5"
                  icon={CTAIcons.calendar}
                >
                  {SOLUTION.cta}
                </CTAButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
