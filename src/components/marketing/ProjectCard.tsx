"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { Reveal } from "@/components/motion/Reveal";
import { MonoImage, DirectionalIcon } from "@/components/media/Media";

/**
 * Carte de réalisation — présentation calquée sur la section
 * « Websites We Created » de sheragency.com : grande capture du
 * site, nom du projet, bouton « Voir Le Projet ». La carte entière
 * et le bouton mènent à la page de présentation du projet
 * (route #/projet/<id>), comme les fiches de la référence.
 */

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  cta: string;
  url: string;
  desktop: string;
  desktop2x: string;
  mobile: string;
  mobile2x: string;
}

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const router = useRouter();

  const goProject = (e: React.MouseEvent) => {
    e.preventDefault();
    router.navigate("projet", project.id);
  };

  return (
    <Reveal direction="up" delay={index * 0.06} as="article" className="h-full">
      <a
        href={`#/projet/${project.id}`}
        onClick={goProject}
        aria-label={`Voir Le Projet — ${project.name}`}
        className="group media-group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e4e4e4] bg-white transition-all duration-300 hover:border-[#1c1c1c]/25 hover:shadow-[0_30px_60px_-35px_rgba(28,28,28,0.35)]"
      >
        {/* Capture du site — COUVRE LA CARTE de gauche à droite et
            au top (demande de l'éditeur, 16/11/2026) : plein cadre,
            sans marge ni arrondi propre (la carte rogne les coins
            hauts). Sur bureau : noir et blanc au repos, la couleur
            se révèle + zoom léger au survol de la carte ; sur
            tablette et mobile : couleur d'origine directe. */}
        <MonoImage
          src={project.desktop}
          src2x={project.desktop2x}
          alt={`Aperçu du site ${project.name}`}
          width={1440}
          height={900}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 400px"
          src2xWidth={1920}
          className="border-b border-[#e4e4e4]"
        />

        {/* Nom du projet + bouton — seuls ces contenus gardent les
            marges intérieures de la carte. */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-eyebrow">Projet {String(index + 1).padStart(2, "0")}</p>
              <h3 className="text-card-title mt-2 text-[#1c1c1c]">{project.name}</h3>
              <p className="mt-1 text-sm text-[#525252]">{project.category}</p>
            </div>
            <DirectionalIcon className="hidden shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex" />
          </div>

          {/* Bouton « Voir Le Projet » — même style que le bouton
              blanc du hero. */}
          <div className="mt-auto pt-6">
            <span
              aria-hidden="true"
              className="group/btn btn-fill inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full border border-[#e4e4e4] bg-white px-6 py-3.5 text-sm font-medium tracking-[0.01em] text-[#1c1c1c] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#c9baac] [&::before]:bg-[#e4e4e4]"
            >
              Voir Le Projet
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"
              />
            </span>
          </div>
        </div>
      </a>
    </Reveal>
  );
}
