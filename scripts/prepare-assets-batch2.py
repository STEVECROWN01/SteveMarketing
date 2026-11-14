#!/usr/bin/env python3
"""Préparation des assets du lot 2026-11-13 (complément) :
1. stevens-akpovi-workspace.png (1536x1024, ~1,9 Mo) → version webp
   optimisée pour la page à propos (image épinglée).
2. favicon.png régénérée depuis le nouveau « Logo Favicon.png »
   uploadé par l'éditeur (1254x1254) — 512x512 RGBA optimisée.
"""
from PIL import Image
import os

ROOT = "/home/z/my-project/public/assets"

# --- 1. workspace → webp ---
src = os.path.join(ROOT, "stevens-akpovi-workspace.png")
dst = os.path.join(ROOT, "stevens-akpovi-workspace.webp")
im = Image.open(src).convert("RGB")
if im.width > 1536:
    ratio = 1536 / im.width
    im = im.resize((1536, round(im.height * ratio)), Image.LANCZOS)
im.save(dst, "WEBP", quality=82, method=6)
print(f"workspace.webp: {im.size} {os.path.getsize(dst)//1024} KB")

# --- 2. favicon depuis le nouveau Logo Favicon.png ---
src_fav = os.path.join(ROOT, "Logo Favicon.png")
dst_fav = os.path.join(ROOT, "favicon.png")
fav = Image.open(src_fav)
if fav.mode != "RGBA":
    fav = fav.convert("RGBA")
fav = fav.resize((512, 512), Image.LANCZOS)
fav.save(dst_fav, "PNG", optimize=True)
print(f"favicon.png: {fav.size} {fav.mode} {os.path.getsize(dst_fav)//1024} KB")

# Empreintes pour vérifier si le favicon source a réellement changé
import hashlib
old = hashlib.md5(Image.open(dst_fav).tobytes()).hexdigest()
print("favicon md5:", old[:12])
