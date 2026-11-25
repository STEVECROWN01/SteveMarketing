/** Sonde du rendu proposition v2 : charge le HTML, attend la
 * pagination STABLE, capture chaque page et produit le PDF. */
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1300 } });
  await page.goto("file:///tmp/render/prop/proposition.html", { waitUntil: "networkidle", timeout: 60000 });

  const ok = await page.waitForFunction(
    "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 900",
    null, { timeout: 20000, polling: 300 },
  ).catch(() => null);
  console.log("pagination stable :", ok ? "OK" : "ÉCHEC");
  const nb = await page.evaluate(() => window.__pagesPc || 0);
  console.log("pages :", nb);

  /* Bloquer les re-paginations pendant la capture. */
  await page.evaluate(() => {
    window.__paginePcAt = Date.now() + 100000; /* neutralise la condition de stabilité */
  });

  for (let i = 1; i <= nb; i++) {
    await page.evaluate((n) => {
      const pages = document.querySelectorAll(".ppage");
      pages.forEach((p, idx) => (p.style.display = idx === n - 1 ? "" : "none"));
    }, i);
    await page.waitForTimeout(200);
    /* Capture par découpage de la page visible (le .ppage est centré). */
    const clip = await page.evaluate((n) => {
      const p = document.querySelectorAll(".ppage")[n - 1];
      p.scrollIntoView();
      const r = p.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }, i);
    await page.waitForTimeout(120);
    await page.screenshot({ path: `/tmp/render/prop/page-${i}.png`, clip });
    console.log(`page-${i}.png capturée`);
  }

  await page.evaluate(() => {
    document.querySelectorAll(".ppage").forEach((p) => (p.style.display = ""));
  });
  await page.waitForTimeout(200);
  await page.pdf({ path: "/tmp/render/prop/proposition.pdf", format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
  console.log("PDF :", fs.statSync("/tmp/render/prop/proposition.pdf").size, "octets");

  const footers = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".ppage")).map((p) => p.querySelector(".p-num")?.textContent?.trim()),
  );
  console.log("numéros de pied :", JSON.stringify(footers));

  await browser.close();
})().catch((e) => { console.error("ERREUR :", e); process.exit(1); });
