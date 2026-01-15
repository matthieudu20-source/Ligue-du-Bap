import { NextRequest, NextResponse } from "next/server";
import { getPlayerInfo } from "@/lib/myffbad";

/**
 * Route de test pour vérifier la validation d'un numéro de licence
 * GET /api/test-license?license=00398522
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

  const playerInfo = await getPlayerInfo(licenseNumber);

  return NextResponse.json({
    licenseNumber,
    isValid: playerInfo.isValid,
    singleRankingPoints: playerInfo.singleRankingPoints,
    name: playerInfo.name,
    message: playerInfo.isValid 
      ? "✅ Numéro de licence valide" 
      : "❌ Numéro de licence invalide ou joueur non trouvé",
  });
}
