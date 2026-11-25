/**
 * VOLET 14 (24/11/2026) — ESPACE ADMINISTRATEUR : GÉNÉRATEUR DE
 * DOCUMENTS COMMERCIAUX.
 *
 * Modèle de données unique pour les TROIS types de documents
 * (proposition commerciale, devis, facture) — système copié du
 * projet K.Quotes de l'éditeur (github.com/STEVECROWN01/K.Quotes),
 * adapté aux prestations de création de sites web : les lignes du
 * tableau « Détail » sont LIBRES (type + désignation + puces +
 * délai) au lieu des deux prestations fixes CV/LinkedIn de K.Quotes.
 *
 * Une FACTURE est toujours générée POUR UN DEVIS EXISTANT (demande
 * de l'éditeur) : `devisSource` porte le numéro du devis d'origine
 * et le numéro de facture suit la règle de K.Quotes — le préfixe D
 * du devis est remplacé par F, les chiffres restent (D2600004 →
 * F2600004).
 */

export type DocType = "proposition" | "devis" | "facture";

/** Ligne du tableau « Détail ». VOLET 17 : la description est un
 *  texte RICHE rédigé dans le formulaire (gras, italique, taille
 *  supérieure, listes) — plus de liste de puces fixes ; le type est
 *  toujours « Service » (posé automatiquement, plus de champ). */
export type LigneDocument = {
  id: string;
  /** Colonne TYPE — toujours « Service » (automatique). */
  type: string;
  /** Nom de la prestation (gras, première ligne de la cellule). */
  designation: string;
  /** Description rédigée — HTML riche ASSAINI (b, i, taille
   *  supérieure, listes numérotées / à puces). */
  description?: string;
  /** ANCIEN format : puces carrées (documents déjà enregistrés). */
  points?: string[];
  /** ANCIEN format : mention italique de délai (remplacée par le
   *  délai estimé du document, affiché après les CGV). */
  mentionLivraison?: string;
  quantite: number;
  prixUnitaire: number;
};

/** Coordonnées bancaires : VOLET 17 — l'ordre d'affichage est
 *  IBAN, BIC puis TITULAIRE DU COMPTE (demande de l'éditeur) ; la
 *  ligne « Banque » a été supprimée du document ET du formulaire. */
export type CoordonneesBancaires = {
  titulaire: string;
  iban: string;
  bic: string;
  /** ANCIEN champ (conservé pour les documents déjà enregistrés,
 *   plus affiché). */
  banque?: string;
};

/** Phase du déroulé (proposition commerciale, page 2). */
export type PhaseProjet = {
  titre: string;
  delai: string;
};

export type DocumentRecord = {
  /** Identifiant de fichier (sans extension) : ex. devis-d2600001. */
  id: string;
  /** Numéro affiché : D2600001 / F2600001 / PC2600001. */
  numero: string;
  docType: DocType;
  /** Numéro client (5 chiffres, padding) — relie devis et facture. */
  numeroClient: number;
  /** Date d'émission (ISO yyyy-mm-dd). */
  date: string;

  client: {
    nom: string;
    entreprise?: string;
    ville?: string;
    pays?: string;
    telephone?: string;
    email?: string;
  };

  /** Objet du document (reprend le titre du projet). */
  objet: string;
  /** Paragraphe sous « Merci pour votre confiance. » */
  intro: string;

  items: LigneDocument[];
  /** Code devise (XOF par défaut — FCFA). */
  devise: string;

  /** VOLET 17 — délai estimé de la prestation : affiché À LA SUITE
   *  des conditions générales de vente (« Délai estimé : … » en
   *  gras), plus jamais dans le tableau. */
  delaiEstime?: string;

  conditionsReglement: string;
  modePaiement: string;
  validiteJours: number;
  notes: string;
  lienPaiement?: string;

  banque: CoordonneesBancaires;

  /** Proposition commerciale : déroulé du projet (page 2). */
  phases?: PhaseProjet[];

  /** Facture uniquement. */
  statutPaiement?: "Payé" | "En attente";
  datePaiement?: string;
  /** Facture uniquement : numéro du devis à l'origine. */
  devisSource?: string;

  createdAt: string;
  updatedAt: string;
};

/** Corps accepté par la route PDF (le client peut omettre id,
 *  numero et horodatages — le serveur les produit). */
export type DemandeDocument = Omit<
  DocumentRecord,
  "id" | "numero" | "createdAt" | "updatedAt"
> & {
  id?: string;
  numero?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const LABELS_DOC: Record<DocType, string> = {
  proposition: "Proposition Commerciale",
  devis: "Devis",
  facture: "Facture",
};

/** Devises — l'EURO vient en tête (choix par défaut du
 *  générateur, demande de l'éditeur, volet 15). */
export const DEVISES: { code: string; label: string }[] = [
  { code: "EUR", label: "Euro (€)" },
  { code: "XOF", label: "Franc CFA (FCFA)" },
  { code: "USD", label: "Dollar US ($)" },
  { code: "CAD", label: "Dollar canadien ($ CA)" },
  { code: "GBP", label: "Livre sterling (£)" },
  { code: "CHF", label: "Franc suisse (CHF)" },
];

/** Modes de paiement proposés (volet 15 : Cash, PayPal, M-Pesa et
 *  Celtiis Cash retirés à la demande de l'éditeur). */
export const MODES_PAIEMENT = [
  "Virement bancaire",
  "MTN Mobile Money",
  "Moov Money",
  "Orange Money",
  "Wave",
] as const;

export const CONDITIONS_REGLEMENT = [
  "À réception",
  "À réception de facture",
  "Sous 30 jours",
  "Sous 15 jours",
  "Comptant",
] as const;
