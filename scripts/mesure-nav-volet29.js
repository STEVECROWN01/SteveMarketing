const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  await page.goto("http://127.0.0.1:3100/#/admin", { waitUntil: "load" });
  await page.waitForSelector("#admin-password");
  await page.fill("#admin-password", "TestVolet29!2026");
  await page.click('button:has-text("Ouvrir L\'Espace")');
  await page.waitForSelector('nav[aria-label="Sections du back-office"]');
  await page.waitForTimeout(800);
  const infos = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Sections du back-office"]');
    const navRect = nav.getBoundingClientRect();
    const boutons = [...nav.querySelectorAll("button")].map((b) => {
      const r = b.getBoundingClientRect();
      return { label: (b.textContent || "").trim().slice(0, 18), droite: Math.round(r.right), bas: Math.round(r.bottom) };
    });
    return {
      navLargeur: Math.round(navRect.width),
      scrollLargeur: nav.scrollWidth,
      clientLargeur: nav.clientWidth,
      depasse: nav.scrollWidth > nav.clientWidth,
      dernier: boutons[boutons.length - 1],
      boutons,
    };
  });
  console.log(JSON.stringify(infos, null, 1));
  await browser.close();
})();
