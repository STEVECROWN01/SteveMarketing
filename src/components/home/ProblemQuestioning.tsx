"use client";

import React from "react";
import { XCircle, HelpCircle } from "lucide-react";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons, RichText } from "@/components/marketing/Marketing";
import { MonoImage } from "@/components/media/Media";
import { PROBLEM, QUESTIONING } from "@/content/site-content";
import { ASSETS } from "@/lib/site";

/**
 * SECTION 02 — LE PROBLÈME (fond sombre)
 * SECTION 03 — REMISE EN QUESTION (fond clair)
 */
export function ProblemSection() {
  return (
    <section id="probleme" aria-labelledby="probleme-titre" className="section-dark scroll-mt-20 py-20 sm:py-24 lg:py-32">
      <div className="container-site">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-24">
          <div>
            <SectionHeading
              eyebrow={PROBLEM.eyebrow}
              title={PROBLEM.title}
              tone="dark"
            />
            <Reveal direction="up" delay={0.15}>
              <RichText text={PROBLEM.text} className="text-body mt-6 max-w-xl on-dark-muted" />
            </Reveal>

            <Reveal direction="up" delay={0.2}>
              <ul className="mt-9 grid gap-3 sm:grid-cols-2">
                {PROBLEM.pains.map((pain) => (
                  <li
                    key={pain}
                    className="flex items-start gap-3 rounded-xl border border-[#e4e4e4]/12 bg-[#232323] px-4 py-3.5 text-sm leading-relaxed text-[#d9d9d9]"
                  >
                    <XCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#e4e4e4]" aria-hidden="true" />
                    {pain}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

            {/* Visuel : image principale « problème » + seconde
                illustration épinglée PAR-DESSUS, en bas, de façon
                oblique — agrandie encore davantage (74 % de la largeur,
                demande de l'éditeur, 13/11/2026) — et exclusivement
                en noir et blanc (mono verrouillé, aucune couleur au
                survol). */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:self-start">
            <Reveal direction="left" delay={0.1}>
              <MonoImage
                src={ASSETS.problemNoWebsite}
                alt="Illustration : professionnel sans site web, dépendant des réseaux sociaux"
                width={900}
                height={1350}
                className="rounded-2xl border border-[#e4e4e4]/12 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)]"
              />
            </Reveal>
            <Reveal direction="right" delay={0.25} className="absolute -bottom-12 -right-3 w-[74%] sm:-right-6 lg:-right-8">
              <MonoImage
                src={ASSETS.problemIneffective}
                alt="Illustration : site web inefficace qui n'apporte pas de résultats"
                width={1280}
                height={853}
                className="mono-locked rotate-[3deg] rounded-2xl border border-[#e4e4e4]/15 bg-[#1c1c1c] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.8)]"
              />
            </Reveal>
          </div>
        </div>

        <Reveal direction="up" delay={0.1}>
          <div className="mt-20 max-w-3xl rounded-2xl border-l-2 border-[#e4e4e4] bg-[#232323]/60 px-6 py-6 sm:px-8 sm:py-7">
            <p className="font-display text-lg font-medium leading-relaxed text-white sm:text-xl">
              {PROBLEM.conclusion}
            </p>
            <CTAButton
              action={{ kind: "page", page: "devis" }}
              variant="primary"
              className="mt-6"
              icon={CTAIcons.quote}
            >
              {PROBLEM.cta}
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 03 — REMISE EN QUESTION (fond clair)
 *  Contenus de gauche RESTAURÉS à leur place (demande de l'éditeur,
 *  14/11/2026 : la réorganisation des six bandes en deux colonnes ×
 *  trois rangées avait été faite, mais le bloc-titre « VOUS AVEZ
 *  DÉJÀ UN SITE ? » + le texte descriptif — qui se trouvaient à
 *  GAUCHE, les bandes de questions à DROITE — avaient été supprimés
 *  par erreur). Désormais : titre + texte à gauche, six bandes en
 *  deux colonnes × trois rangées à droite, puis le bloc conclusion
 *  + CTA. */
export function QuestioningSection() {
  return (
    <section
      id="remise-en-question"
      aria-label="Questions à vous poser sur votre site web"
      className="section-light bg-grid-light scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 xl:gap-20">
          {/* Contenus de gauche — restaurés (eyebrow, titre, texte) */}
          <div>
            <SectionHeading
              eyebrow={QUESTIONING.eyebrow}
              title={QUESTIONING.title}
              tone="light"
            />
            <Reveal direction="up" delay={0.15}>
              <RichText text={QUESTIONING.text} className="text-body mt-6 max-w-xl on-paper-muted" />
            </Reveal>
          </div>

          {/* Bandes de questions à droite — deux colonnes, trois rangées */}
          <ul className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
            {QUESTIONING.questions.map((q, i) => (
              <Reveal key={q} direction="left" delay={0.08 * (i % 3) + 0.04 * Math.floor(i / 3)} as="li">
                <div className="flex h-full items-start gap-4 rounded-xl border border-[#e4e4e4] bg-white px-5 py-4.5 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(28,28,28,0.25)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e4e4e4]/20 text-[#1c1c1c]">
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="text-[15px] font-medium leading-relaxed text-[#1c1c1c]">{q}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal direction="up" delay={0.2}>
          <div className="mt-12 max-w-3xl rounded-2xl bg-[#1c1c1c] px-6 py-7 sm:px-8">
            <p className="font-display text-lg font-medium leading-relaxed text-white sm:text-xl">
              {QUESTIONING.conclusion}
            </p>
            <CTAButton
              action={{ kind: "page", page: "contact" }}
              variant="primary"
              className="mt-6"
              icon={CTAIcons.audit}
            >
              {QUESTIONING.cta}
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
