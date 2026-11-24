#!/usr/bin/env python3
"""VOLET 14 — RECONSTRUCTION : applique TOUTES les modifications du
volet 14 aux fichiers existants du dépôt (clone propre 9133c3c).

Ancres validées lors de la première passe (session recyclée) :
« on pointe le doigt » (R1), « 36 % de\\n *   la largeur » (R2).
Échoue bruyamment si une ancre manque — aucun changement silencieux.
"""

import io, sys

def charge(chemin):
    with io.open(chemin, encoding="utf-8") as f:
        return f.read()

def ecrit(chemin, contenu):
    with io.open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)

def remplace(c, ancien, nouveau, et, chemin=""):
    if ancien not in c:
        print(f"ÉCHEC ancre : {et} ({chemin})"); sys.exit(1)
    if c.count(ancien) != 1:
        print(f"ÉCHEC ancre non unique ({c.count(ancien)}×) : {et}"); sys.exit(1)
    print(f"OK : {et}")
    return c.replace(ancien, nouveau)

# ================================================================
# 1. src/lib/site.ts — mockups hero (AFRIBAYIT) + variante 640
# ================================================================
p = "src/lib/site.ts"
c = charge(p)
c = remplace(c,
"""/** Les quatre réalisations réelles — données factuelles uniquement.
 *  Ajout du 24/11/2026 (volet 13) : ALEXANDRE MOREL
 *  (journalistefr.vercel.app) AJOUTÉ EN FIN de tableau — l'ordre
 *  compte : les mockups du hero référencent PROJECTS[0] (navigateur,
 *  MR STEVE ENGLISH) et PROJECTS[2] (smartphone, AFRIBAYIT) par
 *  index ; tout ajout en tête aurait CHANGÉ les images du hero. */""",
"""/** Les quatre réalisations réelles — données factuelles uniquement.
 *  Ajout du 24/11/2026 (volet 13) : ALEXANDRE MOREL
 *  (journalistefr.vercel.app) AJOUTÉ EN FIN de tableau.
 *  VOLET 14 (24/11/2026) : les DEUX mockups épinglés du hero
 *  référencent désormais le MÊME projet — AFRIBAYIT (demande de
 *  l'éditeur : « le même site, le même mockup que le mockup
 *  téléphone […] la version desktop du mockup téléphone ») — le
 *  navigateur et le smartphone référencent PROJECTS[2] par index.
 *  Tout ajout EN TÊTE changerait donc les images du hero. */""",
"site.ts commentaire mockups", p)
c = remplace(c,
"""    desktop: "/assets/projects/afribayit-desktop.webp",
    desktop2x: "/assets/projects/afribayit-desktop@2x.webp",
    mobile: "/assets/projects/afribayit-mobile.webp",""",
"""    desktop: "/assets/projects/afribayit-desktop.webp",
    desktop2x: "/assets/projects/afribayit-desktop@2x.webp",
    /* Variante légère 640 px (volet 14, 24/11/2026) : le mockup
       NAVIGATEUR du hero affiche désormais ce projet (même projet
       que le mockup téléphone, demande de l'éditeur) — candidat
       d'entrée du srcset, affiché à 130-290 px CSS. Générée par
       scripts/prepare-afribayit-640-volet14.mjs (WebP q82, 35 Ko). */
    desktopSmall: "/assets/projects/afribayit-desktop-640.webp",
    mobile: "/assets/projects/afribayit-mobile.webp",""",
"site.ts desktopSmall afribayit", p)
ecrit(p, c)

# ================================================================
# 2. src/content/site-content.ts — HERO.h1Lines (titre 3 lignes)
# ================================================================
p = "src/content/site-content.ts"
c = charge(p)
c = remplace(c,
"""export const HERO = {
  eyebrow: "CONCEPTION DE SITES WEB PROFESSIONNELS",
  h1: "Je crée des Sites Web Professionnels qui Génèrent des Ventes.",
  /** Partie du titre en gras (700) — le reste reste en graisse normale. */
  h1Bold: "qui Génèrent des Ventes.",""",
"""export const HERO = {
  eyebrow: "CONCEPTION DE SITES WEB PROFESSIONNELS",
  h1: "Je crée des Sites Web Professionnels qui Génèrent des Ventes.",
  /** VOLET 14 (24/11/2026) — titre TOUJOURS en TROIS LIGNES, sur
   *  TOUTES les tailles d'écran (demande de l'éditeur : « peu
   *  importe la taille d'écran mobile, tablette ou desktop, je veux
   *  que le titre du hero soit toujours en trois lignes. La première
   *  ligne ce sera la portion du titre “Je crée des sites web”. Et
   *  la deuxième ligne sera la portion du titre “professionnels
   *  qui” et la troisième ligne portera la portion du titre
   *  “génèrent des ventes” »). La casse d'origine du titre (celle
   *  que les moteurs indexent depuis le premier jour) est
   *  conservée — seuls les SAUTS DE LIGNE sont imposés, par des
   *  <span class="block"> (RevealText prop `lines`). h1 (ci-dessus)
   *  reste la source du texte complet ; h1Lines doit vérifier
   *  h1 === h1Lines.join(" ") (contrôle de cohérence en sonde). */
  h1Lines: ["Je crée des Sites Web", "Professionnels qui", "Génèrent des Ventes."],
  /** Partie du titre en gras (700) — le reste reste en graisse normale. */
  h1Bold: "qui Génèrent des Ventes.",""",
"site-content.ts h1Lines", p)
ecrit(p, c)

