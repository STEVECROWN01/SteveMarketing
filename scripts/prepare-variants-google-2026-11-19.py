#!/usr/bin/env python3
"""Volet 8 de l'audit intégral (19/11/2026) — Google.

Génère les variantes d'images signalées par Lighthouse (audit
image-delivery, émulation mobile PSI) et le favicon.ico manquant :

1. mrsteveenglish-desktop-640.webp
   Mockup navigateur du hero : affiché à 130-290 px CSS, plus
   petite source srcset = 1440 px (80 Ko). Candidat 640 px
   (couvre 130 px × DPR 3 = 390 px, 290 px × DPR 2 = 580 px et
   230 px × DPR 2 = 460 px).
2. afribayit-mobile-290.webp
   Mockup téléphone du hero : affiché à 68-145 px CSS, plus petite
   source = 390 px (52 Ko). Candidat 290 px (couvre 68 × DPR 3 =
   204 px et 145 × DPR 2 = 290 px).
3. public/favicon.ico
   Le site déclare link rel=icon en PNG (Google et les navigateurs
   modernes l'utilisent), mais tout outil qui demande /favicon.ico
   par convention (scrappers, anciens lanceurs) obtenait une 404.
   ICO multi-tailles 16/32/48 dérivé du favicon.png 512 RGBA.

Sources = PNG originaux du dépôt (jamais un webp re-compressé).

ABANDON DOCUMENTÉ — variantes responsives du portrait hero
(stevens-akpovi-portrait-long-836/1170.webp) : générées puis
RETIRÉES après A/B sous Lighthouse (Slow 4G). Le srcset+sizes sur
CETTE image (loading=lazy, h-auto w-full) provoquait un CLS 0,136
(seuil Google 0,1) dans 1 à 2 runs sur 3 — la boîte n'est pas
réservée avant le choix du candidat, et la grille items-center du
hero déplace tout son contenu (~208 px). Sans srcset : CLS 0
(6/6 runs + sonde dédiée 12/12). Le gain de bande passante est
capté sur les mockups, mesurés sûrs. Voir Hero.tsx.
"""

from PIL import Image
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
PUBLIC = os.path.join(ROOT, "public")


def derive_webp(src_rel: str, out_rel: str, width: int, quality: int) -> dict:
    src = os.path.join(PUBLIC, src_rel)
    out = os.path.join(PUBLIC, out_rel)
    im = Image.open(src).convert("RGB")
    height = round(im.height * width / im.width)
    small = im.resize((width, height), Image.LANCZOS)
    small.save(out, "WEBP", quality=quality, method=6)
    return {
        "fichier": out_rel,
        "dimensions": f"{width}x{height}",
        "octets": os.path.getsize(out),
        "source": src_rel,
    }


def derive_ico(src_rel: str, out_rel: str, tailles: list) -> dict:
    src = os.path.join(PUBLIC, src_rel)
    out = os.path.join(PUBLIC, out_rel)
    im = Image.open(src).convert("RGBA")
    im.save(out, format="ICO", sizes=[(t, t) for t in tailles])
    return {
        "fichier": out_rel,
        "tailles": tailles,
        "octets": os.path.getsize(out),
        "source": src_rel,
    }


resultats = []

resultats.append(
    derive_webp(
        "assets/projects/sources/raw-mrsteveenglish-desktop.png",
        "assets/projects/mrsteveenglish-desktop-640.webp",
        640,
        85,
    )
)
resultats.append(
    derive_webp(
        "assets/projects/sources/raw-afribayit-mobile.png",
        "assets/projects/afribayit-mobile-290.webp",
        290,
        85,
    )
)
resultats.append(
    derive_ico("assets/favicon.png", "favicon.ico", [16, 32, 48])
)

# Rapport lisible
print("=== Variantes générées (volet 8 — Google) ===")
for r in resultats:
    if "dimensions" in r:
        print(f"  {r['fichier']}: {r['dimensions']}, {r['octets']} octets (source {r['source']})")
    else:
        print(f"  {r['fichier']}: tailles {r['tailles']}, {r['octets']} octets (source {r['source']})")

# Vérification : chaque fichier existe, non vide, dimensions exactes
print("\n=== Vérification ===")
ok = True
attendus = {
    "assets/projects/mrsteveenglish-desktop-640.webp": 640,
    "assets/projects/afribayit-mobile-290.webp": 290,
}
for rel, w in attendus.items():
    p = os.path.join(PUBLIC, rel)
    im = Image.open(p)
    valide = im.width == w and os.path.getsize(p) > 0
    ok = ok and valide
    print(f"  {rel}: {im.size[0]}x{im.size[1]} {'OK' if valide else 'ERREUR'}")
ico = os.path.join(PUBLIC, "favicon.ico")
im_ico = Image.open(ico)
valide_ico = im_ico.width == 48 and os.path.getsize(ico) > 0
ok = ok and valide_ico
print(f"  favicon.ico: {im_ico.size[0]}px (max des tailles embarquées) {'OK' if valide_ico else 'ERREUR'}")
print("\nRESULTAT:", "TOUT OK" if ok else "ECHEC")
raise SystemExit(0 if ok else 1)
