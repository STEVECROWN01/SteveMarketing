/**
 * VOLET 27 — OUTIL « GOOGLE MAPS » : fiches d'entreprises PAR LIEU ET
 * PAR NICHE, cloné gratuitement sur le scraping de fiches
 * d'entreprises : données publiques OpenStreetMap (Nominatim —
 * aucune clé, aucune limite de paiement).
 *
 * Champs renvoyés : nom, catégorie (niche), adresse complète, ville,
 * pays, téléphone, email, site web, horaires — tout ce qui est
 * disponible sur la fiche publique de l'entreprise.
 */
import { telechargerTexte, nettoyerTexte } from "./http";
import { normaliserSiteWeb } from "./extraction";
import type { EntrepriseScraped } from "./types";

type ReponseNominatim = {
  name?: string;
  osm_type?: string;
  osm_id?: number;
  type?: string;
  category?: string;
  display_name?: string;
  extratags?: Record<string, string> | null;
  address?: Record<string, string> | null;
  boundingbox?: [string, string, string, string];
  lat?: string;
  lon?: string;
};

/** Traduction française des catégories OSM les plus courantes. */
const NICHES_FR: Record<string, string> = {
  restaurant: "Restaurant",
  fast_food: "Restauration rapide",
  cafe: "Café",
  bar: "Bar",
  pub: "Pub",
  bakery: "Boulangerie",
  pastry: "Pâtisserie",
  butcher: "Boucherie",
  supermarket: "Supermarché",
  convenience: "Épicerie",
  hairdresser: "Salon de coiffure",
  beauty: "Institut de beauté",
  pharmacy: "Pharmacie",
  hospital: "Hôpital",
  clinic: "Clinique",
  doctors: "Cabinet médical",
  dentist: "Dentiste",
  bank: "Banque",
  atm: "Distributeur",
  clothes: "Boutique de vêtements",
  shoes: "Chaussures",
  jewelry: "Bijouterie",
  furniture: "Meubles",
  electronics: "Électronique",
  mobile_phone: "Téléphonie mobile",
  computer: "Informatique",
  hardware: "Quincaillerie",
  hotel: "Hôtel",
  guest_house: "Maison d'hôtes",
  hostel: "Auberge",
  car_repair: "Garage automobile",
  car: "Concession automobile",
  fuel: "Station-service",
  laundry: "Laverie",
  travel_agency: "Agence de voyage",
  real_estate_agency: "Agence immobilière",
  insurance: "Assurance",
  lawyer: "Avocat",
  accountant: "Comptable",
  office: "Bureau / Entreprise",
  company: "Entreprise",
  studio: "Studio",
  ngo: "ONG / Association",
  school: "École",
  college: "Enseignement supérieur",
  university: "Université",
  kindergarten: "Maternelle",
  gym: "Salle de sport",
  fitness_centre: "Centre de fitness",
  park: "Parc",
  place_of_worship: "Lieu de culte",
  marketplace: "Marché",
  tailor: "Tailleur",
  copyshop: "Reprographie",
  photo: "Photographe",
  funeral_directors: "Pompes funèbres",
  veterinary: "Vétérinaire",
  bicycle: "Vélos",
  books: "Librairie",
  toys: "Jouets",
  gifts: "Cadeaux / Souvenirs",
  greengrocer: "Fruits et légumes",
  alcoholic: "Boissons",
  coffee: "Torréfaction café",
  deli: "Épicerie fine",
};

function nicheFrancaise(type?: string, categorie?: string): string {
  const cle = (type ?? categorie ?? "").toLowerCase();
  return NICHES_FR[cle] ?? (cle ? cle.replace(/_/g, " ") : "Entreprise");
}

/** Géocode un lieu (ville, pays…) : nom affiché + cadre (boundingbox). */
async function geocoderLieu(lieu: string): Promise<{
  nomAffiche: string;
  viewbox: string;
  pays: string;
} | null> {
  const html = await telechargerTexte(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lieu)}&format=jsonv2&limit=1&accept-language=fr`,
    { timeoutMs: 15000, entetes: { Accept: "application/json" } },
  );
  if (!html) return null;
  try {
    const liste = JSON.parse(html) as ReponseNominatim[];
    const premier = liste?.[0];
    if (!premier?.boundingbox) return null;
    const [sud, nord, ouest, est] = premier.boundingbox;
    return {
      nomAffiche: nettoyerTexte(premier.name || premier.display_name, 100),
      /* viewbox Nominatim = <lon1>,<lat1>,<lon2>,<lat2> (gauche,haut,droite,bas) */
      viewbox: `${ouest},${nord},${est},${sud}`,
      pays: nettoyerTexte(premier.address?.country, 60),
    };
  } catch {
    return null;
  }
}

/** Cherche les fiches d'entreprises d'une niche dans un lieu. */
async function chercherEntreprises(
  niche: string,
  viewbox: string,
  limite: number,
): Promise<ReponseNominatim[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(niche)}` +
    `&format=jsonv2&limit=${Math.min(50, Math.max(1, limite))}&extratags=1&addressdetails=1` +
    `&bounded=1&viewbox=${encodeURIComponent(viewbox)}`;
  const html = await telechargerTexte(url, {
    timeoutMs: 20000,
    entetes: { Accept: "application/json" },
  });
  if (!html) return [];
  try {
    return (JSON.parse(html) as ReponseNominatim[]).filter((r) => Boolean(r.name));
  } catch {
    return [];
  }
}

