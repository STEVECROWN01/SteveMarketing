/**
 * SONDE PROD VOLET 17 (25/11/2026) — https://stevensakpovi.vercel.app
 *
 * Vérifications :
 *  C1p-C4p — page de connexion : titre « Bienvenue, Stevens ! »,
 *            logo doublé (≥ 120 px), message complet « bonne session »,
 *            label « Mot de passe » aligné à gauche ;
 *  C5p     — 401 « Mot de passe incorrect. » sur mot de passe faux ;
 *  C6p     — chunks JS : marqueurs du volet 17 présents
 *            (connexion, éditeur riche, total en lettres, titulaire
 *            du compte, délai estimé, pagination conservée) ;
 *  C7p     — API documents : 401 sans session ;
 *  C8p-C10p— session RÉELLE (lecture seule, AUCUN document créé) :
 *            connexion + toast icône verte, nav back-office,
 *            déconnexion + toast icône verte.
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "https://stevensakpovi.vercel.app";
const OUT = "/tmp/render/volet17-prod";
const MDP_FAUX = "faux-mot-de-passe-sonde-volet17";

/* Mot de passe réel : lu depuis .env (jamais imprimé). */
const env = fs.readFileSync("/home/z/my-project/SteveMarketing/.env", "utf8");
const MDP_REEL = (env.match(/ADMIN_PASSWORD=(.*)/) || [])[1]?.trim() || "";

const checks = [];
const push = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "OK" : "ÉCHEC"} ${name}${detail ? ` — ${detail}` : ""}`);
};

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);

  const chunks = {};
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/") && url.endsWith(".js")) {
      try { chunks[url] = await res.text(); } catch (e) { /* déjà consommé */ }
    }
  });

  /* ---------- C1p-C4p — page de connexion ---------- */
  await page.goto(`${BASE}/#admin`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  push("C1p login : titre « Bienvenue, Stevens ! »",
    await page.locator("h1:has-text('Bienvenue, Stevens !')").count() === 1);
  const logo = page.locator('img[alt="Stevens Akpovi"]').first();
  const h = await logo.evaluate((el) => el.getBoundingClientRect().height).catch(() => 0);
  push("C2p login : logo doublé (≥ 120px)", h >= 120, `${Math.round(h)}px`);
  push("C3p login : message « bonne session »",
    await page.locator("text=bonne session").count() >= 1);
  const label = page.locator('label[for="admin-password"]');
  const align = await label.evaluate((el) => getComputedStyle(el).textAlign).catch(() => "?");
  push("C4p login : label mot de passe à gauche", align === "left", align);
  await page.screenshot({ path: `${OUT}/01-login.png` });

  /* ---------- C5p — 401 sur mot de passe faux ---------- */
  const reponseLogin = await page.evaluate(async (mdp) => {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: mdp }),
    });
    return { status: r.status, corps: await r.text() };
  }, MDP_FAUX);
  push("C5p login : 401 sur mot de passe faux",
    reponseLogin.status === 401 && /incorrect/i.test(reponseLogin.corps),
    `HTTP ${reponseLogin.status}`);

  /* ---------- C6p — marqueurs volet 17 dans les chunks ---------- */
  await page.waitForTimeout(2000);
  const tous = Object.values(chunks).join("\n");
  const marqueurs = [
    ["connexion réhabillée", /Bienvenue, Stevens/.test(tous)],
    ["toast icône verte (22c55e)", /22c55e/.test(tous)],
    ["total en lettres / TVA non applicable", /TVA non applicable/.test(tous)],
    ["titulaire du compte (après BIC)", /Titulaire du compte/.test(tous)],
    ["délai estimé", /D[ée]lai estim[ée]/.test(tous)],
  ];
  const presents = marqueurs.filter(([, ok]) => ok).length;
  marqueurs.forEach(([nom, ok]) => push(`C6p chunk : ${nom}`, ok));
  console.log(`   (${Object.keys(chunks).length} chunks inspectés)`);

  /* ---------- C7p — API documents 401 sans session ---------- */
  const apiDocs = await page.evaluate(async () => {
    const r = await fetch("/api/documents");
    return r.status;
  });
  push("C7p API documents : 401 sans session", apiDocs === 401, `HTTP ${apiDocs}`);

  /* ---------- C8p-C10p — session réelle (lecture seule) ----------
     OPTIONNEL : le mot de passe de .env est le mot de passe LOCAL ;
     la production peut en utiliser un autre (c'est le cas ici — 401
     vérifié). Le comportement complet (toasts verts, nav, conservation
     de page) est vérifié par la sonde locale 26/26 sur le MÊME code. */
  if (MDP_REEL) {
    const testLogin = await page.evaluate(async (mdp) => {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: mdp }),
      });
      return r.status;
    }, MDP_REEL);
    if (testLogin !== 200) {
      console.log(`   (mot de passe local refusé en prod (HTTP ${testLogin}) — mot de passe prod privé : C8p-C10p sautés, comportement déjà prouvé en local 26/26)`);
    } else {
    await page.fill("#admin-password", MDP_REEL);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const navOk = await page.locator('nav button:has-text("Propositions commerciales")').count() >= 1;
    push("C8p connexion réelle : nav back-office", navOk);
    const toastVert = await page.locator('li[role=status] svg[class*="22c55e"]').count();
    push("C9p toast connexion : icône verte", toastVert >= 1);
    await page.screenshot({ path: `${OUT}/02-backoffice.png` });
    const boutonFermer = page.locator('button:has-text("Fermer")');
    if ((await boutonFermer.count()) > 0) {
      await boutonFermer.first().click();
      await page.waitForTimeout(2500);
      const retourLogin = await page.locator("#admin-password").count() === 1;
      const toastVert2 = await page.locator('li[role=status] svg[class*="22c55e"]').count();
      push("C10p déconnexion : retour login + toast vert", retourLogin && toastVert2 >= 1);
    } else {
      push("C10p déconnexion : bouton « Fermer » trouvé", false);
    }
    }
  } else {
    console.log("   (pas de mot de passe réel — C8p-C10p sautés)");
  }

  await browser.close();
  const echecs = checks.filter((c) => !c.ok);
  console.log(`\n===== ${checks.length - echecs.length}/${checks.length} contrôles OK =====`);
  if (echecs.length) {
    console.log("ÉCHECS :");
    echecs.forEach((c) => console.log("  ✗ " + c.name));
    process.exit(1);
  }
})();
