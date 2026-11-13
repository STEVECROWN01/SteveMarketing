"use client";

import React from "react";
import { Phone } from "lucide-react";
import { SectionHeading } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { CalendlyEmbed } from "@/components/calendly/CalendlyContext";
import { SITE } from "@/lib/site";

/**
 * PAGE RÉSERVATION D'APPEL (#/reserver-un-appel) — la section
 * « APPEL STRATÉGIQUE · 30 MINUTES » qui vivait sur la page contact y
 * est présentée TELLE QUELLE (demande de l'éditeur, 13/11/2026) :
 * à gauche l'en-tête, la description, l'encart téléphonie et les trois
 * points de l'échange ; à droite l'embed Calendly avec les VRAIES
 * disponibilités du calendrier. On y arrive notamment après l'envoi
 * du formulaire de contact.
 */
export function CallBookingPage() {
  return (
    <section
      id="appel"
      aria-labelledby="calendly-titre"
      className="bg-[#232323] pb-20 pt-[124px] sm:pb-24 sm:pt-[150px] lg:pb-24 lg:pt-[160px]"
    >
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
                Les créneaux affichés ci-contre sont les vraies disponibilités du
                calendrier. Choisissez simplement l'heure qui vous convient — l'appel
                se déroule en visioconférence, à distance.
              </p>
            </Reveal>
            <Reveal direction="up" delay={0.2}>
              <div className="mt-7 flex items-start gap-3.5 rounded-2xl border border-[#e4e4e4]/25 bg-[#1c1c1c] px-6 py-5">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-[#e4e4e4]" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-[#d9d9d9]">
                  <strong className="font-medium text-white">{SITE.calendlyMention}</strong>{" "}
                  Vous recevez automatiquement le lien de visioconférence après
                  réservation, fourni par Calendly.
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
  );
}
