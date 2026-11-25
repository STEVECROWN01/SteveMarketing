#!/usr/bin/env python3
"""VOLET 19 — CORRECTIF FACTURE (26/11/2026) — SONDE LOCALE sur :3100.

Deux problèmes signalés par l'éditeur :
  1. la génération de facture demandait « la version anglaise ou
     française » → SUPPRIMÉ : la facture respecte la LANGUE DU DEVIS,
     sans aucun choix ;
  2. en production, la génération échouait : « input directory
     /var/task/node_modules/@sparticuz/chromium/bin does not exist »
     → corrigé par outputFileTracingIncludes (next.config.ts) ; la
     présente sonde vérifie le MÊME code que la prod (route PDF via
     Puppeteer) sur le serveur local.

Contrôles :
  F1  le bouton facture ouvre le modal SANS aucun choix de langue
      (« Version du PDF » a disparu)
  F2  génération DIRECTE au clic (téléchargement PDF, pas de menu)
  F3  DEVIS FRANÇAIS → facture en FRANÇAIS (PDF contient « Facture »,
      « TVA », « Non applicable » — pas « Invoice »)
  F4  DEVIS ANGLAIS → facture en ANGLAIS (PDF contient « Invoice »,
      « VAT », « Not applicable » — pas « Facture »)
  F5  nettoyage : les documents de test sont supprimés du stockage
"""

import asyncio
import io
import json
import re
import sys

import fitz  # PyMuPDF
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:3100"
MDP = "MotDePasseTest-Volet19"

resultats: list[tuple[str, str, str]] = []


def ok(cid: str, detail: str):
    resultats.append((cid, "PASS", detail))
    print(f"  ✓ {cid}  {detail}")


def echec(cid: str, detail: str):
    resultats.append((cid, "FAIL", detail))
    print(f"  ✗ {cid}  {detail}")


def verif(cid: str, condition: bool, detail: str, detail_echec: str = ""):
    if condition:
        ok(cid, detail)
    else:
        echec(cid, detail_echec or detail)


def corps_devis(langue: str, nom_client: str) -> dict:
    return {
        "docType": "devis",
        "langue": langue,
        "numeroClient": 99001 if langue == "fr" else 99002,
        "client": {
            "nom": nom_client,
            "entreprise": "",
            "ville": "Cotonou",
            "pays": "Bénin",
            "telephone": "+229 01 00 00 00 00",
            "email": "test@exemple.fr",
        },
        "objet": "Test facture volet 19",
        "intro": "Document de test du volet 19 — à supprimer.",
        "items": [
            {
                "type": "Service",
                "designation": "Prestation de test",
                "description": "<p>Prestation de vérification du correctif facture.</p>",
                "quantite": 1,
                "prixUnitaire": 1000,
            }
        ],
        "devise": "EUR",
        "delaiEstime": "02 à 03 semaines",
        "conditionsReglement": "À réception",
        "modePaiement": "Virement bancaire",
        "validiteJours": 5,
        "banque": {
            "titulaire": "TCHOGNON STEVENS AKPOVI",
            "iban": "MT33CFTE28904000000000006119777",
            "bic": "CFTEMTM1XXX",
        },
    }



async def creer_document(page, document: dict) -> dict:
    return await page.evaluate(
        """async (doc) => {
             const r = await fetch('/api/documents', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ document: doc }),
             });
             return { status: r.status, corps: await r.json() };
           }""",
        document,
    )


async def supprimer_document(page, id_doc: str) -> dict:
    return await page.evaluate(
        """async (id) => {
             const r = await fetch('/api/documents/' + id, { method: 'DELETE' });
             return { status: r.status, corps: await r.json() };
           }""",
        id_doc,
    )


async def generer_facture(page, numero_devis: str, chemin_pdf: str) -> bool:
    """Ouvre le modal de facturation du devis et génère → PDF téléchargé."""
    bouton = page.locator(f'button[aria-label="Générer la facture du devis {numero_devis}"]')
    await bouton.wait_for(state="visible", timeout=15000)
    await bouton.click()
    await page.wait_for_selector(
        f'[role="dialog"][aria-label="Générer la facture du devis {numero_devis}"]',
        timeout=10000,
    )
    await page.wait_for_timeout(400)

    # F1 : aucun dialogue de langue ne doit apparaître
    choix = await page.locator("text=Version du PDF").count()
    verif(
        "F1",
        choix == 0,
        "aucun choix de langue (dialogue « Version du PDF » supprimé)",
        f"dialogue de langue encore présent ({choix})",
    )

    # F2 : clic direct → téléchargement
    bouton_generer = page.locator('button:has-text("Générer la facture")')
    try:
        async with page.expect_download(timeout=120000) as info:
            await bouton_generer.click()
        telechargement = await info.value
        await telechargement.save_as(chemin_pdf)
        return True
    except Exception as e:
        echec("F2", f"aucun téléchargement : {e}")
        return False


