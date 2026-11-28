/* SONDE VOLET 32 (29/11/2026) — LE DIAGNOSTIC DE QUALITÉ DES SITES
 * DANS L'OUTIL « GOOGLE MAPS », vérifié sur le back-office local
 * (BASE par défaut http://127.0.0.1:3100).
 *
 * MÉTHODE : la réponse de l'API de scraping est INTERCEPTÉE et
 * remplacée par un JEU DE DONNÉES FIXE (8 entreprises : scores
 * connus, verdicts, plateformes, sans site, site muet, emails) —
 * la sonde est DÉTERMINISTE : elle vérifie l'INTERFACE, pas les
 * données vivantes d'OpenStreetMap (le comportement réel a été
 * validé séparément sur des recherches réelles : hôtels à Paris —
 * scores, plateformes détectées, emails trouvés).
 *
 *  1. la vue résultats porte les FILTRES (Tous, Sans site web,
 *     À refaire, Avec email) et le TRI (ordre / pire d'abord / nom) ;
 *  2. chaque prospect avec un site diagnostiqué porte un BADGE
 *     (score /100 + verdict) ;
 *  3. « Voir les détails » déplie le DIAGNOSTIC complet (qualité,
 *     plateforme, année, problème à résoudre) ;
 *  4. le filtre « Sans site web » n'affiche QUE les entreprises sans
 *     site ;
 *  5. le tri « la pire d'abord » ordonne les scores croissants ;
 *  6. le compteur « site(s) à refaire » est affiché.
 */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://127.0.0.1:3100";
const MOT_DE_PASSE = process.env.MOT_DE_PASSE || "TestVolet32!2026";
const RAPPORT = {};
let echecs = 0;

function noter(cle, ok, detail = "") {
  RAPPORT[cle] = ok ? "OK" : `ÉCHEC ${detail}`.trim();
  if (!ok) echecs += 1;
  console.log(`  ${ok ? "OK " : "ÉCHEC"}  ${cle}${detail && !ok ? ` — ${detail}` : ""}`);
}

