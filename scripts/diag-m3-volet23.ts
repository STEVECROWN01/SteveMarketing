/** Diagnostic M3 : d'où vient le dépassement horizontal des cartes
 *  de listes (devis, factures) dans le back-office local. */
import puppeteer from "puppeteer-core";
import os from "os";
import path from "path";

const BASE = "http://localhost:3210";
const MOT_DE_PASSE = "volet23-verification-locale";

async function main() {
  const navigateur = await puppeteer.launch({
    headless: true,
    executablePath: path.join(os.homedir(), ".cache/ms-playwright/chromium-1200/chrome-linux64/chrome"),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await navigateur.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await page.goto(`${BASE}/#/admin`, { waitUntil: "networkidle2" });
  await page.waitForSelector('input[type="password"]', { timeout: 20000 });
  await page.type('input[type="password"]', MOT_DE_PASSE);
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => document.body.textContent?.includes("Tableau de bord") ?? false,
    { timeout: 20000 },
  );
  await new Promise((r) => setTimeout(r, 800));

  for (const section of ["devis", "factures", "propositions"] as const) {
    const index = section === "devis" ? 4 : section === "factures" ? 5 : 3;
    await page.click(`nav button:nth-child(${index})`);
    await new Promise((r) => setTimeout(r, 1200));
    const diagnostic = await page.evaluate(() => {
      const carte = document.querySelector("table")?.closest("div") as HTMLElement;
      const table = document.querySelector("table") as HTMLTableElement;
      const doc = document.scrollingElement as HTMLElement;
      const ths = Array.from(table.querySelectorAll("thead th")) as HTMLElement[];
      const colonnes = ths.map((th, i) => {
        const tds = Array.from(table.querySelectorAll(`tbody tr td:nth-child(${i + 1})`)) as HTMLElement[];
        return `${th.textContent?.trim()} (w ${th.offsetWidth})`;
      });
      return {
        carteClasse: carte?.className,
        carteScrollW: carte?.scrollWidth,
        carteClientW: carte?.clientWidth,
        ecart: carte ? carte.scrollWidth - carte.clientWidth : null,
        tableW: table.offsetWidth,
        docScrollW: doc.scrollWidth,
        docClientW: doc.clientWidth,
        colonnes,
      };
    });
    console.log(`\n=== ${section} ===`);
    console.log(JSON.stringify(diagnostic, null, 2));
  }
  await navigateur.close();
}
main();
