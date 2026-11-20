import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { ASSETS, PAGES, SITE } from "@/lib/site";

/* Polices : Sora (titres) + Inter (texte / interface), chargement optimisé */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Arial", "sans-serif"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Arial", "sans-serif"],
});

/* Mesure d'audience Google Analytics 4 (volet 8 de l'audit,
   19/11/2026) — INACTIVE PAR DÉFAUT : les scripts gtag ne sont
   rendus que si NEXT_PUBLIC_GA_ID est définie au build (voir
   DEPLOIEMENT.md). Aucun identifiant d'exemple, aucune requête
   vers Google tant que la variable n'est pas renseignée. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || null;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    // Métadonnées STATIQUES = celles de l'accueil, puisées dans PAGES
    // (source unique — recommandation de l'audit intégral du 18/11) :
    // la valeur SSR, celle que voient les crawleurs sans JavaScript et
    // les aperçus de partage, ne peut plus diverger de la valeur que
    // le routeur applique à l'accueil une fois hydraté.
    default: PAGES.accueil.title,
    template: "%s",
  },
  description: PAGES.accueil.description,
  keywords: [
    "création site web professionnel",
    "concepteur de sites web",
    "site vitrine",
    "landing page",
    "page de vente",
    "refonte de site web",
    "système d'acquisition client",
    "copywriting web",
    "SEO",
    "Meta Ads",
    "Stevens Akpovi",
  ],
  authors: [{ name: "Stevens Akpovi", url: SITE.linkedin }],
  creator: "Stevens Akpovi",
  publisher: "Stevens Akpovi",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE.url,
    siteName: "Stevens Akpovi",
    title: PAGES.accueil.title,
    description: PAGES.accueil.description,
    images: [
      {
        url: ASSETS.ogImage,
        /* 1200×630 — ratio 1,91:1 recommandé par Facebook et LinkedIn
         * (correctif du 20/11 : l'ancienne vignette carrée 1254×1254
         * produisait des aperçus de partage intermittents ; cf
         * scripts/og-1200x630-2026-11-20.py). */
        width: 1200,
        height: 630,
        alt: PAGES.accueil.title,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGES.accueil.title,
    description: PAGES.accueil.description,
    images: [ASSETS.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  /* Vérification Google Search Console (volet 8 de l'audit,
     19/11/2026) : la balise <meta name="google-site-verification">
     n'est rendue QUE si NEXT_PUBLIC_GSC_VERIFICATION est définie au
     build (voir DEPLOIEMENT.md — méthode « Balise HTML » de Search
     Console). Aucun jeton d'exemple par défaut : la propriété est
     ajoutée par l'éditeur quand il le décide. */
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim()
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION.trim() }
    : undefined,
  icons: {
    // Paramètre de version : force les navigateurs (cache favicon très
    // rétentif) à recharger l'icône. Version 2026-11-14-2 : fond noir
    // retiré (PNG RGBA transparent, glyphe recadré sur son enveloppe).
    icon: "/assets/favicon.png?v=2026-11-14-2",
    apple: "/assets/favicon.png?v=2026-11-14-2",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1c1c",
  width: "device-width",
  initialScale: 1,
};

