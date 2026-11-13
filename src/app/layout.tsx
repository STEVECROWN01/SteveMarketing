import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { ASSETS, SITE } from "@/lib/site";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Stevens Akpovi — Je crée des sites web qui génèrent des ventes",
    template: "%s",
  },
  description:
    "J'accompagne entreprises, PME, agences, coachs, infopreneurs et freelances dans la création de sites web stratégiques : sites vitrines, multipages, landing pages, pages de vente, refontes. Copywriting et SEO de base inclus.",
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
    title: "Stevens Akpovi — Je crée des sites web qui génèrent des ventes",
    description:
      "Sites web professionnels orientés conversion : stratégie, design, copywriting inclus et SEO de base. Appelez Stevens Akpovi — 30 minutes, gratuit, sans engagement.",
    images: [
      {
        url: ASSETS.ogImage,
        width: 1254,
        height: 1254,
        alt: "Stevens Akpovi — Je crée des sites web qui génèrent des ventes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stevens Akpovi — Je crée des sites web qui génèrent des ventes",
    description:
      "Sites web professionnels orientés conversion. Copywriting et SEO de base inclus.",
    images: [ASSETS.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
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

/** Données structurées : Personne + service professionnel + site web. */
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
        {/* Détection d'un périphérique capable de survol : exécutée avant
            l'hydratation pour éviter tout flash de couleur sur desktop.
            Détermine le traitement monochrome → couleur des images :
            tactile (ou écran étroit sans survol) = couleur directe ;
            desktop avec pointeur précis = monochrome par défaut. */}
        <Script id="detect-hoverable" strategy="beforeInteractive">
          {`(function(){try{var mq=function(q){return window.matchMedia&&window.matchMedia(q).matches};var t='ontouchstart' in window||navigator.maxTouchPoints>0||mq('(pointer: coarse)')||(mq('(hover: none)')&&mq('(max-width: 820px)'));if(!t){document.documentElement.classList.add('hoverable')}}catch(e){}})()`}
        </Script>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
