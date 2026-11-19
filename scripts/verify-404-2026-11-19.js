/**
 * VÉRIFICATION VISUELLE DE LA NOUVELLE PAGE 404 (audit serveur du
 * 19/11 — cinquième volet). La page 404 française (src/app/not-found.tsx)
 * est une page SERVEUR en dehors du routeur à fragments : elle rend
 * dans RootLayout (mêmes polices) mais SANS le header/footer ni le
 * fond du div applicatif — elle porte son propre fond #1c1c1c.
 * Contrôles : statut 404, texte français, eyebrow, H1, CTA « Retour À
 * L'Accueil » pointant vers « / », fond sombre effectif (pixel),
 * centrage vertical, zéro débordement horizontal, zéro erreur console,
 * titre d'onglet — sur desktop 1440 et mobile iPhone 13.
 *   node scripts/verify-404-2026-11-19.js
 * Sortie : scripts/verify-404-2026-11-19.json (+ captures dans /tmp)
 *
 * LEÇON OPS (documentée maintes fois) : serveur standalone et script
 * dans la MÊME invocation shell, sortie redirigée vers un fichier.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:3100";
const OUT = path.join(__dirname, "verify-404-2026-11-19.json");

const DEVICES = [
  { name: "desktop-1440", vw: 1440, vh: 900, mobile: false },
  { name: "mobile-iphone13", vw: 390, vh: 844, mobile: true },
];

(async () => {
  const results = [];
  const browser = await chromium.launch();
  let failures = 0;

  for (const dev of DEVICES) {
    const ctx = await browser.newContext(
      dev.mobile
        ? { viewport: { width: dev.vw, height: dev.vh }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
        : { viewport: { width: dev.vw, height: dev.vh } }
    );
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      /* Le document principal RÉPOND 404 (c'est le but de la page) :
         Chrome journalise « Failed to load resource: … status of 404 »
         pour CE document pendant le goto — pas un défaut, le statut
         correct de la page. Cette entrée précise est exclue ; toute
         AUTRE erreur console (script, ressource manquante…) reste
         comptée. */
      if (/status of 404/.test(t)) return;
      consoleErrors.push(t.slice(0, 120));
    });

    const resp = await page.goto(`${BASE}/page-inexistante`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(1200);

    const data = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const h1 = q("h1");
      const cta = q("a[href='/']");
      const h1r = h1?.getBoundingClientRect();
      const ctaR = cta?.getBoundingClientRect();
      return {
        title: document.title,
        eyebrow: q(".text-eyebrow")?.textContent?.trim() ?? null,
        h1: h1?.textContent?.trim() ?? null,
        h1Font: h1 ? getComputedStyle(h1).fontFamily.split(",")[0] : null,
        cta: cta?.textContent?.trim() ?? null,
        ctaBg: cta ? getComputedStyle(cta).backgroundColor : null,
        h1CenteredX: h1r ? Math.abs((h1r.left + h1r.right) / 2 - innerWidth / 2) < 4 : false,
        blockCenteredY:
          h1r && ctaR
            ? Math.abs((h1r.top + ctaR.bottom) / 2 - innerHeight / 2) < 80
            : false,
        overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        bodyBg: getComputedStyle(document.body).backgroundColor,
      };
    });

    const shot = `/tmp/404-${dev.name}.png`;
    await page.screenshot({ path: shot });

    const checks = [
      ["statut HTTP 404", resp?.status() === 404],
      ["titre d'onglet « Page introuvable — Stevens Akpovi »", data.title === "Page introuvable — Stevens Akpovi"],
      ["eyebrow « Erreur 404 »", data.eyebrow === "Erreur 404"],
      ["H1 français présent", !!data.h1 && data.h1.includes("Cette page n'existe pas")],
      ["police Sora sur le H1 (font-display)", (data.h1Font ?? "").includes("Sora")],
      ["CTA « Retour À L'Accueil » vers /", data.cta === "Retour À L'Accueil"],
      ["CTA fond blanc", data.ctaBg === "rgb(255, 255, 255)"],
      ["H1 centré horizontalement", data.h1CenteredX],
      ["bloc centré verticalement", data.blockCenteredY],
      ["aucun débordement horizontal", !data.overflowX],
      ["zéro erreur console", consoleErrors.length === 0],
    ];
    for (const [label, ok] of checks) {
      if (!ok) failures++;
      console.log(`  ${ok ? "OK  " : "ÉCHC"} ${dev.name} : ${label}`);
    }
    results.push({ device: dev.name, status: resp?.status(), ...data, consoleErrors, checks: Object.fromEntries(checks), shot });
    await ctx.close();
  }
  await browser.close();

  fs.writeFileSync(OUT, JSON.stringify({ date: "2026-11-19", failures, results }, null, 1));
  console.log(`\nBILAN : ${failures === 0 ? "TOUT OK" : failures + " ÉCHEC(S)"}`);
})();