/** Données structurées : Personne + service professionnel + site web.
 *  (Volet 8 de l'audit, 19/11/2026 : complétées pour Google —
 *  image sur Person et ProfessionalService (Knowledge Graph /
 *  résultats enrichis), knowsLanguage (langue de travail du site),
 *  telephone sur le service — dérivé du numéro WhatsApp PUBLIÉ sur
 *  le site (SITE.whatsapp), aucune donnée inventée.) */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE.url}/#person`,
      name: "Stevens Akpovi",
      jobTitle: "Concepteur de sites web professionnels",
      description: SITE.description,
      email: `mailto:${SITE.email}`,
      url: SITE.url,
      image: `${SITE.url}${ASSETS.portrait}`,
      knowsLanguage: "fr",
      sameAs: [SITE.linkedin],
      knowsAbout: [
        "Conception de sites web",
        "Sites vitrines",
        "Landing pages",
        "Pages de vente",
        "Copywriting web",
        "SEO",
        "Meta Ads",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE.url}/#service`,
      name: "Stevens Akpovi — Conception de sites web",
      slogan: SITE.positioning,
      description: SITE.description,
      url: SITE.url,
      email: SITE.email,
      image: `${SITE.url}${ASSETS.ogImage}`,
      telephone: SITE.whatsapp.replace("https://wa.me/", "+"),
      provider: { "@id": `${SITE.url}/#person` },
      areaServed: "Worldwide",
      serviceType: [
        "Site vitrine professionnel",
        "Site web multipages",
        "Landing page",
        "Page de vente",
        "Refonte de site web",
        "Système d'acquisition client",
        "Meta Ads",
        "Référencement approfondi (SEO)",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: "Stevens Akpovi",
      description: SITE.description,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE.url}/#person` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} antialiased`}>
        {/* ÉCRAN D'AMORÇAGE DES LIENS PROFONDS (volet 7 de l'audit,
            19/11/2026 — LCP ≤ 1 s). Le routage par fragment ne donne
            au serveur AUCUNE indication de page : un chargement direct
            de #/methode reçoit le HTML complet de l'ACCUEIL, que
            l'hydratation remplace ensuite par la page demandée — le
            visiteur voyait défiler l'accueil (texte révélé ~950 ms,
            images du hero) puis un fondu de sortie puis l'attente de
            morceau avant SA page. Ce script INLINE BRUT est rendu à sa
            place dans le HTML (comme le JSON-LD en fin de body) et
            s'exécute AU PARSE, avant le balisage de l'application qui
            le suit : l'attribut data-boot="deep" est posé AVANT la
            première paint. Pourquoi pas next/script beforeInteractive
            comme le script detect-hoverable ci-dessous ? Vérifié au
            volet 7 : dans ce Next.js (16.4.6), les scripts inline
            beforeInteractive sont sérialisés dans le payload Flight
            (self.__next_f.push) et ne s'exécutent qu'au boot du
            runtime — mesuré 223 ms, APRÈS le FCP (180 ms) : trop
            tard pour couvrir le contenu SSR. Tout le visuel (voile +
            spinner) est porté par les règles CSS statiques de
            globals.css : AUCUN nœud n'est inséré (React hydrate
            <html>/<body> : une insertion casserait l'hydratation à la
            racine — mesuré 1284-2524 ms au volet 7). La levée est
            portée par <NettoyageAmorcage /> (page.tsx) au montage de
            la page demandée ; le filet de sécurité retire l'attribut
            après 6 s si l'application ne prend jamais la main
            (erreur JS — comportement dégradé = celui d'avant le
            volet, jamais un écran bloqué). La liste des fragments
            doit rester synchronisée avec HASH_TO_PAGE
            (router-context.tsx) ; un fragment inconnu n'amorce rien
            (le routeur le replie sur l'accueil). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=window.location.hash||"";if(!h||h==="#/"||h==="#/accueil"||h.indexOf("#/accueil/")===0)return;var c=h.indexOf("#/")===0?h.slice(2):h.slice(1);var p=c.split("/")[0];var P={methode:1,processus:1,services:1,"referencement-seo":1,"publicite-meta-ads":1,realisations:1,projet:1,"a-propos":1,contact:1,"demander-un-devis":1,"audit-gratuit":1,"reserver-un-appel":1,"mentions-legales":1,admin:1};if(!P[p])return;var d=document.documentElement;d.setAttribute("data-boot","deep");window.__amorcageProfond=true;setTimeout(function(){d.removeAttribute("data-boot")},6000)}catch(e){}})()`,
          }}
        />
        {/* Détection d'un périphérique capable de survol : exécutée au
            boot du runtime Next (next/script beforeInteractive — mesuré
            au volet 7 : ~220 ms, juste après le FCP) pour éviter tout
            flash de couleur durable sur desktop. Détermine le
            traitement monochrome → couleur des images : tactile (ou
            écran étroit sans survol) = couleur directe ; desktop avec
            pointeur précis = monochrome par défaut. */}
        <Script id="detect-hoverable" strategy="beforeInteractive">
          {`(function(){try{var mq=function(q){return window.matchMedia&&window.matchMedia(q).matches};var t='ontouchstart' in window||navigator.maxTouchPoints>0||mq('(pointer: coarse)')||(mq('(hover: none)')&&mq('(max-width: 820px)'));if(!t){document.documentElement.classList.add('hoverable')}}catch(e){}})()`}
        </Script>
        {children}
        {/* Google Analytics 4 — rendu uniquement si NEXT_PUBLIC_GA_ID
            est définie (voir constantes en tête de fichier) : aucune
            balise, aucune requête réseau vers Google sinon. */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{'anonymize_ip':true});`}
            </Script>
          </>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
