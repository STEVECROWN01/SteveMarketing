/** Contrôle non-régression — PROPOSITION COMMERCIALE : la pagination
 *  (moule 6 pages, sections 01→p1 … 08→p6) doit rester INTACTE après
 *  les correctifs 28/11 (pagination-flux + texte-riche + M18). */
import { readFileSync, writeFileSync } from "fs";
import { renderPropositionHtml } from "../../SteveMarketing/src/lib/documents/proposition-html";
import { propositionV2ParDefaut } from "../../SteveMarketing/src/lib/documents/proposition";

const logo = readFileSync("/home/z/my-project/SteveMarketing/public/assets/logo-noir.png");
const logoData = `data:image/png;base64,${logo.toString("base64")}`;

const p = propositionV2ParDefaut();
const html = renderPropositionHtml({ ...p, docType: "proposition", id: "prop", numero: "PC2600007", numeroClient: 7, date: "2026-11-28" } as never, logoData);
writeFileSync("/tmp/render/nr-proposition.html", html);
console.log("HTML proposition écrit :", html.length, "caractères");