def texte_pdf(chemin: str) -> str:
    doc = fitz.open(chemin)
    texte = " ".join(page.get_text() for page in doc)
    doc.close()
    return re.sub(r"\s+", " ", texte)


async def main():
    async with async_playwright() as pw:
        navigateur = await pw.chromium.launch()
        contexte = await navigateur.new_context(
            viewport={"width": 1440, "height": 900},
            locale="fr-FR",
            accept_downloads=True,
        )
        page = await contexte.new_page()
        page.set_default_timeout(25000)

        print("— connexion admin")
        await page.goto(f"{BASE}/#/admin", wait_until="load")
        await page.wait_for_selector("#admin-password")
        await page.fill("#admin-password", MDP)
        await page.click('button[type="submit"]')
        await page.wait_for_selector("text=Back-office")

        print("— création des devis de test (FR et EN)")
        rep_fr = await creer_document(page, corps_devis("fr", "TEST CLIENT FR"))
        rep_en = await creer_document(page, corps_devis("en", "TEST CLIENT EN"))
        numero_fr = (rep_fr["corps"].get("document") or {}).get("numero", "")
        numero_en = (rep_en["corps"].get("document") or {}).get("numero", "")
        id_fr = (rep_fr["corps"].get("document") or {}).get("id", "")
        id_en = (rep_en["corps"].get("document") or {}).get("id", "")
        verif(
            "F0",
            rep_fr["status"] == 200 and rep_en["status"] == 200 and numero_fr and numero_en,
            f"devis de test créés : {numero_fr} (fr) et {numero_en} (en)",
        )

        print("— navigation vers la liste des devis")
        await page.reload(wait_until="load")
        await page.wait_for_selector("text=Back-office", timeout=20000)
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Devis")')
        await page.wait_for_timeout(1500)

        print(f"— F1/F2 : facture du devis FRANÇAIS {numero_fr}")
        if await generer_facture(page, numero_fr, "/tmp/facture-fr.pdf"):
            ok("F2", f"génération DIRECTE au clic (PDF téléchargé : facture-fr.pdf)")

        print("— F3 : la facture du devis FR est en FRANÇAIS")
        try:
            texte = texte_pdf("/tmp/facture-fr.pdf")
            verif(
                "F3",
                "Facture" in texte and "TVA" in texte and "Non applicable" in texte
                and "Invoice" not in texte,
                "PDF en français : « Facture », « TVA », « Non applicable »",
                f"contenu inattendu : {texte[:220]}",
            )
        except Exception as e:
            echec("F3", f"PDF illisible : {e}")

        print(f"— facture du devis ANGLAIS {numero_en}")
        if await generer_facture(page, numero_en, "/tmp/facture-en.pdf"):
            print("  ✓      génération DIRECTE (PDF téléchargé : facture-en.pdf)")

        print("— F4 : la facture du devis EN est en ANGLAIS")
        try:
            texte = texte_pdf("/tmp/facture-en.pdf")
            verif(
                "F4",
                "Invoice" in texte and "VAT" in texte and "Not applicable" in texte
                and "Facture" not in texte,
                "PDF en anglais : « Invoice », « VAT », « Not applicable »",
                f"contenu inattendu : {texte[:220]}",
            )
        except Exception as e:
            echec("F4", f"PDF illisible : {e}")

        print("— F5 : nettoyage des documents de test")
        supprimes = 0
        for id_doc in (id_fr, id_en):
            if id_doc:
                r = await supprimer_document(page, id_doc)
                supprimes += 1 if r["status"] == 200 else 0
        # les factures générées (id : facture-<numero> en minuscules)
        numero_facture_fr = numero_fr.replace("D", "F", 1) if numero_fr else ""
        numero_facture_en = numero_en.replace("D", "F", 1) if numero_en else ""
        for numero_f in (numero_facture_fr, numero_facture_en):
            if numero_f:
                id_f = f"facture-{numero_f}".lower()
                r = await supprimer_document(page, id_f)
                supprimes += 1 if r["status"] == 200 else 0
        # vérification finale : plus aucune trace
        reste = await page.evaluate(
            """async () => {
                 const r = await fetch('/api/documents');
                 const d = await r.json();
                 return (d.documents ?? []).filter(x => (x.numero || '').includes('9900')).length;
               }"""
        )
        verif(
            "F5",
            supprimes >= 4 and reste == 0,
            f"{supprimes} documents de test supprimés, stockage propre ({reste} restant)",
            f"supprimés : {supprimes}, restants : {reste}",
        )

        await contexte.close()
        await navigateur.close()

    print("\n" + "=" * 64)
    passes = sum(1 for _, s, _ in resultats if s == "PASS")
    print(f"VOLET 19 — CORRECTIF FACTURE : {passes}/{len(resultats)} contrôles réussis")
    for cid, statut, detail in resultats:
        if statut == "FAIL":
            print(f"  ÉCHEC {cid} : {detail}")
    sys.exit(0 if passes == len(resultats) else 1)


asyncio.run(main())
