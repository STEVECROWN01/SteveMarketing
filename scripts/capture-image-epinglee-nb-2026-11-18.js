/**
 * Captures de confirmation du 18/11/2026 — image épinglée de la
 * section « VOTRE ACTIVITÉ MÉRITE D'ÊTRE DAVANTAGE VISIBLE »
 * exclusivement en noir et blanc (voir
 * verify-image-epinglee-nb-2026-11-18.js pour les contrôles).
 *
 * 1. epinglee-bureau-repos.png    — 1440, état au repos ;
 * 2. epinglee-bureau-survol.png   — 1440, curseur SUR l'image
 *    épinglée : elle doit rester en noir et blanc ;
 * 3. epinglee-bureau-principale-survol.png — même vue, curseur sur
 *    l'image PRINCIPALE : celle-ci passe en couleur (contraste
 *    visuel avec l'épinglée qui reste N&B) ;
 * 4. epinglee-mobile-390.png      — iPhone 13 : l'épinglée reste
 *    en N&B, la principale s'affiche en couleur.
 *
 * LEÇONS :
 *  - page.screenshot({ clip }) avec un clip AU-DELÀ du viewport est
 *    rejeté par Playwright (« Clipped area is either empty or
 *    outside the resulting image ») même quand le clip est dans les
 *    bornes du document — pour les états DE SURVOL, capturer le
 *    VIEWPORT entier sans clip : toute capture qui fait défiler la
 *    page (clip, capture d'élément) déplacerait le contenu sous le
 *    pointeur immobile et PERDRAIT l'état :hover que l'on veut
 *    précisément figer ;
 *  - la colonne visuelle (image principale ~672 px + épinglée)
 *    tient dans un viewport 1440×900 : scrollIntoView(block:center)
 *    sur l'image principale suffit à tout cadrer ;
 *  - capture d'ÉLÉMENT d'une section TRÈS HAUTE sur mobile (2236 px
 *    CSS) : l'image produite n'EST PAS alignée sur les coordonnées
 *    page-absolues mesurées avant capture (recousage interne de
 *    Playwright) — l'analyse pixel sur ces coordonnées tombait sur le
 *    fond (28,28,28). Fiable : mesurer getBoundingClientRect()
 *    DANS LA MÊME EXÉCUTION, juste avant une capture VIEWPORT fixe ;
 *  - les images sont LAZY : défiler jusqu'aux IMAGES (pas à la
 *    section) et attendre img.complete && naturalWidth > 0 avant de
 *    capturer, sinon l'image rendue est le fond vide.
 */
const { chromium, devices } = require("playwright");

const BASE = "http://localhost:3100";
const OUT = "/tmp/captures-epinglee-18-11";

(async () => {
  const fs = require("fs");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  /* ---- Bureau 1440 ---- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      document
        .querySelector('#probleme img[src*="problem-no-website"]')
        .scrollIntoView({ block: "center" });
    });
    await page.waitForTimeout(1800);

    // 1. Repos
    await page.screenshot({ path: `${OUT}/epinglee-bureau-repos.png` });

    // 2. Survol de l'image épinglée — doit RESTER en noir et blanc
    await page.locator('#probleme img[src*="problem-ineffective"]').hover();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/epinglee-bureau-survol.png` });

    // 3. Survol de l'image principale — doit passer en couleur
    await page.locator('#probleme img[src*="problem-no-website"]').hover();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/epinglee-bureau-principale-survol.png` });
    await page.close();
  }

  /* ---- Mobile 390 (iPhone 13) — capture viewport ---- */
  {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    // Défiler jusqu'aux IMAGES (pas à la section) : lazy loading
    await page.evaluate(() => {
      document
        .querySelector('#probleme img[src*="problem-no-website"]')
        .scrollIntoView({ block: "center" });
    });
    // Attendre que les deux images soient réellement chargées
    await page.waitForFunction(() => {
      const a = document.querySelector('#probleme img[src*="problem-no-website"]');
      const c = document.querySelector('#probleme img[src*="problem-ineffective"]');
      return a && c && a.complete && a.naturalWidth > 0 && c.complete && c.naturalWidth > 0;
    }, { timeout: 15000 });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/epinglee-mobile-390.png` });
    await context.close();
  }

  await browser.close();
  console.log(`Captures écrites dans ${OUT}`);
})();
