"use client";

import React from "react";
import { Star } from "lucide-react";
import { CTAButton, CTAIcons } from "@/components/marketing/Marketing";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "@/components/router-context";
import { SITE } from "@/lib/site";

/**
 * PAGE CONTACT — présentation calquée sur « /contact-us » de
 * sheragency.com (demande de l'éditeur, 13/11/2026) :
 * fond sombre + deux orbes lumineux ; à gauche le grand titre
 * « Contact » et le bouton blanc « Demander Un Devis » (vers la page
 * dédiée) ; à droite trois accordéons puis « Laissez-moi un
 * message » et le formulaire — refait EXACTEMENT comme le widget
 * « Website Contact Form » de la référence (15/11/2026) : libellés
 * blancs, rangées deux colonnes, entrées blanches, bouton pilule
 * blanche demi-largeur « Entrer En Contact ». Le formulaire
 * transmet automatiquement les informations à
 * stevensakpovi@gmail.com puis dirige vers la page dédiée à la
 * réservation d'appel (#/reserver-un-appel).
 */
export function ContactPage() {
  const router = useRouter();

  const goDevis = (e?: React.MouseEvent) => {
    e?.preventDefault();
    router.navigate("devis");
  };

  return (
    <section
      aria-label="Page contact"
      className="section-dark relative overflow-hidden pb-24 pt-[128px] sm:pb-28 sm:pt-[150px] lg:pb-32 lg:pt-[170px]"
    >
      {/* Orbes lumineux discrets (style sheragency) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 -top-44 h-[560px] w-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(228,228,228,0.13), transparent 65%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 -right-48 h-[640px] w-[640px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(228,228,228,0.09), transparent 65%)" }}
      />

      <div className="container-site relative">
        <div className="grid gap-14 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16 xl:gap-24">
          {/* ---------- Colonne gauche : titre + bouton devis ---------- */}
          <div className="lg:pt-3">
            <Reveal direction="up">
              <p className="text-eyebrow">CONTACT</p>
            </Reveal>
            <RevealText
              as="h1"
              text="Contact"
              delay={0.06}
              className="font-display mt-5 text-[clamp(2.6rem,6vw,4.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white"
            />
            <Reveal direction="up" delay={0.14}>
              <p className="text-body mt-6 max-w-md on-dark-muted">
                Une question, un projet, une idée&nbsp;? Laissez-moi un message — je
                réponds personnellement à chaque demande.
              </p>
            </Reveal>
            <Reveal direction="up" delay={0.2}>
              <div className="mt-9">
                <CTAButton
                  action={{ kind: "page", page: "devis" }}
                  variant="secondary"
                  size="lg"
                  icon={CTAIcons.quote}
                >
                  Demander Un Devis
                </CTAButton>
              </div>
            </Reveal>
            <Reveal direction="up" delay={0.26}>
              <p className="mt-8 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-medium tracking-[0.02em] text-[#c8c8c8]" aria-label="Note moyenne de 4,9 sur 5">
                <span className="flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <Star key={i} fill="#e4e4e4" strokeWidth={0} className="h-4 w-4" />
                  ))}
                  <span className="relative inline-flex h-4 w-4 items-center justify-center">
                    <Star className="absolute h-4 w-4 text-[#525252]" strokeWidth={1.5} />
                    <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                      <Star fill="#e4e4e4" strokeWidth={0} className="h-4 w-4" />
                    </span>
                  </span>
                </span>
                <span>4,9/5</span>
              </p>
            </Reveal>
          </div>

          {/* ---------- Colonne droite : accordéons + formulaire ---------- */}
          <div>
            <Reveal direction="up" delay={0.1}>
              <Accordion type="single" collapsible className="flex flex-col gap-4">
                <AccordionItem
                  value="clients-existants"
                  className="rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] px-6 sm:px-7 data-[state=open]:border-[#e4e4e4]/35"
                >
                  <AccordionTrigger className="py-6 text-left font-display text-xl font-medium text-white hover:text-[#e4e4e4] hover:no-underline sm:text-2xl">
                    Clients existants
                  </AccordionTrigger>
                  <AccordionContent className="pb-7 text-[15px] leading-relaxed text-[#c8c8c8]">
                    <p>
                      Pour toute question, suivi ou précision sur un projet en cours,
                      écrivez-moi directement à{" "}
                      <a
                        href={`mailto:${SITE.email}`}
                        className="font-medium text-[#e4e4e4] underline underline-offset-4"
                      >
                        {SITE.email}
                      </a>{" "}
                      — je réponds personnellement à chaque message.
                    </p>
                    <p className="mt-3">
                      Vous pouvez aussi m'écrire sur{" "}
                      <a
                        href={SITE.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#e4e4e4] underline underline-offset-4"
                      >
                        LinkedIn
                      </a>{" "}
                      ou{" "}
                      <a
                        href={SITE.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#e4e4e4] underline underline-offset-4"
                      >
                        WhatsApp
                      </a>
                      .
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="nouveaux-clients"
                  className="rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] px-6 sm:px-7 data-[state=open]:border-[#e4e4e4]/35"
                >
                  <AccordionTrigger className="py-6 text-left font-display text-xl font-medium text-white hover:text-[#e4e4e4] hover:no-underline sm:text-2xl">
                    Nouveaux clients
                  </AccordionTrigger>
                  <AccordionContent className="pb-7 text-[15px] leading-relaxed text-[#c8c8c8]">
                    <p>
                      La première étape est de parler de votre projet. Vous pouvez{" "}
                      <button
                        type="button"
                        onClick={goDevis}
                        className="font-medium text-[#e4e4e4] underline underline-offset-4"
                      >
                        demander un devis personnalisé
                      </button>
                      , ou{" "}
                      <button
                        type="button"
                        onClick={() => router.navigate("appel")}
                        className="font-medium text-[#e4e4e4] underline underline-offset-4"
                      >
                        réserver un appel stratégique de 30 minutes
                      </button>{" "}
                      — {SITE.calendlyMention.toLowerCase()}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="deja-un-site"
                  className="rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] px-6 sm:px-7 data-[state=open]:border-[#e4e4e4]/35"
                >
                  <AccordionTrigger className="py-6 text-left font-display text-xl font-medium text-white hover:text-[#e4e4e4] hover:no-underline sm:text-2xl">
                    Vous avez déjà un site&nbsp;?
                  </AccordionTrigger>
                  <AccordionContent className="pb-7 text-[15px] leading-relaxed text-[#c8c8c8]">
                    <p>
                      Décrivez-moi votre site actuel et vos objectifs dans le
                      formulaire ci-dessous&nbsp;: je vous ferai part de mes premières
                      observations concrètes — image, clarté des services, parcours de
                      contact et référencement de base.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Reveal>

            <RevealText
              as="h2"
              text="Laissez-moi un message"
              delay={0.05}
              className="text-section-title mt-14 text-white"
            />

            <Reveal direction="up" delay={0.12}>
              <p className="text-body mt-6 max-w-xl on-dark-muted">
                Décrivez votre besoin en quelques lignes. Votre message est transmis
                automatiquement à {SITE.email} — et après l'envoi, réservez directement
                votre créneau d'appel.
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.16}>
              <div className="mt-9 max-w-[720px]">
                <LeadForm kind="contact" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
