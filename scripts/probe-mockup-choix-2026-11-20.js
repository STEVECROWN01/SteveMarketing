/**
 * Sonde ciblée (20/11/2026, volet 9 — 2e itération) : le contrôle
 * « iPhone 13 : mockup navigateur → candidat 640w » du volet 8 a échoué
 * UNE fois (currentSrc = mrsteveenglish-desktop.webp 1440w) alors qu'il
 * passait le matin même avec un code d'image inchangé. Hypothèse :
 * à-coup de mesure — les animations d'entrée du hero (hero-anim-browser)
 * peuvent faire mesurer une largeur d'affichage plus grande au moment
 * du choix du candidat srcset par le navigateur. Cette sonde répète la
 * mesure N fois avec des attentes différentes pour départager à-coup
 * vs régression.
 */
const { chromium } = require("playwright");

const BASE = "http://127.0.0.1:3100";
const RUNS = Number(process.env.RUNS || 5);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await ctx.newPage();
  const resultats = [];
  for (let i = 0; i < RUNS; i++) {
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    const attente = 1000 + i * 800;
    await page.waitForTimeout(attente);
    const r = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const b = q("div.hero-anim-browser img");
      return {
        browser: b?.currentSrc || null,
        complete: b ? b.complete && b.naturalWidth > 0 : false,
        sizes: b?.getAttribute("sizes") || null,
        largeurAffichee: b ? Math.round(b.getBoundingClientRect().width) : null,
      };
    });
    const ok = (r.browser || "").includes("mrsteveenglish-desktop-640.webp");
    resultats.push(ok);
    console.log(
      `run ${i + 1} (attente ${attente}ms) : ${ok ? "OK  " : "ÉCHEC"} — ${r.browser} | affiché ${r.largeurAffichee}px | sizes=${r.sizes}`,
    );
  }
  await browser.close();
  const okCount = resultats.filter(Boolean).length;
  console.log(`\nBILAN : ${okCount}/${RUNS} runs OK`);
  process.exit(okCount === RUNS ? 0 : 1);
})();
