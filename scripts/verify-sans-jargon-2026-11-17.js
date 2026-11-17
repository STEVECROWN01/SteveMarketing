/**
 * Vérification du 17/11/2026 — CHASSE AU JARGON SUR TOUT LE COPYWRITING
 * (demande de l'éditeur : « corrige tout ce que tu as relevé »).
 *
 * Remplacements à confirmer, page par page :
 *  ACCUEIL  — hero « Attirez les bons clients » (ex « des clients
 *             qualifiés ») ; intro Comment Je Travaille « convaincre
 *             et transformer vos visiteurs en clients » (ex « convaincre
 *             et convertir ») ; étapes « Le Parcours de Vos Visiteurs »
 *             (ex « Planification du Parcours Utilisateur ») et
 *             « Attirer des visiteurs » (ex « Génération de trafic ») ;
 *             carte « Rédaction professionnelle incluse » (ex
 *             « Copywriting inclus ») ; bande défilante sans jargon ;
 *             FAQ « mon agenda en ligne (Calendly) ».
 *             NB : la section COMPLEMENTARY (ex « présence organique
 *             durable ») n'est plus rendue nulle part — son substitut
 *             visible est vérifié sur la page Référencement.
 *  MÉTHODE  — H1 « Des sites web qui transforment vos visiteurs en
 *             clients. » (ex « …pensés pour convertir. ») + étapes.
 *  RÉFÉRENCEMENT — intro + carte « sans dépendre de la publicité »
 *             (ex « présence organique durable »).
 *  PUBLICITÉ — carte SEO « Une visibilité qui ne dépend pas de la
 *             publicité » (ex « Une présence organique durable »).
 *  À PROPOS — titre Mon Approche reformulé ; étape Développement
 *             « impeccable sur tous les formats d'écran » (ex « responsive »).
 *  DEVIS    — bénéfices « Attirer les bons visiteurs » / « Transformer
 *             les visiteurs en clients » ; options « Trop peu de
 *             visiteurs deviennent clients » (ex « Faible taux de
 *             conversion ») et « Pas assez de visiteurs » (ex « Faible
 *             volume de trafic »).
 *
 * Contrôles à 1440 et 390 : nouveaux textes PRÉSENTS, anciens ABSANTS,
 * aucune erreur console, zéro débordement horizontal.
 *
 * LEÇONS (17/11) :
 *  1. RevealText joint les mots par espaces insécables (\u00A0).
 *  2. innerText applique le CSS (uppercase de la bande défilante) et
 *     EXCLUT les accordéons fermés → utiliser textContent (texte source).
 *  3. L'accordéon Radix DÉMONTE le contenu fermé (pas de forceMount) :
 *     il faut CLIQUER chaque déclencheur avant de chercher les réponses.
 *  4. textContent inclut aussi les <script> JSON-LD → les métadonnées
 *     font partie de la vérification (visibles dans les aperçus Google).
 */
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const WIDTHS = [1440, 390];

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const txt = (s) => (s || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  const ok = (cond, label) => {
    console.log(`${cond ? "OK  " : "ÉCHEC"} ${label}`);
    if (!cond) failures++;
  };

  async function checkPage(name, hash, widths, presents, absents, extra) {
    for (const w of widths) {
      console.log(`\n===== ${name} — ${w}px =====`);
      const page = await browser.newPage({ viewport: { width: w, height: 900 } });
      const errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(`${BASE}/${hash}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2400);
      // Ouvrir les accordéons UN PAR UN en accumulant le texte : le mode
      // « single collapsible » referme l'item précédent à chaque clic, et
      // Radix DÉMONTE le contenu fermé (pas de forceMount).
      const triggers = page.locator("[data-slot='accordion-trigger']");
      const n = await triggers.count();
      let acc = "";
      for (let i = 0; i < n; i++) {
        await triggers.nth(i).click();
        await page.waitForTimeout(150);
        acc += " " + (await page.evaluate(() => document.body.textContent));
      }
      // textContent (et non innerText) : casse source (uppercase CSS de la
      // bande défilante) + contenu monté.
      const body = txt(acc || (await page.evaluate(() => document.body.textContent)));
      for (const t of presents) ok(body.includes(txt(t)), `présent : « ${t.slice(0, 60)} »`);
      for (const t of absents) ok(!body.includes(txt(t)), `ABSENT : « ${t.slice(0, 60)} »`);
      if (extra) await extra(page, ok, body);
      ok(errors.length === 0, `aucune erreur console${errors.length ? " : " + errors.slice(0, 2).join(" | ") : ""}`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      ok(overflow <= 0, `aucun débordement horizontal (${overflow}px)`);
      await page.close();
    }
  }

  // ---------- ACCUEIL (1440 + 390) ----------
  await checkPage(
    "ACCUEIL", "#/accueil", WIDTHS,
    [
      "Attirez les bons clients",
      "convaincre et transformer vos visiteurs en clients",
      "Le Parcours de Vos Visiteurs",
      "Attirer des visiteurs",
      "Rédaction professionnelle incluse",
      "mon agenda en ligne (Calendly)",
      "Rédaction Professionnelle Incluse",
      "Attirer Les Bons Visiteurs",
      "Transformer Les Visiteurs En Clients",
    ],
    [
      "clients qualifiés",
      "convaincre et convertir",
      "Parcours Utilisateur",
      "Génération de trafic",
      "génère du trafic",
      "Copywriting inclus",
      "Copywriting Inclus",
      "présence organique",
      "Trafic Qualifié",
      "Optimisation De Conversion",
    ]
  );

  // ---------- MÉTHODE (1440 + 390) ----------
  await checkPage(
    "MÉTHODE", "#/methode", WIDTHS,
    [
      "Des sites web qui transforment vos visiteurs en clients.",
      "Le Parcours de Vos Visiteurs",
      "Attirer des visiteurs",
    ],
    ["pensés pour convertir", "Parcours Utilisateur", "Génération de trafic"]
  );

  // ---------- RÉFÉRENCEMENT (1440) ----------
  await checkPage(
    "RÉFÉRENCEMENT", "#/referencement-seo", [1440],
    ["attirez des visiteurs sur la durée, sans dépendre de la publicité"],
    ["présence organique"]
  );

  // ---------- PUBLICITÉ (1440) ----------
  await checkPage(
    "PUBLICITÉ", "#/publicite-meta-ads", [1440],
    ["Une visibilité qui ne dépend pas de la publicité"],
    ["présence organique"]
  );

  // ---------- À PROPOS (1440 + 390 : titre de section plus long) ----------
  // NB : la FAQ de cette page n'affiche que les 4 PREMIÈRES questions
  // (slice(0, 4)) — la réponse Calendly (item 6) y est légitiment absente ;
  // elle est vérifiée sur l'accueil, qui affiche les 8 questions.
  await checkPage(
    "À PROPOS", "#/a-propos", WIDTHS,
    [
      "convaincre et transformer vos visiteurs en clients",
      "impeccable sur tous les formats d'écran",
    ],
    ["convaincre et convertir", "responsive"]
  );

  // ---------- DEVIS (1440 + 390) ----------
  await checkPage(
    "DEVIS", "#/demander-un-devis", WIDTHS,
    [
      "Attirer les bons visiteurs",
      "Transformer les visiteurs en clients",
      "Trop peu de visiteurs deviennent clients",
      "Pas assez de visiteurs",
    ],
    [
      "taux de conversion",
      "volume de trafic",
      "visiteurs qualifiés",
      "Convertir les visiteurs",
    ]
  );

  await browser.close();
  console.log(`\n${failures === 0 ? "✔ TOUT EST OK" : `✘ ${failures} ÉCHEC(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
})();
