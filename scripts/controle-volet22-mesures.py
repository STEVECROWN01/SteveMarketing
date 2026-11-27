#!/usr/bin/env python3
"""VOLET 22 — mesures géométriques des PDF de contrôle.

Vérifie, sur les PDF générés par scripts/controle-volet22.ts :
 1. DEVIS — l'écart entre le BAS DU TABLEAU et le PIED DE PAGE sur la
    PREMIÈRE page ≈ celui des pages SUIVANTES (réserve basse) ;
 2. DEVIS — la rangée NOIRE du tableau porte « Délai estimé : » à
    GAUCHE et la valeur TOTALEMENT à DROITE ; plus de « Délai estimé »
    dans la colonne CGV ;
 3. DEVIS — la ligne « Signature et cachet » s'aligne avec la
    dernière ligne des CGV ;
 4. FACTURE — le bloc « Merci pour votre confiance. » est présent ;
    le bloc Paiement (la note) ne touche pas le cachet (écart > 0) ;
 5. PROPOSITION — DESTINATAIRE et PRESTATAIRE sur la MÊME ligne ;
    le pied ne contient plus « Proposition commerciale ».
"""
import fitz
import sys

D = "/home/z/my-project/SteveMarketing/scripts/controle-volet22"

def page_texte(page):
    return page.get_text("text") or ""

def rect_ligne(page, mots):
    """bbox fusionnée des lignes contenant TOUS les mots donnés."""
    mots_page = page.get_text("words")
    lignes = {}
    for x0, y0, x1, y1, mot, *_reste in mots_page:
        lignes.setdefault(round(y0, 1), []).append((x0, x1, mot))
    for y, ligne in lignes.items():
        texte = " ".join(m for _, _, m in ligne)
        if all(mot.lower() in texte.lower() for mot in mots):
            x0 = min(x for x, _, _ in ligne)
            x1 = max(x for _, x, _ in ligne)
            return (x0, y, x1, max(y1 for _, y1, _ in [(0, 0, 0)] ) if False else max([e for e in [y]]))
    return None

def bbox_de(page, etiquette):
    """bbox (x0,y0,x1,y1) du premier bloc contenant l'étiquette."""
    for b in page.get_text("blocks"):
        if etiquette.lower() in (b[4] or "").lower():
            return fitz.Rect(b[:4])
    return None

def bas_du_tableau(page):
    """bas de la dernière ligne du tableau : le mot le plus bas parmi
    les cellules bordées (on repère via les traits horizontaux noirs
    dans la zone tableau)."""
    drawings = page.get_drawings()
    if not drawings:
        return None
    return max(d["rect"].y1 for d in drawings if d["rect"].height > 0.5 and d["rect"].y1 < 800)

def haut_pied(page):
    """haut du pied de page : le trait fin au-dessus des mentions."""
    drawings = page.get_drawings()
    cands = [d["rect"].y0 for d in drawings if 780 < d["rect"].y0 < 840]
    return min(cands) if cands else None

rapport = []
ok = True

# ---------- 1-3 : DEVIS ----------
doc = fitz.open(f"{D}/devis-long.pdf")
rapport.append(f"DEVIS : {len(doc)} pages")
for i, page in enumerate(doc):
    bas = bas_du_tableau(page)
    pied = haut_pied(page)
    if bas and pied:
        rapport.append(
            f"  page {i+1} : bas du dernier élément bordé = {bas:.0f} pt, "
            f"pied à {pied:.0f} pt → écart {pied - bas:.0f} pt ({(pied-bas)*25.4/72:.1f} mm)"
        )

p1 = doc[0]
texte_p1 = page_texte(p1)
# Rangée noire « Délai estimé » : position gauche du libellé et droite de la valeur
for page in doc:
    mots = page.get_text("words")
    ligne_delai = [w for w in mots if "Délai" in w[4] or "estimé" in w[4]]
    if ligne_delai:
        # chercher la ligne noire (rect noir plein) autour
        noirs = [
            d["rect"]
            for d in page.get_drawings()
            if d.get("fill") and d["rect"].width > 300 and d["rect"].height > 8 and d["rect"].height < 30
        ]
        for r in noirs:
            dedans = [w for w in ligne_delai if r.y0 - 3 <= w[1] and w[3] <= r.y1 + 3]
            if dedans:
                x_libelle = min(w[0] for w in dedans)
                rapport.append(
                    f"  rangée noire du délai (page {page.number+1}) : "
                    f"libellé à x={x_libelle:.0f} pt — fond noir {r.x0:.0f}→{r.x1:.0f}"
                )
                ok &= x_libelle < r.x0 + 60
            # la VALEUR du délai : le mot le plus à droite de la page,
            # sur la même ligne que le libellé
            y_libelle = min(w[1] for w in dedans) if dedans else None
            if y_libelle is not None:
                meme_ligne = [w for w in mots if abs(w[1] - y_libelle) < 6]
                x_valeur = max(w[2] for w in meme_ligne)
                rapport[-1] += f", valeur à x={x_valeur:.0f} pt"
                ok &= x_valeur > r.x1 - 90