# ================================================================
# 3. src/components/motion/Reveal.tsx — RevealText avec `lines`
#    (le composant est le DERNIER du fichier : remplacer de son
#    commentaire d'en-tête à la fin)
# ================================================================
p = "src/components/motion/Reveal.tsx"
c = charge(p)
i = c.find("/** Révélation mot à mot")
assert i > 0, "RevealText introuvable"
nouveau_composant = '''/** Révélation mot à mot pour les titres (dévoilement progressif des textes).
 *  `boldText` : fragment final du texte à afficher en gras (700) — le reste
 *  du titre reste en graisse normale (400), quel que soit le poids porté
 *  par la classe du conteneur.
 *  `lines` (volet 14, 24/11/2026) : SAUTS DE LIGNE IMPOSÉS — chaque
 *  chaîne du tableau occupe sa PROPRE LIGNE (<span class="block">),
 *  quel que soit l'écran (demande de l'éditeur : le titre du hero
 *  reste TOUJOURS en trois lignes, mobile / tablette / bureau).
 *  `lines.join(" ")` doit reconstituer le texte complet ; le repérage
 *  du fragment en gras se fait sur ce texte reconstitué, il peut donc
 *  chevaucher deux lignes sans perdre un mot. Sans `lines`, le rendu
 *  des appelants existants est strictement inchangé. */
export function RevealText({
  text,
  lines,
  boldText,
  className,
  as: Tag = "span",
  delay = 0,
  id,
  aboveFold = false,
}: {
  text: string;
  /** Découpage du texte en lignes imposées (optionnel — volet 14). */
  lines?: string[];
  boldText?: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  delay?: number;
  /** Identifiant DOM du titre — nécessaire quand une section le
   *  désigne par aria-labelledby (ex. page Réservation d'appel,
   *  audit intégral du 18/11/2026). */
  id?: string;
  /** Titre visible dès le premier rendu : cascade de mots en
   *  animation CSS, sans attendre l'hydratation (volet 7). */
  aboveFold?: boolean;
}) {
  const reduce = useReducedMotion();
  const { ref, inView, animated } = useInView<HTMLElement>(0.3);
  const Comp = Tag as React.ElementType;

  const useLines = Boolean(lines && lines.length > 0);

  // Découpage pur : tête (graisse normale) + partie en gras, dans
  // l'ordre du texte d'origine. VOLET 14 : la construction se fait
  // LIGNE PAR LIGNE avec des décalages cumulés sur le texte
  // reconstitué — le fragment en gras reste gras exactement là où il
  // se trouve, même à cheval sur deux lignes.
  const sourceLines = useLines ? lines! : [text];
  const fullText = sourceLines.join(" ");
  const boldStart = boldText ? fullText.indexOf(boldText) : -1;
  const hasBold = boldStart >= 0;

  const perLine: { word: string; bold: boolean }[][] = [];
  let offset = 0;
  for (const line of sourceLines) {
    const wordsInLine: { word: string; bold: boolean }[] = [];
    for (const word of line.split(" ")) {
      if (!word) continue;
      wordsInLine.push({
        word,
        bold: hasBold && offset >= boldStart && offset < boldStart + boldText!.length,
      });
      offset += word.length + 1;
    }
    perLine.push(wordsInLine);
  }
  const entries = perLine.flatMap((wordsInLine, line) =>
    wordsInLine.map((e) => ({ ...e, line })),
  );
  const totalWords = entries.length;

  if (reduce) {
    if (useLines) {
      return (
        <Comp className={className} ref={ref} id={id}>
          {perLine.map((wordsInLine, li) => (
            <span key={li} className="block">
              {wordsInLine.map(({ word, bold }, k) => (
                <React.Fragment key={`${k}-${word}`}>
                  {k > 0 ? " " : ""}
                  <span style={bold ? { fontWeight: 700 } : undefined}>{word}</span>
                </React.Fragment>
              ))}
            </span>
          ))}
        </Comp>
      );
    }
    return (
      <Comp className={className} ref={ref} id={id}>
        {hasBold ? (
          <>
            {fullText.slice(0, boldStart)}
            <span style={{ fontWeight: 700 }}>{boldText}</span>
          </>
        ) : (
          fullText
        )}
      </Comp>
    );
  }

  if (aboveFold) {
    // Volet 7 : cascade de mots en animations CSS (reveal-fold-word)
    // — même cadence (35 ms/mot), même durée (550 ms), même courbe que
    // la version scroll, mais déclenchée au premier rendu (rien sur le
    // chemin critique : ni hydratation, ni IntersectionObserver).
    // Volet 14 : avec `lines`, chaque ligne imposée est un conteneur
    // de niveau BLOC — la cascade continue de mot à mot à travers les
    // lignes (index global).
    if (useLines) {
      // Compteur global : la cadence de la cascade (35 ms/mot) traverse
      // les lignes sans repartir de zéro à chaque ligne imposée.
      let idx = 0;
      return (
        <Comp className={className} id={id}>
          {perLine.map((wordsInLine, li) => (
            <span key={li} className="block">
              {wordsInLine.map(({ word, bold }) => {
                const i = idx++;
                return (
                  <span key={`${i}-${word}`} className="inline-block overflow-hidden align-bottom">
                    <span
                      className="reveal-fold-word inline-block"
                      style={{
                        animationDelay: `${delay + i * 35}ms`,
                        fontWeight: hasBold ? (bold ? 700 : 400) : undefined,
                      }}
                    >
                      {word}
                      {i < totalWords - 1 ? "\\u00A0" : ""}
                    </span>
                  </span>
                );
              })}
            </span>
          ))}
        </Comp>
      );
    }
    return (
      <Comp className={className} id={id}>
        {entries.map(({ word, bold }, i) => (
          <span key={`${i}-${word}`} className="inline-block overflow-hidden align-bottom">
            <span
              className="reveal-fold-word inline-block"
              style={{
                animationDelay: `${delay + i * 35}ms`,
                fontWeight: hasBold ? (bold ? 700 : 400) : undefined,
              }}
            >
              {word}
              {i < entries.length - 1 ? "\\u00A0" : ""}
            </span>
          </span>
        ))}
      </Comp>
    );
  }

  return (
    <Comp className={className} ref={ref} id={id}>
      {entries.map(({ word, bold }, i) => {
        const wordDelay = delay + i * 35;
        const transition = animated
          ? `transform 550ms ${EASE} ${wordDelay}ms, opacity 550ms ${EASE} ${wordDelay}ms`
          : "none";
        const style: React.CSSProperties = inView
          ? {
              transform: "translateY(0)",
              opacity: 1,
              transition,
              fontWeight: hasBold ? (bold ? 700 : 400) : undefined,
            }
          : {
              transform: "translateY(0.9em)",
              opacity: 0,
              transition: "none",
              fontWeight: hasBold ? (bold ? 700 : 400) : undefined,
            };
        return (
          <span key={`${i}-${word}`} className="inline-block overflow-hidden align-bottom">
            <span className="inline-block" style={style}>
              {word}
              {i < entries.length - 1 ? "\\u00A0" : ""}
            </span>
          </span>
        );
      })}
    </Comp>
  );
}
'''
c = c[:i] + nouveau_composant
ecrit(p, c)
print("OK : Reveal.tsx RevealText avec lignes")

