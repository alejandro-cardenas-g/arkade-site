"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
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

export default function LeaderboardPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [scores, setScores] = useState<GameScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // Fetch games on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .eq("activo", true)
          .order("nombre");

        if (error) throw error;
        setGames(data || []);
        if (data && data.length > 0) {
          setSelectedGameId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar juegos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, [supabase]);

  // Fetch leaderboard scores when selected game changes
  useEffect(() => {
    if (!selectedGameId) return;

    const fetchScores = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("game_scores")
          .select("id, player_name, puntuación, fecha_partida")
          .eq("juego_id", selectedGameId)
          .order("puntuación", { ascending: false })
          .limit(10);

        if (error) throw error;
        setScores(data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar leaderboard",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, [selectedGameId, supabase]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-600 p-4 rounded">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Salón de la Fama</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Tabla de Juegos</h2>
          <GamesTable games={games} isLoading={isLoading} />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Selecciona un juego:
            </label>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="w-full md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selecciona un juego --</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.nombre}
                </option>
              ))}
            </select>
          </div>

          {selectedGameId ? (
            <LeaderboardTable scores={scores} isLoading={isLoading} />
          ) : (
            <div className="text-center text-gray-400 py-8">
              Selecciona un juego para ver el leaderboard
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
