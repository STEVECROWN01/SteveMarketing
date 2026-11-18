/**
 * DIAGNOSTIC CLS — capture des layout-shifts avec SOURCES (2026-11-19)
 * Contexte : l'audit perf (scripts/audit-a11y-perf-forms-2026-11-19.js, STAGE=perf)
 * a mesuré CLS 0.6 sur #/methode et #/realisations (desktop ET mobile) contre
 * 0.003 sur l'accueil — seuil Google « Good » = 0.1. Ce script identifie LA CAUSE :
 * chaque layout-shift est enregistré avec sa valeur, son instant (ms depuis
 * navigationStart) et ses éléments sources (tag, classes, rects avant/après).
 *
 * Méthodologie identique à l'audit pour comparabilité :
 * PerformanceObserver('layout-shift', buffered), somme brute, exclusion
 * hadRecentInput. En plus : entry.sources[].node sérialisé.
 *
 * Périmètre : accueil (témoin sain) + 4 pages internes (PageHero) pour
 * délimiter si le défaut est systémique aux pages internes.
 *   node scripts/diagnostic-cls-2026-11-19.js
 * Sortie : scripts/diagnostic-cls-2026-11-19.json
 *
 * LEÇON OPS (documentée dans audit-a11y-perf-forms-2026-11-19.js) : ce sandbox
 * tue tout processus enfant à la fin de CHAQUE commande — le serveur standalone
 * et ce script doivent vivre dans la MÊME invocation shell (wrapper ci-dessous).
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:3100";
const OUT = path.join(__dirname, "diagnostic-cls-2026-11-19.json");

const ROUTES = [
  { route: "#/accueil", label: "témoin sain (CLS 0.003)" },
  { route: "#/methode", label: "défaut (CLS 0.6)" },
  { route: "#/realisations", label: "défaut (CLS 0.6)" },
  { route: "#/contact", label: "non mesurée par l'audit — délimitation" },
  { route: "#/a-propos", label: "non mesurée par l'audit — délimitation" },
  { route: "#/referencement-seo", label: "non mesurée par l'audit — délimitation" },
];

const DEVICES = [
  { name: "desktop-1440", vw: 1440, vh: 900, mobile: false },
  { name: "mobile-iphone13", vw: 390, vh: 844, mobile: true },
];

// Collecteur injecté AVANT chaque chargement de document (addInitScript
// persiste entre navigations ; le reset se fait à chaque nouvelle page).
const INIT = `
window.__shifts = [];
window.__t0 = performance.now();
try {
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      const sources = (e.sources || []).slice(0, 4).map((s) => {
        const n = s.node;
        let desc = "?";
        try {
          if (n) {
            const cls = (typeof n.className === "string" ? n.className : "").slice(0, 110);
            desc = n.tagName + (n.id ? "#" + n.id : "") + (cls ? "." + cls.replace(/\\s+/g, ".") : "");
          }
        } catch (_) {}
        const r = (x) => (x ? { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) } : null);
        return { node: desc, prev: r(s.previousRect), cur: r(s.currentRect) };
      });
      window.__shifts.push({
        t: Math.round(e.startTime),
        value: Math.round(e.value * 1000) / 1000,
        sources,
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
} catch (_) {}
`;

(async () => {
  const results = [];
  const browser = await chromium.launch();

  for (const dev of DEVICES) {
    for (const r of ROUTES) {
      const ctx = await browser.newContext(
        dev.mobile
          ? { viewport: { width: dev.vw, height: dev.vh }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
          : { viewport: { width: dev.vw, height: dev.vh } }
      );
      const page = await ctx.newPage();
      await page.addInitScript(INIT);
      const resp = await page.goto(BASE + "/" + r.route, { waitUntil: "load", timeout: 20000 });
      if (!resp || !resp.ok()) throw new Error(`Chargement impossible : ${r.route} (HTTP ${resp && resp.status()})`);
      // L'audit attendait la stabilité : on laisse 4 s aux animations/swap
      // routeur/chargement de polices se dérouler intégralement.
      await page.waitForTimeout(4000);

      const shifts = await page.evaluate(() => window.__shifts || []);
      const cls = Math.round(shifts.reduce((a, s) => a + s.value, 0) * 1000) / 1000;
      results.push({
        device: dev.name,
        route: r.route,
        note: r.label,
        cls,
        shiftCount: shifts.length,
        shifts,
      });
      console.log(
        `${dev.name.padEnd(16)} ${r.route.padEnd(22)} CLS=${cls.toFixed(3)} shifts=${shifts.length}`
      );
      // Résumé des 3 plus gros shifts pour la lecture console
      for (const s of [...shifts].sort((a, b) => b.value - a.value).slice(0, 3)) {
        const src = s.sources[0];
        const dy = src && src.prev && src.cur ? src.cur.y - src.prev.y : "?";
        console.log(
          `    +${s.value.toFixed(3)} @${s.t}ms  ${src ? src.node.slice(0, 90) : "?"}  Δy=${dy}`
        );
      }
      await ctx.close();
    }
  }
  await browser.close();

  fs.writeFileSync(OUT, JSON.stringify({ meta: { date: "2026-11-19", base: BASE, build: "f690a43+ local" }, results }, null, 1));
  console.log("\nÉcrit : " + OUT);
})();
