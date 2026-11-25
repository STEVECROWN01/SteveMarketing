/** Test du rendu de la proposition commerciale v2 (volet 16) :
 * génère le HTML avec les valeurs par défaut (contenu de l'exemple
 * neutralisé) pour vérification dans Chromium. */
import { propositionV2ParDefaut } from "../src/lib/documents/proposition";
import { renderPropositionHtml } from "../src/lib/documents/proposition-html";
import fs from "fs";

const p = {
  ...propositionV2ParDefaut(),
  docType: "proposition" as const,
  numero: "PC2600001",
  numeroClient: 1,
  date: "2026-11-25",
  id: "",
  createdAt: "",
  updatedAt: "",
};

const html = renderPropositionHtml(
  p,
  "file:///home/z/my-project/SteveMarketing/public/assets/logo-noir.png",
);
fs.mkdirSync("/tmp/render/prop", { recursive: true });
fs.writeFileSync("/tmp/render/prop/proposition.html", html);
console.log("HTML écrit : /tmp/render/prop/proposition.html", html.length, "caractères");
