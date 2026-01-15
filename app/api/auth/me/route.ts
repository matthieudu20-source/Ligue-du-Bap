import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const playerId = request.cookies.get("playerId")?.value;

    if (!playerId) {
      return NextResponse.json({ player: null }, { status: 200 });
    }

    const player = await prisma.player.findUnique({
      where: { id: parseInt(playerId) },
      select: {
        id: true,
        nickname: true,
        email: true,
        licenseNumber: true,
        singleRankingPoints: true,
        createdAt: true,
      },
    });

    if (!player) {
      // Cookie invalide, on le supprime
      const response = NextResponse.json({ player: null }, { status: 200 });
      response.cookies.delete("playerId");
      return response;
    }

    return NextResponse.json({ player }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la vérification de session:", error);
    return NextResponse.json({ player: null }, { status: 200 });
  }
}
