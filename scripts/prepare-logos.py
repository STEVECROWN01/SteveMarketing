#!/usr/bin/env python3
"""Prépare les logos officiels uploadés (Logo blanc/noir/Favicon) :
- version blanche sur fond transparent (pour pastille sombre du header)
- version noire sur fond transparent (fonds clairs / email)
- favicon PNG optimisée
Source : fichiers uploadés par l'éditeur sur GitHub (public/assets/)."""

from PIL import Image

SRC = "/home/z/my-project/public/assets"


def to_transparent(src: str, mode: str) -> Image.Image:
    """mode 'white_art' : art blanc sur fond noir -> alpha = luminance.
    mode 'black_art' : art noir sur fond blanc -> alpha = 255 - luminance."""
    im = Image.open(src).convert("RGBA")
    r, g, b, _ = im.split()
    # luminance approximée par le canal rouge (art monochrome)
    if mode == "white_art":
        alpha = r
        color = Image.new("L", r.size, 255)
    else:
        alpha = r.point(lambda v: 255 - v)
        color = Image.new("L", r.size, 0)
    out = Image.merge("RGBA", (color, color, color, alpha))
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    return out


def save(im: Image.Image, path: str, width: int) -> None:
    ratio = width / im.width
    im = im.resize((width, max(1, round(im.height * ratio))), Image.LANCZOS)
    im.save(path, "PNG", optimize=True)
    print(path, im.size)


# Logo blanc (header / footer sur fond sombre)
blanc = to_transparent(f"{SRC}/Logo blanc.png", "white_art")
save(blanc, f"{SRC}/logo-blanc.png", 220)

# Logo noir (fonds clairs — email, impression)
noir = to_transparent(f"{SRC}/Logo noir.png", "black_art")
save(noir, f"{SRC}/logo-noir.png", 220)

# Favicon (source déjà RGBA carrée)
fav = Image.open(f"{SRC}/Logo Favicon.png").convert("RGBA")
bbox = fav.getbbox()
if bbox:
    fav = fav.crop(bbox)
side = max(fav.size)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.paste(fav, ((side - fav.width) // 2, (side - fav.height) // 2), fav)
save(canvas, f"{SRC}/favicon.png", 256)

print("OK")
