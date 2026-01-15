import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body; // identifier peut être email ou pseudo

    // Validation basique
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/pseudo et mot de passe requis" },
        { status: 400 }
      );
    }

    // Chercher le joueur par email ou pseudo
    const player = await prisma.player.findFirst({
      where: {
        OR: [{ email: identifier }, { nickname: identifier }],
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, player.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Créer une session simple avec un cookie
    const response = NextResponse.json(
      {
        message: "Connexion réussie",
        player: {
          id: player.id,
          nickname: player.nickname,
          email: player.email,
        },
      },
      { status: 200 }
    );

    // Stocker l'ID du joueur dans un cookie sécurisé
    // En production, on utiliserait un cookie signé, mais pour l'apprentissage on reste simple
    response.cookies.set("playerId", player.id.toString(), {
      httpOnly: true, // Empêche l'accès via JavaScript côté client
      secure: process.env.NODE_ENV === "production", // HTTPS en production
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return response;
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors de la connexion",
        ...(process.env.NODE_ENV === "development" && { 
          details: errorMessage,
          stack: errorStack 
        }),
      },
      { status: 500 }
    );
  }
}
