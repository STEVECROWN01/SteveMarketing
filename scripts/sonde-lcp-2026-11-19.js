/**
 * SONDE LCP — VOLET 7 DE L'AUDIT INTÉGRAL (19/11/2026)
 * Demande de l'éditeur : « Pour une expérience utilisateur optimale,
 * vise un LCP de 1 seconde ou moins. »
 *
 * MESURE : chargement direct des 3 routes de référence de l'audit perf
 * (volet 3, scripts/audit-perf-2026-11-19.json) × 2 appareils × 3
 * passes (médiane). Contrairement au volet 3 qui se contentait du LCP
 * au moment du sondage, cette sonde attend la STABILISATION (1,2 s
 * sans nouvelle candidate LCP, plafond 9 s) — le volet 3 avait
 * mesuré « 284 ms » sur #/methode mobile en prenant le logo du
 * header avant que la page cible ne soit rendue : faux LCP par
 * arrêt trop précoce.
 *
 * INSTRUMENTATION (addInitScript, avant tout script de la page) :
 * - PerformanceObserver largest-contentful-paint (TOUTES les
 *   candidates : instant, taille, élément) → la finale = la dernière ;
 * - FCP (paint timing) + CLS (layout-shift, sans hadRecentInput) ;
 * - longtask (durée > 50 ms) → coût d'hydratation visible ;
 * - MutationObserver sur <main> (subtree childList) → instants du
 *   swap de route et du montage de la page cible ;
 * - Resource Timing des .js (début/fin de chaque chunk) + Navigation
 *   Timing (responseEnd, domInteractive, load).
 *
 * La sonde ne MODIFIE rien au site : elle observe (méthodologie des
 * volets précédents — build standalone local :3100, mêmes viewports
 * que le volet 3 : bureau 1440×900, mobile 390×844, pas de
 * throttling réseau/CPU pour rester comparable).
 *
 * Usage : node scripts/sonde-lcp-2026-11-19.js   (serveur :3100 requis)
 * Sortie : scripts/sonde-lcp-2026-11-19.json + résumé console.
 */

const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "http://127.0.0.1:3100";

/* 3 passes par route × appareil — la médiane lisse le bruit du
 * premier lancement (compilation JIT, caches disque). */
const PASSES = 3;
/* Fenêtre de stabilisation : 2 s sans NOUVELLE candidate LCP. La
 * première version (1,2 s) abandonnait AVANT la paint du contenu
 * des pages profondes : chaîne logo (≈216 ms) → écran d'amorçage →
 * fallback → morceau → contenu (mesuré à 1440 ms — un écart de
 * 1,22 s entre deux candidates) — la sonde rapportait alors le
 * logo au lieu du contenu réel. */
const SETTLE_QUIET_MS = 2000;
const SETTLE_MAX_MS = 12000; // plafond absolu d'attente

const ROUTES = [
  { key: "accueil", url: `${BASE}/` },
  { key: "methode", url: `${BASE}/#/methode` },
  { key: "realisations", url: `${BASE}/#/realisations` },
];

const DEVICES = [
  { key: "desktop", width: 1440, height: 900 },
  { key: "mobile-iphone13", width: 390, height: 844 },
];

/* Script injecté AVANT tout script de la page : installe les
 * observateurs le plus tôt possible (buffered: true rattrape les
 * entrées déjà émises). */
const INIT = `
window.__probe = {
  lcpCandidates: [],
  fcp: null,
  cls: 0,
  longTasks: [],
  mutations: [],
  boot: { posé: null, levé: null },
};
(function () {
  /* Chronologie de l'écran d'amorçage (volet 7) : instants de pose
   * et de levée de data-boot — sans requestAnimationFrame (qui ne
   * tire pas de façon fiable avant la première paint). */
  try {
    var origSet = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, val) {
      if (this === document.documentElement && name === "data-boot") {
        window.__probe.boot.posé = Math.round(performance.now());
      }
      return origSet.call(this, name, val);
    };
    var origRm = Element.prototype.removeAttribute;
    Element.prototype.removeAttribute = function (name) {
      if (this === document.documentElement && name === "data-boot") {
        window.__probe.boot.levé = Math.round(performance.now());
      }
      return origRm.call(this, name);
    };
  } catch (e) {}
  try {
    new PerformanceObserver(function (list) {
      for (const e of list.getEntries()) {
        window.__probe.lcpCandidates.push({
          t: Math.round(e.startTime),
          size: e.size,
          el: e.element
            ? (e.element.tagName || "?").toLowerCase() +
              (e.element.className && typeof e.element.className === "string"
                ? "." + e.element.className.trim().split(/\\s+/).slice(0, 3).join(".")
                : "")
            : "(sans élément)",
          url: e.url ? e.url.split("/").pop() : null,
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver(function (list) {
      for (const e of list.getEntries()) {
        if (e.name === "first-contentful-paint") window.__probe.fcp = Math.round(e.startTime);
      }
    }).observe({ type: "paint", buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver(function (list) {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) window.__probe.cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver(function (list) {
      for (const e of list.getEntries()) {
        if (e.duration > 50)
          window.__probe.longTasks.push({ t: Math.round(e.startTime), dur: Math.round(e.duration) });
      }
    }).observe({ type: "longtask", buffered: true });
  } catch (e) {}
  try {
    var describe = function (n) {
      if (!n) return "?";
      var tag = (n.tagName || "?").toLowerCase();
      var cls = "";
      try {
        if (n.classList && n.classList.length) cls = "." + Array.from(n.classList).slice(0, 2).join(".");
      } catch (e) {}
      return tag + cls;
    };
    var pushMut = function (label, nodes) {
      if (window.__probe.mutations.length > 120) return;
      /* NodeList n'a pas de .slice — conversion explicite. */
      var names = Array.prototype.slice.call(nodes || [], 0, 3).map(describe).join(",");
      window.__probe.mutations.push({
        t: Math.round(performance.now()),
        label: label + (names ? ":" + names : ""),
      });
    };
    /* Attachement IMMÉDIAT à documentElement (existe dès le script
     * d'initialisation) : l'attente de DOMContentLoaded sur body
     * ratait les premières mutations dans les passes précédentes. */
    new MutationObserver(function (records) {
      for (var r of records) {
        if (r.addedNodes.length) pushMut("add", r.addedNodes);
        else if (r.removedNodes.length) pushMut("del", r.removedNodes);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
`;

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

