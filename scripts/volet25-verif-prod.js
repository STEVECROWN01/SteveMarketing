/** Vérification PRODUCTION 28/11 — le chunk admin déployé contient
 *  les nouveaux marqueurs (VOLET 25) : « Session expirée »,
 *  « Cliquez de nouveau sur le devis sélectionné » (désélection),
 *  et le titre du portfolio « projets en ligne ». */
const { chromium } = require("playwright");
const { execSync } = require("child_process");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("https://stevensakpovi.vercel.app/", { waitUntil: "load" });
  await page.goto("https://stevensakpovi.vercel.app/#/admin", { waitUntil: "load" });
  await page.waitForTimeout(4500);
  const chunks = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((r) => r.name)
      .filter((u) => u.includes("/_next/static/chunks/")),
  );
  console.log("chunks chargés :", chunks.length);
  const bienvenue = await page.locator("text=/Bienvenue/i").count();
  console.log("page de connexion admin rendue :", bienvenue >= 1);

  await browser.close();

  /* télécharger les chunks et chercher les marqueurs */
  const marqueurs = {
    "session expirée (30 jours + écran de connexion)": "Session expir",
    "désélection du devis (M22)": "désélectionner",
    "hint de désélection": "Cliquez de nouveau sur le devis",
    "compteur portfolio (M16)": "projets en ligne",
  };
  let tout = "";
  for (const u of chunks) {
    try {
      tout += execSync(`curl -s "${u}"`, { maxBuffer: 50 * 1024 * 1024 }).toString("utf8");
    } catch (e) {
      /* ignore */
    }
  }
  console.log("taille totale des chunks :", (tout.length / 1024).toFixed(0), "Ko");
  let echecs = 0;
  for (const [nom, m] of Object.entries(marqueurs)) {
    const present = tout.includes(m);
    if (!present) echecs++;
    console.log(`${present ? "OK " : "ÉCHEC"} ${nom}`);
  }
  console.log(echecs === 0 ? "\nPROD : NOUVEAU CODE DÉPLOYÉ (marqueurs présents)" : `\nPROD : ${echecs} marqueur(s) ABSENT(S) — déploiement peut-être en cours`);
  process.exit(echecs === 0 ? 0 : 1);
})();
