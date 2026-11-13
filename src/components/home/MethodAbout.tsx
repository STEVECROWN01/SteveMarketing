"use client";

import React from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons, RichText } from "@/components/marketing/Marketing";
import { MonoImage } from "@/components/media/Media";
import { ABOUT } from "@/content/site-content";
import { ASSETS } from "@/lib/site";

/**
 * SECTION 10 — QUI SUIS-JE ? (fond clair)
 *  NB : la section « COMMENT NOUS ALLONS TRAVAILLER ENSEMBLE » a été
 *  supprimée de l'accueil à la demande de l'éditeur (13/11/2026) —
 *  le processus est désormais présenté par « COMMENT ÇA FONCTIONNE ? »
 *  (voir TransformationSolution.tsx).
 */
export function AboutSection() {
  return (
    <section
      id="a-propos"
      aria-labelledby="a-propos-titre"
      className="section-light scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="grid gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 xl:gap-24">
          {/* Portrait (image principale) + image épinglée par-dessus,
              en bas, de façon oblique — demande de l'éditeur : espace
              entre les deux images quasi supprimé, seconde image
              ENCORE plus grande (72 % de la largeur, 13/11/2026) ;
              14/11/2026 : l'image épinglée est désormais
              stevens-akpovi-workspace.webp (fournie par l'éditeur). */}
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
            <Reveal direction="up" delay={0.2} className="absolute -bottom-12 -left-3 w-[72%] sm:-left-6 lg:-left-8">
              <MonoImage
                src={ASSETS.workspace}
                alt="Espace de travail de Stevens Akpovi — conception web en situation réelle"
                width={1536}
                height={1024}
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
