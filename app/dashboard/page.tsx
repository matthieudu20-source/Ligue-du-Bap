"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Player {
  id: number;
  nickname: string;
  email: string;
  licenseNumber: string;
  singleRankingPoints: number | null;
}

interface MatchPlayer {
  id: number;
  nickname: string;
}

interface Match {
  id: number;
  player1Id: number;
  player2Id: number;
  player1Sets: number;
  player2Sets: number;
  set1Player1Score: number | null;
  set1Player2Score: number | null;
  set2Player1Score: number | null;
  set2Player2Score: number | null;
  set3Player1Score: number | null;
  set3Player2Score: number | null;
  matchDate: string;
  month: number;
  year: number;
  player1: MatchPlayer;
  player2: MatchPlayer;
}

interface RankingEntry {
  playerId: number;
  nickname: string;
  wins: number;
  losses: number;
  points: number;
}

interface Maillot {
  playerId: number;
  nickname: string;
  count?: number;
  wins?: number;
  matchCount?: number;
  points?: number;
}

interface RankingData {
  generalRanking: RankingEntry[];
  maillots: {
    jaune: Maillot | null;
    points: Maillot | null;
    vert: Maillot | null;
    blanc: Maillot | null;
  };
  month: number;
  year: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Array<{ id: number; nickname: string }>>([]);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchForm, setMatchForm] = useState({
    player2Id: "",
    matchDate: new Date().toISOString().split("T")[0],
    sets: [
      { player1Score: "", player2Score: "" },
      { player1Score: "", player2Score: "" },
    ],
  });
  const [showThirdSet, setShowThirdSet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.player) {
          setPlayer(data.player);
          // Charger les matchs
          loadMatches();
          // Charger la liste des joueurs (en excluant le joueur connecté)
          loadPlayers(data.player.id);
          // Charger le classement et les maillots
          loadRanking();
        } else {
          // Pas connecté, rediriger vers la page de connexion
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push("/login");
      });
  }, [router]);

  const loadMatches = async () => {
    try {
      const response = await fetch("/api/matches");
      const data = await response.json();
      if (response.ok) {
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des matchs:", error);
    }
  };

  const loadPlayers = async (currentPlayerId: number) => {
    try {
      const response = await fetch("/api/players/list");
      const data = await response.json();
      if (response.ok) {
        // Exclure le joueur connecté de la liste
        const filteredPlayers = (data.players || []).filter(
          (p: { id: number }) => p.id !== currentPlayerId
        );
        setPlayers(filteredPlayers);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des joueurs:", error);
    }
  };

  const loadRanking = async () => {
    try {
      const response = await fetch("/api/ranking");
      const data = await response.json();
      if (response.ok) {
        setRankingData(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du classement:", error);
    }
  };

  const handleSubmitMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatchError("");
    setSubmitting(true);

    try {
      const player2Id = parseInt(matchForm.player2Id);
      
      // Préparer les sets (2 ou 3)
      const setsToSend = showThirdSet && matchForm.sets[2]?.player1Score && matchForm.sets[2]?.player2Score
        ? matchForm.sets.slice(0, 3)
        : matchForm.sets.slice(0, 2);

      // Vérifier que tous les sets ont des scores
      if (!setsToSend.every(set => set.player1Score && set.player2Score)) {
        setMatchError("Tous les sets doivent avoir des scores");
        setSubmitting(false);
        return;
      }

      const isEditing = editingMatchId !== null;
      const url = isEditing ? `/api/matches/${editingMatchId}` : "/api/matches";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player2Id,
          matchDate: matchForm.matchDate,
          sets: setsToSend.map(set => ({
            player1Score: parseInt(set.player1Score),
            player2Score: parseInt(set.player2Score),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMatchError(data.error || "Une erreur est survenue");
        setSubmitting(false);
        return;
      }

      // Réinitialiser le formulaire et recharger les matchs
      setMatchForm({
        player2Id: "",
        matchDate: new Date().toISOString().split("T")[0],
        sets: [
          { player1Score: "", player2Score: "" },
          { player1Score: "", player2Score: "" },
        ],
      });
      setShowThirdSet(false);
      setShowMatchForm(false);
      setEditingMatchId(null);
      await loadMatches();
      await loadRanking();
      setSubmitting(false);
    } catch (error) {
      setMatchError(editingMatchId !== null ? "Une erreur est survenue lors de la modification du match" : "Une erreur est survenue lors de la création du match");
      setSubmitting(false);
    }
  };

  const handleEditMatch = (match: Match) => {
    const isPlayer1 = match.player1Id === player?.id;
    
    // Préparer les sets
    const sets = [
      {
        player1Score: isPlayer1 
          ? (match.set1Player1Score?.toString() || "")
          : (match.set1Player2Score?.toString() || ""),
        player2Score: isPlayer1
          ? (match.set1Player2Score?.toString() || "")
          : (match.set1Player1Score?.toString() || ""),
      },
      {
        player1Score: isPlayer1
          ? (match.set2Player1Score?.toString() || "")
          : (match.set2Player2Score?.toString() || ""),
        player2Score: isPlayer1
          ? (match.set2Player2Score?.toString() || "")
          : (match.set2Player1Score?.toString() || ""),
      },
    ];

    // Ajouter le set 3 si présent
    if (match.set3Player1Score !== null && match.set3Player2Score !== null) {
      sets.push({
        player1Score: isPlayer1
          ? (match.set3Player1Score.toString() || "")
          : (match.set3Player2Score.toString() || ""),
        player2Score: isPlayer1
          ? (match.set3Player2Score.toString() || "")
          : (match.set3Player1Score.toString() || ""),
      });
      setShowThirdSet(true);
    } else {
      setShowThirdSet(false);
    }

    // Formater la date pour l'input date
    const matchDate = new Date(match.matchDate);
    const dateStr = matchDate.toISOString().split("T")[0];

    setMatchForm({
      player2Id: (isPlayer1 ? match.player2Id : match.player1Id).toString(),
      matchDate: dateStr,
      sets,
    });

    setEditingMatchId(match.id);
    setShowMatchForm(true);
    setMatchError("");
  };

  const handleCancelEdit = () => {
    setMatchForm({
      player2Id: "",
      matchDate: new Date().toISOString().split("T")[0],
      sets: [
        { player1Score: "", player2Score: "" },
        { player1Score: "", player2Score: "" },
      ],
    });
    setShowThirdSet(false);
    setShowMatchForm(false);
    setEditingMatchId(null);
    setMatchError("");
  };

  const validateSetScore = (player1Score: number, player2Score: number): string | null => {
    if (player1Score < 0 || player2Score < 0) return null; // Pas encore rempli
    
    const maxScore = Math.max(player1Score, player2Score);
    const minScore = Math.min(player1Score, player2Score);
    const diff = Math.abs(player1Score - player2Score);

    // Le score maximum est 30
    if (maxScore > 30) {
      return "Le score maximum est 30 points";
    }

    // Si le gagnant a moins de 21, ce n'est pas valide
    if (maxScore < 21) {
      return "Un set se gagne à 21 points minimum";
    }

    // Si le score maximum est 30, on peut gagner avec 1 ou 2 points d'écart
    // 30-29 si on était à 29-29 (point décisif)
    // 30-28 si on était à 28-28 ou 29-28 puis arrivée à 30-28
    if (maxScore === 30) {
      if (minScore < 28 || minScore > 29 || diff < 1 || diff > 2) {
        return "À 30 points, le score doit être 30-29 ou 30-28";
      }
      return null; // Valide
    } else if (maxScore === 21) {
      // À 21 points, si le perdant a 19 ou plus, il faut exactement 2 points d'écart
      if (minScore >= 19 && diff !== 2) {
        return "Si les deux joueurs sont à au moins 19 points, il faut exactement 2 points d'écart";
      }
      // Si le perdant a moins de 19, l'écart peut être 2 ou plus (21-8, 21-9, 21-3, etc.)
      // Mais il faut quand même un écart d'au moins 2 (21-20 n'est pas valide)
      if (minScore < 19 && diff < 2) {
        return "Il faut au moins 2 points d'écart pour gagner";
      }
      return null; // Valide
    } else if (maxScore >= 22 && maxScore <= 29) {
      // Si on dépasse 21, c'est que les deux joueurs étaient à au moins 19
      // Il faut exactement 2 points d'écart
      if (diff !== 2) {
        return "Au-dessus de 21 points, il faut exactement 2 points d'écart (les deux joueurs étaient à au moins 19)";
      }
      // Le perdant doit avoir au moins 19
      if (minScore < 19) {
        return "Si on dépasse 21 points, le perdant doit avoir au moins 19 points";
      }
      return null; // Valide
    }

    return null; // Valide
  };

  const updateSetScore = (setIndex: number, field: "player1Score" | "player2Score", value: string) => {
    // Empêcher les valeurs négatives
    if (value !== "" && value !== "-") {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue < 0) {
        return; // Ne pas mettre à jour si négatif
      }
    }
    
    const newSets = [...matchForm.sets];
    if (!newSets[setIndex]) {
      newSets[setIndex] = { player1Score: "", player2Score: "" };
    }
    newSets[setIndex][field] = value;
    setMatchForm({ ...matchForm, sets: newSets });

    // Si on remplit le set 2 et qu'il y a égalité (1-1), proposer le set 3
    if (setIndex === 1 && newSets[0].player1Score && newSets[0].player2Score && newSets[1].player1Score && newSets[1].player2Score) {
      const set1Score1 = parseInt(newSets[0].player1Score);
      const set1Score2 = parseInt(newSets[0].player2Score);
      const set2Score1 = parseInt(newSets[1].player1Score);
      const set2Score2 = parseInt(newSets[1].player2Score);
      
      if (!isNaN(set1Score1) && !isNaN(set1Score2) && !isNaN(set2Score1) && !isNaN(set2Score2)) {
        const set1Winner = set1Score1 > set1Score2 ? 1 : 2;
        const set2Winner = set2Score1 > set2Score2 ? 1 : 2;
        if (set1Winner !== set2Winner) {
          // Égalité 1-1, permettre le set 3
          if (!showThirdSet) {
            setShowThirdSet(true);
            if (newSets.length < 3) {
              newSets.push({ player1Score: "", player2Score: "" });
              setMatchForm({ ...matchForm, sets: newSets });
            }
          }
        } else {
          // 2-0, cacher le set 3
          setShowThirdSet(false);
        }
      }
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Chargement...</p>
      </main>
    );
  }

  if (!player) {
    return null; // La redirection va se faire
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      <header className="px-4 pt-10 pb-4 sm:px-6 flex items-center gap-4">
        <div className="shrink-0">
          <Image
            src="/bap-logo.png"
            alt="Logo du club Bad' à Paname"
            width={56}
            height={56}
            className="rounded-xl shadow-md"
            priority
          />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Ligue du BAP
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-md">
            Bienvenue, {player.nickname} !
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
        >
          Déconnexion
        </button>
      </header>

      <section className="px-4 sm:px-6 mt-4 flex-1">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Classement général et maillots */}
          {rankingData && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">
                Classement Général
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                1 victoire = 1 point • 1 défaite = 0 point
              </p>
              
              {rankingData.generalRanking.length === 0 ? (
                <div className="text-slate-400 text-center py-4">
                  Aucun match joué encore
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {rankingData.generalRanking.map((entry, index) => (
                    <div
                      key={entry.playerId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0
                          ? "bg-yellow-500/20 border border-yellow-500/30"
                          : index === 1
                          ? "bg-slate-700/50 border border-slate-600"
                          : index === 2
                          ? "bg-amber-600/20 border border-amber-600/30"
                          : "bg-slate-700/30 border border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 text-center font-bold text-slate-300">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-slate-100">
                            {entry.nickname}
                            {index === 0 && rankingData.maillots.jaune && (
                              <span className="ml-2 text-yellow-400">🏆</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {entry.wins}V - {entry.losses}D
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-emerald-400">
                        {entry.points} pt{entry.points > 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Maillots */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Maillots du mois</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Maillot Jaune */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="#EAB308" stroke="#FCD34D" strokeWidth="1.5">
                        <path d="M44 12.09c3.92 1.62 12 12 12 12l-8 8-4-4v24H20v-24l-4 4-8-8s8.08-10.38 12-12c.92-.39 4 0 4 0 0 4 4 8 8 8s8-4 8-8c0 0 3.08-.39 4 0z"/>
                      </svg>
                      <h4 className="font-semibold text-yellow-400">Maillot Jaune</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">1er au classement général</p>
                    {rankingData.maillots.jaune ? (
                      <div className="text-slate-100 font-medium">
                        {rankingData.maillots.jaune.nickname}
                        <span className="text-sm text-slate-400 ml-2">
                          ({rankingData.maillots.jaune.points} pts)
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">Aucun</div>
                    )}
                  </div>

                  {/* Maillot à Pois */}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <clipPath id="shirt-clip">
                            <path d="M44 12.09c3.92 1.62 12 12 12 12l-8 8-4-4v24H20v-24l-4 4-8-8s8.08-10.38 12-12c.92-.39 4 0 4 0 0 4 4 8 8 8s8-4 8-8c0 0 3.08-.39 4 0z"/>
                          </clipPath>
                        </defs>
                        <path d="M44 12.09c3.92 1.62 12 12 12 12l-8 8-4-4v24H20v-24l-4 4-8-8s8.08-10.38 12-12c.92-.39 4 0 4 0 0 4 4 8 8 8s8-4 8-8c0 0 3.08-.39 4 0z" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.5"/>
                        <g clipPath="url(#shirt-clip)">
                          {/* Pois rouges - motif régulier en quinconce, espacés de 6 unités horizontalement et 6 verticalement */}
                          <circle cx="22" cy="24" r="2" fill="#DC2626"/>
                          <circle cx="32" cy="24" r="2" fill="#DC2626"/>
                          <circle cx="42" cy="24" r="2" fill="#DC2626"/>
                          <circle cx="27" cy="30" r="2" fill="#DC2626"/>
                          <circle cx="37" cy="30" r="2" fill="#DC2626"/>
                          <circle cx="22" cy="36" r="2" fill="#DC2626"/>
                          <circle cx="32" cy="36" r="2" fill="#DC2626"/>
                          <circle cx="42" cy="36" r="2" fill="#DC2626"/>
                          <circle cx="27" cy="42" r="2" fill="#DC2626"/>
                          <circle cx="37" cy="42" r="2" fill="#DC2626"/>
                        </g>
                      </svg>
                      <h4 className="font-semibold text-red-400">Maillot à Pois</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Plus de victoires contre mieux classés (début du mois)
                    </p>
                    {rankingData.maillots.points ? (
                      <div className="text-slate-100 font-medium">
                        {rankingData.maillots.points.nickname}
                        <span className="text-sm text-slate-400 ml-2">
                          ({rankingData.maillots.points.count ?? 0} victoire{(rankingData.maillots.points.count ?? 0) > 1 ? "s" : ""})
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">Aucun</div>
                    )}
                  </div>

                  {/* Maillot Vert */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="#22C55E" stroke="#4ADE80" strokeWidth="1.5">
                        <path d="M44 12.09c3.92 1.62 12 12 12 12l-8 8-4-4v24H20v-24l-4 4-8-8s8.08-10.38 12-12c.92-.39 4 0 4 0 0 4 4 8 8 8s8-4 8-8c0 0 3.08-.39 4 0z"/>
                      </svg>
                      <h4 className="font-semibold text-green-400">Maillot Vert</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Plus de victoires la dernière semaine du mois
                    </p>
                    {rankingData.maillots.vert ? (
                      <div className="text-slate-100 font-medium">
                        {rankingData.maillots.vert.nickname}
                        <span className="text-sm text-slate-400 ml-2">
                          ({rankingData.maillots.vert.wins ?? 0} victoire{(rankingData.maillots.vert.wins ?? 0) > 1 ? "s" : ""})
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">Aucun</div>
                    )}
                  </div>

                  {/* Maillot Blanc */}
                  <div className="bg-slate-600/30 border border-slate-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="#E2E8F0" stroke="#F1F5F9" strokeWidth="1.5">
                        <path d="M44 12.09c3.92 1.62 12 12 12 12l-8 8-4-4v24H20v-24l-4 4-8-8s8.08-10.38 12-12c.92-.39 4 0 4 0 0 4 4 8 8 8s8-4 8-8c0 0 3.08-.39 4 0z"/>
                      </svg>
                      <h4 className="font-semibold text-slate-300">Maillot du plus combatif</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Plus de matchs joués ce mois
                    </p>
                    {rankingData.maillots.blanc ? (
                      <div className="text-slate-100 font-medium">
                        {rankingData.maillots.blanc.nickname}
                        <span className="text-sm text-slate-400 ml-2">
                          ({rankingData.maillots.blanc.matchCount ?? 0} match{(rankingData.maillots.blanc.matchCount ?? 0) > 1 ? "s" : ""})
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">Aucun</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classement de simple */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Classement Simple
            </h2>
            {player.singleRankingPoints !== null ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/20 text-emerald-400 rounded-lg px-4 py-3 font-semibold text-xl">
                      {player.singleRankingPoints}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-200 font-medium">Points</p>
                      <p className="text-sm text-slate-400">Classement FFBaD</p>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <a
                    href={`https://www.myffbad.fr/joueur/${player.licenseNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                  >
                    Voir sur myffbad.fr →
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-slate-400">
                <p>Classement non disponible</p>
                <p className="text-sm mt-1">
                  Le classement n'a pas pu être récupéré automatiquement.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/players/update-ranking", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ licenseNumber: player.licenseNumber }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        // Recharger les données du joueur
                        window.location.reload();
                      } else {
                        alert("Erreur lors de la mise à jour: " + (data.error || "Erreur inconnue"));
                      }
                    } catch (error) {
                      alert("Erreur lors de la mise à jour du classement");
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition text-sm"
                >
                  Essayer de mettre à jour
                </button>
              </div>
            )}
          </div>

          {/* Saisie de match */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Mes matchs</h2>
              <button
                onClick={() => {
                  if (showMatchForm) {
                    handleCancelEdit();
                  } else {
                    setShowMatchForm(true);
                  }
                }}
                className="px-4 py-2 bg-emerald-500 text-slate-900 font-medium rounded-lg hover:bg-emerald-400 transition text-sm"
              >
                {showMatchForm ? "Annuler" : "+ Nouveau match"}
              </button>
            </div>

            {showMatchForm && (
              <form onSubmit={handleSubmitMatch} className="mb-6 space-y-4 p-4 bg-slate-700/50 rounded-lg">
                {matchError && (
                  <div className="text-red-400 text-sm bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    {matchError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Adversaire
                  </label>
                  {players.length === 0 ? (
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 text-sm">
                      Aucun adversaire disponible. Demandez à d'autres joueurs de s'inscrire !
                    </div>
                  ) : (
                    <select
                      value={matchForm.player2Id}
                      onChange={(e) => setMatchForm({ ...matchForm, player2Id: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Sélectionner un adversaire</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nickname}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Info sur les règles */}
                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3 text-xs text-slate-400">
                  <p className="font-medium text-slate-300 mb-1">Règles du badminton :</p>
                  <p>• Set gagné à 21 points</p>
                  <p>• Si les deux joueurs sont à au moins 19 points, il faut 2 points d'écart</p>
                  <p>• Sinon, au moins 2 points d'écart (21-3, 21-8, etc.)</p>
                  <p>• Maximum 30 points (30-29 ou 30-28)</p>
                  <p>• Exemples : 21-3, 21-8, 21-19, 22-20, 28-26, 30-29, 30-28</p>
                </div>

                {/* Set 1 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Set 1 - Scores
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Vous"
                        value={matchForm.sets[0]?.player1Score || ""}
                        onChange={(e) => updateSetScore(0, "player1Score", e.target.value)}
                        onKeyDown={(e) => {
                          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                          const isDigit = /^\d$/.test(e.key);
                          if (!isDigit && !allowedKeys.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          if (/^\d+$/.test(pastedText)) {
                            updateSetScore(0, "player1Score", pastedText);
                          }
                        }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Adversaire"
                        value={matchForm.sets[0]?.player2Score || ""}
                        onChange={(e) => updateSetScore(0, "player2Score", e.target.value)}
                        onKeyDown={(e) => {
                          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                          const isDigit = /^\d$/.test(e.key);
                          if (!isDigit && !allowedKeys.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          if (/^\d+$/.test(pastedText)) {
                            updateSetScore(0, "player2Score", pastedText);
                          }
                        }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  {matchForm.sets[0]?.player1Score && matchForm.sets[0]?.player2Score && (() => {
                    const error = validateSetScore(parseInt(matchForm.sets[0].player1Score), parseInt(matchForm.sets[0].player2Score));
                    return error ? (
                      <p className="text-xs text-red-400 mt-1">{error}</p>
                    ) : null;
                  })()}
                </div>

                {/* Set 2 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Set 2 - Scores
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Vous"
                        value={matchForm.sets[1]?.player1Score || ""}
                        onChange={(e) => updateSetScore(1, "player1Score", e.target.value)}
                        onKeyDown={(e) => {
                          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                          const isDigit = /^\d$/.test(e.key);
                          if (!isDigit && !allowedKeys.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          if (/^\d+$/.test(pastedText)) {
                            updateSetScore(1, "player1Score", pastedText);
                          }
                        }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Adversaire"
                        value={matchForm.sets[1]?.player2Score || ""}
                        onChange={(e) => updateSetScore(1, "player2Score", e.target.value)}
                        onKeyDown={(e) => {
                          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                          const isDigit = /^\d$/.test(e.key);
                          if (!isDigit && !allowedKeys.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          if (/^\d+$/.test(pastedText)) {
                            updateSetScore(1, "player2Score", pastedText);
                          }
                        }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  {matchForm.sets[1]?.player1Score && matchForm.sets[1]?.player2Score && (() => {
                    const error = validateSetScore(parseInt(matchForm.sets[1].player1Score), parseInt(matchForm.sets[1].player2Score));
                    return error ? (
                      <p className="text-xs text-red-400 mt-1">{error}</p>
                    ) : null;
                  })()}
                </div>

                {/* Set 3 (optionnel, si égalité 1-1) */}
                {showThirdSet && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Set 3 - Scores (match décisif)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Vous"
                          value={matchForm.sets[2]?.player1Score || ""}
                          onChange={(e) => updateSetScore(2, "player1Score", e.target.value)}
                          onKeyDown={(e) => {
                            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                            const isDigit = /^\d$/.test(e.key);
                            if (!isDigit && !allowedKeys.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
                              e.preventDefault();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            if (/^\d+$/.test(pastedText)) {
                              updateSetScore(2, "player1Score", pastedText);
                            }
                          }}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required={showThirdSet}
                        />
                      </div>
                      <span className="text-slate-400">-</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Adversaire"
                          value={matchForm.sets[2]?.player2Score || ""}
                          onChange={(e) => updateSetScore(2, "player2Score", e.target.value)}
                          onKeyDown={(e) => {
                            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                            const isDigit = /^\d$/.test(e.key);
                            if (!isDigit && !allowedKeys.includes(e.key) && !(e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
                              e.preventDefault();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            if (/^\d+$/.test(pastedText)) {
                              updateSetScore(2, "player2Score", pastedText);
                            }
                          }}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required={showThirdSet}
                        />
                      </div>
                    </div>
                    {matchForm.sets[2]?.player1Score && matchForm.sets[2]?.player2Score && (() => {
                      const error = validateSetScore(parseInt(matchForm.sets[2].player1Score), parseInt(matchForm.sets[2].player2Score));
                      return error ? (
                        <p className="text-xs text-red-400 mt-1">{error}</p>
                      ) : null;
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date du match
                  </label>
                  <input
                    type="date"
                    value={matchForm.matchDate}
                    onChange={(e) => setMatchForm({ ...matchForm, matchDate: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-500 text-slate-900 font-semibold py-2.5 rounded-lg hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting 
                    ? (editingMatchId ? "Modification..." : "Enregistrement...") 
                    : (editingMatchId ? "Modifier le match" : "Enregistrer le match")}
                </button>
              </form>
            )}

            {/* Liste des matchs */}
            {matches.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>Aucun match enregistré</p>
                <p className="text-sm mt-2">
                  {showMatchForm
                    ? "Remplissez le formulaire ci-dessus pour enregistrer votre premier match"
                    : "Cliquez sur 'Nouveau match' pour commencer"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const isPlayer1 = match.player1Id === player?.id;
                  const opponent = isPlayer1 ? match.player2 : match.player1;
                  const mySets = isPlayer1 ? match.player1Sets : match.player2Sets;
                  const opponentSets = isPlayer1 ? match.player2Sets : match.player1Sets;
                  const won = mySets === 2;

                  const matchDate = new Date(match.matchDate);
                  const dateStr = matchDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={match.id}
                      className={`p-4 rounded-lg border ${
                        won
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-slate-100">
                              {player?.nickname} vs {opponent.nickname}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                won
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {won ? "Victoire" : "Défaite"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-300 mb-2">
                            <span>
                              Sets : <span className="font-semibold">{mySets}</span> -{" "}
                              <span className="font-semibold">{opponentSets}</span>
                            </span>
                            <span className="text-slate-500">•</span>
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            {match.set1Player1Score !== null && match.set1Player2Score !== null && (
                              <span>
                                {isPlayer1 ? match.set1Player1Score : match.set1Player2Score}-
                                {isPlayer1 ? match.set1Player2Score : match.set1Player1Score}
                              </span>
                            )}
                            {match.set2Player1Score !== null && match.set2Player2Score !== null && (
                              <>
                                <span className="text-slate-500">•</span>
                                <span>
                                  {isPlayer1 ? match.set2Player1Score : match.set2Player2Score}-
                                  {isPlayer1 ? match.set2Player2Score : match.set2Player1Score}
                                </span>
                              </>
                            )}
                            {match.set3Player1Score !== null && match.set3Player2Score !== null && (
                              <>
                                <span className="text-slate-500">•</span>
                                <span>
                                  {isPlayer1 ? match.set3Player1Score : match.set3Player2Score}-
                                  {isPlayer1 ? match.set3Player2Score : match.set3Player1Score}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Bouton Modifier - seulement si le joueur est player1 (celui qui a créé le match) */}
                        {isPlayer1 && (
                          <button
                            onClick={() => handleEditMatch(match)}
                            className="ml-4 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
                            title="Modifier le match"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-6 py-4 text-xs text-slate-500 text-center">
        <Link href="/" className="text-slate-400 hover:text-slate-300">
          ← Retour à l'accueil
        </Link>
      </footer>
    </main>
  );
}
