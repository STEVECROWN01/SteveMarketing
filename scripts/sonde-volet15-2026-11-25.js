/**
 * SONDE VOLET 15 (25/11/2026) — BACK-OFFICE RESTRUCTURÉ.
 *
 * Contrôles des demandes de l'éditeur :
 *   PAGE DE CONNEXION
 *     C1x — icône œil NOIRE sur pastille claire, DANS le champ, et
 *           visible au SURVOL (l'ancien gris clair + hover blanc
 *           posait un problème de visibilité signalé par l'éditeur) ;
 *   BARRE SUPÉRIEURE
 *     C2x — logo du site + « BACK-OFFICE » à droite du logo, plus
 *           d'ancien titre « Stevens Akpovi — Espace administrateur » ;
 *   NAVIGATION
 *     C3x — Propositions commerciales AVANT Devis, « Factures »
 *           remplace « Factures & documents » (supprimée) ;
 *   TABLEAU DE BORD
 *     C4x — message d'intro court et pro, description « copie email »
 *           sans adresse en clair, aucune mention de K.Quotes ;
 *   RUBRIQUES DOCUMENTS (volet 15)
 *     C5x — chaque rubrique liste TOUS ses documents dans l'ORDRE DE
 *           CRÉATION, bouton « Créer… » en haut à droite, icônes
 *           d'action par ligne (modifier, générer la facture, supprimer) ;
 *     C6x — « Créer une nouvelle facture » → SÉLECTION du devis →
 *           espace de génération de facture pour le devis choisi ;
 *     C7x — FORMULAIRE : plus de champ Objet ni Total ligne ni Banque,
 *           « Délai estimé » par défaut « 02 à 03 semaines », validité
 *           15 jours, devise EUR, modes de paiement sans Cash/PayPal/
 *           M-Pesa/Celtiis ;
 *     C8x — ÉDITION d'un document existant : générateur pré-rempli,
 *           numéro conservé.
 *
 * MOCKS RÉSEAU : la sonde INTERCEPTE /api/documents* (liste, PDF,
 * suppression) pour présenter de faux documents — la vue, les icônes
 * et les flux sont testés SANS toucher au stockage réel. La connexion
 * et le mauvais mot de passe passent par la VRAIE API (ADMIN_PASSWORD
 * du serveur local).
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.SONDE_BASE || "http://127.0.0.1:3100";
const ADMIN_MDP = process.env.SONDE_MDP || "test-volet14-2026";
const OUT = "/tmp/render/volet15";

/* ---------- Faux documents (ordre de création volontairement
 * mélangé dans le tableau pour vérifier le tri) ---------- */
