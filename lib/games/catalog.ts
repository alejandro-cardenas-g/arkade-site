import { ReactNode } from "react";

export interface GameCatalog {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  route: string;
}

// Catalog of available games
export const GAME_CATALOG: GameCatalog[] = [
  {
    id: "asteroids",
    name: "Asteroids",
    description: "Juego clásico de asteroides",
    route: "/games/asteroids",
  },
  {
    id: "tetris",
    name: "Tetris",
    description: "Juego clásico de bloques que caen",
    route: "/games/tetris",
  },
];

// Helper functions
export function getGameById(id: string): GameCatalog | undefined {
  return GAME_CATALOG.find((game) => game.id === id);
}

export function getAllGames(): GameCatalog[] {
  return GAME_CATALOG;
}
