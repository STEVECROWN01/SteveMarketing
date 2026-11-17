/**
 * VÉRIFICATION DES CORRECTIONS CTA — 18/11/2026
 * Demande de l'éditeur : « Résous Les, tout en considérant Option B
 * pour le 1. et pour le 2., il faut la monter. » — correction de
 * tous les freins relevés par l'audit copywriting des CTA :
 *
 *  F1 (Option B)  : le « Réserver Un Appel » du hero de l'accueil
 *                   ouvre désormais la FENÊTRE CALENDLY (comme tous
 *                   les autres boutons du site) au lieu de mener à
 *                   la page Devis.
 *  F2 (montage)   : la variante « audit » du formulaire est montée
 *                   sur la nouvelle page #/audit-gratuit ; le bouton
 *                   « Demander Mon Audit Gratuit » y mène.
 *  F3             : libellés unifiés — « Réserver Un Appel »,
 *                   « Voir Mes Réalisations », « Demander Un Devis
 *                   Personnalisé » partout.
 *  F4             : libellés faibles corrigés — « Discuter De Mon
 *                   Projet », Afribayit « Voir Le Site », « Discuter
 *                   De Mon Projet International », « Envoyer Mon
 *                   Message ».
 *  F5             : bande CTA finale de l'accueil à DEUX boutons.
 *
 * LEÇONS réutilisées des scripts précédents : attendre « load » et
 * non « networkidle » (l'iframe Calendly garde des connexions
 * ouvertes) ; normaliser les espaces insécables (\u00A0) de
 * RevealText ; les contenus d'accordéon fermés ne sont pas montés.
 */

const { chromium } = require("playwright");

const BASE = "http://localhost:3100";