const fauxDocuments = [
  {
    id: "devis-d2600002", numero: "D2600002", docType: "devis", numeroClient: 2,
    date: "2026-11-10",
    client: { nom: "Client Deux", entreprise: "Entreprise Deux SARL", ville: "Cotonou", pays: "Bénin" },
    objet: "Création d'un site web professionnel", intro: "Intro devis deux.",
    items: [{ id: "l2", type: "Service", designation: "Site Web", points: ["Conception"], quantite: 1, prixUnitaire: 600, mentionLivraison: "02 à 03 semaines" }],
    devise: "EUR", conditionsReglement: "À réception", modePaiement: "Virement bancaire",
    validiteJours: 15, notes: "Merci.", banque: { titulaire: "T", iban: "X", bic: "Y", banque: "Moneco" },
    createdAt: "2026-11-10T09:00:00.000Z", updatedAt: "2026-11-10T09:00:00.000Z",
  },
  {
    id: "proposition-pc2600002", numero: "PC2600002", docType: "proposition", numeroClient: 4,
    date: "2026-11-15",
    client: { nom: "Client Quatre", entreprise: "Atelier Quatre", ville: "Parakou", pays: "Bénin" },
    objet: "Proposition", intro: "Intro proposition deux.",
    items: [{ id: "l4", type: "Service", designation: "Refonte", points: ["Audit"], quantite: 1, prixUnitaire: 900 }],
    devise: "EUR", conditionsReglement: "À réception", modePaiement: "Virement bancaire",
    validiteJours: 15, notes: "Merci.", banque: { titulaire: "T", iban: "X", bic: "Y", banque: "Moneco" },
    phases: [{ titre: "Cadrage", delai: "Jours 1 à 2" }],
    createdAt: "2026-11-15T09:00:00.000Z", updatedAt: "2026-11-15T09:00:00.000Z",
  },
  {
    id: "devis-d2600001", numero: "D2600001", docType: "devis", numeroClient: 1,
    date: "2026-11-01",
    client: { nom: "Client Un", entreprise: "Entreprise Un", ville: "Cotonou", pays: "Bénin" },
    objet: "Création d'un site web professionnel", intro: "Intro devis un.",
    items: [{ id: "l1", type: "Service", designation: "Site Web", points: ["Conception complète"], quantite: 1, prixUnitaire: 500, mentionLivraison: "02 à 03 semaines" }],
    devise: "EUR", conditionsReglement: "À réception", modePaiement: "Virement bancaire",
    validiteJours: 15, notes: "Merci.", banque: { titulaire: "T", iban: "X", bic: "Y", banque: "Moneco" },
    createdAt: "2026-11-01T10:00:00.000Z", updatedAt: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "proposition-pc2600001", numero: "PC2600001", docType: "proposition", numeroClient: 3,
    date: "2026-11-05",
    client: { nom: "Client Trois", entreprise: "Studio Trois", ville: "Porto-Novo", pays: "Bénin" },
    objet: "Proposition", intro: "Intro proposition un.",
    items: [{ id: "l3", type: "Service", designation: "Landing page", points: ["Design"], quantite: 1, prixUnitaire: 400 }],
    devise: "EUR", conditionsReglement: "À réception", modePaiement: "Virement bancaire",
    validiteJours: 15, notes: "Merci.", banque: { titulaire: "T", iban: "X", bic: "Y", banque: "Moneco" },
    createdAt: "2026-11-05T08:00:00.000Z", updatedAt: "2026-11-05T08:00:00.000Z",
  },
  {
    id: "facture-f2600001", numero: "F2600001", docType: "facture", numeroClient: 1,
    devisSource: "D2600001", statutPaiement: "Payé", datePaiement: "2026-11-12", date: "2026-11-12",
    client: { nom: "Client Un", entreprise: "Entreprise Un", ville: "Cotonou", pays: "Bénin" },
    objet: "Création d'un site web professionnel", intro: "Intro facture.",
    items: [{ id: "l1f", type: "Service", designation: "Site Web", points: ["Conception complète"], quantite: 1, prixUnitaire: 500 }],
    devise: "EUR", conditionsReglement: "À réception", modePaiement: "Virement bancaire",
    validiteJours: 15, notes: "Merci.", banque: { titulaire: "T", iban: "X", bic: "Y", banque: "Moneco" },
    createdAt: "2026-11-12T08:00:00.000Z", updatedAt: "2026-11-12T08:00:00.000Z",
  },
];

