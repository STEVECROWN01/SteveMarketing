/**
 * SONDE PROD VOLET 15 (25/11/2026) — https://stevensakpovi.vercel.app
 *
 * Aucun mock réseau : la vraie API est utilisée (mot de passe VOLONTAIREMENT
 * faux pour le test 401 — aucune connexion réelle, aucun document touché).
 *
 * C1x — page de connexion : icône œil NOIRE sur pastille claire, DANS le
 *        champ, visible au survol ; message de bienvenue (volet 14 conservé) ;
 * C2x — 401 « Mot de passe incorrect. » sur mauvais mot de passe ;
 * C3x — chunks JS réellement téléchargés par le navigateur : marqueurs du
 *        volet 15 présents (navigation, boutons créer, dashboard, formulaire),
 *        anciens marqueurs absents (K.Quotes, « Factures & Documents »,
 *        « Stevens Akpovi — Espace administrateur ») ;
 * C4x — l'API documents répond 401 sans session (protection en place).
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "https://stevensakpovi.vercel.app";
const OUT = "/tmp/render/volet15-prod";
const MDP_FAUX = "faux-mot-de-passe-sonde-volet15";

const checks = [];
const push = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
async function attendre(fn, timeout = 10000, pas = 250) {
  const fin = Date.now() + timeout;
  while (Date.now() < fin) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, pas));
  }
  return await fn();
}
/** rgb(a) → [r, g, b] ; null si format inconnu. */
function canaux(couleur) {
  const m = (couleur || "").match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  return m ? m.slice(1, 4).map(Number) : null;
}
const estNoir = (c) => { const c3 = canaux(c); return !!c3 && c3.every((v) => v < 100); };
const estClair = (c) => { const c3 = canaux(c); return !!c3 && c3.every((v) => v > 180); };

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  /* Collecte tous les chunks JS réellement téléchargés. */
  const chunks = {};
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) {
      try { chunks[url.split("/chunks/")[1]] = await res.text(); } catch (e) { /* déjà consommé */ }
    }
  });

  /* ---------- C1x — page de connexion ---------- */
  await page.goto(`${BASE}/#/admin`, { waitUntil: "networkidle", timeout: 60000 });
  await attendre(() => page.locator("#admin-password").count().then((n) => n > 0), 15000);
  await page.waitForTimeout(1200);

  const texte = await page.evaluate(() => document.body.innerText || "");
  push("C1.1 page de connexion affichée", /mot de passe/i.test(texte), "#/admin chargé");

  const champ = page.locator("#admin-password");
  push("C1.2 champ mot de passe présent", (await champ.count()) > 0);

  // Œil : bouton frère du champ, à l'intérieur du wrapper « relative »
  const oeil = page.locator("xpath=//input[@id='admin-password']/following-sibling::button").first();
  const nbOeil = await oeil.count();
  push("C1.3 œil à l'intérieur du champ", nbOeil > 0, nbOeil > 0 ? "bouton frère du champ (wrapper relative)" : "aucun bouton trouvé");

  if (nbOeil > 0) {
    const repos = await oeil.evaluate((el) => {
      const svg = el.querySelector("svg");
      return { bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, svgColor: svg ? getComputedStyle(svg).color : null };
    });
    push("C1.4 pastille claire au repos", estClair(repos.bg), `bg = ${repos.bg}`);
    push("C1.5 icône noire au repos", estNoir(repos.color || repos.svgColor), `color = ${repos.color || repos.svgColor}`);

    await oeil.hover();
    await page.waitForTimeout(350);
    const survol = await oeil.evaluate((el) => {
      const svg = el.querySelector("svg");
      return { bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, svgColor: svg ? getComputedStyle(svg).color : null };
    });
    push("C1.6 survol : la pastille évolue", survol.bg !== repos.bg, `bg ${repos.bg} → ${survol.bg}`);
    push("C1.7 survol : l'icône reste noire/visible", estNoir(survol.color || survol.svgColor), `color survol = ${survol.color || survol.svgColor}`);

    await oeil.click();
    await page.waitForTimeout(300);
    const typeApres = await page.locator("#admin-password").getAttribute("type");
    push("C1.8 clic œil → champ bascule en texte", typeApres === "text", `type = ${typeApres}`);
    await page.screenshot({ path: `${OUT}/connexion.png`, fullPage: false });
  }

  push("C1.9 bienvenue Stevens (volet 14 conservé)", /Bienvenue,\s*Stevens/i.test(texte), "« Bienvenue, Stevens. »");

  /* ---------- C2x — mauvais mot de passe → 401 ---------- */
  await page.locator("#admin-password").fill(MDP_FAUX);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/admin/login"), { timeout: 15000 }).catch(() => null),
    page.locator("form button[type=submit]").first().click(),
  ]);
  await page.waitForTimeout(1500);
  const texteApres = await page.evaluate(() => document.body.innerText || "");
  push("C2.1 mauvais mot de passe → message d'erreur", /mot de passe incorrect/i.test(texteApres), "« Mot de passe incorrect. »");

  /* ---------- C3x — chunks téléchargés : marqueurs volet 15 ---------- */
  // Précharge les autres pages (préchargement à l'inactivité) pour élargir la collecte
  await page.evaluate(() => new Promise((r) => setTimeout(r, 4000)));
  const noms = Object.keys(chunks);
  const tout = Object.values(chunks).join("\n");
  fs.writeFileSync(`${OUT}/chunks-concatenes.js`, tout);
  console.log(`\n— ${noms.length} chunks téléchargés (${(tout.length / 1024).toFixed(0)} Ko) —`);

  const MARQUEURS = [
    ["Propositions commerciales", "libellé navigation (renommé)"],
    ["Créer une nouvelle proposition", "bouton création proposition"],
    ["Créer un nouveau devis", "bouton création devis"],
    ["Créer une nouvelle facture", "bouton création facture"],
    ["Espace privé de pilotage", "message d'intro dashboard"],
    ["votre boîte mail privée", "description copie email"],
    ["Délai estimé", "label formulaire"],
    ["02 à 03 semaines", "valeur défaut délai"],
    ["Moov Money", "mode de paiement conservé"],
  ];
  for (const [m, desc] of MARQUEURS) push(`C3 « ${m} » (${desc})`, tout.includes(m));

  const INTERDITS = [
    ["K.Quotes", "aucune mention côté client"],
    ["Factures & Documents", "ancienne rubrique supprimée"],
    ["Stevens Akpovi — Espace administrateur", "ancien titre de barre supérieure"],
  ];
  for (const [m, desc] of INTERDITS) push(`C3 « ${m} » ABSENT (${desc})`, !tout.includes(m));

  /* ---------- C4x — API documents protégée sans session ---------- */
  const apiResp = await page.evaluate(async () => {
    const r = await fetch("/api/documents", { method: "GET" });
    return { status: r.status };
  });
  push("C4.1 /api/documents protégée sans session", apiResp.status === 401 || apiResp.status === 403, `statut ${apiResp.status}`);

  await browser.close();

  /* ---------- Bilan ---------- */
  const ok = checks.filter((c) => c.ok).length;
  const total = checks.length;
  console.log(`\n===== BILAN : ${ok}/${total} verts =====`);
  fs.writeFileSync(`${OUT}/bilan.json`, JSON.stringify({ ok, total, checks, date: new Date().toISOString(), base: BASE }, null, 2));
  process.exit(ok === total ? 0 : 1);
})().catch((e) => {
  console.error("ERREUR SONDE :", e);
  process.exit(2);
});
