interface GameScore {
  id: string;
  player_name: string;
  puntuación: number;
  fecha_partida: string;
}

interface LeaderboardTableProps {
  scores: GameScore[];
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeaderboardTable({
  scores,
  isLoading,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        Cargando leaderboard...
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        No hay puntuaciones disponibles para este juego
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-800 border-b border-gray-700">
            <th className="px-4 py-3 text-center font-bold text-white w-12">
              Posición
            </th>
            <th className="px-4 py-3 text-left font-bold text-white">
              Jugador
            </th>
            <th className="px-4 py-3 text-right font-bold text-white w-32">
              Puntuación
            </th>
            <th className="px-4 py-3 text-left font-bold text-white">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr
              key={score.id}
              className="border-b border-gray-700 hover:bg-gray-800 transition-colors"
            >
              <td className="px-4 py-3 text-center font-bold text-yellow-400">
                #{index + 1}
              </td>
              <td className="px-4 py-3 text-white font-semibold">
                {score.player_name}
              </td>
              <td className="px-4 py-3 text-right text-lg font-bold text-green-400">
                {score.puntuación.toLocaleString("es-ES")}
              </td>
              <td className="px-4 py-3 text-gray-400 text-sm">
                {formatDate(score.fecha_partida)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
