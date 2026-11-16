#!/usr/bin/env node
/** Vérification page Réalisations (17/11, 3e série — correction) :
 *  1. la mention est AU-DESSUS du titre (top de la mention < top du h2) ;
 *  2. l'icône est une ÉTOILE (svg contenant le path 'star' lucide),
 *     placée AU DÉBUT (à gauche du texte de la mention) ;
 *  3. toujours SANS fond / bordure / arrondi (aucune forme de bouton) ;
 *  4. la phrase descriptive reste sous le titre ;
 *  5. captures d'écran pour contrôle visuel. */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = "/tmp/verif-realisation-17-11-b";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const log = (...a) => console.log(...a);
  let allOk = true;

  for (const w of [1440, 1280, 1024, 768, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/#/realisations`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const section = document.querySelector('section[aria-label="Réalisations de Stevens Akpovi"]');
      const y = section.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    });
    await page.waitForTimeout(1800);

    const audit = await page.evaluate(() => {
      const section = document.querySelector('section[aria-label="Réalisations de Stevens Akpovi"]');
      const articles = Array.from(section.querySelectorAll("article"));
      return articles.map((article) => {
        const h2 = article.querySelector("h2");
        const h2r = h2.getBoundingClientRect();
        // Mention : le <p> text-sm AVANT le h2 dans la colonne
        const mention = h2.parentElement.querySelector("p.text-sm");
        const mr = mention ? mention.getBoundingClientRect() : null;
        const icon = mention ? mention.querySelector("svg") : null;
        const ir = icon ? icon.getBoundingClientRect() : null;
        const desc = article.querySelector("p.text-body");
        const dr = desc ? desc.getBoundingClientRect() : null;
        const cs = mention ? getComputedStyle(mention) : null;
        const iconFill = icon ? getComputedStyle(icon).fill : null;
        return {
          titre: h2.textContent.trim().slice(0, 30),
          mention: mention ? mention.textContent.trim() : null,
          mentionAuDessus: mr ? mr.bottom <= h2r.top + 2 : null,
          gapMentionTitre: mr ? Math.round(h2r.top - mr.bottom) : null,
          etoilePresente: !!icon,
          etoileAuDebut: ir && mr ? ir.left < mr.left + 1 && ir.left >= mr.left - 1 : null,
          etoileAVantTexte: ir ? ir.right <= mr.left + 30 : null,
          etoileRemplie: iconFill && iconFill !== "none",
          sansFondNiBordure: cs
            ? cs.backgroundColor === "rgba(0, 0, 0, 0)" && cs.borderWidth === "0px" && cs.borderRadius === "0px"
            : null,
          description: desc ? desc.textContent.trim().slice(0, 40) + "…" : null,
          descSousTitre: dr ? dr.top >= h2r.bottom - 2 : null,
        };
      });
    });

    log(`\n===== ${w}px =====`);
    for (const a of audit) {
      const ok =
        a.mentionAuDessus === true &&
        a.etoilePresente === true &&
        a.etoileAuDebut === true &&
        a.sansFondNiBordure === true &&
        a.descSousTitre === true;
      if (!ok) allOk = false;
      log(`  « ${a.titre} » ${ok ? "✓" : "✗"}`);
      log(`    mention au-dessus   : ${a.mentionAuDessus} (écart avec le titre : ${a.gapMentionTitre}px)`);
      log(`    étoile au début     : ${a.etoilePresente} (position: ${a.etoileAuDebut}, remplie: ${a.etoileRemplie})`);
      log(`    sans fond/bordure   : ${a.sansFondNiBordure}`);
      log(`    description sous t. : ${a.descSousTitre} → ${a.description}`);
    }
    await page.screenshot({ path: `${OUT}/realisations-${w}-p1.png` });
    log(`  capture → ${OUT}/realisations-${w}-p1.png`);
    await ctx.close();
  }

  await browser.close();
  log(`\n${allOk ? "TOUS LES CHECKS PASSENT ✓" : "ÉCHEC — voir ci-dessus ✗"}`);
  process.exit(allOk ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
