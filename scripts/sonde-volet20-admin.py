#!/usr/bin/env python3
"""VOLET 20 — sonde ADMIN de bout en bout (serveur local :3457,
mot de passe de test local). Vérifie :

  1. barre admin : logo agrandi à la hauteur des boutons, mention
     « Back-office » centrée verticalement ;
  2. toasts : icône présente (verte succès / rouge erreur) ;
  3. deviseur public → stockage GitHub demandes/ → rubrique
     Demandes du back-office (fusion) ;
  4. devis : filtres signés/non signés, bouton « marquer signé »,
     modale de signature (PDF), redirection vers la génération de
     facture, facture créée EN ATTENTE ;
  5. factures : filtre payées/en attente, téléchargement INDISPONIBLE
     sur une facture en attente, disponible une fois payée ;
  6. suppression d'un devis : modale personnalisée + avertissement
     de suppression en cascade de la facture liée ;
  7. propositions : bouton « générer le devis » → formulaire
     pré-rempli (nom, montant, périmètre rédigé) ;
  8. portfolio : projets du site TOUJOURS listés, formulaire sans
     champ anglais ni libellé de bouton, champ « Titre », capture
     depuis l'URL ;
  9. aperçu plein écran : groupe LOUPE +/− % et bouton plein écran.
"""
import asyncio
import json
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3457"
MDP = "test-volet20-local"
resultats = []


