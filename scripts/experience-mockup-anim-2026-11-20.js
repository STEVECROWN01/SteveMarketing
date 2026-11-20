/**
 * Expérience décisive (20/11/2026) : pourquoi le mockup navigateur
 * charge-t-il le candidat 1440w sur iPhone 13 (DPR 3) alors que
 * sizes=130px → 390px nécessaires → 640w attendu ?
 *
 * Hypothèse : l'animation hero-throw-browser (from: scale(1.6),
 * délai 2 s, fill BOTH) maintient le mockup GROSSI (boîte ~219px au
 * lieu de 130px) au moment où le navigateur choisit le candidat
 * srcset ; 219px × DPR 3 = 657 > 640 → candidat 1440w, choix définitif.
 *
 * Deux expériences : (1) animation neutralisée par CSS injecté avant
 * chargement ; (2) prefers-reduced-motion émulé (le site la respecte).
 * Si le candidat repasse à 640w → hypothèse confirmée.
 */
const { chromium } = require("playwright");

const BASE = "http://127.0.0.1:3100";

async function mesurer(page) {
  return page.evaluate(() => {
    const img = document.querySelector("div.hero-anim-browser img");
    return {
      src: img?.currentSrc || null,
      box: img ? Math.round(img.getBoundingClientRect().width) : null,
    };
  });
}

(async () => {
  const browser = await chromium.launch();

  // Expérience 1 : animation neutralisée avant le chargement
  const c1 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const p1 = await c1.newPage();
  await p1.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = ".hero-anim-browser, .hero-anim-phone, .mockup-sway { animation: none !important; }";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
    // Avant DOMContentLoaded aussi (le plus tôt possible)
    document.head && document.head.appendChild(style.cloneNode(true));
  });
  await p1.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
  await p1.waitForTimeout(1500);
  const r1 = await mesurer(p1);
  console.log(`EXP1 animation neutralisée : ${r1.src} (boîte ${r1.box}px)`);
  await c1.close();

  // Expérience 2 : prefers-reduced-motion émulé
  const c2 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    reducedMotion: "reduce",
  });
  const p2 = await c2.newPage();
  await p2.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
  await p2.waitForTimeout(1500);
  const r2 = await mesurer(p2);
  console.log(`EXP2 mouvement réduit     : ${r2.src} (boîte ${r2.box}px)`);
  await c2.close();

  // Témoin : sans intervention
  const c3 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const p3 = await c3.newPage();
  await p3.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
  await p3.waitForTimeout(1500);
  const r3 = await mesurer(p3);
  console.log(`TÉMOIN sans intervention  : ${r3.src} (boîte ${r3.box}px)`);
  await c3.close();

  await browser.close();

  const exp1Ok = (r1.src || "").includes("-640.webp");
  const exp2Ok = (r2.src || "").includes("-640.webp");
  console.log(`\nBILAN : exp1 ${exp1Ok ? "CONFIRME" : "ne confirme pas"} | exp2 ${exp2Ok ? "CONFIRME" : "ne confirme pas"} l'hypothèse animation`);
})();
