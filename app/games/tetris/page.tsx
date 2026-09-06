"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { getPlayerName, getAnonymousUserId } from "@/lib/playerName";
import TetrisGame, { TetrisGameHandle, GameCallbacks } from "./TetrisGame";
import PlayerNameModal from "@/components/PlayerNameModal";
import GamesTable from "@/components/GamesTable";
import LeaderboardTable from "@/components/LeaderboardTable";

interface Game {
  id: string;
  nombre: string;
  descripción: string;
  categoría: string;
  activo: boolean;
}

interface GameScore {
  id: string;
  player_name: string;
  puntuación: number;
  fecha_partida: string;
}

const supabase = createBrowserClient();

export default function TetrisPage() {
  const gameRef = useRef<TetrisGameHandle>(null);
  const scoreSavedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tetrisGame, setTetrisGame] = useState<Game | null>(null);
  const [leaderboard, setLeaderboard] = useState<GameScore[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);

  // Fetch game data and leaderboard
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingLeaderboard(true);
        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select("*")
          .eq("nombre", "Tetris")
          .single();

        if (gameError) {
          console.error("Error fetching game data:", gameError);
          throw gameError;
        }
        console.log("Tetris game loaded:", gameData?.id);
        setTetrisGame(gameData);

        // Fetch leaderboard
        const { data: scoresData, error: scoresError } = await supabase
          .from("game_scores")
          .select("id, player_name, puntuación, fecha_partida")
          .eq("juego_id", gameData.id)
          .order("puntuación", { ascending: false })
          .limit(10);

        if (scoresError) {
          console.error("Error fetching leaderboard:", scoresError);
          throw scoresError;
        }
        console.log(
          "Leaderboard loaded with",
          scoresData?.length || 0,
          "scores",
        );
        setLeaderboard(scoresData || []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    fetchInitialData();
  }, []);

  const callbacks: GameCallbacks = useMemo(
    () => ({
      onGameOver: (finalScore) => {
        setIsGameOver(true);
        setScore(finalScore);
        const existingName = getPlayerName();
        if (!existingName) {
          setShowNameModal(true);
        } else {
          setShowNameModal(false);
        }
      },
      onScoreUpdate: (newScore) => {
        setScore(newScore);
      },
      onPause: (paused) => {
        setIsPaused(paused);
      },
    }),
    [],
  );

  const saveScore = useCallback(
    async (playerName: string) => {
      console.log("saveScore called with:", {
        playerName,
        tetrisGameId: tetrisGame?.id,
        score,
      });

      if (!tetrisGame) {
        console.error("Cannot save score: missing tetrisGame");
        return;
      }

      try {
        setIsSavingScore(true);
        console.log("Inserting score to Supabase...");
        const anonymousId = getAnonymousUserId();
        const { error } = await supabase.from("game_scores").insert({
          anonymous_id: anonymousId,
          juego_id: tetrisGame.id,
          player_name: playerName,
          puntuación: score,
        });

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }

        console.log("Score inserted successfully!");

        // Refresh leaderboard
        const { data: scoresData, error: scoresError } = await supabase
          .from("game_scores")
          .select("id, player_name, puntuación, fecha_partida")
          .eq("juego_id", tetrisGame.id)
          .order("puntuación", { ascending: false })
          .limit(10);

        if (scoresError) {
          console.error("Error fetching leaderboard:", scoresError);
          throw scoresError;
        }

        setLeaderboard(scoresData || []);
        setShowNameModal(false);
        console.log("Leaderboard refreshed");
      } catch (error) {
        console.error("Error saving score:", error);
      } finally {
        setIsSavingScore(false);
      }
    },
    [tetrisGame, score],
  );

  // Auto-save score when game ends and player has a name
  useEffect(() => {
    if (
      isGameOver &&
      score > 0 &&
      tetrisGame &&
      !showNameModal &&
      !scoreSavedRef.current
    ) {
      const playerName = getPlayerName();
      if (playerName) {
        scoreSavedRef.current = true;
        saveScore(playerName);
      }
    }
  }, [isGameOver, score, tetrisGame, showNameModal, saveScore]);

  const handlePauseToggle = () => {
    if (isPaused) {
      gameRef.current?.resume();
    } else {
      gameRef.current?.pause();
    }
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setScore(0);
    scoreSavedRef.current = false;
    gameRef.current?.restart();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <PlayerNameModal
        isOpen={showNameModal}
        onConfirm={(playerName) => {
          saveScore(playerName);
        }}
        onCancel={() => setShowNameModal(false)}
      />

      {/* Header */}
      <div className="border-b border-gray-700 py-4 px-6">
        <h1 className="text-2xl font-bold">Tetris</h1>
        <p className="text-gray-400">Juego clásico de bloques que caen</p>
      </div>

      {/* Main content */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Game section */}
          <div className="mb-12">
            <div className="flex flex-col items-center justify-center">
              {/* Game canvas */}
              <div className="mb-6">
                <TetrisGame ref={gameRef} callbacks={callbacks} />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                <button
                  onClick={handlePauseToggle}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
                >
                  {isPaused ? "Reanudar" : "Pausar"}
                </button>
                <button
                  onClick={handleRestart}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded transition"
                >
                  Reiniciar
                </button>
                <Link
                  href="/biblioteca"
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded transition"
                >
                  Volver a Biblioteca
                </Link>
              </div>

              {/* Game Over overlay */}
              {isGameOver && (
                <div className="mt-6 p-6 bg-red-900 border-2 border-red-600 rounded text-center max-w-md">
                  <h2 className="text-3xl font-bold mb-2">GAME OVER</h2>
                  <p className="text-xl mb-4">Puntaje Final: {score}</p>
                  <button
                    onClick={handleRestart}
                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded transition"
                  >
                    Jugar de Nuevo
                  </button>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-8 bg-gray-800 p-6 rounded max-w-md">
                <h3 className="text-lg font-bold mb-3">Controles</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>
                    <span className="font-semibold">← →</span> — Mover pieza
                  </li>
                  <li>
                    <span className="font-semibold">↓</span> — Caída suave
                  </li>
                  <li>
                    <span className="font-semibold">↑ o X</span> — Rotar
                  </li>
                  <li>
                    <span className="font-semibold">Espacio</span> — Hard drop
                  </li>
                  <li>
                    <span className="font-semibold">P</span> — Pausa
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Game Info section */}
          {tetrisGame && (
            <>
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  Información del Juego
                </h2>
                <GamesTable games={[tetrisGame]} isLoading={false} />
              </div>

              {/* Leaderboard section */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  Top 10 - Leaderboard
                </h2>
                <LeaderboardTable
                  scores={leaderboard}
                  isLoading={isLoadingLeaderboard}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
