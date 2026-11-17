const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  for (const w of [280, 320, 360, 390, 640, 1440]) {
    const page = await browser.newPage({ viewport: { width: w, height: w === 640 ? 960 : 844 } });
    await page.goto("http://localhost:3100/#/accueil", { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(4500);
    const m = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll("#hero .hero-cta a"));
      return ctas.map((a) => {
        const s = getComputedStyle(a);
        const r = a.getBoundingClientRect();
        return { libelle: (a.innerText || "").trim().slice(0, 22), font: s.fontSize, pad: s.paddingLeft, w: Math.round(r.width), fleche: a.querySelector("svg:last-child") ? getComputedStyle(a.querySelector("svg:last-child")).display : "aucune" };
      });
    });
    console.log(`${w}px :`, JSON.stringify(m));
    await page.close();
  }
  await browser.close();
})();
