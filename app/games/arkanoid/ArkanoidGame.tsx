"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

export interface GameCallbacks {
  onGameOver?: (finalScore: number) => void;
  onScoreUpdate?: (score: number) => void;
  onPause?: (isPaused: boolean) => void;
}

export interface ArkanoidGameHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  getScore: () => number;
}

interface ArkanoidGameProps {
  callbacks?: GameCallbacks;
}

const ArkanoidGame = forwardRef<ArkanoidGameHandle, ArkanoidGameProps>(
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
      canvas.width = 800;
      canvas.height = 600;

      let spriteScriptLoaded = false;
      let gameScriptLoaded = false;

      const loadGame = () => {
        // Load spritesheet.js first
        if (!(window as any).loadSpritesheet) {
          const spriteScript = document.createElement("script");
          spriteScript.src = "/games/arkanoid/assets/spritesheet.js";
          spriteScript.async = true;
          spriteScript.onload = () => {
            spriteScriptLoaded = true;
            // Now load game.js
            loadGameScript();
          };
          spriteScript.onerror = () => {
            console.error("Failed to load spritesheet.js");
          };
          document.body.appendChild(spriteScript);
        } else {
          loadGameScript();
        }
      };

      const loadGameScript = () => {
        if (!(window as any).ArkanoidGame) {
          const gameScript = document.createElement("script");
          gameScript.src = "/games/arkanoid/game.js";
          gameScript.async = true;
          gameScript.onload = () => {
            gameScriptLoaded = true;
            initializeGame();
          };
          gameScript.onerror = () => {
            console.error("Failed to load game.js");
          };
          document.body.appendChild(gameScript);
        } else {
          initializeGame();
        }
      };

      const initializeGame = () => {
        // Load spritesheet before starting game
        if ((window as any).loadSpritesheet) {
          (window as any).loadSpritesheet(() => {
            const ArkanoidGameClass = (window as any).ArkanoidGame;
            gameRef.current = new ArkanoidGameClass(canvas, callbacks);
            gameRef.current.start();
          });
        } else {
          const ArkanoidGameClass = (window as any).ArkanoidGame;
          gameRef.current = new ArkanoidGameClass(canvas, callbacks);
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
        className="block w-full max-w-4xl mx-auto border border-gray-300 rounded-lg bg-black"
      />
    );
  },
);

ArkanoidGame.displayName = "ArkanoidGame";

export default ArkanoidGame;
