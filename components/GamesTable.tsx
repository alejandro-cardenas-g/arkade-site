interface Game {
  id: string;
  nombre: string;
  descripción: string;
  categoría: string;
  activo: boolean;
}

interface GamesTableProps {
  games: Game[];
  isLoading?: boolean;
}

export default function GamesTable({ games, isLoading }: GamesTableProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        Cargando juegos...
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        No hay juegos disponibles
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-800 border-b border-gray-700">
            <th className="px-4 py-3 text-left font-bold text-white">Juego</th>
            <th className="px-4 py-3 text-left font-bold text-white">
              Descripción
            </th>
            <th className="px-4 py-3 text-left font-bold text-white">
              Categoría
            </th>
            <th className="px-4 py-3 text-center font-bold text-white">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr
              key={game.id}
              className="border-b border-gray-700 hover:bg-gray-800 transition-colors"
            >
              <td className="px-4 py-3 text-white font-semibold">
                {game.nombre}
              </td>
              <td className="px-4 py-3 text-gray-300">
                {game.descripción || "-"}
              </td>
              <td className="px-4 py-3 text-gray-400">
                {game.categoría || "-"}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-block px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                  Activo
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
