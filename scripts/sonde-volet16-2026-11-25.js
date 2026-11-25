/**
 * SONDE VOLET 16 (25/11/2026) — BACK-OFFICE : CONNEXION RÉHABILLÉE,
 * PROPOSITION COMMERCIALE SUR LE TEMPLATE DE L'ÉDITEUR, DEMANDES →
 * DEVIS PRÉ-REmpli, APERÇU PLEINE HAUTEUR.
 *
 * C1x — connexion : LOGO (plus de cadenas), centré horizontalement,
 *        message centré, titre « Backoffice », œil noir conservé ;
 * C2x — barre supérieure : logo agrandi (hauteur des boutons) +
 *        « BACK-OFFICE » plus grand, aligné au BAS du logo ;
 * C3x — demandes : statuts « Signée / Non retenue », filtres
 *        spécifiques d'abord et « Devis + Audits + Messages » en
 *        DERNIER, bouton « Créer un devis » → formulaire PRÉ-REMPLI
 *        + carte « Demande à l'origine » ;
 * C4x — factures sans devis : message + bouton « Créer un devis »
 *        → espace de création de devis ;
 * C5x — formulaire devis : champ « Conditions de règlement »
 *        SUPPRIMÉ (toujours « À réception ») ;
 * C6x — aperçu : calé sticky, page A4 remplissant l'espace dédié,
 *        respiration identique au-dessus et au-dessous ;
 * C7x — proposition commerciale : formulaire structuré (sections
 *        01→08 + signature), aperçu PAGINÉ sur le template
 *        (Poppins, PROPOSITION COMMERCIALE, VOTRE PROJET…, pieds
 *        numérotés), 6 pages ;
 * C8x — liste : propositions v2 (colonne Projet, montant sans
 *        décimales), modification → générateur pré-rempli.
 *
 * MOCKS RÉSEAU : /api/documents*, /api/admin/leads* interceptés —
 * aucun test n'écrit dans le stockage réel. La connexion passe par
 * la VRAIE API (ADMIN_PASSWORD du serveur local).
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.SONDE_BASE || "http://127.0.0.1:3100";
const ADMIN_MDP = process.env.SONDE_MDP || "test-volet16-2026";
const OUT = "/tmp/render/volet16";

/* ---------- Faux documents ---------- */
function propV2(numero, numeroClient, createdAt) {
  return {
    id: `proposition-${numero.toLowerCase()}`,
    numero, docType: "proposition", numeroClient,
    date: "2026-11-20",
    titre: "Conception et développement de votre site web professionnel",
    projet: "Site web professionnel, éditorial et évolutif",
    prestataire: "Stevens AKPOVI",
    montant: 2000, devise: "EUR", delai: "02 à 03 semaines",
    sections: {
      presentation: ["Paragraphe de présentation (sonde)."],
      objectifsIntro: "Votre site aura pour objectifs de :",
      objectifs: ["Renforcer votre visibilité.", "Centraliser vos contenus."],
      perimetre: [
        { id: "p1", titre: "Conception sur mesure", intro: "Intro A.", lead: "La prestation comprend :", points: ["Point un.", "Point deux."], post: "" },
      ],
      investissementTexte: "Ce montant couvre l'ensemble des prestations.",
      investissementNotes: ["Note fine."],
      calendrierIntro: "Calendrier confirmé après validation.",
      calendrierEtapesIntro: "Les principales étapes seront :",
      calendrierEtapes: ["Cadrage.", "Mise en ligne."],
      calendrierNote: "Note calendrier.",
      paiementsIntro: "Le règlement sera effectué en deux étapes :",
      paiements: [
        { id: "e1", pourcentage: 50, libelle: "Avant le démarrage", description: "Desc un." },
        { id: "e2", pourcentage: 50, libelle: "Avant la mise en ligne", description: "Desc deux." },
      ],
      validation: ["Validation."],
      conclusion: ["Conclusion."],
    },
    signature: { nom: "Stevens AKPOVI", titre: "Conception et développement web", site: "stevensakpovi.vercel.app" },
    createdAt, updatedAt: createdAt,
  };
}

