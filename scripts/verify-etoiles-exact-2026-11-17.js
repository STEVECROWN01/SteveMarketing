#!/usr/bin/env node
/** Vérification rigoureuse du rendu des 3 étoiles :
 *  pour chaque projet — scroll jusqu'au projet, mesure du rect EXACT
 *  du svg étoile au moment de la capture, screenshot viewport, puis
 *  analyse pixel de la zone exacte (viewport-relative × DPR).
 *
 *  LEÇON IMPORTANTE (17/11) : le header fixe mesure 104 px (z-50) et
 *  sa plaque de logo est OPAQUE (#1c1c1c, x 60–160, y 0–104) — ne
 *  JAMAIS scroller un contenu à vérifier à y < ~120 : il passerait
 *  sous la plaque et paraîtrait « non rendu » alors qu'il est juste
 *  recouvert (erreur commise : h2 à y = 130 → mention à y ≈ 85 →
 *  étoile sous la plaque, texte visible car sous la partie
 *  transparente du header). Offset utilisé ici : h2 à y = 250. */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3100/#/realisations", { waitUntil: "load" });
  await page.waitForTimeout(1500);

  const results = [];
  for (let i = 0; i < 3; i++) {
    await page.evaluate((idx) => {
      const section = document.querySelector('section[aria-label="Réalisations de Stevens Akpovi"]');
      const h2 = section.querySelectorAll("h2")[idx];
      // mention à y≈200 : h2 à y≈250 (sous le header de 104 px,
      // cf. leçon en tête de fichier)
      window.scrollTo({ top: h2.getBoundingClientRect().top + window.scrollY - 250, behavior: "instant" });
    }, i);
    await page.waitForTimeout(1800);
    const rect = await page.evaluate((idx) => {
      const svgs = document.querySelectorAll('section[aria-label="Réalisations de Stevens Akpovi"] article p.text-sm svg');
      const sr = svgs[idx].getBoundingClientRect();
      const pr = svgs[idx].closest("p").getBoundingClientRect();
      return { sx: sr.x, sy: sr.y, sw: sr.width, sh: sr.height, px: pr.x, py: pr.y, pw: pr.width, ph: pr.height, op: getComputedStyle(svgs[idx].closest("p")).opacity };
    }, i);
    const file = `/tmp/verif-realisation-17-11-b/etoile-exact-${i}.png`;
    await page.screenshot({ path: file });
    results.push({ i, rect, file });
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
