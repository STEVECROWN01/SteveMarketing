/**
 * INVENTAIRE DES BOUTONS — 17/11/2026
 * Demande de l'éditeur : « Fais moi la liste de tous les boutons du
 * site en mentionant leur emplacement et leur destination. »
 *
 * Enumère, sur CHAQUE page du site, tous les éléments interactifs
 * de type bouton :
 *  1. les <button> (envoi de formulaire, accordéons, hamburger,
 *     croix de fermeture, boutons texte inline…) ;
 *  2. les <a> stylés boutons (classe btn-fill — CTA du site,
 *     « Voir Le Projet » des cartes, lien-pilule) ;
 *  3. les pastilles rondes de contact (email / LinkedIn / WhatsApp,
 *     repérées par leur aria-label) ;
 *  4. le menu plein écran du header (ouvert via la pastille
 *     hamburger sur la page d'accueil).
 *
 * Destination : pour les <a>, le href réel est relevé ; pour les
 * <button> (sans href), la destination est documentée dans le
 * fichier d'inventaire (elle vit dans les gestionnaires onClick).
 *
 * Sortie : JSON groupé par page sur la sortie standard.
 */

const { chromium } = require("playwright");

const BASE = "http://localhost:3100";

const ROUTES = [
  { name: "Accueil", hash: "#/accueil", wait: 5200 },
  { name: "Méthode", hash: "#/methode", wait: 2200 },
  { name: "Référencement SEO", hash: "#/referencement-seo", wait: 2200 },
  { name: "Publicité Meta Ads", hash: "#/publicite-meta-ads", wait: 2200 },
  { name: "Réalisations", hash: "#/realisations", wait: 2600 },
  { name: "Projet — MR Steve English", hash: "#/projet/mrsteveenglish", wait: 2200 },
  { name: "Projet — Pré-launch", hash: "#/projet/prelaunch", wait: 2200 },
  { name: "Projet — Afribayit", hash: "#/projet/afribayit", wait: 2200 },
  { name: "À propos", hash: "#/a-propos", wait: 2200 },
  { name: "Contact", hash: "#/contact", wait: 2600 },
  { name: "Demande de devis", hash: "#/demander-un-devis", wait: 2600 },
  { name: "Réserver un appel", hash: "#/reserver-un-appel", wait: 2600 },
  { name: "Mentions légales", hash: "#/mentions-legales", wait: 1800 },
];

/** Normalise un libellé : espaces insécables → espace, espaces
 *  multiples → un seul — RevealText joint les mots par \u00A0
 *  (leçon documentée dans verify-methode-entete-2026-11-17.js). */
const txt = (s) =>
  (s || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const inventory = {};

  for (const route of ROUTES) {
    await page.goto(`${BASE}/${route.hash}`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(route.wait);

    const data = await page.evaluate(() => {
      const out = { buttons: [], ctaLinks: [], pills: [] };

      const label = (el) => {
        const own = (el.innerText || "").trim();
        if (own) return own.replace(/\s+/g, " ");
        return el.getAttribute("aria-label") || "(sans libellé)";
      };

      // 1. Tous les <button> visibles
      document.querySelectorAll("button").forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        out.buttons.push({
          libelle: label(b),
          aria: b.getAttribute("aria-label") || null,
          type: b.getAttribute("type") || null,
        });
      });

      // 2. Les <a> stylés boutons (btn-fill) ou enveloppant un .btn-fill
      document.querySelectorAll("a").forEach((a) => {
        const r = a.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        const isBtn =
          (a.className && String(a.className).includes("btn-fill")) ||
          a.querySelector(":scope .btn-fill") !== null;
        if (isBtn) {
          out.ctaLinks.push({
            libelle: label(a),
            href: a.getAttribute("href"),
            externe: a.target === "_blank" || null,
          });
        }
      });

      // 3. Pastilles rondes de contact (email / LinkedIn / WhatsApp)
      document.querySelectorAll("a[aria-label]").forEach((a) => {
        const r = a.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        const aria = a.getAttribute("aria-label") || "";
        if (/LinkedIn|WhatsApp|email/i.test(aria)) {
          out.pills.push({ aria, href: a.getAttribute("href") });
        }
      });

      return out;
    });

    // Déduplication (boutons identiques dans le DOM pour états hover)
    const dedup = (arr, key) => {
      const seen = new Set();
      return arr.filter((x) => {
        const k = key(x);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };
    data.buttons = dedup(data.buttons, (b) => b.libelle + "|" + b.type);
    data.ctaLinks = dedup(data.ctaLinks, (c) => c.libelle + "|" + c.href);

    inventory[route.name] = data;
  }

  // Menu plein écran (ouvert depuis l'accueil)
  await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.click('button[aria-label="Ouvrir le menu"]');
  await page.waitForTimeout(900);
  inventory["Menu plein écran (header)"] = await page.evaluate(() => {
    const menu = document.getElementById("menu-plein-ecran");
    const links = [];
    if (menu) {
      menu.querySelectorAll("a").forEach((a) => {
        links.push({
          libelle: (a.innerText || "").trim(),
          href: a.getAttribute("href"),
          aria: a.getAttribute("aria-label") || null,
        });
      });
      menu.querySelectorAll("button").forEach((b) => {
        links.push({
          libelle: (b.getAttribute("aria-label") || b.innerText || "").trim(),
          href: null,
          bouton: true,
        });
      });
    }
    return { liens: links };
  });

  console.log(JSON.stringify(inventory, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
