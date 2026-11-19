/**
 * Captures visuelles du volet 7 : cascade du hero de l'accueil,
 * écran d'amorçage d'un lien profond, page cible rendue.
 */
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:3100";

(async () => {
  const browser = await chromium.launch();

  /* ---------- 1. Accueil : cascade du hero (desktop) ---------- */
  const p1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p1.goto(`${BASE}/`, { waitUntil: "commit" });
  await p1.waitForTimeout(350);
  await p1.screenshot({ path: "/tmp/v7-accueil-350ms.png" });
  await p1.waitForTimeout(1650);
  await p1.screenshot({ path: "/tmp/v7-accueil-2s.png" });
  await p1.waitForTimeout(3000);
  await p1.screenshot({ path: "/tmp/v7-accueil-5s.png" });

  /* ---------- 2. Accueil mobile : hero complet ---------- */
  const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p2.goto(`${BASE}/`, { waitUntil: "commit" });
  await p2.waitForTimeout(400);
  await p2.screenshot({ path: "/tmp/v7-accueil-mobile-400ms.png" });
  await p2.waitForTimeout(4600);
  await p2.screenshot({ path: "/tmp/v7-accueil-mobile-5s.png" });

  /* ---------- 3. Lien profond #/methode : amorçage puis page ---------- */
  const p3 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p3.goto(`${BASE}/#/methode`, { waitUntil: "commit" });
  await p3.waitForTimeout(280);
  await p3.screenshot({ path: "/tmp/v7-methode-280ms.png" });
  await p3.waitForTimeout(1220);
  await p3.screenshot({ path: "/tmp/v7-methode-1-5s.png" });
  await p3.waitForTimeout(1500);
  await p3.screenshot({ path: "/tmp/v7-methode-3s.png" });

  /* ---------- 4. Navigation interne : accueil → Méthode (comportement des transitions conservé) ---------- */
  const p4 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p4.goto(`${BASE}/`, { waitUntil: "load" });
  await p4.waitForTimeout(1200);
  await p4.evaluate(() => (location.hash = "#/methode"));
  await p4.waitForTimeout(900);
  await p4.screenshot({ path: "/tmp/v7-nav-interne-methode.png" });
  const nav = await p4.evaluate(() => ({
    h1: document.querySelector("#contenu-principal header h1")?.textContent?.slice(0, 40),
    dataBoot: document.documentElement.getAttribute("data-boot"),
  }));
  console.log("nav interne:", JSON.stringify(nav));

  await browser.close();
  console.log("captures OK");
})();
