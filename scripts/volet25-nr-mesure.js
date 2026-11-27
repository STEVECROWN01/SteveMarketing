/** Contrôle non-régression — proposition : moule de pagination
 *  (sections → pages) + devis : ordre et remplissage des blocs. */
const { chromium } = require("playwright");
const fs = require("fs");

async function mesurer(page, selecteurSection) {
  return page.evaluate((sel) => {
    const pages = Array.from(document.querySelectorAll(".ppage"));
    const sections = {};
    document.querySelectorAll(sel).forEach((s) => {
      let p = s;
      while (p && !p.classList.contains("ppage")) p = p.parentElement;
      if (p) sections[(s.textContent || "").trim().slice(0, 40)] = p.getAttribute("data-page");
    });
    return { nbPages: pages.length, sections };
  }, selecteurSection);
}

(async () => {
  const browser = await chromium.launch();

  /* 1 — proposition : moule 6 pages, sections à leurs pages */
  const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await page.setContent(fs.readFileSync("/tmp/render/nr-proposition.html", "utf8"), { waitUntil: "load" });
  await page.waitForFunction(
    "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 1500",
    { timeout: 20000, polling: 400 },
  );
  console.log("=== PROPOSITION (défaut) ===");
  console.log(JSON.stringify(await mesurer(page, "[data-section]"), null, 1));

  /* 2 — devis depuis proposition (9 périmètres) : validité sous PAIEMENT */
  const page2 = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await page2.setContent(fs.readFileSync("/tmp/render/m19c-devis-prop-9blocs.html", "utf8"), { waitUntil: "load" });
  await page2.waitForFunction(
    "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 1500",
    { timeout: 20000, polling: 400 },
  );
  const devis = await page2.evaluate(() => {
    const pages = Array.from(document.querySelectorAll(".ppage"));
    return pages.map((pg, i) => {
      const pgRect = pg.getBoundingClientRect();
      const present = (sel) => {
        const el = pg.querySelector(sel);
        return el ? Math.round(el.getBoundingClientRect().bottom - pgRect.top) : null;
      };
      return {
        page: i + 1,
        finTableau: present(".svc-foot"),
        total: present(".total-sous-tableau"),
        cgv: present(".conditions-block"),
        paiement: present(".invoice-payment-block--devis"),
        validite: present(".validite-notes"),
      };
    });
  });
  console.log("=== DEVIS DEPUIS PROPOSITION (9 périmètres) — bas de chaque bloc ===");
  console.log(JSON.stringify(devis, null, 1));
  await browser.close();
})().catch((e) => {
  console.error("ÉCHEC :", e);
  process.exit(1);
});
