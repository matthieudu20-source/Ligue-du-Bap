import { NextRequest, NextResponse } from "next/server";

/**
 * Route simple pour récupérer le classement d'un joueur
 * GET /api/simple-ranking?license=6835632
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
    const url = `https://www.myffbad.fr/joueur/${licenseNumber}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();
    
    // Chercher le classement de simple dans le HTML
    // Patterns simples
    const patterns = [
      /simple[:\s]+(\d{3,5})/i,
      /"simple"[:\s]+(\d+)/i,
      /simple[^>]*>.*?(\d{3,5})/i,
    ];

    let ranking: number | null = null;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > 100 && num < 100000) {
          ranking = num;
          break;
        }
      }
    }

    return NextResponse.json({
      licenseNumber,
      ranking,
      url,
      htmlLength: html.length,
      found: ranking !== null,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Erreur",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
