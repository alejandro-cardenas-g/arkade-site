"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

export interface GameCallbacks {
  onGameOver?: (finalScore: number) => void;
  onScoreUpdate?: (score: number) => void;
  onPause?: (isPaused: boolean) => void;
}

export interface AsteroidsGameHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  getScore: () => number;
}

interface AsteroidsGameProps {
  callbacks?: GameCallbacks;
}

const AsteroidsGame = forwardRef<AsteroidsGameHandle, AsteroidsGameProps>(
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

      let scriptLoaded = false;

      const loadGame = () => {
        if (!(window as any).AsteroidsGame) {
          const script = document.createElement("script");
          script.src = "/games/asteroids/game.js";
          script.async = true;
          script.onload = () => {
            scriptLoaded = true;
            const AsteroidsGameClass = (window as any).AsteroidsGame;
            gameRef.current = new AsteroidsGameClass(canvas, callbacks);
            gameRef.current.start();
          };
          script.onerror = () => {
            console.error("Failed to load game.js");
          };
          document.body.appendChild(script);
        } else {
          const AsteroidsGameClass = (window as any).AsteroidsGame;
          gameRef.current = new AsteroidsGameClass(canvas, callbacks);
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

AsteroidsGame.displayName = "AsteroidsGame";

export default AsteroidsGame;
