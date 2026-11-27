/**
 * Variante M21 — description rédigée avec des retours à la ligne dans
 * l'éditeur (Chromium/contentEditable produit des <div> par paragraphe)
 * ET des <p> longs : vérifie si les blocs <div> entiers sont repoussés
 * en laissant un grand vide sous le tableau de la première page.
 */
import { readFileSync, writeFileSync } from "fs";
import { renderDocumentHtml } from "../../SteveMarketing/src/lib/documents/document-html";
import type { DocumentRecord } from "../../SteveMarketing/src/lib/documents/types";

const logo = readFileSync("/home/z/my-project/SteveMarketing/public/assets/logo-noir.png");
const logoData = `data:image/png;base64,${logo.toString("base64")}`;

const base = JSON.parse(
  readFileSync("/home/z/my-project/scripts/verif-portfolio/devis-d2600004.json", "utf8"),
) as DocumentRecord;

/* L'éditeur : premier paragraphe tapé = texte brut ; les suivants
 * (après Entrée) = <div>…</div>. Des paragraphes LONGS en <div> sont
 * la forme réelle d'une description rédigée au clavier. */
const paragraphe = (i: number) =>
  `Paragraphe ${i} de la description rédigée au clavier. ` +
  `Ce contenu détaillé explique ce qui sera fait pour votre projet, avec plusieurs phrases complètes. ` +
  `Chaque phrase apporte une précision utile sur la prestation, son déroulé et ses livrables. ` +
  `Le client doit sentir qu'on lui parle de son projet, pas d'une liste technique. ` +
  `La rédaction reste professionnelle et fluide jusqu'au bout du paragraphe.`;

const descriptionDiv = Array.from({ length: 6 }, (_, i) => `<div>${paragraphe(i + 1)}</div>`).join("");
const descriptionP = Array.from({ length: 6 }, (_, i) => `<p>${paragraphe(i + 1)}</p>`).join("");

const variante = (description: string, nom: string) => {
  const rec = { ...base, items: [{ ...base.items[0], description }] } as DocumentRecord;
  const html = renderDocumentHtml(rec, logoData);
  writeFileSync(`/tmp/render/${nom}.html`, html);
  console.log(`${nom} : ${html.length} caractères`);
};

variante(descriptionDiv, "m20-m21-div");
variante(descriptionP, "m20-m21-p");
