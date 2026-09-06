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

      const loadGame = () => {
        // Check if scripts are already loaded
        const spriteScriptId = "snake-sprite-script";
        const gameScriptId = "snake-game-script";

        const existingSpriteScript = document.getElementById(spriteScriptId);
        const existingGameScript = document.getElementById(gameScriptId);

        if (!existingSpriteScript) {
          const spriteScript = document.createElement("script");
          spriteScript.id = spriteScriptId;
          spriteScript.src = "/games/snake/sprites.js";
          spriteScript.async = false;

          spriteScript.onload = () => {
            if (!existingGameScript) {
              const gameScript = document.createElement("script");
              gameScript.id = gameScriptId;
              gameScript.src = "/games/snake/game.js";
              gameScript.async = false;

              gameScript.onload = () => {
                const SnakeGameClass = (window as any).SnakeGame;
                if (SnakeGameClass) {
                  gameRef.current = new SnakeGameClass(canvas, callbacks);
                  gameRef.current.start();
                } else {
                  console.error(
                    "SnakeGame class not found after loading script",
                  );
                }
              };

              gameScript.onerror = () => {
                console.error("Failed to load game.js");
              };

              document.body.appendChild(gameScript);
            }
          };

          spriteScript.onerror = () => {
            console.error("Failed to load sprites.js");
          };

          document.body.appendChild(spriteScript);
        } else if (existingGameScript) {
          // Both scripts already loaded, just initialize game
          const SnakeGameClass = (window as any).SnakeGame;
          if (SnakeGameClass) {
            gameRef.current = new SnakeGameClass(canvas, callbacks);
            gameRef.current.start();
          }
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
