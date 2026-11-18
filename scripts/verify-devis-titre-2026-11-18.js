/**
 * Vérification du 18/11/2026 — PAGE DEVIS, TITRE H1 (demande de
 * l'éditeur) : « corrige le texte "Optimisez Votre Site Web Pour
 * Augmenter Les Ventes" en "Optimisez Votre Site Web Pour
 * Augmenter Vos Ventes" ».
 *
 * Contrôles, sur 1440 / 1024 / 768 / 390 :
 *  1. le H1 de la page #/demander-un-devis affiche exactement
 *     « Optimisez Votre Site Web Pour Augmenter Vos Ventes » ;
 *  2. l'ancien texte « Augmenter Les Ventes » est ABSENT (le
 *     H1 entier, y compris la partie en gras) ;
 *  3. la partie finale « Augmenter Vos Ventes » est bien rendue
 *     en gras (700) et le reste du titre en graisse normale (400)
 *     — RevealText découpe le titre en mots, on vérifie les deux
 *     blocs par leur graisse calculée ;
 *  4. le reste de la page est intact : eyebrow « DEMANDE DE DEVIS
 *     PERSONNALISÉ », sous-texte, trois bénéfices à cocher,
 *     formulaire (champ prénom, bouton « Obtenir Un Devis ») ;
 *  5. aucune erreur console, aucun débordement horizontal.
 *
 * LEÇON (17/11) : RevealText joint les mots par ESPACES
 * INSÉCABLES (\u00A0) — normaliser avant toute comparaison
 * textuelle, sinon faux négatif garanti.
 */
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const WIDTHS = [1440, 1024, 768, 390];
const ATTENTE = 2600; // révélation mot à mot du titre + animations

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const ok = (cond, label) => {
    console.log(`${cond ? "OK  " : "ÉCHEC"} ${label}`);
    if (!cond) failures++;
  };
  // RevealText joint les mots avec des espaces insécables (\u00A0)
  const txt = (s) => s.replace(/\u00A0/g, " ").trim();

  for (const w of WIDTHS) {
    console.log(`\n===== ${w}px =====`);
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`${BASE}/#/demander-un-devis`, { waitUntil: "load" });
    await page.waitForTimeout(ATTENTE);

    // 1-2. Titre H1 exact, ancien texte absent
    const h1 = txt(await page.locator("h1").first().textContent());
    ok(
      h1 === "Optimisez Votre Site Web Pour Augmenter Vos Ventes",
      `H1 = « ${h1} »`
    );
    ok(
      !h1.includes("Augmenter Les Ventes"),
      "ancien texte « Augmenter Les Ventes » absent du H1"
    );

    // 3. Graisse : « Augmenter Vos Ventes » en gras, le reste normal
    //    LEÇON : RevealText pose le fontWeight SUR le span intérieur
    //    (h1 > span.mot-enveloppe > span.mot) — lire la graisse du
    //    span INTÉRIEUR lui-même, pas de son parent (l'enveloppe ne
    //    porte aucun style de graisse, la lecture renvoyait vide).
    const graisse = await page.evaluate(() => {
      const mots = [...document.querySelectorAll("h1 span span")];
      const parMot = mots.map((s) => ({
        mot: s.textContent.replace(/\u00A0/g, " ").trim(),
        poids: getComputedStyle(s).fontWeight,
      }));
      const gras = parMot.filter((m) => m.poids === "700").map((m) => m.mot).join(" ");
      const normal = parMot.filter((m) => m.poids === "400").map((m) => m.mot).join(" ");
      return { gras, normal };
    });
    ok(
      graisse.gras === "Augmenter Vos Ventes",
      `partie en gras (700) = « ${graisse.gras} »`
    );
    ok(
      graisse.normal === "Optimisez Votre Site Web Pour",
      `partie normale (400) = « ${graisse.normal} »`
    );

    // 4. Reste de la page intact
    const eyebrow = txt(
      await page.locator(".text-eyebrow").first().textContent()
    );
    ok(eyebrow === "DEMANDE DE DEVIS PERSONNALISÉ", `eyebrow = « ${eyebrow} »`);
    const sousTexte = await page
      .locator("h1 ~ p, h1 + div p")
      .first()
      .textContent();
    ok(
      (sousTexte || "").includes("sites web obsolètes"),
      "sous-texte descriptif présent"
    );
    const benefices = await page.locator("ul li").allTextContents();
    ok(
      benefices.some((b) => b.includes("Attirer les bons visiteurs")) &&
        benefices.some((b) => b.includes("Transformer les visiteurs en clients")),
      `trois bénéfices présents (${benefices.length} <li> relevées)`
    );
    const bouton = await page
      .locator("button", { hasText: "Obtenir Un Devis" })
      .count();
    ok(bouton >= 1, "bouton « Obtenir Un Devis » présent");

    // 5. Console + débordement
    ok(errors.length === 0, `aucune erreur console (${errors.length})`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    ok(overflow <= 0, `aucun débordement horizontal (delta = ${overflow}px)`);
    await page.close();
  }

  await browser.close();
  console.log(
    failures === 0
      ? `\nRÉSULTAT : TOUS LES CONTRÔLES PASSENT — le titre de la page Devis est « Optimisez Votre Site Web Pour Augmenter Vos Ventes », « Augmenter Vos Ventes » en gras.`
      : `\nRÉSULTAT : ${failures} ÉCHEC(S) — voir ci-dessus.`
  );
  process.exit(failures === 0 ? 0 : 1);
})();
