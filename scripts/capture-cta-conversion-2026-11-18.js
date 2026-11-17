/**
 * Captures visuelles des corrections CTA — 18/11/2026.
 * Zones : hero accueil 390 (2 CTA sur une ligne), page audit
 * (1440, entête + formulaire), bande finale accueil (1440).
 */
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(5200);
  await page.screenshot({ path: "/tmp/render/hero-390.png" });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/#/audit-gratuit`, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: "/tmp/render/audit-entete-1440.png" });

  await page.evaluate(() =>
    document.querySelector('section[aria-label="Formulaire de demande d\'audit"]')?.scrollIntoView(),
  );
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/render/audit-formulaire-1440.png" });

  await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(4200);
  await page.evaluate(() => {
    const el = document.getElementById("contact-final-titre");
    if (el) el.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: "/tmp/render/bande-finale-1440.png" });

  await browser.close();
  console.log("captures OK");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
