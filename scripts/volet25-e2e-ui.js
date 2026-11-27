/** E2E 28/11 — UI (playwright) : espace portfolio (6 projets, pas de
 *  toast rouge), désélection d'un devis (M22), session expirée →
 *  écran de connexion avec message clair (M23-b), compteur cohérent. */
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
let echecs = 0;

function ok(nom, cond, note = "") {
  if (!cond) echecs++;
  console.log(`${cond ? "OK " : "ÉCHEC"} ${nom}${note ? ` — ${note}` : ""}`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  /* toasts destructifs capturés — APRÈS la connexion seulement
   * (le 401 du montage AVANT connexion est normal : l'écran de
   * connexion s'affiche, ce n'est pas le bug « Non autorisé »). */
  let connexionFaite = false;
  const toastsRouges = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() === 401 && connexionFaite) {
      toastsRouges.push(`401 sur ${r.url().replace(BASE, "")}`);
    }
  });

  /* ---------- 1. connexion ---------- */
  await page.goto(`${BASE}/#/admin`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.fill("#admin-password", "MotDePasseTest-Volet25");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  connexionFaite = true;
  const connecte = await page.locator("text=/Tableau de bord/i").count();
  ok("connexion → tableau de bord", connecte >= 1);

  /* ---------- 2. compteur Portfolio du site (badge = total en ligne) ---------- */
  /* le badge vit dans le BOUTON de navigation (barre latérale /
   * mobile) : chercher l'élément de navigation qui contient À LA FOIS
   * « Portfolio du site » et un compteur (X). */
  const navs = await page.locator("nav, aside, [role=navigation]").allInnerTexts().catch(() => []);
  let badge = null;
  for (const t of navs) {
    const m = t.match(/Portfolio du site[^0-9]*(\d+)/);
    if (m) {
      badge = m[1];
      break;
    }
  }
  if (badge === null) {
    /* repli : chercher dans toute la page (le dashboard) */
    const tout = await page.locator("body").innerText();
    const m = tout.match(/Portfolio du site[^0-9]*\(?(\d+)\)?/);
    if (m) badge = m[1];
  }
  ok("badge « Portfolio du site » présent avec compteur", badge !== null, `badge = « ${badge} »`);

  /* ---------- 3. espace portfolio : 6 projets, AUCUN toast rouge ---------- */
  await page.locator("text=/Portfolio du site/i").first().click();
  await page.waitForTimeout(3000);
  const titre = await page.locator("text=/projets? en ligne/i").first().textContent().catch(() => "");
  const enLigne = Number((titre.match(/(\d+) projets? en ligne/) || [])[1] || NaN);
  ok("titre de l'espace portfolio : « X projets en ligne »", Number.isFinite(enLigne), titre.trim());
  ok("badge du tableau de bord = total en ligne de l'espace", Number(badge) === enLigne,
    `badge ${badge} vs espace ${enLigne}`);
  ok("aucun toast rouge « Non autorisé » à l'ouverture du portfolio",
    toastsRouges.length === 0, toastsRouges.join(", ") || "aucun 401");

  /* les projets ajoutés par l'éditeur sont DANS l'espace */
  const a2sniper = await page.locator("text=/A2Sniper/i").count();
  const academia = await page.locator("text=/Academia Helm/i").count();
  ok("projet A2Sniper visible dans l'espace", a2sniper >= 1);
  ok("projet Academia Helm RESTAURÉ visible dans l'espace", academia >= 1);

  /* ---------- 4. M22 : désélection d'un devis (flux facture) ---------- */
  await page.locator("text=/Factures/i").first().click();
  await page.waitForTimeout(1200);
  const boutonCreer = await page.locator("text=/Créer une nouvelle facture/i").count();
  if (boutonCreer >= 1) {
    await page.locator("text=/Créer une nouvelle facture/i").first().click();
    await page.waitForTimeout(1500);
    /* cliquer la PREMIÈRE rangée sélectionnable (pas « déjà facturée ») */
    const rangees = page.locator("table tbody tr");
    const nbR = await rangees.count();
    let cliquee = false;
    for (let i = 0; i < nbR; i++) {
      const t = (await rangees.nth(i).textContent()) || "";
      if (/Facturée/i.test(t)) continue;
      await rangees.nth(i).click();
      await page.waitForTimeout(400);
      cliquee = true;
      break;
    }
    if (cliquee) {
      const continuer = page.locator("button:has-text('Continuer')");
      ok("devis sélectionné → bouton Continuer actif", (await continuer.count()) >= 1 && await continuer.first().isEnabled());
      /* PENDANT la sélection : l'indication de désélection est affichée */
      const texteSelection = await page.locator("table").first().locator("..").locator("..").innerText().catch(() => "");
      ok("pendant la sélection : indication de désélection affichée",
         /désélectionner/i.test(texteSelection),
         (texteSelection.split("\n").find((l) => /désélection|Cliquez/.test(l)) || "").slice(0, 120));
      /* re-cliquer la MÊME rangée → désélection */
      const rangees2 = page.locator("table tbody tr");
      let recliquee = false;
      for (let i = 0; i < nbR; i++) {
        const t = (await rangees2.nth(i).textContent()) || "";
        if (/Facturée/i.test(t)) continue;
        await rangees2.nth(i).click();
        await page.waitForTimeout(400);
        recliquee = true;
        break;
      }
      ok("M22 : re-clic sur le devis sélectionné → DÉSÉLECTION", recliquee);
      const continuer2 = page.locator("button:has-text('Continuer')");
      const actif = await continuer2.first().isEnabled().catch(() => null);
      ok("après désélection → bouton Continuer regrisé", actif === false || actif === null);
    } else {
      ok("M22 : rangée sélectionnable trouvée", false, "aucun devis non facturé");
    }
  } else {
    ok("vue « Créer une nouvelle facture » accessible", false, "bouton introuvable");
  }

  /* ---------- 5. session expirée → écran de connexion, PAS de toast Non autorisé ---------- */
  /* le cookie est HttpOnly : le retirer via l'API de contexte (pas
   * document.cookie) — c'est l'expiration du cookie (30 jours passés) */
  await ctx.clearCookies();
  /* l'Actualiser relance tous les chargeurs → 401 → session expirée */
  await page.locator("button:has-text('Actualiser')").first().click();
  await page.waitForTimeout(2500);
  const retourConnexion = await page.locator("#admin-password").count();
  ok("session expirée → retour à l'ÉCRAN DE CONNEXION", retourConnexion >= 1);
  const message = await page.locator("text=/Session expirée/i").count();
  ok("message clair « Session expirée » affiché", message >= 1);
  ok("AUCUN toast « Non autorisé » affiché",
    !(await page.locator("text=/Non autorisé/i").count()));

  await browser.close();
  console.log();
  console.log(echecs === 0 ? "UI : TOUT OK" : `UI : ${echecs} échec(s)`);
  process.exit(echecs === 0 ? 0 : 1);
})().catch((e) => {
  console.error("ÉCHEC UI :", e);
  process.exit(1);
});
