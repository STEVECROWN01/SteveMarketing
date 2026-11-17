/** Capture de confirmation visuelle de l'en-tête de la page Méthode
 *  après la correction du 17/11/2026 (surtitre « PROCESSUS » + titre
 *  « Des sites web pensés pour convertir. »). Sortie analysée par le
 *  modèle vision (z-ai vision). */
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3100/#/methode", { waitUntil: "networkidle" });
  await page.waitForTimeout(2800);
  await page.screenshot({ path: "/tmp/render/entete-methode-1440.png", clip: { x: 0, y: 0, width: 1440, height: 760 } });
  await browser.close();
  console.log("capture ok");
})();
