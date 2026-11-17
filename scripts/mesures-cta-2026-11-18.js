/**
 * MESURES CTA — 18/11/2026
 * Mesures DOM précises venant compléter verify-cta-conversion :
 *  1. HERO (accueil, téléphones 320–390 px) : depuis l'unification
 *     du libellé en « Voir Mes Réalisations » (plus long que
 *     « Voir Mes Travaux »), les deux CTA s'empilent sur deux
 *     lignes — ce script PROUVE que la contrainte éditoriale forte
 *     (« le hero reste entièrement visible à l'écran sans
 *     défilement », 13/11/2026) reste respectée sur toutes les
 *     largeurs testées.
 *  2. BOUTON D'ENVOI du formulaire d'audit (page #/audit-gratuit) :
 *     vérifie que « Envoyer Ma Demande D'Audit » tient sur UNE
 *     seule ligne (le modèle de vision le soupçonnait à deux —
 *     faux, mesuré).
 */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();

  /* ---------- 1. Hero : empilement VS visibilité sans défilement ---------- */
  for (const w of [390, 375, 360, 320]) {
    const page = await browser.newPage({
      viewport: { width: w, height: w === 390 ? 844 : w === 375 ? 667 : 740 },
    });
    await page.goto("http://localhost:3100/#/accueil", { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(4800);
    const m = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll("#hero a.btn-fill")).map((a) => {
        const r = a.getBoundingClientRect();
        return { libelle: (a.innerText || "").trim(), top: Math.round(r.top), largeur: Math.round(r.width) };
      });
      const hr = document.getElementById("hero").getBoundingClientRect();
      return {
        uneLigne: ctas.length === 2 && Math.abs(ctas[0].top - ctas[1].top) < 2,
        heroHauteur: Math.round(hr.height),
        viewportH: window.innerHeight,
        visibleSansDefilement: hr.height <= window.innerHeight + 1,
        ctas,
      };
    });
    console.log(
      `${w}px : uneLigne=${m.uneLigne} hero=${m.heroHauteur}/${m.viewportH} visibleSansDefilement=${m.visibleSansDefilement}`,
    );
    await page.close();
  }

  /* ---------- 2. Bouton d'envoi d'audit : une seule ligne ? ---------- */
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://localhost:3100/#/audit-gratuit", { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(2600);
  const m = await page.evaluate(() => {
    const btn = document.querySelector(
      'section[aria-label="Formulaire de demande d\'audit"] button[type="submit"]',
    );
    if (!btn) return null;
    const span = btn.querySelector("span");
    const range = document.createRange();
    range.selectNodeContents(span);
    const rangeH = Math.round(range.getBoundingClientRect().height);
    const style = getComputedStyle(btn);
    return {
      libelle: (btn.innerText || "").trim(),
      largeur: Math.round(btn.getBoundingClientRect().width),
      hauteurTexte: rangeH,
      lignes: Math.round(rangeH / parseFloat(style.fontSize)),
    };
  });
  console.log(`bouton audit : ${m.libelle} — ${m.largeur}px, ${m.lignes} ligne(s)`);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
