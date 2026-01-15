import { NextRequest, NextResponse } from "next/server";
import { buildSearchUrl, extractLicenseNumber } from "@/lib/myffbad";

/**
 * Route API pour rechercher des joueurs sur myffbad.fr
 * 
 * @param request - Requête contenant les paramètres de recherche (query, nom, prenom, licence, etc.)
 * @returns Liste des joueurs trouvés avec leurs numéros de licence
 * 
 * @example
 * GET /api/players/search?q=dupont
 * GET /api/players/search?nom=dupont&prenom=jean
 * GET /api/players/search?licence=00398522
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || searchParams.get("query");
    const nom = searchParams.get("nom");
    const prenom = searchParams.get("prenom");
    const licence = searchParams.get("licence");

    // Construire l'URL de recherche avec les utilitaires
    const searchUrl = buildSearchUrl({
      q: query || undefined,
      nom: nom || undefined,
      prenom: prenom || undefined,
      licence: licence || undefined,
    });

    // Faire l'appel à l'API myffbad.fr
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/html, */*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erreur lors de la recherche: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Essayer de parser la réponse comme JSON, sinon comme HTML
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      // Si c'est du HTML, on devra parser le HTML pour extraire les données
      const html = await response.text();
      // Pour l'instant, on retourne une structure basique
      // Vous pourrez améliorer cela avec un parser HTML si nécessaire
      data = { html, message: "Réponse HTML reçue, parsing nécessaire" };
    }

    return NextResponse.json({
      success: true,
      data,
      searchUrl,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche de joueurs:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la recherche" },
      { status: 500 }
    );
  }
}
