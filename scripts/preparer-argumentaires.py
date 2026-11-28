#!/usr/bin/env python3
"""Génère src/lib/scraping/argumentaires.ts (service + « pourquoi ça
marche » + bénéfice par niche) à partir de la feuille « FICHES
COMPLÈTES » du fichier Excel « Pack_Prospection_2026.xlsx » de
l'éditeur — VOLET 29 (28/11/2026).

Le bénéfice (`benefice`) est la promesse utilisée dans l'objet de
l'email personnalisé envoyé au prospect (« plus de chantiers
qualifiés », « plus de nouveaux patients »…), alignée sur les
arguments du fichier.
"""
import json
import openpyxl

BENEFICES = {
    "01": "plus de demandes de devis",
    "02": "plus de chantiers qualifiés",
    "03": "des projets alignés et mieux payés",
    "04": "plus de mandats entrants",
    "05": "plus de mandats de recrutement",
    "06": "plus de nouveaux patients",
    "07": "plus de demandes de rendez-vous",
    "08": "plus d'inscriptions",
    "09": "plus d'études confiées",
    "10": "plus de rendez-vous qualifiés",
    "11": "plus de chantiers de toiture",
    "12": "plus de clients confiants",
    "13": "des créneaux bien remplis",
    "14": "plus d'abonnements",
    "15": "plus d'interventions urgentes",
    "16": "plus de contrats de transport",
    "17": "plus d'installations planifiées",
    "18": "plus de réservations directes",
    "19": "un agenda bien rempli",
    "20": "plus de clients accompagnés",
    "21": "plus de réservations de parties",
    "22": "plus d'essais et de démos",
    "23": "des clients mieux qualifiés",
    "24": "plus de projets sur mesure",
    "25": "plus de devis signés",
}

wb = openpyxl.load_workbook('/home/z/my-project/upload/Pack_Prospection_2026.xlsx', data_only=True)
ws = wb['📋 FICHES COMPLÈTES']
lignes = []
for row in ws.iter_rows(values_only=True):
    for v in row:
        if v is not None and str(v).strip():
            lignes.append(str(v).strip())

entrees = {}
for i, l in enumerate(lignes):
    if l.startswith('SERVICE :'):
        continue
    # en-tête de fiche : «   #11  ·  COUVREURS (RÉFECTION ET RÉNOVATION DE TOITURES) »
    import re
    m = re.match(r'#(\d+)\s+·\s+(.+)', l)
    if m:
        num = m.group(1)
        service = ""
        pourquoi = ""
        if i + 1 < len(lignes) and lignes[i + 1].startswith('SERVICE :'):
            service = lignes[i + 1][len('SERVICE :'):].strip()
        j = i + 1
        while j < len(lignes) and 'POURQUOI ÇA MARCHE' not in lignes[j]:
            j += 1
        if j + 1 < len(lignes):
            pourquoi = lignes[j + 1].strip()
        entrees[num] = (service, pourquoi)

assert len(entrees) == 25, f"{len(entrees)} fiches trouvées (25 attendues)"

blocs = []
for num in sorted(entrees):
    service, pourquoi = entrees[num]
    service = service.replace('"', '\\"')
    pourquoi = pourquoi.replace('"', '\\"')
    benefice = BENEFICES[num].replace('"', '\\"')
    blocs.append(
        f'''  {{
    cle: "#{num}",
    service: "{service}",
    benefice: "{benefice}",
    pourquoiCaMarche: "{pourquoi}",
  }},'''
    )

contenu = '''/**
 * VOLET 29 (28/11/2026) — ARGUMENTAIRES PAR NICHE (fichier de
 * prospection de l'éditeur « Pack_Prospection_2026.xlsx », feuille
 * « FICHES COMPLÈTES ») : pour chaque niche, le SERVICE recommandé
 * (ce que le site doit faire), le « POURQUOI ÇA MARCHE » (arguments
 * du fichier) et le BÉNÉFICE client — la promesse de l'objet de
 * l'email personnalisé rédigé pour le prospect.
 *
 * Fichier généré par scripts/preparer-argumentaires.py — ne pas
 * éditer à la main.
 */

/** Argumentaire d'une niche du fichier de prospection. */
export type ArgumentaireNiche = {
  /** Identifiant du fichier (ex. « #11 ») — rejoint NicheProspection.cle. */
  cle: string;
  /** Service recommandé par le fichier (ex. « Site vitrine — portfolio + preuves… »). */
  service: string;
  /** Bénéfice client — promesse de l'objet de l'email personnalisé. */
  benefice: string;
  /** « Pourquoi ça marche » : arguments du fichier pour cette niche. */
  pourquoiCaMarche: string;
};

/** Argumentaires des 25 niches (clé = cle de NicheProspection). */
export const ARGUMENTAIRES_NICHES: ArgumentaireNiche[] = [
''' + '\n'.join(blocs) + '''
];

/** L'argumentaire d'une niche (null si la clé n'est pas du fichier). */
export function argumentaireDe(cle: string | undefined | null): ArgumentaireNiche | null {
  if (!cle) return null;
  return ARGUMENTAIRES_NICHES.find((a) => a.cle === cle) ?? null;
}
'''

with open('src/lib/scraping/argumentaires.ts', 'w', encoding='utf-8') as f:
    f.write(contenu)
print(f'argumentaires.ts : {len(entrees)} niches')
