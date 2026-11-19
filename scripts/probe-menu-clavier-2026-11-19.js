/**
 * SONDE CLAVIER DU MENU PLEIN ÉCRAN (audit du 19/11 — sixième volet).
 * Le menu plein écran (Header.tsx) est un overlay modal : lorsqu'il est
 * ouvert, un utilisateur au clavier doit rester DANS le menu (piège de
 * focus), le focus doit être placé sur le premier élément interactif à
 * l'ouverture, restauré sur le bouton qui a ouvert le menu à la
 * fermeture, et l'overlay doit s'annoncer comme dialog modal.
 * Cette sonde mesure le comportement réel sur le build courant :
 *   1. ouverture au clavier (Enter sur le hamburger) ;
 *   2. où est le focus après ouverture ;
 *   3. 25 Tab successifs : le focus sort-il du menu ? (éléments sous
 *      l'overlay invisibles = échec WCAG 2.4.3/2.1.2) ;
 *   4. role/aria-modal de l'overlay ;
 *   5. Échap : le menu se ferme-t-il ? où est le focus après ?
 * Sortie : scripts/probe-menu-clavier-2026-11-19.json
 *   node scripts/probe-menu-clavier-2026-11-19.js
 * LEÇON OPS habituelle : serveur + sonde dans la même invocation, sortie
 * redirigée vers un fichier.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:3100";
const OUT = path.join(__dirname, "probe-menu-clavier-2026-11-19.json");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 120)); });

  await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(1500);

  const out = { consoleErrors };

  /* 1. Ouverture au clavier : Tab jusqu'au hamburger, Enter. */
  const burger = page.locator('button[aria-controls="menu-plein-ecran"]');
  await burger.focus();
  out.focusAvantOuverture = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);

  out.menuOuvert = await page.evaluate(() => !!document.getElementById("menu-plein-ecran"));
  out.ariaExpandedApresOuverture = await burger.getAttribute("aria-expanded");

  /* 2. Focus après ouverture. */
  out.focusApresOuverture = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { el: "body (aucun focus géré)" };
    const menu = document.getElementById("menu-plein-ecran");
    return {
      el: el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 40) ?? el.tagName,
      dansMenu: menu ? menu.contains(el) : false,
    };
  });

  /* 3. role / aria-modal de l'overlay. */
  out.dialogAria = await page.evaluate(() => {
    const menu = document.getElementById("menu-plein-ecran");
    if (!menu) return null;
    return { role: menu.getAttribute("role"), ariaModal: menu.getAttribute("aria-modal"), ariaLabel: menu.getAttribute("aria-label"), ariaLabelledby: menu.getAttribute("aria-labelledby") };
  });

  /* 4. 30 Tab successifs — le focus reste-t-il dans l'EN-TÊTE ?
     (critère réel du piège : le menu est imbriqué dans le header,
     dont les contrôles — logo, pilule de navigation bureau, hamburger,
     croix — restent visibles AU-DESSUS de l'overlay z-50 > z-40 ;
     le focus ne doit JAMAIS atteindre un élément SOUS l'overlay.) */
  const trajet = [];
  let sorties = 0;
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(60);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      const header = document.querySelector("header");
      const menu = document.getElementById("menu-plein-ecran");
      if (!el || el === document.body) return { label: "body", visible: false, dansMenu: false, dansHeader: false };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        label: el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30) ?? el.tagName,
        dansMenu: menu ? menu.contains(el) : false,
        dansHeader: header ? header.contains(el) : false,
        visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.opacity !== "0",
      };
    });
    trajet.push(info);
    if (!info.dansHeader) sorties++;
  }
  out.tabSortiesDuHeader = sorties;
  out.trajetTab = trajet;

  /* 5. Shift+Tab depuis le PREMIER focusable — wrap vers le dernier ? */
  await page.evaluate(() => {
    const header = document.querySelector("header");
    const focusables = header
      ? Array.from(header.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((el) => el.getClientRects().length > 0 && el.tabIndex !== -1)
      : [];
    focusables[0]?.focus();
  });
  await page.waitForTimeout(150);
  await page.keyboard.press("Shift+Tab");
  await page.waitForTimeout(150);
  out.shiftTabDepuisPremier = await page.evaluate(() => {
    const el = document.activeElement;
    const header = document.querySelector("header");
    const labels = header
      ? Array.from(header.querySelectorAll("a[href], button")).map((n) => n.getAttribute("aria-label") ?? n.textContent?.trim().slice(0, 25) ?? n.tagName)
      : [];
    return {
      atteint: el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 25) ?? el.tagName,
      dernierAttendu: labels[labels.length - 1],
    };
  });

  /* 6. Échap : fermeture + focus restauré sur le hamburger ? */
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  out.menuFermeParEscape = await page.evaluate(() => !document.getElementById("menu-plein-ecran"));
  out.focusApresFermeture = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return "body (focus perdu)";
    return el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30) ?? el.tagName;
  });

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

  console.log("menu ouvert au clavier :", out.menuOuvert, "| aria-expanded:", out.ariaExpandedApresOuverture);
  console.log("focus après ouverture :", JSON.stringify(out.focusApresOuverture));
  console.log("dialog aria :", JSON.stringify(out.dialogAria));
  console.log("Tab : sorties de l'EN-TÊTE =", out.tabSortiesDuHeader, "/ 30 pressions");
  const firstExit = trajet.findIndex((t) => !t.dansHeader);
  console.log("première sortie au Tab n°", firstExit >= 0 ? firstExit + 1 : "jamais", firstExit >= 0 ? `→ ${trajet[firstExit].label}` : "");
  const sousOverlay = trajet.filter((t) => !t.dansHeader);
  if (sousOverlay.length) console.log("éléments atteints sous l'overlay :", JSON.stringify(sousOverlay.map((s) => s.label)));
  console.log("Échap ferme :", out.menuFermeParEscape, "| focus après fermeture :", out.focusApresFermeture);
  console.log("erreurs console :", consoleErrors.length);
})();
