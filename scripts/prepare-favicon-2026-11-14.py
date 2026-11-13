#!/usr/bin/env python3
"""Favicon du lot 2026-11-14 :
1. Régénération de public/assets/favicon.png depuis le « Logo
   Favicon.png » actuellement sur GitHub main (1254×1254) —
   512×512 RGBA Lanczos, optimisée.
2. Suppression de public/favicon.svg : ancienne marque « S. »
   beige (#c9baac — couleur purgée) plus référencée nulle part ;
   l'icône officielle sert via layout.tsx (icons.icon).
"""
from PIL import Image
import os
import hashlib

ROOT = "/home/z/my-project/public"

src_fav = os.path.join(ROOT, "assets", "Logo Favicon.png")
dst_fav = os.path.join(ROOT, "assets", "favicon.png")

fav = Image.open(src_fav)
if fav.mode != "RGBA":
    fav = fav.convert("RGBA")
fav = fav.resize((512, 512), Image.LANCZOS)
fav.save(dst_fav, "PNG", optimize=True)
print(f"favicon.png: {fav.size} {fav.mode} {os.path.getsize(dst_fav)//1024} KB")

md5 = hashlib.md5(Image.open(dst_fav).tobytes()).hexdigest()
print("favicon md5:", md5[:12])

svg = os.path.join(ROOT, "favicon.svg")
if os.path.exists(svg):
    os.remove(svg)
    print("favicon.svg supprimé (ancienne marque beige, non référencée)")
