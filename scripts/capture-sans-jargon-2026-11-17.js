/** Captures de confirmation visuelle de la chasse au jargon (17/11) :
 *  bande défilante (nouveaux mots-clés), en-tête Méthode (nouveau H1),
 *  formulaire devis (nouvelles options). Analysées via z-ai vision. */
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Bande défilante de l'accueil
  await page.goto("http://localhost:3100/#/accueil", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const band = page.locator("section[aria-label^='Expertises']");
  await band.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await band.screenshot({ path: "/tmp/render/bande-sans-jargon.png" });

  // 2. En-tête de la page Méthode
  await page.goto("http://localhost:3100/#/methode", { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: "/tmp/render/methode-sans-jargon.png", clip: { x: 0, y: 0, width: 1440, height: 700 } });

  // 3. Formulaire devis — questions
  await page.goto("http://localhost:3100/#/demander-un-devis", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.locator("fieldset").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "/tmp/render/devis-sans-jargon.png", clip: { x: 0, y: 200, width: 1440, height: 640 } });

  await browser.close();
  console.log("captures ok");
})();