/** Pause de courtoisie pour respecter la politique d'usage de
 *  Nominatim (AU MAXIMUM une requête par seconde). */
function attendre(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Construit une entreprise à partir d'une fiche Nominatim. */
function versEntreprise(fiche: ReponseNominatim, paysGeocode: string): EntrepriseScraped | null {
  const nom = nettoyerTexte(fiche.name, 80);
  if (!nom) return null;
  const adresse = fiche.address ?? {};
  const extras = fiche.extratags ?? {};
  const ville =
    adresse.city || adresse.town || addrVillage(adresse) || adresse.suburb || adresse.state_district || adresse.state || "";
  const localisation = [adresse.road, ville].filter(Boolean).join(", ");
  const siteWeb = normaliserSiteWeb(extras.website || extras["contact:website"] || extras["contact:url"]);
  const telephone = nettoyerTexte(
    extras.phone || extras["contact:phone"] || extras["contact:mobile"] || extras["phone:mobile"],
    40,
  );
  return {
    source: "google-maps",
    nom,
    niche: nicheFrancaise(fiche.type, fiche.category),
    bio: nettoyerTexte(extras.description || extras.cuisine || extras.operator, 200) || undefined,
    localisation: localisation || nettoyerTexte(fiche.display_name, 120) || undefined,
    pays: nettoyerTexte(adresse.country, 60) || paysGeocode || undefined,
    telephone: telephone || undefined,
    email: (nettoyerTexte(extras.email || extras["contact:email"], 90) || undefined)?.toLowerCase(),
    siteWeb: siteWeb ?? undefined,
    employes: undefined,
    contact: undefined,
    urlSource:
      fiche.osm_type && fiche.osm_id
        ? `https://www.openstreetmap.org/${fiche.osm_type}/${fiche.osm_id}`
        : undefined,
    siteWebPresent: Boolean(siteWeb),
  };
}

function addrVillage(adresse: Record<string, string>): string {
  return adresse.village || adresse.municipality || "";
}

/** POINT D'ENTRÉE : fiches d'entreprises par lieu et niche. */
export async function scraperGoogleMaps(params: {
  niche: string;
  lieu: string;
  limite?: number;
}): Promise<{ entreprises: EntrepriseScraped[]; avertissement?: string }> {
  const limite = params.limite ?? 40;
  const lieu = await geocoderLieu(params.lieu.trim());
  if (!lieu) {
    return {
      entreprises: [],
      avertissement: `Lieu introuvable (« ${params.lieu} ») — précisez la ville et le pays, ex. « Cotonou, Bénin ».`,
    };
  }
  /* Première passe : la niche TELLE QUELLE (« salon de coiffure »). */
  let fiches = await chercherEntreprises(params.niche.trim(), lieu.viewbox, limite);
  let avertissement: string | undefined;
  /* Seconde passe si la première est trop pauvre : le MOT LE PLUS
     SPÉCIFIQUE de la niche (« coiffure ») élargit la recherche aux
     noms et catégories — politesse Nominatim : UN INTERVALLE d'au
     moins une seconde entre les requêtes. */
  const mots = params.niche.trim().toLowerCase().split(/\s+/).filter((m) => m.length > 3);
  const motCle = mots.length > 0 ? mots[mots.length - 1] : "";
  if (fiches.length < 8 && motCle && motCle !== params.niche.trim().toLowerCase()) {
    await attendre(1100);
    const elargies = await chercherEntreprises(motCle, lieu.viewbox, limite);
    const ids = new Set(fiches.map((f) => f.osm_id));
    fiches = [...fiches, ...elargies.filter((f) => !ids.has(f.osm_id))];
  }
  if (fiches.length === 0) {
    avertissement = `Aucune fiche « ${params.niche} » trouvée à ${lieu.nomAffiche} dans les données publiques (OpenStreetMap) — essayez un autre terme (ex. « restaurant », « pharmacie », « salon de coiffure ») ou un lieu voisin.`;
  }
  const entreprises: EntrepriseScraped[] = [];
  const vus = new Set<string>();
  for (const fiche of fiches) {
    const entreprise = versEntreprise(fiche, lieu.pays);
    if (!entreprise) continue;
    const cle = `${entreprise.nom}|${entreprise.localisation ?? ""}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    entreprises.push(entreprise);
    if (entreprises.length >= limite) break;
  }
  return { entreprises, avertissement };
}
