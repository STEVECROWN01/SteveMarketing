/**
 * AUDIT INTÉGRAL DU SITE — 18/11/2026 (demande de l'éditeur :
 * « reparcourir minutieusement le site web dans son entièreté,
 * page par page, section par section… si tout est bien fait à
 * 100%, correct »).
 *
 * Audit live des 14 routes publiques. Pour chaque route :
 *  1. SEO : <title>, meta description, og:title/og:description,
 *     twitter — dynamiques via le routeur à hash ;
 *  2. Structure : UN SEUL H1 par page, liste des H2, hiérarchie
 *     (pas de saut h1→h3), images sans alt ;
 *  3. Liens internes : chaque href="#/xxx" correspond à une route
 *     valide du routeur ; chaque href="#ancre" (scroll) a une cible
 *     dans la page ; liens externes en _blank avec rel noopener ;
 *  4. Boutons : tous les <a btn-fill> et <button> avec leur
 *     libellé et destination ;
 *  5. Texte visible complet (nettoyé) pour l'analyse croisée des
 *     doublons ;
 *  6. Console : zéro erreur attendue ;
 *  7. Débordement horizontal : zéro attendu.
 *
 * En sortie : audit-site-2026-11-18.json avec tout le collecté,
 * puis analyse croisée (doublons de phrases entre pages) en Node.
 *
 * LEÇONS appliquées : waitUntil "load" (pas networkidle — iframe
 * Calendly) ; les contenus d'accordéons fermés (Radix) ne sont pas
 * montés → pour la page Contact, on déplie CHAQUE item avant de
 * collecter le texte ; \u00A0 des RevealText normalisés.
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = "http://localhost:3100";
const ROUTES = [
  { hash: "#/accueil", nom: "accueil" },
  { hash: "#/methode", nom: "methode" },
  { hash: "#/referencement-seo", nom: "referencement" },
  { hash: "#/publicite-meta-ads", nom: "publicite" },
  { hash: "#/realisations", nom: "realisations" },
  { hash: "#/projet/mrsteveenglish", nom: "projet-mrsteveenglish" },
  { hash: "#/projet/prelaunch", nom: "projet-prelaunch" },
  { hash: "#/projet/afribayit", nom: "projet-afribayit" },
  { hash: "#/a-propos", nom: "a-propos" },
  { hash: "#/contact", nom: "contact" },
  { hash: "#/demander-un-devis", nom: "devis" },
  { hash: "#/audit-gratuit", nom: "audit" },
  { hash: "#/reserver-un-appel", nom: "appel" },
  { hash: "#/mentions-legales", nom: "legal" },
];
// Routes valides du routeur (PAGE_TO_HASH + projets)
const ROUTES_VALIDES = new RegExp(
  "^#/(accueil|methode|referencement-seo|publicite-meta-ads|realisations|projet/(mrsteveenglish|prelaunch|afribayit)|a-propos|contact|demander-un-devis|audit-gratuit|reserver-un-appel|mentions-legales|admin)(/.*)?$"
);

(async () => {
  const browser = await chromium.launch();
  const rapport = [];

  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

    await page.goto(`${BASE}/${route.hash}`, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    // Déplier tous les accordéons fermés (Radix monte le contenu
    // à l'ouverture) — FAQ, sections méthode, accordéons Contact.
    // LEÇON (1re exécution) : le SÉLECTEUR attrapait aussi le
    // bouton hamburger du header (aria-expanded) — l'ouvrir déployait
    // le menu plein écran qui interceptait les clics suivants :
    // les accordéons de la page restaient fermés et leur contenu
    // n'était pas collecté. On EXCLUT tout ce qui est dans <header>.
    const boutonsAccordeon = await page
      .locator(
        'button[aria-expanded="false"]:not(header button), button[data-state="closed"]:not(header button)'
      )
      .all();
    for (const b of boutonsAccordeon) {
      await b.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1200);

    const data = await page.evaluate(() => {
      const norm = (s) => (s || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
      const meta = (sel) => norm(document.querySelector(sel)?.getAttribute("content") || "");
      const titre = norm(document.title);
      const description = meta('meta[name="description"]');
      const h1 = [...document.querySelectorAll("h1")].map((h) => norm(h.textContent));
      const h2 = [...document.querySelectorAll("h2")].map((h) => norm(h.textContent));
      const h3 = [...document.querySelectorAll("h3")].map((h) => norm(h.textContent));
      // Hiérarchie : le premier niveau de titre après h1 doit être h2
      const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
        n: Number(h.tagName[1]),
        t: norm(h.textContent).slice(0, 90),
      }));
      // Images sans alt (hors aria-hidden décoratives)
      const sansAlt = [...document.querySelectorAll("img")].filter(
        (i) => !i.getAttribute("alt") && i.getAttribute("aria-hidden") !== "true"
      ).length;
      // Boutons et liens CTA
      const boutons = [...document.querySelectorAll("a.btn-fill, header button, form button")]
        .map((el) => ({
          libelle: norm(el.textContent).slice(0, 70),
          href: el.getAttribute("href") || "",
          externe: el.getAttribute("target") === "_blank",
        }))
        .filter((b) => b.libelle.length > 0);
      // Tous les liens internes (routeur à hash)
      const liensInternes = [...document.querySelectorAll('a[href^="#/"]')].map((a) =>
        a.getAttribute("href")
      );
      // Ancres de scroll (href="#id" — pas les routes #/)
      const ancres = [...document.querySelectorAll('a[href^="#"]:not([href^="#/"])')]
        .map((a) => a.getAttribute("href").slice(1))
        .filter((h) => h.length > 0);
      const ancresCibles = ancres.filter((id) => document.getElementById(id));
      // Texte visible total (hors script/style), par section
      const texte = norm(document.querySelector("main, body").innerText);
      // Sections avec id
      const sections = [...document.querySelectorAll("section[id], div[id]")]
        .map((s) => s.id)
        .filter((id) => id.length > 0);
      const overflow =
        document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return {
        titre,
        description,
        ogTitle: meta('meta[property="og:title"]'),
        ogDesc: meta('meta[property="og:description"]'),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
        h1,
        h2,
        h3,
        headings,
        sansAlt,
        boutons,
        liensInternes: [...new Set(liensInternes)],
        ancresBrisees: ancres.filter((id) => !document.getElementById(id)),
        nbSections: sections.length,
        texte,
        overflow,
      };
    });

    rapport.push({
      route: route.hash,
      nom: route.nom,
      erreursConsole: errors,
      ...data,
    });
    await page.close();
    console.log(`collecté ${route.hash} — h1=${data.h1.length} boutons=${data.boutons.length}`);
  }

  await browser.close();
  fs.writeFileSync(
    "/home/z/my-project/scripts/audit-site-2026-11-18.json",
    JSON.stringify(rapport, null, 2)
  );
  console.log("Rapport écrit : scripts/audit-site-2026-11-18.json");

  /* ============ ANALYSE CROISÉE ============ */
  const probs = [];
  const infos = [];

  // 1. Titres uniques
  const titres = rapport.map((r) => r.titre);
  const titresDup = titres.filter((t, i) => titres.indexOf(t) !== i);
  if (titresDup.length) probs.push(`TITRES DUPLIQUÉS : ${titresDup.join(" | ")}`);
  else infos.push(`14/14 titres <title> uniques`);

  // 2. Descriptions uniques et non vides
  const descs = rapport.map((r) => r.description);
  const vides = rapport.filter((r) => !r.description);
  const dupDescs = descs.filter((d, i) => d && descs.indexOf(d) !== i);
  if (vides.length) probs.push(`DESCRIPTIONS VIDES : ${vides.map((v) => v.route).join(", ")}`);
  if (dupDescs.length) probs.push(`DESCRIPTIONS DUPLIQUÉES : ${dupDescs.slice(0, 3).join(" | ")}`);
  if (!vides.length && !dupDescs.length)
    infos.push(`14/14 meta descriptions uniques et renseignées`);

  // 3. Exactement 1 H1 par page
  for (const r of rapport) {
    if (r.h1.length !== 1)
      probs.push(`${r.route} : ${r.h1.length} H1 (${r.h1.join(" / ").slice(0, 80)})`);
  }
  infos.push(`H1 : ${rapport.every((r) => r.h1.length === 1) ? "exactement 1 par page partout" : "voir problèmes"}`);

  // 4. Longueurs SEO title (30-65) / description (70-165)
  for (const r of rapport) {
    if (r.titre.length > 65) infos.push(`${r.route} : title long (${r.titre.length} car.)`);
    if (r.description.length < 70 || r.description.length > 170)
      infos.push(`${r.route} : description ${r.description.length} car. (cible 70-165)`);
  }

  // 5. Hiérarchie des titres (pas de saut > 1)
  for (const r of rapport) {
    let prev = 1;
    for (const h of r.headings) {
      if (h.n - prev > 1) {
        probs.push(`${r.route} : saut de hiérarchie h${prev}→h${h.n} (« ${h.t} »)`);
        break;
      }
      prev = h.n;
    }
  }

  // 6. Liens internes brisés
  for (const r of rapport) {
    const brises = r.liensInternes.filter((h) => !ROUTES_VALIDES.test(h));
    if (brises.length) probs.push(`${r.route} : liens internes invalides ${brises.join(", ")}`);
  }
  infos.push(`Liens internes : ${rapport.every((r) => r.liensInternes.every((h) => ROUTES_VALIDES.test(h))) ? "toutes destinations valides" : "voir problèmes"}`);

  // 7. Ancres brisées
  for (const r of rapport) {
    if (r.ancresBrisees.length)
      probs.push(`${r.route} : ancres sans cible #${r.ancresBrisees.join(", #")}`);
  }
  infos.push(`Ancres internes : ${rapport.every((r) => !r.ancresBrisees.length) ? "toutes les cibles existent" : "voir problèmes"}`);

  // 8. Images sans alt
  for (const r of rapport) {
    if (r.sansAlt > 0) probs.push(`${r.route} : ${r.sansAlt} image(s) sans alt`);
  }
  infos.push(`Alternatives d'images : ${rapport.every((r) => r.sansAlt === 0) ? "100% des images ont un alt" : "voir problèmes"}`);

  // 9. Console + overflow
  for (const r of rapport) {
    if (r.erreursConsole.length)
      probs.push(`${r.route} : ${r.erreursConsole.length} erreur(s) console — ${r.erreursConsole[0]}`);
    if (r.overflow > 0) probs.push(`${r.route} : débordement horizontal ${r.overflow}px`);
  }
  infos.push(`Console : ${rapport.every((r) => !r.erreursConsole.length) ? "zéro erreur sur les 14 routes" : "voir problèmes"}`);
  infos.push(`Débordement : ${rapport.every((r) => r.overflow <= 0) ? "zéro sur les 14 routes" : "voir problèmes"}`);

  // 10. DOUBLONS DE PHRASES entre pages (texte visible)
  //     phrases de 6+ mots répérées sur des pages différentes
  const phrases = new Map(); // phrase -> Set(pages)
  for (const r of rapport) {
    const propre = r.texte.replace(/\s+/g, " ");
    // découper en phrases
    const morceaux = propre.split(/(?<=[.!?])\s+|(?=\n)/);
    for (const m of morceaux) {
      const p = m.trim();
      const mots = p.split(" ");
      if (mots.length < 6 || p.length < 35) continue;
      if (!phrases.has(p)) phrases.set(p, new Set());
      phrases.get(p).add(r.nom);
    }
  }
  const doublons = [...phrases.entries()].filter(([, pages]) => pages.size > 1);
  // et doublons DANS une même page (répétition interne)
  const doublonsInternes = [...phrases.entries()].filter(
    ([, pages]) => pages.size === 1
  );
  // détecter répétitions intra-page : compter les occurrences dans le texte de la page
  const repInternes = [];
  for (const r of rapport) {
    const propre = r.texte.replace(/\s+/g, " ");
    for (const [p, pages] of doublonsInternes) {
      if (!pages.has(r.nom)) continue;
      const occurrences = propre.split(p).length - 1;
      if (occurrences > 1)
        repInternes.push(`${r.nom} : « ${p.slice(0, 60)}… » ×${occurrences}`);
    }
  }
  infos.push(`Phrases identiques sur plusieurs pages : ${doublons.length}`);
  for (const [p, pages] of doublons.slice(0, 25)) {
    infos.push(`   [${[...pages].join(" + ")}] « ${p.slice(0, 95)} »`);
  }
  if (repInternes.length) {
    infos.push(`Répétitions internes à une page : ${repInternes.length}`);
    repInternes.slice(0, 10).forEach((x) => infos.push("   " + x));
  }

  console.log("\n================ RÉSULTATS ================");
  console.log("\n--- PROBLÈMES ---");
  probs.forEach((p) => console.log("!! " + p));
  if (!probs.length) console.log("(aucun)");
  console.log("\n--- POINTS CONTRÔLÉS ---");
  infos.forEach((i) => console.log("· " + i));
})();