/* ---------- Outils ---------- */
const checks = [];
const push = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
/** Sondage locateur en boucle (waitForSelector est capricieux ici). */
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
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  /* ---------- MOCKS /api/documents* (aucune écriture réelle) ---------- */
  await page.route(/\/api\/documents(\/|$|\?)/, async (route) => {
    const req = route.request();
    const chemin = new URL(req.url()).pathname;
    if (chemin === "/api/documents" && req.method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, documents: fauxDocuments, stockageConfigure: true, emailConfigure: true }),
      });
    }
    if (chemin === "/api/documents/pdf" && req.method() === "POST") {
      return route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="Devis_D2600001_Client.pdf"',
          "X-Email-Sent": "1",
          "X-Stockage-Ok": "1",
        },
        body: "%PDF-1.4\n% Sonde volet 15 — faux PDF\n",
      });
    }
    if (/^\/api\/documents\/.+/.test(chemin) && req.method() === "DELETE") {
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    }
    return route.continue();
  });

  await page.goto(`${BASE}/#/admin`, { waitUntil: "load", timeout: 30000 });
  await attendre(() => page.locator("#admin-password").count().then((n) => n > 0), 30000);
  await page.waitForTimeout(1200);

  /* ================= PAGE DE CONNEXION ================= */
  push("C1a page de connexion présentée",
    (await page.locator("text=Espace administrateur").count()) > 0,
    "titre + « Bienvenue, Stevens. » : " + ((await texteVisible(page)).includes("Bienvenue, Stevens.")));

  const champ = page.locator("#admin-password");
  const boutonOeil = page.locator('button[aria-label="Afficher le mot de passe"]');
  const boites = await Promise.all([champ.boundingBox(), boutonOeil.boundingBox()]);
  const [champBox, oeilBox] = boites;
  push("C1b œil à l'intérieur du champ (aligné à droite)",
    Boolean(champBox && oeilBox &&
      oeilBox.x >= champBox.x && oeilBox.y >= champBox.y &&
      oeilBox.x + oeilBox.width <= champBox.x + champBox.width + 1 &&
      oeilBox.y + oeilBox.height <= champBox.y + champBox.height + 1),
    `champ ${champBox && Math.round(champBox.x)},${champBox && Math.round(champBox.y)} · œil ${oeilBox && Math.round(oeilBox.x)},${oeilBox && Math.round(oeilBox.y)}`);

  const styleOeil = await boutonOeil.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  push("C1c icône œil NOIRE sur pastille claire",
    styleOeil.color === "rgb(0, 0, 0)" && styleOeil.bg === "rgb(228, 228, 228)",
    `couleur ${styleOeil.color} · fond ${styleOeil.bg}`);

  await boutonOeil.hover();
  await page.waitForTimeout(400); /* transition-colors (150 ms) terminée */
  const styleHover = await boutonOeil.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  push("C1d survol : icône toujours noire (visible)",
    styleHover.color === "rgb(0, 0, 0)" && styleHover.bg === "rgb(255, 255, 255)",
    `hover couleur ${styleHover.color} · fond ${styleHover.bg}`);

  const typeAvant = await champ.getAttribute("type");
  await boutonOeil.click();
  const typeApres = await champ.getAttribute("type");
  push("C1e œil : mot de passe masqué → révélé",
    typeAvant === "password" && typeApres === "text",
    `type ${typeAvant} → ${typeApres}`);
  await page.locator('button[aria-label="Masquer le mot de passe"]').click();

  await champ.fill("mauvais-mot-de-passe");
  await page.locator("button[type=submit]").click();
  await page.waitForTimeout(1500);
  const erreur = await page.locator("[role=alert]").first().textContent().catch(() => null);
  push("C1f mauvais mot de passe → « Mot de passe incorrect. »",
    (erreur || "").includes("Mot de passe incorrect"), `message: ${erreur}`);

  await page.screenshot({ path: `${OUT}/01-connexion.png` });

  /* ---------- Connexion réelle ---------- */
  await champ.fill(ADMIN_MDP);
  await page.locator("button[type=submit]").click();
  await attendre(() => page.locator("nav[aria-label*='back-office']").count().then((n) => n > 0), 20000);
  await page.waitForTimeout(1500);

  /* ================= BARRE SUPÉRIEURE + NAVIGATION ================= */
  const logo = page.locator("header img, div img").filter({ has: page.locator("[alt='Stevens Akpovi']") });
  const logoCount = await page.locator("img[alt='Stevens Akpovi']").count();
  const srcLogo = logoCount ? await page.locator("img[alt='Stevens Akpovi']").first().getAttribute("src") : null;
  const titreBO = page.locator("h1", { hasText: /back-office/i });
  const styleBO = (await titreBO.count())
    ? await titreBO.first().evaluate((el) => ({ texte: el.textContent, transform: getComputedStyle(el).textTransform }))
    : null;
  const textePage = await texteVisible(page);
  push("C2a logo du site dans la barre supérieure",
    logoCount > 0 && /logo-blanc/.test(srcLogo || ""),
    `src: ${srcLogo}`);
  push("C2b « BACK-OFFICE » à droite du logo (majuscules)",
    Boolean(styleBO && /back-office/i.test(styleBO.texte || "") && styleBO.transform === "uppercase"),
    `h1 « ${styleBO && styleBO.texte} » transform ${styleBO && styleBO.transform}`);
  push("C2c ancien titre « Stevens Akpovi — Espace administrateur » absent",
    !textePage.includes("Espace administrateur") || (await page.locator("#admin-password").count()) > 0,
    "titre remplacé par le logo");

  const onglets = await page.locator("nav[aria-label*='back-office'] button").allTextContents();
  /* Le badge compteur colle au libellé (« Demandes0 ») : on retire les
   * chiffres de fin avant comparaison. */
  const ongletsPropres = onglets.map((t) => t.replace(/\d+$/, "").trim());
  const attendus = ["Tableau de bord", "Demandes", "Propositions commerciales", "Devis", "Factures"];
  push("C3a 5 rubriques, Propositions AVANT Devis, ordre exact",
    ongletsPropres.length === 5 && attendus.every((o, i) => ongletsPropres[i] === o),
    `onglets: ${JSON.stringify(ongletsPropres)}`);
  push("C3b « Factures & Documents » supprimée",
    !ongletsPropres.some((t) => t.includes("Factures & Documents")),
    "rubrique remplacée par « Factures »");
  push("C3c aucune mention de K.Quotes dans le back-office",
    !textePage.includes("K.Quotes") && !textePage.includes("K.Quotes".toLowerCase()),
    "texte vérifié");

  await page.screenshot({ path: `${OUT}/02-tableau-de-bord.png` });

  /* ================= TABLEAU DE BORD ================= */
  push("C4a message d'intro court et professionnel",
    textePage.includes("Espace privé de pilotage") && !textePage.includes("Espace indépendant, non listé"),
    "« Espace privé de pilotage : demandes clients, documents commerciaux et suivi des projets — à l'écart de la navigation publique. »");
  push("C4b copie email sans adresse en clair",
    textePage.includes("votre boîte mail privée") && !textePage.includes("stevensakpovi@gmail.com"),
    "« Chaque document généré est envoyé en pièce jointe à votre boîte mail privée. »");

  const labelsCartes = await page.locator("[data-carte], .grid button").allTextContents();
  const texteCartes = labelsCartes.join("|");
  const idxProp = texteCartes.indexOf("Propositions commerciales");
  const idxDevis = texteCartes.indexOf("Devis");
  push("C4c cartes : Propositions avant Devis",
    idxProp > -1 && idxDevis > -1 && idxProp < idxDevis,
    `positions ${idxProp} < ${idxDevis}`);

  push("C4d raccourcis présents (proposition, devis, facture)",
    (await page.locator("text=Nouvelle proposition").count()) > 0 &&
    (await page.locator("text=Nouveau devis").count()) > 0 &&
    (await page.locator("text=Nouvelle facture").count()) > 0,
    "trois raccourcis de création");

  /* ---------- Raccourci « Nouveau devis » → création directe ---------- */
  await page.locator("button", { hasText: "Nouveau devis" }).last().click();
  await page.waitForTimeout(1500);
  let texte = await texteVisible(page);
  push("C4e raccourci « Nouveau devis » → espace de création direct",
    texte.includes("Nouveau devis") && (await page.locator("text=Nom complet").count()) > 0,
    "titre + générateur affichés");
  await page.locator("button", { hasText: "Retour aux devis" }).click();
  await page.waitForTimeout(1200);

  /* ================= DEVIS : LISTE ================= */
  texte = await texteVisible(page);
  push("C5a rubrique Devis : liste + compteur",
    texte.includes("Devis") && /\(2\)/.test(texte),
    "2 devis mockés visibles");
  push("C5b bouton « Créer un nouveau devis » en haut à droite",
    (await page.locator("button", { hasText: "Créer un nouveau devis" }).count()) > 0,
    "bouton de création");

  const lignesDevis = page.locator("table tbody tr td", { hasText: /^D26000/ });
  const numerosDevis = await page.locator("table tbody tr td:first-child").allTextContents();
  push("C5c devis dans l'ordre de création (D1 puis D2)",
    numerosDevis.filter((n) => n.startsWith("D26")).join(",") === "D2600001,D2600002",
    `numéros: ${JSON.stringify(numerosDevis.filter((n) => n.startsWith("D26")))}`);
  void lignesDevis;

  push("C5d icônes d'action sur chaque devis (modifier, facture, supprimer)",
    (await page.locator('button[aria-label^="Modifier D26"]').count()) === 2 &&
    (await page.locator('button[aria-label^="Générer la facture du devis D26"]').count()) === 2 &&
    (await page.locator('button[aria-label^="Supprimer D26"]').count()) === 2,
    "6 icônes d'action + aperçu/téléchargement : " +
    ((await page.locator('button[aria-label^="Aperçu de D26"]').count()) === 2 &&
     (await page.locator('button[aria-label^="Télécharger D26"]').count()) === 2));

  await page.screenshot({ path: `${OUT}/03-devis-liste.png` });

  /* ---------- Icône facture sur la ligne D2600002 → modal ---------- */
  await page.locator('button[aria-label="Générer la facture du devis D2600002"]').click();
  await page.waitForTimeout(900);
  texte = await texteVisible(page);
  push("C6a icône facture → espace « Facturer le devis D2600002 »",
    texte.includes("Facturer le devis D2600002") && texte.includes("F2600002"),
    "espace de génération de facture");
  await page.screenshot({ path: `${OUT}/04-modal-facture.png` });
  await page.locator('button[aria-label="Annuler"]').first().click();
  await page.waitForTimeout(800);

  /* ================= DEVIS : CRÉATION + FORMULAIRE ================= */
  await page.locator("button", { hasText: "Créer un nouveau devis" }).click();
  await page.waitForTimeout(1500);
  texte = await texteVisible(page);
  push("C7a « Nouveau devis » : description simple et professionnelle",
    texte.includes("Renseignez le client et sa prestation") && !texte.includes("Template"),
    "phrase descriptive non technique");

  push("C7b champ « Objet » supprimé",
    (await page.locator("label", { hasText: "Objet" }).count()) === 0,
    "absent du formulaire");
  push("C7c champ « Total ligne » supprimé",
    (await page.locator("text=Total ligne").count()) === 0,
    "absent du formulaire");
  push("C7d champ « Banque » supprimé",
    (await page.locator("label", { hasText: "Banque" }).count()) === 0,
    "seuls titulaire/IBAN/BIC restent");

  const champDelai = page.locator("input[placeholder='02 à 03 semaines']");
  push("C7e « Délai estimé » avec défaut « 02 à 03 semaines »",
    (await page.locator("text=Délai estimé").count()) > 0 && (await champDelai.count()) > 0 &&
    (await champDelai.first().inputValue()) === "02 à 03 semaines",
    `valeur: ${champDelai.count() ? await champDelai.first().inputValue() : "—"}`);

  const champValidite = page.locator("input[type=number]").filter({ has: page.locator("xpath=..") });
  const validites = await page.locator("input[type=number]").all();
  let valeurValidite = null;
  for (const inp of validites) {
    const v = await inp.inputValue();
    if (v === "15") { valeurValidite = v; break; }
  }
  push("C7f validité par défaut : 15 jours",
    valeurValidite === "15", `valeur trouvée: ${valeurValidite}`);

  const selectDevise = page.locator("select").filter({ has: page.locator("option[value=EUR]") }).first();
  const deviseValue = (await selectDevise.count()) ? await selectDevise.inputValue() : null;
  push("C7g devise par défaut : euro",
    deviseValue === "EUR", `select devise = ${deviseValue}`);

  const optionsPaiement = await page.locator("select option").allTextContents();
  const modes = optionsPaiement.filter((o) =>
    ["Virement bancaire", "MTN Mobile Money", "Moov Money", "Orange Money", "Wave",
     "Celtiis Cash", "M-Pesa", "PayPal", "Cash"].includes(o.trim()));
  push("C7h modes de paiement épurés (sans Cash/PayPal/M-Pesa/Celtiis)",
    modes.some((m) => m.trim() === "Virement bancaire") &&
    !modes.some((m) => ["Cash", "PayPal", "M-Pesa", "Celtiis Cash"].includes(m.trim())),
    `modes: ${JSON.stringify(modes.map((m) => m.trim()))}`);

  await page.locator("button", { hasText: "Ajouter une prestation" }).click();
  await page.waitForTimeout(700);
  const champsDelaiApres = await page.locator("input[placeholder='02 à 03 semaines']").all();
  push("C7i nouvelle prestation : « Délai estimé » pré-rempli",
    champsDelaiApres.length >= 2 &&
    (await champsDelaiApres[champsDelaiApres.length - 1].inputValue()) === "02 à 03 semaines",
    `${champsDelaiApres.length} champs délai remplis`);

  await page.screenshot({ path: `${OUT}/05-nouveau-devis.png` });
  await page.locator("button", { hasText: "Retour aux devis" }).click();
  await page.waitForTimeout(1200);

  /* ================= DEVIS : ÉDITION ================= */
  await page.locator('button[aria-label="Modifier D2600001"]').click();
  await page.waitForTimeout(1500);
  texte = await texteVisible(page);
  const nomEdite = await page.locator("input").first().inputValue().catch(() => "");
  push("C8a icône modifier → « Modifier le devis D2600001 » pré-rempli",
    texte.includes("Modifier le devis D2600001"),
    `titre d'édition + premier champ: « ${nomEdite} »`);
  const apercuNumero = await page.locator("text=Numéro :").count();
  push("C8b numéro conservé en édition",
    apercuNumero > 0 && texte.includes("D2600001"),
    "note « Numéro : D2600001 »");
  await page.screenshot({ path: `${OUT}/06-modifier-devis.png` });
  await page.locator("button", { hasText: "Retour aux devis" }).click();
  await page.waitForTimeout(1000);

  /* ================= PROPOSITIONS ================= */
  await page.locator("nav[aria-label*='back-office'] button", { hasText: "Propositions commerciales" }).click();
  await page.waitForTimeout(1500);
  texte = await texteVisible(page);
  const numerosProps = await page.locator("table tbody tr td:first-child").allTextContents();
  push("C9a Propositions : toutes les propositions dans l'ordre de création",
    numerosProps.filter((n) => n.startsWith("PC26")).join(",") === "PC2600001,PC2600002",
    `numéros: ${JSON.stringify(numerosProps.filter((n) => n.startsWith("PC26")))}`);
  push("C9b bouton « Créer une nouvelle proposition »",
    (await page.locator("button", { hasText: "Créer une nouvelle proposition" }).count()) > 0,
    "bouton de création");

  await page.locator("button", { hasText: "Créer une nouvelle proposition" }).click();
  await page.waitForTimeout(1500);
  texte = await texteVisible(page);
  push("C9c espace « Nouvelle proposition commerciale »",
    texte.includes("Nouvelle proposition commerciale") && (await page.locator("text=Déroulé du projet").count()) > 0,
    "titre + déroulé du projet");
  await page.locator("button", { hasText: "Retour aux propositions" }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/07-propositions-liste.png` });

  /* ================= FACTURES : LISTE ================= */
  await page.locator("nav[aria-label*='back-office'] button", { hasText: "Factures" }).first().click();
  await page.waitForTimeout(1500);
  texte = await texteVisible(page);
  const numerosFact = await page.locator("table tbody tr td:first-child").allTextContents();
  push("C10a Factures : toutes les factures présentées",
    numerosFact.some((n) => n.trim() === "F2600001") && texte.includes("Payé"),
    `numéros: ${JSON.stringify(numerosFact)} · statut Payé visible`);
  push("C10b bouton « Créer une nouvelle facture »",
    (await page.locator("button", { hasText: "Créer une nouvelle facture" }).count()) > 0,
    "bouton de création");

  /* ---------- « Créer une nouvelle facture » → sélection du devis ---------- */
  await page.locator("button", { hasText: "Créer une nouvelle facture" }).click();
  await page.waitForTimeout(1500);
  texte = await texteVisible(page);
  push("C11a sélection du devis à facturer présentée",
    texte.includes("Créer une nouvelle facture") && texte.includes("Sélectionnez le devis"),
    "espace de sélection");
  const radios = await page.locator("input[name='devis-a-facturer']").count();
  push("C11b tous les devis listés (sélectionnables)",
    radios === 2, `${radios} radios devis`);
  const boutonContinuer = page.locator("button", { hasText: "Continuer" });
  push("C11c « Continuer » désactivé sans sélection",
    await boutonContinuer.isDisabled(), "attente d'une sélection");
  await page.screenshot({ path: `${OUT}/08-selection-devis.png` });

  await page.locator("input[name='devis-a-facturer']").first().check();
  await boutonContinuer.click();
  await page.waitForTimeout(1200);
  texte = await texteVisible(page);
  push("C11d sélection soumise → espace de génération pour ce devis",
    texte.includes("Facturer le devis D2600001") && texte.includes("F2600001"),
    "espace de facturation du devis choisi");
  await page.screenshot({ path: `${OUT}/09-facture-depuis-selection.png` });
  await page.locator('button[aria-label="Annuler"]').first().click();
  await page.waitForTimeout(800);

  /* ---------- Retour à la liste des factures ---------- */
  await page.locator("button", { hasText: "Retour aux factures" }).first().click();
  await page.waitForTimeout(1200);
  texte = await texteVisible(page);

  /* ---------- Édition d'une facture existante ---------- */
  await page.locator('button[aria-label="Modifier F2600001"]').click();
  await page.waitForTimeout(900);
  texte = await texteVisible(page);
  push("C12a modifier une facture → « Modifier la facture F2600001 »",
    texte.includes("Modifier la facture F2600001"),
    "espace de facturation pré-rempli");
  await page.locator('button[aria-label="Annuler"]').first().click();
  await page.waitForTimeout(600);
  texte = await texteVisible(page);
  push("C12b retour à la liste des factures",
    (await page.locator('button[aria-label="Modifier F2600001"]').count()) > 0,
    "liste des factures toujours affichée");

  await page.screenshot({ path: `${OUT}/10-factures-liste.png`, fullPage: false });

  /* ================= BILAN ================= */
  await ctx.close();
  await browser.close();

  const echecs = checks.filter((c) => !c.ok);
  const rapport = {
    date: new Date().toISOString(),
    base: BASE,
    total: checks.length,
    ok: checks.length - echecs.length,
    echecs,
  };
  fs.writeFileSync(`${OUT}/rapport-volet15.json`, JSON.stringify(rapport, null, 2));
  console.log(`\n=== BILAN VOLET 15 : ${rapport.ok}/${checks.length} verts ===`);
  if (echecs.length) {
    console.log("Échecs :");
    echecs.forEach((c) => console.log(`  ❌ ${c.name} — ${c.detail}`));
    process.exit(1);
  }
})().catch((e) => {
  console.error("SONDE VOLET 15 — ERREUR :", e);
  process.exit(2);
});
