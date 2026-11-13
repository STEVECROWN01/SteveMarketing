#!/usr/bin/env python3
"""Analyse pixelaire des captures — vérifie les corrections du lot E."""
from PIL import Image
import os

def analyze(path, what):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    print(f"\n=== {os.path.basename(path)} ({w}x{h}) — {what} ===")
    return im, w, h

# --- d1 hero : fondu bas du hero (doit être court ~48/56px, pas 112) ---
im, w, h = analyze("/tmp/shots/d1-hero.png", "hero desktop")
# Cherche depuis le bas : lignes quasi uniformes ~ #1c1c1c
# Le hero se termine à y=h; regarde la teinte des 60 dernières lignes
for y in [h - 4, h - 30, h - 60, h - 90]:
    row = [im.getpixel((x, y)) for x in range(0, w, w // 12)][:12]
    print(f"  y={h - (h - y)}: {row[:6]}")

# --- séparateurs : trait 1px au centre, plus clair au centre qu'aux bords ---
for path, name in [("/tmp/shots/d2-sep1.png", "sep1 (POUR QUI / ACTIVITÉ)"),
                   ("/tmp/shots/d4-sep2.png", "sep2 (FONCTIONNE / VALEUR)")]:
    im, w, h = analyze(path, name)
    # scan vertical : trouver la ligne la plus claire au centre-x
    best = None
    for y in range(h):
        c = im.getpixel((w // 2, y))
        lum = sum(c) / 3
        if best is None or lum > best[1]:
            best = (y, lum)
    y, lum = best
    center = im.getpixel((w // 2, y))
    edge = im.getpixel((8, y))
    edge2 = im.getpixel((w - 8, y))
    print(f"  ligne la plus claire y={y} lum={lum:.0f} centre={center} bords=({edge},{edge2})")
    print(f"  -> centre plus clair que bords: {sum(center)/3 > sum(edge)/3 + 8}")

# --- d3 questioning : bloc gauche + bandes à droite ---
im, w, h = analyze("/tmp/shots/d3-questioning.png", "questioning")
# le titre à gauche: colonne x~100 devrait contenir du texte sombre;
# à droite, cartes blanches (bords) → détecter colonnes claires à droite
y = h // 3
left_px = [im.getpixel((x, y)) for x in range(40, 400, 60)]
right_px = [im.getpixel((x, y)) for x in range(w - 400, w - 40, 60)]
print(f"  gauche y={y}: {left_px[:4]}")
print(f"  droite y={y}: {right_px[:4]}")

# --- d5 quisuisje : image épinglée paysage ---
im, w, h = analyze("/tmp/shots/d5-quisuisje.png", "QUI SUIS-JE")
print(f"  taille {w}x{h}")

# --- glow : position du point lumineux dans les 3 captures ---
glow_positions = []
for path in ["/tmp/shots/d6-glow1.png", "/tmp/shots/d7-glow2.png", "/tmp/shots/d8-glow3.png"]:
    im, w, h = analyze(path, "glow")
    # cherche le pixel le plus lumineux de toute l'image
    best = (0, 0, 0)
    for y in range(0, h, 2):
        for x in range(0, w, 4):
            c = im.getpixel((x, y))
            if sum(c) > best[2]:
                best = (x, y, sum(c))
    print(f"  pixel le plus lumineux: x={best[0]} y={best[1]} lum={best[2]/3:.0f} rgb={im.getpixel((best[0], best[1]))}")
    glow_positions.append(best[0])
print(f"\npositions x successives du max de lueur: {glow_positions}")
print(f"-> déplacement gauche→droite: {glow_positions == sorted(glow_positions) and len(set(glow_positions)) == 3}")

# --- mobile hero ---
im, w, h = analyze("/tmp/shots/m1-hero.png", "hero mobile")
im2, w2, h2 = analyze("/tmp/shots/m2-questioning.png", "questioning mobile")
