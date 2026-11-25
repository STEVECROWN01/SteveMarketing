#!/usr/bin/env python3
"""VOLET 19 — Mesures du PDF d'exemple (proposition commerciale).
Extrait : logo page 1 (taille/position), logo en-têtes pages 2+,
filigrane (taille/position), titre page 1 (bbox), pour calibrer le
rendu HTML exactement sur l'exemple de l'éditeur.
"""
import fitz

PDF = "/home/z/my-project/upload/Proposition_commerciale_Éric_De_Lavarene.pdf"
doc = fitz.open(PDF)
print(f"pages: {doc.page_count}")
for i, page in enumerate(doc):
    print(f"\n===== PAGE {i+1} (MediaBox: {page.rect}) =====")
    images = page.get_images(full=True)
    for img in images:
        xref = img[0]
        rects = page.get_image_rects(xref)
        base = doc.extract_image(xref)
        for r in rects:
            print(
                f"  image xref={xref} {base['width']}x{base['height']}px "
                f"-> rect pt: x0={r.x0:.1f} y0={r.y0:.1f} x1={r.x1:.1f} y1={r.y1:.1f} "
                f"(w={r.width:.1f} h={r.height:.1f} pt)"
            )
    # texte du haut de page (titre / en-tête compact)
    d = page.get_text("dict")
    lines = []
    for bloc in d["blocks"]:
        if bloc["type"] != 0:
            continue
        for line in bloc["lines"]:
            for span in line["spans"]:
                y = span["bbox"][1]
                if y < 130 or i > 0:  # en-têtes
                    lines.append((y, span["bbox"], span["text"][:60], span["size"], span["font"], span.get("color")))
    for y, bbox, text, size, font, color in sorted(lines)[:12]:
        print(f"  span y={y:7.1f} bbox=({bbox[0]:.1f},{bbox[1]:.1f},{bbox[2]:.1f},{bbox[3]:.1f}) size={size:.1f} font={font} color={color:06x} text={text!r}")
doc.close()
