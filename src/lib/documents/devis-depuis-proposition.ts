/**
 * VOLET 20 (26/11/2026) — DEVIS PRÉ-REMPLI DEPUIS UNE PROPOSITION
 * COMMERCIALE.
 *
 * Demande de l'éditeur : « au niveau des propositions commerciales,
 * lorsqu'on crée une proposition commerciale, il doit y avoir un
 * bouton ou une icône de génération de devis dessus. Et on peut
 * générer un devis pour cette proposition commerciale. Et lorsqu'on
 * clique sur le bouton de génération de devis pour cette
 * proposition commerciale, automatiquement toutes les informations
 * de la proposition commerciale sont récupérées et utilisées pour
 * pré-remplir le devis. Tu agis comme un expert en rédaction de
 * propositions commerciales et de devis… la rédaction doit être
 * très bien faite et très bien formatée. »
 *
 * RÈGLES (précisées par l'éditeur) :
 *  - le NOM du client vient du DESTINATAIRE de la proposition
 *    (l'entreprise si le champ entreprise est renseigné, sinon le
 *    nom complet) ;
 *  - la localisation, le pays, l'email, le téléphone restent aux
 *    VALEURS PAR DÉFAUT des champs (« ce sera à moi de remplir
 *    cela dans les champs ») ;
 *  - le numéro CLIENT de la proposition est réutilisé (les
 *    documents d'un même client restent reliés) ;
 *  - le MONTANT de la proposition devient le prix de la prestation ;
 *  - le périmètre (blocs A, B, C…) est rédigé en texte RICHE mis en
 *    forme : sous-titres en gras, introductions en paragraphes,
 *    points en listes, calendrier en listes — directement dans la
 *    colonne Description du tableau « Détail » du devis.
 */

import type { PropositionRecord } from "./proposition";
import type { PreRemplissage } from "@/components/admin/GenerateurDocument";
import type { LigneDocument } from "./types";

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Nom du client du devis : l'ENTREPRISE du destinataire si
 *  renseignée, sinon son NOM COMPLET (demande de l'éditeur : « le
 *  nom sera utilisé pour le devis »). */
export function nomClientDeProposition(p: PropositionRecord): string {
  const entreprise = (p.destinataire?.entreprise ?? "").trim();
  const nomComplet = (p.destinataire?.nomComplet ?? "").trim();
  return entreprise || nomComplet;
}

/** Rédaction EXPERTE de la description de la prestation : le
 *  périmètre de la proposition (blocs A, B, C… avec leurs
 *  introductions, leurs points et leurs clôtures) puis le
 *  calendrier de réalisation — en HTML riche mis en forme (sous-
 *  titres en taille supérieure, titres de blocs en gras, points en
 *  listes), prêt pour la colonne Description du devis. */
function redigerDescription(p: PropositionRecord): string {
  const morceaux: string[] = [];
  const s = p.sections;
  const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /* ---- Périmètre de la prestation ---- */
  const perimetre = (s.perimetre ?? []).filter(
    (b) => (b.titre ?? "").trim() || (b.intro ?? "").trim() || (b.points ?? []).length,
  );
  if (perimetre.length) {
    morceaux.push('<font size="5">Périmètre de la prestation</font>');
    perimetre.forEach((b, i) => {
      const lettre = lettres[i % 26];
      if ((b.titre ?? "").trim()) {
        morceaux.push(`<p><b>${lettre}. ${esc(b.titre)}</b></p>`);
      }
      if ((b.intro ?? "").trim()) morceaux.push(`<p>${esc(b.intro)}</p>`);
      if ((b.lead ?? "").trim()) morceaux.push(`<p>${esc(b.lead)}</p>`);
      const points = (b.points ?? []).filter((pt) => pt && pt.trim());
      if (points.length) {
        morceaux.push(`<ul>${points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>`);
      }
      if ((b.post ?? "").trim()) morceaux.push(`<p>${esc(b.post)}</p>`);
    });
  }

  /* ---- Calendrier de réalisation ---- */
  const etapes = (s.calendrierEtapes ?? []).filter((e) => e && e.trim());
  if (etapes.length || (s.calendrierIntro ?? "").trim()) {
    morceaux.push('<font size="5">Calendrier de réalisation</font>');
    if ((s.calendrierIntro ?? "").trim()) {
      morceaux.push(`<p>${esc(s.calendrierIntro)}</p>`);
    }
    if ((s.calendrierEtapesIntro ?? "").trim()) {
      morceaux.push(`<p>${esc(s.calendrierEtapesIntro)}</p>`);
    }
    if (etapes.length) {
      morceaux.push(`<ul>${etapes.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>`);
    }
    if ((s.calendrierNote ?? "").trim()) {
      morceaux.push(`<p><i>${esc(s.calendrierNote)}</i></p>`);
    }
  }

  return morceaux.join("");
}

