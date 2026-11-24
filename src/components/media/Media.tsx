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
  /** COULEUR PERMANENTE (demande de l'éditeur, 16/11/2026 :
   *  « mockups projets en couleur ») — aucun noir et blanc, ni au
   *  repos ni de transition au survol : l'image s'affiche dans ses
   *  couleurs d'origine sur tous les écrans. */
  color?: boolean;
  /** NOIR ET BLANC PERMANENT sur tous les écrans (mobile et
   *  tablette comprises) — aucune couleur au survol : l'image
   *  reste exclusivement en noir et blanc. Classe .mono-locked
   *  (demande de l'éditeur, 18/11/2026 : image épinglée de la
   *  section « VOTRE ACTIVITÉ MÉRITE D'ÊTRE DAVANTAGE VISIBLE »
   *  « exclusivement en blanc-noir »). Le zoom léger au survol
   *  (bureau) est conservé — seul le filtre couleur est verrouillé. */
  forceMono?: boolean;
  /** Tailles d'affichage CSS (attribut sizes) — combinée au srcset
   *  en descripteurs de largeur, elle évite aux mobiles de
   *  télécharger la variante @2x surdimensionnée (performance,
   *  15/11/2026). Ex. « (max-width: 640px) 92vw, 760px ». */
  sizes?: string;
  /** Largeur réelle en pixels du fichier @2x — nécessaire au srcset
   *  en descripteurs de largeur (ex. 1920 pour les captures desktop
   *  @2x réelles). Sans lui, repli DPR 1x/2x. */
  src2xWidth?: number;
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
  color = false,
  forceMono = false,
  sizes,
  src2xWidth,
}: MonoImageProps) {
  // Srcset en descripteurs de LARGEUR (pas DPR) lorsque la taille
  // d'affichage est connue : le navigateur choisit le plus petit
  // fichier suffisant pour la densité réelle de l'écran — les
  // mobiles n'emmènent plus les variantes @2x de 340 Ko (demande
  // « site trop lent, images lentes », 15/11/2026).
  const srcSet =
    src2x && sizes && src2xWidth
      ? `${src} ${width}w, ${src2x} ${src2xWidth}w`
      : src2x
        ? `${src} 1x, ${src2x} 2x`
        : undefined;
  // `color` : pas de classe mono-media — donc ni filtre noir et
  // blanc ni zoom au survol, la couleur d'origine s'affiche
  // directement (mockups projets en couleur, 16/11/2026).
  // `forceMono` : mono-media + mono-locked — noir et blanc
  // verrouillé sur TOUS les écrans, aucune couleur au survol
  // (image épinglée de la section problème, 18/11/2026) ; le
  // zoom léger au survol de .mono-media reste actif.
  return (
    <span
      className={`${color ? "block" : "mono-media block"} ${
        forceMono ? "mono-locked" : ""
      } ${className}`}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
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
 *  Arrondi volontairement discret (rounded-md) et barre chrome
 *  fine — ENCORE amincie à la demande de l'éditeur (15/11/2026 :
 *  « réduis l'épaisseur de l'entête appareil du mockup desktop ») :
 *  pastilles et retraits réduits, le contenu capturé occupe
 *  davantage du mockup.
 *  VOLET 14 (24/11/2026) — PLUS D'URL DANS L'ENTÊTE : demande de
 *  l'éditeur — « tous les mockups de projets affichés sur le site,
 *  dans l'entête designée par défaut du mockup, l'URL est affichée.
 *  Je ne veux pas que l'URL soit affichée. Comme pour les mockups
 *  mobiles, les URL ne sont pas affichées. » La pastille de barre
 *  d'adresse reste — MUETTE : un point, aucun texte. La prop `url`
 *  est conservée (compatibilité des appelants) mais plus rendue. */
export function BrowserMockup({
  src,
  src2x,
  srcSmall,
  srcSmallWidth,
  alt,
  url,
  className = "",
  width = 1440,
  height = 900,
  priority = false,
  pinMono = false,
  forceMono = false,
  color = false,
  sizes,
  softRadius = false,
  zoom = false,
}: {
  src: string;
  /** Variante haute densité @2x (voir MonoImage). */
  src2x?: string;
  /** Variante LÉGÈRE (volet 8 de l'audit, 19/11/2026 — Lighthouse
   *  image-delivery) : candidat de plus petite largeur inséré EN
   *  TÊTE du srcset. Le mockup navigateur du hero s'affiche à
   *  130-290 px CSS ; sans candidat petit, la plus petite source
   *  disponible restait 1440 px — le mobile téléchargeait 80 Ko
   *  pour 130 px affichés. Largeur réelle du fichier requise
   *  (srcSmallWidth) pour le descripteur en pixels. */
  srcSmall?: string;
  srcSmallWidth?: number;
  alt: string;
  url: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Tailles d'affichage CSS — sans elle, repli DPR 1x/2x. */
  sizes?: string;
  /** Noir et blanc PERMANENT sur tous les écrans (mobile comprise),
   *  mais la couleur originale se révèle au survol (demande de
   *  l'éditeur, 16/11/2026) : mockups épinglés du hero. */
  pinMono?: boolean;
  /** Noir et blanc PERMANENT sur tous les écrans (mobile comprise) —
   *  aucune couleur au survol : mockups du hero (demande de
   *  l'éditeur, 13/11/2026). */
  forceMono?: boolean;
  /** COULEUR PERMANENTE (mockups projets en couleur, demande de
   *  l'éditeur, 16/11/2026) — aucun noir et blanc : l'aperçu du
   *  site s'affiche dans ses couleurs réelles. */
  color?: boolean;
  /** Coins PLUS ARRONDIS (arrondi accentué, demande de l'éditeur,
   *  17/11/2026 : pages projets — légèrement plus doux que le
   *  rounded-md historique, pour accompagner le smartphone). */
  softRadius?: boolean;
  /** ZOOM LÉGER AU SURVOL (scale 1.035, comme .mono-media) SANS
   *  noir et blanc — pages projets (demande de l'éditeur,
   *  17/11/2026 : « lorsqu'on survole ce mockup, il doit y avoir
   *  toujours l'effet de zoom qu'on a sur les mockups du site »). */
  zoom?: boolean;
}) {
  // VOLET 14 : plus aucun rendu d'URL dans l'entête (voir la note
  // de documentation ci-dessus) — la prop `url` reste acceptée
  // (compatibilité des appelants) mais n'est plus affichée.
  // Fichiers réels : desktop 1440 px (1x) et 1920 px (@2x vraie densité)
  // + candidat léger en tête quand il est fourni (voir srcSmall).
  const srcSet = src2x
    ? `${srcSmall && srcSmallWidth ? `${srcSmall} ${srcSmallWidth}w, ` : ""}${src} 1440w, ${src2x} 1920w`
    : undefined;
  return (
    <figure
      className={`group/mockup overflow-hidden ${
        softRadius ? "rounded-[16px]" : "rounded-md"
      } border border-[#e4e4e4]/25 bg-[#232323] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ${
        zoom ? "mockup-zoom" : ""
      } ${className}`}
    >
      <figcaption className="flex items-center gap-1 border-b border-[#e4e4e4]/12 px-1.5 py-[3px] sm:gap-2 sm:px-3 sm:py-1.5">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1 w-1 rounded-full bg-[#3c3c3c] sm:h-1.5 sm:w-1.5" />
          <span className="h-1 w-1 rounded-full bg-[#3c3c3c] sm:h-1.5 sm:w-1.5" />
          <span className="h-1 w-1 rounded-full bg-[#3c3c3c] sm:h-1.5 sm:w-1.5" />
        </span>
        <span className="mx-auto flex max-w-[70%] items-center gap-1.5 truncate rounded-md bg-[#1c1c1c] px-2 py-[2px] text-[7px] leading-none text-[#c8c8c8] sm:text-[9px]" aria-hidden="true">
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#e4e4e4]" />
        </span>
      </figcaption>
      <span
        className={
          color
            ? "block"
            : pinMono
              ? "mono-pin block"
              : `mono-media block ${forceMono ? "mono-locked" : ""}`
        }
      >
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          className="block w-full object-cover"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </span>
    </figure>
  );
}

/** Mockup smartphone (aperçu mobile des réalisations).
 *  Cadre très fin (2,5 px) et coins arrondis — 14 px par défaut
 *  (remontés depuis les 10 px trop cassés, demande de l'éditeur,
 *  14/11/2026), 20 px avec `softRadius` (pages projets,
 *  17/11/2026 : « l'angle est trop pointu ») : l'écran du site
 *  occupe quasiment tout le mockup et son contenu reste visible
 *  en entier, même à petite largeur dans le hero. La fente
 *  « encoche » se réduit à un fin haut-parleur qui ne masque plus
 *  l'en-tête du site capturé. */
export function PhoneMockup({
  src,
  src2x,
  srcSmall,
  srcSmallWidth,
  alt,
  className = "",
  width = 390,
  height = 844,
  priority = false,
  pinMono = false,
  forceMono = false,
  color = false,
  sizes,
  softRadius = false,
  zoom = false,
}: {
  src: string;
  /** Variante haute densité @2x (voir MonoImage). */
  src2x?: string;
  /** Variante LÉGÈRE (volet 8 de l'audit, 19/11/2026 — Lighthouse
   *  image-delivery) : candidat de plus petite largeur inséré EN
   *  TÊTE du srcset. Le mockup navigateur du hero s'affiche à
   *  130-290 px CSS ; sans candidat petit, la plus petite source
   *  disponible restait 1440 px — le mobile téléchargeait 80 Ko
   *  pour 130 px affichés. Largeur réelle du fichier requise
   *  (srcSmallWidth) pour le descripteur en pixels. */
  srcSmall?: string;
  srcSmallWidth?: number;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** Chargement immédiat (mockups du hero, visibles à l'écran au
   *  chargement — demande « images trop lentes », 15/11/2026). */
  priority?: boolean;
  /** Tailles d'affichage CSS — sans elle, repli DPR 1x/2x. */
  sizes?: string;
  /** Noir et blanc PERMANENT, couleur révélée au survol — mockups
   *  épinglés du hero (demande de l'éditeur, 16/11/2026). */
  pinMono?: boolean;
  /** Noir et blanc PERMANENT sur tous les écrans — aucune couleur
   *  au survol (mockups du hero). */
  forceMono?: boolean;
  /** COULEUR PERMANENTE (mockups projets en couleur, 16/11/2026). */
  color?: boolean;
  /** Coins PLUS ARRONDIS (20 px) — pages projets (demande de
   *  l'éditeur, 17/11/2026 : « augmente un peu le border-radius du
   *  mockup téléphone, l'angle est trop pointu »). */
  softRadius?: boolean;
  /** ZOOM LÉGER AU SURVOL (scale 1.035, comme .mono-media) SANS
   *  noir et blanc — pages projets (demande de l'éditeur,
   *  17/11/2026). */
  zoom?: boolean;
}) {
  // Fichiers réels : mobile 390 px (1x) et 780 px (@2x vraie densité)
  // + candidat léger en tête quand il est fourni (voir srcSmall) :
  // le mockup téléphone du hero s'affiche à 68-145 px CSS.
  const srcSet = src2x
    ? `${srcSmall && srcSmallWidth ? `${srcSmall} ${srcSmallWidth}w, ` : ""}${src} 390w, ${src2x} 780w`
    : undefined;
  const radiusOuter = softRadius ? "rounded-[20px]" : "rounded-[14px]";
  const radiusInner = softRadius ? "rounded-[17px]" : "rounded-[11px]";
  return (
    <figure
      className={`group/mockup relative overflow-hidden ${radiusOuter} border border-[#e4e4e4]/25 bg-[#232323] p-[2.5px] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ${
        zoom ? "mockup-zoom" : ""
      } ${className}`}
    >
      <span
        className="absolute left-1/2 top-[4px] z-10 h-[5px] w-[34px] -translate-x-1/2 rounded-full bg-[#1c1c1c]"
        aria-hidden="true"
      />
      <span
        className={
          color
            ? `block overflow-hidden ${radiusInner}`
            : pinMono
              ? `mono-pin block overflow-hidden ${radiusInner}`
              : `mono-media block overflow-hidden ${radiusInner} ${forceMono ? "mono-locked" : ""}`
        }
      >
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
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
