#!/usr/bin/env python3
"""Génère src/lib/scraping/pays.ts (liste des pays du monde, noms
français) à partir de pycountry — VOLET 29 (28/11/2026)."""
import gettext, pycountry

t = gettext.translation('iso3166-1', pycountry.LOCALES_DIR, languages=['fr'])
pays = []
for c in pycountry.countries:
    if c.alpha_2 == "AQ":
        continue
    nom = t.gettext(c.name).strip()
    if nom:
        pays.append((c.alpha_2, nom))
pays.sort(key=lambda p: p[1].casefold())

lignes = [f'  {{ code: "{code}", nom: "{nom.replace(chr(34), chr(92) + chr(34))}" }},' for code, nom in pays]

entete = '''/**
 * VOLET 29 (28/11/2026) — PAYS DU MONDE pour le ciblage du scraping :
 * liste des pays (noms français), triée alphabétiquement — le
 * drop-down de PAYS du formulaire de scraping. Les VILLES de chaque
 * pays sont servies à la demande par /villes-monde.json (générées du
 * jeu de données publiques GeoNames cities15000 — villes de plus de
 * 25 000 habitants, minimum 8 par pays).
 *
 * Fichier généré par scripts/preparer-pays-villes.py — ne pas éditer à
 * la main.
 */

/** Un pays du drop-down de ciblage. */
export type PaysMonde = {
  /** Code ISO 3166-1 alpha-2 (clé des villes de villes-monde.json). */
  code: string;
  /** Nom français affiché. */
  nom: string;
};

/** Tous les pays du monde, triés alphabétiquement (ordre français). */
export const PAYS_MONDE: PaysMonde[] = [
'''

with open('src/lib/scraping/pays.ts', 'w', encoding='utf-8') as f:
    f.write(entete)
    f.write('\n'.join(lignes))
    f.write('\n];\n')

print(f'pays.ts : {len(pays)} pays')
