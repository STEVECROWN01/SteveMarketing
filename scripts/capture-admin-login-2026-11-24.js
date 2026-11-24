/* Capture + vérification de la page de connexion admin (précision
 * volet 14-3, 24/11/2026) : message de bienvenue personnalisé et œil
 * À L'INTÉRIEUR du champ de mot de passe.
 * BASE configurable : local (défaut http://127.0.0.1:3100) ou
 * production (BASE=https://stevensakpovi.vercel.app node …). */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://127.0.0.1:3100";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/#/admin`, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("#admin-password", { state: "visible", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/render/volet14/admin-login-precision.png", fullPage: false });

  /* Saisie d'un mot de passe long pour vérifier que le texte ne passe
     pas sous l'icône œil (padding droit pr-14). */
  await page.fill("#admin-password", "MotDePasse-Tres-Long-Pour-Verifier-Le-Padding-2026");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/tmp/render/volet14/admin-login-saisie.png", fullPage: false });

  /* Assertions (mêmes critères que la sonde C9c2/C9c3). */
  const bienvenue = await page.locator("p", { hasText: "Bienvenue, Stevens." }).first().textContent().catch(() => null);
  const champ = page.locator("#admin-password");
  const oeil = page.locator('button[aria-label="Afficher le mot de passe"]');
  const champBoite = await champ.boundingBox();
  const oeilBoite = await oeil.boundingBox();
  const dedans = champBoite && oeilBoite &&
    oeilBoite.x >= champBoite.x && oeilBoite.y >= champBoite.y &&
    oeilBoite.x + oeilBoite.width <= champBoite.x + champBoite.width + 0.5 &&
    oeilBoite.y + oeilBoite.height <= champBoite.y + champBoite.height + 0.5;
  const rapport = {
    base: BASE,
    bienvenueOk: Boolean(bienvenue && bienvenue.includes("Bienvenue, Stevens.") && !bienvenue.includes("Accès réservé")),
    texte: (bienvenue || "").replace(/\s+/g, " ").slice(0, 90),
    oeilDansChamp: Boolean(dedans),
    boites: champBoite && oeilBoite ? {
      champ: [Math.round(champBoite.x), Math.round(champBoite.y), Math.round(champBoite.width), Math.round(champBoite.height)],
      oeil: [Math.round(oeilBoite.x), Math.round(oeilBoite.y), Math.round(oeilBoite.width), Math.round(oeilBoite.height)],
    } : null,
  };
  console.log(JSON.stringify(rapport, null, 1));
  await browser.close();
  if (!rapport.bienvenueOk || !rapport.oeilDansChamp) process.exit(1);
})();
