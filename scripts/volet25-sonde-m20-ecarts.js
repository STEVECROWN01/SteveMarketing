/**
 * SONDE M20 (confirmation) — mesure l'écart de TEXTE entre les phrases
 * consécutives d'un même paragraphe (rangées svc-part qui se suivent)
 * et vérifie la coupure des <div> longs (M21 : bloc entier repoussé).
 */
const { chromium } = require("playwright");
const fs = require("fs");

async function mesurer(page) {
  return page.evaluate(() => {
    /* 1) écart de TEXTE entre rangées consécutives : dernier texte de
     *    la rangée k → premier texte de la rangée k+1. */
    const parties = Array.from(document.querySelectorAll(".ppage .svc-part"));
    const ecarts = [];
    for (let k = 1; k < parties.length; k++) {
      const p1 = parties[k - 1].querySelectorAll(".desc-riche p, .desc-riche ul, .desc-riche ol, .desc-riche div");
      const p2 = parties[k].querySelectorAll(".desc-riche p, .desc-riche ul, .desc-riche ol, .desc-riche div");
      if (!p1.length || !p2.length) continue;
      const a = p1[p1.length - 1].getBoundingClientRect();
      const b = p2[0].getBoundingClientRect();
      const memeParagraphe =
        p2[0].classList.contains("p-suite") || p2[0].classList.contains("li-suite");
      ecarts.push({
        rangées: `${k}→${k + 1}`,
        écartTextePx: Math.round(b.top - a.bottom),
        suite: memeParagraphe,
      });
    }
    /* 2) vide sous le tableau par page */
    const pages = Array.from(document.querySelectorAll(".ppage"));
    const vides = pages.map((pg, i) => {
      const pgRect = pg.getBoundingClientRect();
      const parties2 = Array.from(pg.querySelectorAll(".svc-part"));
      const pied = pg.querySelector(".pied");
      if (!parties2.length || !pied) return { page: i + 1, videSousTableau: null };
      const dernier = parties2[parties2.length - 1].getBoundingClientRect();
      const piedTop = pied.getBoundingClientRect().top;
      return { page: i + 1, videSousTableau: Math.round(piedTop - dernier.bottom) };
    });
    return { nbPages: pages.length, ecartsEntreRangées: ecarts, vides };
  });
}

(async () => {
  const browser = await chromium.launch();

  /* --- CAS 1 : D2600004 réel (texte brut, phrase par phrase) --- */
  const page1 = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await page1.setContent(fs.readFileSync("/tmp/render/m20-m21-devis.html", "utf8"), { waitUntil: "load" });
  await page1.waitForFunction(
    "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 1200",
    { timeout: 20000, polling: 400 },
  );
  console.log("=== CAS 1 : devis réel D2600004 (texte brut) ===");
  console.log(JSON.stringify(await mesurer(page1), null, 1));

  /* --- CAS 2 : description en <div> (l'éditeur : Entrée = <div>) --- */
  if (fs.existsSync("/tmp/render/m20-m21-div.html")) {
    const page2 = await browser.newPage({ viewport: { width: 900, height: 1400 } });
    await page2.setContent(fs.readFileSync("/tmp/render/m20-m21-div.html", "utf8"), { waitUntil: "load" });
    await page2.waitForFunction(
      "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 1200",
      { timeout: 20000, polling: 400 },
    );
    console.log("=== CAS 2 : description en <div> longs (Entrée dans l'éditeur) ===");
    console.log(JSON.stringify(await mesurer(page2), null, 1));
  }
  await browser.close();
})().catch((e) => {
  console.error("ÉCHEC :", e);
  process.exit(1);
});
