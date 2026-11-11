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

/** Mockup navigateur (aperçu desktop des réalisations). */
export function BrowserMockup({
  src,
  alt,
  url,
  className = "",
  width = 1440,
  height = 900,
  priority = false,
}: {
  src: string;
  alt: string;
  url: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const shortUrl = url.replace(/^https?:\/\//, "");
  return (
    <figure className={`group/mockup overflow-hidden rounded-xl border border-[#e4e4e4]/25 bg-[#232323] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ${className}`}>
      <figcaption className="flex items-center gap-2 border-b border-[#e4e4e4]/12 px-3.5 py-2.5 sm:px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3c3c3c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3c3c3c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3c3c3c]" />
        </span>
        <span className="mx-auto flex max-w-[70%] items-center gap-1.5 truncate rounded-md bg-[#1c1c1c] px-3 py-1 text-[10px] text-[#c8c8c8] sm:text-[11px]" aria-hidden="true">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9baac]" />
          {shortUrl}
        </span>
      </figcaption>
      <span className="mono-media block">
        <img
          src={src}
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

/** Mockup smartphone (aperçu mobile des réalisations). */
export function PhoneMockup({
  src,
  alt,
  className = "",
  width = 390,
  height = 844,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure
      className={`group/mockup relative overflow-hidden rounded-[2rem] border border-[#e4e4e4]/25 bg-[#232323] p-[6px] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ${className}`}
    >
      <span
        className="absolute left-1/2 top-[10px] z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1c1c1c]"
        aria-hidden="true"
      />
      <span className="mono-media block overflow-hidden rounded-[1.6rem]">
        <img
          src={src}
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
      className={`dir-icon flex h-11 w-11 items-center justify-center rounded-full bg-[#c9baac] text-[#1c1c1c] ${className}`}
    >
      <ArrowUpRight className="h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}
