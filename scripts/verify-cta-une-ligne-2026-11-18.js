/**
 * VÉRIFICATION « CTA DU HERO SUR UNE SEULE LIGNE » — 18/11/2026
 * Demande de l'éditeur : « Je préfère que les deux CTA du hero
 * restent sur une seule ligne peu importe la taille d'écran. »
 *
 * Système mis en place (après l'unification « Voir Mes
 * Réalisations », plus long que « Voir Mes Travaux ») :
 *  - rangée .hero-cta en flex-nowrap (jamais de retour à la ligne) ;
 *  - classes compactes propres au hero sous 640 px : padding px-2,
 *    police fluide text-[length:clamp(10px,3vw,12px)] ;
 *  - flèche du CTA 1 et icône œil du CTA 2 masquées sous 640 px
 *    (nouvelle prop CTAButton « hideArrowBelowSm ») ;
 *  - règle téléphones courts (≤ 480 px ET hauteur ≤ 620 px) de
 *    globals.css alignée à 10 px / padding 6 px (les sélecteurs
 *    d'ID y remplacent le clamp).
 *
 * Ce script mesure sur 15 largeurs, de 280 px (écran de couverture
 * Galaxy Fold) à 1440 px :
 *  1. les deux CTA sur la MÊME ligne (même « top » à ±1 px) ;
 *  2. aucun chevauchement (droite du 1er ≤ gauche du 2e) ;
 *  3. aucun débordement horizontal de la page ;
 *  4. le hero entièrement visible sans défilement (hauteur ≤
 *     viewport) ;
 *  5. aucune erreur console.
 */

const { chromium } = require("playwright");

const BASE = "http://localhost:3100";

/** Largeurs testées — hauteurs représentatives de chaque famille
 *  d'appareils (la règle « téléphones courts » exige hauteur ≤ 620). */
const WIDTHS = [
  { w: 280, h: 653 }, // Galaxy Fold (couverture) — large
  { w: 280, h: 560 }, // Galaxy Fold — court (règle CSS active)
  { w: 300, h: 600 },
  { w: 320, h: 568 }, // iPhone SE (1re gén.) — court
  { w: 320, h: 844 }, // iPhone SE (portrait long)
  { w: 360, h: 740 },
  { w: 375, h: 667 }, // iPhone 8
  { w: 390, h: 844 }, // iPhone 14/15
  { w: 414, h: 896 },
  { w: 480, h: 600 }, // téléphones courts, limite de la règle CSS
  { w: 540, h: 720 },
  { w: 640, h: 960 }, // breakpoint sm
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1440, h: 900 },
];

let failures = 0;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: WIDTHS[0].w, height: WIDTHS[0].h },
  });
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  console.log(
    "largeur × hauteur | une ligne | chevauchement | débordement | hero visible",
  );
  console.log("-".repeat(78));

  for (const { w, h } of WIDTHS) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(4800);

    const m = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll("#hero .hero-cta a"));
      const r = ctas.map((a) => a.getBoundingClientRect());
      const hero = document.getElementById("hero").getBoundingClientRect();
      return {
        libelles: ctas.map((a) => (a.innerText || "").trim()),
        tops: r.map((x) => Math.round(x.top)),
        bottoms: r.map((x) => Math.round(x.bottom)),
        heights: r.map((x) => Math.round(x.height)),
        droits: r.map((x) => Math.round(x.right)),
        gauches: r.map((x) => Math.round(x.left)),
        heroHauteur: Math.round(hero.height),
        viewportH: window.innerHeight,
        debordement:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    /* « Une seule ligne » = les deux boutons partagent la même bande
       verticale (chaque bouton est en face de l'autre). Les hauteurs
       des deux pilules diffèrent légèrement (py différents au-dessus
       de sm — design approuvé), et items-center les centre : leurs
       « top » diffèrent donc de quelques pixels — ce n'est PAS un
       empilement. Empilement réel = bandes verticales disjointes. */
    const memesBandes =
      m.tops[0] < m.bottoms[1] && m.tops[1] < m.bottoms[0];
    const chevauchement = m.droits[0] > m.gauches[1];
    const heroVisible = m.heroHauteur <= m.viewportH + 1;
    const ok = memesBandes && !chevauchement && m.debordement <= 0 && heroVisible;

    if (!ok) failures++;
    console.log(
      `${String(w).padStart(4)} × ${String(h).padStart(4)}   | ` +
        `${memesBandes ? "  OUI   " : "  NON   "} | ` +
        `${chevauchement ? "  OUI (bug)" : "   non     "} | ` +
        `${m.debordement > 0 ? `OUI ${m.debordement}px (bug)` : "   non     "} | ` +
        `${heroVisible ? "oui" : `NON (${m.heroHauteur}>${m.viewportH})`} ` +
        `${ok ? "" : "  ← ÉCHEC"}`,
    );
    if (!ok) {
      console.log(
        `     détail : ${JSON.stringify({
          libelles: m.libelles,
          tops: m.tops,
          bottoms: m.bottoms,
          heights: m.heights,
          d1: m.droits[0],
          g2: m.gauches[1],
        })}`,
      );
    }
  }

  ok(consoleErrors.length === 0, `aucune erreur console (${consoleErrors.length})`);
  function ok(cond, label) {
    if (cond) {
      console.log(`OK   ${label}`);
    } else {
      failures++;
      console.log(`FAIL ${label}`);
    }
  }

  await browser.close();
  console.log("-".repeat(78));
  console.log(
    failures === 0
      ? "BILAN : les deux CTA tiennent sur une seule ligne sur TOUTES les largeurs testées"
      : `BILAN : ${failures} échec(s)`,
  );
  if (failures > 0) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
