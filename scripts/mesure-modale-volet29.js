/* Vérifie que le bouton du pied de la modale des axes ne déborde pas. */
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  await page.goto("http://127.0.0.1:3100/#/admin", { waitUntil: "load" });
  await page.waitForSelector("#admin-password");
  await page.fill("#admin-password", "TestVolet29!2026");
  await page.click('button:has-text("Ouvrir L\'Espace")');
  await page.waitForSelector('nav[aria-label="Sections du back-office"]');
  await page.waitForTimeout(600);
  await page.click('nav button:has-text("Audit")');
  await page.waitForTimeout(800);
  await page.fill('input[type="url"]', "https://example.com");
  await page.click('button:has-text("Analyser")');
  await page.waitForSelector('text=Rapport performance', { timeout: 120000 });
  await page.click('button:has-text("Voir les axes d\'amélioration")');
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(400);
  const mesure = await page.evaluate(() => {
    const modale = document.querySelector('[role="dialog"] .max-h-\\[86vh\\]') || document.querySelector('[role="dialog"] > div');
    const bouton = [...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.includes("Télécharger les axes"));
    if (!modale || !bouton) return { trouve: false };
    const m = modale.getBoundingClientRect();
    const b = bouton.getBoundingClientRect();
    return {
      trouve: true,
      modaleDroite: Math.round(m.right),
      boutonDroite: Math.round(b.right),
      marge: Math.round(m.right - b.right),
      deborde: b.right > m.right + 0.5,
    };
  });
  console.log(JSON.stringify(mesure));
  await browser.close();
})();
