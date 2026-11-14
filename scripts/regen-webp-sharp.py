#!/usr/bin/env python3
"""Régénération des images webp du site en haute qualité (netteté).

Demande de l'éditeur (15/11/2026) : « à part le hero, les images
épinglées ne sont pas très claires/nettes comme d'origine ». Les
webp actuels ont été encodés trop bas en qualité — on les régénère
depuis les sources PNG avec :
  - rééchantillonnage LANCZOS (lorsqu'un redimensionnement est
    nécessaire — net, pas de flou de réduction) ;
  - qualité 88, method 6 (encodeur le plus soigné).

Le portrait du hero (image LCP, jugée nette par l'éditeur) et les
logos ne sont PAS retouchés. Les dimensions finales restent
strictement identiques aux fichiers actuels : aucun changement de
mise en page (ratios et attributs width/height inchangés).
"""
from PIL import Image
import os

JOBS = [
    # (source PNG, webp cible, dimensions finales cibles)
    ("public/assets/problem-no-website.png", "public/assets/problem-no-website.webp", (1024, 1536)),
    ("public/assets/problem-ineffective-website.png", "public/assets/problem-ineffective-website.webp", (1280, 853)),
    ("public/assets/stevens-strategy-work.png", "public/assets/stevens-strategy-work.webp", (1280, 853)),
    ("public/assets/benefit-business-growth.png", "public/assets/benefit-business-growth.webp", (1280, 853)),
    ("public/assets/stevens-akpovi-workspace.png", "public/assets/stevens-akpovi-workspace.webp", (1536, 1024)),
    ("public/assets/APROPOS-PORTRAIT.png", "public/assets/apropos-portrait.webp", (1024, 1536)),
]

PROJECTS = ["mrsteveenglish", "prelaunch", "afribayit"]
for p in PROJECTS:
    JOBS.append((f"public/assets/projects/sources/raw-{p}-desktop.png",
                 f"public/assets/projects/{p}-desktop.webp", (1440, 900)))
    JOBS.append((f"public/assets/projects/sources/raw2x-{p}-desktop.png",
                 f"public/assets/projects/{p}-desktop@2x.webp", (1920, 1200)))
    JOBS.append((f"public/assets/projects/sources/raw-{p}-mobile.png",
                 f"public/assets/projects/{p}-mobile.webp", (390, 844)))
    JOBS.append((f"public/assets/projects/sources/raw2x-{p}-mobile.png",
                 f"public/assets/projects/{p}-mobile@2x.webp", (780, 1688)))


def encode(src: str, dst: str, size: tuple[int, int], quality: int) -> int:
    im = Image.open(src).convert("RGB")
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    im.save(dst, "WEBP", quality=quality, method=6)
    return os.path.getsize(dst)


print(f"{'fichier':55s} {'avant':>9s} {'après':>9s} {'q':>4s}")
for src, dst, size in JOBS:
    if not os.path.exists(src):
        print(f"{'?? source manquante: ' + src:55s}")
        continue
    before = os.path.getsize(dst) if os.path.exists(dst) else 0
    quality = 88
    after = encode(src, dst, size, quality)
    # Garde-fou poids : si le fichier double presque, on descend d'un cran.
    if before and after > 1.9 * before:
        quality = 84
        after = encode(src, dst, size, quality)
    print(f"{os.path.basename(dst):55s} {before/1024:8.0f}K {after/1024:8.0f}K {quality:4d}")
print("Terminé.")
