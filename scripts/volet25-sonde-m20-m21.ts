/**
 * SONDE M20/M21 (28/11/2026) — reproduction EXACTE des deux bugs
 * signalés par l'éditeur sur les devis générés DIRECTEMENT :
 *
 *  M20 : « le contenu des descriptions du tableau, dans le champ c'est
 *        sous forme de paragraphe, mais dans le tableau ça considère
 *        chaque PHRASE comme un PARAGRAPHE — ça met un espace entre
 *        les phrases » ;
 *  M21 : « quand la description est longue et que le tableau continue
 *        sur une autre page, ça coupe le tableau sur la première page
 *        très peu : il y a suffisamment d'espace SOUS le tableau en
 *        page 1. Ça doit OBLIGATOIREMENT finir la première page avant
 *        de continuer. »
 *
 * Rend le VRAI devis D2600004 (description de 1466 caractères en texte
 * brut — une seule coulée de phrases), exécute la pagination réelle
 * dans Chromium, puis mesure :
 *   - le nombre de pages ;
 *   - l'écart entre le BAS du dernier bloc de tableau de chaque page
 *     et le haut du pied de page (le « vide sous le tableau » M21) ;
 *   - l'écart vertical entre deux RANGÉES de phrases consécutives
 *     d'un même paragraphe (l'« espace entre les phrases » M20).
 */
import { readFileSync, writeFileSync } from "fs";
import { renderDocumentHtml } from "../../SteveMarketing/src/lib/documents/document-html";
import type { DocumentRecord } from "../../SteveMarketing/src/lib/documents/types";

const logo = readFileSync("/home/z/my-project/SteveMarketing/public/assets/logo-noir.png");
const logoData = `data:image/png;base64,${logo.toString("base64")}`;

const d = JSON.parse(
  readFileSync("/home/z/my-project/scripts/verif-portfolio/devis-d2600004.json", "utf8"),
) as DocumentRecord;

const html = renderDocumentHtml(d, logoData);
writeFileSync("/tmp/render/m20-m21-devis.html", html);
console.log("HTML écrit :", html.length, "caractères");
console.log("fragments de la description (découpe réelle) :");