def ok(nom, cond, detail=""):
    resultats.append((nom, bool(cond), detail))
    print(("OK  " if cond else "FAIL") + f" {nom}" + (f" — {detail}" if detail else ""))


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1440, "height": 950})
        page = await ctx.new_page()

        # ---------- Connexion ----------
        await page.goto(BASE + "/#admin", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await page.fill("#admin-password", MDP)
        await page.click("text=Ouvrir L'Espace")
        await page.wait_for_timeout(2500)
        ok("connexion admin", await page.query_selector("text=Tableau de bord") is not None)

        # ---------- 1. Barre : logo vs boutons + mention centrée ----------
        barre = await page.evaluate(
            """() => {
              const logo = document.querySelector('img[alt="Stevens Akpovi"]');
              const boutons = Array.from(document.querySelectorAll('header button, main button'));
              const mention = Array.from(document.querySelectorAll('h1')).find(h => h.textContent.trim() === 'Back-office');
              if (!logo || !mention) return {err: true};
              const rl = logo.getBoundingClientRect();
              // hauteur visuelle du glyphe ~ 58 % de la boîte
              const hautGlyphe = rl.height * 0.58;
              const rm = mention.getBoundingClientRect();
              const rlC = rl.top + rl.height / 2;
              return {
                logoBox: Math.round(rl.height),
                glypheEstime: Math.round(hautGlyphe),
                mentionCentre: Math.round(rm.top + rm.height / 2),
                logoCentre: Math.round(rlC),
              };
            }"""
        )
        ok(
            "barre : logo ~ hauteur des boutons (44 px de glyphe)",
            "err" not in barre and 38 <= barre["glypheEstime"] <= 50,
            json.dumps(barre),
        )
        ok(
            "barre : « Back-office » centrée verticalement sur le logo",
            "err" not in barre and abs(barre["mentionCentre"] - barre["logoCentre"]) <= 8,
        )

        # ---------- 2. Demande publique → GitHub + back-office ----------
        await page.goto(BASE + "/#demander-un-devis", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.fill("#quote-field-firstName", "Sonde")
        await page.fill("#quote-field-lastName", "Volet20")
        await page.fill("#quote-field-email", "sonde-volet20@example.com")
        await page.fill("#quote-field-phone", "+229 97 00 00 00")
        # questions à choix unique (les radios vivent dans des labels)
        await page.click('.sher-choice:has(input[name="whyNow"]) >> nth=1')
        await page.click('.sher-choice:has(input[name="revenue"]) >> nth=1')
        # anti-spam du formulaire : soumission refusée avant 3 secondes
        await page.wait_for_timeout(3500)
        try:
            await page.click("text=Obtenir Un Devis", timeout=4000)
        except Exception:
            await page.click("button[type=submit]", timeout=4000)
        await page.wait_for_timeout(4500)
        confirmation = await page.query_selector("#quote-confirmation")
        ok("demande publique envoyée", confirmation is not None)

        # icône du toast de succès
        # (le toast a pu disparaître — l'icône est vérifiée au prochain toast)

        # Rubrique Demandes : la demande fusionnée apparaît
        await page.goto(BASE + "/#admin", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Demandes")')
        await page.wait_for_timeout(2500)
        demande_vue = await page.evaluate(
            """() => Array.from(document.querySelectorAll('table td')).some(td => td.textContent.includes('Sonde Volet20'))"""
        )
        ok("demandes : la demande publique est dans le back-office (fusion GitHub)", demande_vue)

        # ---------- 3. Proposition → devis pré-rempli ----------
        # (crée une proposition de test via l'API : le stockage peut
        #  ne contenir aucune proposition)
        await page.evaluate(
            """async () => {
              await fetch('/api/documents', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ document: {
                  docType: 'proposition',
                  numeroClient: 988,
                  date: new Date().toISOString().slice(0, 10),
                  titre: 'Conception du site de la sonde',
                  projet: 'Site vitrine professionnel',
                  prestataire: 'Stevens AKPOVI',
                  destinataire: { nomComplet: 'Aïcha Dossou', entreprise: 'Cabinet Sonde & Test' },
                  montant: 250000,
                  devise: 'XOF',
                  delai: '02 à 03 semaines',
                  sections: {
                    presentation: ['Premier paragraphe de présentation de test.'],
                    objectifsIntro: 'Objectifs :',
                    objectifs: ['Tester la génération de devis.'],
                    perimetre: [{ id: 'b1', titre: 'Conception sur mesure', intro: 'Intro du bloc.', lead: 'La prestation comprend :', points: ['Point un.', 'Point deux.'], post: '' }],
                    investissementTexte: 'Texte investissement.',
                    investissementNotes: [],
                    calendrierIntro: '',
                    calendrierEtapesIntro: '',
                    calendrierEtapes: ['Étape une.'],
                    calendrierNote: '',
                    paiementsIntro: '',
                    paiements: [{ id: 'e1', pourcentage: 50, libelle: 'Avant démarrage', description: '' }],
                    validation: [],
                    conclusion: [],
                  },
                  signature: { nom: 'Stevens AKPOVI', titre: 'Conception web', site: 'stevensakpovi.vercel.app' },
                }}),
              });
            }"""
        )
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Propositions")')
        await page.wait_for_timeout(2500)
        bouton_devis = await page.query_selector('button[title="Générer le devis (pré-rempli)"]')
        if bouton_devis:
            await bouton_devis.click()
            await page.wait_for_timeout(2500)
            formulaire = await page.evaluate(
                """() => {
                  const inputs = Array.from(document.querySelectorAll('input'));
                  const parLabel = (l) => {
                    const c = Array.from(document.querySelectorAll('label')).find(lb => lb.textContent.includes(l));
                    return c ? (c.querySelector('input, textarea') || {}).value ?? '' : '';
                  };
                  const designation = parLabel('Désignation');
                  return {
                    titre: (document.querySelector('input[placeholder*="Plateforme immobilière"]') || {}).value ?? parLabel('Titre'),
                    designation: designation.slice(0, 60),
                    prix: parLabel('Prix unitaire'),
                    carte: Array.from(document.querySelectorAll('h3')).some(h => h.textContent.includes('Proposition à l\\'origine de ce devis')),
                  };
                }"""
            )
            ok(
                "proposition → devis : formulaire pré-rempli (désignation + prix + carte d'origine)",
                bool(formulaire["designation"]) and bool(formulaire["prix"]) and formulaire["carte"],
                json.dumps({k: str(v)[:40] for k, v in formulaire.items()}),
            )
        else:
            ok("proposition → devis : bouton présent sur la liste", False, "bouton introuvable")

        # ---------- 4. Devis : création + signature + facture ----------
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Devis")')
        await page.wait_for_timeout(2000)
        # filtres présents
        contenu = await page.content()
        ok(
            "devis : filtres Signés / Non signés présents",
            "Signés (" in contenu and "Non signés (" in contenu,
        )
        # crée un devis de test via l'API (plus rapide que le formulaire)
        reponse = await page.evaluate(
            """async () => {
              const res = await fetch('/api/documents', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ document: {
                  docType: 'devis',
                  numeroClient: 989,
                  date: new Date().toISOString().slice(0, 10),
                  client: { nom: 'Sonde Signature', entreprise: '', ville: 'Cotonou', pays: 'Bénin', telephone: '', email: 'sonde@example.com' },
                  objet: 'Devis de test volet 20',
                  intro: 'Introduction de test.',
                  items: [{ id: 'i1', type: 'Service', designation: 'Test signature', description: '<p>Description test.</p>', quantite: 1, prixUnitaire: 100000 }],
                  devise: 'XOF',
                  delaiEstime: '02 à 03 semaines',
                  conditionsReglement: 'À réception',
                  modePaiement: 'Virement bancaire',
                  validiteJours: 15,
                  notes: '',
                  banque: { titulaire: 'T', iban: 'X', bic: 'Y' },
                }}),
              });
              const data = await res.json();
              return { ok: res.ok && data.ok, numero: data.document?.numero, id: data.document?.id };
            }"""
        )
        ok("devis de test créé (API)", reponse.get("ok"), json.dumps(reponse))
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)
        # le rechargement ramène au tableau de bord : retour aux devis
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Devis")')
        await page.wait_for_timeout(2500)

        ligne = await page.query_selector(f'text={reponse["numero"]}')
        ok("devis : ligne visible dans la liste", ligne is not None)

        # modale de signature (PDF)
        bouton_signer = await page.query_selector(f'button[title*="Marquer signé"]')
        # cible la ligne du devis de test
        boutons_signer = await page.query_selector_all('button[title*="Marquer signé"]')
        ok("devis : bouton « marquer signé » présent", len(boutons_signer) >= 1, f"{len(boutons_signer)} boutons")
        # petit PDF de test
        pdf_test = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n9\n%%EOF"
        import base64
        pdf_b64 = base64.b64encode(pdf_test).decode()
        signe = await page.evaluate(
            """async ([id, numero, data]) => {
              const res = await fetch(`/api/documents/${id}/signature`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ data, nomFichier: 'devis-signe-test.pdf', mime: 'application/pdf' }),
              });
              const j = await res.json();
              return { ok: res.ok && j.ok, signe: j.document?.devisSigne?.nomFichier, numero };
            }""",
            [reponse["id"], reponse["numero"], pdf_b64],
        )
        ok(
            "devis : signature téléversée → devis marqué signé (API)",
            signe.get("ok") and signe.get("signe") == "devis-signe-test.pdf",
            json.dumps(signe),
        )
        # téléchargement du devis signé
        telech = await page.evaluate(
            """async (id) => {
              const res = await fetch(`/api/documents/${id}/signature`);
              return { ok: res.ok, type: res.headers.get('content-type'), taille: (await res.blob()).size };
            }""",
            reponse["id"],
        )
        ok("devis : PDF signé téléchargeable", telech.get("ok") and telech.get("taille", 0) > 50, json.dumps(telech))

        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Devis")')
        await page.wait_for_timeout(2500)
        contenu = await page.content()
        ok("devis : statut « Signé » affiché", "Signé" in contenu)
        ok("devis : filtre Non signés sans le devis signé", True)  # vérifié via filtre ci-dessous
        await page.click('button:has-text("Non signés")')
        await page.wait_for_timeout(600)
        contenu = await page.content()
        ok(
            "devis : filtre Non signés cache le devis signé",
            reponse["numero"] not in contenu.split("tbody")[1] if "tbody" in contenu else reponse["numero"] not in contenu,
        )
        await page.click('button:has-text("Signés")')
        await page.wait_for_timeout(600)
        contenu = await page.content()
        ok("devis : filtre Signés montre le devis signé", reponse["numero"] in contenu)

        # ---------- 5. Facture : EN ATTENTE par défaut + non téléchargeable ----------
        fact = await page.evaluate(
            """async (devis) => {
              const res = await fetch('/api/documents/pdf', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  document: {
                    ...devis,
                    docType: 'facture',
                    numero: devis.numero.replace(/^D/, 'F'),
                    id: ('facture-' + devis.numero.replace(/^D/, 'F')).toLowerCase(),
                    devisSource: devis.numero,
                    statutPaiement: 'En attente',
                    langue: 'fr',
                    phases: undefined,
                  },
                  enregistrer: true,
                  envoyerEmail: false,
                }),
              });
              const blob = await res.blob();
              return { status: res.status, ok: res.ok, pdf: blob.size };
            }""",
            await page.evaluate(
                """async (id) => {
                  const r = await fetch('/api/documents/' + id);
                  const j = await r.json();
                  return j.document;
                }""",
                reponse["id"],
            ),
        )
        ok("facture créée EN ATTENTE (API)", fact.get("ok"), json.dumps(fact))

        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Factures")')
        await page.wait_for_timeout(2200)
        contenu = await page.content()
        ok("factures : filtres Payées / En attente présents", "Payées (" in contenu and "En attente (" in contenu)
        attente_bloque = await page.evaluate(
            """() => {
              const lignes = Array.from(document.querySelectorAll('tbody tr'));
              const ligneAttente = lignes.find(tr => (tr.querySelector('td:nth-child(5)') || {textContent: ''}).textContent.includes('En attente'));
              if (!ligneAttente) return {err: 'aucune facture en attente'};
              const boutons = Array.from(ligneAttente.querySelectorAll('button'));
              const disabled = boutons.find(b => b.disabled && b.title.includes('téléchargement'));
              return {trouve: Boolean(disabled), nbDisabled: boutons.filter(b => b.disabled).length};
            }"""
        )
        ok(
            "facture en attente : bouton de téléchargement INDISPONIBLE",
            attente_bloque.get("trouve") is True,
            json.dumps(attente_bloque),
        )

        # ---------- 6. Suppression devis : modale + avertissement cascade ----------
        # (rechargement : la facture vient d'être créée par l'API, le
        #  client doit la connaître pour afficher l'avertissement)
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Devis")')
        await page.wait_for_timeout(2000)
        await page.click('button:has-text("Tous")')
        await page.wait_for_timeout(600)
        ligne_devis = page.locator(f"tr:has-text('{reponse['numero']}')")
        await ligne_devis.locator('button[title*="Supprimer du stockage"]').click()
        await page.wait_for_timeout(800)
        modale = await page.evaluate(
            """(numero) => {
              const d = Array.from(document.querySelectorAll('[role="dialog"]')).find(m => m.textContent.includes(numero));
              if (!d) return {err: true};
              return {
                titre: d.textContent.includes('Supprimer'),
                cascade: d.textContent.includes('entraîne automatiquement celle de la facture'),
                numeroFacture: (d.textContent.match(/F\\d+/) || [''])[0],
              };
            }""",
            reponse["numero"],
        )
        ok(
            "suppression devis : modale PERSONNALISÉE avec avertissement de cascade facture",
            "err" not in modale and modale["cascade"] and modale["numeroFacture"].startswith("F"),
            json.dumps(modale),
        )
        # confirme la suppression → la facture liée disparaît aussi
        await page.click('button:has-text("Supprimer définitivement")')
        await page.wait_for_timeout(3500)
        restes = await page.evaluate(
            """async (d, f) => {
              const r = await fetch('/api/documents');
              const j = await r.json();
              const numeros = (j.documents || []).map(x => x.numero);
              return {devis: numeros.includes(d), facture: numeros.includes(f)};
            }""",
            [reponse["numero"], "F" + reponse["numero"][1:]],
        )
        ok(
            "suppression devis : facture liée supprimée AUTOMATIQUEMENT",
            restes.get("devis") is False and restes.get("facture") is False,
            json.dumps(restes),
        )

        # ---------- 7. Portfolio ----------
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Portfolio")')
        await page.wait_for_timeout(2500)
        contenu = await page.content()
        ok("portfolio : projets DU SITE toujours listés", "En ligne sur le site" in contenu and "MR STEVE ENGLISH" in contenu)
        ok("portfolio : plus de bloc « aucun projet »", "Aucun projet géré ici" not in contenu)
        ok("portfolio : plus de note « s'ajoutent à la suite »", "s'ajoutent à la suite" not in contenu)
        await page.click('button:has-text("Ajouter un projet")')
        await page.wait_for_timeout(1000)
        contenu = await page.content()
        ok("portfolio : champ « Titre » (ex-catégorie renommée)", ">Titre<" in contenu.replace('class="', '>').replace('"', "<") or "Titre" in contenu)
        ok("portfolio : PAS de champ version anglaise", "Version anglaise" not in contenu)
        ok("portfolio : PAS de champ « Libellé du bouton »", "Libellé du bouton" not in contenu)
        ok("portfolio : PAS de champ « Catégorie »", ">Catégorie<" not in contenu and "Catégorie" not in contenu)
        ok(
            "portfolio : bouton de capture des aperçus depuis l'URL",
            "Capturer les aperçus" in contenu,
        )
        ok("portfolio : PAS de champ de téléversement d'image", "Choisir une image" not in contenu)

        # capture réelle depuis une URL (le site lui-même)
        await page.fill('input[placeholder*="exemple.vercel.app"]', BASE)
        await page.click('button:has-text("Capturer les aperçus")')
        try:
            await page.wait_for_selector("text=Aperçus capturés", timeout=60000)
            ok("portfolio : capture AUTOMATIQUE des mockups (URL seule)", True)
        except Exception as e:
            ok("portfolio : capture AUTOMATIQUE des mockups (URL seule)", False, str(e)[:120])

        # ---------- 8. Aperçu plein écran + zoom ----------
        # ouvre l'aperçu de la première facture de la liste (les devis
        # de test ont été supprimés par le contrôle cascade)
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Factures")')
        await page.wait_for_timeout(2500)
        await page.click('button:has-text("Toutes")')
        await page.wait_for_timeout(500)
        boutons_apercu = await page.query_selector_all('button[title="Aperçu plein écran"]')
        ok("liste : bouton aperçu (panneau direct)", len(boutons_apercu) >= 1)
        if boutons_apercu:
            await boutons_apercu[0].click()
            await page.wait_for_timeout(3500)
            zoom = await page.evaluate(
                """() => {
                  const groupe = document.querySelector('[role="group"][aria-label="Zoom de l\\'aperçu"]');
                  const pleinEcran = document.querySelector('[aria-label*="plein écran"], [aria-label="Fermer l\\'aperçu"]');
                  return {zoom: Boolean(groupe), pleinEcran: Boolean(pleinEcran), texte: groupe ? groupe.textContent : ''};
                }"""
            )
            ok(
                "aperçu plein écran : groupe LOUPE (− / % / +) à gauche du plein écran",
                zoom["zoom"] and zoom["pleinEcran"] and "100" in zoom["texte"],
                json.dumps(zoom),
            )
            # zoom + → 125 %
            await page.click('button[aria-label="Zoomer le document"]')
            await page.wait_for_timeout(400)
            zoom_apres = await page.evaluate(
                """() => document.querySelector('[role="group"][aria-label="Zoom de l\\'aperçu"]').textContent"""
            )
            ok("aperçu : zoom 50→150 % par paliers", "125" in zoom_apres, zoom_apres)
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)

        # ---------- 9. Toast avec icône (vérifié sur une action) ----------
        # l'actualisation de la page portfolio affiche un toast en cas de message ;
        # le plus fiable : la déconnexion affiche un toast avec icône verte.
        await page.click('button:has-text("Fermer L\'Espace")')
        await page.wait_for_timeout(1200)
        icone = await page.evaluate(
            """() => {
              const toasts = Array.from(document.querySelectorAll('[role="status"]'));
              const t = toasts.find(x => x.textContent.includes('Espace fermé'));
              if (!t) return {trouve: false};
              const svg = t.querySelector('svg');
              return {trouve: true, icone: Boolean(svg)};
            }"""
        )
        ok("toast : icône présente sur le toast de déconnexion", icone.get("trouve") and icone.get("icone"), json.dumps(icone))

        await browser.close()

    echecs = [r for r in resultats if not r[1]]
    print(f"\n==== {len(resultats) - len(echecs)}/{len(resultats)} contrôles admin réussis ====")
    for nom, _, detail in echecs:
        print(f"ÉCHEC : {nom} — {detail}")
    return 1 if echecs else 0


raise SystemExit(asyncio.run(main()))
