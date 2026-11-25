/**
 * SONDE LOCALE — VOLET 18 (25/11/2026).
 * Site bilingue FR/EN, hero (description + zoom mockups), contact
 * sticky, panneau hamburger réorganisé, documents bilingues,
 * traduction des demandes.
 *
 * Serveur standalone PORT 3100, ADMIN_PASSWORD de test.
 * NOTE : les aria-labels étant TRADUITS, les sélecteurs sont
 * structurels (navs par position, textes par contenu) et le panneau
 * hamburger est testé AVANT le passage en anglais.
 */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");

const BASE = "http://localhost:3100";
const MDP = "MotDePasseTest-Volet17";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(18000);
  const resultats = [];
  const ok = (nom, cond, detail) => {
    resultats.push([cond ? "OK" : "ÉCHEC", nom]);
    console.log(`${cond ? "✓" : "✗"} ${nom}${detail ? ` — ${detail}` : ""}`);
  };

  await page.goto(`${BASE}/#accueil`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2500);

  /* ---------- 1 — HERO (français) ---------- */
  const desc = page.locator(".hero-desc");
  const texteDesc = (await desc.textContent()) ?? "";
  ok("C1 hero : mention « — PMEs / Professionnels » (nouvelle casse)", /—\s*PMEs\s*\/\s*Professionnels/.test(texteDesc));
  const taille = await desc.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  ok("C2 hero : description légèrement réduite (≤ 16,1 px)", taille <= 16.1, `${taille.toFixed(1)} px`);
  const nbZoom = await page.locator("#hero .mockup-zoom").count();
  ok("C3 hero : zoom au survol restauré sur les 2 mockups", nbZoom === 2, `${nbZoom}/2`);
  const boutonHeader = page.locator("header nav").first().locator("button").filter({ hasText: "FR" }).first();
  ok("C4 header : bouton switch présent (code FR)", (await boutonHeader.count()) >= 1);
  const rond = await boutonHeader.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
  ok("C5 header : bouton rond (plein cercle)", rond > 1000, `${rond}px`);

  /* ---------- 2 — Panneau hamburger (français) ---------- */
  await page.click('button[aria-controls="menu-plein-ecran"]');
  await page.waitForTimeout(1000);
  const navsPanel = page.locator("#menu-plein-ecran nav");
  ok("C6 hamburger : deux colonnes de navigation", (await navsPanel.count()) === 2);
  const navAutres = navsPanel.nth(1);
  const sociauxDansCol = await navAutres.locator("a[href*='linkedin'], a[href*='wa.me'], a[href*='mailto']").count();
  ok("C7 hamburger : les 3 icônes sociales DANS la colonne autres liens", sociauxDansCol === 3, `${sociauxDansCol}/3`);
  const separateur = await page.locator("#menu-plein-ecran .separator-fade").count();
  ok("C8 hamburger : trait de séparation supprimé", separateur === 0);
  const boutonsHaut = await page.locator("#menu-plein-ecran .absolute.right-4 button").count();
  ok("C9 hamburger : 2 boutons en haut à droite (langue + fermer)", boutonsHaut === 2, `${boutonsHaut}`);
  const ordreOK = await page.locator("#menu-plein-ecran .absolute.right-4").evaluate((el) => {
    const boutons = Array.from(el.querySelectorAll("button"));
    const idxLang = boutons.findIndex((b) => /EN|FR/.test((b.textContent ?? "").trim()));
    const idxFermer = boutons.findIndex((b) => (b.getAttribute("aria-label") ?? "").length > 0 && idxLang !== -1 && b !== boutons[idxLang]);
    return idxLang !== -1 && idxFermer !== -1 && idxLang < idxFermer;
  });
  ok("C10 hamburger : bouton langue À GAUCHE du bouton fermer", ordreOK);
  /* Fermeture du panneau pour la suite. */
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);

  /* ---------- 3 — Switch vers l'anglais ---------- */
  await boutonHeader.click();
  await page.waitForTimeout(2500);
  const h1 = (await page.locator("#hero h1").textContent()) ?? "";
  ok("C11 switch EN : titre du hero traduit", /I\s+Build|Generate\s+Sales/i.test(h1), JSON.stringify(h1.slice(0, 60)));
  const descEn = (await page.locator(".hero-desc").textContent()) ?? "";
  ok("C12 switch EN : description traduite (SMEs)", /SMEs/.test(descEn));
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  ok("C13 switch EN : attribut <html lang>", htmlLang === "en", htmlLang);
  const langueStockee = await page.evaluate(() => localStorage.getItem("site-langue"));
  ok("C14 switch EN : choix persisté (localStorage)", langueStockee === "en", String(langueStockee));
  const boutonEn = await page.locator("header nav").first().locator("button").filter({ hasText: "EN" }).count();
  ok("C15 switch EN : le bouton affiche EN", boutonEn >= 1);
  const h1detail = await page.locator("#hero h1").textContent();

  /* ---------- 4 — Navigation en EN ---------- */
  await page.goto(`${BASE}/#contact`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2800);
  const langueApresNav = await page.evaluate(() => localStorage.getItem("site-langue"));
  ok("C16 navigation : la page est conservée et la langue suit", langueApresNav === "en" && (await page.locator("text=Existing clients").count()) >= 1);
  const titre = await page.evaluate(() => document.title);
  ok("C17 navigation EN : titre de page adapté", /stevens akpovi/i.test(titre), titre);
  const accordEn = await page.locator("text=Existing clients").count();
  ok("C18 contact EN : accordéon « Existing clients »", accordEn >= 1);

  /* ---------- 5 — Rechargement : persistance ---------- */
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(2800);
  const contactEnApresReload = await page.locator("text=Existing clients").count();
  ok("C19 rechargement : l'anglais persiste (page contact)", contactEnApresReload >= 1);

  /* ---------- 6 — Retour au français via le panneau ---------- */
  await page.goto(`${BASE}/#accueil`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.click('button[aria-controls="menu-plein-ecran"]');
  await page.waitForTimeout(900);
  await page.locator("#menu-plein-ecran .absolute.right-4 button").first().click();
  await page.waitForTimeout(1800);
  const h1Fr = (await page.locator("#hero h1").textContent()) ?? "";
  ok("C20 retour FR : hero redevient français", /Je\s+crée|Génèrent\s+des\s+Ventes/.test(h1Fr), JSON.stringify(h1Fr.slice(0, 40)));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);

  /* ---------- 7 — Contact : colonne gauche sticky ---------- */
  await page.goto(`${BASE}/#contact`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2800);
  const colGauche = page.locator("section .container-site .grid.lg\\:grid-cols-\\[0\\.42fr_0\\.58fr\\] > div").first();
  const positionCol = await colGauche.evaluate((el) => getComputedStyle(el).position);
  ok("C21 contact : colonne gauche collée (sticky, bureau)", positionCol === "sticky", positionCol);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(1300);
  const boite = await colGauche.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, fenetre: window.innerHeight };
  });
  ok("C22 contact : après scroll, le bloc reste calé à l'écran (128 px)", boite.top >= 123 && boite.top <= 133, `top=${Math.round(boite.top)}px`);
  const footerVisible = await page.evaluate(() => {
    const f = document.querySelector("footer");
    if (!f) return false;
    return f.getBoundingClientRect().top < window.innerHeight;
  });
  ok("C23 contact : en plein formulaire, le pied de page reste sous le pli", !footerVisible);

  /* ---------- 8 — API traduction : protection session ---------- */
  const sansSession = await page.evaluate(async () => {
    const r = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texte: "Hello" }),
    });
    return r.status;
  });
  ok("C24 API traduction : 401 sans session admin", sansSession === 401, `HTTP ${sansSession}`);

  /* ---------- 9 — Espace admin ---------- */
  await page.goto(`${BASE}/#admin`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2200);
  await page.fill("#admin-password", MDP);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3200);
  ok("C25 admin : connexion réussie", (await page.locator('nav button:has-text("Propositions commerciales")').count()) >= 1);

  const avecSession = await page.evaluate(async () => {
    const r = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texte: "Hello, I need a professional website for my business.", de: "en", vers: "fr" }),
    });
    const data = await r.json().catch(() => null);
    return { status: r.status, traduction: data?.traduction ?? "" };
  });
  ok(
    "C26 API traduction : EN→FR fonctionne (session ouverte)",
    avecSession.status === 200 && /[éèêàç]|site web|professionnel|besoin/i.test(avecSession.traduction),
    avecSession.traduction.slice(0, 60),
  );

  /* Création de devis : bouton FR/EN */
  await page.click('nav button:has-text("Devis")');
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Créer un nouveau devis")').first().click();
  await page.waitForTimeout(2800);
  const boutonLangDoc = page.locator('button[aria-label^="Basculer la langue du document"]');
  ok("C27 devis : bouton de switch de langue présent", (await boutonLangDoc.count()) === 1);

  await page.waitForTimeout(2500);
  const iframe = page.locator("iframe").first();
  const apercuFr = (await iframe.contentFrame().locator("body").textContent().catch(() => "")) ?? "";
  ok("C28 devis : aperçu initial en français (« Devis »)", /Devis/i.test(apercuFr));

  await boutonLangDoc.click();
  await page.waitForTimeout(3500);
  const apercuEn = (await iframe.contentFrame().locator("body").textContent().catch(() => "")) ?? "";
  ok("C29 devis : aperçu traduit en anglais (« Quote »)", /Quote/i.test(apercuEn));
  const boutonDocTxt = (await boutonLangDoc.textContent().catch(() => "")) ?? "";
  ok("C30 devis : le bouton affiche EN", /EN/.test(boutonDocTxt), boutonDocTxt.trim());
  const introEn = await page.locator("textarea").first().inputValue().catch(() => "");
  ok("C31 devis : texte par défaut (intro) passé en anglais", /quote|website|professional|thank/i.test(introEn), introEn.slice(0, 60));

  await page.locator('button:has-text("Générer le PDF")').first().click();
  await page.waitForTimeout(1500);
  ok("C32 devis : menu « Version du document » (choix FR/EN)", (await page.locator("h3:has-text('Version du document')").count()) === 1);
  ok(
    "C33 devis : options « Version française » et « Version anglaise »",
    (await page.locator('button:has-text("Version française")').count()) >= 1 &&
      (await page.locator('button:has-text("Version anglaise")').count()) >= 1,
  );
  await page.locator('div[role="dialog"][aria-label="Version du PDF"] button:has-text("Annuler")').click();
  await page.waitForTimeout(800);
  await page.click('button:has-text("Fermer")');
  await page.waitForTimeout(2200);
  await page.goto(`${BASE}/#accueil`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(2200);
  ok(
    "C34 le site public reste FR après la session admin (admin non traduit)",
    (await page.locator("text=Je crée").count()) >= 1,
  );

  await browser.close();

  const echecs = resultats.filter(([s]) => s !== "OK");
  console.log(`\n===== ${resultats.length - echecs.length}/${resultats.length} contrôles OK =====`);
  if (echecs.length) {
    console.log("ÉCHECS :");
    echecs.forEach(([, n]) => console.log("  ✗ " + n));
    process.exit(1);
  }
})();
