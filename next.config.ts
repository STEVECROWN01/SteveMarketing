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
  reactStrictMode: false,
  // Indicateur « N » de développement désactivé (n'apparaît pas en production)
  devIndicators: false,
};

export default nextConfig;
