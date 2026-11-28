/* SONDE E2E VOLET 29 (28/11/2026 soir) — les demandes de l'éditeur,
 * vérifiées sur le back-office local (BASE par défaut
 * http://127.0.0.1:3100) :
 *  1. curseur POINTEUR sur les boutons et le logo ;
 *  2. drop-downs catégorie/niche triés par étoiles ;
 *  3. recommandations ajustées (couvreur : > 300 000 € de CA,
 *     panier 2 000 € – 5 000 €) ;
 *  4. plus de champ « précisez la niche » : modale au lancement sans
 *     niche ;
 *  5. lieu = PAYS + VILLE (la ville ne s'active qu'après le pays) ;
 *  6. scraping réel → vue RÉSULTATS dédiée, bouton « Voir les
 *     détails » (accordéon exclusif), « Non trouvé » sur les données
 *     manquantes, aucun lien « fiche publique » sur les cartes ;
 *  7. sélection + bouton d'import vers l'espace Prospects ;
 *  8. plus aucune mention interdite à l'écran ;
 *  9. espace Audit : UN SEUL outil.
 */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://127.0.0.1:3100";
const MOT_DE_PASSE = process.env.MOT_DE_PASSE || "TestVolet29!2026";
const RAPPORT = {};
let echecs = 0;

