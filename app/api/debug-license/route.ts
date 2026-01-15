import { NextRequest, NextResponse } from "next/server";
import { buildPlayerUrl } from "@/lib/myffbad";

/**
 * Route de debug pour voir le HTML brut de la page myffbad.fr
 * GET /api/debug-license?license=6835632
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
    
    const response = await fetch(playerUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `Erreur HTTP: ${response.status}`,
        status: response.status,
      });
    }

    const html = await response.text();

    // Chercher tous les patterns qui pourraient contenir "Simple" et des nombres
    const simpleMatches = html.match(/simple[^<]*\d+[^<]*/gi) || [];
    const numberMatches = html.match(/\d{3,5}/g) || [];
    
    // Extraire des sections intéressantes
    const htmlLower = html.toLowerCase();
    const simpleIndex = htmlLower.indexOf("simple");
    const excerpt = simpleIndex > -1 
      ? html.substring(Math.max(0, simpleIndex - 200), Math.min(html.length, simpleIndex + 500))
      : "Aucune occurrence de 'Simple' trouvée";

    return NextResponse.json({
      licenseNumber,
      url: playerUrl,
      htmlLength: html.length,
      status: response.status,
      simpleMatches: simpleMatches.slice(0, 10), // Limiter à 10 résultats
      numberMatchesSample: numberMatches.slice(0, 20), // Échantillon de nombres
      excerpt: excerpt.substring(0, 1000), // Limiter la taille
      hasSimple: htmlLower.includes("simple"),
      htmlPreview: html.substring(0, 2000), // Premiers 2000 caractères
    });
  } catch (error) {
    return NextResponse.json({
      error: "Erreur lors de la récupération",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
