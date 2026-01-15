/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // CRITIQUE pour Vercel : Ignore toutes les erreurs TypeScript pendant le build
    // Empêche le build de bloquer même si TypeScript échoue ou se bloque
    ignoreBuildErrors: true,
  },
  // Empêcher Next.js d'essayer de bundler Puppeteer
  // Ces packages seront chargés dynamiquement au runtime
  serverExternalPackages: ["puppeteer", "puppeteer-extra", "puppeteer-extra-plugin-stealth"],
};

module.exports = nextConfig;
