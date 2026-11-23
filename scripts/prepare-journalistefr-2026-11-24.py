#!/usr/bin/env python3
"""Conversion des captures JOURNALISTEFR en WebP (volet 13, 24/11/2026).
Pipeline identique aux autres projets : qualité 82, dimensions
exactes 1440×900 / 1920×1200 / 390×844 / 780×1688, cible de poids
45-140 Ko (fourchette des assets existants)."""
from PIL import Image
import os

SRC = "/tmp/journalistefr"
DST = "public/assets/projects"
ATTENDU = {
    "journalistefr-desktop.png": ("journalistefr-desktop.webp", (1440, 900)),
    "journalistefr-desktop@2x.png": ("journalistefr-desktop@2x.webp", (1920, 1200)),
    "journalistefr-mobile.png": ("journalistefr-mobile.webp", (390, 844)),
    "journalistefr-mobile@2x.png": ("journalistefr-mobile@2x.webp", (780, 1688)),
}

for src_name, (dst_name, size) in ATTENDU.items():
    p = os.path.join(SRC, src_name)
    im = Image.open(p).convert("RGB")
    assert im.size == size, f"{src_name}: {im.size} != {size} attendu"
    out = os.path.join(DST, dst_name)
    im.save(out, "WEBP", quality=82, method=6)
    ko = os.path.getsize(out) // 1024
    print(f"{dst_name:36s} {im.size[0]}x{im.size[1]:5d} {ko:4d} Ko")
print("OK")