# ================================================================
# 4. src/components/home/Hero.tsx — remodelage complet (R1→R11)
# ================================================================
p = "src/components/home/Hero.tsx"
c = charge(p)

c = remplace(c,
""" *   capables de survoler, retour progressif à la couleur + zoom
 *   léger (scale 1.035) au survol ; sur MOBILE/TACTILE (demande de
 *   l'éditeur : « sur mobile que ce soit en blanc noir. Et quand
 *   on pointe le doigt dessus, ça va afficher sa couleur
 *   originale. Et quand on relâche, ça va revenir au blanc
 *   noir »), la couleur n\u2019apparaît que PENDANT L'APPUI du doigt
 *   (:active), sans zoom, puis la photo revient au noir et blanc
 *   au relâchement (règle .mono-touch de globals.css).""",
""" *   capables de survoler, retour progressif à la couleur + zoom
 *   léger (scale 1.035) au survol. VOLET 14 (24/11/2026) : toutes
 *   les images du site, celle-ci comprise, sont désormais en NOIR
 *   ET BLANC PAR DÉFAUT SUR TOUS LES ÉCRANS (mobile et tablette
 *   compris) — au SURVOL (bureau) ou à L'APPUI SIMPLE (mobile /
 *   tablette : un appui révèle la couleur, un appui À L'EXTÉRIEUR
 *   de l'image la fait revenir au noir et blanc), via la classe
 *   .couleur-active et le composant InteractionCouleurs. L'ancien
 *   comportement « couleur seulement pendant l'appui » (.mono-touch,
 *   volet 13) est supprimé au profit de ce basculement durable.""",
"Hero R1 comportement couleur", p)

c = remplace(c,
"""MOCKUPS ÉPINGLÉS (16/11/2026, modifié le 24/11/2026 — volet 13) :
 *   les deux mockups (navigateur et smartphone) sont désormais
 *   TOUJOURS en COULEURS ORIGINALES sur tous les écrans (prop
 *   `color` — plus aucun noir et blanc) : demande de l'éditeur,
 *   « les deux mockups qui sont épinglés sur l'image seront
 *   exclusivement en leurs couleurs originales ». Le mockup
 *   NAVIGATEUR reste réduit pour ne pas cacher l'image : 36 % de
 *   la largeur de l'image sur mobile, 40 % sur tablette, 52 % sur
 *   bureau (portrait vertical) ; le SMARTPHONE : 19 / 20 / 24 %""",
"""MOCKUPS ÉPINGLÉS (16/11/2026, volets 13 puis 14) : les deux
 *   mockups (navigateur et smartphone) sont TOUJOURS en COULEURS
 *   ORIGINALES sur tous les écrans (prop `color`). VOLET 14
 *   (24/11/2026) : ils présentent désormais le MÊME projet —
 *   AFRIBAYIT, la plateforme immobilière (demande de l'éditeur :
 *   « le mockup desktop sera le mockup du projet de la plateforme
 *   immobilière, c'est-à-dire le même site, le même mockup que le
 *   mockup téléphone qui est épinglé de l'autre côté. Donc ce sera
 *   la version desktop du mockup téléphone ») — jamais deux
 *   projets différents sur les deux appareils épinglés. Le mockup
 *   NAVIGATEUR reste réduit pour ne pas cacher l'image : 36 % de
 *   la largeur de l'image sur mobile, 40 % sur tablette, 52 % sur
 *   bureau (portrait vertical) ; le SMARTPHONE : 19 / 20 / 24 %""",
"Hero R2 mockups épinglés", p)

