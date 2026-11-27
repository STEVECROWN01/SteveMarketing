/** SONDE M19 — mesure : où tombent PAIEMENT, coordonnées bancaires,
 *  CGV/signature, validité+notes ; espace restant sous chaque bloc. */
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const html = fs.readFileSync("/tmp/render/m19-devis-prop.html", "utf8");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForFunction(
    "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 1500",
    { timeout: 20000, polling: 400 },
  );

  const rapport = await page.evaluate(() => {
    const pages = Array.from(document.querySelectorAll(".ppage"));
    const rep = { nbPages: pages.length, pages: [] };
    pages.forEach((pg, i) => {
      const pgRect = pg.getBoundingClientRect();
      const pied = pg.querySelector(".pied");
      const piedTop = pied ? pied.getBoundingClientRect().top - pgRect.top : null;
      const info = { page: i + 1, blocs: [], videSousDernierBloc: null };
      const selecteurs = [
        ["finTableau", ".svc-foot"],
        ["total", ".total-sous-tableau"],
        ["PAIEMENT", ".invoice-payment-block--devis"],
        ["CGV+signature", ".conditions-block"],
        ["banque", ".bank-block"],
        ["validite+notes", ".validite-notes"],
      ];
      let dernierBas = null;
      for (const [nom, sel] of selecteurs) {
        const el = pg.querySelector(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        info.blocs.push({
          nom,
          haut: Math.round(r.top - pgRect.top),
          bas: Math.round(r.bottom - pgRect.top),
          hauteur: Math.round(r.height),
        });
        dernierBas = r.bottom - pgRect.top;
      }
      info.videSousDernierBloc =
        piedTop !== null && dernierBas !== null ? Math.round(piedTop - dernierBas) : null;
      rep.pages.push(info);
    });
    return rep;
  });

  console.log(JSON.stringify(rapport, null, 2));
  await browser.close();
})().catch((e) => {
  console.error("ÉCHEC :", e);
  process.exit(1);
});