const fauxDocumentsAvecDevis = [
  propV2("PC2600001", 1, "2026-11-20T09:00:00.000Z"),
  {
    id: "devis-d2600001", numero: "D2600001", docType: "devis", numeroClient: 2, date: "2026-11-01",
    client: { nom: "Client Un", entreprise: "Entreprise Un", ville: "Cotonou", pays: "Bénin", telephone: "", email: "un@exemple.com" },
    objet: "Création d'un site web professionnel", intro: "Intro devis un.",
    items: [{ id: "l1", type: "Service", designation: "Site Web", points: ["Conception"], quantite: 1, prixUnitaire: 500 }],
    devise: "EUR", conditionsReglement: "À réception", modePaiement: "Virement bancaire",
    validiteJours: 15, notes: "Merci.", banque: { titulaire: "T", iban: "X", bic: "Y", banque: "Moneco" },
    createdAt: "2026-11-01T10:00:00.000Z", updatedAt: "2026-11-01T10:00:00.000Z",
  },
];

const fauxLeads = [
  {
    id: "lead-1", type: "quote", status: "new", name: "Awa Sossou", email: "awa@exemple.com",
    phone: "+229 97 00 00 00", company: "Atelier Sossou", website: null, activity: "Consulting",
    serviceType: "Site vitrine", budget: "1000-2000 €", timeline: "1 mois",
    message: "Bonjour, je souhaite un site vitrine pour mon atelier.",
    emailSent: true, source: "devis", createdAt: "2026-11-24T08:00:00.000Z",
  },
  {
    id: "lead-2", type: "audit", status: "contacted", name: "Marc Tunde", email: "marc@exemple.com",
    phone: null, company: null, website: "https://exemple.com", activity: null, serviceType: null,
    budget: null, timeline: null, message: "Demande d'audit.", emailSent: false, source: "audit",
    createdAt: "2026-11-23T08:00:00.000Z",
  },
  {
    id: "lead-3", type: "contact", status: "won", name: "Léa Vodé", email: "lea@exemple.com",
    phone: null, company: null, website: null, activity: null, serviceType: null, budget: null,
    timeline: null, message: "Message de contact.", emailSent: false, source: "contact",
    createdAt: "2026-11-22T08:00:00.000Z",
  },
];