/** Normalise : espaces insécables → espace, espaces multiples → 1. */
const txt = (s) => (s || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

let failures = 0;
let checks = 0;
const ok = (cond, label) => {
  checks++;
  if (cond) {
    console.log(`  OK   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}`);
  }
};

(async () => {
  const browser = await chromium.launch();

  for (const vp of [
    { name: "1440", width: 1440, height: 900 },
    { name: "390", width: 390, height: 844 },
  ]) {
    console.log(`\n========== VIEWPORT ${vp.name} ==========`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleErrors = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => consoleErrors.push(String(e)));

    /* ---------- F1 : hero → Calendly ---------- */
    await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(5200);
    const bodyHome = txt(await page.evaluate(() => document.body.innerText));

    ok(bodyHome.includes("Réserver Un Appel"), "accueil : libellé « Réserver Un Appel » présent");
    ok(!bodyHome.includes("Réserver Mon Appel"), "accueil : ancien « Réserver Mon Appel » absent");
    ok(bodyHome.includes("Voir Mes Réalisations"), "accueil : « Voir Mes Réalisations » présent");
    ok(!bodyHome.includes("Voir Mes Travaux"), "accueil : ancien « Voir Mes Travaux » absent");
    ok(
      bodyHome.includes("Discuter De Mon Projet") && !bodyHome.includes("Trouver La Solution"),
      "accueil : « Discuter De Mon Projet » remplace « Trouver La Solution… »",
    );

    if (vp.name === "1440") {
      // Clic sur le CTA du hero → la fenêtre Calendly doit s'ouvrir
      const heroCta = page.locator("#hero a", { hasText: "Réserver Un Appel" }).first();
      await heroCta.click();
      await page.waitForTimeout(900);
      const modalText = txt(await page.evaluate(() => document.body.innerText));
      ok(
        modalText.includes("Réservez votre créneau"),
        "F1 : clic hero « Réserver Un Appel » → fenêtre Calendly ouverte (« Réservez votre créneau »)",
      );
      const calendlyHref = await heroCta.getAttribute("href");
      ok(
        calendlyHref && calendlyHref.includes("calendly.com"),
        "F1 : le href du CTA hero pointe vers Calendly",
      );
      // Fermer la fenêtre
      await page.click('button[aria-label="Fermer la fenêtre de réservation"]');
      await page.waitForTimeout(400);
    }

    /* ---------- F2 : la page audit existe et le CTA y mène ---------- */
    await page.goto(`${BASE}/#/audit-gratuit`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(2600);
    const auditText = txt(await page.evaluate(() => document.body.innerText));
    const auditTitle = await page.title();

    ok(auditText.includes("DEMANDE D'AUDIT GRATUIT"), "audit : eyebrow présent");
    ok(
      auditText.includes("Découvrez Pourquoi Votre Site Ne Vous Apporte Pas Assez De Clients."),
      "audit : H1 exact",
    );
    ok(
      auditText.includes("URL de votre site actuel"),
      "audit : champ « URL de votre site actuel » présent (la promesse est tenue)",
    );
    ok(auditText.includes("Envoyer Ma Demande D'Audit"), "audit : bouton d'envoi présent");
    ok(
      auditText.includes("Réservez un appel de 30 minutes"),
      "audit : lien croisé vers la réservation d'appel",
    );
    ok(
      auditTitle.includes("Audit Gratuit"),
      `audit : titre d'onglet SEO (« ${auditTitle} »)`,
    );

    if (vp.name === "1440") {
      // Le bouton « Demander Mon Audit Gratuit » de l'accueil y mène
      await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(4200);
      // Faire défiler jusqu'à la section (lazy reveal) puis cliquer
      await page.evaluate(() => {
        const el = document.getElementById("remise-en-question");
        if (el) el.scrollIntoView();
      });
      await page.waitForTimeout(1400);
      const auditBtn = page.locator("a", { hasText: "Demander Mon Audit Gratuit" }).first();
      await auditBtn.click();
      await page.waitForTimeout(1400);
      const hash = await page.evaluate(() => window.location.hash);
      ok(hash === "#/audit-gratuit", `F2 : clic « Demander Mon Audit Gratuit » → ${hash}`);
    }

    /* ---------- F5 : bande finale à 2 CTA ---------- */
    await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(4200);
    await page.evaluate(() => {
      const el = document.getElementById("contact-final-titre");
      if (el) el.scrollIntoView({ block: "center" });
    });
    await page.waitForTimeout(1400);
    const finalBand = await page.evaluate(() => {
      const t = document.getElementById("contact-final-titre");
      if (!t) return [];
      // Les CTA suivent le titre dans la même section
      const section = t.closest("section");
      return section
        ? Array.from(section.querySelectorAll("a.btn-fill")).map((a) =>
            (a.innerText || "").replace(/\s+/g, " ").trim(),
          )
        : [];
    });
    ok(
      finalBand.length === 2 &&
        finalBand.includes("Réserver Un Appel") &&
        finalBand.includes("Demander Un Devis Personnalisé"),
      `F5 : bande finale = 2 CTA exactement (${JSON.stringify(finalBand)})`,
    );

    /* ---------- F3/F4 : autres pages ---------- */
    // Réalisations
    await page.goto(`${BASE}/#/realisations`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(2600);
    const worksText = txt(await page.evaluate(() => document.body.innerText));
    ok(worksText.includes("Demander Un Devis Personnalisé"), "réalisations : CTA final unifié");
    ok(!worksText.includes("Demander Un Devis\n"), "réalisations : plus de « Demander Un Devis » court isolé");

    // Page projet Afribayit
    await page.goto(`${BASE}/#/projet/afribayit`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(2400);
    const afribayitText = txt(await page.evaluate(() => document.body.innerText));
    ok(
      afribayitText.includes("Voir Le Site") && !afribayitText.includes("Découvrir Le Projet"),
      "F4 : Afribayit « Voir Le Site » (ancien « Découvrir Le Projet » absent)",
    );

    // Page Référencement
    await page.goto(`${BASE}/#/referencement-seo`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(2400);
    const seoText = txt(await page.evaluate(() => document.body.innerText));
    ok(
      seoText.includes("Discuter De Mon Projet International") &&
        !seoText.includes("Discuter De Mon Marché International"),
      "F4 : SEO « Discuter De Mon Projet International »",
    );

    // Page Contact (le libellé du bouton d'envoi est dans le formulaire, monté d'office)
    await page.goto(`${BASE}/#/contact`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(2600);
    const contactText = txt(await page.evaluate(() => document.body.innerText));
    ok(
      contactText.includes("Envoyer Mon Message") && !contactText.includes("Entrer En Contact"),
      "F4 : contact « Envoyer Mon Message »",
    );
    ok(contactText.includes("Demander Un Devis Personnalisé"), "contact : CTA hero unifié");

    // Débordement horizontal sur les pages modifiées
    for (const hash of ["#/accueil", "#/audit-gratuit", "#/contact"]) {
      await page.goto(`${BASE}/${hash}`, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(2000);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      ok(overflow <= 0, `${hash} : aucun débordement horizontal (delta=${overflow}px)`);
    }

    ok(consoleErrors.length === 0, `aucune erreur console (${consoleErrors.length})`);
    if (consoleErrors.length) consoleErrors.slice(0, 3).forEach((e) => console.log("    ↳", e.slice(0, 140)));
    await page.close();
  }

  await browser.close();
  console.log(`\n========== BILAN : ${checks - failures}/${checks} contrôles OK ==========`);
  if (failures > 0) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
