import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/players/list - Récupérer la liste de tous les joueurs (pour sélection d'adversaire)
 */
export async function GET(request: NextRequest) {
  try {
    const playerId = request.cookies.get("playerId")?.value;

    if (!playerId) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const players = await prisma.player.findMany({
      select: {
        id: true,
        nickname: true,
        licenseNumber: true,
        singleRankingPoints: true,
      },
      orderBy: {
        nickname: "asc",
      },
    });

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des joueurs:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la récupération des joueurs",
      },
      { status: 500 }
    );
  }
}
