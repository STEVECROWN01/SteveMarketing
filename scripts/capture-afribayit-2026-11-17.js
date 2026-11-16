#!/usr/bin/env node
/** Capture du 3e projet (AFRIBAYIT — mention à DROITE du titre
 *  sur la même ligne à 1440/1280) + zoom sur le bloc titre. */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = "/tmp/verif-realisation-17-11";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  for (const w of [1440, 1280, 768]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/#/realisations`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    // Scroller vers AFRIBAYIT (3e h2 de la section)
    await page.evaluate(() => {
      const section = document.querySelector('section[aria-label="Réalisations de Stevens Akpovi"]');
      const h2 = section.querySelectorAll("h2")[2];
      const y = h2.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/afribayit-${w}.png` });
    // Zoom sur le bloc titre (h2 + mention) pour contrôle de l'alignement
    const clip = await page.evaluate(() => {
      const section = document.querySelector('section[aria-label="Réalisations de Stevens Akpovi"]');
      const h2 = section.querySelectorAll("h2")[2];
      const r = h2.closest("div.flex").getBoundingClientRect();
      return { x: Math.max(0, r.x - 20), y: Math.max(0, r.y - 20), width: Math.min(r.width + 40, 900), height: r.height + 120 };
    });
    await page.screenshot({ path: `${OUT}/afribayit-${w}-zoom.png`, clip });
    console.log(`afribayit ${w} → ${OUT}/afribayit-${w}.png + zoom`);
    await ctx.close();
  }
  await browser.close();
  console.log("Terminé.");
})().catch((e) => { console.error(e); process.exit(1); });
