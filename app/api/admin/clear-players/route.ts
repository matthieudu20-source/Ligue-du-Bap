import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Route admin pour supprimer tous les joueurs
 * POST /api/admin/clear-players
 */
export async function POST() {
  try {
    const result = await prisma.player.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `${result.count} joueur(s) supprimé(s)`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des joueurs:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression" },
      { status: 500 }
    );
  }
}
