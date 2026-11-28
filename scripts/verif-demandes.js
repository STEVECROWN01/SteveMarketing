const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await page.goto("http://127.0.0.1:3100/#/admin", { waitUntil: "load" });
  await page.waitForSelector("#admin-password", { state: "visible" });
  await page.fill("#admin-password", "TestVolet31!2026");
  await page.click('button:has-text("Ouvrir L\'Espace")');
  await page.waitForSelector('nav[aria-label="Sections du back-office"]');
  await page.waitForTimeout(1200);
  await page.locator('nav button:has-text("Demandes")').click();
  await page.waitForTimeout(1500);
  const infos = await page.evaluate(() => ({
    compteur: document.body.innerText.match(/Demandes reçues\s*\((\d+)\)/)?.[1],
    cartes: [...document.querySelectorAll("div.rounded-2xl")].filter((d) => d.textContent.includes("DOSSOU") || d.textContent.includes("Kouadio") || d.textContent.includes("Couvreur")).length,
    tableauVisible: [...document.querySelectorAll("table")].filter((t) => t.getBoundingClientRect().height > 10).length,
    statutSelect: document.querySelectorAll("select").length,
  }));
  console.log(JSON.stringify(infos, null, 1));
  /* déplier les détails d'une carte */
  await page.locator('button[aria-label*="Détails de la demande"]:visible').first().click();
  await page.waitForTimeout(500);
  const details = await page.evaluate(() => document.body.innerText.includes("Notification email"));
  console.log("détails dépliables :", details);
  await page.screenshot({ path: "/tmp/render/volet31/demandes-carte-375.png", fullPage: false });
  await browser.close();
})();
