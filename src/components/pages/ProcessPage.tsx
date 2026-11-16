"use client";

import React, { useEffect, useRef, useState } from "react";
import { Plus, Minus, Building2, ShoppingCart, RefreshCcw } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { useCalendly } from "@/components/calendly/CalendlyContext";
import { PageHero, CTAButton, RichText } from "@/components/marketing/Marketing";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { StartProjectButton } from "@/components/marketing/StartProjectButton";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { SERVICES_SUMMARY, SOLUTION } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";

const SERVICE_ICONS = [Building2, ShoppingCart, RefreshCcw];

/* ============================================================
 * FLÈCHE SINUSOÏDALE CROISSANTE — de la fin du titre de la
 * section « DES SITES WEB QUI VENDENT » vers la section
 * « COMMENT JE TRAVAILLE » (demande de l'éditeur, 17/11/2026,
 * corrige la flèche du 16/11 qui partait du titre vertical de la
 * section méthode elle-même) : elle quitte la FIN DU TITRE
 * « Voici comment je crée des sites web qui génèrent des
 * ventes. » — juste après le mot « ventes. » — et vient POINTER
 * la section qui présente la méthode (la première carte de la
 * liste des étapes).
 *
 * Le trajet traverse deux sections : il est MESURÉ au pixel au
 * chargement (puis à chaque redimensionnement / stabilisation
 * des polices) et dessiné en SVG en position absolue dans
 * l'enveloppe de page. Toutes les mesures sont prises dans la
 * même passe, relatives à l'enveloppe : elles restent justes
 * même pendant les transitions de page (translations communes
 * neutralisées par soustraction) et Lenis n'utilise aucune
 * transformation (défilement natif).
 *
 * Trajet : sortie horizontale à la fin du mot « ventes. » →
 * plongée dans la bande libre à droite de la colonne
 * titre/description/bouton (jamais par-dessus le texte) →
 * sinusoïdes d'amplitude CROISSANTE dans les zones de
 * respiration → approche finale : la pointe se pose dix pixels
 * au-dessus de la première carte de la liste. Dégradé du trait :
 * encre sombre sur la section claire, gris clair sur la section
 * sombre, transition exactement à la frontière des deux.
 * Bureau uniquement (≥ 1024 px) ; décoratif (aria-hidden,
 * pointer-events-none) ; révélé en fondu au défilement.
 * ============================================================ */

