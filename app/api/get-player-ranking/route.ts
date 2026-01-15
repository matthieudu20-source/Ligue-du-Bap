import { NextRequest, NextResponse } from "next/server";
import { getPlayerInfo } from "@/lib/myffbad";

/**
 * Route pour obtenir le classement d'un joueur
 * GET /api/get-player-ranking?license=00358915
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
    const playerInfo = await getPlayerInfo(licenseNumber);
    
    return NextResponse.json({
      licenseNumber,
      isValid: playerInfo.isValid,
      singleRankingPoints: playerInfo.singleRankingPoints,
      name: playerInfo.name,
      message: playerInfo.isValid 
        ? (playerInfo.singleRankingPoints 
          ? `Classement Simple: ${playerInfo.singleRankingPoints} points`
          : "Joueur valide mais classement non trouvé")
        : "Joueur non trouvé ou invalide",
    });
  } catch (error) {
    return NextResponse.json({
      error: "Erreur",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
