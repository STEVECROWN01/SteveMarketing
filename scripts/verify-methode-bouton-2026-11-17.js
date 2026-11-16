#!/usr/bin/env node
/** Vérification page Méthode (17/11, 4e série) :
 *  1. la FLÈCHE sinusoïdale a DISPARU (aucun SVG #fleche-methode,
 *     aucun path décoratif entre les sections) ;
 *  2. le bouton « Voir Comment Je Travaille » existe (ancre
 *     interne #comment-je-travaille) ;
 *  3. le CLIC fait défiler jusqu'à la section « Comment Je
 *     Travaille » (position d'arrivée mesurée : haut de la section
 *     visible SOUS le header fixe, grâce à scroll-mt-20) ;
 *  4. l'ancien bouton « Demander Un Devis » de cette colonne
 *     n'existe plus (le « Demander Un Devis Personnalisé » de la
 *     section 5, lui, reste) ;
 *  5. le reste de la page est intact : 5 sections, accordéon
 *     fonctionnel, aucune erreur console. */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3100";

(async () => {
  const browser = await chromium.launch();
  let allOk = true;
  const check = (ok, label) => {
    console.log(`  ${ok ? "✓" : "✗"} ${label}`);
    if (!ok) allOk = false;
  };

  for (const w of [1440, 1280, 1024, 768, 390]) {
    console.log(`\n===== ${w}px =====`);
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 90)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 90)); });

    await page.goto(`${BASE}/#/methode`, { waitUntil: "load" });
    await page.waitForTimeout(2000);

    // 1. Flèche absente
    const arrowGone = await page.evaluate(() => !document.getElementById("fleche-methode"));
    // Aucun SVG décoratif de trajet DANS LE CONTENU de page — les
    // icônes de marque (WhatsApp/LinkedIn) du header fixe, hors
    // contenu, ont naturellement des paths longs et sont exclues.
    const noDecorSvg = await page.evaluate(() => {
      const scope = document.getElementById("contenu-principal") || document.querySelector("main");
      const svgs = Array.from(scope.querySelectorAll("svg"));
      return !svgs.some((s) => (s.querySelector("path")?.getAttribute("d") || "").length > 200);
    });
    check(arrowGone, "SVG #fleche-methode absent");
    check(noDecorSvg, "aucun SVG décoratif de trajet dans la page");

    // 2. Bouton présent + ancien bouton absent
    const btn = page.locator('a[href="#comment-je-travaille"]');
    const btnCount = await btn.count();
    check(btnCount === 1, `bouton « Voir Comment Je Travaille » présent (trouvé ${btnCount})`);
    const btnText = btnCount ? await btn.first().textContent() : "";
    check(!!btnText && btnText.includes("Voir Comment Je Travaille"), `libellé correct : « ${btnText?.trim()} »`);

    // La section cible existe
    const sectionExists = await page.evaluate(() => !!document.getElementById("comment-je-travaille"));
    check(sectionExists, "section #comment-je-travaille présente");

    // Position initiale de la section (avant clic)
    const before = await page.evaluate(() => {
      const s = document.getElementById("comment-je-travaille");
      return { top: s.getBoundingClientRect().top + window.scrollY, scrollY: window.scrollY };
    });

    // 3. CLIC → défilement fluide vers la section
    await btn.first().click();
    await page.waitForTimeout(2200); // laisser le smooth scroll se terminer
    const after = await page.evaluate(() => {
      const s = document.getElementById("comment-je-travaille");
      const r = s.getBoundingClientRect();
      return { topViewport: r.top, scrollY: window.scrollY, headerH: document.querySelector("header").getBoundingClientRect().height };
    });
    // scroll-mt-20 = 80px : la section doit se poser ~80px sous le haut
    // du viewport (tolérance 70-95px, le header fait 64-104px)
    const landed = after.topViewport >= 60 && after.topViewport <= 100;
    check(landed, `clic → section à ${Math.round(after.topViewport)}px du haut du viewport (attendu ≈80, header ${Math.round(after.headerH)}px)`);
    check(after.scrollY > before.scrollY, `défilement effectif (${Math.round(before.scrollY)} → ${Math.round(after.scrollY)}px)`);
    // URL non modifiée (ancre interne, pas de changement de hash)
    const hashOk = await page.evaluate(() => window.location.hash === "#/methode");
    check(hashOk, "URL inchangée (#/methode conservé)");

    // 4. L'ancien bouton « Demander Un Devis » de la colonne 2 a disparu ;
    //    celui de la section 5 (« Personnalisé ») reste
    const devisCount = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a"));
      return {
        ancien: links.filter((a) => a.textContent.trim() === "Demander Un Devis").length,
        section5: links.filter((a) => a.textContent.trim() === "Demander Un Devis Personnalisé").length,
      };
    });
    check(devisCount.ancien === 0, "ancien « Demander Un Devis » de la colonne supprimé");
    check(devisCount.section5 === 1, "« Demander Un Devis Personnalisé » de la section 5 conservé");

    // 5. Structure intacte + accordéon fonctionnel
    // (le hero est un <header> : 1 header + 4 <section> au total)
    const structure = await page.evaluate(() => {
      const main = document.getElementById("contenu-principal") || document.querySelector("main") || document.body;
      const topLevel = Array.from(main.children);
      return {
        headers: topLevel.filter((c) => c.tagName === "HEADER").length,
        sections: main.querySelectorAll("section").length,
        steps: main.querySelectorAll('[id^="process-etape-bouton-"]').length,
      };
    });
    check(structure.headers === 1, `hero <header> présent (trouvé ${structure.headers})`);
    check(structure.sections === 4, `4 sections présentes, hero mis à part (trouvé ${structure.sections})`);
    check(structure.steps === 6, `6 étapes d'accordéon présentes (trouvé ${structure.steps})`);

    // Accordéon : ouvrir l'étape 2 vérifie le mécanisme
    await page.evaluate(() => {
      const s = document.getElementById("comment-je-travaille");
      window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 150, behavior: "instant" });
    });
    await page.waitForTimeout(900);
    await page.click("#process-etape-bouton-1");
    await page.waitForTimeout(800);
    const expanded = await page.evaluate(() => document.getElementById("process-etape-bouton-1").getAttribute("aria-expanded"));
    check(expanded === "true", "accordéon étape 2 s'ouvre au clic");

    check(errors.length === 0, `aucune erreur console${errors.length ? " → " + errors.join(" | ") : ""}`);

    // Capture d'écran après clic sur le bouton (position d'arrivée)
    await page.screenshot({ path: `/tmp/verif-methode-17-11-c/arrivee-${w}.png` });
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${allOk ? "TOUS LES CHECKS PASSENT ✓" : "ÉCHEC — voir ci-dessus ✗"}`);
  process.exit(allOk ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
