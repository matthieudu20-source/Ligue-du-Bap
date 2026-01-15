import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empêcher Next.js d'essayer de bundler Puppeteer
  // Ces packages seront chargés dynamiquement au runtime
  serverExternalPackages: ["puppeteer", "puppeteer-extra", "puppeteer-extra-plugin-stealth"],
};

export default nextConfig;
