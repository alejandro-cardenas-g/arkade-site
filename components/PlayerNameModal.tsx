"use client";

import { useState, useEffect } from "react";

interface PlayerNameModalProps {
  isOpen: boolean;
  onConfirm: (playerName: string) => void;
  onCancel?: () => void;
}

export default function PlayerNameModal({
  isOpen,
  onConfirm,
  onCancel,
}: PlayerNameModalProps) {
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem("playerName");
      if (savedName) {
        setPlayerName(savedName);
      }
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (playerName.trim()) {
      setIsLoading(true);
      localStorage.setItem("playerName", playerName);
      onConfirm(playerName);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          ¡Juego Terminado!
        </h2>
        <p className="text-gray-700 mb-4">
          Por favor, ingresa tu nombre para guardar tu puntuación:
        </p>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Ingresa tu nombre"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={50}
          autoFocus
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleConfirm();
            }
          }}
        />
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!playerName.trim() || isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
