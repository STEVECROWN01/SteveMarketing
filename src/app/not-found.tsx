import type { Metadata } from "next";

/* PAGE 404 FRANÇAISE (audit serveur du 19/11 — cinquième volet de
   l'audit intégral) : toute URL inconnue (/nimporte-quoi, faute de
   frappe dans un lien partagé) recevait la page 404 PAR DÉFAUT de
   Next.js, en ANGLAIS (« 404: This page could not be found. »), sans
   style ni issue de sortie — sur un site 100 % français. Cette page
   remplace ce message : même fond sombre, mêmes polices (Sora pour
   le titre, Inter pour le texte — les variables de RootLayout), même
   langage visuel que le reste du site (eyebrow, bouton plein).
   Composant serveur volontairement minimal : pas de routeur applicatif
   (le contexte du routeur à fragments n'existe pas ici), un simple
   lien vers « / » — la racine affiche l'accueil, point d'entrée de
   toute la navigation. */

export const metadata: Metadata = {
  title: "Page introuvable — Stevens Akpovi",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1c1c1c] px-6 text-center text-white">
      <p className="text-eyebrow">Erreur 404</p>

      <h1 className="font-display mt-5 max-w-[640px] text-balance text-[32px] font-bold leading-[1.15] sm:text-[44px]">
        Cette page n'existe pas — ou a changé d'adresse.
      </h1>

      <p className="mt-5 max-w-[480px] text-[15px] leading-relaxed text-[#c8c8c8]">
        Le lien est peut-être erroné, ou la page a été déplacée. Tout le
        site vous attend à l'accueil : mes services, mes réalisations et
        les moyens de me contacter.
      </p>

      <a
        href="/"
        className="mt-9 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-[#1c1c1c] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        Retour À L'Accueil
      </a>
    </div>
  );
}
