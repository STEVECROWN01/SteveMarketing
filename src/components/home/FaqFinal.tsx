"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { FAQ, FINAL_CTA } from "@/content/site-content";

/**
 * SECTION 12 — FAQ (fond sombre)
 * SECTION 13 — CONVERSION FINALE (fond profond, halo beige)
 */
export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-titre"
      className="section-dark scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading eyebrow={FAQ.eyebrow} title={FAQ.title} tone="dark" />
            <Reveal direction="up" delay={0.18}>
              <div className="mt-9 rounded-2xl bg-[#c9baac] p-6 sm:p-7">
                <p className="font-display text-base font-semibold leading-snug text-[#1c1c1c]">
                  Une question spécifique&nbsp;? Prenons 30 minutes pour en discuter.
                </p>
                <CTAButton
                  action={{ kind: "calendly" }}
                  variant="dark"
                  className="mt-5"
                  icon={CTAIcons.calendar}
                >
                  Réserver Un Appel
                </CTAButton>
                <p className="mt-4 text-xs font-medium text-[#1c1c1c]/70">
                  30 minutes · Gratuit · Sans engagement.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal direction="left" delay={0.1}>
            <Accordion type="single" collapsible className="flex flex-col gap-3.5">
              {FAQ.items.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`faq-${i}`}
                  className="rounded-xl border border-[#e4e4e4]/12 bg-[#232323] px-5 data-[state=open]:border-[#c9baac]/35"
                >
                  <AccordionTrigger className="py-5 text-left font-display text-[15px] font-medium text-white hover:text-[#c9baac] hover:no-underline sm:text-base">
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
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section
      id="contact-final"
      aria-labelledby="contact-final-titre"
      className="section-deep relative overflow-hidden py-24 sm:py-28 lg:py-36"
    >
      <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[880px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9baac] opacity-[0.08] blur-[140px]"
      />

      <div className="container-site relative text-center">
        <Reveal direction="up">
          <p className="text-eyebrow">{FINAL_CTA.eyebrow}</p>
        </Reveal>

        <Reveal direction="up" delay={0.08}>
          <h2 id="contact-final-titre" className="text-section-title mx-auto mt-5 max-w-4xl text-white">
            {FINAL_CTA.title}
          </h2>
        </Reveal>

        <Reveal direction="up" delay={0.14}>
          <div className="text-body mx-auto mt-6 max-w-2xl whitespace-pre-line on-dark-muted">
            {FINAL_CTA.text}
          </div>
        </Reveal>

        <Reveal direction="up" delay={0.2}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:flex-wrap">
            <CTAButton
              action={{ kind: "calendly" }}
              variant="primary"
              size="lg"
              icon={CTAIcons.calendar}
              ariaLabel="Réserver mon appel de 30 minutes — gratuit et sans engagement"
            >
              {FINAL_CTA.cta1}
            </CTAButton>
            <CTAButton
              action={{ kind: "page", page: "contact", section: "devis" }}
              variant="secondary"
              size="lg"
              icon={CTAIcons.quote}
            >
              {FINAL_CTA.cta2}
            </CTAButton>
            <CTAButton
              action={{ kind: "page", page: "contact", section: "audit" }}
              variant="ghostLight"
              size="lg"
              icon={CTAIcons.audit}
            >
              {FINAL_CTA.cta3}
            </CTAButton>
          </div>
        </Reveal>

        <Reveal direction="fade" delay={0.28}>
          <ReassuranceBar mention={FINAL_CTA.mention} className="mt-8 justify-center" />
        </Reveal>
      </div>
    </section>
  );
}
