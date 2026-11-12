import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Indicateur « N » de développement désactivé (n'apparaît pas en production)
  devIndicators: false,
};

export default nextConfig;
