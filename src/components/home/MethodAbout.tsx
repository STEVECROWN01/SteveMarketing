"use client";

import React from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons, RichText } from "@/components/marketing/Marketing";
import { MonoImage } from "@/components/media/Media";
import { METHOD, ABOUT } from "@/content/site-content";
import { ASSETS } from "@/lib/site";

/**
 * SECTION 10 — MÉTHODE DE TRAVAIL (fond sombre, six étapes)
 * SECTION 11 — À PROPOS (fond clair)
 */
export function MethodSection() {
  return (
    <section
      id="methode"
      aria-labelledby="methode-titre"
      className="section-dark scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <SectionHeading eyebrow={METHOD.eyebrow} title={METHOD.title} tone="dark" align="center" className="mx-auto" />

        <ol className="relative mt-14 grid gap-5 sm:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {METHOD.steps.map((step, i) => (
            <Reveal key={step.name} direction="up" delay={i * 0.05} as="li">
              <div className="group relative h-full rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-7 transition-colors duration-300 hover:border-[#e4e4e4]/35 sm:p-8">
                <p className="text-eyebrow">Étape {String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-display text-xl font-semibold text-white">{step.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#c8c8c8]">{step.text}</p>
                <span
                  aria-hidden="true"
                  className="absolute right-6 top-6 font-display text-sm font-semibold text-[#e4e4e4]/50"
                >
                  {String(i + 1).padStart(2, "0")}/06
                </span>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal direction="up" delay={0.15}>
          <div className="mt-12 text-center">
            <CTAButton
              action={{ kind: "calendly" }}
              variant="primary"
              size="lg"
              icon={CTAIcons.calendar}
            >
              {METHOD.cta}
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section
      id="a-propos"
      aria-labelledby="a-propos-titre"
      className="section-light scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="grid gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 xl:gap-24">
          {/* Portrait (image principale) + aperçu mobile épinglé par-dessus,
              en bas, de façon oblique — demande de l'éditeur : espace
              entre les deux images quasi supprimé, seconde image plus
              grande pour être visible. */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:self-start">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rotate-[2deg] rounded-[2rem] bg-[#e4e4e4] opacity-[0.25]"
            />
            <Reveal direction="right">
              <MonoImage
                src={ASSETS.portrait}
                alt="Portrait professionnel de Stevens Akpovi, concepteur de sites web"
                width={1024}
                height={1536}
                className="relative rounded-2xl border border-[#e4e4e4] shadow-[0_30px_60px_-30px_rgba(28,28,28,0.4)]"
              />
            </Reveal>
            <Reveal direction="up" delay={0.2} className="absolute -bottom-10 -left-3 w-[58%] sm:-left-6 lg:-left-8">
              <MonoImage
                src={ASSETS.workspaceMobile}
                alt="Travail de conception web en mobilité — collaboration à distance"
                width={1280}
                height={853}
                className="rotate-[3deg] rounded-2xl border border-[#e4e4e4] bg-white shadow-[0_25px_50px_-20px_rgba(28,28,28,0.5)]"
              />
            </Reveal>
          </div>

          {/* Texte */}
          <div className="lg:pt-2">
            <SectionHeading eyebrow={ABOUT.eyebrow} title={ABOUT.title} tone="light" />
            <Reveal direction="up" delay={0.15}>
              <RichText text={ABOUT.text} className="text-body mt-6 max-w-xl on-paper-muted" />
            </Reveal>

            {/* Les trois blocs « Approche », « Inclus dans chaque projet » et
                « Mode de collaboration » ont été retirés à la demande de
                l'éditeur (13/11/2026) — les faits qu'ils résumaient restent
                présentés dans les sections dédiées de l'offre. */}

            <Reveal direction="up" delay={0.2}>
              <div className="mt-9">
                <CTAButton
                  action={{ kind: "calendly" }}
                  variant="ghostDark"
                  size="lg"
                  icon={CTAIcons.calendar}
                >
                  {ABOUT.cta}
                </CTAButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
