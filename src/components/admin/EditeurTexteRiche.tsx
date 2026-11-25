"use client";

import React, { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Type } from "lucide-react";
import { assainirHtmlRiche } from "@/lib/documents/texte-riche";

/**
 * ÉDITEUR DE TEXTE RICHE (VOLET 17) — description des prestations du
 * devis. L'éditeur propose EXACTEMENT les outils demandés : gras,
 * italique, taille supérieure (sous-titre), listes numérotées et
 * listes à puces — « comme si on éditait un texte dans Word ».
 *
 * Le HTML produit est émis tel quel vers le formulaire ; le rendu du
 * document (aperçu et PDF) l'ASSAINIT (texte-riche.ts) : seules les
 * balises de mise en forme passent.
 */

export function EditeurTexteRiche({
  valeur,
  onChange,
  placeholder = "Rédigez la description de la prestation…",
  minHeight = 180,
}: {
  valeur: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  /* Ne réécrire le DOM que si la valeur externe diffère (curseur
     préservé pendant la frappe : onChange → même chaîne → pas de
     réécriture). */
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== valeur) el.innerHTML = valeur || "";
  }, [valeur]);

  const exec = (commande: string, valeurCmd?: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand(commande, false, valeurCmd);
    onChange(el.innerHTML);
  };

  const boutons: {
    icone: React.ReactNode;
    libelle: string;
    action: () => void;
  }[] = [
    { icone: <Bold className="h-4 w-4" aria-hidden="true" />, libelle: "Gras", action: () => exec("bold") },
    { icone: <Italic className="h-4 w-4" aria-hidden="true" />, libelle: "Italique", action: () => exec("italic") },
    {
      icone: <Type className="h-4 w-4" aria-hidden="true" />,
      libelle: "Taille supérieure (sous-titre)",
      action: () => exec("fontSize", "5"),
    },
    { icone: <ListOrdered className="h-4 w-4" aria-hidden="true" />, libelle: "Liste numérotée", action: () => exec("insertOrderedList") },
    { icone: <List className="h-4 w-4" aria-hidden="true" />, libelle: "Liste à puces", action: () => exec("insertUnorderedList") },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] focus-within:border-[#e4e4e4]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#e4e4e4]/10 bg-[#141414] px-2 py-1.5">
        {boutons.map((b) => (
          <button
            key={b.libelle}
            type="button"
            title={b.libelle}
            aria-label={b.libelle}
            onMouseDown={(e) => {
              /* mousedown : conserver la sélection du texte */
              e.preventDefault();
              b.action();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#c8c8c8] transition-colors hover:bg-[#e4e4e4]/10 hover:text-white"
          >
            {b.icone}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Description de la prestation"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        onBlur={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        onPaste={(e) => {
          /* Coller nettoyé : seules les balises autorisées passent. */
          e.preventDefault();
          const html = e.clipboardData.getData("text/html");
          const texte = e.clipboardData.getData("text/plain");
          if (html) {
            document.execCommand("insertHTML", false, assainirHtmlRiche(html));
          } else if (texte) {
            document.execCommand("insertText", false, texte);
          }
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        className="desc-editeur rich-editable block w-full px-3.5 py-2.5 text-sm leading-relaxed text-white outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}
