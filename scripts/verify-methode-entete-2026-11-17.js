/**
 * Vérification du 17/11/2026 — PAGE MÉTHODE, EN-TÊTE (demande de l'éditeur) :
 * « corrige le texte "MÉTHODE · COMMENT JE TRAVAILLE" en "Processus" puis
 *  corrige le titre "Processus : des sites web pensés pour convertir" en
 *  "Des sites web pensés pour convertir." »
 *
 * Contrôles, sur 1440 / 1280 / 1024 / 768 / 390 :
 *  1. le surtitre (eyebrow) du PageHero affiche exactement « PROCESSUS »
 *     (le mot « Processus » en capitales — la classe .text-eyebrow du site
 *     applique text-transform: uppercase, comme tous les surtitres du site) ;
 *  2. l'ancien surtitre « MÉTHODE · COMMENT JE TRAVAILLE » a DISPARU ;
 *  3. le H1 affiche exactement « Des sites web pensés pour convertir. »
 *     (point final inclus) ;
 *  4. l'ancien préfixe « Processus : » a DISPARU du titre ;
 *  5. le bouton « Réserver Un Appel » est toujours présent sous le titre ;
 *  6. la suite de la page est intacte (section « COMMENT JE TRAVAILLE »,
 *     réalisations, CTA final) ;
 *  7. aucune erreur console sur la page ;
 *  8. aucun débordement horizontal (scrollWidth <= clientWidth).
 *  9. les AUTRES pages gardent leurs eyebrow d'origine (contrôle de
 *     non-régression : Publicité et Référencement).
 *
 * LEÇON (17/11) : RevealText joint les mots par ESPACES INSÉCABLES
 * (\u00A0) — toute comparaison textuelle avec le rendu doit les
 * normaliser en espaces normales (fonction txt() ci-dessous), sinon
 * faux négatif garanti.
 */
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const WIDTHS = [1440, 1280, 1024, 768, 390];
const ATTENTE = 2600; // révélation au défilement + animations

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const ok = (cond, label) => {
    console.log(`${cond ? "OK  " : "ÉCHEC"} ${label}`);
    if (!cond) failures++;
  };
  // RevealText joint les mots avec des espaces insécables (\u00A0) :
  // on normalise pour comparer au texte visible.
  const txt = (s) => s.replace(/\u00A0/g, " ").trim();

  for (const w of WIDTHS) {
    console.log(`\n===== ${w}px =====`);
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`${BASE}/#/methode`, { waitUntil: "networkidle" });
    await page.waitForTimeout(ATTENTE);

    // 1-2. Surtitre du PageHero
    const eyebrow = txt(await page.locator("header .text-eyebrow").first().textContent());
    ok(eyebrow.trim() === "Processus", `surtitre DOM = « ${eyebrow.trim()} » (attendu « Processus »)`);
    const upper = await page.evaluate(() => {
      const el = document.querySelector("header .text-eyebrow");
      return getComputedStyle(el).textTransform;
    });
    ok(upper === "uppercase", `text-transform: ${upper} → affichage « PROCESSUS » (convention du site)`);
    ok(!eyebrow.includes("MÉTHODE") && !eyebrow.includes("TRAVAILLE"), "ancien surtitre « MÉTHODE · COMMENT JE TRAVAILLE » absent");

    // 3-4. Titre H1
    const h1 = txt(await page.locator("header h1").textContent());
    ok(h1.trim() === "Des sites web pensés pour convertir.", `H1 = « ${h1.trim()} » (point final inclus)`);
    ok(!h1.includes("Processus"), "ancien préfixe « Processus : » absent du titre");

    // 5. Bouton toujours présent
    const btn = page.getByRole("button", { name: /Réserver un appel/i });
    ok((await btn.count()) >= 1, "bouton « Réserver Un Appel » présent sous le titre");

    // 6. Suite de la page intacte
    const h2s = (await page.locator("h2").allTextContents()).map(txt);
    ok(h2s.some((t) => t.includes("Comment Je Travaille")), `section « Comment Je Travaille » présente (${h2s.length} H2)`);
    ok(h2s.some((t) => t.includes("Sites web que j'ai créés")), "section réalisations présente");
    ok(h2s.some((t) => t.includes("Franchissons ensemble")), "CTA final présent");
    const steps = await page.locator("#comment-je-travaille ol > li").count();
    ok(steps === 6, `6 étapes à accordéon (${steps})`);

    // 7. Erreurs console
    ok(errors.length === 0, `aucune erreur console${errors.length ? " : " + errors.slice(0, 2).join(" | ") : ""}`);

    // 8. Débordement horizontal
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(overflow <= 0, `aucun débordement horizontal (${overflow}px)`);

    await page.close();
  }

  // 9. Non-régression : autres pages (1440 suffit)
  console.log(`\n===== non-régression (1440) =====`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [hash, attendu] of [
    ["#/publicite-meta-ads", "PUBLICITÉ · META ADS"],
    ["#/referencement-seo", "RÉFÉRENCEMENT · SEO"],
  ]) {
    await page.goto(`${BASE}/${hash}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const eb = txt(await page.locator("header .text-eyebrow").first().textContent());
    ok(eb.trim() === attendu, `${hash} : eyebrow inchangé « ${eb.trim()} »`);
  }
  // La page Réalisations ne doit pas être impactée non plus
  await page.goto(`${BASE}/#/realisations`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const h1r = txt(await page.locator("header h1").textContent());
  ok(!h1r.includes("Processus"), `Réalisations : H1 inchangé (« ${h1r.trim().slice(0, 40)}… »)`);

  await browser.close();
  console.log(`\n${failures === 0 ? "✔ TOUT EST OK" : `✘ ${failures} ÉCHEC(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
})();
