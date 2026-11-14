"use client";

import React from "react";
import { Linkedin, Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { ASSETS, NAV_ITEMS, SITE } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";

const NAV_PAGES: Record<string, string> = {
  accueil: "accueil",
  processus: "processus",
  services: "services",
  realisations: "realisations",
  aPropos: "a-propos",
  contact: "contact",
};

export function Footer() {
  const router = useRouter();

  return (
    <footer className="section-deep relative mt-auto overflow-hidden">
      {/* Fondu au sommet du pied de page (comme le fondu bas du hero,
          demande de l'éditeur, 15/11/2026) : la lueur circulante est
          remplacée par un dégradé statique — un voile blanc doux né
          sur la limite avec la section précédente (« IL EST TEMPS… »),
          qui s'estompe progressivement vers le bas, sans ligne dure
          ni animation. Pur décor, rogné par overflow-hidden. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#ffffff]/[0.08] to-transparent sm:h-14"
      />
      <div className="container-site relative py-16 lg:py-20">
        <Reveal direction="up" amount={0.15}>
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-8">
            {/* Marque — logo officiel (version blanche, pour fond sombre) */}
            <div className="max-w-sm">
              <img
                src={ASSETS.logoLight}
                alt="Stevens Akpovi"
                width={240}
                height={192}
                loading="lazy"
                className="h-12 w-auto"
              />
              <p className="mt-4 text-sm leading-relaxed text-[#c8c8c8]">
                Je crée des sites web qui génèrent des ventes. Conception de sites web
                professionnels orientés conversion — copywriting et optimisation SEO de base
                inclus.
              </p>
              <p className="mt-6 text-xs leading-relaxed text-[#c8c8c8]/70">
                Collaboration à distance, au-delà des frontières.
              </p>
            </div>

            {/* Navigation */}
            <nav aria-label="Navigation de pied de page">
              <p className="text-eyebrow">Navigation</p>
              <ul className="mt-5 space-y-3">
                {NAV_ITEMS.map((item) => (
                  <li key={item.key}>
                    <a
                      href={`#/${NAV_PAGES[item.key]}`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.navigate(item.key as never);
                      }}
                      className="inline-flex min-h-[24px] items-center text-sm text-[#c8c8c8] transition-colors hover:text-[#e4e4e4]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#/mentions-legales"
                    onClick={(e) => {
                      e.preventDefault();
                      router.navigate("legal");
                    }}
                    className="inline-flex min-h-[24px] items-center text-sm text-[#c8c8c8] transition-colors hover:text-[#e4e4e4]"
                  >
                    Mentions légales
                  </a>
                </li>
              </ul>
            </nav>

            {/* Contact */}
            <div>
              <p className="text-eyebrow">Contact</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="inline-flex min-h-[24px] items-center gap-2.5 text-sm text-[#c8c8c8] transition-colors hover:text-[#e4e4e4]"
                  >
                    <Mail className="h-4 w-4 text-[#e4e4e4]" aria-hidden="true" />
                    {SITE.email}
                  </a>
                </li>
                <li>
                  <a
                    href={SITE.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[24px] items-center gap-2.5 text-sm text-[#c8c8c8] transition-colors hover:text-[#e4e4e4]"
                  >
                    <Linkedin className="h-4 w-4 text-[#e4e4e4]" aria-hidden="true" />
                    LinkedIn
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href={SITE.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[24px] items-center gap-2.5 text-sm text-[#c8c8c8] transition-colors hover:text-[#e4e4e4]"
                  >
                    <MessageCircle className="h-4 w-4 text-[#e4e4e4]" aria-hidden="true" />
                    WhatsApp
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              </ul>
              <p className="mt-6 inline-flex rounded-full border border-[#e4e4e4]/30 bg-[#e4e4e4]/10 px-4 py-1.5 text-xs text-[#e4e4e4]">
                {SITE.calendlyMention}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[#e4e4e4]/10 pt-7 text-xs text-[#c8c8c8]/70 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Stevens Akpovi. Tous droits réservés.</p>
          <p>Conçu et développé avec Next.js — performance, accessibilité, conversion.</p>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
    </footer>
  );
}
