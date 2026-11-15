#!/usr/bin/env python3
"""Conversion du portrait horizontal fourni par l'éditeur (14/11/2026,
public/assets/stevens-akpovi-portrait-long.png, 1672x941, PNG 1,8 Mo)
en WebP optimisé pour le nouveau hero horizontal (16/11/2026).

Conventions du projet (scripts/optimize-images.py) : photos en q90,
méthode 6. Le PNG source reste dans le dépôt comme archive.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "stevens-akpovi-portrait-long.png"
DST = ROOT / "public" / "assets" / "stevens-akpovi-portrait-long.webp"


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    print(f"Source : {SRC.name} {img.size} {SRC.stat().st_size / 1024:.0f} Ko")
    DST.parent.mkdir(parents=True, exist_ok=True)
    # q90 méthode 6 — netteté photo, comme tous les dérivés WebP du site.
    img.save(DST, "WEBP", quality=90, method=6)
    print(f"Sortie : {DST.name} {DST.stat().st_size / 1024:.0f} Ko")


if __name__ == "__main__":
    main()
