#!/usr/bin/env node
/**
 * Re-capture des aperçus des trois projets en densité 2x (vrais pixels
 * Retina) — correction du manque de netteté des mockups :
 *   - desktop : viewport 1440x900 @ DPR2 -> PNG 2880x1800
 *   - mobile  : viewport 390x844  @ DPR2 -> PNG 780x1688
 * Les fichiers sont écrits dans /tmp/captures/ (traités ensuite par
 * scripts/regen-images-hd.py). Repli Python si un site ne répond pas.
 */
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "/tmp/captures";
const SHOTS = [
  { name: "mrsteveenglish-desktop", url: "https://mrsteveenglish.vercel.app", w: 1440, h: 900 },
  { name: "mrsteveenglish-mobile", url: "https://mrsteveenglish.vercel.app", w: 390, h: 844 },
  { name: "prelaunch-desktop", url: "https://mrsteveenglish.vercel.app/pre-launch", w: 1440, h: 900 },
  { name: "prelaunch-mobile", url: "https://mrsteveenglish.vercel.app/pre-launch", w: 390, h: 844 },
  { name: "afribayit-desktop", url: "https://afribayit.vercel.app", w: 1440, h: 900 },
  { name: "afribayit-mobile", url: "https://afribayit.vercel.app", w: 390, h: 844 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--force-color-profile=srgb", "--disable-lcd-text"] });
  let ok = 0;
  for (const s of SHOTS) {
    try {
      const ctx = await browser.newContext({
        viewport: { width: s.w, height: s.h },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      await page.goto(s.url, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(3000); // polices + animations d'entrée stabilisées
      await page.screenshot({
        path: `${OUT}/${s.name}.png`,
        clip: { x: 0, y: 0, width: s.w, height: s.h },
      });
      await ctx.close();
      const kb = Math.round(fs.statSync(`${OUT}/${s.name}.png`).size / 1024);
      console.log(`OK  ${s.name}.png  ${s.w * 2}x${s.h * 2}  ${kb}KB`);
      ok++;
    } catch (e) {
      console.log(`ERR ${s.name}: ${e.message.split("\n")[0]}`);
    }
  }
  await browser.close();
  console.log(`captures reussies: ${ok}/${SHOTS.length}`);
})();
