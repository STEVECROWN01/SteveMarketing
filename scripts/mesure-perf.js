#!/usr/bin/env node
/* VOLET 31 — MESURE DE PERFORMANCE (LCP, CLS, TBT, FCP, poids).
 * Mesure une URL dans un Chromium neuf (cache vide) et imprime :
 *  - FCP / LCP (PerformanceObserver) ;
 *  - CLS (layout-shift, sans shifts après interaction) ;
 *  - TBT approx. (longtasks > 50 ms pendant la charge) ;
 *  - poids du réseau par type de ressource + nombre de requêtes ;
 *  - tailles des chunks JS chargés (pour cibler l'optimisation).
 * Usage : node scripts/mesure-perf.js <url> [mobile|desktop] */

const { chromium } = require("playwright");

const URL = process.argv[2] || "http://127.0.0.1:3100/";
const MODE = process.argv[3] || "mobile";

(async () => {
  const browser = await chromium.launch();
  const contexte = await browser.newContext(
    MODE === "mobile"
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" }
      : { viewport: { width: 1440, height: 900 } },
  );
  const page = await contexte.newPage();

  /* Collecte réseau */
  const ressources = [];
  page.on("response", (res) => {
    const req = res.request();
    ressources.push({ url: req.url(), type: req.resourceType(), statut: res.status(), corps: 0 });
  });
  page.on("response", async (res) => {
    try {
      const i = ressources.findIndex((r) => r.url === res.url() && r.corps === 0);
      if (i >= 0) ressources[i].corps = (await res.body()).length;
    } catch {}
  });

  /* Métriques dans la page */
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  const metriques = await page.evaluate(
    () =>
      new Promise((resoudre) => {
        const r = { fcp: 0, lcp: 0, cls: 0, tbt: 0, longtasks: 0, jsOctets: 0 };
        let termine = false;
        const fin = () => {
          if (termine) return;
          termine = true;
          resoudre(r);
        };
        try {
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) if (e.name === "first-contentful-paint") r.fcp = Math.round(e.startTime);
          }).observe({ type: "paint", buffered: true });
          new PerformanceObserver((l) => {
            const es = l.getEntries();
            if (es.length) r.lcp = Math.round(es[es.length - 1].startTime);
          }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) if (!e.hadRecentInput) r.cls += e.value;
          }).observe({ type: "layout-shift", buffered: true });
          /* VOLET 31 — TBT = API longtask UNIQUEMENT (les durées de
             ressources réseau n'ont jamais été des tâches bloquantes :
             l'ancienne version confondait les deux). */
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) {
              r.longtasks += 1;
              r.tbt += Math.round(e.duration - 50);
            }
          }).observe({ entryTypes: ["longtask"] });
        } catch {}
        const attente = Number(window.__ATTENTE__ || 14000);
        setTimeout(fin, attente);
        if (document.readyState === "complete") setTimeout(fin, attente / 2);
        window.addEventListener("load", () => setTimeout(fin, Math.max(2000, attente / 2)));
      }),
  );

  /* Agrégat réseau */
  const parType = {};
  for (const r of ressources) {
    parType[r.type] = parType[r.type] || { n: 0, octets: 0 };
    parType[r.type].n += 1;
    parType[r.type].octets += r.corps;
  }
  const ko = (o) => `${Math.round(o / 1024)} Ko`;

  console.log(`═══ PERFORMANCE ${MODE.toUpperCase()} — ${URL}`);
  console.log(`FCP : ${metriques.fcp} ms | LCP : ${metriques.lcp} ms | CLS : ${metriques.cls.toFixed(4)} | TBT≈ : ${metriques.tbt} ms (${metriques.longtasks} longues tâches)`);
  console.log("Réseau par type :");
  for (const [t, v] of Object.entries(parType).sort((a, b) => b[1].octets - a[1].octets)) {
    console.log(`  ${t.padEnd(12)} ${String(v.n).padStart(3)} req.  ${ko(v.octets).padStart(9)}`);
  }
  const total = ressources.reduce((s, r) => s + r.corps, 0);
  console.log(`TOTAL : ${ressources.length} requêtes, ${ko(total)}`);
  console.log("Grosses ressources (> 25 Ko) :");
  for (const r of ressources.filter((r) => r.corps > 25600).sort((a, b) => b.corps - a.corps).slice(0, 12)) {
    console.log(`  ${ko(r.corps).padStart(9)}  ${r.type.padEnd(10)} ${r.url.replace(/^https?:\/\/[^/]+/, "")}`);
  }

  await browser.close();
})();
