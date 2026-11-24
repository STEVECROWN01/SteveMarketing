#!/usr/bin/env python3
"""
VOLET 14 (24/11/2026) — Favicon à FOND NOIR conservé + coins arrondis.

Demande de l'éditeur : « je veux que tu utilises le favicon ayant un
fond arrière noir que j'ai uploadé dans le projet. Je veux que tu
l'utilises tel qu'il est, sans supprimer le fond arrière noir. Donc
maintiens le fond arrière noir. Mais tu vas rogner ça pour que ça ait
des border radius, le favicon ait des border radius, le fond arrière
noir ait des border radius. »

Source : public/assets/Logo Favicon.png (1254×1254, RGB, fond noir
plein — l'original uploadé par l'éditeur). Le fichier
public/assets/favicon.png (fond SUPPRIMÉ, glyphe transparent, mis en
place le 14/11) est REMPLACÉ dans les métadonnées par la version
ci-dessous : fond noir conservé tel quel, seul un masque de coins
arrondis (rayon ≈ 22 % du côté, style icône applicative) est appliqué.
Les coins deviennent transparents (RGBA) — le reste de l'image est
strictement inchangé, pixel pour pixel.

Sortie : public/assets/favicon-fond-noir-2026-11-24.png (512×512,
nom daté selon la convention du projet : les navigateurs et les edges
rechargent l'icône au lieu de servir leur cache).
"""

from PIL import Image, ImageDraw

SRC = "public/assets/Logo Favicon.png"
OUT = "public/assets/favicon-fond-noir-2026-11-24.png"
RAYON_PCT = 0.22  # rayon des coins ≈ 22 % du côté (arrondi app-icon)
TAILLE = 512      # taille de sortie (favicon standard moderne)

img = Image.open(SRC).convert("RGB")
cote = min(img.size)

# 1. Recadrage carré centré (l'original est déjà carré — no-op de
#    sécurité).
left = (img.width - cote) // 2
top = (img.height - cote) // 2
img = img.crop((left, top, left + cote, top + cote))

# 2. Réduction à la taille de sortie (Lanczos : net à 512 px).
img = img.resize((TAILLE, TAILLE), Image.LANCZOS)

# 3. Masque de coins arrondis, dessiné en 4× puis réduit (anti-alias).
rayon = round(TAILLE * RAYON_PCT)
ss = 4
masque = Image.new("L", (TAILLE * ss, TAILLE * ss), 0)
ImageDraw.Draw(masque).rounded_rectangle(
    (0, 0, TAILLE * ss - 1, TAILLE * ss - 1), radius=rayon * ss, fill=255
)
masque = masque.resize((TAILLE, TAILLE), Image.LANCZOS)

# 4. Application : les QUATRE coins deviennent transparents, le fond
#    noir de l'original est conservé partout ailleurs tel quel.
sortie = Image.new("RGBA", (TAILLE, TAILLE))
sortie.paste(img, (0, 0))
sortie.putalpha(masque)
sortie.save(OUT, optimize=True)

# Contrôle : coins transparents, centre = fond noir de l'original.
px = sortie.load()
print(f"OK : {OUT} ({TAILLE}×{TAILLE}, rayon {rayon}px = {RAYON_PCT:.0%})")
print(f"  coin haut-gauche (doit être transparent) : {px[0, 0]}")
print(f"  coin bas-droit   (doit être transparent) : {px[TAILLE - 1, TAILLE - 1]}")
print(f"  bord haut centre (doit être noir opaque) : {px[TAILLE // 2, 0]}")
