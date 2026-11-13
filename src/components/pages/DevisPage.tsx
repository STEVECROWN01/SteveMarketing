"use client";

import React from "react";
import { Star } from "lucide-react";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";

/**
 * PAGE DEMANDER UN DEVIS (#/demander-un-devis) — présentation
 * calquée sur « /request-a-quote » de sheragency.com : page claire,
 * grand titre centré, sous-texte, trois pastilles de bénéfices,
 * badge de note 4,9/5, puis le formulaire de devis — reproduit
 * EXACTEMENT le widget « New Client Application » de la référence
 * (15/11/2026) : carte blanche à ombre douce, Prénom/Nom sur deux
 * colonnes, consentement SMS, questions à choix unique et bouton
 * vert « Obtenir Un Devis » pleine largeur. La section « Demande de
 * devis » qui vivait sur la page contact a été supprimée au profit
 * de cette page dédiée.
 */
const BENEFITS = [
  "Attirer des visiteurs qualifiés",
  "Convertir les visiteurs en clients",
  "Présenter votre activité avec professionnalisme",
];

export function DevisPage() {
  return (
    <>
      <section
        aria-label="Demande de devis personnalisé"
        className="section-bright relative overflow-hidden pb-20 pt-[128px] sm:pb-24 sm:pt-[150px] lg:pt-[160px]"
      >
        <div className="container-site">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal direction="up">
              <p className="text-eyebrow">DEMANDE DE DEVIS PERSONNALISÉ</p>
            </Reveal>

            <RevealText
              as="h1"
              text="Parlons de votre futur site."
              delay={0.06}
              className="text-hero-title on-paper mt-5"
            />

            <Reveal direction="up" delay={0.14}>
              <p className="text-body mx-auto mt-6 max-w-2xl on-paper-muted">
                Décrivez votre activité et votre projet. Je reviens vers vous avec un
                devis personnalisé, établi à partir de votre besoin — le montant dépend
                du type de site, de son périmètre et de sa complexité.
              </p>
            </Reveal>

            {/* Trois pastilles de bénéfices (façon sheragency) */}
            <Reveal direction="up" delay={0.18}>
              <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
                {BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="inline-flex items-center rounded-full border border-[#e4e4e4] bg-[#f5f5f5] px-4 py-2 text-[13px] font-medium text-[#1c1c1c]"
                  >
                    {benefit}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Badge de note — la cinquième étoile à moitié remplie */}
            <Reveal direction="up" delay={0.22}>
              <p
                className="mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[13px] font-medium tracking-[0.02em] text-[#525252]"
                aria-label="Note moyenne de 4,9 sur 5"
              >
                <span className="flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <Star key={i} fill="#1c1c1c" strokeWidth={0} className="h-4 w-4" />
                  ))}
                  <span className="relative inline-flex h-4 w-4 items-center justify-center">
                    <Star className="absolute h-4 w-4 text-[#c8c8c8]" strokeWidth={1.5} />
                    <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                      <Star fill="#1c1c1c" strokeWidth={0} className="h-4 w-4" />
                    </span>
                  </span>
                </span>
                <span>4,9/5</span>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Bande gris clair pleine largeur portant la carte du formulaire —
          comme le widget GoHighLevel de sheragency.com/request-a-quote :
          bande #f5f5f5, carte blanche à ombre douce flottant dedans. */}
      <section aria-label="Formulaire de demande de devis" className="section-light pb-24 pt-4 sm:pb-28">
        <div className="container-site">
          {/* Formulaire de devis — carte blanche façon sheragency
              (« New Client Application ») */}
          <Reveal direction="up" delay={0.26}>
            <div className="mx-auto max-w-[680px]">
              <LeadForm kind="quote" />
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.3}>
            <p className="mx-auto mt-8 max-w-xl text-center text-sm on-paper-muted">
              Vous préférez commencer par une conversation&nbsp;?{" "}
              <a
                href="#/reserver-un-appel"
                className="font-medium text-[#1c1c1c] underline underline-offset-4"
              >
                Réservez un appel de 30 minutes
              </a>{" "}
              — gratuit et sans engagement.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
