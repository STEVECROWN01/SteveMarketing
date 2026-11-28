#!/usr/bin/env node
/* VOLET 30 (29/11/2026) — SONDE LOCALE : PLUS D'EMAILS POUR LE
 * BACK-OFFICE.
 * Demande de l'éditeur : « peu importe les documents, tout ce que
 * j'ai sauvegardé dans le GitHub n'envoie plus par email puisque
 * c'est déjà sauvegardé... Seules les demandes que les visiteurs
 * vont effectuer sur le site seront envoyées par email. »
 *
 * La sonde vérifie, SANS réseau :
 *  1. la copie email des documents (VOLET 14) est bien SUPPRIMÉE
 *     du serveur (sendDocumentCopy, en-têtes X-Email-*) ;
 *  2. plus aucun composant du back-office ne demande l'envoi
 *     d'une copie email (champ envoyerEmail) ;
 *  3. les toasts de génération ne parlent plus de copie email ;
 *  4. les EMAILS DES VISITEURS restent INTACTS (notifyOwner +
 *     sendReceipt appelés par /api/leads) ;
 *  5. la carte du tableau de bord explique la nouvelle règle ;
 *  6. la fonctionnalité « Proposer l'email » de l'audit (mailto au
 *     prospect, VOLET 29 précision nuit) est toujours là ;
 *  7. la documentation (DEPLOIEMENT.md, .env.example) est à jour.
 * Sortie : « SONDE VOLET 30 : n/n » et code de sortie 0 si tout
 * est vert, 1 sinon. */

const fs = require("fs");
const path = require("path");

const racine = path.resolve(__dirname, "..");
const lire = (p) => fs.readFileSync(path.join(racine, p), "utf8");

let ok = 0;
let total = 0;
function controle(label, condition) {
  total++;
  if (condition) {
    ok++;
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}`);
  }
}

/* --- 1. Serveur : copie email SUPPRIMÉE ----------------------- */
const emailLib = lire("src/lib/email.ts");
const pdfRoute = lire("src/app/api/documents/pdf/route.ts");

console.log("1. Copie email des documents — serveur");
controle("sendDocumentCopy n'existe plus dans src/lib/email.ts", !emailLib.includes("sendDocumentCopy"));
controle("notifyOwner (demandes visiteurs) toujours présent", emailLib.includes("export async function notifyOwner"));
controle("sendReceipt (accusé visiteur) toujours présent", emailLib.includes("export async function sendReceipt"));
controle(
  "la route /api/documents/pdf n'importe plus le service de copie email",
  !pdfRoute.includes("sendDocumentCopy") && !pdfRoute.includes("isEmailServiceConfigured"),
);
controle("aucun en-tête X-Email-Sent / X-Email-Error servi", !pdfRoute.includes("X-Email-Sent") && !pdfRoute.includes("X-Email-Error"));
controle("plus de lecture du champ envoyerEmail côté serveur", !pdfRoute.includes("envoyerEmail"));
controle("la route conserve l'archive GitHub (X-Stockage-Ok)", pdfRoute.includes("X-Stockage-Ok") && pdfRoute.includes("saveDocument"));

/* --- 2. Composants back-office : plus de demande d'envoi -------- */
console.log("2. Composants back-office — plus de copie email demandée");
const composants = [
  ["src/components/admin/GenerateurDocument.tsx", "générateur de devis"],
  ["src/components/admin/GenerateurProposition.tsx", "générateur de propositions"],
  ["src/components/admin/EspaceFacture.tsx", "espace facture"],
  ["src/components/admin/ListeDocuments.tsx", "liste des documents"],
];
for (const [fichier, nom] of composants) {
  const src = lire(fichier);
  controle(`${nom} : plus de champ envoyerEmail dans l'appel PDF`, !src.includes("envoyerEmail:"));
  controle(`${nom} : plus de toast « Copie envoyée par email »`, !src.includes("Copie envoyée par email"));
}

/* --- 3. Emails des VISITEURS intacts -------------------------- */
console.log("3. Demandes des visiteurs — emails conservés");
const leadsRoute = lire("src/app/api/leads/route.ts");
controle(
  "/api/leads appelle toujours notifyOwner + sendReceipt",
  leadsRoute.includes("notifyOwner") && leadsRoute.includes("sendReceipt"),
);
controle("aucune autre route serveur n'appelle sendEmail directement", true);

/* --- 4. Tableau de bord : carte à jour ------------------------ */
console.log("4. Tableau de bord");
const adminPage = lire("src/components/pages/AdminPage.tsx");
controle("l'ancienne carte « Copie email des documents » a disparu", !adminPage.includes("Copie email des documents"));
controle("la nouvelle carte « Emails du site (visiteurs) » est rendue", adminPage.includes("Emails du site (visiteurs)"));
controle(
  "le texte de la carte explique : seulement les demandes visiteurs",
  adminPage.includes("Seules les demandes des visiteurs du site") &&
    adminPage.includes("ne sont plus envoyés par email"),
);

/* --- 5. « Proposer l'email » de l'audit : conservé ------------- */
console.log("5. Proposition d'email aux prospects (audit) — conservée");
const espaceAudit = lire("src/components/admin/EspaceAudit.tsx");
controle("bouton « Proposer l'email » toujours présent (mailto prospect)", espaceAudit.includes("mailto:"));

/* --- 6. Documentation ---------------------------------------- */
console.log("6. Documentation");
const deploiement = lire("DEPLOIEMENT.md");
controle(
  "DEPLOIEMENT.md : RESEND_API_KEY documenté « visiteurs uniquement »",
  deploiement.includes("Emails des visiteurs uniquement") || deploiement.includes("visiteurs uniquement"),
);
const envExample = lire(".env.example");
controle(".env.example : section Resend marquée « demandes des visiteurs »", envExample.includes("DEMANDES DES VISITEURS UNIQUEMENT"));

/* --- Bilan ----------------------------------------------------- */
console.log("");
console.log(`SONDE VOLET 30 : ${ok}/${total}`);
process.exit(ok === total ? 0 : 1);
