/** Captures des CTA du hero sur une ligne — 18/11/2026 (280/320/390/1440). */
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  for (const vp of [
    { name: "280", w: 280, h: 653 },
    { name: "320", w: 320, h: 568 },
    { name: "390", w: 390, h: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.goto("http://localhost:3100/#/accueil", { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(5000);
    const cta = page.locator("#hero .hero-cta").first();
    await cta.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await cta.screenshot({ path: `/tmp/render/cta-une-ligne-${vp.name}.png` });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3100/#/accueil", { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(5000);
  await page.locator("#hero .hero-cta").first().screenshot({ path: "/tmp/render/cta-une-ligne-1440.png" });
  await browser.close();
  console.log("captures OK");
})().catch((e) => { console.error(e); process.exit(1); });
