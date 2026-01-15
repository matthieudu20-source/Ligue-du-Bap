import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Route admin pour mettre à jour manuellement le classement d'un joueur
 * POST /api/admin/update-ranking-manual
 * Body: { licenseNumber: string, singleRankingPoints: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseNumber, singleRankingPoints } = body;

    if (!licenseNumber || singleRankingPoints === undefined) {
      return NextResponse.json(
        { error: "Le numéro de licence et le classement sont requis" },
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

    // Mettre à jour le classement
    const updatedPlayer = await prisma.player.update({
      where: { id: player.id },
      data: {
        singleRankingPoints: parseInt(singleRankingPoints.toString(), 10),
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
      message: "Classement mis à jour manuellement",
      player: updatedPlayer,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour manuelle:", error);
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
