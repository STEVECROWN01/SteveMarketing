#!/usr/bin/env python3
"""Purge de l'accent beige #c9baac — demande de l'éditeur (13/11/2026) :
- boutons beige -> blanc #ffffff (style du bouton « Démarrer Un Projet »)
- tout le reste (statique, survol, bordures, fonds, icônes) -> #e4e4e4
  (couleur de survol du bouton blanc de référence)
Les survols des boutons blancs de référence (bordure beige au survol)
sont explicitement préservés (« à part ces boutons »).
"""
import pathlib

SRC = pathlib.Path("/home/z/my-project/src")
TOKEN = "ghp_PURGED"

# 1. Sous-chaînes protégées : survols beige des boutons blancs de référence
PROTECT = {
    "layout/Header.tsx": [("hover:border-[#c9baac] focus-visible:outline-2", "@@KEEP1@@")],
    "marketing/ProjectCard.tsx": [("hover:border-[#c9baac] [&::before]:bg-[#e4e4e4]", "@@KEEP2@@")],
    "marketing/Marketing.tsx": [("hover:border-[#c9baac] [&::before]:bg-[#e4e4e4]", "@@KEEP2@@")],
}

# 2. Après remplacement mécanique : conversion des boutons beige -> blanc
BUTTON_FIXES = {
    "marketing/Marketing.tsx": [
        (
            '"bg-[#e4e4e4] text-[#1c1c1c] shadow-[0_14px_34px_-14px_rgba(228,228,228,0.5)] [&::before]:bg-[#e4e4e4]"',
            '"bg-white text-[#1c1c1c] border border-[#e4e4e4] hover:border-[#c9baac] [&::before]:bg-[#e4e4e4]"',
        ),
        (
            "« Réserver Un Appel (30 Min) »",
            "« Réserver Un Appel »",
        ),
    ],
    "forms/LeadForm.tsx": [
        (
            "rounded-full bg-[#e4e4e4] px-7 py-4 font-medium text-[#1c1c1c]",
            "rounded-full border border-[#e4e4e4] bg-white px-7 py-4 font-medium text-[#1c1c1c] hover:border-[#c9baac]",
        ),
    ],
    "pages/AdminPage.tsx": [
        (
            "rounded-full bg-[#e4e4e4] px-6 py-4 font-medium text-[#1c1c1c]",
            "rounded-full border border-[#e4e4e4] bg-white px-6 py-4 font-medium text-[#1c1c1c] hover:border-[#c9baac]",
        ),
        (
            "rounded-full bg-[#e4e4e4] px-5 py-2.5 text-sm font-medium text-[#1c1c1c]",
            "rounded-full border border-[#e4e4e4] bg-white px-5 py-2.5 text-sm font-medium text-[#1c1c1c] hover:border-[#c9baac]",
        ),
        (
            '? "bg-[#e4e4e4] text-[#1c1c1c]" :',
            '? "border border-[#e4e4e4] bg-white text-[#1c1c1c]" :',
        ),
    ],
    "calendly/CalendlyContext.tsx": [
        (
            "rounded-full bg-[#e4e4e4] text-[#1c1c1c] transition-transform duration-300 hover:scale-105",
            "rounded-full border border-[#e4e4e4] bg-white text-[#1c1c1c] hover:border-[#c9baac] transition-transform duration-300 hover:scale-105",
        ),
    ],
}

changed = {}

for path in sorted(SRC.rglob("*.ts*")):
    rel = str(path.relative_to(SRC))
    text = path.read_text(encoding="utf-8")
    original = text

    # protections
    for key, pairs in PROTECT.items():
        if rel == key:
            for old, ph in pairs:
                text = text.replace(old, ph)

    # remplacement mécanique beige -> gris clair (#e4e4e4)
    text = text.replace("#c9baac", "#e4e4e4")
    text = text.replace("rgba(201,186,172", "rgba(228,228,228")
    text = text.replace("rgba(201, 186, 172", "rgba(228, 228, 228")

    # restauration des protections
    for key, pairs in PROTECT.items():
        if rel == key:
            for old, ph in pairs:
                text = text.replace(ph, old)

    # fixes de boutons (après purge) : beige -> blanc
    for key, fixes in BUTTON_FIXES.items():
        if rel == key:
            for old, new in fixes:
                if old in text:
                    text = text.replace(old, new)
                else:
                    print(f"[WARN] motif introuvable dans {rel}: {old[:70]}")

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed[rel] = sum(
            1 for i in range(min(len(original), len(text)))
            if i >= len(original) or i >= len(text) or original[i] != text[i]
        )

print(f"{len(changed)} fichiers modifiés :")
for rel, n in sorted(changed.items()):
    print(f"  {rel}")
