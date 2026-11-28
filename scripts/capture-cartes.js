const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  for (const vp of [
    { nom: "360", w: 360, h: 900 },
    { nom: "768", w: 768, h: 1024 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.goto("http://127.0.0.1:3100/#/admin", { waitUntil: "load" });
    await page.waitForSelector("#admin-password", { state: "visible" });
    await page.fill("#admin-password", "TestVolet31!2026");
    await page.click('button:has-text("Ouvrir L\'Espace")');
    await page.waitForSelector('nav[aria-label="Sections du back-office"]');
    await page.waitForTimeout(900);
    await page.locator('nav button:has-text("Propositions")').click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `/tmp/render/volet31/propositions-cartes-${vp.nom}.png` });
    await page.close();
  }
  await browser.close();
  console.log("captures OK");
})();