c = remplace(c,
'          <div className="order-1 lg:col-start-1 lg:row-start-1 lg:relative lg:z-10">\n',
'          <div className="order-1 lg:col-start-1 lg:row-start-1 lg:relative lg:z-10">\n'
"            {/* VOLET 14 (24/11/2026) — RYTHME VERTICAL RESPONSIVE : les\n"
"                espacements du bloc texte (étoiles→titre, titre→description,\n"
"                description→CTA) sont des marges FLUIDES en clamp(), sans\n"
"                aucun palier par breakpoint — demande de l'éditeur : « il ne\n"
"                faut pas qu'on arrive sur une taille d'écran et constate que\n"
"                l'espace devient plus large. Il faut que ce soit normal,\n"
"                cohérent, responsive et vraiment adaptable » (mobile,\n"
"                tablette ET bureau). */}\n",
"Hero R3 note rythme", p)

c = remplace(c,
"""            <RevealText
              as="h1"
              text={HERO.h1}
              boldText={HERO.h1Bold}
              delay={0.08}
              aboveFold
              className="text-hero-title-viewport mt-1.5 text-white sm:mt-4"
            />""",
"""            {/* VOLET 14 : titre TOUJOURS en TROIS LIGNES imposées
                (HERO.h1Lines, prop `lines` de RevealText) — « Je crée
                des Sites Web » / « Professionnels qui » / « Génèrent
                des Ventes. » — quelle que soit la taille d'écran ;
                l'espace étoiles→titre devient fluide (clamp). */}
            <RevealText
              as="h1"
              text={HERO.h1}
              lines={HERO.h1Lines as readonly string[] as unknown as string[]}
              boldText={HERO.h1Bold}
              delay={0.08}
              aboveFold
              className="text-hero-title-viewport mt-[clamp(0.375rem,1.2vw,1.05rem)] text-white"
            />""",
"Hero R4 H1 trois lignes", p)

c = remplace(c,
'        <div className="grid items-center gap-2.5 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-7 xl:gap-9">',
'        <div className="grid items-center gap-2.5 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-x-7 lg:gap-y-[clamp(1.25rem,2vw,2.25rem)] xl:gap-x-9">',
"Hero R5 gap-y fluide", p)

c = remplace(c,
"""              (demande de l'éditeur, 15/11/2026 — l'ancienne marge
              fixe de 144 px sur tablette était trop spacieuse). */}""",
"""              (demande de l'éditeur, 15/11/2026 — l'ancienne marge
              fixe de 144 px sur tablette était trop spacieuse).
              VOLET 14 (24/11/2026) — RESPIRATION AU-DESSUS DE L'IMAGE
              SUR BUREAU : marge haute FLUIDE (clamp en svh) au-dessus
              du bloc visuel complet, plaque comprise — demande de
              l'éditeur : « sur desktop il faut augmenter l'espace
              qu'il y a au-dessus de l'ensemble de l'image, même avec
              le fond arrière, parce que ça ne respire pas ». La marge
              suit la hauteur de l'écran, comme l'image (svh) : le
              hero continue de tenir sans défilement. */}""",
"Hero R6 note respiration", p)

c = remplace(c,
'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-none',
'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-[clamp(1.75rem,4.5svh,3.5rem)] lg:max-w-none',
"Hero R6b marge haute clamp", p)

c = remplace(c,
"""                  Les deux sont enveloppées dans .mono-media : effet
                  de survol — noir et blanc sur bureau, retour à la
                  couleur + zoom léger au survol, couleur naturelle
                  sur tactile. Celle qui est masquée en display:none""",
"""                  Les deux sont enveloppées dans .mono-media : noir
                  et blanc par défaut sur TOUS les écrans (volet 14),
                  couleur + zoom léger au survol (bureau) ou à
                  l'appui simple (mobile/tablette — .couleur-active,
                  composant InteractionCouleurs). Celle qui est
                  masquée en display:none""",
"Hero R7 commentaire image", p)

assert c.count('className="mono-media mono-touch block"') == 2, "spans mono-touch introuvables"
c = c.replace('className="mono-media mono-touch block"', 'className="mono-media block"')
print("OK : Hero R7b retrait .mono-touch (2×)")

