import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/matches/[id] - Modifier un match existant
 * Body: { 
 *   player2Id: number, 
 *   matchDate: string,
 *   sets: [{ player1Score: number, player2Score: number }] // 2 ou 3 sets
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const playerId = request.cookies.get("playerId")?.value;

    if (!playerId) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const matchId = parseInt(id);
    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: "ID de match invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le match existe et appartient au joueur connecté
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!existingMatch) {
      return NextResponse.json(
        { error: "Match introuvable" },
        { status: 404 }
      );
    }

    const player1Id = parseInt(playerId);
    
    // Seul le joueur qui a créé le match (player1) peut le modifier
    if (existingMatch.player1Id !== player1Id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier ce match" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { player2Id, matchDate, sets } = body;

    // Validation
    if (!player2Id || !matchDate || !sets || !Array.isArray(sets)) {
      return NextResponse.json(
        { error: "Tous les champs sont requis (player2Id, matchDate, sets)" },
        { status: 400 }
      );
    }

    // Un match doit avoir au minimum 2 sets
    if (sets.length < 2 || sets.length > 3) {
      return NextResponse.json(
        { error: "Un match doit avoir 2 ou 3 sets" },
        { status: 400 }
      );
    }

    // Un joueur ne peut pas jouer contre lui-même
    if (player1Id === player2Id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas jouer contre vous-même" },
        { status: 400 }
      );
    }

    // Valider et calculer qui a gagné chaque set
    let player1SetsWon = 0;
    let player2SetsWon = 0;

    const setScores: {
      set1Player1Score?: number;
      set1Player2Score?: number;
      set2Player1Score?: number;
      set2Player2Score?: number;
      set3Player1Score?: number;
      set3Player2Score?: number;
    } = {};

    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      if (!set.player1Score || !set.player2Score) {
        return NextResponse.json(
          { error: `Le set ${i + 1} doit avoir des scores valides pour les deux joueurs` },
          { status: 400 }
        );
      }

      const player1Score = parseInt(set.player1Score);
      const player2Score = parseInt(set.player2Score);

      // Validation des scores (doivent être positifs)
      if (player1Score < 0 || player2Score < 0) {
        return NextResponse.json(
          { error: `Les scores du set ${i + 1} doivent être positifs` },
          { status: 400 }
        );
      }

      // Validation selon les règles du badminton
      // - Un set se gagne à 21 points
      // - Si les deux joueurs sont à au moins 19 points, il faut 2 points d'écart
      // - Sinon, on peut gagner à 21 avec n'importe quel écart (21-3, 21-0, etc.)
      // - Maximum 30 points (29-29 → 30-29)
      const maxScore = Math.max(player1Score, player2Score);
      const minScore = Math.min(player1Score, player2Score);
      const diff = Math.abs(player1Score - player2Score);

      // Le score maximum est 30
      if (maxScore > 30) {
        return NextResponse.json(
          { error: `Le score maximum dans un set est 30 (set ${i + 1})` },
          { status: 400 }
        );
      }

      // Si le score maximum est 30, on peut gagner avec 1 ou 2 points d'écart
      // 30-29 si on était à 29-29 (point décisif)
      // 30-28 si on était à 28-28 ou 29-28 puis arrivée à 30-28
      if (maxScore === 30) {
        if (minScore < 28 || minScore > 29 || diff < 1 || diff > 2) {
          return NextResponse.json(
            { error: `À 30 points, le score doit être 30-29 ou 30-28 (set ${i + 1})` },
            { status: 400 }
          );
        }
      } else if (maxScore === 21) {
        // À 21 points, si le perdant a 19 ou plus, il faut exactement 2 points d'écart
        if (minScore >= 19 && diff !== 2) {
          return NextResponse.json(
            { error: `Si les deux joueurs sont à au moins 19 points, il faut exactement 2 points d'écart (set ${i + 1})` },
            { status: 400 }
          );
        }
        // Si le perdant a moins de 19, l'écart peut être 2 ou plus (21-8, 21-9, 21-3, etc.)
        // Mais il faut quand même un écart d'au moins 2 (21-20 n'est pas valide)
        if (minScore < 19 && diff < 2) {
          return NextResponse.json(
            { error: `Il faut au moins 2 points d'écart pour gagner un set (set ${i + 1})` },
            { status: 400 }
          );
        }
      } else if (maxScore >= 22 && maxScore <= 29) {
        // Si on dépasse 21, c'est que les deux joueurs étaient à au moins 19
        // Il faut exactement 2 points d'écart
        if (diff !== 2) {
          return NextResponse.json(
            { error: `Au-dessus de 21 points, il faut exactement 2 points d'écart (les deux joueurs étaient à au moins 19) (set ${i + 1})` },
            { status: 400 }
          );
        }
        // Le perdant doit avoir au moins 19 (puisqu'on était à 19-19 ou plus)
        if (minScore < 19) {
          return NextResponse.json(
            { error: `Si on dépasse 21 points, le perdant doit avoir au moins 19 points (on était à 19-19 ou plus) (set ${i + 1})` },
            { status: 400 }
          );
        }
      } else {
        // Si le gagnant a moins de 21, ce n'est pas valide
        return NextResponse.json(
          { error: `Un set se gagne à 21 points minimum (set ${i + 1})` },
          { status: 400 }
        );
      }

      // Le gagnant doit avoir le score le plus élevé
      if (player1Score === player2Score) {
        return NextResponse.json(
          { error: `Le set ${i + 1} ne peut pas être une égalité` },
          { status: 400 }
        );
      }

      // Déterminer le gagnant du set
      if (player1Score > player2Score) {
        player1SetsWon++;
      } else {
        player2SetsWon++;
      }

      // Stocker les scores du set
      if (i === 0) {
        setScores.set1Player1Score = player1Score;
        setScores.set1Player2Score = player2Score;
      } else if (i === 1) {
        setScores.set2Player1Score = player1Score;
        setScores.set2Player2Score = player2Score;
      } else if (i === 2) {
        setScores.set3Player1Score = player1Score;
        setScores.set3Player2Score = player2Score;
      }
    }

    // Vérifier qu'il y a un gagnant (2 sets gagnés)
    if (player1SetsWon !== 2 && player2SetsWon !== 2) {
      return NextResponse.json(
        { error: "Un match doit avoir un gagnant (2 sets gagnés)" },
        { status: 400 }
      );
    }

    // Si on a 3 sets, vérifier que le score après 2 sets était 1-1
    if (sets.length === 3) {
      const set1Winner = sets[0].player1Score > sets[0].player2Score ? 1 : 2;
      const set2Winner = sets[1].player1Score > sets[1].player2Score ? 1 : 2;
      
      // Si les 2 premiers sets ont le même gagnant, on ne devrait pas avoir de set 3
      if (set1Winner === set2Winner) {
        return NextResponse.json(
          { error: "Un match en 3 sets n'est possible que si le score est 1-1 après 2 sets" },
          { status: 400 }
        );
      }
    }

    // Vérifier que les deux joueurs existent
    const [player1, player2] = await Promise.all([
      prisma.player.findUnique({ where: { id: player1Id } }),
      prisma.player.findUnique({ where: { id: player2Id } }),
    ]);

    if (!player1 || !player2) {
      return NextResponse.json(
        { error: "Un ou plusieurs joueurs introuvables" },
        { status: 404 }
      );
    }

    // Extraire le mois et l'année de la date
    const date = new Date(matchDate);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();

    // Réinitialiser les scores du set 3 si on passe de 3 sets à 2 sets
    const updateData: any = {
      player2Id,
      player1Sets: player1SetsWon,
      player2Sets: player2SetsWon,
      ...setScores,
      matchDate: date,
      month,
      year,
    };

    // Si on n'a que 2 sets, mettre les scores du set 3 à null
    if (sets.length === 2) {
      updateData.set3Player1Score = null;
      updateData.set3Player2Score = null;
    }

    // Mettre à jour le match
    const match = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        player1: {
          select: {
            id: true,
            nickname: true,
          },
        },
        player2: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Match modifié avec succès",
        match,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la modification du match:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la modification du match",
        ...(process.env.NODE_ENV === "development" && { details: errorMessage }),
      },
      { status: 500 }
    );
  }
}
