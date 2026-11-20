/**
 * Preuve réseau du correctif mockups hero (20/11/2026, volet 9).
 *
 * Mesure sur N chargements mobiles complets (iPhone 13, DPR 3) :
 * 1. currentSrc des deux mockups (ce que l'img affiche) ;
 * 2. LES FICHIERS RÉELLEMENT TÉLÉCHARGÉS (réponses .webp observées
 *    sur le réseau) — c'est la mesure qui compte : l'ancien contrôle
 *    du volet 8 ne regardait que currentSrc et ratait le double
 *    téléchargement preload 1440w + candidat 640w.
 *
 * Attendu après correctif : mockup navigateur → 640w SEUL (30 Ko),
 * mockup téléphone → 290w SEUL (~20 Ko), 10/10 runs déterministes.
 */
const { chromium } = require("playwright");

const BASE = "http://127.0.0.1:3100";
const RUNS = Number(process.env.RUNS || 10);

(async () => {
  const browser = await chromium.launch();
  const bilans = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    });
    const page = await ctx.newPage();
    const telecharges = [];
    page.on("response", (r) => {
      const u = r.url();
      if (u.endsWith(".webp") && u.includes("/assets/projects/")) {
        telecharges.push(u.split("/").pop());
      }
    });
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      return {
        browser: q("div.hero-anim-browser img")?.currentSrc?.split("/").pop() || null,
        phone: q("div.hero-anim-phone img")?.currentSrc?.split("/").pop() || null,
      };
    });
    const ok =
      r.browser === "mrsteveenglish-desktop-640.webp" &&
      r.phone === "afribayit-mobile-290.webp" &&
      telecharges.includes("mrsteveenglish-desktop-640.webp") &&
      telecharges.includes("afribayit-mobile-290.webp") &&
      !telecharges.includes("mrsteveenglish-desktop.webp") &&
      !telecharges.includes("mrsteveenglish-desktop@2x.webp") &&
      !telecharges.includes("afribayit-mobile.webp") &&
      !telecharges.includes("afribayit-mobile@2x.webp");
    bilans.push(ok);
    console.log(
      `run ${String(i + 1).padStart(2)} : ${ok ? "OK  " : "ÉCHEC"} | img navigateur=${r.browser} | img téléphone=${r.phone} | téléchargés=[${telecharges.join(", ")}]`,
    );
    await ctx.close();
  }
  await browser.close();
  const okCount = bilans.filter(Boolean).length;
  console.log(`\nBILAN : ${okCount}/${RUNS}`);
  process.exit(okCount === RUNS ? 0 : 1);
})();