c = remplace(c,
"""              {/* Mockup navigateur épinglé — MR STEVE ENGLISH (coin
                  bas-gauche). Animation 2-3 s : jeté sur l'image
                  (arrive en gros, de face, et atterrit en rebond
                  pour l'épingler), puis balancement continu
                  gauche-droite autour de son point d'appui haut.
                  Couleurs originales PERMANENTES sur tous les écrans
                  (volet 13, 24/11/2026 : prop `color` remplace
                  `pinMono` — demande de l'éditeur : « les deux
                  mockups […] exclusivement en leurs couleurs
                  originales »). RÉDUIT sur mobile — trop large, il
                  cachait l'image horizontale : 36 % de la largeur
                  de l'image sur mobile, 40 % sur tablette, 52 % sur
                  bureau (portrait vertical). */}""",
"""              {/* Mockup navigateur épinglé — AFRIBAYIT, VERSION
                  DESKTOP du même projet que le mockup téléphone
                  (coin bas-gauche). VOLET 14 (24/11/2026) : demande
                  de l'éditeur — « on ne veut pas avoir des projets
                  différents sur différents mockups. On veut le même
                  projet affiché sur différents appareils ». Avant :
                  MR STEVE ENGLISH (PROJECTS[0]) ; désormais :
                  PROJECTS[2] — AFRIBAYIT, la plateforme immobilière,
                  comme le smartphone épinglé de l'autre côté.
                  Animation 2-3 s : jeté sur l'image (arrive en gros,
                  de face, et atterrit en rebond pour l'épingler),
                  puis balancement continu gauche-droite autour de
                  son point d'appui haut. Couleurs originales
                  PERMANENTES (prop `color`). RÉDUIT sur mobile : 36 %
                  de la largeur de l'image sur mobile, 40 % sur
                  tablette, 52 % sur bureau (portrait vertical). */}""",
"Hero R8 commentaire navigateur", p)

c = remplace(c,
"""                  <BrowserMockup
                    src={PROJECTS[0].desktop}
                    src2x={PROJECTS[0].desktop2x}
                    srcSmall={PROJECTS[0].desktopSmall}
                    srcSmallWidth={640}
                    alt={`Aperçu du site ${PROJECTS[0].name}`}
                    url={PROJECTS[0].url}""",
"""                  <BrowserMockup
                    src={PROJECTS[2].desktop}
                    src2x={PROJECTS[2].desktop2x}
                    srcSmall={PROJECTS[2].desktopSmall}
                    srcSmallWidth={640}
                    alt={`Aperçu du site ${PROJECTS[2].name} — plateforme immobilière`}
                    url={PROJECTS[2].url}""",
"Hero R8b BrowserMockup → PROJECTS[2]", p)

c = remplace(c,
"""              {/* Mockup smartphone épinglé — AFRIBAYIT (coin
                  haut-droit). Animation 3-4 s : jeté sur l'image à
                  son tour, puis balancement continu décalé.
                  Couleurs originales PERMANENTES sur tous les écrans
                  (volet 13, 24/11/2026 — prop `color` au lieu de
                  `pinMono`, demande de l'éditeur).""",
"""              {/* Mockup smartphone épinglé — AFRIBAYIT, VERSION
                  MOBILE (coin haut-droit). VOLET 14 : le mockup
                  navigateur affiche désormais la version DESKTOP de
                  CE MÊME projet — les deux appareils épinglés
                  présentent la même plateforme immobilière sur deux
                  écrans différents. Animation 3-4 s : jeté sur
                  l'image à son tour, puis balancement continu
                  décalé. Couleurs originales PERMANENTES (prop
                  `color`, volet 13).""",
"Hero R9 commentaire téléphone", p)

c = remplace(c,
'className="hero-cta mt-2.5 flex flex-nowrap items-center gap-2 sm:mt-5 sm:gap-3 lg:mt-5"',
'className="hero-cta mt-[clamp(0.625rem,2vw,1.4rem)] flex flex-nowrap items-center gap-2 sm:gap-3"',
"Hero R10 clamp CTA", p)

c = remplace(c,
'<ReassuranceBar mention={HERO.reassurance} className="mt-2 sm:mt-4 lg:mt-5" />',
'<ReassuranceBar mention={HERO.reassurance} className="mt-[clamp(0.5rem,1.6vw,1.25rem)]" />',
"Hero R11 clamp réassurance", p)

ecrit(p, c)
print("OK : Hero.tsx remodelé")

# ================================================================
# 5. src/app/globals.css — N&B universel + .couleur-active
# ================================================================
p = "src/app/globals.css"
c = charge(p)