/** Modalités de règlement de la proposition, rédigées pour la
 *  ligne « Notes » du devis (les CGV et le délai estimé suivent les
 *  conventions du gabarit). */
function redigerNotes(p: PropositionRecord): string {
  const echeances = (p.sections.paiements ?? []).filter(
    (e) => Number(e.pourcentage) > 0 || (e.libelle ?? "").trim(),
  );
  if (!echeances.length) return "";
  const n = echeances.length === 1 ? "en une étape" : `en ${echeances.length} étapes`;
  const details = echeances
    .map((e) => {
      const pct = Math.round(Number(e.pourcentage) || 0);
      return pct > 0 ? `${pct} % ${e.libelle ? `— ${e.libelle.toLowerCase()}` : ""}` : e.libelle ?? "";
    })
    .filter(Boolean)
    .join(" ; ");
  return `Modalités issues de la proposition : règlement ${n} — ${details}.`;
}

/** Construit le pré-remplissage complet du générateur de devis
 *  depuis une proposition commerciale (bouton « générer le devis »
 *  de la liste des propositions). */
export function preRemplissageDevisDepuisProposition(
  p: PropositionRecord,
): PreRemplissage {
  const nom = nomClientDeProposition(p);
  const description = redigerDescription(p);
  const notes = redigerNotes(p);

  /* Une PRESTATION unique au montant de la proposition : le
   * périmètre détaillé vit dans la description rédigée (les
   * « prix et autres » du tableau sont récupérés : le montant total
   * de la proposition devient le prix de la prestation). */
  const ligne: LigneDocument = {
    id: Math.random().toString(36).slice(2, 10),
    type: "Service",
    designation: (p.titre ?? "").trim() || "Prestation décrite dans la proposition commerciale",
    description,
    quantite: 1,
    prixUnitaire: Number(p.montant) || 0,
  };

  /* Résumé de la proposition affiché en tête du formulaire (carte
   * « Proposition à l'origine de ce devis »). */
  const resume = [
    `Projet : ${p.projet}`,
    `Montant : ${p.montant} ${p.devise}`,
    `Délai estimé : ${p.delai}`,
    `Périmètre : ${(p.sections.perimetre ?? []).length} bloc${(p.sections.perimetre ?? []).length > 1 ? "s" : ""} — ${(p.sections.perimetre ?? []).map((b) => b.titre).filter(Boolean).join(" · ")}`,
    `Destinataire : ${nom || "—"}`,
    `Émise le ${p.date}`,
  ].join("\n");

  return {
    client: {
      nom,
      /* Les autres coordonnées (ville, pays, email, téléphone)
       * restent aux valeurs PAR DÉFAUT des champs du formulaire :
       * l'éditeur les complète lui-même (demande explicite). */
    },
    origine: {
      titre: "Proposition à l'origine de ce devis",
      nom: `Proposition ${p.numero} — ${p.projet}`,
      date: `émise le ${p.date}`,
      message: resume,
    },
    numeroClient: Number(p.numeroClient) || undefined,
    champs: {
      objet: (p.titre ?? "").trim() || "Création d'un site web professionnel",
      intro:
        (p.sections.presentation ?? []).find((par) => par && par.trim()) ??
        "Le présent devis fait suite à la proposition commerciale qui vous a été adressée ; il en reprend exactement le périmètre, le montant et le calendrier.",
      delaiEstime: (p.delai ?? "").trim() || undefined,
      devise: p.devise,
      items: description ? [ligne] : [{ ...ligne, description: "" }],
      ...(notes ? { notes } : {}),
    },
  };
}
