/**
 * SONDE DE CONFORMITÉ GOOGLE (volet 8 de l'audit intégral, 19/11/2026).
 *
 * Ce que Google reçoit et indexe, vérifié sur le build standalone local :
 *
 * 1. CRAWL — robots.txt (200, sitemap annoncé, /api/ exclu), sitemap.xml
 *    (200, UNE seule entrée — la racine, honnêteté du routage par
 *    fragment), favicon.ico (200 — plus de 404 pour les outils qui le
 *    demandent par convention).
 * 2. DONNÉES STRUCTURÉES — le JSON-LD @graph (Person, ProfessionalService,
 *    WebSite) parse, chaque nœud porte ses champs, et les enrichissements
 *    du volet 8 sont présents : Person.image + knowsLanguage,
 *    ProfessionalService.image + telephone (dérivé du WhatsApp publié).
 * 3. BALISES META — robots googleBot avec max-image-preview:large (Discover),
 *    og:image déclarée 1254×1254 = dimensions RÉELLES du fichier servi,
 *    google-site-verification ABSENTE sans NEXT_PUBLIC_GSC_VERIFICATION
 *    (aucune balise vide), aucun script gtag sans NEXT_PUBLIC_GA_ID
 *    (aucune requête Google Analytics).
 * 4. WCAG 2.5.3 « Label in Name » — le défaut signalé par Lighthouse
 *    (label-content-name-mismatch, catégorie Accessibilité) : le libellé
 *    VISIBLE de chaque CTA doit être contenu dans son nom accessible.
 *    Corrigé au volet 8 sur les deux boutons « Réserver Un Appel » (hero
 *    + bande finale) ; la sonde balaie AUSSI tous les aria-label des
 *    éléments interactifs de l'accueil pour garantir qu'aucun autre ne
 *    diverge (les contrôles par nom accessible dicté ne marcheraient pas).
 * 5. LIVRAISON D'IMAGES — les candidats légers des MOCKUPS du hero
 *    existent (200) et un iPhone 13 (390 px, DPR 3) les CHOISIT
 *    effectivement (currentSrc) : navigateur 640w, téléphone 290w —
 *    au lieu de 1440w/80 Ko et 390w/52 Ko. Le portrait hero garde
 *    sa source unique (srcset → CLS 0,136 sous Slow 4G, A/B documenté).
 *
 *   node scripts/verify-google-2026-11-19.js
 * Sortie : scripts/verify-google-2026-11-19.json
 *
 * LEÇON OPS : serveur standalone et sonde dans la MÊME invocation shell,
 * sortie redirigée vers un fichier quand un serveur tourne.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:3100";
const OUT = path.join(__dirname, "verify-google-2026-11-19.json");

let failures = 0;
const check = (ok, label, detail) => {
  if (!ok) failures += 1;
  return { ok: !!ok, label, detail: detail ?? null };
};

(async () => {
  const browser = await chromium.launch();
  const rapport = { date: new Date().toISOString(), sections: {} };

  /* ---------- 1. CRAWL : robots.txt, sitemap.xml, favicon.ico ---------- */
  const crawl = [];
  {
    const robots = await (await fetch(`${BASE}/robots.txt`)).text();
    crawl.push(check(robots.includes("Sitemap:"), "robots.txt annonce le sitemap"));
    crawl.push(check(/Disallow:\s*\/api\//.test(robots), "robots.txt exclut /api/"));

    const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    crawl.push(check(locs.length === 1, "sitemap.xml : une seule entrée", locs));
    crawl.push(
      check(
        locs[0] && locs[0].replace(/\/$/, "").endsWith("stevensakpovi.vercel.app"),
        "sitemap.xml : l'entrée est la racine du domaine réel",
        locs[0],
      ),
    );

    const ico = await fetch(`${BASE}/favicon.ico`);
    const icoBytes = (await ico.arrayBuffer()).byteLength;
    crawl.push(check(ico.status === 200 && icoBytes > 0, "favicon.ico servi (200, non vide)", `${icoBytes} octets`));
  }
  rapport.sections.crawl = crawl;

  /* ---------- 2+3+5. Page d'accueil : DOM, JSON-LD, images ---------- */
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 140));
  });
  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(1500);

  const dom = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const qa = (s) => [...document.querySelectorAll(s)];
    const ld = qa('script[type="application/ld+json"]').map((s) => {
      try {
        return { parse: true, data: JSON.parse(s.textContent) };
      } catch (e) {
        return { parse: false, erreur: String(e) };
      }
    });
    /* Tous les éléments interactifs porteurs d'un aria-label : le
       LIBELLÉ VISIBLE doit être contenu dans le nom accessible
       (WCAG 2.5.3). Sémantique : le nom doit contenir au moins un
       nœud de texte visible de l'élément (le libellé actionnable) —
       comparer tout le textContent ferait de faux positifs sur les
       CARTES DE PROJET : leur <a> enveloppe la carte entière (numéro,
       catégorie, description) alors que le libellé actionnable est
       « Voir Le Projet », bien contenu dans le nom « Voir Le Projet
       — <projet> ». C'est aussi le comportement d'axe-core (moteur de
       l'audit accessibilité de Lighthouse), qui ne les signale pas. */
    const labelInName = qa("a[aria-label], button[aria-label]").map((el) => {
      const name = (el.getAttribute("aria-label") || "").toLowerCase();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const noeuds = [];
      let n;
      while ((n = walker.nextNode())) {
        const t = (n.textContent || "").replace(/\s+/g, " ").trim();
        if (t.length >= 3) noeuds.push(t);
      }
      const contenu = noeuds.length === 0 || noeuds.some((t) => name.includes(t.toLowerCase()));
      return {
        libelle: noeuds.find((t) => name.includes(t.toLowerCase())) || noeuds.join(" / "),
        name: el.getAttribute("aria-label") || "",
        conforme: contenu,
      };
    });
    const heroImg = q("div.hero-anim-img img[src*='portrait-long']");
    const browserMock = q("div.hero-anim-browser img");
    const phoneMock = q("div.hero-anim-phone img");
    return {
      title: document.title,
      metaRobots: q('meta[name="robots"]')?.content || null,
      googleBot: q('meta[name="googlebot"]')?.content || null,
      gsc: q('meta[name="google-site-verification"]')?.content ?? null,
      ogImage: q('meta[property="og:image"]')?.content || null,
      ogImageWidth: q('meta[property="og:image:width"]')?.content || null,
      ogImageHeight: q('meta[property="og:image:height"]')?.content || null,
      gtag: !!q('script[src*="googletagmanager.com"]'),
      jsonLd: ld,
      labelInName,
      heroSrcSet: heroImg?.getAttribute("srcset") || null,
      heroSizes: heroImg?.getAttribute("sizes") || null,
      heroCurrentSrc: heroImg?.currentSrc || null,
      browserMockSrcSet: browserMock?.getAttribute("srcset") || null,
      browserMockCurrentSrc: browserMock?.currentSrc || null,
      phoneMockSrcSet: phoneMock?.getAttribute("srcset") || null,
      phoneMockCurrentSrc: phoneMock?.currentSrc || null,
    };
  });

  const meta = [];
  // 2. JSON-LD
  meta.push(check(dom.jsonLd.length === 1 && dom.jsonLd[0].parse, "JSON-LD : un seul bloc, syntaxe valide"));
  const graph = dom.jsonLd[0]?.data?.["@graph"] || [];
  const person = graph.find((n) => n["@type"] === "Person");
  const service = graph.find((n) => n["@type"] === "ProfessionalService");
  const website = graph.find((n) => n["@type"] === "WebSite");
  meta.push(check(!!person && !!service && !!website, "JSON-LD : Person + ProfessionalService + WebSite", graph.map((n) => n["@type"])));
  meta.push(check(!!person?.image && /stevens-akpovi-portrait\.webp$/.test(person.image), "Person.image = portrait réel (URL absolue)", person?.image));
  meta.push(check(person?.knowsLanguage === "fr", "Person.knowsLanguage = fr"));
  meta.push(check(!!service?.image && /OG\.jpg$/.test(service.image), "ProfessionalService.image = vignette de partage", service?.image));
  meta.push(
    check(!!service?.telephone && /^\+229\d+$/.test(service.telephone), "ProfessionalService.telephone dérivé du WhatsApp publié", service?.telephone),
  );

  // 3. Balises meta
  meta.push(
    check(
      (dom.googleBot || dom.metaRobots || "").includes("max-image-preview:large"),
      "robots googleBot : max-image-preview large (Discover)",
      dom.googleBot || dom.metaRobots,
    ),
  );
  // og:image déclarée = dimensions réelles du fichier
  if (dom.ogImage) {
    const real = await page.evaluate(async (url) => {
      const im = new Image();
      im.src = url;
      await new Promise((res, rej) => {
        im.onload = res;
        im.onerror = rej;
      });
      return { w: im.naturalWidth, h: im.naturalHeight };
    }, dom.ogImage);
    meta.push(
      check(
        String(real.w) === dom.ogImageWidth && String(real.h) === dom.ogImageHeight,
        "og:image : dimensions déclarées = dimensions réelles du fichier",
        `déclaré ${dom.ogImageWidth}×${dom.ogImageHeight}, réel ${real.w}×${real.h}`,
      ),
    );
  } else {
    meta.push(check(false, "og:image présente"));
  }
  meta.push(check(dom.gsc === null, "google-site-verification absente sans variable (aucune balise vide)", dom.gsc));
  meta.push(check(!dom.gtag, "aucun script gtag sans NEXT_PUBLIC_GA_ID (zéro requête Google Analytics)", dom.gtag));

  // 4. Label in name — balayage complet des interactifs à aria-label
  const divergents = dom.labelInName.filter((l) => !l.conforme);
  meta.push(
    check(
      divergents.length === 0,
      "WCAG 2.5.3 : chaque libellé visible est contenu dans le nom accessible (tous les aria-label de l'accueil)",
      divergents.length ? divergents : `${dom.labelInName.length} éléments contrôlés, 0 divergence`,
    ),
  );
  const heroCta = dom.labelInName.find((l) => l.libelle === "Réserver Un Appel");
  meta.push(
    check(!!heroCta && heroCta.conforme, "CTA hero « Réserver Un Appel » : nom accessible réparé", heroCta?.name),
  );

  // 5. Livraison d'images — candidats légers des mockups du hero
  // (le portrait hero reste à source unique 1672w : un srcset y
  // provoquait un CLS 0,136 sous Slow 4G — décision A/B documentée
  // dans Hero.tsx ; l'économie est captée sur les mockups.)
  const images = [];
  images.push(
    check((dom.browserMockSrcSet || "").startsWith("/assets/projects/mrsteveenglish-desktop-640.webp 640w"), "mockup navigateur : candidat 640w en tête de srcset", dom.browserMockSrcSet),
  );
  images.push(
    check((dom.phoneMockSrcSet || "").startsWith("/assets/projects/afribayit-mobile-290.webp 290w"), "mockup téléphone : candidat 290w en tête de srcset", dom.phoneMockSrcSet),
  );
  for (const asset of [
    "/assets/projects/mrsteveenglish-desktop-640.webp",
    "/assets/projects/afribayit-mobile-290.webp",
  ]) {
    const r = await fetch(`${BASE}${asset}`);
    images.push(check(r.status === 200, `fichier servi : ${asset}`, `${r.status}`));
  }
  meta.push(check(consoleErrors.length === 0, "zéro erreur console (accueil)", consoleErrors));
  rapport.sections.meta = meta;
  rapport.sections.images = images;

  /* ---------- 5 bis. Choix réel du navigateur mobile (iPhone 13, DPR 3) ---------- */
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const mpage = await mobileCtx.newPage();
  await mpage.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
  await mpage.waitForTimeout(1500);
  const mcurrent = await mpage.evaluate(() => {
    const q = (s) => document.querySelector(s);
    return {
      browser: q("div.hero-anim-browser img")?.currentSrc || null,
      phone: q("div.hero-anim-phone img")?.currentSrc || null,
    };
  });
  const choix = [];
  choix.push(
    check(
      (mcurrent.browser || "").includes("mrsteveenglish-desktop-640.webp"),
      "iPhone 13 : mockup navigateur → candidat 640w (au lieu de 1440w/80 Ko)",
      mcurrent.browser,
    ),
  );
  choix.push(
    check(
      (mcurrent.phone || "").includes("afribayit-mobile-290.webp"),
      "iPhone 13 : mockup téléphone → candidat 290w (au lieu de 390w/52 Ko)",
      mcurrent.phone,
    ),
  );
  rapport.sections.choixMobile = choix;

  await browser.close();

  rapport.resultat = failures === 0 ? "TOUT OK" : `${failures} ÉCHEC(S)`;
  rapport.total = [...crawl, ...meta, ...images, ...choix].length;
  fs.writeFileSync(OUT, JSON.stringify(rapport, null, 2));

  for (const [sec, arr] of Object.entries(rapport.sections)) {
    console.log(`\n=== ${sec.toUpperCase()} ===`);
    for (const c of arr) console.log(`  [${c.ok ? "OK" : "ÉCHEC"}] ${c.label}${c.detail ? ` — ${typeof c.detail === "string" ? c.detail : JSON.stringify(c.detail)}` : ""}`);
  }
  console.log(`\nRESULTAT : ${rapport.resultat} (${rapport.total} contrôles)`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error("ERREUR SONDE:", e);
  process.exit(2);
});