function noter(cle, ok, detail = "") {
  RAPPORT[cle] = ok ? "OK" : `ÉCHEC ${detail}`.trim();
  if (!ok) echecs += 1;
  console.log(`  ${ok ? "OK " : "ÉCHEC"}  ${cle}${detail && !ok ? ` — ${detail}` : ""}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });

  /* ---------- Connexion ---------- */
  await page.goto(`${BASE}/#/admin`, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("#admin-password", { state: "visible", timeout: 30000 });
  await page.fill("#admin-password", MOT_DE_PASSE);
  await page.click('button:has-text("Ouvrir L\'Espace")');
  await page.waitForSelector('nav[aria-label="Sections du back-office"]', { timeout: 30000 });
  await page.waitForTimeout(800);
  console.log("— connecté");

  /* ---------- 1. Curseur pointeur sur les boutons + logo ---------- */
  const boutonNav = page.locator('nav[aria-label="Sections du back-office"] button').first();
  const curseurNav = await boutonNav.evaluate((el) => getComputedStyle(el).cursor);
  const logo = page.locator('button[aria-label="Tableau de bord"]');
  const curseurLogo = await logo.evaluate((el) => getComputedStyle(el).cursor);
  noter("1a. curseur pointeur sur les boutons de la nav", curseurNav === "pointer", curseurNav);
  noter("1b. curseur pointeur sur le logo (tableau de bord)", curseurLogo === "pointer", curseurLogo);

  /* ---------- 8. Aucune mention interdite à l'écran ---------- */
  const corps = await page.locator("body").innerText();
  const mentionsInterdites = ["cloné", "GTmetrix", "RankFlow", "aucune clé", "sans abonnement"]
    .filter((m) => corps.toLowerCase().includes(m.toLowerCase()));
  noter("8a. aucune mention interdite sur le tableau de bord", mentionsInterdites.length === 0, mentionsInterdites.join(", "));

  /* ---------- Espace Scraping ---------- */
  await page.click('nav button:has-text("Scraping")');
  await page.waitForSelector('h2:has-text("Scraping")', { timeout: 15000 });
  await page.waitForTimeout(600);

  /* 2. Ordre des catégories par étoiles (BTP 4★ d'abord… Loisirs 2★ en dernier) */
  const optionsCategories = await page.locator('select >> nth=0').locator("option").allTextContents();
  const lignesEtoiles = optionsCategories
    .filter((t) => t.includes("★"))
    .map((t) => (t.match(/★/g) || []).length);
  const triees = lignesEtoiles.every((v, i) => i === 0 || lignesEtoiles[i - 1] >= v);
  noter("2a. catégories triées par étoiles décroissantes", triees, JSON.stringify(lignesEtoiles));
  noter("2b. la 1re catégorie est BTP (4★)", (optionsCategories.find((t) => t.includes("★")) || "").includes("BTP"), optionsCategories.find((t) => t.includes("★")));

  /* Le champ niche est GRISEÉ avant la catégorie */
  const selectNiche = page.locator('select >> nth=1');
  const nicheDesactivee = await selectNiche.isDisabled();
  noter("2c. le drop-down de niche attend la catégorie (grisé)", nicheDesactivee);

  /* 2d. Niches de la catégorie triées par étoiles */
  await page.locator('select >> nth=0').selectOption({ label: optionsCategories.find((t) => t.includes("BTP")) });
  await page.waitForTimeout(400);
  const optionsNiches = await selectNiche.locator("option").allTextContents();
  const etoilesNiches = optionsNiches.filter((t) => t.includes("★")).map((t) => (t.match(/★/g) || []).length);
  const nichesTriees = etoilesNiches.every((v, i) => i === 0 || etoilesNiches[i - 1] >= v);
  noter("2d. niches de BTP triées par étoiles décroissantes", nichesTriees, JSON.stringify(etoilesNiches));

  /* 3. Recommandations ajustées : couvreur #11 */
  const optionCouvreur = optionsNiches.find((t) => t.includes("Couvreurs"));
  await selectNiche.selectOption({ label: optionCouvreur });
  await page.waitForTimeout(400);
  const reco = (await page.locator("text=Cible idéale :").first().locator("..").innerText()).replace(/[\u00a0\u202f]/g, " ");
  noter("3a. cible idéale couvreur AJUSTÉE (300 000 €)", reco.includes("300 000 €"), reco.replace(/\s+/g, " ").slice(0, 130));
  noter("3b. panier vitrine couvreur AJUSTÉ (2 000 € – 5 000 €)", reco.includes("2 000 € – 5 000 €"), reco.replace(/\s+/g, " ").slice(0, 160));
  await page.screenshot({ path: "/tmp/render/volet29/01-scraping-formulaire.png" });

  /* 4. Lancement SANS niche → MODALE (et plus de champ « précisez la niche ») */
  await page.locator('select >> nth=1').selectOption({ index: 0 }); // (vider la niche)
  await page.waitForTimeout(300);
  const champPrecisez = await page.locator('label:has-text("Précisez la niche")').count();
  noter("4a. plus de champ « précisez la niche » dans le formulaire", champPrecisez === 0);
  /* pays + ville d'abord pour la suite */
  const selectPays = page.locator('select[aria-label], select').filter({ hasText: "Choisir un pays" }).first();
  const optionsPays = await selectPays.locator("option").allTextContents();
  const france = optionsPays.find((t) => t.trim() === "France");
  noter("5a. le drop-down de pays présente le monde entier", optionsPays.length > 200, `${optionsPays.length} pays`);
  await selectPays.selectOption({ label: france });
  await page.waitForTimeout(900);
  /* 5. la ville s'active après le pays */
  const boutonVille = page.locator('button[aria-label="Ville du pays choisi"]');
  const villeActive = (await boutonVille.count()) === 1;
  noter("5b. le drop-down de ville s'active après le pays", villeActive);
  if (villeActive) {
    await boutonVille.click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="Rechercher une ville…"]', "Paris");
    await page.waitForSelector('button[role="option"]', { timeout: 10000 });
    await page.locator('button[role="option"]:has-text("Paris")').first().click({ timeout: 10000 });
    await page.waitForTimeout(300);
    const lieuRetenu = (await boutonVille.innerText()).replace(/[\u00a0\u202f]/g, " ");
    noter("5c. la ville de Paris est choisissable dans le pays", lieuRetenu.includes("Paris"), lieuRetenu);
  }

  /* La modale de niche au lancement sans niche */
  await page.click('button:has-text("Scraper")');
  await page.waitForTimeout(500);
  const modaleNiche = page.locator('[role="dialog"]');
  noter("4b. la MODALE de niche s'ouvre au lancement sans niche", (await modaleNiche.count()) === 1 && (await modaleNiche.innerText()).includes("Préciser la niche"));
  if ((await modaleNiche.count()) === 1) {
    await page.screenshot({ path: "/tmp/render/volet29/02-modale-niche.png" });
    /* choisir la niche DANS la modale : couvreur */
    await modaleNiche.locator("select").selectOption({ label: optionCouvreur });
    await page.click('button:has-text("Lancer le scraping")');
    await page.waitForTimeout(500);
    noter("4c. la modale se referme après le choix", (await page.locator('[role="dialog"]').count()) === 0);
  }

  /* ---------- 6. Scraping réel (couvreurs à Paris) → vue résultats ---------- */
  console.log("— scraping réel en cours (couvreurs, Paris)…");
  await page.waitForSelector('button:has-text("Nouvelle recherche")', { timeout: 90000 });
  await page.waitForTimeout(1200);
  const vueResultats = (await page.locator("h2").first().innerText()) || "";
  noter("6a. le scraping ouvre la VUE RÉSULTATS dédiée", vueResultats.includes("Résultats du scraping"), vueResultats);
  const nbCartes = await page.locator('button:has-text("Voir les détails")').count();
  noter("6b. des prospects sont affichés avec « Voir les détails »", nbCartes > 0, `${nbCartes} cartes`);
  const textPage = await page.locator("body").innerText();
  noter("6c. plus de lien « fiche publique » sur les cartes", !textPage.includes("fiche publique"));
  await page.screenshot({ path: "/tmp/render/volet29/03-resultats.png" });

  /* 6d. accordéon exclusif « Voir les détails » */
  if (nbCartes > 0) {
    await page.locator('button:has-text("Voir les détails")').first().click();
    await page.waitForTimeout(500);
    const details1 = await page.locator("text=Dirigeant / propriétaire").count();
    await page.screenshot({ path: "/tmp/render/volet29/04-details-prospect.png" });
    const nonTrouve = await page.locator("text=Non trouvé").count();
    noter("6d. le bloc de détails déplie TOUTES les données", details1 >= 1, `${details1} bloc(s)`);
    noter("6e. les données introuvables sont marquées « Non trouvé »", nonTrouve >= 1, `${nonTrouve} mentions`);
    if (nbCartes > 1) {
      await page.locator('button:has-text("Voir les détails")').nth(1).click();
      await page.waitForTimeout(500);
      const detailsOuverts = await page.locator("text=Dirigeant / propriétaire").count();
      noter("6f. un seul détail ouvert à la fois (l'autre se referme)", detailsOuverts === 1, `${detailsOuverts} ouverts`);
    }
    /* 7. sélection + import */
    const cases = page.locator('button[aria-label^="Sélectionner"]');
    if ((await cases.count()) > 0) {
      await cases.first().click();
      await page.waitForTimeout(300);
      const boutonImport = page.locator('button:has-text("Importer")');
      noter("7a. la sélection active le bouton d'import", (await boutonImport.count()) === 1 && (await boutonImport.first().innerText()).includes("1 prospect"));
      await page.screenshot({ path: "/tmp/render/volet29/05-selection-import.png" });
    }
  }

  /* ---------- Espace Prospects (sans stockage configuré : état d'erreur propre) ---------- */
  await page.click('nav button:has-text("Prospects")');
  await page.waitForTimeout(1200);
  const titreProspects = await page.locator("h2").first().innerText();
  noter("9a. l'espace Prospects existe dans la navigation", titreProspects.includes("Prospects"), titreProspects);
  await page.screenshot({ path: "/tmp/render/volet29/06-prospects.png" });

  /* ---------- Espace Audit : UN SEUL outil ---------- */
  await page.click('nav button:has-text("Audit")');
  await page.waitForTimeout(1000);
  const onglets = await page.locator('[role="tab"]').count();
  const boutonUnique = (await page.locator('button:has-text("Analyser")').count()) >= 1;
  noter("10a. plus d'onglets d'outils dans l'espace Audit", onglets === 0, `${onglets} onglet(s)`);
  noter("10b. le bouton unique « Analyser » (audit complet)", boutonUnique);
  const textAudit = await page.locator("body").innerText();
  const mentionsAudit = ["cloné", "GTmetrix", "RankFlow", "aucune clé"].filter((m) => textAudit.toLowerCase().includes(m.toLowerCase()));
  noter("10c. aucune mention interdite dans l'espace Audit", mentionsAudit.length === 0, mentionsAudit.join(", "));
  await page.screenshot({ path: "/tmp/render/volet29/07-audit-outil-unique.png" });

  /* 10d. audit réel sur une page légère */
  console.log("— audit complet réel (example.com)…");
  await page.fill('input[type="url"]', "https://example.com");
  await page.click('button:has-text("Analyser")');
  await page.waitForSelector('text=Rapport performance', { timeout: 120000 });
  await page.waitForTimeout(800);
  const blocs = {
    performance: await page.locator("text=Rapport performance").count(),
    seo: await page.locator("text=Rapport SEO").count(),
    design: await page.locator("text=Rapport structure / design / copywriting / conversion").count(),
  };
  noter("10d. le rapport complet présente les trois blocs", blocs.performance >= 1 && blocs.seo >= 1 && blocs.design >= 1, JSON.stringify(blocs));
  await page.screenshot({ path: "/tmp/render/volet29/08-audit-rapport.png", fullPage: false });

  /* 10e. les axes d'amélioration en modale */
  await page.click('button:has-text("Voir les axes d\'amélioration")');
  await page.waitForTimeout(500);
  const modaleAxes = page.locator('[role="dialog"]');
  const axesOuverts = (await modaleAxes.count()) === 1 && (await modaleAxes.innerText()).includes("Axes d'amélioration");
  const boutonPfdAxes = await modaleAxes.locator("button:has-text(\"Télécharger les axes d'amélioration\")").count();
  noter("10e. modale des axes d'amélioration + son PDF", axesOuverts && boutonPfdAxes === 1);
  await page.screenshot({ path: "/tmp/render/volet29/09-audit-axes.png" });
  await modaleAxes.locator('button[aria-label="Fermer"]').click();
  await page.waitForTimeout(300);

  /* Le PDF de l'audit complet (téléchargement réel) */
  const [telechargement] = await Promise.all([
    page.waitForEvent("download", { timeout: 90000 }),
    page.click('button:has-text("Audit complet en PDF")'),
  ]);
  const cheminPdf = "/tmp/render/volet29/audit-complet-example.pdf";
  await telechargement.saveAs(cheminPdf);
  const fs = require("fs");
  const taillePdf = fs.statSync(cheminPdf).size;
  const entetePdf = fs.readFileSync(cheminPdf).subarray(0, 5).toString();
  noter("10f. le PDF « AUDIT COMPLET » se télécharge", taillePdf > 5000 && entetePdf === "%PDF-", `${taillePdf} octets`);

  await browser.close();
  console.log("\n===== RAPPORT =====");
  for (const [cle, valeur] of Object.entries(RAPPORT)) console.log(`${valeur === "OK" ? "OK " : "!! "} ${cle} : ${valeur}`);
  console.log(echecs === 0 ? `\nSONDE VOLET 29 : ${Object.keys(RAPPORT).length}/${Object.keys(RAPPORT).length} contrôles OK` : `\nSONDE VOLET 29 : ${echecs} ÉCHEC(S)`);
  process.exit(echecs === 0 ? 0 : 1);
})().catch((e) => {
  console.error("SONDE INTERROMPUE :", e.message);
  process.exit(2);
});
