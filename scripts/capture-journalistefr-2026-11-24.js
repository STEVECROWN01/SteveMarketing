/**
 * CAPTURE DES APERÇUS DU PROJET JOURNALISTEFR (volet 13, 24/11/2026)
 * Captures du site live https://journalistefr.vercel.app/fr — portfolio
 * d'Alexandre Morel, journaliste international — aux dimensions EXACTES
 * du pipeline des autres projets (public/assets/projects/) :
 *   desktop     1440×900  (viewport @1x)
 *   desktop@2x  1920×1200 (viewport @1x — les @2x existants sont
 *                          capturés à 1920×1200, pas en DPR 2)
 *   mobile       390×844  (émulation mobile @1x)
 *   mobile@2x    780×1688 (émulation mobile @2x)
 * PNG vers /tmp/journalistefr/ — conversion WebP ensuite par
 * scripts/prepare-journalistefr.py (qualité 82, cible 45-140 Ko).
 */
const { chromium } = require("playwright");
const fs = require("fs");

const URL = "https://journalistefr.vercel.app/fr";
const OUT = "/tmp/journalistefr";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const shots = [
    { name: "journalistefr-desktop", vw: 1440, vh: 900, dsf: 1, touch: false },
    { name: "journalistefr-desktop@2x", vw: 1920, vh: 1200, dsf: 1, touch: false },
    { name: "journalistefr-mobile", vw: 390, vh: 844, dsf: 1, touch: true },
    { name: "journalistefr-mobile@2x", vw: 390, vh: 844, dsf: 2, touch: true },
  ];

  for (const s of shots) {
    const ctx = await browser.newContext({
      viewport: { width: s.vw, height: s.vh },
      deviceScaleFactor: s.dsf,
      hasTouch: s.touch,
      isMobile: s.touch,
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "load", timeout: 45000 });
    /* Attendre polices + animations d'entrée + images (pas de
       networkidle : la page peut garder des connexions ouvertes). */
    await page.waitForTimeout(5000);
    const file = `${OUT}/${s.name}.png`;
    await page.screenshot({ path: file });
    const px = await page.evaluate(() => ({
      w: document.documentElement.clientWidth,
      ready: document.fonts.status,
    }));
    console.log(`${s.name}: ${file} (page ${px.w}px, fonts ${px.ready})`);
    await ctx.close();
  }

  await browser.close();
})();
