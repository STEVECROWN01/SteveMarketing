/**
 * SONDE LOCALE — VOLET 17 (25/11/2026).
 * Vérifie sur le serveur standalone (PORT 3100) :
 *  1. Page de connexion : logo doublé, titre « Bienvenue, Stevens ! »,
 *     message complet, label mot de passe aligné à gauche.
 *  2. Connexion : toast avec ICÔNE VERTE.
 *  3. Back-office : création de proposition SANS la liste en dessous.
 *  4. Formulaire devis : éditeur riche (barre d'outils), pas de champ
 *     Type / Banque / Points, champ délai estimé.
 *  5. Aperçu : conserve la page visualisée pendant la saisie.
 *  6. Déconnexion : toast avec icône verte.
 */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");

const BASE = "http://localhost:3100";
const MDP = "MotDePasseTest-Volet17";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const resultats = [];
  const ok = (nom, cond) => {
    resultats.push([cond ? "OK" : "ÉCHEC", nom]);
    console.log(`${cond ? "✓" : "✗"} ${nom}`);
  };

  await page.goto(`${BASE}/#admin`, { waitUntil: "networkidle", timeout: 60000 });

  /* 1 — Connexion */
  ok("C1 login : titre « Bienvenue, Stevens ! »", await page.locator("h1:has-text('Bienvenue, Stevens !')").count() === 1);
  const logo = page.locator('img[alt="Stevens Akpovi"]').first();
  const h = await logo.evaluate((el) => el.getBoundingClientRect().height);
  ok("C2 login : logo doublé (≥ 120px)", h >= 120);
  ok("C3 login : message « bonne session »", await page.locator("text=bonne session").count() >= 1);
  const label = page.locator('label[for="admin-password"]');
  const align = await label.evaluate((el) => getComputedStyle(el).textAlign);
  ok("C4 login : label mot de passe à gauche", align === "left");
  const msg = await page.locator("text=Votre back-office vous attend").first();
  const msgAlign = await msg.evaluate((el) => getComputedStyle(el.closest("p")).textAlign);
  console.log(`   (message centré : ${msgAlign})`);

  /* 2 — Connexion + toast vert */
  await page.fill("#admin-password", MDP);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  ok("C5 connexion réussie (nav back-office)", await page.locator("text=Back-office").count() >= 1);
  const toastIcon = await page.locator('li[role=status] svg.text-\\[\\#22c55e\\]').count();
  ok("C6 toast connexion : icône verte présente", toastIcon >= 1);

  /* 3 — Création de proposition : PAS de liste en dessous */
  await page.click('nav button:has-text("Propositions commerciales")');
  await page.waitForTimeout(600);
  const boutonCreer = page.locator('button:has-text("Créer une nouvelle proposition")').first();
  if ((await boutonCreer.count()) > 0) {
    await boutonCreer.click();
    await page.waitForTimeout(1200);
    const titreCreation = await page.locator("text=Nouvelle proposition commerciale").count();
    // la liste (entête + panneau vide) ne doit PLUS apparaître sous la création
    const listeSousCreation = await page.locator('h2:has-text("Propositions commerciales")').count();
    ok("C7 création proposition : page de création ouverte", titreCreation >= 1);
    ok("C8 création proposition : PAS de liste en dessous", listeSousCreation === 0);
  } else {
    ok("C7 création proposition : bouton trouvé", false);
  }

  /* 4 — Formulaire devis */
  await page.click('nav button:has-text("Devis")');
  await page.waitForTimeout(600);
  const boutonDevis = page.locator('button:has-text("Créer un nouveau devis")').first();
  if ((await boutonDevis.count()) > 0) {
    await boutonDevis.click();
    await page.waitForTimeout(1500);
    ok("C9 création devis : page ouverte", await page.locator("text=Nouveau devis").count() >= 1);
    ok("C10 devis : éditeur riche présent", await page.locator('.rich-editable').count() >= 1);
    ok("C11 devis : barre Gras présente", await page.locator('button[aria-label="Gras"]').count() >= 1);
    ok("C12 devis : barre Italique présente", await page.locator('button[aria-label="Italique"]').count() >= 1);
    ok("C13 devis : barre Taille supérieure présente", await page.locator('button[aria-label*="Taille supérieure"]').count() >= 1);
    ok("C14 devis : barre liste numérotée présente", await page.locator('button[aria-label="Liste numérotée"]').count() >= 1);
    ok("C15 devis : barre liste à puces présente", await page.locator('button[aria-label="Liste à puces"]').count() >= 1);
    ok("C16 devis : PAS de champ Type", await page.locator('label:has-text("Type")').count() === 0);
    ok("C17 devis : PAS de champ Banque", await page.locator('label:has-text("Banque")').count() === 0);
    ok("C18 devis : PAS de champ Points", await page.locator('label:has-text("Points")').count() === 0);
    ok("C19 devis : champ Délai estimé présent", await page.locator('label:has-text("Délai estimé")').count() >= 1);
    ok("C20 devis : PAS de champ Conditions de règlement", await page.locator('label:has-text("Condition")').count() === 0);
    ok("C21 devis : champ Titulaire (après IBAN/BIC)", await page.locator('label:has-text("Titulaire du compte")').count() === 1);
    /* le panneau « Aucun devis… » de la liste ne doit pas apparaître
       sous la page de création (le titre « Nouveau devis » est h2) */
    const listeSousDevis = await page.locator("text=Aucun devis pour l'instant").count();
    const boutonListeSous = await page.locator('button:has-text("Créer un nouveau devis")').count();
    ok("C22 création devis : PAS de liste en dessous", listeSousDevis === 0 && boutonListeSous === 0);

    /* 5 — Aperçu : aller à la page 2 puis saisir → rester en page 2 */
    await page.waitForTimeout(3000);
    const totalTxt = await page.locator("text=/^\\s*\\d+ \\/ \\d+\\s*$/").first().textContent().catch(() => null);
    console.log("   compteur aperçu :", totalTxt);
    const total = totalTxt ? Number(totalTxt.trim().split("/")[1]) : 1;
    if (total >= 2) {
      await page.locator('button[aria-label="Page suivante"]').click();
      await page.waitForTimeout(900);
      // modifier le champ introduction (temps réel)
      await page.locator("textarea").first().fill("Introduction modifiée pendant la visualisation de la page 2 pour vérifier la conservation de la page en aperçu.");
      await page.waitForTimeout(2500);
      const apres = await page.locator("text=/^\\s*\\d+ \\/ \\d+\\s*$/").first().textContent().catch(() => null);
      console.log("   compteur après saisie :", apres);
      ok("C23 aperçu : page conservée pendant la mise à jour", apres && apres.trim().startsWith("2"));
    } else {
      ok("C23 aperçu : document multi-pages pour le test", false);
    }

    /* test gras dans l'éditeur */
    const zone = page.locator(".rich-editable").first();
    await zone.click();
    await zone.fill("");
    await page.keyboard.type("Description de test en gras partiel.");
    await page.evaluate(() => {
      const el = document.querySelector(".rich-editable");
      const range = document.createRange();
      range.setStart(el.firstChild, 0);
      range.setEnd(el.firstChild, 11);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
    await page.locator('button[aria-label="Gras"]').click();
    await page.waitForTimeout(400);
    const html = await zone.innerHTML();
    ok("C24 éditeur : mise en gras appliquée", /<(b|strong)\b/i.test(html));
  }

  /* 6 — Déconnexion + toast vert */
  await page.click('button:has-text("Fermer")');
  await page.waitForTimeout(2000);
  ok("C25 déconnexion : retour au login", await page.locator("#admin-password").count() === 1);
  const toastVert2 = await page.locator('li[role=status] svg.text-\\[\\#22c55e\\]').count();
  ok("C26 toast déconnexion : icône verte", toastVert2 >= 1);

  await page.screenshot({ path: "/tmp/render/sonde-final.png", fullPage: false });
  await browser.close();

  const echecs = resultats.filter(([s]) => s !== "OK");
  console.log(`\n===== ${resultats.length - echecs.length}/${resultats.length} contrôles OK =====`);
  if (echecs.length) {
    console.log("ÉCHECS :");
    echecs.forEach(([, n]) => console.log("  ✗ " + n));
    process.exit(1);
  }
})();
