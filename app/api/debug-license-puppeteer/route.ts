// @ts-nocheck


import { NextRequest, NextResponse } from "next/server";
import { buildPlayerUrl } from "@/lib/myffbad";

/**
 * Route de debug avancée avec Puppeteer pour voir exactement ce qui est sur la page
 * GET /api/debug-license-puppeteer?license=6835632
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const licenseNumber = searchParams.get("license");

  if (!licenseNumber) {
    return NextResponse.json(
      { error: "Le paramètre 'license' est requis" },
      { status: 400 }
    );
  }

  try {
    const playerUrl = buildPlayerUrl(licenseNumber);
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await page.goto(playerUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Attendre le contenu
      try {
        await page.waitForFunction(
          () => document.body && document.body.innerText && document.body.innerText.length > 500,
          { timeout: 10000 }
        );
      } catch (e) {
        // Continue
      }

      // Attendre 5 secondes
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Récupérer toutes les informations possibles
      const pageData = await page.evaluate(() => {
        const bodyText = document.body?.innerText || "";
        const bodyHTML = document.body?.innerHTML || "";
        
        // Chercher tous les textes contenant "simple" ou des nombres
        const simpleMatches: string[] = [];
        const allNumbers: string[] = [];
        
        // Chercher dans tous les éléments
        const allElements = Array.from(document.querySelectorAll('*'));
        for (const el of allElements) {
          const text = el.textContent || "";
          if (text.toLowerCase().includes("simple")) {
            simpleMatches.push(text.substring(0, 200));
          }
          // Extraire tous les nombres de 3-5 chiffres
          const numbers = text.match(/\d{3,5}/g) || [];
          allNumbers.push(...numbers);
        }
        
        // Chercher dans le texte brut
        const textMatches = bodyText.match(/simple[^]{0,100}/gi) || [];
        
        return {
          title: document.title,
          url: window.location.href,
          bodyTextLength: bodyText.length,
          bodyTextPreview: bodyText.substring(0, 3000),
          simpleMatches: simpleMatches.slice(0, 20),
          textMatches: textMatches.slice(0, 20),
          allNumbers: Array.from(new Set(allNumbers)).slice(0, 30),
          htmlPreview: bodyHTML.substring(0, 5000),
        };
      });

      await browser.close();

      return NextResponse.json({
        licenseNumber,
        ...pageData,
      });
    } catch (pageError) {
      await browser.close();
      throw pageError;
    }
  } catch (error) {
    return NextResponse.json({
      error: "Erreur",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
