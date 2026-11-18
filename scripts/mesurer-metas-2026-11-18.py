#!/usr/bin/env python3
"""Mesure des longueurs title/description de PAGES (src/lib/site.ts).
Audit SEO du 18/11/2026 — seuils Google : title ~60, description ~155."""
import re

SRC = "src/lib/site.ts"
text = open(SRC, encoding="utf-8").read()

# Isole le bloc export const PAGES = { ... } as const;
m = re.search(r"export const PAGES = \{(.*?)\n\} as const;", text, re.DOTALL)
if not m:
    raise SystemExit("Bloc PAGES introuvable")
block = m.group(1)

# Découpe par entrée de page (accueil: { ... },)
entries = re.findall(r"(\w+):\s*\{(.*?)\n  \},", block, re.DOTALL)
print(f"{'page':<14} {'title':>6} {'desc':>5}   titres > 60 ou descriptions > 155")
print("-" * 78)
over = []
for name, body in entries:
    tm = re.search(r'title:\s*"([^"]+)"', body)
    dm = re.search(r'description:\s*\n?\s*"([^"]+)"', body, re.DOTALL)
    title = tm.group(1) if tm else ""
    desc = dm.group(1) if dm else ""
    flag = []
    if len(title) > 60:
        flag.append(f"TITLE {len(title)}>60")
    if len(desc) > 155:
        flag.append(f"DESC {len(desc)}>155")
    if flag:
        over.append(name)
    print(f"{name:<14} {len(title):>6} {len(desc):>5}   {' · '.join(flag)}")

print("-" * 78)
print(f"Pages hors seuil : {', '.join(over) if over else 'aucune'}")
for name, body in entries:
    if name in over:
        tm = re.search(r'title:\s*"([^"]+)"', body)
        dm = re.search(r'description:\s*\n?\s*"([^"]+)"', body, re.DOTALL)
        print(f"\n[{name}] title ({len(tm.group(1))}) : {tm.group(1)}")
        print(f"[{name}] desc ({len(dm.group(1))}) : {dm.group(1)}")
