"use client";

import React from "react";
import { Star } from "lucide-react";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";

/** Icône « coche pleine » — la même que la liste de bénéfices de la
 *  page Devis (cercle #e4e4e4, coche sombre) : les deux pages de
 *  conversion partagent ainsi leur langage visuel. */
function CheckOne({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 31 30" fill="none" className={className} aria-hidden="true">
      <circle cx="15.72" cy="15" r="13.75" fill="#e4e4e4" />
      <path
        d="M10.72 15l3.75 3.75 7.5-7.5"
        stroke="#070707"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * PAGE AUDIT GRATUIT (#/audit-gratuit) — monte ENFIN la variante
 * « audit » du formulaire, présente dans le code depuis l'origine
 * mais jusqu'ici rendue nulle part (découverte de l'audit des CTA,
 * 18/11/2026) : le bouton « Demander Mon Audit Gratuit » de la
 * section « Vous avez déjà un site ? » promettait un audit mais
 * menait au formulaire de CONTACT — message ne correspondant pas.
 *
 * La page miroir de la page Devis (même structure : eyebrow, titre
 * centré, sous-texte, trois bénéfices à cocher, badge 4,9/5,
 * formulaire, lien croisé vers la réservation d'appel) mais sur la
 * palette SOMBRE — le formulaire d'audit est une carte sombre
 * #232323, contrairement à la carte blanche du devis.
 *
 * Le formulaire d'audit demande précisément l'URL du site actuel
 * (champ obligatoire, « L'URL de votre site actuel est nécessaire
 * pour l'audit ») : la promesse du bouton est désormais tenue.
 */
const BENEFITS = [
  "Un regard professionnel et indépendant sur votre site",
  "Des points concrets à améliorer, expliqués simplement",
  "Entièrement gratuit, sans aucun engagement",
];

export function AuditPage() {
  return (
    <>
      <section
        aria-label="Demande d'audit gratuit de votre site web"
        className="section-deep bg-grid-dark relative overflow-hidden pb-20 pt-[128px] sm:pb-24 sm:pt-[150px] lg:pt-[160px]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[#e4e4e4] opacity-[0.07] blur-[110px]"
        />
        <div className="container-site relative">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal direction="up">
              <p className="text-eyebrow">DEMANDE D'AUDIT GRATUIT</p>
            </Reveal>

            <RevealText
              as="h1"
              text="Découvrez Pourquoi Votre Site Ne Vous Apporte Pas Assez De Clients."
              boldText="Pas Assez De Clients."
              delay={0.06}
              className="text-hero-title mt-5 text-white"
            />

            <Reveal direction="up" delay={0.14}>
              <p className="text-body mx-auto mt-6 max-w-2xl on-dark-muted">
                J'examine personnellement votre site actuel et je vous renvoie des
                observations claires : ce qui fonctionne déjà, ce qui freine vos
                visiteurs, et ce qu'il faut améliorer en priorité.
              </p>
            </Reveal>

            {/* Trois bénéfices à cocher — le même langage visuel que
                la page Devis, sur fond sombre. */}
            <Reveal direction="up" delay={0.18}>
              <ul className="mx-auto mt-8 flex w-fit flex-col items-start gap-3.5">
                {BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 text-left text-[16px] font-medium text-white"
                  >
                    <CheckOne className="h-[26px] w-[27px] shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Badge de note — la cinquième étoile à moitié remplie,
                comme les pages Devis et Contact. */}
            <Reveal direction="up" delay={0.22}>
              <p
                className="mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[13px] font-medium tracking-[0.02em] text-[#c8c8c8]"
                aria-label="Note moyenne de 4,9 sur 5"
              >
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
        </div>
      </section>

      {/* Formulaire d'audit — carte sombre #232323 posée sur le fond
          #1c1c1c (variante « audit » du LeadForm : l'URL du site
          actuel y est obligatoire). */}
      <section aria-label="Formulaire de demande d'audit" className="section-dark pb-24 pt-4 sm:pb-28">
        <div className="container-site">
          <Reveal direction="up" delay={0.26}>
            <div className="mx-auto max-w-[680px]">
              <LeadForm kind="audit" />
            </div>
          </Reveal>

          {/* Lien croisé — le pendant du lien de la page Devis :
              deux niveaux d'engagement, le visiteur choisit son
              seuil. */}
          <Reveal direction="up" delay={0.3}>
            <p className="mx-auto mt-8 max-w-xl text-center text-sm on-dark-muted">
              Vous préférez en parler de vive voix&nbsp;?{" "}
              <a
                href="#/reserver-un-appel"
                className="font-medium text-white underline decoration-[#e4e4e4]/50 decoration-2 underline-offset-[6px] transition-colors hover:decoration-[#e4e4e4]"
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
