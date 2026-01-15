import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/ranking - Récupérer le classement général et les maillots
 * Query params: ?month=X&year=Y (optionnel, pour les maillots mensuels, par défaut mois/année actuel)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Déterminer le mois et l'année pour les maillots mensuels
    const now = new Date();
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();

    // Récupérer tous les joueurs
    const players = await prisma.player.findMany({
      select: {
        id: true,
        nickname: true,
      },
    });

    // Récupérer tous les matchs pour le classement général
    const allMatches = await prisma.match.findMany({
      select: {
        id: true,
        player1Id: true,
        player2Id: true,
        player1Sets: true,
        player2Sets: true,
        matchDate: true,
        month: true,
        year: true,
      },
    });

    // Calculer le classement général (1 victoire = 1 point, 1 défaite = 0 point)
    const generalRanking: Array<{
      playerId: number;
      nickname: string;
      wins: number;
      losses: number;
      points: number;
    }> = players.map((player) => {
      let wins = 0;
      let losses = 0;

      // Compter les victoires et défaites
      for (const match of allMatches) {
        if (match.player1Id === player.id) {
          if (match.player1Sets === 2) {
            wins++;
          } else {
            losses++;
          }
        } else if (match.player2Id === player.id) {
          if (match.player2Sets === 2) {
            wins++;
          } else {
            losses++;
          }
        }
      }

      return {
        playerId: player.id,
        nickname: player.nickname,
        wins,
        losses,
        points: wins, // 1 victoire = 1 point
      };
    });

    // Trier par points décroissants, puis par nombre de victoires, puis par nombre de défaites croissantes
    generalRanking.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return a.losses - b.losses;
    });

    // Calculer le classement général au début du mois (pour le maillot à points)
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const matchesBeforeMonth = allMatches.filter(
      (match) => new Date(match.matchDate) < firstDayOfMonth
    );

    const rankingAtStartOfMonth: Array<{
      playerId: number;
      points: number;
      rank: number;
    }> = players.map((player) => {
      let points = 0;
      for (const match of matchesBeforeMonth) {
        if (match.player1Id === player.id && match.player1Sets === 2) {
          points++;
        } else if (match.player2Id === player.id && match.player2Sets === 2) {
          points++;
        }
      }
      return { playerId: player.id, points, rank: 0 };
    });

    rankingAtStartOfMonth.sort((a, b) => b.points - a.points);
    rankingAtStartOfMonth.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Créer un map pour accéder rapidement au classement au début du mois
    const rankingMap = new Map<number, number>();
    rankingAtStartOfMonth.forEach((entry) => {
      rankingMap.set(entry.playerId, entry.rank);
    });

    // Récupérer les matchs du mois pour les maillots mensuels
    const monthMatches = allMatches.filter(
      (match) => match.month === month && match.year === year
    );

    // Calculer le maillot à points (joueur ayant battu le plus de joueurs mieux classés)
    const pointsJersey: Array<{
      playerId: number;
      nickname: string;
      count: number;
    }> = players.map((player) => {
      let count = 0;
      const playerRankAtStart = rankingMap.get(player.id) || Infinity;

      for (const match of monthMatches) {
        let winnerId: number | null = null;
        let loserId: number | null = null;

        if (match.player1Id === player.id) {
          if (match.player1Sets === 2) {
            winnerId = player.id;
            loserId = match.player2Id;
          } else {
            loserId = player.id;
            winnerId = match.player2Id;
          }
        } else if (match.player2Id === player.id) {
          if (match.player2Sets === 2) {
            winnerId = player.id;
            loserId = match.player1Id;
          } else {
            loserId = player.id;
            winnerId = match.player1Id;
          }
        }

        // Si ce joueur a gagné et que l'adversaire était mieux classé au début du mois
        if (winnerId === player.id && loserId !== null) {
          const opponentRankAtStart = rankingMap.get(loserId) || Infinity;
          if (opponentRankAtStart < playerRankAtStart) {
            count++;
          }
        }
      }

      return {
        playerId: player.id,
        nickname: player.nickname,
        count,
      };
    });

    pointsJersey.sort((a, b) => b.count - a.count);
    const maillotPoints = pointsJersey.length > 0 && pointsJersey[0].count > 0
      ? {
          playerId: pointsJersey[0].playerId,
          nickname: pointsJersey[0].nickname,
          count: pointsJersey[0].count,
        }
      : null;

    // Calculer le maillot vert (joueur ayant gagné le plus de matchs la dernière semaine du mois)
    // month est 1-12, donc pour obtenir le dernier jour du mois, on utilise month (qui devient le mois suivant en JS)
    const lastDayOfMonth = new Date(year, month, 0); // Dernier jour du mois
    const lastDay = lastDayOfMonth.getDate();
    const lastWeekStart = new Date(year, month - 1, Math.max(1, lastDay - 6)); // 7 jours avant la fin du mois

    const lastWeekMatches = monthMatches.filter((match) => {
      const matchDate = new Date(match.matchDate);
      return matchDate >= lastWeekStart && matchDate <= lastDayOfMonth;
    });

    const greenJersey: Array<{
      playerId: number;
      nickname: string;
      wins: number;
    }> = players.map((player) => {
      let wins = 0;

      for (const match of lastWeekMatches) {
        if (match.player1Id === player.id && match.player1Sets === 2) {
          wins++;
        } else if (match.player2Id === player.id && match.player2Sets === 2) {
          wins++;
        }
      }

      return {
        playerId: player.id,
        nickname: player.nickname,
        wins,
      };
    });

    greenJersey.sort((a, b) => b.wins - a.wins);
    const maillotVert = greenJersey.length > 0 && greenJersey[0].wins > 0
      ? {
          playerId: greenJersey[0].playerId,
          nickname: greenJersey[0].nickname,
          wins: greenJersey[0].wins,
        }
      : null;

    // Calculer le maillot blanc (joueur avec le plus de matchs sur le mois)
    const whiteJersey: Array<{
      playerId: number;
      nickname: string;
      matchCount: number;
    }> = players.map((player) => {
      let matchCount = 0;

      for (const match of monthMatches) {
        if (match.player1Id === player.id || match.player2Id === player.id) {
          matchCount++;
        }
      }

      return {
        playerId: player.id,
        nickname: player.nickname,
        matchCount,
      };
    });

    whiteJersey.sort((a, b) => b.matchCount - a.matchCount);
    const maillotBlanc = whiteJersey.length > 0 && whiteJersey[0].matchCount > 0
      ? {
          playerId: whiteJersey[0].playerId,
          nickname: whiteJersey[0].nickname,
          matchCount: whiteJersey[0].matchCount,
        }
      : null;

    // Maillot jaune : 1er au classement général
    const maillotJaune = generalRanking.length > 0 && generalRanking[0].points > 0
      ? {
          playerId: generalRanking[0].playerId,
          nickname: generalRanking[0].nickname,
          points: generalRanking[0].points,
        }
      : null;

    return NextResponse.json({
      generalRanking,
      maillots: {
        jaune: maillotJaune,
        points: maillotPoints,
        vert: maillotVert,
        blanc: maillotBlanc,
      },
      month,
      year,
    });
  } catch (error) {
    console.error("Erreur lors du calcul du classement:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors du calcul du classement",
      },
      { status: 500 }
    );
  }
}
