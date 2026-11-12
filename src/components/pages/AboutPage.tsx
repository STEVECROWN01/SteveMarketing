"use client";

import React from "react";
import { PageHero, SectionHeading, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { MonoImage } from "@/components/media/Media";
import { ABOUT, SOLUTION, METHOD, FAQ } from "@/content/site-content";
import { ASSETS, SITE } from "@/lib/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** PAGE À PROPOS — contenu du document éditorial (section 11). */
export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="QUI SUIS-JE ? · CONCEPTEUR DE SITES WEB"
        title={ABOUT.title}
        intro="Concepteur de sites web professionnels orientés conversion. Stratégie, design et parcours de décision — au service de votre activité."
      >
        <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
          <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg" icon={CTAIcons.calendar}>
            {ABOUT.cta}
          </CTAButton>
          <CTAButton action={{ kind: "page", page: "contact" }} variant="ghostLight" size="lg" icon={CTAIcons.quote}>
            Me contacter
          </CTAButton>
        </div>
        <ReassuranceBar className="mt-6" />
      </PageHero>

      {/* Portrait + texte intégral */}
      <section aria-labelledby="a-propos-texte" className="section-light py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 xl:gap-20">
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div aria-hidden="true" className="absolute -inset-3 rotate-[2deg] rounded-[2rem] bg-[#c9baac] opacity-25" />
              <Reveal direction="right">
                <MonoImage
                  src={ASSETS.portrait}
                  alt="Portrait professionnel de Stevens Akpovi, concepteur de sites web professionnels"
                  width={1024}
                  height={1536}
                  className="relative rounded-2xl border border-[#e4e4e4] shadow-[0_30px_60px_-30px_rgba(28,28,28,0.4)]"
                />
              </Reveal>
              <Reveal direction="up" delay={0.2} className="absolute -bottom-8 -right-2 hidden w-[52%] sm:block lg:-right-6">
                <MonoImage
                  src={ASSETS.strategyWork}
                  alt="Illustration du travail de stratégie web de Stevens Akpovi"
                  width={1280}
                  height={853}
                  className="rounded-2xl border border-[#e4e4e4] shadow-[0_25px_50px_-25px_rgba(28,28,28,0.45)]"
                />
              </Reveal>
            </div>

            <div>
              <SectionHeading eyebrow={ABOUT.eyebrow} title="Une conviction simple." tone="light" />
              <Reveal direction="up" delay={0.12}>
                <div className="text-body mt-6 max-w-xl whitespace-pre-line on-paper-muted">
                  {ABOUT.text}
                </div>
              </Reveal>
              <Reveal direction="up" delay={0.18}>
                <dl className="mt-9 grid gap-3 sm:grid-cols-3">
                  {ABOUT.facts.map((fact) => (
                    <div key={fact.label} className="rounded-xl border border-[#e4e4e4] bg-white px-4 py-4">
                      <dt className="text-[11px] font-semibold tracking-widest text-[#525252] uppercase">
                        {fact.label}
                      </dt>
                      <dd className="mt-1.5 text-sm font-medium text-[#1c1c1c]">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
              <Reveal direction="up" delay={0.24}>
                <div className="mt-9 rounded-2xl bg-[#1c1c1c] px-6 py-6 sm:px-8 sm:py-7">
                  <p className="font-display text-lg font-medium leading-relaxed text-white sm:text-xl">
                    {ABOUT.cta} — 30 minutes suffisent pour commencer.
                  </p>
                  <div className="mt-5">
                    <CTAButton action={{ kind: "calendly" }} variant="primary" icon={CTAIcons.calendar}>
                      Réserver un appel
                    </CTAButton>
                  </div>
                  <p className="mt-4 text-xs text-[#c8c8c8]">{SITE.calendlyMention}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Trois piliers (rappel de l'approche) */}
      <section aria-labelledby="a-propos-piliers" className="section-dark py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading eyebrow="MON APPROCHE" title={SOLUTION.title} tone="dark" align="center" className="mx-auto" />
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {SOLUTION.pillars.map((pillar, i) => (
              <Reveal key={pillar.name} direction="up" delay={i * 0.08} as="article">
                <div className="h-full rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-7">
                  <p className="text-eyebrow">Pilier {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-3 font-display text-xl font-semibold text-white">{pillar.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#c8c8c8]">{pillar.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Méthode (rappel) */}
      <section aria-labelledby="a-propos-methode" className="section-light py-20 sm:py-24 lg:py-28">
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

      {/* FAQ (extraits pertinents) */}
      <section aria-labelledby="a-propos-faq" className="section-dark py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading eyebrow="QUESTIONS FRÉQUENTES" title={FAQ.title} tone="dark" />
          <Reveal direction="up" delay={0.1}>
            <Accordion type="single" collapsible className="mt-10 flex max-w-3xl flex-col gap-3.5">
              {FAQ.items.slice(0, 4).map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`about-faq-${i}`}
                  className="rounded-xl border border-[#e4e4e4]/12 bg-[#232323] px-5 data-[state=open]:border-[#c9baac]/35"
                >
                  <AccordionTrigger className="py-5 text-left font-display text-[15px] font-medium text-white hover:text-[#c9baac] hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-[#c8c8c8]">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>
    </>
  );
}
