/**
 * EXTRACTION LIVE — métadonnées SEO + libellés CTA, toutes routes.
 * (Recommandations de l'audit intégral du 18/11/2026 : raccourcissement
 *  titles/descriptions + centralisation des libellés CTA.)
 *
 * Usage : node scripts/extraction-metas-cta-2026-11-18.js <sortie.json> [baseURL]
 *
 * Pour chacune des 14 routes publiques, capture :
 *  - document.title (attendu STABLE : hydratation Next.js + garde
 *    anti-écrasement du routeur peuvent le réécrire — on attend la
 *    convergence, cf. commit 4e51251) ;
 *  - meta description, og:title, og:description, twitter:title,
 *    twitter:description ;
 *  - le libellé de TOUS les boutons .btn-fill visibles (a et button :
 *    CTAButton, StartProjectButton, LeadForm, cartes « Voir Le Projet »).
 *
 * Leçon (audit 18/11) : waitUntil "load" JAMAIS "networkidle" — l'iframe
 * Calendly de #/reserver-un-appel garde des connexions ouvertes.
 * Leçon : normaliser \u00A0 avant toute comparaison de texte (RevealText).
 */
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = process.argv[2];
const BASE = process.argv[3] || "http://127.0.0.1:3100";
if (!OUT) {
  console.error("Usage : node scripts/extraction-metas-cta-2026-11-18.js <sortie.json> [baseURL]");
  process.exit(1);
}

const ROUTES = [
  ["accueil", "#/accueil"],
  ["methode", "#/methode"],
  ["referencement", "#/referencement-seo"],
  ["publicite", "#/publicite-meta-ads"],
  ["realisations", "#/realisations"],
  ["projet-mrsteveenglish", "#/projet/mrsteveenglish"],
  ["projet-prelaunch", "#/projet/prelaunch"],
  ["projet-afribayit", "#/projet/afribayit"],
  ["a-propos", "#/a-propos"],
  ["contact", "#/contact"],
  ["devis", "#/demander-un-devis"],
  ["audit", "#/audit-gratuit"],
  ["appel", "#/reserver-un-appel"],
  ["mentions-legales", "#/mentions-legales"],
];

/** Attend un document.title stable 600 ms (et ≥ 1200 ms au total) :
 *  le routeur applique les métas de la page, l'hydratation Next.js peut
 *  les écraser, la garde les ré-applique — on ne lit que la valeur
 *  convergée. */
async function attendreTitreStable(page, timeoutMs = 6000) {
  const t0 = Date.now();
  let dernier = "";
  let stableDepuis = t0;
  while (Date.now() - t0 < timeoutMs) {
    const t = await page.title();
    if (t !== dernier) {
      dernier = t;
      stableDepuis = Date.now();
    } else if (Date.now() - stableDepuis >= 600 && Date.now() - t0 >= 1200) {
      return dernier;
    }
    await page.waitForTimeout(150);
  }
  return dernier;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const erreursConsole = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") erreursConsole.push(`${page.url()} :: ${msg.text()}`);
  });
  const resultat = {};
  for (const [nom, hash] of ROUTES) {
    await page.goto(`${BASE}/${hash}`, { waitUntil: "load", timeout: 45000 });
    const title = await attendreTitreStable(page);
    const metas = await page.evaluate(() => {
      const get = (sel) =>
        document.querySelector(sel)?.getAttribute("content") ?? null;
      return {
        description: get('meta[name="description"]'),
        ogTitle: get('meta[property="og:title"]'),
        ogDescription: get('meta[property="og:description"]'),
        twTitle: get('meta[name="twitter:title"]'),
        twDescription: get('meta[name="twitter:description"]'),
      };
    });
    const ctas = await page.evaluate(() => {
      const norm = (s) => s.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
      // getClientRects (et non offsetParent) : offsetParent est null pour
      // les éléments position:fixed — le bouton du header serait exclu.
      return [...document.querySelectorAll("a.btn-fill, button.btn-fill")]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => norm(el.innerText))
        .filter(Boolean);
    });
    resultat[nom] = { title, ...metas, ctas };
    console.log(
      `${nom.padEnd(22)} title=${String(title.length).padStart(2)}c  desc=${String(
        (metas.description || "").length
      ).padStart(3)}c  ctas=${ctas.length}`
    );
  }
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(resultat, null, 2));
  console.log(`→ ${OUT}`);
  if (erreursConsole.length) {
    console.log(`ERREURS CONSOLE (${erreursConsole.length}) :`);
    erreursConsole.slice(0, 10).forEach((e) => console.log("  " + e));
    process.exit(2);
  }
})();