type ArrowGeometry = {
  left: number;
  top: number;
  width: number;
  height: number;
  body: string;
  head: string;
  /** Dégradé : fractions de la frontière claire → sombre. */
  g1: number;
  g2: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Interpolation de Catmull-Rom → chemin cubique lisse. */
function catmullRomPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Rectangle du DERNIER MOT du titre. Le titre animé mot à mot
 *  (RevealText) expose chaque mot dans un span externe SANS
 *  transform (l'animation porte sur le span interne) : sa
 *  mesure est stable, même en cours d'animation. Repli (mouvement
 *  réduit : texte continu sans spans) : plage DOM sur le dernier
 *  mot. */
function lastWordRect(h2: HTMLElement): DOMRect | null {
  const spans = h2.querySelectorAll(":scope > span");
  if (spans.length) {
    return (spans[spans.length - 1] as HTMLElement).getBoundingClientRect();
  }
  const walker = document.createTreeWalker(h2, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  while (walker.nextNode()) {
    if (walker.currentNode.textContent?.trim()) last = walker.currentNode as Text;
  }
  if (!last) return null;
  const content = last.textContent ?? "";
  const word = "ventes.";
  const start = Math.max(0, content.lastIndexOf(word));
  const range = document.createRange();
  range.setStart(last, start);
  range.setEnd(last, Math.min(content.length, start + word.length));
  const rects = range.getClientRects();
  return rects.length ? rects[rects.length - 1] : null;
}

/**
 * PAGE MÉTHODE (ex « Mon Process », renommée à la demande de
 * l'éditeur, 15/11/2026) — elle remplace aussi l'ancienne page
 * Services (supprimée) : les trois cadres de l'offre y sont
 * reproduits. Structure voulue par l'éditeur :
 * 1. en-tête : titre « Processus : des sites web pensés pour
 *    convertir » puis bouton « Réserver Un Appel » (pastille flèche
 *    ↗ à l'intérieur droite, comme le header) ;
 * 2. section à deux colonnes : les trois cadres de l'offre (site web
 *    professionnel, page de vente, refonte) empilés à gauche ; à
 *    droite, le titre « Voici comment nous créons des sites web qui
 *    génèrent des ventes. » et le bouton « Demander Un Devis » ;
 * 3. section « MON PROCESSUS » : titre écrit verticalement (du bas
 *    vers le haut) à gauche, trait vertical de séparation à
 *    extrémités fondues, et à droite les six déroulés à accordéon
 *    « + »/« − » — la flèche sinusoïdale du titre de la section
 *    « Des sites web qui vendent » ci-dessus vient pointer cette
 *    liste (voir le bloc « flèche » en tête de fichier) ;
 * 4. l'appel à l'action « Franchissons ensemble la première étape. »
 *    (conservé) ;
 * 5. puis la section réalisations : titre « Sites web que nous avons
 *    créés. » + bouton « Voir Plus De Projets » à gauche, la liste
 *    des trois réalisations à droite.
 */
export function ProcessPage() {
  const router = useRouter();
  const calendly = useCalendly();
  // Une seule étape ouverte à la fois — la première par défaut,
  // comme le déroulé de lecture de la section d'accueil.
  const [open, setOpen] = useState<number | null>(0);

  /* Flèche sinusoïdale (voir le bloc « flèche » en tête de
     fichier) : ancres mesurées dans le DOM — enveloppe de page,
     colonne du titre « Des sites web qui vendent », grille de
     l'offre, liste des étapes, section méthode. */
  const pageRef = useRef<HTMLDivElement>(null);
  const offerTitleRef = useRef<HTMLDivElement>(null);
  const offerGridRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const methodSectionRef = useRef<HTMLElement>(null);
  const [arrow, setArrow] = useState<ArrowGeometry | null>(null);

  /* Mesure du trajet : au montage, puis à chaque redimensionnement,
     stabilisation des polices (display=swap) et retouches tardives
     (animations d'entrée). L'ouverture d'un accordéon ne déplace
     NI le titre NI le haut de la liste : aucune remesure n'est
     nécessaire — la liste observée ne change pas de haut. */
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const page = pageRef.current;
      const titleBox = offerTitleRef.current;
      const grid = offerGridRef.current;
      const list = stepsRef.current;
      const method = methodSectionRef.current;
      if (!page || !titleBox || !grid || !list || !method) return;
      // Bureau uniquement — pas de flèche sur mobile/tablette.
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setArrow(null);
        return;
      }
      const h2 = titleBox.querySelector("h2") as HTMLElement | null;
      const word = h2 ? lastWordRect(h2) : null;
      if (!h2 || !word) {
        setArrow(null);
        return;
      }

      const pr = page.getBoundingClientRect();
      const rel = (el: Element) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left - pr.left,
          right: r.right - pr.left,
          top: r.top - pr.top,
          bottom: r.bottom - pr.top,
          width: r.width,
        };
      };
      const wordR = {
        left: word.left - pr.left,
        right: word.right - pr.left,
        top: word.top - pr.top,
        height: word.height,
      };
      const titleR = rel(h2);
      const gridR = rel(grid);
      const listR = rel(list);
      const methodR = rel(method);

      /* Départ : juste après la fin du titre (« … des ventes. »),
         à la hauteur de la ligne de base du dernier mot. */
      const startX = wordR.right + 10;
      const startY = wordR.top + wordR.height * 0.7;
      /* Bande libre à droite de la colonne de texte — la flèche
         franchit description et bouton PAR LA DROITE. */
      const bandX = Math.min(
        Math.max(titleR.right + 20, startX + 76),
        pr.width - 14,
      );
      /* Arrivée : la pointe se pose dix pixels au-dessus de la
         première carte de la liste (la « session méthode »). */
      const endX = listR.left + Math.min(Math.max(listR.width * 0.16, 44), 130);
      const endY = listR.top - 10;
      /* Frontière section claire → section sombre : transition du
         dégradé exactement là où le fond change. */
      const boundaryY = methodR.top;
      /* La plongée verticale reste dans la bande jusqu'à ce que
         TOUTE la grille (cartes + colonne titre) soit dépassée. */
      const diveEnd = gridR.bottom + 30;

      if (endY - 40 <= diveEnd + 60) {
        setArrow(null);
        return;
      }

      /* ---- Points du trajet (Catmull-Rom ensuite) ----
         Deux règles apprises au rendu (17/11) :
         1. Points espacés UNIFORMÉMENT (~85 px max) : la spline
            sur-oscille lorsqu'un grand segment précède un virage
            court (boucle parasite).
         2. Amplitude et longueur d'onde ÉQUILIBRÉES : une amplitude
            trop forte pour la longueur d'onde resserre les crêtes
            en boucles (angle mesuré > 60°/6 px). Deux bosses
            amples — amplitude croissante, plafonnée — restent
            fluides (< 20°/6 px). */
      const pts: Array<[number, number]> = [[startX, startY]];
      // 1) Sortie horizontale + virage : UNE SEULE courbe de Bézier
      //    cubique — tangente horizontale en partant du mot (la
      //    ligne de texte « continue »), tangente verticale en
      //    arrivant dans la bande — échantillonnée en 10 points.
      //    Un virage en points séparés faisait apparaître un coude
      //    (98°/6 px mesuré) ; la Bézier tourne progressivement.
      const cornerX1 = startX + 0.62 * (bandX - startX);
      const cornerX2 = bandX + 2;
      const cornerY2 = startY + 34;
      const cornerY3 = startY + 92;
      const nOut = 10;
      for (let i = 1; i <= nOut; i++) {
        const t = i / nOut;
        const u = 1 - t;
        pts.push([
          u * u * u * startX +
            3 * u * u * t * cornerX1 +
            3 * u * t * t * cornerX2 +
            t * t * t * cornerX2,
          u * u * u * startY +
            3 * u * u * t * startY +
            3 * u * t * t * cornerY2 +
            t * t * t * cornerY3,
        ]);
      }
      // 2) Plongée le long du texte : droite et claire, avec un
      //    très léger frémissement (±2 px) — stoppée 8 px avant
      //    la fin de bande : les ondulations prennent le relais.
      const diveStart = startY + 92;
      const diveStop = diveEnd - 8;
      const nDive = Math.max(2, Math.ceil((diveStop - diveStart) / 85));
      for (let i = 1; i <= nDive; i++) {
        const t = i / nDive;
        pts.push([
          bandX + 2 + 2 * Math.sin(t * Math.PI * 2),
          lerp(diveStart, diveStop, t),
        ]);
      }
      // 3) Ondulations descendantes : deux bosses amples, amplitude
      //    croissante. Échantillonnage DÉBUTANT DENSE (s = (i/M)^1,6)
      //    et dérivées nulles au point de jonction — la dérive
      //    latérale en s^2,2 et l'amplitude en s^0,9 (nulle au
      //    départ) : la courbe prolonge la plongée VERTICALE puis
      //    s'incline et ondule progressivement, sans coude.
      const y1 = diveEnd;
      const y2 = endY - 62;
      const Amax = Math.min(42, Math.max(18, (y2 - y1) * 0.22));
      const M = 26;
      for (let i = 1; i <= M; i++) {
        const s = Math.pow(i / M, 1.6);
        const y = lerp(y1, y2, s);
        const cx = lerp(bandX, endX + 55, Math.pow(s, 2.2));
        const amp = Amax * Math.pow(s, 0.9);
        pts.push([cx - amp * Math.sin(s * Math.PI * 2), y]);
      }
      // 5) Approche finale : la vague arrive presque horizontale —
      //    l'approche PROLONGE cette pente et se redresse
      //    progressivement (≈32° → 41° → 55° → 70° sous
      //    l'horizontale) jusqu'à la pointe : aucun coude (57°/6 px
      //    mesuré lorsque l'approche plongeait d'emblée à 45°).
      pts.push([endX + 34, endY - 48]);
      pts.push([endX + 17, endY - 33]);
      pts.push([endX + 6, endY - 17]);
      pts.push([endX, endY]);

      /* ---- Pointe : chevron orienté selon la tangente finale. ---- */
      const before = pts[pts.length - 2];
      const theta = Math.atan2(endY - before[1], endX - before[0]);
      const arm = 16;
      const a1 = theta + Math.PI - 0.52;
      const a2 = theta - Math.PI + 0.52;
      const arm1: [number, number] = [
        endX + arm * Math.cos(a1),
        endY + arm * Math.sin(a1),
      ];
      const arm2: [number, number] = [
        endX + arm * Math.cos(a2),
        endY + arm * Math.sin(a2),
      ];

      /* ---- Boîte englobante + translation des coordonnées. ---- */
      const xs = [...pts.map((p) => p[0]), arm1[0], arm2[0]];
      const ys = [...pts.map((p) => p[1]), arm1[1], arm2[1]];
      const pad = 12;
      const left = Math.min(...xs) - pad;
      const top = Math.min(...ys) - pad;
      const width = Math.max(...xs) + pad - left;
      const height = Math.max(...ys) + pad - top;
      const shift = (p: [number, number]): [number, number] => [
        p[0] - left,
        p[1] - top,
      ];
      const body = catmullRomPath(pts.map(shift));
      const head = `M ${(arm1[0] - left).toFixed(1)} ${(arm1[1] - top).toFixed(1)} L ${(endX - left).toFixed(1)} ${(endY - top).toFixed(1)} L ${(arm2[0] - left).toFixed(1)} ${(arm2[1] - top).toFixed(1)}`;
      const g1 = Math.min(0.9, Math.max(0.05, (boundaryY - 26 - top) / height));
      const g2 = Math.min(0.95, Math.max(0.1, (boundaryY + 30 - top) / height));

      const next: ArrowGeometry = { left, top, width, height, body, head, g1, g2 };
      setArrow((prev) =>
        prev &&
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.body === next.body
          ? prev
          : next,
      );
    };

    measure();
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    [pageRef.current, offerTitleRef.current, offerGridRef.current, stepsRef.current].forEach(
      (el) => el && ro.observe(el),
    );
    // Stabilisation tardive : polices Google puis animations
    // d'entrée achevées (les mesures sont déjà exactes — le titre
    // est mesuré via ses spans non transformés — mais on resserre
    // encore la précision une fois tout posé).
    const timers = [350, 1000, 2000].map((ms) => window.setTimeout(measure, ms));
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready
        .then(() => measure())
        .catch(() => undefined);
    }
    return () => {
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      ro.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div ref={pageRef} className="relative">
      {/* ---------- 1. En-tête de page : titre + « Réserver Un Appel » ---------- */}
      <PageHero
        eyebrow="MÉTHODE · COMMENT JE TRAVAILLE"
        title="Processus : des sites web pensés pour convertir"
      >
        {/* Bouton blanc style header (pastille flèche ↗ à l'intérieur
            droite) — ouvre la réservation d'appel Calendly, comme le
            libellé l'annonce. */}
        <StartProjectButton
          label="Réserver Un Appel"
          ariaLabel="Réserver un appel stratégique de 30 minutes avec Stevens Akpovi"
          onClick={() => calendly.openCalendly()}
          className="min-h-[52px]"
        />
      </PageHero>

      {/* ---------- 2. Les trois cadres de l'offre + titre/bouton ---------- */}
      <section
        aria-label="Offre : site web professionnel, page de vente et refonte de site web"
        className="section-light bg-grid-light py-20 sm:py-24 lg:py-32"
      >
        <div className="container-site">
          <div
            ref={offerGridRef}
            className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20"
          >
            {/* Colonne gauche : les trois cadres actuels de l'offre
                (ex-page Services), reproduits en colonne — les mêmes
                cartes que la section « DES SOLUTIONS ADAPTÉES À VOS
                OBJECTIFS » de l'accueil (demande de l'éditeur). */}
            <div className="flex flex-col gap-4">
              {SERVICES_SUMMARY.items.map((service, i) => {
                const Icon = SERVICE_ICONS[i] ?? Building2;
                return (
                  <Reveal key={service.title} direction="up" delay={i * 0.05} as="article">
                    <div className="group flex h-full flex-col gap-4 rounded-2xl border border-[#e4e4e4] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(28,28,28,0.3)] sm:flex-row sm:items-start sm:gap-5 sm:p-7">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1c1c1c] text-[#e4e4e4] transition-colors duration-300 group-hover:bg-[#e4e4e4] group-hover:text-[#1c1c1c]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-lg font-semibold text-[#1c1c1c]">
                            {service.title}
                          </h3>
                          <span className="font-display text-sm font-semibold text-[#525252]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="mt-2.5 text-sm leading-relaxed text-[#555555]">
                          {service.text}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Colonne droite : titre + bouton « Demander Un Devis ».
                ANCRE DE LA FLÈCHE : c'est la FIN de ce titre que la
                flèche sinusoïdale quitte pour pointer la section
                méthode ci-dessous (mesure DOM, voir en tête de
                fichier). */}
            <div ref={offerTitleRef} className="flex flex-col justify-center lg:py-4">
              <Reveal direction="left">
                <p className="text-eyebrow">DES SITES WEB QUI VENDENT</p>
              </Reveal>
              <RevealText
                as="h2"
                text="Voici comment je crée des sites web qui génèrent des ventes."
                delay={0.08}
                className="text-section-title mt-4 max-w-xl text-[#1c1c1c]"
              />
              <Reveal direction="up" delay={0.16}>
                <p className="text-body mt-5 max-w-xl text-[#555555]">
                  Chaque projet suit la même exigence : comprendre votre activité, concevoir un
                  parcours clair et amener vos visiteurs à passer à l'action.
                </p>
                <div className="mt-8">
                  <CTAButton
                    action={{ kind: "page", page: "devis" }}
                    variant="ghostDark"
                    size="lg"
                  >
                    Demander Un Devis
                  </CTAButton>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 3. « COMMENT JE TRAVAILLE » : grand titre vertical +
          déroulés (demande de l'éditeur, 15/11/2026) ----------
          À gauche, le titre en GRANDE taille, EN GRAS, écrit
          verticalement (du bas vers le haut) ; puis un trait vertical
          de séparation à extrémités fondues qui s'étend EXACTEMENT à
          la hauteur de la liste des étapes ; puis la liste. Le MÊME
          espace (48 px, légèrement agrandi le 16/11/2026) sépare le
          trait du titre et le trait de la liste. L'ENSEMBLE
          (titre + trait + liste) est CENTRÉ horizontalement dans la
          page (demande de l'éditeur, 16/11/2026) — plus rien n'est
          rangé à gauche. Sur mobile : titre horizontal, trait de
          séparation horizontal fondu, déroulés.
          FLÈCHE SINUSOÏDALE CROISSANTE (demande de l'éditeur,
          16/11/2026, RE-ANCRÉE le 17/11) : elle ne part PLUS du
          titre vertical de cette section — elle quitte la FIN DU
          TITRE de la section « DES SITES WEB QUI VENDENT »
          ci-dessus et vient pointer la PREMIÈRE CARTE de cette
          liste (trajet mesuré au DOM, voir le bloc « flèche » en
          tête de fichier). Cette section est l'arrivée : son haut
          sert de cible à la pointe et sa frontière (clair → sombre)
          détermine la transition du dégradé du trait. */}
      <section
        ref={methodSectionRef}
        aria-labelledby="methode-processus-titre"
        className="section-dark relative py-20 sm:py-24 lg:py-32"
      >
        {/* Barre de séparation à extrémités fondues — comme toutes les
            barres de séparation du site. */}
        <div aria-hidden="true" className="separator-fade absolute inset-x-0 top-0" />
        <div className="container-site">
          <div className="lg:flex lg:items-start lg:justify-center lg:gap-12">
            {/* Titre vertical (bureau) — du bas vers le haut, GRANDE
                taille, EN GRAS (demande de l'éditeur, 16/11/2026). */}
            <div className="hidden shrink-0 items-center py-1 lg:flex">
              <h2
                id="methode-processus-titre"
                className="font-display text-[clamp(2.25rem,3vw,3.25rem)] font-bold leading-tight tracking-[0.01em] text-white [writing-mode:vertical-rl] rotate-180"
              >
                Comment Je Travaille
              </h2>
            </div>

            {/* Trait vertical de séparation — fondu en haut et en bas,
                exactement à la hauteur de la liste (self-stretch). */}
            <div
              aria-hidden="true"
              className="hidden w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-[#e4e4e4]/40 to-transparent lg:block"
            />

            {/* Titre horizontal (mobile/tablette) + trait fondu */}
            <div className="lg:hidden">
              <h2 id="methode-processus-titre" className="text-section-title text-white">
                Comment Je Travaille
              </h2>
              <div aria-hidden="true" className="separator-fade mt-6" />
            </div>

            {/* Les six étapes à accordéon « + »/« − » — mêmes cartes que
                la section « Comment Je Travaille » de l'accueil. Le
                même espace (gap-12, 48 px — un peu plus que les 40 px
                d'avant, demande de l'éditeur 16/11/2026) sépare le
                trait du titre et le trait de la liste. Largeur fixe
                sur bureau : avec justify-center, l'ensemble
                titre + trait + liste est centré dans la page.
                CIBLE DE LA FLÈCHE : son haut reçoit la pointe (voir
                le bloc « flèche » en tête de fichier). */}
            <ol ref={stepsRef} className="mt-10 flex w-full flex-col gap-4 lg:mt-0 lg:w-[min(768px,62vw)]">
              {SOLUTION.steps.map((step, i) => {
                const isOpen = open === i;
                return (
                  <Reveal key={step.name} direction="left" delay={0.06 * i} as="li">
                    <div
                      className={`relative overflow-hidden rounded-2xl border bg-[#232323] transition-colors duration-300 ${
                        isOpen ? "border-[#e4e4e4]/35" : "border-[#e4e4e4]/12"
                      }`}
                    >
                      {/* Numérotation stylisée — angle supérieur gauche */}
                      <span
                        aria-hidden="true"
                        className="font-display pointer-events-none absolute -left-2 -top-6 select-none text-[5.5rem] font-bold leading-none text-[#e4e4e4]/10"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        aria-controls={`process-etape-panneau-${i}`}
                        id={`process-etape-bouton-${i}`}
                        className="relative flex w-full items-center justify-between gap-4 px-6 py-6 text-left focus-visible:outline-2 focus-visible:outline-offset-4 sm:px-8"
                      >
                        <span className="font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                          {step.name}
                        </span>
                        {/* Bascule « + »/« − » à droite de la carte */}
                        <span
                          aria-hidden="true"
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                            isOpen
                              ? "border-[#e4e4e4] bg-[#e4e4e4] text-[#1c1c1c]"
                              : "border-[#e4e4e4]/25 text-[#e4e4e4]"
                          }`}
                        >
                          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </span>
                      </button>

                      {/* Panneau : hauteur animée via grid-template-rows */}
                      <div
                        id={`process-etape-panneau-${i}`}
                        role="region"
                        aria-labelledby={`process-etape-bouton-${i}`}
                        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-6 pb-7 sm:px-8">
                            <RichText
                              text={step.text}
                              className="max-w-xl text-[15px] leading-relaxed text-[#c8c8c8]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- 4. MES RÉALISATIONS (avant l'appel à l'action,
          demande de l'éditeur, 15/11/2026) : les projets présentés
          avec leurs mockups — les mêmes cartes que la section
          « PROJETS RÉALISÉS » de l'accueil (grande capture en
          couleur, nom, catégorie, bouton « Voir Le Projet ») —
          alignés VERTICALEMENT, un projet par ligne. ---------- */}
      <section
        aria-label="Sites web que j'ai créés — mes réalisations"
        className="section-bright py-20 sm:py-24 lg:py-32"
      >
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-[0.62fr_1.38fr] lg:items-start lg:gap-16 xl:gap-20">
            {/* Colonne gauche : titre + bouton */}
            <div className="lg:sticky lg:top-28">
              <Reveal direction="up">
                <p className="text-eyebrow">MES RÉALISATIONS</p>
              </Reveal>
              <RevealText
                as="h2"
                text="Sites web que j'ai créés."
                delay={0.08}
                className="text-section-title mt-4 max-w-md text-[#1c1c1c]"
              />
              <Reveal direction="up" delay={0.16}>
                <div className="mt-8">
                  <CTAButton
                    action={{ kind: "page", page: "realisations" }}
                    variant="dark"
                    size="lg"
                  >
                    Voir Plus De Projets
                  </CTAButton>
                </div>
              </Reveal>
            </div>

            {/* Colonne droite : les trois réalisations avec leurs
                mockups, empilées verticalement. */}
            <div className="flex flex-col gap-6">
              {PROJECTS.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 5. Appel à l'action « Franchissons ensemble… »
          (APRÈS la section réalisations, demande de l'éditeur,
          15/11/2026) ---------- */}
      <section aria-labelledby="process-cta-titre" className="section-deep relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="container-site relative text-center">
          <Reveal direction="up">
            <p className="text-eyebrow">PARLONS DE VOTRE PROJET</p>
            <h2 id="process-cta-titre" className="text-section-title mx-auto mt-4 max-w-2xl text-white">
              Franchissons ensemble la première étape.
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.12}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg">
                Réserver Un Appel
              </CTAButton>
              <CTAButton action={{ kind: "page", page: "devis" }} variant="secondary" size="lg">
                Demander Un Devis Personnalisé
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FLÈCHE SINUSOÏDALE : fin du titre « Voici comment je crée des
          sites web qui génèrent des ventes. » → première carte de la
          liste des étapes. Position et trajet mesurés au DOM (voir le
          bloc « flèche » en tête de fichier) ; dégradé sombre → clair
          exactement à la frontière des deux sections. Décorative :
          aria-hidden, pointer-events-none ; bureau uniquement. */}
      {arrow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-20 hidden lg:block"
          style={{
            left: arrow.left,
            top: arrow.top,
            width: arrow.width,
            height: arrow.height,
          }}
        >
          <Reveal direction="fade" amount={0.15} className="h-full w-full">
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${Math.round(arrow.width)} ${Math.round(arrow.height)}`}
              fill="none"
            >
              <defs>
                <linearGradient
                  id="fleche-methode"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={Math.round(arrow.height)}
                >
                  {/* Section claire : encre sombre ; section sombre :
                      gris clair — contraste affirmé sur les deux fonds
                      (trait 3 px, retour du 17/11 : le 2,5 px à 0,6
                      paraissait trop effacé au rendu). */}
                  <stop offset={arrow.g1} stopColor="#1c1c1c" stopOpacity="0.72" />
                  <stop offset={arrow.g2} stopColor="#e4e4e4" stopOpacity="0.75" />
                </linearGradient>
              </defs>
              <path
                d={arrow.body}
                stroke="url(#fleche-methode)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={arrow.head}
                stroke="url(#fleche-methode)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Reveal>
        </div>
      )}
    </div>
  );
}
