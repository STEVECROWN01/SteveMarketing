"use client";

import React, { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { BrowserMockup, PhoneMockup } from "@/components/media/Media";
import { HERO } from "@/content/site-content";
import { ASSETS, PROJECTS } from "@/lib/site";

/**
 * SECTION 01 — HERO
 * Totalement visible à l'écran, sans défilement, sur TOUTES les
 * tailles (la section occupe exactement la hauteur du viewport).
 *
 * Deux mises en page selon l'écran (demande de l'éditeur,
 * 16/11/2026) :
 * - BUREAU (≥ 1024 px) : grille deux colonnes — texte à gauche
 *   (note, titre, description, CTA, réassurance), à droite SON
 *   PORTRAIT VERTICAL (stevens-akpovi-portrait.webp) sur sa plaque
 *   grise inclinée, épinglé des deux mockups.
 * - MOBILE / TABLETTE : note, titre, puis la PHOTO HORIZONTALE
 *   (stevens-akpovi-portrait-long.webp) sur la même plaque grise
 *   (d'où la plaque rectangulaire horizontale sur ces écrans) avec
 *   les deux mockups épinglés, puis description, CTA et
 *   réassurance.
 *
 * PLAQUE GRISE (demande de l'éditeur, 16/11/2026, précisée le
 * même jour) : sur BUREAU elle est en FORMAT CARRÉ — le portrait
 * étant vertical, la plaque ne suit plus sa forme : son côté
 * mesure la HAUTEUR de l'image + 24 px et elle est centrée
 * derrière le portrait, qu'elle déborde largement à gauche et à
 * droite (les deux mockups épinglés reposent alors sur elle).
 * Sur TABLETTE/MOBILE elle reste rectangulaire : photo
 * horizontale + débord uniforme de 12 px sur les quatre côtés.
 *
 * EFFET DE SURVOL DE L'IMAGE : les deux variantes sont enveloppées
 * dans .mono-media — noir et blanc par défaut sur les périphériques
 * capables de survoler, retour progressif à la couleur + zoom léger
 * (scale 1.035) au survol ; couleur naturelle directe sur
 * mobile / tactile.
 *
 * MOCKUPS ÉPINGLÉS (demande de l'éditeur, 16/11/2026) :
 * exclusivement en noir et blanc sur TOUS les écrans et appareils
 * (variante .mono-pin), leur véritable couleur ne se révèle qu'au
 * survol. Le mockup NAVIGATEUR, trop large sur mobile (il cachait
 * l'image horizontale), est réduit : 36 % de la largeur de l'image
 * sur mobile, 40 % sur tablette, 52 % sur bureau (portrait
 * vertical) ; le SMARTPHONE reste modeste : 19 / 20 / 24 %.
 *
 * ANIMATION D'APPARITION (à chaque chargement, 4 s au total, chaque
 * élément en exactement 1 s — demande de l'éditeur, 15/11/2026) :
 * 0-1 s : la plaque grise surgit sur place depuis un point,
 *         en grossissant subitement (rebond) ;
 * 1-2 s : l'image arrive depuis la droite et se pose dessus ;
 * 2-3 s : le nom « Stevens Akpovi » apparaît en fondu (pendant que
 *         le premier mockup arrive) et le mockup NAVIGATEUR est
 *         jeté sur l'image pour l'épingler (coin bas-gauche) ;
 * 3-4 s : le mockup SMARTPHONE est jeté à son tour (coin
 *         haut-droit).
 * Après leur apparition, les deux mockups gardent une animation
 * continue : un léger balancement gauche-droite, comme une image
 * épinglée au mur (rotation autour du point d'appui haut).
 *
 * MENTION « À QUI JE VENDS » (volet 11, demande de l'éditeur,
 * 22/11/2026) : « — PMEs / PROFESSIONNELS » en italique, à la
 * suite de la description, sur sa propre ligne dans le même
 * paragraphe. Elle remplace les deux badges épinglés du volet 10
 * (supprimés à la demande de l'éditeur) : la cible commerciale
 * reste lisible au premier écran, et l'image redevient entièrement
 * dégagée — seuls les deux mockups et la mention « Stevens Akpovi »
 * y restent épinglés.
 * Toute la chorégraphie est en ANIMATIONS CSS (globals.css,
 * classes .hero-anim-* / .mockup-sway) : elle démarre dès le premier
 * rendu, sans attendre l'hydratation, et `prefers-reduced-motion`
 * fait tout apparaître immédiatement (règle globale du site).
 *
 * COLONNE TEXTE (volet 7 de l'audit, 19/11/2026 — LCP ≤ 1 s) : les
 * cinq révélations du bloc texte (note 4,9/5, titre, description,
 * CTA, réassurance) passent en mode « aboveFold » — animations CSS
 * .reveal-fold-* démarrées au premier rendu, au lieu d'attendre
 * l'hydratation + IntersectionObserver comme les révélations au
 * scroll (le paragraphe .hero-desc, élément LCP de l'accueil, n'était
 * peint qu'à ~950 ms pour un FCP à 168 ms). Mêmes courbes, durées et
 * décalages : la cascade étoiles → titre → description → CTA →
 * réassurance est conservée ; elle démarre simplement dès la
 * première frame, pendant que la plaque du bloc visuel surgit
 * (0-1 s), au lieu d'après l'hydratation. Tout ce qui est PLUS BAS
 * que le premier écran reste en révélations au scroll (comportement
 * inchangé sur tout le reste du site).
 */
export function Hero() {
  /* Équilibrage vertical de la description (bureau uniquement) :
     même espace au-dessus et au-dessous de la description — la
     description seule est déplacée verticalement, le titre et les
     boutons restent strictement immobiles (demande de l'éditeur,
     13/11/2026). L'écart dépend de la hauteur du viewport (le
     portrait dimensionne les rangées de la grille), d'où un ajustement
     mesuré plutôt qu'une marge fixe. Mesure après les animations de
     révélation (~1,05 s) puis à chaque redimensionnement. */
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const adjust = () => {
      const p = descRef.current;
      const row = ctaRowRef.current;
      const h1 = p?.closest("section")?.querySelector("h1");
      if (!p || !row || !h1) return;
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        p.style.top = "0px";
        return;
      }
      // Décalage éventuellement déjà appliqué : les mesures le
      // contiennent, on le neutralise pour obtenir le vrai écart.
      const currentShift = Math.max(0, -parseFloat(p.style.top) || 0);
      const gapAbove = p.getBoundingClientRect().top - h1.getBoundingClientRect().bottom;
      const gapBelow = row.getBoundingClientRect().top - p.getBoundingClientRect().bottom;
      // Titre et boutons immobiles : la description est centrée dans
      // l'espace disponible — autant d'air au-dessus qu'au-dessous.
      const naturalAbove = gapAbove + currentShift;
      const naturalBelow = gapBelow - currentShift;
      const newShift = Math.round((naturalAbove - naturalBelow) / 2);
      p.style.top = newShift > 0 ? `${-newShift}px` : "0px";
    };
    const schedule = (delay: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        raf = requestAnimationFrame(adjust);
      }, delay);
    };
    schedule(1150);
    const onResize = () => schedule(140);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Description : première phrase en gras, suite normale — plus des
     segments internes en gras (HERO.textBoldSpans, demande de
     l'éditeur, 20/11/2026 : « code pur » et « délai très court »).
     Découpage par RegExp de capture : les segments correspondants
     ressortent du split et sont rendus en <strong> blanc, le reste
     en texte normal — l'ordre du DOM suit exactement la phrase. */
  const rest =
    HERO.text.startsWith(HERO.textBold) ? HERO.text.slice(HERO.textBold.length).trim() : HERO.text;
  const boldSpans = HERO.textBoldSpans as readonly string[];
  const restParts = boldSpans.length
    ? rest.split(
        new RegExp(
          `(${boldSpans.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
          "g",
        ),
      )
    : [rest];

  return (
    <section
      id="hero"
      aria-label="Introduction — Stevens Akpovi, conception de sites web orientés conversion"
      className="section-deep relative flex min-h-svh flex-col overflow-hidden"
    >
      {/* Préchargement des images du hero (performance) : chaque
          variante n'est préchargée que sur les écrans qui
          l'affichent (attribut media).
          NOTE (correctif du 20/11/2026, volet 9) : le mockup
          navigateur n'a PLUS de preload manuel — l'ancien
          `<link rel="preload" href={PROJECTS[0].desktop}>` (vestige
          du travail LCP) téléchargeait le fichier 1440w (80 Ko) sur
          TOUS les écrans, y compris mobile où le mockup s'affiche à
          130 px : il défaisait l'économie du candidat 640w et forçait
          un double téléchargement (preload 1440w + candidat 640w de
          l'img). React 19 génère automatiquement, pour tout
          <img fetchPriority="high"> avec srcset/sizes, un preload
          RESPONSIVE (imageSrcSet + imageSizes — vérifié dans le HTML
          servi) qui sélectionne le bon candidat par écran : mobile
          → 640w, bureau étroit → 640w, bureaux très denses → 1440w.
          Les deux preloads du portrait (media queries) restent :
          fichiers à source unique, la sélection responsive n'a pas
          d'intérêt. */}
      <link rel="preload" as="image" href={ASSETS.portraitLong} media="(max-width: 1023px)" fetchPriority="high" />
      <link rel="preload" as="image" href={ASSETS.portrait} media="(min-width: 1024px)" fetchPriority="high" />

      {/* Décor : grille discrète + halo neutre */}
      <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[560px] w-[560px] rounded-full bg-[#e4e4e4] opacity-[0.09] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-20%] left-[-12%] h-[420px] w-[420px] rounded-full bg-[#e4e4e4] opacity-[0.05] blur-[110px]"
      />

      <div className="container-site relative flex flex-1 flex-col justify-center pb-2 pt-[60px] sm:pb-8 sm:pt-[68px] lg:pb-8 lg:pt-[112px]">
        <div className="grid items-center gap-2.5 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-7 xl:gap-9">
          {/* ---------- Bloc texte haut : note 5 étoiles, titre ---------- */}
          {/* lg:relative + lg:z-10 : sur les bureaux étroits (≈ 1024 px),
              la plaque carrée du portrait déborde jusqu'à la colonne de
              texte — le texte reste ainsi TOUJOURS au-dessus d'elle,
              jamais sous son léger voile gris (16/11/2026). */}
          <div className="order-1 lg:col-start-1 lg:row-start-1 lg:relative lg:z-10">
            {/* Cinq étoiles — la cinquième à moitié remplie horizontalement —
                suivies de « 4,9/5 » (remplace l'ancien eyebrow). aboveFold :
                voir le commentaire d'en-tête (volet 7 — LCP). */}
            <Reveal direction="up" aboveFold>
              <p
                className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-medium tracking-[0.02em] text-[#c8c8c8] sm:text-sm"
                aria-label="Note moyenne de 4,9 sur 5"
              >
                <span className="flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <Star key={i} fill="#e4e4e4" strokeWidth={0} className="h-4 w-4" />
                  ))}
                  {/* Cinquième étoile : moitié gauche remplie, moitié droite vide */}
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

            <RevealText
              as="h1"
              text={HERO.h1}
              boldText={HERO.h1Bold}
              delay={0.08}
              aboveFold
              className="text-hero-title-viewport mt-1.5 text-white sm:mt-4"
            />
          </div>

          {/* ---------- Bloc visuel : plaque + image + mockups épinglés ---------- */}
          {/* Bureau : colonne droite sur les deux rangées de la grille,
              hauteur du portrait plafonnée en svh pour que le hero
              tienne dans l'écran. L'espace sous l'image (vers la
              description, sur mobile/tablette) est RESPONSIVE : marge
              fluide en svh, la même proportion sur tous les écrans
              (demande de l'éditeur, 15/11/2026 — l'ancienne marge
              fixe de 144 px sur tablette était trop spacieuse). */}
          <div className="hero-visual order-2 relative mx-auto mt-5 w-full max-w-md sm:mt-7 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-none">
            {/* Enveloppe « w-fit » : exactement la largeur de l'image —
                les pourcentages des mockups épinglés (largeur,
                décalages) se réfèrent donc à l'image elle-même. */}
            <div className="relative mx-auto flex w-fit justify-center">
              {/* PLAQUE GRISE derrière l'image — animation 0-1 s :
                  elle surgit sur place depuis un petit point, en
                  grossissant subitement (rebond croissant).
                  BUREAU (16/11/2026) : FORMAT CARRÉ — l'enveloppe
                  externe occupe exactement la surface de l'image et
                  centre son contenu (flex) ; la plaque animée a pour
                  côté la hauteur de l'image + 24 px (aspect-square),
                  elle déborde donc à gauche et à droite du portrait
                  vertical sans jamais être découpée. Le centrage se
                  fait en flex — AUCUN translate sur l'élément animé,
                  dont l'animation (transform: scale) resterait
                  sinon en conflit avec lui. TABLETTE/MOBILE :
                  débord uniforme de 12 px autour de la photo
                  horizontale, comme à l'origine. */}
              <div
                aria-hidden="true"
                className="absolute -inset-3 lg:inset-0 lg:flex lg:items-center lg:justify-center"
              >
                <div className="hero-anim-plate h-full w-full lg:aspect-square lg:h-[calc(100%+1.5rem)] lg:w-auto lg:shrink-0">
                  <div className="h-full w-full rotate-[2.5deg] rounded-[2rem] bg-[#e4e4e4]/90 opacity-[0.16] sm:rotate-[3deg]" />
                </div>
              </div>

              {/* IMAGE — animation 1-2 s : elle arrive depuis la
                  droite et se pose sur la plaque. Deux figures, une
                  seule visible : le PORTRAIT VERTICAL de l'éditeur
                  (stevens-akpovi-portrait.webp) sur bureau, la PHOTO
                  HORIZONTALE (stevens-akpovi-portrait-long.webp) sur
                  mobile/tablette (demande de l'éditeur, 16/11/2026).
                  Les deux sont enveloppées dans .mono-media : effet
                  de survol — noir et blanc sur bureau, retour à la
                  couleur + zoom léger au survol, couleur naturelle
                  sur tactile. Celle qui est masquée en display:none
                  avec loading="lazy" n'est jamais téléchargée. */}
              <div className="hero-anim-img">
                {/* Portrait vertical — BUREAU EXCLUSIVEMENT. Classe
                    « hero-portrait » : cible des adaptations CSS aux
                    téléphones courts (règles sans objet sur ces
                    écrans, la figure y est masquée). */}
                <figure className="hero-portrait relative hidden overflow-hidden rounded-[1.75rem] border border-[#e4e4e4]/15 bg-[#232323] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] lg:block">
                  <span className="mono-media block">
                    <img
                      src={ASSETS.portrait}
                      alt={HERO.portraitAlt}
                      width={1024}
                      height={1536}
                      loading="lazy"
                      fetchPriority="high"
                      decoding="async"
                      className="block h-[min(72svh,640px)] w-auto object-cover object-top"
                    />
                  </span>
                </figure>

                {/* Photo horizontale — MOBILE ET TABLETTE : plaque
                    rectangulaire horizontale. Pleine largeur,
                    hauteur naturelle (1672×941) : le hero reste
                    entièrement visible sans défilement. */}
                <figure className="relative overflow-hidden rounded-[1.25rem] border border-[#e4e4e4]/15 bg-[#232323] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] lg:hidden">
                  <span className="mono-media block">
                    <img
                      src={ASSETS.portraitLong}
                      alt={HERO.portraitLongAlt}
                      width={1672}
                      height={941}
                      /* PAS DE SRCSET SUR CETTE IMAGE — décision mesurée
                         du volet 8 (19/11/2026, A/B sous Lighthouse/PSI
                         en Slow 4G) : ajouter des candidats responsives
                         (836w/1170w/1672w + sizes) ici provoquait un
                         CLS 0,136 (seuil Google 0,1) dans 1 à 2 runs
                         Lighthouse sur 3 — Chrome ne réserve pas la
                         boîte d'une image loading=lazy avec sizes tant
                         que le candidat choisi n'est pas connu, et la
                         grille du hero (items-center) déplace alors
                         tout son contenu (~208 px, la hauteur de
                         l'image). Un style aspectRatio inline N'A PAS
                         suffi à l'immuniser (1/3 runs encore en
                         échec). Sans srcset : CLS 0 — 6/6 runs
                         Lighthouse + sonde dédiée 12/12 à 0,000.
                         L'économie de bande passante mobile est
                         captée sur les MOCKUPS du hero (candidats
                         640w/290w dans Media.tsx), mesurés sans
                         aucun décalage : leur boîte est épinglée par
                         un style aspectRatio ET ils n'ont pas
                         height:auto (w-full object-cover). */
                      loading="lazy"
                      fetchPriority="high"
                      decoding="async"
                      className="block h-auto w-full object-cover"
                    />
                  </span>
                </figure>
              </div>

              {/* Mention épinglée « Stevens Akpovi » : bas-droit de
                  l'image, une seule ligne, taille réduite — le nom
                  reste protégé. Apparition en fondu à 2 s (dès que
                  l'image est posée, en même temps que le premier
                  mockup). */}
              <span className="hero-anim-name absolute bottom-3 right-3 z-10">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#070707]/75 px-2.5 py-1 text-[10px] font-medium leading-none text-white backdrop-blur-sm">
                  {/* Point indicateur vert brillant (demande de l'éditeur,
                      16/11/2026 : passer du gris neutre à un vert vif
                      attirant l'œil) + léger halo lumineux. */}
                  <span
                    className="h-1 w-1 shrink-0 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.95)]"
                    aria-hidden="true"
                  />
                  <span>Stevens Akpovi</span>
                </span>
              </span>

              {/* Mockup navigateur épinglé — MR STEVE ENGLISH (coin
                  bas-gauche). Animation 2-3 s : jeté sur l'image
                  (arrive en gros, de face, et atterrit en rebond
                  pour l'épingler), puis balancement continu
                  gauche-droite autour de son point d'appui haut.
                  Noir et blanc PERMANENT sur tous les écrans
                  (mono-pin) — la couleur ne se révèle qu'au survol
                  (demande de l'éditeur, 16/11/2026). RÉDUIT sur
                  mobile — trop large, il cachait l'image
                  horizontale : 36 % de la largeur de l'image sur
                  mobile, 40 % sur tablette, 52 % sur bureau
                  (portrait vertical). */}
              <div className="hero-anim-browser absolute -bottom-2 -left-[4%] z-10 w-[36%] sm:-bottom-4 sm:-left-[10%] sm:w-[40%] lg:-bottom-5 lg:-left-[13%] lg:w-[52%]">
                <div className="mockup-sway">
                  {/* ATTRIBUTS 640×400 (ratio 1.6 IDENTIQUE à 1440×900 —
                      correctif du 20/11/2026, volet 9) : cet img est
                      eager+sync+fetchPriority=high ; quand la sélection
                      du candidat srcset gagne la course contre la mise
                      en page (comportement non déterministe observé 6/6
                      puis 0/6 selon l'environnement Chrome), le
                      navigateur retombe sur la largeur INTRINSÈQUE de
                      l'attribut width. Avec 1440, il choisissait le
                      candidat 1440w (80 Ko) pour 130 px affichés sur
                      iPhone ; avec 640, le pire cas devient le candidat
                      léger 640w (30 Ko) — et le cas normal (sélection
                      après layout, via sizes) reste exact. La réserve
                      de place ne change pas : elle vient du ratio
                      (aspect-ratio 640/400 = 1440/900), pas des
                      valeurs absolues. Aucun changement visuel. */}
                  <BrowserMockup
                    src={PROJECTS[0].desktop}
                    src2x={PROJECTS[0].desktop2x}
                    srcSmall={PROJECTS[0].desktopSmall}
                    srcSmallWidth={640}
                    alt={`Aperçu du site ${PROJECTS[0].name}`}
                    url={PROJECTS[0].url}
                    width={640}
                    height={400}
                    pinMono
                    priority
                    sizes="(max-width: 640px) 130px, (max-width: 1023px) 290px, 230px"
                  />
                </div>
              </div>

              {/* Mockup smartphone épinglé — AFRIBAYIT (coin
                  haut-droit). Animation 3-4 s : jeté sur l'image à
                  son tour, puis balancement continu décalé.
                  Noir et blanc PERMANENT sur tous les écrans
                  (mono-pin) — couleur au survol uniquement.
                  Taille modeste pour ne pas recouvrir l'image : 19 %
                  sur mobile, 20 % sur tablette (l'image horizontale
                  étant courte), 24 % sur bureau (portrait
                  vertical). */}
              <div className="hero-anim-phone absolute -top-2 -right-[4%] z-10 w-[19%] sm:-top-4 sm:-right-[8%] sm:w-[20%] lg:-top-5 lg:-right-[10%] lg:w-[24%]">
                <div className="mockup-sway mockup-sway--phone">
                  {/* ATTRIBUTS 290×628 (correctif du 20/11/2026, volet 9 —
                      même mécanisme que le mockup navigateur ci-dessus) :
                      290×628 conserve le ratio du cadre 390×844 à 0,07 %
                      près (imperceptible) et aligne la largeur
                      intrinsèque sur le candidat léger 290w : le pire
                      cas de la course sélection-vs-layout devient le
                      candidat 290w (~20 Ko) au lieu de 390w (52 Ko). */}
                  <PhoneMockup
                    src={PROJECTS[2].mobile}
                    src2x={PROJECTS[2].mobile2x}
                    srcSmall={PROJECTS[2].mobileSmall}
                    srcSmallWidth={290}
                    alt={`Aperçu mobile du site ${PROJECTS[2].name}`}
                    width={290}
                    height={628}
                    pinMono
                    priority
                    sizes="(max-width: 640px) 68px, (max-width: 1023px) 145px, 104px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Bloc texte bas : description, CTA, réassurance ---------- */}
          {/* Mobile : succède à l'image avec la marge fluide du bloc
              visuel (clamp en svh : la même proportion d'espace sur
              tous les écrans — demande de l'éditeur, 15/11/2026) ;
              bureau : colonne gauche, rangée 2. Bureau : l'effet
              « descriptionEquilibree » place la description pour
              qu'il y ait autant d'espace au-dessus qu'au-dessous —
              sans bouger le titre ni les boutons. */}
          <div className="order-3 mt-[clamp(0.75rem,2.5svh,1.75rem)] lg:col-start-1 lg:row-start-2 lg:mt-0 lg:relative lg:z-10">
            {/* aboveFold="rise" — translation sans fondu : ce
                paragraphe est l'ÉLÉMENT LCP du site, il doit être
                PEINT dès la première frame (voir Reveal.tsx et
                globals.css, volet 7) ; les autres révélations du
                hero gardent le fondu. */}
            <Reveal direction="up" delay={0.18} aboveFold="rise">
              <p
                ref={descRef}
                className="hero-desc relative max-w-xl text-[12px] leading-[1.5] text-[#c8c8c8] transition-[top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-[15px] lg:text-[15px] xl:text-base"
              >
                <strong className="font-semibold text-white">{HERO.textBold}</strong>{" "}
                {restParts.map((part, i) =>
                  boldSpans.includes(part) ? (
                    <strong key={i} className="font-semibold text-white">
                      {part}
                    </strong>
                  ) : (
                    <React.Fragment key={i}>{part}</React.Fragment>
                  ),
                )}
                {/* Mention « à qui je vends » — italique, propre ligne
                    dans le même paragraphe (demande de l'éditeur,
                    22/11/2026 — volet 11) : remplace les badges du
                    volet 10. Dans le MÊME paragraphe (et non en bloc
                    séparé) pour que l'équilibrage vertical bureau
                    (descriptionEquilibree, qui mesure ce paragraphe)
                    reste exact. */}
                <br />
                <em className="italic">{HERO.targetItalic}</em>
              </p>
            </Reveal>

            {/* CTA — les deux boutons partagent TOUJOURS la même
                ligne, quelle que soit la taille de l'écran (demande
                de l'éditeur, 18/11/2026 : « Je préfère que les deux
                CTA du hero restent sur une seule ligne peu importe
                la taille d'écran ») : rangée en flex-nowrap, classes
                compactes propres au hero (padding 8 px, police fluide
                clamp(10px, 3vw, 12px) — 10 px à 280-330 px, 12 px à
                partir de 400 px) et, sous 640 px, libellés seuls (la
                flèche du premier et l'icône œil du second sont
                masquées). Réservation d'appel (blanc, fenêtre
                Calendly) + découverte des réalisations (noir). */}
            <Reveal direction="up" delay={0.24} aboveFold>
              <div
                ref={ctaRowRef}
                className="hero-cta mt-2.5 flex flex-nowrap items-center gap-2 sm:mt-5 sm:gap-3 lg:mt-5"
              >
                <CTAButton
                  action={{ kind: "calendly" }}
                  variant="secondary"
                  size="lg"
                  hideArrowBelowSm
                  ariaLabel="Réserver Un Appel — 30 minutes, gratuit et sans engagement"
                  className="px-2 text-[length:clamp(10px,3vw,12px)] sm:px-7 sm:text-[15px]"
                >
                  {HERO.ctaPrimary}
                </CTAButton>
                <CTAButton
                  action={{ kind: "page", page: "realisations" }}
                  variant="ghostLight"
                  icon={
                    /* Icône « œil » masquée sous 640 px : sous cette
                       largeur, les deux CTA du hero n'affichent que
                       leur libellé pour tenir sur UNE seule ligne à
                       toutes les tailles (demande de l'éditeur,
                       18/11/2026) ; icône + pleine taille dès 640 px. */
                    <span className="hidden sm:inline-flex">{CTAIcons.works}</span>
                  }
                  hideArrow
                  className="px-2 text-[length:clamp(10px,3vw,12px)] sm:px-4 sm:py-3 sm:text-sm"
                >
                  {HERO.ctaTertiary}
                </CTAButton>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.3} aboveFold>
              <ReassuranceBar mention={HERO.reassurance} className="mt-2 sm:mt-4 lg:mt-5" />
            </Reveal>
          </div>
        </div>
      </div>

      {/* Fondu progressif vers la section suivante : le fond du hero
          (#070707) se fond dans celui de la section suivante (#1c1c1c),
          sur ~36-44 px seulement, sans limite nette. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-b from-transparent to-[#1c1c1c] sm:h-11"
      />
    </section>
  );
}
