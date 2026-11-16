#!/usr/bin/env python3
"""Page Méthode (17/11/2026, 3e série) — demande de l'éditeur :
« supprime la flèche créée puis transforme le bouton qui est là,
en un bouton qui dirige vers la section "Comment Je Travaille" ».

1. SUPPRESSION de la flèche sinusoïdale (bloc de géométrie, fonctions
   lerp/catmullRomPath/lastWordRect, useEffect de mesure, refs, état
   arrow, SVG de rendu, commentaires associés).
2. Le bouton « Demander Un Devis » de la section « DES SITES WEB QUI
   VENDENT » devient « Voir Comment Je Travaille » → ancre interne
   #comment-je-travaille (scroll-mt-20, défilement fluide).

Chaque remplacement est vérifié UNIQUE (assertion) : le script
échoue bruyamment plutôt que de corrompre le fichier."""

PATH = "/home/z/my-project/stevemarketing/src/components/pages/ProcessPage.tsx"

with open(PATH, encoding="utf-8") as f:
    src = f.read()


def replace_once(text, old, new):
    n = text.count(old)
    assert n == 1, f"Marqueur trouvé {n} fois (attendu 1) : {old[:70]!r}..."
    return text.replace(old, new, 1)


def cut_between(text, start, end, replacement=""):
    """Supprime [start, end] inclus et met `replacement` à la place."""
    i = text.index(start)
    j = text.index(end, i) + len(end)
    return text[:i] + replacement + text[j:]


# 1. Import React : plus de useEffect / useRef
src = replace_once(
    src,
    'import React, { useEffect, useRef, useState } from "react";',
    'import React, { useState } from "react";',
)

# 2. useRouter n'est plus utilisé nulle part dans le composant
src = replace_once(
    src,
    'import { useRouter } from "@/components/router-context";\n',
    "",
)

# 3. Tout le bloc de machinerie de la flèche : commentaire d'en-tête,
#    type ArrowGeometry, lerp, catmullRomPath, lastWordRect.
src = cut_between(
    src,
    "/* ============================================================\n * FLÈCHE SINUSOÏDALE CROISSANTE",
    "  const rects = range.getClientRects();\n  return rects.length ? rects[rects.length - 1] : null;\n}\n\n",
)

# 4. Docblock du composant : items 2 et 3 (bouton + section cible)
src = replace_once(
    src,
    """ * 2. section à deux colonnes : les trois cadres de l'offre (site web
 *    professionnel, page de vente, refonte) empilés à gauche ; à
 *    droite, le titre « Voici comment nous créons des sites web qui
 *    génèrent des ventes. » et le bouton « Demander Un Devis » ;
 * 3. section « MON PROCESSUS » : titre écrit verticalement (du bas
 *    vers le haut) à gauche, trait vertical de séparation à
 *    extrémités fondues, et à droite les six déroulés à accordéon
 *    « + »/« − » — la flèche sinusoïdale du titre de la section
 *    « Des sites web qui vendent » ci-dessus vient pointer cette
 *    liste (voir le bloc « flèche » en tête de fichier) ;""",
    """ * 2. section à deux colonnes : les trois cadres de l'offre (site web
 *    professionnel, page de vente, refonte) empilés à gauche ; à
 *    droite, le titre « Voici comment je crée des sites web qui
 *    génèrent des ventes. » et le bouton « Voir Comment Je
 *    Travaille » qui fait descendre à la section méthode (la
 *    flèche sinusoïdale des 16-17/11 est SUPPRIMÉE à la demande
 *    de l'éditeur, 17/11/2026) ;
 * 3. section « COMMENT JE TRAVAILLE » : titre écrit verticalement
 *    (du bas vers le haut) à gauche, trait vertical de séparation à
 *    extrémités fondues, et à droite les six déroulés à accordéon
 *    « + »/« − » — cible du bouton ci-dessus (ancre interne
 *    #comment-je-travaille) ;""",
)

# 5. Plus de routeur dans ce composant
src = replace_once(src, "  const router = useRouter();\n", "")

# 6. Refs + état de la flèche
src = replace_once(
    src,
    """  /* Flèche sinusoïdale (voir le bloc « flèche » en tête de
     fichier) : ancres mesurées dans le DOM — enveloppe de page,
     colonne du titre « Des sites web qui vendent », grille de
     l'offre, liste des étapes, section méthode. */
  const pageRef = useRef<HTMLDivElement>(null);
  const offerTitleRef = useRef<HTMLDivElement>(null);
  const offerGridRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const methodSectionRef = useRef<HTMLElement>(null);
  const [arrow, setArrow] = useState<ArrowGeometry | null>(null);

""",
    "",
)

# 7. L'intégralité de l'useEffect de mesure du trajet
src = cut_between(
    src,
    "  /* Mesure du trajet : au montage, puis à chaque redimensionnement,",
    """    return () => {
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      ro.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

""",
)

# 8. L'enveloppe relative ne servait qu'à porter la flèche
src = replace_once(src, '    <div ref={pageRef} className="relative">', "    <>")

