#!/usr/bin/env python3
"""Optimisation des images : conversion WebP + dimensions adaptées.
Les fichiers sources PNG sont préservés ; les versions WebP sont créées à côté.

ATTENTION (14/11/2026) — ce script est le point d'entrée HISTORIQUE ;
la génération courante des dérivés est faite par regen-images-hd.py
(qualité 90 pour les photos, 95 pour les captures, dérivés @2x pour
les écrans Retina). Ne JAMAIS repasser en qualité < 90 : la qualité
82-84 d'origine est la cause du manque de netteté constaté par
l'éditeur (« les images ne sont pas aussi nettes que les originales,
mobile/desktop »). Les valeurs ci-dessous ont été relevées en
conséquence.
"""
import os
from PIL import Image

ASSETS = "/home/z/my-project/public/assets"
PROJECTS = os.path.join(ASSETS, "projects")

# --- 1. Assets GitHub : conversion WebP, largeur max adaptée ---
GITHUB_ASSETS = {
    "benefit-business-growth.png": 1280,        # paysage 1536x1024
    "problem-ineffective-website.png": 1280,    # paysage
    "problem-no-website.png": 900,               # portrait 1024x1536
    "stevens-akpovi-portrait.png": 1024,        # portrait officiel
    "stevens-akpovi-workspace-desktop.png": 1100,
    "stevens-akpovi-workspace-mobile.png": 1280,
    "stevens-strategy-work.png": 1280,
}

for name, max_w in GITHUB_ASSETS.items():
    src = os.path.join(ASSETS, name)
    dst = os.path.join(ASSETS, os.path.splitext(name)[0] + ".webp")
    im = Image.open(src)
    if im.mode != "RGB":
        im = im.convert("RGB")
    if im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    im.save(dst, "WEBP", quality=90, method=6)
    print(f"{name} -> {os.path.basename(dst)} {im.size} {round(os.path.getsize(dst)/1024)}KB")

# --- 2. Captures projets : conversion WebP ---
CAPTURES = {
    "raw-mrsteveenglish-desktop.png": ("mrsteveenglish-desktop.webp", 1440),
    "raw-mrsteveenglish-mobile.png": ("mrsteveenglish-mobile.webp", 390),
    "raw-prelaunch-desktop.png": ("prelaunch-desktop.webp", 1440),
    "raw-prelaunch-mobile.png": ("prelaunch-mobile.webp", 390),
    "raw-afribayit-desktop.png": ("afribayit-desktop.webp", 1440),
    "raw-afribayit-mobile.png": ("afribayit-mobile.webp", 390),
}

for raw, (out, max_w) in CAPTURES.items():
    src = os.path.join(PROJECTS, raw)
    dst = os.path.join(PROJECTS, out)
    im = Image.open(src)
    if im.mode != "RGB":
        im = im.convert("RGB")
    if im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    im.save(dst, "WEBP", quality=95, method=6)
    print(f"{raw} -> {out} {im.size} {round(os.path.getsize(dst)/1024)}KB")

print("\nRépertoire final :")
for root, dirs, files in os.walk(ASSETS):
    for f in sorted(files):
        if f == ".gitkeep":
            continue
        p = os.path.join(root, f)
        print(f"  {os.path.relpath(p, ASSETS)} {round(os.path.getsize(p)/1024)}KB")
