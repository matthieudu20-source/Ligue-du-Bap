/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Empêcher Next.js d'essayer de bundler Puppeteer
  // Ces packages seront chargés dynamiquement au runtime
  serverExternalPackages: ["puppeteer", "puppeteer-extra", "puppeteer-extra-plugin-stealth"],
};

module.exports = nextConfig;
