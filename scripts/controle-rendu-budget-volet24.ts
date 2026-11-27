/** VOLET 24 — vérification du RENDU : les saisies bornées ne dépassent
 *  jamais la page 1 (présentation) et le modèle garde son moule. */
import { renderPropositionHtml } from "../src/lib/documents/proposition-html";
import { propositionV2ParDefaut } from "../src/lib/documents/proposition";
import { bornerPresentation } from "../src/lib/documents/budgets-proposition";
import { readFileSync } from "fs";
import { chromium } from "playwright";

const LIMITE_PX = Math.round((720 * 4) / 3);
const logo = readFileSync("public/assets/logo-noir.png");
const logoData = `data:image/png;base64,${logo.toString("base64")}`;
const t = (n: number, graine = "conception sur mesure de votre site web professionnel pour presenter clairement votre expertise ") => {
  let s = "";
  while (s.length < n) s += graine;
  return s.slice(0, n).trimEnd();
};

async function mesurer(presentation: string[], titre: string) {
  const base = propositionV2ParDefaut();
  const rec = {
    ...base,
    titre,
    sections: { ...base.sections, presentation },
    destinataire: { nomComplet: "Aïcha Dossou", entreprise: "Cabinet Essentiel & Stratégie" },
    docType: "proposition" as const,
    id: "",
    numero: "PC2600001",
    numeroClient: 1,
    date: "2026-11-27",
    createdAt: "",
    updatedAt: "",
  };
  const nav = await chromium.launch();
  const page = await nav.newPage({ viewport: { width: 1000, height: 1400 } });
  await page.setContent(renderPropositionHtml(rec, logoData), { waitUntil: "load" });
  await page.waitForFunction("window.__pagesPc > 0", null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const res = await page.evaluate(`((limitePx) => {
    const estTete = (b, num) => b.classList.contains("s-head") &&
      ((b.querySelector(".s-num")?.textContent || "").trim() === num);
    const blocs = Array.from(document.querySelectorAll("[data-bloc]"));
    const sections = {};
    for (const b of blocs) {
      if (b.classList.contains("s-head")) {
        const n = ((b.querySelector(".s-num")?.textContent || "")).trim();
        if (n && !sections[n]) sections[n] = Number((b.closest(".ppage")?.getAttribute("data-page")) || -1);
      }
    }
    const i01 = blocs.findIndex((x) => estTete(x, "01"));
    const i02 = blocs.findIndex((x) => estTete(x, "02"));
    const paras = blocs.slice(i01 + 1, i02);
    const dernier = paras[paras.length - 1];
    const ppage = dernier.closest(".ppage");
    return {
      pages: window.__pagesPc,
      sections,
      pageDernier: Number(ppage.getAttribute("data-page")),
      bas: Math.round(dernier.getBoundingClientRect().bottom - ppage.getBoundingClientRect().top),
    };
  })(${LIMITE_PX})`);
  await nav.close();
  return res;
}

(async () => {
  const m = propositionV2ParDefaut();
  const mouleRef = "01:1,02:2,03:2,04:4,05:5,06:5,07:6,08:6";
  const cas: [string, string[], string][] = [
    ["modèle + destinataire", m.sections.presentation, m.titre],
    ["pire cas borné (6×300 → borné)", bornerPresentation([t(300), t(300), t(300), t(300), t(300), t(300)]), t(65, "creation de votre site web professionnel sur mesure ")],
    ["4×176 → borné", bornerPresentation([t(176), t(176), t(176), t(176)]), m.titre],
    ["3×215+105 (748)", [t(215), t(215, "chaque page guidera vos visiteurs et renforcera votre credibilite aupres de vos futurs partenaires "), t(215, "les contenus redactionnels valoriseront clairement votre parcours et vos realisations professionnelles "), t(105, "l'ensemble sera livre cle en main, pret a accueillir vos visiteurs ")], t(65, "creation de votre site web professionnel sur mesure ")],
  ];
  let toutOk = true;
  for (const [nom, pres, titre] of cas) {
    const r = await mesurer(pres, titre);
    const moule = Object.entries(r.sections).map(([k, v]) => `${k}:${v}`).join(",");
    const ok = r.pageDernier === 1 && r.bas <= LIMITE_PX && moule === mouleRef;
    if (!ok) toutOk = false;
    console.log(
      `${ok ? "✓" : "✗"} ${nom.padEnd(34)} → pages=${r.pages}, présentation page ${r.pageDernier} (bas ${r.bas}/${LIMITE_PX}px), moule ${moule === mouleRef ? "INTACT" : moule}`,
    );
  }
  console.log(toutOk ? "\nRENDU CONFORME — page 1 jamais dépassée, moule intact" : "\nÉCART DÉTECTÉ");
})();
