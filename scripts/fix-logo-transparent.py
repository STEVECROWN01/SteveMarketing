#!/usr/bin/env python3
"""
Régénère les logos officiels en PNG RGBA TRANSPARENTS.

Contexte (demande de l'éditeur, 15/11/2026) : le logo de l'en-tête
affichait un fond noir — logo-blanc.png (440x352, RGB sans canal alpha)
contenait un rectangle noir (0,0,0) BAKÉ dans le fichier. Il apparaissait
derrière le logo dans la pastille d'en-tête et le pied de page.

Traitement « de-premultiplication » (même technique que le favicon,
commit b323d57) :
- logo-blanc (logo blanc sur fond noir) : alpha = luminance, RGB = blanc.
- logo-noir  (logo noir sur fond blanc) : alpha = 255 - luminance, RGB = noir.
Les bords anti-aliasés restent lisses (alpha proportionnel).

Redimensionnement : hauteur 240 px (affichage max 64 px CSS → 192 px @3x)
— le fichier de 452 Ko passe à quelques kilo-octets (performance).
"""
from PIL import Image

SRC_BLANC = "public/assets/logo-blanc.png"
SRC_NOIR = "public/assets/logo-noir.png"
TARGET_H = 240


def unmultiply_white_on_black(im: Image.Image) -> Image.Image:
    """Logo blanc sur fond noir → RGBA : blanc, alpha=luminance."""
    rgb = im.convert("RGB")
    px = rgb.load()
    out = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    opx = out.load()
    for y in range(rgb.size[1]):
        for x in range(rgb.size[0]):
            r, g, b = px[x, y]
            # Luminance max des canaux : robuste pour un logo blanc/gris
            a = max(r, g, b)
            opx[x, y] = (255, 255, 255, a)
    return out


def unmultiply_black_on_white(im: Image.Image) -> Image.Image:
    """Logo noir sur fond blanc → RGBA : noir, alpha=255-luminance."""
    rgb = im.convert("RGB")
    px = rgb.load()
    out = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    opx = out.load()
    for y in range(rgb.size[1]):
        for x in range(rgb.size[0]):
            r, g, b = px[x, y]
            lum = (r * 299 + g * 587 + b * 114) // 1000
            a = 255 - lum
            opx[x, y] = (0, 0, 0, a)
    return out


def resize_rgba(im: Image.Image) -> Image.Image:
    w, h = im.size
    if h <= TARGET_H:
        return im
    nw = round(w * TARGET_H / h)
    return im.resize((nw, TARGET_H), Image.LANCZOS)


def report(path: str):
    import os
    im = Image.open(path)
    w, h = im.size
    alpha = im.getchannel("A")
    hist = alpha.histogram()
    transparent = sum(hist[:8])
    print(f"{path}: {w}x{h} {im.mode} {os.path.getsize(path)//1024} Ko — "
          f"pixels transparents {transparent/(w*h):.1%}")


for src, fn in ((SRC_BLANC, unmultiply_white_on_black),
                (SRC_NOIR, unmultiply_black_on_white)):
    im = Image.open(src)
    rgba = fn(im)
    rgba = resize_rgba(rgba)
    rgba.save(src, optimize=True)
    report(src)
print("OK — logos régénérés en RGBA transparents")
