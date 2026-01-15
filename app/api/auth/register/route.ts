import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getPlayerInfo } from "@/lib/myffbad";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, email, password, licenseNumber } = body;

    // Validation basique
    if (!nickname || !email || !password || !licenseNumber) {
      return NextResponse.json(
        { error: "Tous les champs sont requis, y compris le numéro de licence" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Valider le format du numéro de licence (doit être numérique)
    if (!/^\d+$/.test(licenseNumber)) {
      return NextResponse.json(
        { error: "Le numéro de licence doit être composé uniquement de chiffres" },
        { status: 400 }
      );
    }

    // Vérifier si le pseudo, l'email ou le numéro de licence existe déjà
    const existingPlayer = await prisma.player.findFirst({
      where: {
        OR: [{ nickname }, { email }, { licenseNumber }],
      },
    });

    if (existingPlayer) {
      if (existingPlayer.nickname === nickname) {
        return NextResponse.json(
          { error: "Ce pseudo est déjà utilisé" },
          { status: 400 }
        );
      }
      if (existingPlayer.email === email) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 400 }
        );
      }
      if (existingPlayer.licenseNumber === licenseNumber) {
        return NextResponse.json(
          { error: "Ce numéro de licence est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Vérifier que le numéro de licence est valide sur myffbad.fr
    // et récupérer le classement de simple
    const playerInfo = await getPlayerInfo(licenseNumber);

    if (!playerInfo.isValid) {
      return NextResponse.json(
        { error: "Le numéro de licence n'est pas valide ou le joueur n'existe pas sur myffbad.fr" },
        { status: 400 }
      );
    }

    // Note: Le classement peut être null si la page est une SPA (React) qui nécessite JavaScript
    // Le joueur peut quand même s'inscrire, le classement pourra être mis à jour plus tard

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer le joueur avec le numéro de licence et le classement
    const player = await prisma.player.create({
      data: {
        nickname,
        email,
        passwordHash,
        licenseNumber,
        singleRankingPoints: playerInfo.singleRankingPoints ?? null,
      },
      // Ne pas retourner le hash du mot de passe
      select: {
        id: true,
        nickname: true,
        email: true,
        licenseNumber: true,
        singleRankingPoints: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { 
        message: "Joueur créé avec succès", 
        player,
        rankingInfo: {
          singleRankingPoints: playerInfo.singleRankingPoints,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors de l'inscription",
        ...(process.env.NODE_ENV === "development" && { details: errorMessage }),
      },
      { status: 500 }
    );
  }
}