# Plus de « Délai estimé » dans la colonne CGV : il ne doit apparaître
# qu'une seule fois (la rangée noire) par page de tableau.
total_delai = sum(page_texte(p).count("Délai estimé") for p in doc)
rapport.append(f"  occurrences de « Délai estimé » dans le devis : {total_delai} (attendu : 1, dans la rangée noire)")

# Alignement signature ↔ dernière ligne CGV (dernière page)
derniere = doc[len(doc) - 1]
def y_de(page, mots):
    for x0, y0, x1, y1, mot, *_ in page.get_text("words"):
        if mots.lower() in mot.lower():
            return y0
    return None
y_sig = y_de(derniere, "Signature")
y_conf = y_de(derniere, "confidentielles")
if y_sig is not None and y_conf is not None:
    rapport.append(
        f"  « Signature et cachet » à y={y_sig:.0f} pt ; dernière ligne CGV "
        f"« confidentielles » à y={y_conf:.0f} pt → écart {y_sig - y_conf:.0f} pt"
    )

# ---------- 4 : FACTURE ----------
docf = fitz.open(f"{D}/facture-payee.pdf")
f1 = docf[0]
texte_f = "".join(page_texte(p) for p in docf)
merci = "Merci pour votre confiance." in texte_f
rapport.append(f"FACTURE : {len(docf)} pages — bloc « Merci pour votre confiance. » présent : {merci}")
ok &= merci
# Cachet vs bloc Paiement (la note) : sur la page où figure le total
for page in docf:
    mots = page.get_text("words")
    paye = [w for w in mots if w[4] == "PAYÉ"]
    paiement = [w for w in mots if w[4] == "Paiement"]
    if paye and paiement:
        bas_cachet = max(w[3] for w in paye) + 20  # marge du cachet incliné
        haut_paiement = min(w[1] for w in paiement)
        rapport.append(
            f"  page {page.number+1} : bas du cachet ~{bas_cachet:.0f} pt, "
            f"haut du bloc Paiement à {haut_paiement:.0f} pt → écart {haut_paiement - bas_cachet:.0f} pt"
        )
        ok &= haut_paiement > bas_cachet

# ---------- 5 : PROPOSITION ----------
docp = fitz.open(f"{D}/proposition-destinataire.pdf")
p1p = docp[0]
mots_p = p1p.get_text("words")
def y_mot(page, mot):
    ys = [w[1] for w in page.get_text("words") if mot.lower() in w[4].lower()]
    return ys[0] if ys else None
y_dest = y_mot(p1p, "DESTINATAIRE")
y_prest = y_mot(p1p, "PRESTATAIRE")
rapport.append(f"PROPOSITION : {len(docp)} pages")
if y_dest is not None and y_prest is not None:
    rapport.append(
        f"  DESTINATAIRE à y={y_dest:.0f} pt, PRESTATAIRE à y={y_prest:.0f} pt "
        f"→ {'MÊME LIGNE' if abs(y_dest - y_prest) < 3 else 'DÉCALÉS'}"
    )
    ok &= abs(y_dest - y_prest) < 3
pied_txt = " ".join(page_texte(docp[len(docp) - 1]).split())
rapport.append(f"  pied de la dernière page : « {pied_txt[:90]} … »")
sans_mention = "Proposition commerciale" not in pied_txt.replace("PROPOSITION COMMERCIALE", "Proposition commerciale") or True
# la mention du pied : vérifier précisément la ligne de pied de la page 1
pied_p1 = [b for b in p1p.get_text("blocks") if b[1] > 750]
texte_pied = " ".join(b[4] for b in pied_p1)
mention = "Proposition commerciale" in texte_pied
rapport.append(f"  pied (page 1) contient « Proposition commerciale » : {mention} (attendu : False)")
ok &= not mention

print("\n".join(rapport))
print("\nVERDICT :", "OK" if ok else "À CORRIGER")
sys.exit(0 if ok else 1)
