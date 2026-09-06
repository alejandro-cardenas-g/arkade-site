"use client";

import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import AsteroidsGame, {
  AsteroidsGameHandle,
  GameCallbacks,
} from "./AsteroidsGame";

export default function AsteroidsPage() {
  const gameRef = useRef<AsteroidsGameHandle>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const callbacks: GameCallbacks = useMemo(
    () => ({
      onGameOver: (finalScore) => {
        setIsGameOver(true);
        setScore(finalScore);
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
    gameRef.current?.restart();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700 py-4 px-6">
        <h1 className="text-2xl font-bold">Asteroids</h1>
        <p className="text-gray-400">Juego clásico de asteroides</p>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center py-8 px-4 min-h-screen">
        {/* Game canvas */}
        <div className="mb-6">
          <AsteroidsGame ref={gameRef} callbacks={callbacks} />
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
        <div className="mt-8 bg-gray-900 p-6 rounded max-w-md">
          <h3 className="text-lg font-bold mb-3">Controles</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <span className="font-semibold">← →</span> — Rotar nave
            </li>
            <li>
              <span className="font-semibold">↑</span> — Acelerar
            </li>
            <li>
              <span className="font-semibold">Espacio</span> — Disparar
            </li>
            <li>
              <span className="font-semibold">P o Botón Pausar</span> — Pausa
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