# 9. Commentaire de la colonne droite (section 2)
src = replace_once(
    src,
    """            {/* Colonne droite : titre + bouton « Demander Un Devis ».
                ANCRE DE LA FLÈCHE : c'est la FIN de ce titre que la
                flèche sinusoïdale quitte pour pointer la section
                méthode ci-dessous (mesure DOM, voir en tête de
                fichier). */}""",
    """            {/* Colonne droite : titre + bouton de descente. La
                flèche sinusoïdale des 16-17/11 est SUPPRIMÉE
                (demande de l'éditeur, 17/11/2026) : c'est désormais
                le BOUTON qui dirige vers la section « Comment Je
                Travaille » ci-dessous — défilement fluide vers
                l'ancre interne #comment-je-travaille. */}""",
)

# 10. LE BOUTON : « Demander Un Devis » → « Voir Comment Je Travaille »
src = replace_once(
    src,
    """                  <CTAButton
                    action={{ kind: "page", page: "devis" }}
                    variant="ghostDark"
                    size="lg"
                  >
                    Demander Un Devis
                  </CTAButton>""",
    """                  <CTAButton
                    action={{ kind: "anchor", sectionId: "comment-je-travaille" }}
                    variant="ghostDark"
                    size="lg"
                    ariaLabel="Voir Comment Je Travaille — la méthode de collaboration, étape par étape"
                  >
                    Voir Comment Je Travaille
                  </CTAButton>""",
)

# 11. Commentaire de la section 3 : le paragraphe « flèche »
src = replace_once(
    src,
    """          rangé à gauche. Sur mobile : titre horizontal, trait de
          séparation horizontal fondu, déroulés.
          FLÈCHE SINUSOÏDALE CROISSANTE (demande de l'éditeur,
          16/11/2026, RE-ANCRÉE le 17/11) : elle ne part PLUS du
          titre vertical de cette section — elle quitte la FIN DU
          TITRE de la section « DES SITES WEB QUI VENDENT »
          ci-dessus et vient pointer la PREMIÈRE CARTE de cette
          liste (trajet mesuré au DOM, voir le bloc « flèche » en
          tête de fichier). Cette section est l'arrivée : son haut
          sert de cible à la pointe et sa frontière (clair → sombre)
          détermine la transition du dégradé du trait. */}""",
    """          rangé à gauche. Sur mobile : titre horizontal, trait de
          séparation horizontal fondu, déroulés.
          CIBLE DU BOUTON « Voir Comment Je Travaille » de la
          section ci-dessus : ancre interne #comment-je-travaille
          (scroll-mt-20 compense le header fixe). */}""",
)

# 12. La section porte désormais l'ancre
src = replace_once(
    src,
    """      <section
        ref={methodSectionRef}
        aria-labelledby="methode-processus-titre"
        className="section-dark relative py-20 sm:py-24 lg:py-32"
      >""",
    """      <section
        id="comment-je-travaille"
        aria-labelledby="methode-processus-titre"
        className="section-dark relative scroll-mt-20 py-20 sm:py-24 lg:py-32"
      >""",
)

# 13. La liste des étapes perd sa ref de mesure
src = replace_once(
    src,
    """                titre + trait + liste est centré dans la page.
                CIBLE DE LA FLÈCHE : son haut reçoit la pointe (voir
                le bloc « flèche » en tête de fichier). */}
            <ol ref={stepsRef} className="mt-10 flex w-full flex-col gap-4 lg:mt-0 lg:w-[min(768px,62vw)]">""",
    """                titre + trait + liste est centré dans la page. */}
            <ol className="mt-10 flex w-full flex-col gap-4 lg:mt-0 lg:w-[min(768px,62vw)]">""",
)

# 14. Le bloc SVG de rendu de la flèche (fin de fichier)
src = cut_between(
    src,
    "      {/* FLÈCHE SINUSOÏDALE : fin du titre « Voici comment je crée des",
    """      )}
    </div>
  );
}""",
    """    </>
  );
}""",
)

# 15. La ligne vide laissée entre </section> et </>
src = replace_once(src, "      </section>\n\n    </>\n  );\n}", "      </section>\n    </>\n  );\n}")

# 16. Les deux ref orphelines restées dans le JSX de la section 2
src = replace_once(
    src,
    """          <div
            ref={offerGridRef}
            className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20"
          >""",
    """          <div
            className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20"
          >""",
)
src = replace_once(
    src,
    '            <div ref={offerTitleRef} className="flex flex-col justify-center lg:py-4">',
    '            <div className="flex flex-col justify-center lg:py-4">',
)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

# Contrôles finaux — la MACHINERIE de la flèche doit avoir disparu
# (les mots « flèche » des commentaires historiques et de la pastille
# ↗ du bouton hero restent légitimes).
assert "ArrowGeometry" not in src, "ArrowGeometry subsiste !"
assert "catmullRom" not in src, "catmullRomPath subsiste !"
assert "lastWordRect" not in src, "lastWordRect subsiste !"
assert "setArrow" not in src, "l'état arrow subsiste !"
assert "fleche-methode" not in src, "le SVG de la flèche subsiste !"
assert "FLÈCHE SINUSOÏDALE" not in src, "le bloc flèche sinusoïdale subsiste !"
assert "pageRef" not in src and "stepsRef" not in src, "une ref de mesure subsiste !"
assert "offerTitleRef" not in src and "offerGridRef" not in src and "methodSectionRef" not in src
assert "useRouter" not in src, "useRouter encore importé !"
assert "measure" not in src, "la fonction de mesure subsiste !"
assert 'id="comment-je-travaille"' in src
assert 'sectionId: "comment-je-travaille"' in src
assert "Voir Comment Je Travaille" in src

print("OK — toutes les transformations appliquées et vérifiées.")
