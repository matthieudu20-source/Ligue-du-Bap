import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayerInfo } from "@/lib/myffbad";

/**
 * Route pour mettre à jour le classement d'un joueur
 * POST /api/players/update-ranking
 * Body: { licenseNumber: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseNumber } = body;

    if (!licenseNumber) {
      return NextResponse.json(
        { error: "Le numéro de licence est requis" },
        { status: 400 }
      );
    }

    // Trouver le joueur
    const player = await prisma.player.findUnique({
      where: { licenseNumber },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Joueur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les infos depuis myffbad.fr
    const playerInfo = await getPlayerInfo(licenseNumber);

    if (!playerInfo.isValid) {
      return NextResponse.json(
        { error: "Impossible de récupérer les informations du joueur" },
        { status: 400 }
      );
    }

    // Mettre à jour le classement
    const updatedPlayer = await prisma.player.update({
      where: { id: player.id },
      data: {
        singleRankingPoints: playerInfo.singleRankingPoints,
      },
      select: {
        id: true,
        nickname: true,
        licenseNumber: true,
        singleRankingPoints: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Classement mis à jour",
      player: updatedPlayer,
      rankingInfo: {
        singleRankingPoints: playerInfo.singleRankingPoints,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du classement:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors de la mise à jour",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