c = remplace(c,
"""/* ============================================================
   COMPORTEMENT DES IMAGES
   Desktop (périphériques avec survol) : noir et blanc par
   défaut, retour progressif à la couleur + zoom léger au
   survol. Mobile / tactile : couleur naturelle directe.
   Double détection : media query standard + classe .hoverable
   posée par un script inline dès le <head> (couvre aussi les
   environnements sans signal de survol).
   ============================================================ */
.mono-media {
  overflow: hidden;
  -webkit-overflow: hidden;
  /* will-change retiré (perf, 15/11/2026) : posé sur des dizaines
     d'images, il réservait autant de couches GPU et ralentissait les
     mobiles — les transitions du filtre/déplacement restent fluides
     sans cette invitation permanente au compositeur. */
}
.mono-media > img,
.mono-media > .media-fill {
  transition:
    filter 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  filter: var(--mono-filter, none);
  transform: scale(var(--mono-scale, 1));
}
/* Périphériques desktop classiques (signal survol + pointeur précis) */
@media (hover: hover) and (pointer: fine) {
  :root {
    --mono-filter: grayscale(1);
    --mono-scale: 1;
  }
}
/* Environnements sans signal tactile (script inline dans <head>) */
html.hoverable {
  --mono-filter: grayscale(1);
  --mono-scale: 1;
}""",
"""/* ============================================================
   COMPORTEMENT DES IMAGES — VOLET 14 (24/11/2026)
   TOUTES les images du site (hors les deux mockups épinglés du
   hero, prop `color` — couleur permanente) sont en NOIR ET BLANC
   PAR DÉFAUT, sur TOUS les écrans — mobile, tablette ET bureau
   (demande de l'éditeur : « dans toutes les images du site, sur
   desktop la couleur originale se révèle au survol. Sur mobile et
   tablette, c'est un appui sur l'image qui va faire révéler la
   vraie couleur de l'image. Et quand on fait encore un appui à
   l'extérieur de l'image, la couleur va revenir en blanc noir ») :
   - bureau (périphérique capable de survol) : la couleur
     originale + un zoom léger se révèlent AU SURVOL ;
   - mobile / tablette : UN APPUI SIMPLE sur l'image révèle la
     couleur (classe .couleur-active, posée par le composant
     InteractionCouleurs) ; UN APPUI À L'EXTÉRIEUR de l'image la
     fait revenir au noir et blanc.
   Double détection du survol : media query standard + classe
   .hoverable posée par un script inline dès le <head> (couvre
   aussi les environnements sans signal de survol).
   ============================================================ */
.mono-media {
  overflow: hidden;
  -webkit-overflow: hidden;
  /* will-change retiré (perf, 15/11/2026) : posé sur des dizaines
     d'images, il réservait autant de couches GPU et ralentissait les
     mobiles — les transitions du filtre/déplacement restent fluides
     sans cette invitation permanente au compositeur. */
}
.mono-media > img,
.mono-media > .media-fill {
  transition:
    filter 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  /* VOLET 14 : noir et blanc par défaut sur TOUS les écrans —
     l'exception tactile « couleur directe » est supprimée ; la
     couleur se révèle au survol (bureau) ou à l'appui simple
     (.couleur-active). L'indirection --mono-filter n'a plus
     d'objet : le filtre est explicite et universel. */
  filter: grayscale(1);
  transform: scale(1);
}
/* Appui simple (mobile / tablette) : couleur DURABLE — la classe
   est posée par InteractionCouleurs au tap sur l'image, retirée au
   tap ailleurs (ou sur une autre image : une seule couleur à la
   fois). Aucun zoom ici : le doigt masque déjà l'image, et la
   demande porte sur la couleur, pas sur l'échelle. */
.mono-media.couleur-active > img,
.mono-media.couleur-active > .media-fill {
  filter: grayscale(0);
}""",
"css E1 base N&B universelle", p)

i = c.find("/* ---------- Variante .mono-touch : N&B AU DOIGTÉ (volet 13,")
j = c.find("/* ---------- Variante .mockup-zoom : zoom léger au survol ----------")
assert 0 < i < j, "bloc .mono-touch introuvable"
c = c[:i] + c[j:]
print("OK : css E3 suppression .mono-touch")

c = remplace(c,
"""  .mono-media:not(.mono-locked):not(.mono-touch) > img,
  .mono-media:not(.mono-locked):not(.mono-touch) > .media-fill {
    filter: none !important;
    transform: none !important;
  }
  .mono-locked > img,
  .mono-locked > .media-fill {
    filter: grayscale(1) !important;
  }""",
"""  /* VOLET 14 : le noir et blanc est un ÉTAT, pas un mouvement —
     il reste appliqué en mouvement réduit (plus de forçage couleur
     par le reset) ; seul le ZOOM (mouvement) est annulé, et la
     révélation .couleur-active reste pleinement fonctionnelle
     (la durée de transition réduite à 0,01 ms la rend instantanée). */
  .mono-media > img,
  .mono-media > .media-fill {
    transform: none !important;
  }
  .mono-locked > img,
  .mono-locked > .media-fill {
    filter: grayscale(1) !important;
  }""",
"css E4 mouvement réduit", p)
ecrit(p, c)

# ================================================================
# 6. src/components/media/Media.tsx — entête sans URL
# ================================================================
p = "src/components/media/Media.tsx"
c = charge(p)
c = remplace(c,
""" *  « réduis l'épaisseur de l'entête appareil du mockup desktop ») :
 *  pastilles et retraits réduits, le contenu capturé occupe
 *  davantage du mockup. */""",
""" *  « réduis l'épaisseur de l'entête appareil du mockup desktop ») :
 *  pastilles et retraits réduits, le contenu capturé occupe
 *  davantage du mockup.
 *  VOLET 14 (24/11/2026) — PLUS D'URL DANS L'ENTÊTE : demande de
 *  l'éditeur — « tous les mockups de projets affichés sur le site,
 *  dans l'entête designée par défaut du mockup, l'URL est affichée.
 *  Je ne veux pas que l'URL soit affichée. Comme pour les mockups
 *  mobiles, les URL ne sont pas affichées. » La pastille de barre
 *  d'adresse reste — MUETTE : un point, aucun texte. La prop `url`
 *  est conservée (compatibilité des appelants) mais plus rendue. */""",
"Media note volet 14", p)
c = remplace(c,
'''  const shortUrl = url.replace(/^https?:\\/\\//, "");
  // Fichiers réels : desktop 1440 px (1x) et 1920 px (@2x vraie densité)''',
'''  // VOLET 14 : plus aucun rendu d'URL dans l'entête (voir la note
  // de documentation ci-dessus) — la prop `url` reste acceptée
  // (compatibilité des appelants) mais n'est plus affichée.
  // Fichiers réels : desktop 1440 px (1x) et 1920 px (@2x vraie densité)''',
"Media suppression shortUrl", p)
c = remplace(c,
'''          <span className="h-1 w-1 shrink-0 rounded-full bg-[#e4e4e4]" />
          {shortUrl}
        </span>''',
'''          <span className="h-1 w-1 shrink-0 rounded-full bg-[#e4e4e4]" />
        </span>''',
"Media pastille muette", p)
ecrit(p, c)

