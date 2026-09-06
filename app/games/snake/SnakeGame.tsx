"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

export interface GameCallbacks {
  onGameOver?: (finalScore: number) => void;
  onScoreUpdate?: (score: number) => void;
  onPause?: (isPaused: boolean) => void;
}

export interface SnakeGameHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  getScore: () => number;
}

interface SnakeGameProps {
  callbacks?: GameCallbacks;
}

const SnakeGame = forwardRef<SnakeGameHandle, SnakeGameProps>(
  ({ callbacks = {} }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      pause: () => gameRef.current?.pause(),
      resume: () => gameRef.current?.resume(),
      restart: () => gameRef.current?.restart(),
      getScore: () => gameRef.current?.getScore() ?? 0,
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      canvas.width = 640;
      canvas.height = 480;

      let scriptLoaded = false;

      const loadGame = () => {
        if (!(window as any).SnakeGame) {
          // Load sprite atlas first
          const spriteScript = document.createElement("script");
          spriteScript.src = "/games/snake/sprites.js";
          spriteScript.async = true;
          spriteScript.onload = () => {
            // Then load game script
            const gameScript = document.createElement("script");
            gameScript.src = "/games/snake/game.js";
            gameScript.async = true;
            gameScript.onload = () => {
              scriptLoaded = true;
              const SnakeGameClass = (window as any).SnakeGame;
              gameRef.current = new SnakeGameClass(canvas, callbacks);
              gameRef.current.start();
            };
            gameScript.onerror = () => {
              console.error("Failed to load game.js");
            };
            document.body.appendChild(gameScript);
          };
          spriteScript.onerror = () => {
            console.error("Failed to load sprites.js");
          };
          document.body.appendChild(spriteScript);
        } else {
          const SnakeGameClass = (window as any).SnakeGame;
          gameRef.current = new SnakeGameClass(canvas, callbacks);
          gameRef.current.start();
        }
      };

      loadGame();

      return () => {
        if (gameRef.current) {
          gameRef.current.destroy();
          gameRef.current = null;
        }
      };
    }, [callbacks]);

    return (
      <canvas
        ref={canvasRef}
        className="block w-full max-w-2xl mx-auto border border-gray-300 rounded-lg"
      />
    );
  },
);

SnakeGame.displayName = "SnakeGame";

export default SnakeGame;
