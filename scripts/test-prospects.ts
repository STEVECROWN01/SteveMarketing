/* Test local de l'EMAIL PROPOSÉ À PARTIR DE L'AUDIT — VOLET 29,
 * précision du 28/11/2026 (nuit) : l'email suit l'EXEMPLE fourni par
 * l'éditeur (email envoyé à une propriétaire de clinique, dont les
 * puces étaient les améliorations trouvées sur son site). Exécuter :
 * bun scripts/test-prospects.ts */
import { genererEmailAudit, emailEnTexte } from "../src/lib/audit/email";
import type { AuditComplet } from "../src/lib/audit/complet";
import { construireAudit, compilerAxes } from "../src/lib/audit/complet";
import { genererXlsx } from "../src/lib/xlsx/minimal";
import { writeFileSync } from "fs";
import { execSync } from "child_process";

let echecs = 0;
function verifier(nom: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  OK  ${nom}`);
  } else {
    echecs += 1;
    console.log(`  ÉCHEC  ${nom}${detail ? ` — ${detail}` : ""}`);
  }
}

/* Un audit réaliste d'une clinique : quelques axes dans chaque bloc. */
const audit = construireAudit(
  "https://clinique-exemple.fr",
  {
    ok: true,
    url: "https://clinique-exemple.fr",
    note: "D",
    scorePerformance: 55,
    scoreStructure: 62,
    vitals: [],
    chargeComplete: 5400,
    ttfb: 800,
    poidsTotal: 3_200_000,
    nbRequetes: 48,
    domaines: 9,
    detailsTypes: [],
    audits: [
      {
        titre: "Servir les images aux formats récents",
        impact: "élevé",
        points: 12,
        detail: "Les images sont en JPEG lourd.",
        conseil: "Convertissez en WebP/AVIF.",
      },
    ],
    cascade: [],
  },
  {
    ok: true,
    url: "https://clinique-exemple.fr",
    score: 62,
    note: "D",
    verdict: "Correct",
    familles: [],
    plan: [
      {
        libelle: "Balise title manquante",
        etat: "ko",
        points: 8,
        obtenu: 0,
        detail: "Aucune balise <title> sur la page.",
        conseil: "Ajoutez un titre unique avec le mot-clé principal.",
      },
    ],
    apercu: { titre: "", description: "", url: "https://clinique-exemple.fr" },
  },
  {
    ok: true,
    url: "https://clinique-exemple.fr",
    scoreGlobal: 48,
    note: "E",
    axes: [],
    capture: "",
    forces: [],
    ameliorations: [
      { titre: "Aucun appel à l'action visible", detail: "Le visiteur ne sait pas quoi faire." },
      { titre: "Mises en page rigides", detail: "Le design ne s'adapte pas aux écrans." },
      { titre: "Aucune preuve sociale", detail: "Ni avis ni témoignage." },
    ],
  },
  {
    nom: "Clinique Saint-Exemple",
    email: "contact@clinique-exemple.fr",
    dirigeant: "Marie Martin",
    nicheProspection: "#07",
    niche: "Clinique",
  },
) as AuditComplet;

console.log("--- EMAIL GÉNÉRÉ (clinique, 3 axes + 1 perf + 1 seo) ---");
const message = genererEmailAudit(audit);
console.log(emailEnTexte(message));
console.log("");

verifier("« À : » porte l'email de l'entreprise", message.a === "contact@clinique-exemple.fr", message.a);
verifier("l'objet porte le nom du dirigeant (exemple de l'éditeur)", message.objet === "Informations pour Marie Martin", message.objet);
verifier("l'expéditeur est celui de l'exemple", message.de === "Stevens Akpovi – stevensakpovi@gmail.com", message.de);
verifier("le corps salue le dirigeant par son nom", message.corps.startsWith("Bonjour Marie Martin,"));
verifier("le corps ouvre sur « J'espère que vous allez bien. »", message.corps.includes("J'espère que vous allez bien."));
verifier("le corps dit « mon équipe et moi-même avons analysé le site web »", message.corps.includes("mon équipe et moi-même avons analysé le site web de votre entreprise"));
verifier("la promesse porte le bénéfice de la niche (cliniques : RDV)", message.corps.includes("notamment pour plus de demandes de rendez-vous"), message.corps.split("\n")[7]);
const puces = message.corps.split("\n").filter((l) => l.startsWith("- "));
verifier("les puces viennent des axes d'audit (au moins 4)", puces.length >= 4, `${puces.length} puces : ${puces.join(" | ").slice(0, 180)}`);
verifier("une puce parle d'appels à l'action (axe design de la clinique)", puces.some((p) => p.includes("appels à l'action")), puces.join(" | "));
verifier("une puce parle de design adapté aux écrans (axe design)", puces.some((p) => p.includes("différentes tailles d'écrans")), puces.join(" | "));
verifier("une puce parle d'images légères (axe performance)", puces.some((p) => p.includes("images")), puces.join(" | "));
verifier("une puce parle de Google (axe SEO)", puces.some((p) => p.includes("Google")), puces.join(" | "));
verifier("le corps propose un rendez-vous de 15 à 20 minutes en visio", message.corps.includes("rendez-vous d'environ 15 à 20 minutes") && message.corps.includes("en visio"));
verifier("le corps rassure : « ça ne vous engage à rien »", message.corps.includes("ça ne vous engage à rien"));
verifier("le corps signe « Au plaisir d'échanger », puis Stevens Akpovi", message.corps.includes("Au plaisir d'échanger prochainement avec vous,") && message.corps.trimEnd().endsWith("Stevens Akpovi"));

/* Sans dirigeant : l'objet retombe sur l'entreprise. */
const sansDirigeant = genererEmailAudit({ ...audit, prospect: { nom: "Clinique Saint-Exemple", email: "contact@clinique-exemple.fr", nicheProspection: "#07" } });
verifier("sans dirigeant, l'objet porte le nom de l'entreprise", sansDirigeant.objet === "Informations pour Clinique Saint-Exemple", sansDirigeant.objet);
verifier("sans dirigeant, la salutation reste correcte", sansDirigeant.corps.startsWith("Bonjour,"));

/* L'audit parfait : puces de secours. */
const axesTires = compilerAxes(audit);
verifier("l'audit de référence porte bien des axes", axesTires.length >= 4, `${axesTires.length} axes`);

/* Le classeur Excel (sans colonne Message désormais). */
const xlsx = genererXlsx([
  {
    nom: "Prospects",
    lignes: [
      ["Entreprise", "Dirigeant", "Email", "Statut", "Importé le"],
      [{ v: "IMPORT DU 28/11/2026 à 23:15 — 2 prospects", gras: true }],
      ["Clinique Saint-Exemple", "Marie Martin", "contact@clinique-exemple.fr", "Non contacté", "28/11/2026 23:15"],
    ],
    largeurs: [28, 22, 28, 16, 18],
  },
]);
writeFileSync("/tmp/volet29b-prospects.xlsx", xlsx);
execSync(
  'python3 -c "\n'
  + 'import openpyxl\n'
  + 'wb = openpyxl.load_workbook(\'/tmp/volet29b-prospects.xlsx\')\n'
  + 'ws = wb[\'Prospects\']\n'
  + 'lignes = list(ws.iter_rows(values_only=True))\n'
  + 'assert lignes[0][0] == \'Entreprise\'\n'
  + 'assert len(lignes[0]) == 5, lignes[0]\n'
  + 'assert lignes[1][0].startswith(\'IMPORT DU\')\n'
  + 'assert lignes[2][1] == \'Marie Martin\'\n'
  + 'print(\'  OK  classeur Excel relu (5 colonnes, sans colonne Message)\')\n'
  + '"',
  { stdio: "inherit" },
);

console.log(echecs === 0 ? "\nTOUS LES TESTS PASSENT" : `\n${echecs} ÉCHEC(S)`);
process.exit(echecs === 0 ? 0 : 1);
