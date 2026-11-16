#!/usr/bin/env node
/** Captures robustes (17/11) : scrollIntoView puis capture du
 *  viewport — aucun calcul de clip fragile. */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = "/tmp/verif-17-11";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const log = (...a) => console.log(...a);

  /* ---- Page méthode : trajet de la flèche ---- */
  for (const w of [1280, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1150 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/#/methode`, { waitUntil: "load" });
    await page.waitForTimeout(2200);
    await page.evaluate(() => {
      const main = document.getElementById("contenu-principal");
      const norm = (s) => (s || "").replace(/\u00A0/g, " ");
      const titleH2 = Array.from(main.querySelectorAll("h2")).find((h) =>
        norm(h.textContent).includes("génèrent des ventes")
      );
      const word = titleH2.querySelector(":scope > span:last-child");
      // scrollTo INSTANTANÉ : scroll-behavior:smooth rend scrollIntoView
      // asynchrone — tout scrollTo relatif ultérieur annule l'animation.
      // Ici : le mot à 150 px du haut (sous le header fixe ~72 px).
      const y = word.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    });
    await page.waitForTimeout(1700);
    const pos = await page.evaluate(() => ({
      scrollY: window.scrollY,
      arrow: !!document.getElementById("fleche-methode"),
    }));
    await page.screenshot({ path: `${OUT}/methode-fleche-${w}.png` });
    log(`methode ${w} : scrollY=${pos.scrollY} fleche=${pos.arrow} -> ${OUT}/methode-fleche-${w}.png`);
    await ctx.close();
  }

  /* ---- Page projet : section « Le Site » ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/#/projet/mrsteveenglish`, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const figs = document.querySelectorAll("#le-site figure");
      const y = figs[0].getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/projet-le-site-1440.png` });
    log(`projet 1440 -> ${OUT}/projet-le-site-1440.png`);
    await ctx.close();
  }

  await browser.close();
  log("Terminé.");
})();
