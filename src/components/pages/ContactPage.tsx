"use client";

import React from "react";
import { Linkedin, Mail, MessageCircle, ArrowUpRight, Phone } from "lucide-react";
import { SectionHeading, CTAButton, CTAIcons, ReassuranceBar, PageHero } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";
import { CalendlyEmbed } from "@/components/calendly/CalendlyContext";
import { SITE } from "@/lib/site";

/**
 * PAGE CONTACT / DEMANDE DE PROJET
 * Trois canaux réels (email, LinkedIn, WhatsApp — numéro jamais
 * affiché en clair), Calendly inline (vraies disponibilités) et
 * les deux formulaires : devis personnalisé + audit gratuit.
 */
export function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="CONTACT · DEMANDE DE PROJET"
        title="Votre projet commence par une conversation."
        intro="Réservez un appel, demandez un devis personnalisé ou sollicitez un audit gratuit de votre site actuel. Sans engagement."
      >
        <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
          <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg" icon={CTAIcons.calendar}>
            Réserver Un Appel
          </CTAButton>
          <CTAButton action={{ kind: "anchor", sectionId: "devis" }} variant="ghostLight" size="lg" icon={CTAIcons.quote}>
            Demander Un Devis
          </CTAButton>
        </div>
        <ReassuranceBar className="mt-6" />
      </PageHero>

      {/* Canaux de contact */}
      <section aria-labelledby="canaux-titre" className="section-dark py-16 sm:py-20 lg:py-24">
        <div className="container-site">
          <SectionHeading
            eyebrow="TROIS FAÇONS DE ME JOINDRE"
            title="Choisissez le canal qui vous convient."
            tone="dark"
            align="center"
            className="mx-auto"
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
            <Reveal direction="up" delay={0.05} as="article">
              <a
                href={`mailto:${SITE.email}`}
                className="group flex h-full flex-col rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#e4e4e4]/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4e4e4]/12 text-[#e4e4e4]">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">Email</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#c8c8c8]">
                  Pour toute demande, question ou précision sur vos projets.
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium break-all text-[#e4e4e4]">
                  {SITE.email}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </p>
              </a>
            </Reveal>

            <Reveal direction="up" delay={0.1} as="article">
              <a
                href={SITE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#e4e4e4]/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4e4e4]/12 text-[#e4e4e4]">
                  <Linkedin className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">LinkedIn</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#c8c8c8]">
                  Pour découvrir mon univers professionnel et échanger en message privé.
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#e4e4e4]">
                  Stevens Akpovi
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </p>
              </a>
            </Reveal>

            <Reveal direction="up" delay={0.15} as="article">
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#e4e4e4]/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4e4e4]/12 text-[#e4e4e4]">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">WhatsApp</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#c8c8c8]">
                  Une conversation rapide, directement depuis votre téléphone.
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#e4e4e4]">
                  Écrire sur WhatsApp
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </p>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Calendly inline — vraies disponibilités */}
      <section id="appel" aria-labelledby="calendly-titre" className="bg-[#232323] py-16 sm:py-20 lg:py-24">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div>
              <SectionHeading
                eyebrow="APPEL STRATÉGIQUE · 30 MINUTES"
                title="Réservez votre créneau en une minute."
                tone="dark"
              />
              <Reveal direction="up" delay={0.15}>
                <p className="text-body mt-6 max-w-md on-dark-muted">
                  Les créneaux affichés ci-contre sont les vraies disponibilités du calendrier.
                  Choisissez simplement l'heure qui vous convient — l'appel se déroule en
                  visioconférence, à distance.
                </p>
              </Reveal>
              <Reveal direction="up" delay={0.2}>
                <div className="mt-7 flex items-start gap-3.5 rounded-2xl border border-[#e4e4e4]/25 bg-[#1c1c1c] px-6 py-5">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-[#e4e4e4]" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-[#d9d9d9]">
                    <strong className="font-medium text-white">{SITE.calendlyMention}</strong>{" "}
                    Vous recevez automatiquement le lien de visioconférence après réservation,
                    fourni par Calendly.
                  </p>
                </div>
              </Reveal>
              <Reveal direction="up" delay={0.25}>
                <ul className="mt-6 space-y-2.5 text-sm text-[#c8c8c8]">
                  <li className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e4e4e4]" aria-hidden="true" />
                    Parler de votre activité et de vos objectifs
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e4e4e4]" aria-hidden="true" />
                    Identifier la solution adaptée à votre besoin
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e4e4e4]" aria-hidden="true" />
                    Repartir avec des prochaines étapes claires
                  </li>
                </ul>
              </Reveal>
            </div>
            <Reveal direction="left" delay={0.1}>
              <div className="overflow-hidden rounded-2xl border border-[#e4e4e4]/12 bg-[#1c1c1c]">
                <CalendlyEmbed className="!h-[680px] sm:!h-[720px]" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Formulaire devis */}
      <section id="devis" aria-labelledby="devis-titre" className="section-dark scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                eyebrow="DEMANDE DE DEVIS PERSONNALISÉ"
                title="Parlons de votre futur site."
                tone="dark"
              />
              <Reveal direction="up" delay={0.15}>
                <p className="text-body mt-6 max-w-md on-dark-muted">
                  Décrivez votre activité et votre projet. Je reviens vers vous avec un devis
                  personnalisé, établi à partir de votre besoin — le montant dépend du type de
                  site, de son périmètre et de sa complexité.
                </p>
              </Reveal>
              <Reveal direction="up" delay={0.2}>
                <div className="mt-7 rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] px-6 py-5">
                  <p className="text-sm leading-relaxed text-[#c8c8c8]">
                    Vous préférez commencer par une conversation&nbsp;?{" "}
                    <button
                      type="button"
                      onClick={() => document.getElementById("appel")?.scrollIntoView({ behavior: "smooth" })}
                      className="font-medium text-[#e4e4e4] underline underline-offset-4"
                    >
                      Réservez l'appel de 30 minutes
                    </button>{" "}
                    — {SITE.calendlyMention.toLowerCase()}
                  </p>
                </div>
              </Reveal>
            </div>
            <Reveal direction="left" delay={0.1}>
              <LeadForm kind="quote" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Formulaire audit */}
      <section id="audit" aria-labelledby="audit-titre" className="section-deep scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                eyebrow="AUDIT GRATUIT · DÉJÀ UN SITE ?"
                title="Votre site actuel vous rapporte-t-il réellement quelque chose ?"
                tone="dark"
              />
              <Reveal direction="up" delay={0.15}>
                <p className="text-body mt-6 max-w-md on-dark-muted">
                  Indiquez l'adresse de votre site : je reviens vers vous avec les premières
                  observations concrètes — image, clarté des services, parcours de contact,
                  référencement de base. Un site web devrait être un véritable outil au service
                  de votre entreprise.
                </p>
              </Reveal>
              <Reveal direction="up" delay={0.2}>
                <div className="mt-7 rounded-2xl bg-[#e4e4e4] px-6 py-5">
                  <p className="text-sm font-medium leading-relaxed text-[#1c1c1c]">
                    L'audit est gratuit et sans engagement — comme l'appel.
                  </p>
                </div>
              </Reveal>
            </div>
            <Reveal direction="right" delay={0.1}>
              <LeadForm kind="audit" />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