/* ---------- Outils ---------- */
const checks = [];
const push = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
async function attendre(fn, timeout = 10000, pas = 250) {
  const fin = Date.now() + timeout;
  while (Date.now() < fin) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, pas));
  }
  return await fn();
}
async function texteVisible(page) {
  return page.evaluate(() => document.body.innerText || "");
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  /* État des mocks (pilotable : « avec devis » puis « sans devis »). */
  let etatDocs = { documents: fauxDocumentsAvecDevis };
  /* Le mock leads renvoie 401 AVANT la connexion (sinon l'app se croit
     déjà authentifiée sans passer par la page de connexion). */
  let authentifie = false;

  await page.route(/\/api\/documents(\/|$|\?)/, async (route) => {
    const req = route.request();
    const chemin = new URL(req.url()).pathname;
    if (chemin === "/api/documents" && req.method() === "GET") {
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ ok: true, documents: etatDocs.documents, stockageConfigure: true, emailConfigure: true }),
      });
    }
    if (chemin === "/api/documents" && req.method() === "POST") {
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    }
    if (chemin === "/api/documents/pdf" && req.method() === "POST") {
      return route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="Sonde.pdf"', "X-Email-Sent": "1", "X-Stockage-Ok": "1" },
        body: "%PDF-1.4\n% Sonde volet 16 — faux PDF\n",
      });
    }
    if (/^\/api\/documents\/.+/.test(chemin) && req.method() === "DELETE") {
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    }
    return route.continue();
  });

  await page.route(/\/api\/admin\/leads(\/|$|\?)/, async (route) => {
    const req = route.request();
    const chemin = new URL(req.url()).pathname;
    if (chemin === "/api/admin/leads" && req.method() === "GET") {
      if (!authentifie) {
        return route.fulfill({ status: 401, contentType: "application/json", body: '{"ok":false,"error":"Non autorisé."}' });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leads: fauxLeads }) });
    }
    if (/^\/api\/admin\/leads\/.+/.test(chemin) && (req.method() === "PATCH" || req.method() === "PUT")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    }
    return route.continue();
  });

  await page.goto(`${BASE}/#/admin`, { waitUntil: "load", timeout: 30000 });
  await attendre(() => page.locator("#admin-password").count().then((n) => n > 0), 30000);
  await page.waitForTimeout(1000);

  /* ================= C1 — PAGE DE CONNEXION ================= */
  const logoConnexion = page.locator("div.max-w-md img[alt='Stevens Akpovi']");
  const nbLogoCarte = await logoConnexion.count();
  push("C1a logo du site remplace le cadenas (dans la carte)", nbLogoCarte === 1, `${nbLogoCarte} logo dans la carte de connexion`);
  const nbLock = await page.locator("svg[class*='lock'], svg.lucide-lock").count();
  push("C1b plus d'icône cadenas", nbLock === 0, `${nbLock} cadenas`);

  const carteConnexion = page.locator("#admin-password").locator("xpath=ancestor::div[starts-with(@class,'w-full max-w-md')]").first();
  const alignTexte = await carteConnexion.evaluate((el) => getComputedStyle(el).textAlign);
  push("C1c carte de connexion centrée (texte)", alignTexte === "center", `text-align: ${alignTexte}`);

  if (nbLogoCarte) {
    const boiteLogo = await logoConnexion.first().boundingBox();
    const boiteCarte = await carteConnexion.boundingBox();
    const centreLogo = boiteLogo.x + boiteLogo.width / 2;
    const centreCarte = boiteCarte.x + boiteCarte.width / 2;
    push("C1d logo centré horizontalement",
      Math.abs(centreLogo - centreCarte) < 6,
      `écart de centre : ${Math.abs(centreLogo - centreCarte).toFixed(1)}px`);
  }

  const texteConnexion = await texteVisible(page);
  push("C1e titre « Backoffice »", /backoffice/i.test(texteConnexion), "« Backoffice »");
  push("C1f ancien titre « Espace administrateur » absent", !texteConnexion.includes("Espace administrateur"));
  push("C1g message de bienvenue conservé", texteConnexion.includes("Bienvenue, Stevens."));

  const boutonOeil = page.locator('button[aria-label="Afficher le mot de passe"]');
  const styleOeil = await boutonOeil.evaluate((el) => ({ color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor }));
  push("C1h œil noir conservé (volet 15)",
    styleOeil.color === "rgb(0, 0, 0)" && styleOeil.bg === "rgb(228, 228, 228)",
    `couleur ${styleOeil.color}`);

  await page.screenshot({ path: `${OUT}/01-connexion.png` });

  /* ---------- Connexion réelle (API authentique) — le drapeau du
     mock leads est levé à la réception de la réponse 200. ---------- */
  const promesseLogin = page.waitForResponse((r) => r.url().includes("/api/admin/login"), { timeout: 20000 }).catch(() => null);
  await page.locator("#admin-password").fill(ADMIN_MDP);
  await page.locator("button[type=submit]").click();
  const repLogin = await promesseLogin;
  if (repLogin && repLogin.ok()) authentifie = true;
  await attendre(() => page.locator("nav[aria-label*='back-office']").count().then((n) => n > 0), 20000);
  await page.waitForTimeout(1500);

  /* ================= C2 — BARRE SUPÉRIEURE ================= */
  const logoHeader = page.locator("div.border-b .container-site img[alt='Stevens Akpovi']").first();
  const boiteLogo = await logoHeader.boundingBox();
  push("C2a logo agrandi (hauteur = celle des boutons)",
    Boolean(boiteLogo && Math.abs(boiteLogo.height - 44) < 3),
    `hauteur logo : ${boiteLogo && Math.round(boiteLogo.height)}px (boutons : 44px)`);

  const h1BO = page.locator("div.border-b h1").first();
  const infoBO = await h1BO.evaluate((el) => ({
    fs: getComputedStyle(el).fontSize, transform: getComputedStyle(el).textTransform,
    texte: el.textContent.trim(),
  }));
  push("C2b « BACK-OFFICE » plus grand",
    infoBO.fs === "13px" && infoBO.transform === "uppercase",
    `taille ${infoBO.fs} (ancien : 11.5px)`);

  /* Alignement bas : le bas du texte ≈ bas du logo. */
  const boiteH1 = await h1BO.boundingBox();
  const basLogo = boiteLogo.y + boiteLogo.height;
  const basTexte = boiteH1.y + boiteH1.height;
  push("C2c texte aligné au BAS du logo",
    Math.abs(basTexte - basLogo) < 8,
    `bas logo ${Math.round(basLogo)} · bas texte ${Math.round(basTexte)}`);

  await page.screenshot({ path: `${OUT}/02-header.png` });

  /* ================= C3 — DEMANDES ================= */
  await page.locator("nav[aria-label*='back-office'] button", { hasText: "Demandes" }).first().click();
  await attendre(() => page.locator("text=Demandes reçues").count().then((n) => n > 0), 10000);
  await page.waitForTimeout(800);

  const selectStatut = page.locator("select").first();
  const optionsStatut = await selectStatut.locator("option").allTextContents();
  push("C3a statuts « Signée / Non retenue » (plus de Gagnée/Perdue)",
    optionsStatut.includes("Signée") && optionsStatut.includes("Non retenue") && !optionsStatut.includes("Gagnée") && !optionsStatut.includes("Perdue"),
    `options : ${optionsStatut.join(", ")}`);

  const boutonsType = await page.locator("button", { hasText: /Devis \+ Audits \+ Messages|^Devis$|^Audits$|^Messages$/ }).allTextContents();
  const filtres = boutonsType.map((t) => t.replace(/\(\d+\)/, "").trim());
  const idxCombines = filtres.indexOf("Devis + Audits + Messages");
  const idxDevis = filtres.indexOf("Devis");
  push("C3b « Devis + Audits + Messages » en DERNIÈRE position",
    idxCombines > -1 && idxCombines > filtres.indexOf("Messages") && idxDevis < idxCombines,
    `ordre : ${filtres.join(" | ")}`);

  const boutonCreer = page.locator("button[aria-label*='Créer un devis pour la demande de Awa Sossou']");
  push("C3c bouton « Créer un devis » sur la demande de devis",
    (await boutonCreer.count()) > 0);

  /* Les demandes audit/message n'ont PAS le bouton. */
  const nbBoutonsCreer = await page.locator("button[title='Créer un devis (formulaire pré-rempli)']").count();
  push("C3d bouton uniquement sur les demandes de devis", nbBoutonsCreer === 1, `${nbBoutonsCreer} bouton(s)`);

  await boutonCreer.click();
  await attendre(() => page.locator("text=Nouveau devis").count().then((n) => n > 0), 10000);
  await page.waitForTimeout(800);
  const texteDevis = await texteVisible(page);
  push("C3e clic → espace de création de devis ouvert", texteDevis.includes("Nouveau devis"));
  push("C3f carte « Demande à l'origine » affichée",
    texteDevis.includes("Demande à l'origine de ce devis") && texteDevis.includes("Awa Sossou"));
  const valNom = await page.locator("input").first().inputValue();
  push("C3g fiche client pré-remplie (nom du demandeur)",
    valNom === "Awa Sossou", `nom : « ${valNom} »`);
  const champsEmail = await page.locator("input[type=email]").first().inputValue();
  push("C3h email pré-rempli", champsEmail === "awa@exemple.com", `email : « ${champsEmail} »`);

  /* ================= C5 — FORMULAIRE DEVIS ================= */
  const texteForm = texteDevis;
  push("C5a champ « Conditions de règlement » SUPPRIMÉ",
    !texteForm.includes("Conditions de règlement"),
    "plus de select conditions");
  push("C5b note « règlement toujours à réception »",
    texteForm.toLowerCase().includes("réception"));

  /* ================= C6 — APERÇU PLEINE HAUTEUR ================= */
  const zoneApercu = page.locator(".xl\\:sticky").first();
  const boiteZone = await zoneApercu.boundingBox();
  push("C6a aperçu calé (sticky) présent", Boolean(boiteZone), `zone ${boiteZone && Math.round(boiteZone.height)}px de haut`);
  const boiteSticky = boiteZone;
  push("C6b hauteur de l'espace dédié ≈ plein écran",
    Boolean(boiteSticky && boiteSticky.height > 750 && boiteSticky.height < 900),
    `${boiteSticky && Math.round(boiteSticky.height)}px (fenêtre 900px)`);

  const zonePages = page.locator(".relative.overflow-hidden.bg-\\[\\#141414\\]").first();
  if ((await zonePages.count()) > 0) {
    const boiteZonePages = await zonePages.boundingBox();
    const feuille = page.locator("iframe").first();
    const boiteFeuille = await feuille.boundingBox();
    if (boiteZonePages && boiteFeuille) {
      const margeHaut = boiteFeuille.y - boiteZonePages.y;
      const margeBas = boiteZonePages.y + boiteZonePages.height - (boiteFeuille.y + boiteFeuille.height);
      push("C6c respiration identique au-dessus et au-dessous de l'aperçu",
        Math.abs(margeHaut - margeBas) < 14,
        `haut ${Math.round(margeHaut)}px · bas ${Math.round(margeBas)}px`);
      const remplissage = (boiteFeuille.height / boiteZonePages.height) * 100;
      push("C6d l'aperçu remplit l'espace dédié (≥ 80 %)",
        remplissage > 80, `${remplissage.toFixed(0)} % de la hauteur`);
    }
  }
  await page.screenshot({ path: `${OUT}/03-devis-apercu.png` });

  /* Redimensionnement : l'échelle s'adapte. */
  await page.setViewportSize({ width: 1100, height: 700 });
  await page.waitForTimeout(600);
  const boiteFeuille2 = await page.locator("iframe").first().boundingBox();
  push("C6e échelle adaptative au redimensionnement",
    Boolean(boiteFeuille2 && boiteFeuille2.height < 500 && boiteFeuille2.height > 200),
    `hauteur page : ${boiteFeuille2 && Math.round(boiteFeuille2.height)}px (fenêtre 700px — disposition empilée sous 1280px)`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(600);

  /* ================= C7 — PROPOSITION COMMERCIALE ================= */
  await page.locator("nav[aria-label*='back-office'] button", { hasText: "Propositions commerciales" }).first().click();
  await attendre(() => page.locator("text=Créer une nouvelle proposition").count().then((n) => n > 0), 10000);
  await page.locator("button", { hasText: "Créer une nouvelle proposition" }).first().click();
  await attendre(() => page.locator("text=Nouvelle proposition commerciale").count().then((n) => n > 0), 10000);
  await page.waitForTimeout(1000);

  const texteProp = await texteVisible(page);
  const blocsForm = [
    "En-tête du document", "Présentation du projet", "Objectifs",
    "Périmètre de la prestation", "Investissement", "Calendrier de réalisation",
    "Modalités de paiement", "Validation et démarrage", "Conclusion", "Signature",
  ];
  for (const b of blocsForm) {
    push(`C7a formulaire : bloc « ${b} »`, texteProp.includes(b));
  }
  const champsEntete = ["Titre de la proposition", "Votre projet", "Prestataire", "Montant total", "Délai estimé"];
  for (const c of champsEntete) {
    push(`C7b champ « ${c} »`, texteProp.includes(c));
  }
  push("C7c valeurs par défaut de l'exemple (titre)",
    (await page.locator("input").first().inputValue()).includes("Conception et développement"));
  push("C7d blocs du périmètre (A-G) présents",
    /bloc\s*a\b/i.test(texteProp) && /bloc\s*g\b/i.test(texteProp));
  const valeursInputs = await page.locator("input").evaluateAll((els) => els.map((e) => e.value));
  push("C7e échéances par défaut (2 × 50 %)",
    valeursInputs.includes("Avant le démarrage du projet") &&
    valeursInputs.includes("Avant la mise en ligne définitive"),
    `libellés présents : ${valeursInputs.filter((v) => v.startsWith("Avant")).length}`);

  /* L'aperçu paginé : iframe de la proposition + compteur de pages. */
  await page.waitForTimeout(2500); /* polices + pagination dans l'iframe */
  const compteur = await page.locator(".font-mono", { hasText: /\/\s*\d+/ }).first().textContent().catch(() => null);
  push("C7f aperçu paginé (compteur de pages)",
    Boolean(compteur && /\d+\s*\/\s*\d+/.test(compteur)), `compteur : ${compteur && compteur.trim()}`);

  /* Contenu de l'iframe (frame srcDoc de la proposition). */
  const cadre = page.frames().find((f) => f !== page.mainFrame());
  let apercuProp = null;
  if (cadre) {
    apercuProp = await cadre.evaluate(() => ({
      pages: window.__pagesPc || 0,
      surtitre: document.querySelector(".e1-surtitre")?.textContent || "",
      titre: document.querySelector(".e1-titre")?.textContent || "",
      infos: Array.from(document.querySelectorAll(".paire .lbl")).map((e) => e.textContent),
      sections: Array.from(document.querySelectorAll(".s-titre")).map((e) => e.textContent),
      pied: document.querySelector(".p-gauche")?.textContent || "",
      numPied: document.querySelector(".p-num")?.textContent || "",
      police: getComputedStyle(document.body).fontFamily,
      nbPaiements: document.querySelectorAll(".paie-bloc").length,
    })).catch(() => null);
  }
  if (apercuProp) {
    push("C7g template : 6 pages (pagination automatique)",
      apercuProp.pages === 6, `${apercuProp.pages} page(s)`);
    push("C7h sur-titre « Proposition commerciale »",
      apercuProp.surtitre.trim().toUpperCase() === "PROPOSITION COMMERCIALE");
    push("C7i police Poppins (template)",
      /poppins/i.test(apercuProp.police), apercuProp.police.split(",")[0]);
    push("C7j bloc d'informations complet",
      JSON.stringify(apercuProp.infos) === JSON.stringify(["Votre projet", "Prestataire", "Montant total", "Délai estimé"]),
      apercuProp.infos.join(" | "));
    const sectionsAttendues = [
      "Présentation de votre projet", "Objectifs de votre site", "Périmètre de la prestation",
      "Investissement", "Calendrier de réalisation", "Modalités de paiement",
      "Validation et démarrage", "Conclusion",
    ];
    push("C7k les huit sections numérotées",
      JSON.stringify(apercuProp.sections) === JSON.stringify(sectionsAttendues),
      apercuProp.sections.map((s) => s.slice(0, 14)).join(" | "));
    push("C7l pied « prestataire · Proposition commerciale · site »",
      apercuProp.pied.includes("Stevens AKPOVI") && apercuProp.pied.includes("Proposition commerciale") && apercuProp.pied.includes("stevensakpovi.vercel.app"),
      apercuProp.pied.replace(/\s+/g, " ").trim().slice(0, 60));
    push("C7m numérotation « 01 / 06 »",
      apercuProp.numPied.replace(/\s+/g, " ").trim() === "01 / 06", apercuProp.numPied.trim());
    push("C7n deux blocs de paiement côte à côte",
      apercuProp.nbPaiements === 2, `${apercuProp.nbPaiements} bloc(s)`);
  } else {
    push("C7g-l aperçu de la proposition lisible", false, "frame introuvable");
  }
  await page.screenshot({ path: `${OUT}/04-proposition.png` });

  /* Navigation page à page dans l'aperçu. */
  const boutonsPage = page.locator("button[aria-label='Page suivante']");
  if ((await boutonsPage.count()) > 0 && cadre) {
    await boutonsPage.first().click();
    await page.waitForTimeout(600);
    const visible = await cadre.evaluate(() => {
      const pages = Array.from(document.querySelectorAll(".ppage"));
      const visibles = pages.filter((p) => p.style.display !== "none");
      return { total: pages.length, visibles: visibles.length, page: visibles[0]?.getAttribute("data-page") };
    }).catch(() => null);
    push("C7o navigation ‹ › : page 2 affichée seule",
      Boolean(visible && visible.visibles === 1 && visible.page === "2"),
      visible ? `page ${visible.page} sur ${visible.total}` : "—");
  }

  /* ================= C8 — LISTE + ÉDITION PROPOSITION ================= */
  await page.locator("button", { hasText: "Retour aux propositions" }).first().click();
  await attendre(() => page.locator("text=Propositions commerciales").count().then((n) => n > 0), 10000);
  await page.waitForTimeout(800);
  const texteListe = (await texteVisible(page)).replace(/[\u202f\u00a0]/g, " ");
  push("C8a colonne « Projet » (proposition v2)", texteListe.includes("Site web professionnel, éditorial et évolutif"));
  push("C8b montant sans décimales « 2 000 € »", texteListe.includes("2 000 €"));

  const boutonModifier = page.locator("button[aria-label='Modifier PC2600001']");
  if ((await boutonModifier.count()) > 0) {
    await boutonModifier.click();
    await attendre(() => page.locator("text=Modifier la proposition PC2600001").count().then((n) => n > 0), 10000);
    await page.waitForTimeout(600);
    const titreEdite = await page.locator("input").first().inputValue();
    push("C8c modification : générateur pré-rempli",
      titreEdite.includes("Conception et développement"), `titre : « ${titreEdite.slice(0, 30)}… »`);
  } else {
    push("C8c modification : générateur pré-rempli", false, "bouton modifier introuvable");
  }

  /* ================= C4 — FACTURES SANS DEVIS ================= */
  etatDocs = { documents: [propV2("PC2600001", 1, "2026-11-20T09:00:00.000Z")] }; /* aucun devis */
  /* Rafraîchir l'état : le bouton « Actualiser » recharge les documents. */
  await page.locator("button[title='Tout actualiser']").click();
  await page.waitForTimeout(1200);
  await page.locator("nav[aria-label*='back-office'] button", { hasText: "Factures" }).first().click();
  await page.locator("button", { hasText: "Créer une nouvelle facture" }).first().click();
  await attendre(() => page.locator("text=Sélectionnez le devis à facturer").count().then((n) => n > 0), 10000);
  await page.waitForTimeout(800);
  const texteSelection = await texteVisible(page);
  push("C4a message « aucun devis créé pour le moment »",
    texteSelection.includes("Aucun devis n'est créé pour le moment"),
    "message explicite");
  const boutonCreerDevis = page.locator("button", { hasText: "Créer un devis" }).first();
  push("C4b bouton « Créer un devis » proposé", (await boutonCreerDevis.count()) > 0);
  await boutonCreerDevis.click();
  await attendre(() => page.locator("text=Nouveau devis").count().then((n) => n > 0), 10000);
  await page.waitForTimeout(600);
  push("C4c clic → espace de création de devis",
    (await texteVisible(page)).includes("Nouveau devis"));
  await page.screenshot({ path: `${OUT}/05-facture-sans-devis.png` });

  await browser.close();

  /* ---------- Bilan ---------- */
  const ok = checks.filter((c) => c.ok).length;
  const total = checks.length;
  console.log(`\n===== BILAN : ${ok}/${total} verts =====`);
  fs.writeFileSync(`${OUT}/bilan.json`, JSON.stringify({ ok, total, checks, date: new Date().toISOString(), base: BASE }, null, 2));
  process.exit(ok === total ? 0 : 1);
})().catch((e) => {
  console.error("ERREUR SONDE :", e);
  process.exit(2);
});