/* Jeu de données FIXE : 8 entreprises aux profils connus. */
const FIXTURE = {
  ok: true,
  totalTrouvees: 8,
  sansSiteWeb: 2,
  sitesARefaire: 1,
  entreprises: [
    {
      source: "google-maps",
      nom: "Hôtel du Vieux Port",
      niche: "Hôtels",
      localisation: "Paris",
      pays: "France",
      email: "contact@vieuxport-hotel.example",
      telephone: "+33 1 23 45 67 89",
      siteWeb: "https://vieuxport-hotel.example",
      siteWebPresent: true,
      qualiteSite: {
        plateforme: "WordPress",
        anneeMiseAJour: 2014,
        https: false,
        mobile: false,
        titre: true,
        metaDescription: false,
        h1: false,
        poidsKo: 120,
        score: 30,
        verdict: "a-refaire",
        problemes: [
          "Le site n'est pas sécurisé (pas de HTTPS) — les navigateurs affichent « non sécurisé »",
          "Pas de version mobile : le site est difficile à lire sur téléphone",
        ],
      },
    },
    {
      source: "google-maps",
      nom: "Clinique Saint-Louis",
      niche: "Cliniques",
      localisation: "Paris",
      pays: "France",
      email: "accueil@clinique-saintlouis.example",
      telephone: "+33 1 98 76 54 32",
      siteWeb: "https://clinique-saintlouis.example",
      siteWebPresent: true,
      qualiteSite: {
        https: true,
        mobile: true,
        titre: true,
        metaDescription: false,
        h1: true,
        poidsKo: 300,
        score: 62,
        verdict: "moyen",
        problemes: ["Description Google manquante (le texte sous le site dans les résultats)"],
      },
    },
    {
      source: "google-maps",
      nom: "Restaurant Le Bistrot",
      niche: "Restaurants",
      localisation: "Paris",
      pays: "France",
      siteWeb: "https://lebistrot.example",
      telephone: "+33 1 11 22 33 44",
      siteWebPresent: true,
      qualiteSite: {
        plateforme: "Squarespace",
        anneeMiseAJour: 2026,
        https: true,
        mobile: true,
        titre: true,
        metaDescription: true,
        h1: true,
        poidsKo: 90,
        score: 95,
        verdict: "correct",
        problemes: [],
      },
    },
    {
      source: "google-maps",
      nom: "Salon de coiffure Élégance",
      niche: "Salons de coiffure",
      localisation: "Paris",
      pays: "France",
      telephone: "+33 1 55 66 77 88",
      siteWebPresent: false,
    },
    {
      source: "google-maps",
      nom: "Garage Mécanique Plus",
      niche: "Garages",
      localisation: "Paris",
      pays: "France",
      telephone: "+33 1 99 88 77 66",
      siteWebPresent: false,
    },
    {
      source: "google-maps",
      nom: "Cabinet Ostéo Kiné",
      niche: "Ostéopathes",
      localisation: "Paris",
      pays: "France",
      siteWeb: "https://osteo-kine.example",
      siteWebPresent: true,
      /* site muet : pas de diagnostic */
    },
    {
      source: "google-maps",
      nom: "Boulangerie Maison",
      niche: "Boulangeries",
      localisation: "Paris",
      pays: "France",
      email: "contact@boulangerie-maison.example",
      siteWeb: "https://boulangerie-maison.example",
      siteWebPresent: true,
      qualiteSite: {
        https: true,
        mobile: true,
        titre: true,
        metaDescription: true,
        h1: true,
        poidsKo: 110,
        score: 90,
        verdict: "correct",
        problemes: [],
      },
    },
    {
      source: "google-maps",
      nom: "Toilettage Canin Paris",
      niche: "Toilettage",
      localisation: "Paris",
      pays: "France",
      siteWeb: "https://toilettage-canin.example",
      siteWebPresent: true,
      qualiteSite: {
        plateforme: "Wix",
        anneeMiseAJour: 2019,
        https: true,
        mobile: false,
        titre: true,
        metaDescription: true,
        h1: true,
        poidsKo: 200,
        score: 48,
        verdict: "a-refaire",
        problemes: ["Pas de version mobile : le site est difficile à lire sur téléphone"],
      },
    },
  ],
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });

  /* L'API de scraping répond le JEU FIXE : interface déterministe. */
  await page.route("**/api/admin/scraping/google-maps", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FIXTURE) }),
  );

  await page.goto(`${BASE}/#/admin`, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("#admin-password", { state: "visible", timeout: 30000 });
  await page.fill("#admin-password", MOT_DE_PASSE);
  await page.click('button:has-text("Ouvrir L\'Espace")');
  await page.waitForSelector('nav[aria-label="Sections du back-office"]', { timeout: 30000 });
  await page.waitForTimeout(800);

  /* ---------- Espace Scraping : recherche (réponse interceptée) ---------- */
  await page.click('nav button:has-text("Scraping")');
  await page.waitForSelector('h2:has-text("Scraping")', { timeout: 15000 });
  await page.waitForTimeout(600);
  const optionsCategories = await page.locator("select >> nth=0").locator("option").allTextContents();
  await page.locator("select >> nth=0").selectOption({ label: optionsCategories.find((t) => t.includes("Hôtellerie")) });
  await page.waitForTimeout(400);
  /* La niche dans le formulaire principal (pas de modale au lancement). */
  const selectNiche = page.locator("select >> nth=1");
  const optionsNiches = await selectNiche.locator("option").allTextContents();
  const nicheHotels = optionsNiches.find((t) => t.includes("Hôtels"));
  if (nicheHotels) {
    await selectNiche.selectOption({ label: nicheHotels });
    await page.waitForTimeout(300);
  }
  /* Le lieu : France puis Paris. */
  for (const s of await page.locator("select").all()) {
    const opts = await s.locator("option").allTextContents();
    if (opts.some((t) => t.trim() === "France")) {
      await s.selectOption({ label: "France" });
      break;
    }
  }
  await page.waitForTimeout(800);
  const champVille = page.locator('input[placeholder="Rechercher une ville…"]');
  if (await champVille.count()) {
    await champVille.fill("Paris");
    await page.waitForTimeout(900);
    const selectVille = page.locator("select").nth(-1);
    const optsVille = await selectVille.locator("option").allTextContents();
    const paris = optsVille.find((t) => t.trim() === "Paris");
    if (paris) await selectVille.selectOption({ label: paris });
  }
  await page.locator('button:has-text("Scraper")').first().click();
  await page.waitForSelector('h2:has-text("Résultats du scraping")', { timeout: 30000 });
  await page.waitForTimeout(800);

  /* ---------- 1. Les FILTRES et le TRI existent ---------- */
  const chips = await page.locator("button[aria-pressed]").allTextContents();
  const extras = chips.filter((t) => !t.startsWith("Tous (") && !t.includes("sans site"));
  noter(
    "1a. filtres de résultats présents (Tous, Sans site web, À refaire, Avec email)",
    chips.some((t) => t.startsWith("Tous (8)")) && chips.some((t) => t.includes("Sans site web (2)")) && chips.some((t) => t.includes("À refaire")) && chips.some((t) => t.includes("Avec email (")),
    JSON.stringify(extras.slice(0, 4)),
  );
  const optionsTri = await page.locator('select:has(option[value="score-croissant"]) option').allTextContents();
  noter(
    "1b. tri des résultats (ordre / qualité du site / nom)",
    optionsTri.some((t) => t.includes("pire d'abord")) && optionsTri.some((t) => t.includes("Nom (A → Z)")),
    JSON.stringify(optionsTri),
  );
  const stats = await page.locator("body").innerText();
  const m = stats.match(/(\d+)\s+sites?\s+à refaire/);
  noter("1c. compteur « sites à refaire » affiché", Boolean(m) && m[1] === "1", m?.[0]);
  noter("1d. compteur « sans site web » affiché", /2 sans site web/.test(stats));

  /* ---------- 2. Le BADGE de qualité (score /100) ---------- */
  const badges = await page.evaluate(() =>
    [...document.querySelectorAll("span")].map((s) => (s.textContent || "").trim()).filter((t) => /\d{1,3}\/100/.test(t)),
  );
  noter("2a. les 5 entreprises diagnostiquées portent un badge /100", badges.length === 5, `badges : ${badges.length} → ${badges.join(" | ")}`);
  noter(
    "2b. les verdicts s'affichent (à refaire, moyen, correct)",
    badges.some((t) => t.includes("à refaire")) && badges.some((t) => t.includes("moyen")) && badges.some((t) => t.includes("correct")),
    badges.join(" | "),
  );
  await page.screenshot({ path: "/tmp/render/volet32/01-resultats.png" });

  /* ---------- 3. « Voir les détails » : le DIAGNOSTIC ---------- */
  await page.evaluate(() => {
    const boutons = [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").includes("Voir les détails"));
    const cible = boutons.find((b) => /\d{1,3}\/100/.test(b.closest('[class*="overflow-hidden"]')?.textContent || ""));
    (cible ?? boutons[0])?.click();
  });
  await page.waitForTimeout(700);
  /* Les libellés des données sont rendus en MAJUSCULES (CSS) :
     la vérification est insensible à la casse. */
  const detailsTxt = (await page.locator("body").innerText()).toLowerCase();
  const detailOuvert = (await page.locator('button[aria-expanded="true"]').count()) > 0;
  noter("3a. le diagnostic (qualité / plateforme / année) est dans les détails", detailOuvert && detailsTxt.includes("qualité du site web") && detailsTxt.includes("plateforme du site") && detailsTxt.includes("dernière mise à jour du site"));
  noter(
    "3b. le bloc « problèmes à résoudre » apparaît",
    detailsTxt.includes("diagnostic du site web — ce que vous pouvez résoudre"),
  );
  await page.screenshot({ path: "/tmp/render/volet32/02-details.png" });

  /* ---------- 4. Le FILTRE « Sans site web » ---------- */
  await page.locator('button[aria-pressed]:has-text("Sans site web")').click();
  await page.waitForTimeout(600);
  const sansSiteVisibles = await page.locator('span:text-is("Sans site web")').count();
  const avecSiteVisibles = await page.locator('span:text-is("Site web")').count();
  const affichees = await page.locator("body").innerText();
  noter("4a. le filtre n'affiche QUE les 2 entreprises sans site", sansSiteVisibles === 2 && avecSiteVisibles === 0, `sans : ${sansSiteVisibles}, avec : ${avecSiteVisibles}`);
  noter("4b. le compteur d'affichées suit le filtre (2)", /2 affichée/.test(affichees), (affichees.match(/. {0,3}\d+ affichée/) || [""])[0]);

  /* ---------- 5. Le FILTRE « À refaire » + le TRI « pire d'abord » ---------- */
  await page.locator('button[aria-pressed]:has-text("À refaire")').click();
  await page.waitForTimeout(600);
  const scoresARefaire = await page.evaluate(() =>
    [...document.querySelectorAll("span")].map((s) => (s.textContent || "").trim()).filter((t) => /\d{1,3}\/100/.test(t)),
  );
  noter(
    "5a. le filtre « À refaire » regroupe sites à refaire + sans site",
    scoresARefaire.length === 2 && (await page.locator('span:text-is("Sans site web")').count()) === 2,
    `scores : ${scoresARefaire.length}, sans site : ${await page.locator('span:text-is("Sans site web")').count()}`,
  );
  await page.locator('button[aria-pressed]:has-text("Tous (")').first().click();
  await page.waitForTimeout(400);
  await page.locator('select:has(option[value="score-croissant"])').selectOption({ label: "Qualité du site — la pire d'abord" });
  await page.waitForTimeout(700);
  const scores = (await page.evaluate(() =>
    [...document.querySelectorAll("span")].map((s) => (s.textContent || "").trim()).filter((t) => /\d{1,3}\/100/.test(t)),
  ))
    .map((t) => Number((t.match(/(\d+)\/100/) || [])[1]))
    .filter((n) => !Number.isNaN(n));
  const trie = scores.every((v, i) => i === 0 || scores[i - 1] <= v);
  noter("5b. le tri « la pire d'abord » ordonne les scores croissants", scores.length === 5 && trie, JSON.stringify(scores));

  /* ---------- 6. Le CSV (bouton présent) + retour ---------- */
  const boutonCsv = await page.locator('button:has-text("CSV")').count();
  noter("6a. l'export CSV reste disponible", boutonCsv === 1);

  await browser.close();
  console.log("");
  console.log(`SONDE VOLET 32 : ${Object.keys(RAPPORT).length - echecs}/${Object.keys(RAPPORT).length} contrôles OK`);
  process.exit(echecs > 0 ? 1 : 0);
})().catch((e) => {
  console.error("SONDE INTERROMPUE :", String(e).slice(0, 200));
  process.exit(1);
});
