import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone : réservé à l'auto-hébergement (plateforme de
  // prévisualisation locale). Sur Vercel, ce mode est incompatible avec
  // le runtime de la plateforme — le build réussit mais toutes les
  // routes répondent 404 (NOT_FOUND applicatif). La variable VERCEL,
  // positionnée automatiquement par Vercel au build, désactive donc
  // standalone sur Vercel et le conserve partout ailleurs.
  output: process.env.VERCEL ? undefined : "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  /* VOLET 14 (24/11/2026) — GÉNÉRATION PDF DES DOCUMENTS (back-office)
     via puppeteer-core : ces paquets embarquent un binaire Chromium
     (@sparticuz/chromium, réservé au runtime serverless de Vercel)
     et ne doivent PAS être groupés par le traceur de Next — ils
     restent des dépendances externes du serveur. */
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  /* VOLET 19 (26/11/2026) — CORRECTIF CRITIQUE DE LA GÉNÉRATION PDF
     SUR VERCEL : serverExternalPackages empêche le paquet d'être
     GROUPÉ, mais le traceur de fichiers de Next ne copiait PAS son
     répertoire bin/ (chromium.br, 67 Mo ; fonts.tar.br ;
     al2023.tar.br ; swiftshader.tar.br — lus dynamiquement au
     runtime via fs, donc invisibles au tracé statique). Résultat en
     production : la fonction serverless démarrait sans binaire et
     TOUTE génération de facture/devis échouait (« input directory
     /var/task/node_modules/@sparticuz/chromium/bin does not exist »).
     Vérifié sur le build local : route.js.nft.json de la route PDF
     listait 7 fichiers @sparticuz (JS seulement), ZÉRO fichier de
     bin/. outputFileTracingIncludes force l'inclusion du répertoire
     binaire pour CETTE route (seule à lancer Puppeteer). */
  outputFileTracingIncludes: {
    "/api/documents/pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
  reactStrictMode: false,
  // Indicateur « N » de développement désactivé (n'apparaît pas en production)
  devIndicators: false,
  /* EN-TÊTES DE SÉCURITÉ (audit serveur du 19/11 — cinquième volet de
     l'audit intégral) : le site n'envoyait AUCUN en-tête de sécurité
     (vérifié au curl, local et production). Appliqués à toutes les
     réponses, sur Vercel comme en standalone (les headers() de
     next.config alimentent la configuration de routage Vercel).
     - X-Content-Type-Options: nosniff — le navigateur ne devine plus
       le type MIME d'une ressource (durcissement anti-XSS) ;
     - X-Frame-Options: SAMEORIGIN — le site ne peut plus être intégré
       dans un iframe tiers (anti-clickjacking ; n'empêche pas le site
       d'EMBARQUER des iframes, comme le widget Calendly) ;
     - Referrer-Policy: strict-origin-when-cross-origin — en
       navigation sortante, seule l'origine est transmise en HTTPS,
       jamais l'URL complète (privacy par défaut des navigateurs
       modernes, ici explicite) ;
     - Permissions-Policy — le site n'utilise ni caméra, ni micro, ni
       géolocalisation, ni paiement, ni USB : désactivés pour toute
       page (les éventuels scripts tiers ne peuvent plus les demander) ;
     - Strict-Transport-Security — force HTTPS pendant un an. Sans
       includeSubDomains, volontairement conservateur (aucun
       sous-domaine connu ; HSTS sur HTTP, comme en prévisualisation
       locale, est simplement ignoré par les navigateurs).
     PAS de CSP verrouillée : le site charge des scripts inline
     légitimes (détection hover, JSON-LD) et des scripts tiers
     (Calendly, Google Fonts) — une CSP stricte exigerait une
     infrastructure de nonces que ce volet n'introduit pas ; les
     en-têtes ci-dessus couvrent les durcissements sans risque de
     casser l'existant. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
      /* CACHE DES RESSOURCES STATIQUES /assets/ (correctif de l'aperçu
         de partage intermittent, 20/11/2026) : Vercel sert les fichiers
         de public/ avec « max-age=0, must-revalidate » par défaut —
         chaque requête (y compris celles des scrapers de réseaux
         sociaux, au timeout court) interroge l'origine. Un cache de
         24 h aligne les décisions des crawleurs et des navigateurs
         sur les serveurs edge, sans verrouiller longtemps : les
         fichiers appelés à changer suivent la convention du projet —
         nouveau nom daté (OG-2026-11-20.jpg) ou paramètre de version
         (logo-blanc.png?v=2026-11-15, favicon.png?v=2026-11-14-2). La
         règle vient APRÈS la règle générale : pour /assets/*, ses
         clés s'ajoutent aux en-têtes de sécurité ci-dessus. */
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
};

export default nextConfig;
