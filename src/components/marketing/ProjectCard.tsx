"use client";

import React from "react";
import { BrowserMockup, PhoneMockup, DirectionalIcon } from "@/components/media/Media";
import { Reveal } from "@/components/motion/Reveal";
import type { PROJECTS } from "@/lib/site";

/**
 * Carte de réalisation — tout le bloc est cliquable et s'ouvre
 * dans un nouvel onglet. Aperçus desktop + mobile, monochrome par
 * défaut sur desktop, retour aux couleurs au survol, icône
 * directionnelle au survol. Aucune donnée inventée.
 */

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  cta: string;
  url: string;
  desktop: string;
  mobile: string;
}

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Reveal direction="up" delay={index * 0.06} as="article">
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.cta} — ${project.name} (nouvel onglet)`}
        className="group media-group block"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-4 transition-all duration-500 hover:border-[#c9baac]/40 hover:bg-[#2f2f2f] sm:p-6 lg:p-7">
          {/* Zone mockups */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <BrowserMockup
                src={project.desktop}
                alt={`Aperçu desktop du site ${project.name}`}
                url={project.url}
                width={1440}
                height={900}
              />
            </div>
            <div className="hidden w-[26%] shrink-0 sm:block lg:w-[22%]">
              <PhoneMockup
                src={project.mobile}
                alt={`Aperçu mobile du site ${project.name}`}
                width={390}
                height={844}
              />
            </div>
          </div>

          {/* Informations */}
          <div className="mt-6 flex items-end justify-between gap-5 sm:mt-7">
            <div className="min-w-0">
              <p className="text-eyebrow">Projet {String(index + 1).padStart(2, "0")}</p>
              <h3 className="text-card-title mt-2 text-white">{project.name}</h3>
              <p className="mt-1 text-sm text-[#c9baac]">{project.category}</p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#c8c8c8]">
                {project.description}
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white">
                <span className="transition-colors duration-300 group-hover:text-[#c9baac]">
                  {project.cta}
                </span>
                <span aria-hidden="true" className="text-[#c9baac]">↗</span>
              </p>
            </div>
            <DirectionalIcon className="hidden shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex" />
          </div>
        </div>
      </a>
    </Reveal>
  );
}

/** Variante complète pour la page Réalisations — carte entièrement cliquable. */
export function ProjectDetail({ project, index }: { project: Project; index: number }) {
  return (
    <Reveal direction="up" delay={0.05} as="article" className="scroll-mt-28">
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.cta} — ${project.name} (nouvel onglet)`}
        className="group media-group block rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-5 transition-all duration-500 hover:border-[#c9baac]/40 hover:bg-[#2f2f2f] sm:p-7 lg:p-9"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <div className="min-w-0 flex-1">
            <BrowserMockup
              src={project.desktop}
              alt={`Aperçu desktop du site ${project.name}`}
              url={project.url}
              width={1440}
              height={900}
            />
          </div>
          <div className="w-full shrink-0 sm:w-1/3 lg:w-[24%]">
            <PhoneMockup
              src={project.mobile}
              alt={`Aperçu mobile du site ${project.name}`}
              width={390}
              height={844}
            />
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-eyebrow">Projet {String(index + 1).padStart(2, "0")}</p>
            <h3 className="text-card-title mt-2 text-white">{project.name}</h3>
            <p className="mt-1 text-sm text-[#c9baac]">{project.category}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#c8c8c8]">{project.description}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white">
              <span className="transition-colors duration-300 group-hover:text-[#c9baac]">
                {project.cta}
              </span>
              <span aria-hidden="true" className="text-[#c9baac]">↗</span>
            </p>
          </div>
          <DirectionalIcon className="hidden shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex" />
        </div>
      </a>
    </Reveal>
  );
}
