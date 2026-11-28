/* Test local du pipeline prospects VOLET 29 (28/11/2026) :
 * génération du message personnalisé par niche + construction d'un
 * lot + classeur Excel. Exécuter : bun scripts/test-prospects.ts */
import { genererMessageProspect } from "../src/lib/scraping/message-prospect";
import type { EntrepriseScraped } from "../src/lib/scraping/types";
import { genererXlsx } from "../src/lib/xlsx/minimal";
import { writeFileSync } from "fs";
import { execSync } from "child_process";

function entreprise(partialiel: Partial<EntrepriseScraped>): EntrepriseScraped {
  return {
    source: "google-maps",
    nom: "Couvreur Exemple",
    niche: "Entreprise",
    bio: "Réfection de toitures",
    localisation: "Lyon, Auvergne-Rhône-Alpes",
    pays: "France",
    telephone: "+33 4 78 00 00 00",
    email: "contact@couvreur-exemple.fr",
    siteWeb: "https://couvreur-exemple.fr",
    siteWebPresent: true,
    ...partialiel,
  };
}

let echecs = 0;
function verifier(nom: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  OK  ${nom}`);
  } else {
    echecs += 1;
    console.log(`  ÉCHEC  ${nom}${detail ? ` — ${detail}` : ""}`);
  }
}

/* 1) Message avec la niche du fichier (#11 couvreur) + dirigeant. */
const p1 = entreprise({ nicheProspection: "#11", dirigeant: "Jean Dupont" });
const m1 = genererMessageProspect(p1);
console.log("--- MESSAGE (couvreur, dirigeant trouvé) ---");
console.log(m1.objet);
console.log(m1.corps.slice(0, 400) + "…");
verifier("l'objet porte le bénéfice de la niche", m1.objet.includes("plus de chantiers de toiture"), m1.objet);
verifier("la salutation porte le dirigeant", m1.corps.startsWith("Bonjour Jean Dupont,"));
verifier("le corps cite l'entreprise", m1.corps.includes("Couvreur Exemple"));
verifier("le corps cite la ville", m1.corps.includes("Lyon"));
verifier("le corps parle du métier de la niche", m1.corps.includes("couvreurs"));

/* 2) Prospect sans site web, sans dirigeant, niche générique. */
const p2 = entreprise({
  nom: "Toilettage Toutou",
  niche: "Toiletteur",
  nicheProspection: "#19",
  dirigeant: undefined,
  siteWeb: undefined,
  siteWebPresent: false,
  localisation: "Cotonou",
  pays: "Bénin",
  email: undefined,
  telephone: undefined,
});
const m2 = genererMessageProspect(p2);
console.log("\n--- MESSAGE (toilettage, sans dirigeant, sans site) ---");
console.log(m2.objet);
console.log(m2.corps.slice(0, 320) + "…");
verifier("sans dirigeant : salutation générique", m2.corps.startsWith("Bonjour"));
verifier("le message dit qu'il n'y a pas de site", m2.corps.includes("pas encore de site web"));
verifier("le bénéfice animaux présent", m2.objet.includes("un agenda bien rempli"), m2.objet);

/* 3) Le classeur Excel d'un lot complet. */
const enTete = ["Entreprise", "Dirigeant", "Message"];
const lignes = [enTete, [{ v: "IMPORT DU 28/11/2026 à 15:42 — 2 prospects", gras: true }]];
for (const p of [p1, p2]) {
  lignes.push([
    p.nom,
    p.dirigeant ?? "Non trouvé",
    `${genererMessageProspect(p).objet}\n\n${genererMessageProspect(p).corps}`,
  ]);
}
const xlsx = genererXlsx([{ nom: "Prospects", lignes, largeurs: [28, 22, 70] }]);
writeFileSync("/tmp/volet29-prospects.xlsx", xlsx);
console.log("\n--- CLASSEUR EXCEL ---");
console.log(`  généré : ${xlsx.length} octets`);
execSync('python3 - << \'EOF\'\n'
  + 'import openpyxl, sys\n'
  + 'wb = openpyxl.load_workbook("/tmp/volet29-prospects.xlsx")\n'
  + 'ws = wb["Prospects"]\n'
  + 'lignes = list(ws.iter_rows(values_only=True))\n'
  + 'assert lignes[0][0] == "Entreprise", lignes[0]\n'
  + 'assert lignes[1][0].startswith("IMPORT DU"), lignes[1][0]\n'
  + 'assert lignes[2][0] == "Couvreur Exemple", lignes[2][0]\n'
  + 'assert lignes[3][1] == "Non trouvé", lignes[3][1]\n'
  + 'assert "Bonjour Jean Dupont" in lignes[2][2], lignes[2][2][:60]\n'
  + 'print("  OK  le classeur Excel se relit (4 lignes, message complet dans la colonne)")\n'
  + 'EOF', { stdio: "inherit" });

console.log(echecs === 0 ? "\nTOUS LES TESTS PASSENT" : `\n${echecs} ÉCHEC(S)`);
process.exit(echecs === 0 ? 0 : 1);
