import { NextRequest, NextResponse } from "next/server";

/**
 * Route pour trouver le contexte du classement sur la page
 * GET /api/find-ranking-context?license=6835632&ranking=2413
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const licenseNumber = searchParams.get("license");
  const ranking = searchParams.get("ranking");

  if (!licenseNumber || !ranking) {
    return NextResponse.json(
      { error: "Les paramètres 'license' et 'ranking' sont requis" },
      { status: 400 }
    );
  }

  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const normalizedLicense = licenseNumber.padStart(8, '0');
      const url = `https://www.myffbad.fr/joueur/${normalizedLicense}`;
      
      console.log(`🔍 Recherche du classement ${ranking} sur ${url}`);
      
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      
      // Attendre que le contenu se charge
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const textLength = await page.evaluate(() => (document.body?.innerText || '').length);
        if (textLength > 1000) {
          console.log(`✅ Contenu chargé (${textLength} caractères)`);
          break;
        }
      }
      
      // Chercher où se trouve le classement
      const result = await page.evaluate((searchRanking) => {
        const bodyText = document.body?.innerText || '';
        const bodyHTML = document.body?.innerHTML || '';
        
        // Chercher le classement dans le texte
        const textIndex = bodyText.indexOf(searchRanking);
        const htmlIndex = bodyHTML.indexOf(searchRanking);
        
        let textContext = '';
        let htmlContext = '';
        
        if (textIndex > -1) {
          textContext = bodyText.substring(Math.max(0, textIndex - 300), textIndex + 300);
        }
        
        if (htmlIndex > -1) {
          htmlContext = bodyHTML.substring(Math.max(0, htmlIndex - 800), htmlIndex + 800);
        }
        
        // Chercher "Simple" ou "N3" près du classement
        const simpleContext = [];
        const simpleIndex = bodyText.toLowerCase().indexOf('simple');
        if (simpleIndex > -1) {
          const ctx = bodyText.substring(Math.max(0, simpleIndex - 400), simpleIndex + 400);
          if (ctx.includes(searchRanking)) {
            simpleContext.push(ctx);
          }
        }
        
        const n3Index = bodyText.indexOf('N3');
        if (n3Index > -1) {
          const ctx = bodyText.substring(Math.max(0, n3Index - 400), n3Index + 400);
          if (ctx.includes(searchRanking)) {
            simpleContext.push(ctx);
          }
        }
        
        // Chercher tous les patterns qui contiennent le classement
        const patterns = [
          new RegExp(`simple[^\\d]*${searchRanking}`, 'i'),
          new RegExp(`${searchRanking}[^\\d]*simple`, 'i'),
          new RegExp(`N3[^\\d]*${searchRanking}`, 'i'),
          new RegExp(`${searchRanking}[^\\d]*N3`, 'i'),
        ];
        
        const patternMatches = [];
        for (const pattern of patterns) {
          const match = bodyText.match(pattern);
          if (match) {
            patternMatches.push(match[0]);
          }
        }
        
        // Chercher dans les éléments HTML
        const elementsWithRanking = [];
        const allElements = Array.from(document.querySelectorAll('*'));
        for (const el of allElements) {
          const text = el.textContent || '';
          if (text.includes(searchRanking)) {
            elementsWithRanking.push({
              tag: el.tagName,
              className: el.className,
              id: el.id,
              text: text.substring(0, 300),
            });
            if (elementsWithRanking.length >= 5) break;
          }
        }
        
        return {
          textIndex,
          htmlIndex,
          textContext,
          htmlContext,
          simpleContext,
          patternMatches,
          elementsWithRanking,
          bodyTextLength: bodyText.length,
          bodyTextPreview: bodyText.substring(0, 3000),
        };
      }, ranking);
      
      await browser.close();
      
      return NextResponse.json({
        licenseNumber,
        ranking,
        url,
        normalizedLicense,
        ...result,
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
