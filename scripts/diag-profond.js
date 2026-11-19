/**
 * Chronologie d'un lien profond /#/methode — v3 : structure
 * identique au test minimal validé (appel DIRECT de l'échantillonneur,
 * observateur LCP dans un script d'initialisation séparé).
 */
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:3100";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Observateur LCP séparé (les entrées LCP ne sont lisibles QUE via
  // PerformanceObserver — jamais via getEntriesByType).
  await page.addInitScript(`
    window.__lcp = [];
    new PerformanceObserver(function (l) {
      for (const e of l.getEntries()) {
        window.__lcp.push({
          t: Math.round(e.startTime),
          size: Math.round(e.size),
          el: e.element ? e.element.tagName + "." + (typeof e.element.className === "string" ? e.element.className.split(" ")[0] : "") : "?",
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  `);

  // Échantillonneur d'états : PREMIER APPEL DIRECT (les chaînes de
  // setTimeout démarrées depuis le contexte d'initialisation ne
  // survivent pas de façon fiable — mesuré au volet 7).
  await page.addInitScript(`
    window.__states = [];
    var sample = function () {
      if (!document.documentElement) { setTimeout(sample, 4); return; }
      var main = document.getElementById("contenu-principal");
      var cible = document.querySelector("#contenu-principal p.mt-2.5");
      var wrap = cible ? cible.parentElement : null;
      window.__states.push([
        Math.round(performance.now()),
        document.documentElement.hasAttribute("data-boot") ? "BOOT" : "-",
        main ? (getComputedStyle(main).visibility === "hidden" ? "caché" : "visible") : "pasMain",
        document.querySelector("#contenu-principal header") ? "pageOui" : "pageNon",
        wrap ? "op:" + Number(getComputedStyle(wrap).opacity).toFixed(2) : "pasCible",
        document.querySelector("#contenu-principal .animate-spin") ? "spin" : "-",
      ].join(" "));
      if (performance.now() < 3500) setTimeout(sample, 25);
    };
    sample();
  `);

  await page.goto(`${BASE}/#/methode`, { waitUntil: "load", timeout: 25000 });
  await page.waitForTimeout(3700);

  const out = await page.evaluate(() => ({ n: window.__states.length, states: window.__states, lcp: window.__lcp }));
  console.log("échantillons:", out.n);
  let prev = "";
  for (const s of out.states) {
    const key = s.split(" ").slice(1).join(" ");
    if (key !== prev) console.log("  " + s);
    prev = key;
  }
  console.log("LCP:", JSON.stringify(out.lcp));
  await browser.close();
})();
