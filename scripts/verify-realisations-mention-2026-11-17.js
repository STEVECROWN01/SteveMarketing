#!/usr/bin/env node
/** Vérification page Réalisations (17/11, 2e série) :
 *  1. la pastille blanche de catégorie a DISPARU (aucun span
 *     arrondi à fond clair au-dessus des titres) ;
 *  2. la mention = simple texte + icône épingle (svg) ;
 *  3. position de la mention : à droite du titre quand la largeur
 *     le permet, sinon ligne suivante (mesure top/left) ;
 *  4. phrase descriptive présente sous chaque titre ;
 *  5. captures d'écran pour contrôle visuel. */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = "/tmp/verif-realisation-17-11";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const log = (...a) => console.log(...a);

  for (const w of [1440, 1280, 1024, 768, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/#/realisations`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    // Aller à la section des projets
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
        // Mention : le <p> text-sm qui suit le h2 dans le conteneur flex
        const mention = h2.parentElement.querySelector("p.text-sm");
        const mr = mention ? mention.getBoundingClientRect() : null;
        const pin = mention ? mention.querySelector("svg") : null;
        // Phrase descriptive : p.text-body
        const desc = article.querySelector("p.text-body");
        const dr = desc ? desc.getBoundingClientRect() : null;
        // Pastille blanche héritée ? (span arrondi fond clair)
        const oldPill = Array.from(article.querySelectorAll("span")).find((s) => {
          const cs = getComputedStyle(s);
          return cs.borderRadius === "9999px" && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
        });
        return {
          titre: h2.textContent.trim().slice(0, 30),
          mention: mention ? mention.textContent.trim() : null,
          mentionMemeLigne: mr ? Math.abs(mr.top - h2r.top) < 4 : null,
          mentionADroite: mr ? mr.left >= h2r.right - 2 : null,
          mentionSousTitre: mr ? mr.top >= h2r.bottom - 2 : null,
          pinPresent: !!pin,
          pinApresTexte: pin ? pin.getBoundingClientRect().left >= mr.right - 40 : null,
          sansFondNiBordure: mention
            ? (() => {
                const cs = getComputedStyle(mention);
                return cs.backgroundColor === "rgba(0, 0, 0, 0)" && cs.borderWidth === "0px" && cs.borderRadius === "0px";
              })()
            : null,
          description: desc ? desc.textContent.trim().slice(0, 45) + "…" : null,
          descSousTitre: dr ? dr.top >= h2r.bottom - 2 : null,
          anciennePastille: oldPill ? oldPill.textContent.trim() : null,
        };
      });
    });

    log(`\n===== ${w}px =====`);
    for (const a of audit) {
      log(`  « ${a.titre} »`);
      log(`    mention            : ${a.mention}`);
      log(`    même ligne (droite): ${a.mentionMemeLigne} · à droite: ${a.mentionADroite} · sinon sous titre: ${a.mentionSousTitre}`);
      log(`    épingle présente   : ${a.pinPresent} (après le texte: ${a.pinApresTexte})`);
      log(`    sans fond/bordure  : ${a.sansFondNiBordure}`);
      log(`    description        : ${a.description} (sous le titre: ${a.descSousTitre})`);
      log(`    ancienne pastille  : ${a.anciennePastille === null ? "AUCUNE ✓" : "ENCORE LÀ ✗ → " + a.anciennePastille}`);
    }

    // Captures : 1er projet (mention à droite attendue en large) + 2e (titre long)
    await page.screenshot({ path: `${OUT}/realisations-${w}-p1.png` });
    log(`  capture → ${OUT}/realisations-${w}-p1.png`);
    await ctx.close();
  }

  await browser.close();
  log("\nTerminé.");
})().catch((e) => { console.error(e); process.exit(1); });