# ================================================================
# 7. src/components/home/WorksSection.tsx — largeur réduite bureau
# ================================================================
p = "src/components/home/WorksSection.tsx"
c = charge(p)
c = remplace(c,
"""        {/* Grille des projets — captures en COULEUR + « Voir Le
            Projet ». QUATRE projets depuis le 24/11/2026 (volet 13 :
            ajout d'ALEXANDRE MOREL) : la grille passe à DEUX colonnes
            (2×2) au lieu de trois — quatre cartes sur une grille de
            trois auraient laissé la quatrième seule orpheline sur sa
            rangée ; deux rangées de deux restent équilibrées à
            toutes les largeurs. */}
        <div className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-2">""",
"""        {/* Grille des projets — captures en COULEUR + « Voir Le
            Projet ». QUATRE projets depuis le 24/11/2026 (volet 13 :
            ajout d'ALEXANDRE MOREL) : la grille passe à DEUX colonnes
            (2×2) au lieu de trois — quatre cartes sur une grille de
            trois auraient laissé la quatrième seule orpheline sur sa
            rangée ; deux rangées de deux restent équilibrées à
            toutes les largeurs.
            VOLET 14 (24/11/2026) — LARGEUR RÉDUITE SUR BUREAU :
            demande de l'éditeur (« les mockups des projets réalisés,
            sur desktop c'est trop trop large. Tu vas réduire ça la
            taille. Réduis la taille un peu ») : la grille passe de
            la pleine largeur du conteneur (cartes de ~575 px à
            1440 px) à max-w-5xl centré (~500 px par carte, −13 %) —
            les captures desktop reprennent une échelle plus naturelle
            sans toucher aux mobiles (une colonne, largeur de l'écran). */}
        <div className="mx-auto mt-12 grid w-full max-w-5xl gap-5 sm:mt-14 md:grid-cols-2">""",
"WorksSection largeur réduite", p)
ecrit(p, c)

# ================================================================
# 8. src/app/layout.tsx — favicon fond noir arrondi
# ================================================================
p = "src/app/layout.tsx"
c = charge(p)
c = remplace(c,
"""  icons: {
    // Paramètre de version : force les navigateurs (cache favicon très
    // rétentif) à recharger l'icône. Version 2026-11-14-2 : fond noir
    // retiré (PNG RGBA transparent, glyphe recadré sur son enveloppe).
    icon: "/assets/favicon.png?v=2026-11-14-2",
    apple: "/assets/favicon.png?v=2026-11-14-2",
  },""",
"""  icons: {
    // VOLET 14 (24/11/2026) — FAVICON À FOND NOIR CONSERVÉ + COINS
    // ARRONDIS. Demande de l'éditeur : « je veux que tu utilises le
    // favicon ayant un fond arrière noir que j'ai uploadé dans le
    // projet. Je veux que tu l'utilises tel qu'il est, sans
    // supprimer le fond arrière noir. Mais tu vas rogner ça pour
    // que ça ait des border radius, le fond arrière noir ait des
    // border radius. » Source : public/assets/Logo Favicon.png
    // (1254×1254, fond noir plein — l'original de l'éditeur) ;
    // dérivée à coins arrondis (rayon 22 %) par
    // scripts/prepare-favicon-volet14.py : le glyphe ET le fond
    // noir sont inchangés, seuls les quatre coins deviennent
    // transparents. NOUVEAU NOM DATÉ (convention du projet) : les
    // navigateurs et les edges rechargent l'icône au lieu de
    // servir l'ancienne version transparente (2026-11-14-2) en
    // cache. L'ancien favicon.png (fond supprimé le 14/11) reste
    // dans le dépôt pour les caches déjà distribués.
    icon: "/assets/favicon-fond-noir-2026-11-24.png?v=volet14",
    apple: "/assets/favicon-fond-noir-2026-11-24.png?v=volet14",
  },""",
"layout favicon fond noir", p)
ecrit(p, c)

