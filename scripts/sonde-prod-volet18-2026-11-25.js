/**
 * SONDE PROD — VOLET 18 (25/11/2026) — https://stevensakpovi.vercel.app
 *
 * Vérifie le déploiement du site bilingue : hero (description +
 * zoom), bouton switch (header + panneau), traduction complète sans
 * rechargement avec page conservée, persistance, panneau hamburger
 * réorganisé, contact sticky, espace admin intact (page de
 * connexion), marqueurs i18n dans les chunks.
 *
 * Aucune donnée touchée : lecture seule, aucun document créé.
 */
const { chromium } = require("playwright");

const BASE = "https://stevensakpovi.vercel.app";

const checks = [];
const push = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "OK" : "ÉCHEC"} ${name}${detail ? ` — ${detail}` : ""}`);
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);

  /* ---------- Hero (français) ---------- */
  await page.goto(`${BASE}/#accueil`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(3000);
  const texteDesc = (await page.locator(".hero-desc").textContent()) ?? "";
  push("C1p hero : « — PMEs / Professionnels » (nouvelle casse)", /—\s*PMEs\s*\/\s*Professionnels/.test(texteDesc));
  const nbZoom = await page.locator("#hero .mockup-zoom").count();
  push("C2p hero : zoom au survol restauré (2 mockups)", nbZoom === 2, `${nbZoom}/2`);

  /* ---------- Bouton switch + panneau hamburger ---------- */
  const boutonHeader = page.locator("header nav").first().locator("button").filter({ hasText: "FR" }).first();
  push("C3p header : bouton switch présent", (await boutonHeader.count()) >= 1);
  await page.click('button[aria-controls="menu-plein-ecran"]');
  await page.waitForTimeout(1200);
  const navsPanel = page.locator("#menu-plein-ecran nav");
  const navAutres = navsPanel.nth(1);
  const sociaux = await navAutres.locator("a[href*='linkedin'], a[href*='wa.me'], a[href*='mailto']").count();
  push("C4p hamburger : icônes sociales dans la colonne autres liens", sociaux === 3, `${sociaux}/3`);
  push("C5p hamburger : séparateur supprimé", (await page.locator("#menu-plein-ecran .separator-fade").count()) === 0);
  const boutonsHaut = await page.locator("#menu-plein-ecran .absolute.right-4 button").count();
  push("C6p hamburger : bouton langue + fermer en haut à droite", boutonsHaut === 2, `${boutonsHaut}`);
  const ordreOK = await page.locator("#menu-plein-ecran .absolute.right-4").evaluate((el) => {
    const boutons = Array.from(el.querySelectorAll("button"));
    const idxLang = boutons.findIndex((b) => /EN|FR/.test((b.textContent ?? "").trim()));
    return idxLang === 0 && boutons.length === 2;
  });
  push("C7p hamburger : langue À GAUCHE du bouton fermer", ordreOK);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);

  /* ---------- Switch EN ---------- */
  await boutonHeader.click();
  await page.waitForTimeout(2800);
  const h1 = (await page.locator("#hero h1").textContent()) ?? "";
  push("C8p switch EN : hero traduit", /I\s+Build|Generate\s+Sales/i.test(h1), JSON.stringify(h1.slice(0, 50)));
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  push("C9p switch EN : <html lang>", htmlLang === "en", htmlLang);
  push("C10p switch EN : persistance localStorage", (await page.evaluate(() => localStorage.getItem("site-langue"))) === "en");

  /* ---------- Navigation + contact EN ---------- */
  await page.goto(`${BASE}/#contact`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(3200);
  push("C11p navigation EN : page conservée, contact en anglais", (await page.locator("text=Existing clients").count()) >= 1);
  const colGauche = page.locator("section .container-site .grid.lg\\:grid-cols-\\[0\\.42fr_0\\.58fr\\] > div").first();
  const positionCol = await colGauche.evaluate((el) => getComputedStyle(el).position);
  push("C12p contact : colonne gauche sticky (bureau)", positionCol === "sticky", positionCol);

  /* ---------- Retour FR ---------- */
  await page.goto(`${BASE}/#accueil`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.click('button[aria-controls="menu-plein-ecran"]');
  await page.waitForTimeout(1000);
  await page.locator("#menu-plein-ecran .absolute.right-4 button").first().click();
  await page.waitForTimeout(2000);
  const h1Fr = (await page.locator("#hero h1").textContent()) ?? "";
  push("C13p retour FR : hero redevient français", /Je\s+crée|Génèrent\s+des\s+Ventes/.test(h1Fr));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  push("C14p retour FR : localStorage", (await page.evaluate(() => localStorage.getItem("site-langue"))) === "fr");

  /* ---------- Espace admin intact (page de connexion) ---------- */
  await page.goto(`${BASE}/#admin`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2800);
  push(
    "C15p admin : page de connexion en français, intacte",
    (await page.locator("h1:has-text('Bienvenue, Stevens !')").count()) === 1,
  );
  const reponseLogin = await page.evaluate(async () => {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "faux-mot-de-passe-sonde-volet18" }),
    });
    return r.status;
  });
  push("C16p admin : 401 sur mot de passe faux (route intacte)", reponseLogin === 401, `HTTP ${reponseLogin}`);
  const apiTraduire = await page.evaluate(async () => {
    const r = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texte: "Hello" }),
    });
    return r.status;
  });
  push("C17p API traduction : protégée (401 sans session)", apiTraduire === 401, `HTTP ${apiTraduire}`);

  /* ---------- Marqueurs du volet 18 dans les chunks ---------- */
  await page.goto(`${BASE}/#accueil`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  const chunks = {};
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) {
      try { chunks[url] = await res.text(); } catch (e) { /* déjà consommé */ }
    }
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(4000);
  const tous = Object.values(chunks).join("\n");
  const marqueurs = [
    ["carte de traduction (SMEs)", /SMEs/.test(tous)],
    ["carte de traduction (Existing clients)", /Existing clients/.test(tous)],
    ["clé de stockage de langue", /site-langue/.test(tous)],
    ["libellés devis EN (Quote)", /Quote/.test(tous)],
    ["menu version (Version anglaise)", /Version anglaise/.test(tous)],
  ];
  marqueurs.forEach(([nom, ok]) => push(`C18p chunk : ${nom}`, ok));
  console.log(`   (${Object.keys(chunks).length} chunks inspectés)`);

  await browser.close();
  const echecs = checks.filter((c) => !c.ok);
  console.log(`\n===== ${checks.length - echecs.length}/${checks.length} contrôles OK =====`);
  if (echecs.length) {
    console.log("ÉCHECS :");
    echecs.forEach((c) => console.log("  ✗ " + c.name));
    process.exit(1);
  }
})();
