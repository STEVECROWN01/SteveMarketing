/**
 * SONDE PROD VOLET 16 (25/11/2026) — https://stevensakpovi.vercel.app
 *
 * Aucun mock réseau : la vraie API est utilisée (mot de passe
 * VOLONTAIREMENT faux pour le test 401 — aucune connexion réelle,
 * aucun document touché).
 *
 * C1x — page de connexion : logo (plus de cadenas), centré, message
 *        centré, titre « Backoffice », œil noir conservé ;
 * C2x — 401 « Mot de passe incorrect. » sur mauvais mot de passe ;
 * C3x — chunks JS réellement téléchargés : marqueurs du volet 16
 *        présents, anciens marqueurs absents ;
 * C4x — l'API documents répond 401 sans session.
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "https://stevensakpovi.vercel.app";
const OUT = "/tmp/render/volet16-prod";
const MDP_FAUX = "faux-mot-de-passe-sonde-volet16";

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

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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

  const logoCarte = page.locator("div.max-w-md img[alt='Stevens Akpovi']");
  const nbLogo = await logoCarte.count();
  push("C1.2 logo du site dans la carte (cadenas remplacé)", nbLogo === 1, `${nbLogo} logo`);
  const nbLock = await page.locator("svg[class*='lock'], svg.lucide-lock").count();
  push("C1.3 plus d'icône cadenas", nbLock === 0, `${nbLock} cadenas`);

  if (nbLogo) {
    const boiteLogo = await logoCarte.first().boundingBox();
    const boiteCarte = await page.locator("#admin-password")
      .locator("xpath=ancestor::div[starts-with(@class,'w-full max-w-md')]").first().boundingBox();
    if (boiteLogo && boiteCarte) {
      const ecart = Math.abs(boiteLogo.x + boiteLogo.width / 2 - (boiteCarte.x + boiteCarte.width / 2));
      push("C1.4 logo centré horizontalement", ecart < 6, `écart : ${ecart.toFixed(1)}px`);
    }
    const alignTexte = await page.locator("#admin-password")
      .locator("xpath=ancestor::div[starts-with(@class,'w-full max-w-md')]").first()
      .evaluate((el) => getComputedStyle(el).textAlign);
    push("C1.5 message centré (text-align)", alignTexte === "center", `text-align: ${alignTexte}`);
  }

  push("C1.6 titre « Backoffice »", /backoffice/i.test(texte));
  push("C1.7 ancien « Espace administrateur » absent", !texte.includes("Espace administrateur"));
  push("C1.8 « Bienvenue, Stevens. » conservé", /Bienvenue,\s*Stevens/i.test(texte));

  const oeil = page.locator("xpath=//input[@id='admin-password']/following-sibling::button").first();
  const styleOeil = await oeil.evaluate((el) => ({ color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor }));
  push("C1.9 œil noir conservé (volets 14-15)",
    styleOeil.color === "rgb(0, 0, 0)" && styleOeil.bg === "rgb(228, 228, 228)",
    `couleur ${styleOeil.color}`);
  await page.screenshot({ path: `${OUT}/connexion.png` });

  /* ---------- C2x — mauvais mot de passe → 401 ---------- */
  await page.locator("#admin-password").fill(MDP_FAUX);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/admin/login"), { timeout: 15000 }).catch(() => null),
    page.locator("form button[type=submit]").first().click(),
  ]);
  await page.waitForTimeout(1500);
  const texteApres = await page.evaluate(() => document.body.innerText || "");
  push("C2.1 mauvais mot de passe → « Mot de passe incorrect. »", /mot de passe incorrect/i.test(texteApres));

  /* ---------- C3x — chunks : marqueurs du volet 16 ---------- */
  await page.evaluate(() => new Promise((r) => setTimeout(r, 4000)));
  /* Décoder les séquences \xNN posées par le minifieur sur les
     littéraux non ASCII (« D\xe9lai… ») pour que les marqueurs
     accentués soient cherchés sous leur forme réelle. */
  const tout = Object.values(chunks)
    .join("\n")
    .replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
  fs.writeFileSync(`${OUT}/chunks-concatenes.js`, tout);
  console.log(`\n— ${Object.keys(chunks).length} chunks téléchargés (${(tout.length / 1024).toFixed(0)} Ko) —`);

  const MARQUEURS = [
    ["Backoffice", "titre de la carte de connexion"],
    ["Signée", "statut de demande (ex-Gagnée)"],
    ["Non retenue", "statut de demande (ex-Perdue)"],
    ["Créer un devis pour la demande de", "bouton demandes → devis"],
    ["Demande à l'origine de ce devis", "carte récapitulatif de la demande"],
    ["Aucun devis n'est créé pour le moment", "message facture sans devis"],
    ["Titre de la proposition", "champ formulaire proposition"],
    ["Périmètre de la prestation", "section 03 (formulaire + document)"],
    ["Modalités de paiement", "section 06 (formulaire + document)"],
    ["Délai estimé de réalisation", "libellé du calendrier (template)"],
    ["Montant total de la prestation", "bandeau investissement (template)"],
    ["Bien cordialement", "formule de conclusion (template)"],
    ["règlement toujours à réception", "note du formulaire devis"],
  ];
  for (const [m, desc] of MARQUEURS) push(`C3 « ${m} » (${desc})`, tout.includes(m));

  /* Le champ est supprimé du FORMULAIRE : les options du select
     (CONDITIONS_REGLEMENT) ne sont plus dans le paquet client ; le
     libellé « Conditions de règlement : » reste légitimement dans le
     gabarit IMPRIMÉ (bloc coordonnées bancaires des devis). */
  const INTERDITS = [
    ["Sous 30 jours", "option du select supprimé (conditions de règlement)"],
    ["À réception de facture", "option du select supprimé"],
  ];
  for (const [m, desc] of INTERDITS) push(`C3 « ${m} » ABSENT (${desc})`, !tout.includes(m));

  /* ---------- C4x — API documents protégée ---------- */
  const apiResp = await page.evaluate(async () => {
    const r = await fetch("/api/documents", { method: "GET" });
    return { status: r.status };
  });
  push("C4.1 /api/documents protégée sans session", apiResp.status === 401 || apiResp.status === 403, `statut ${apiResp.status}`);

  await browser.close();

  const ok = checks.filter((c) => c.ok).length;
  const total = checks.length;
  console.log(`\n===== BILAN : ${ok}/${total} verts =====`);
  fs.writeFileSync(`${OUT}/bilan.json`, JSON.stringify({ ok, total, checks, date: new Date().toISOString(), base: BASE }, null, 2));
  process.exit(ok === total ? 0 : 1);
})().catch((e) => {
  console.error("ERREUR SONDE :", e);
  process.exit(2);
});
