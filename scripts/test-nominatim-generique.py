#!/usr/bin/env python3
"""Teste des mots-clés génériques sur Nominatim (scraping sans niche)."""
import json, time, urllib.parse, urllib.request

UA = "SteveMarketing-Scraping/1.0 (back-office; https://stevensakpovi.vercel.app)"
# viewbox Paris : ouest,haut,est,bas
VIEWBOX = "2.25,48.9,2.42,48.8"

def tester(q):
    url = ("https://nominatim.openstreetmap.org/search?q=" + urllib.parse.quote(q) +
           "&format=jsonv2&limit=8&extratags=1&addressdetails=1&bounded=1&viewbox=" + VIEWBOX)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            d = json.loads(r.read().decode())
    except Exception as e:
        print(f"  q={q!r} ERREUR {e}")
        return
    noms = [f"{x.get('name','?')[:28]}" for x in d if x.get("name")]
    print(f"  q={q!r} → {len(noms)} résultats : {noms[:6]}")

for q in ["entreprise", "construction", "bâtiment", "santé", "commerce", "services", "artisan"]:
    tester(q)
    time.sleep(1.2)
