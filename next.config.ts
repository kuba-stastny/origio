// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",            // <- klíčové pro samostatný build
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    // ⚠️ Build proběhne i když budou TS chyby
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
