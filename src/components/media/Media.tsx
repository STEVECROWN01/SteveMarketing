import React from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Composants média :
 * - MonoImage : image avec comportement monochrome → couleur au
 *   survol (desktop), couleur directe sur mobile, zoom léger,
 *   aucune déformation (object-fit + ratio fixe), lazy loading,
 *   texte alternatif descriptif obligatoire.
 * - BrowserMockup / PhoneMockup : présentation des aperçus réels
 *   des sites sous forme de mockups professionnels.
 */

interface MonoImageProps {
  src: string;
  /** Variante haute densité (dérivé @2x régénéré en vrais pixels
   *  Retina) — le navigateur la choisit sur écrans 2x/3x, où une
   *  source 1x serait agrandie et donc floue (netteté des mockups
   *  et captures, demande de l'éditeur, 14/11/2026). */
  src2x?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  decorative?: boolean;
}

export function MonoImage({
  src,
  src2x,
  alt,
  width,
  height,
  className = "",
  imgClassName = "",
  eager = false,
  decorative = false,
}: MonoImageProps) {
  return (
    <span className={`mono-media block ${className}`}>
      <img
        src={src}
        srcSet={src2x ? `${src} 1x, ${src2x} 2x` : undefined}
        alt={decorative ? "" : alt}
        aria-hidden={decorative ? "true" : undefined}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : "auto"}
        className={`block h-full w-full object-cover ${imgClassName}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      />
    </span>
  );
}

/** Mockup navigateur (aperçu desktop des réalisations).
 *  Arrondi volontairement discret (rounded-md) et barre chrome fine :
 *  le contenu du site capturé doit rester pleinement lisible, y compris
 *  à petite échelle dans le hero (demande de l'éditeur, 14/11/2026). */
export function BrowserMockup({
  src,
  src2x,
  alt,
  url,
  className = "",
  width = 1440,
  height = 900,
  priority = false,
  forceMono = false,
}: {
  src: string;
  /** Variante haute densité @2x (voir MonoImage). */
  src2x?: string;
  alt: string;
  url: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Noir et blanc PERMANENT sur tous les écrans (mobile comprise) —
   *  aucune couleur au survol : mockups du hero (demande de
   *  l'éditeur, 13/11/2026). */
  forceMono?: boolean;
}) {
  const shortUrl = url.replace(/^https?:\/\//, "");
  return (
    <figure className={`group/mockup overflow-hidden rounded-md border border-[#e4e4e4]/25 bg-[#232323] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ${className}`}>
      <figcaption className="flex items-center gap-2 border-b border-[#e4e4e4]/12 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-[#3c3c3c]" />
          <span className="h-2 w-2 rounded-full bg-[#3c3c3c]" />
          <span className="h-2 w-2 rounded-full bg-[#3c3c3c]" />
        </span>
        <span className="mx-auto flex max-w-[70%] items-center gap-1.5 truncate rounded-md bg-[#1c1c1c] px-2 py-0.5 text-[9px] text-[#c8c8c8] sm:text-[10px]" aria-hidden="true">
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#e4e4e4]" />
          {shortUrl}
        </span>
      </figcaption>
      <span className={`mono-media block ${forceMono ? "mono-locked" : ""}`}>
        <img
          src={src}
          srcSet={src2x ? `${src} 1x, ${src2x} 2x` : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="block w-full object-cover"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </span>
    </figure>
  );
}

/** Mockup smartphone (aperçu mobile des réalisations).
 *  Cadre très fin (2,5 px) et coins légèrement arrondis (14 px —
 *  remontés depuis les 10 px trop cassés, demande de l'éditeur,
 *  14/11/2026) : l'écran du site occupe quasiment tout le mockup
 *  et son contenu reste visible en entier, même à petite largeur
 *  dans le hero. La fente « encoche » se réduit à un fin
 *  haut-parleur qui ne masque plus l'en-tête du site capturé. */
export function PhoneMockup({
  src,
  src2x,
  alt,
  className = "",
  width = 390,
  height = 844,
  forceMono = false,
}: {
  src: string;
  /** Variante haute densité @2x (voir MonoImage). */
  src2x?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** Noir et blanc PERMANENT sur tous les écrans — aucune couleur
   *  au survol (mockups du hero). */
  forceMono?: boolean;
}) {
  return (
    <figure
      className={`group/mockup relative overflow-hidden rounded-[14px] border border-[#e4e4e4]/25 bg-[#232323] p-[2.5px] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ${className}`}
    >
      <span
        className="absolute left-1/2 top-[4px] z-10 h-[5px] w-[34px] -translate-x-1/2 rounded-full bg-[#1c1c1c]"
        aria-hidden="true"
      />
      <span className={`mono-media block overflow-hidden rounded-[11px] ${forceMono ? "mono-locked" : ""}`}>
        <img
          src={src}
          srcSet={src2x ? `${src} 1x, ${src2x} 2x` : undefined}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="block w-full object-cover object-top"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </span>
    </figure>
  );
}

/** Icône directionnelle (visuels cliquables). */
export function DirectionalIcon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`dir-icon flex h-11 w-11 items-center justify-center rounded-full bg-[#e4e4e4] text-[#1c1c1c] ${className}`}
    >
      <ArrowUpRight className="h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}