(async () => {
  const browser = await chromium.launch();
  const report = { meta: { date: "2026-11-19", base: BASE, passes: PASSES }, mesures: [] };

  for (const device of DEVICES) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.key === "mobile-iphone13" ? 3 : 1,
      isMobile: device.key === "mobile-iphone13",
      hasTouch: device.key === "mobile-iphone13",
    });
    const page = await context.newPage();
    await page.addInitScript(INIT);
    const consoleErrors = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => consoleErrors.push(String(e)));

    for (const route of ROUTES) {
      const passes = [];
      for (let i = 0; i < PASSES; i++) {
        const t0 = Date.now();
        /* NAVIGATION RÉELLE obligatoire : après une passe sur /, un
         * goto vers /#/methode n'est qu'une navigation PAR FRAGMENT
         * (même chemin) — le document n'est PAS rechargé, le script
         * d'amorçage ne s'exécute pas et le buffer LCP garde les
         * candidates de la page précédente (mesuré au volet 7 : la
         * sonde rapportait le hero-desc de l'accueil). about:blank
         * force un document neuf — ce que vit un visiteur qui ouvre
         * un lien profond partagé. */
        await page.goto("about:blank");
        await page.goto(route.url, { waitUntil: "load", timeout: 25000 });
        // Stabilisation : attendre 2 s sans NOUVELLE candidate LCP (plafond 12 s)
        // — 1,2 s abandonnait avant la paint du contenu des pages
        //   profondes (écart logo → contenu mesuré à 1,22 s).
        let quiet = 0;
        let lastCount = 0;
        while (Date.now() - t0 < SETTLE_MAX_MS && quiet < SETTLE_QUIET_MS) {
          await page.waitForTimeout(200);
          const count = await page.evaluate(() => window.__probe.lcpCandidates.length);
          quiet = count === lastCount ? quiet + 200 : 0;
          lastCount = count;
        }
        const data = await page.evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0] || {};
          const js = performance
            .getEntriesByType("resource")
            .filter((r) => /\.js(\?|$)/.test(r.name))
            .map((r) => ({
              file: r.name.split("/").pop().split("?")[0],
              start: Math.round(r.startTime),
              end: Math.round(r.responseEnd),
              ms: Math.round(r.responseEnd - r.startTime),
              kb: r.transferSize ? Math.round(r.transferSize / 1024) : null,
            }));
          return {
            probe: window.__probe,
            nav: {
              responseEnd: Math.round(nav.responseEnd || 0),
              domInteractive: Math.round(nav.domInteractive || 0),
              domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
              load: Math.round(nav.loadEventEnd || 0),
            },
            js,
          };
        });
        const candidates = data.probe.lcpCandidates;
        const final = candidates.length ? candidates[candidates.length - 1] : null;
        passes.push({
          fcp: data.probe.fcp,
          lcp: final ? final.t : null,
          lcpEl: final ? `${final.el} ${final.size}px²` : null,
          lcpCandidates: candidates,
          boot: data.probe.boot,
          cls: Math.round(data.probe.cls * 1000) / 1000,
          longTasks: data.probe.longTasks,
          mutations: data.probe.mutations,
          nav: data.nav,
          js: data.js,
        });
      }
      const lp = passes.map((p) => p.lcp).filter((v) => v !== null);
      const mesure = {
        device: device.key,
        route: route.key,
        lcpMedian: lp.length ? median(lp) : null,
        lcpToutes: lp,
        cible: 1000,
        conforme: lp.length ? median(lp) <= 1000 : false,
        passes,
      };
      report.mesures.push(mesure);
      console.log(
        `${device.key.padEnd(16)} ${route.key.padEnd(13)} LCP médian ${String(mesure.lcpMedian).padStart(5)} ms ` +
          `(passes: ${lp.join(", ")})  ${mesure.conforme ? "OK ≤1000" : "HORS CIBLE"}` +
          (consoleErrors.length ? `  [${consoleErrors.length} erreurs console]` : ""),
      );
      consoleErrors.length = 0;
    }
    await context.close();
  }
  await browser.close();

  fs.writeFileSync(
 `${__dirname}/sonde-lcp-2026-11-19.json`,
    JSON.stringify(report, null, 2),
  );
  const horsCible = report.mesures.filter((m) => !m.conforme);
  console.log(`\n${report.mesures.length} mesures — ${horsCible.length} hors cible (≤ 1000 ms)`);
})();