# ================================================================
# 9. src/app/page.tsx — montage InteractionCouleurs
# ================================================================
p = "src/app/page.tsx"
c = charge(p)
c = remplace(c,
'''import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePage } from "@/components/home/HomePage";''',
'''import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePage } from "@/components/home/HomePage";
import { InteractionCouleurs } from "@/components/media/InteractionCouleurs";''',
"page import InteractionCouleurs", p)
c = remplace(c,
"""  return (
    <div className="flex min-h-screen flex-col bg-[#1c1c1c] text-white">
      <Header />
      <PageSwitch />
      <Footer />
    </div>
  );""",
"""  return (
    <div className="flex min-h-screen flex-col bg-[#1c1c1c] text-white">
      <Header />
      {/* VOLET 14 (24/11/2026) — révélation de couleur à l'appui sur
          les écrans tactiles : monté UNE fois ici (la branche publique),
          il survit aux changements de page du routeur par fragment —
          ses écouteurs couvrent toutes les images de toutes les pages
          (voir le composant). Rend null : aucun nœud dans le DOM. */}
      <InteractionCouleurs />
      <PageSwitch />
      <Footer />
    </div>
  );""",
"page montage InteractionCouleurs", p)
ecrit(p, c)

# ================================================================
# 10. src/lib/admin-auth.ts — secret dérivé du mot de passe
# ================================================================
p = "src/lib/admin-auth.ts"
c = charge(p)
c = remplace(c,
""" * La route login refuse en amont toute configuration incomplète
 * (message générique, sans préciser QUELLE variable manque — cette
 * information n'appartient qu'au propriétaire via DEPLOIEMENT.md).
 */""",
""" * La route login refuse en amont toute configuration incomplète
 * (message générique, sans préciser QUELLE variable manque — cette
 * information n'appartient qu'au propriétaire via DEPLOIEMENT.md).
 *
 * VOLET 14 (24/11/2026) — ADMIN_SESSION_SECRET DEVIENT OPTIONNEL.
 * Incident de l'éditeur : « ça me met un panneau rouge “espace
 * administrateur non configuré sur cet environnement” alors que
 * j'ai exactement le mot de passe des variables Vercel ». Cause :
 * le fail-closed ci-dessus exigeait DEUX variables ; seul
 * ADMIN_PASSWORD était défini. Désormais, quand ADMIN_SESSION_SECRET
 * est absent (ou trop court), le secret de signature est DÉRIVÉ du
 * mot de passe lui-même (HMAC-SHA256 avec sel interne) : la
 * connexion fonctionne avec le seul mot de passe défini, aucune
 * valeur publique n'est introduite (le dépôt reste impossible à
 * forger), et changer le mot de passe invalide toutes les sessions
 * existantes. Un ADMIN_SESSION_SECRET explicite (≥ 16 caractères)
 * reste prioritaire et annule la dérivation.
 */""",
"admin-auth note volet 14", p)
c = remplace(c,
"""function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null;
  return secret;
}""",
"""/** Sel de dérivation — propre à ce déploiement : le condensat du
 *  mot de passe ne peut pas être réutilisé tel quel ailleurs. */
const SEL_DERIVATION = "stevens-admin-session::v1";

function getSessionSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= MIN_SECRET_LENGTH) return explicit;
  // VOLET 14 : secret dérivé du mot de passe — jamais public (ni le
  // mot de passe ni le sel ne figurent dans le dépôt), et il change
  // automatiquement quand l'éditeur change son mot de passe.
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHmac("sha256", SEL_DERIVATION).update(password).digest("hex");
}""",
"admin-auth dérivation", p)
c = remplace(c,
"""/** Configuration admin complète ? (utilisée par la route login pour
 *  refuser proprement une configuration incomplète, sans oracle.) */
export function isAuthConfigured(): boolean {""",
"""/** Configuration admin complète ? (utilisée par la route login pour
 *  refuser proprement une configuration incomplète, sans oracle.)
 *  VOLET 14 : le MOT DE PASSE seul suffit — le secret de session se
 *  dérive du mot de passe si ADMIN_SESSION_SECRET n'est pas défini. */
export function isAuthConfigured(): boolean {""",
"admin-auth isAuthConfigured note", p)
ecrit(p, c)

# ================================================================
# 11. src/lib/email.ts — copie document (pièce jointe)
# ================================================================
p = "src/lib/email.ts"
c = charge(p)
if "sendDocumentCopy" not in c:
    c += """

/* ---------- VOLET 14 (24/11/2026) — COPIE DES DOCUMENTS
 * COMMERCIAUX (back-office) ----------
 * Système K.Quotes : à chaque document généré (proposition,
 * devis, facture), un exemplaire du PDF est envoyé en pièce jointe
 * à l'adresse personnelle de l'éditeur (SITE.email), en plus du
 * téléchargement automatique dans le navigateur. Resend accepte
 * les pièces jointes en base64 (API REST). */

export async function sendDocumentCopy(opts: {
  subject: string;
  html: string;
  text: string;
  filename: string;
  contenuBase64: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_LABEL,
        to: [SITE.email],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        attachments: [{ filename: opts.filename, content: opts.contenuBase64 }],
      }),
    });
    return res.ok;
  } catch {
    console.error("[email] Échec d'envoi de la copie document via Resend");
    return false;
  }
}
"""
    ecrit(p, c)
    print("OK : email.ts sendDocumentCopy")
else:
    print("OK : email.ts sendDocumentCopy (déjà présent)")

print("\n=== RECONSTRUCTION DES FICHIERS EXISTANTS : TERMINÉE ===")
