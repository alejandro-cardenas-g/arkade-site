"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

export interface GameCallbacks {
  onGameOver?: (finalScore: number) => void;
  onScoreUpdate?: (score: number) => void;
  onPause?: (isPaused: boolean) => void;
}

export interface TetrisGameHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  getScore: () => number;
}

interface TetrisGameProps {
  callbacks?: GameCallbacks;
}

const TetrisGame = forwardRef<TetrisGameHandle, TetrisGameProps>(
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
      canvas.width = 400;
      canvas.height = 600;

      let scriptLoaded = false;

      const loadGame = () => {
        if (!(window as any).TetrisGame) {
          const script = document.createElement("script");
          script.src = "/games/tetris/game.js";
          script.async = true;
          script.onload = () => {
            scriptLoaded = true;
            const TetrisGameClass = (window as any).TetrisGame;
            gameRef.current = new TetrisGameClass(canvas, callbacks);
            gameRef.current.start();
          };
          script.onerror = () => {
            console.error("Failed to load game.js");
          };
          document.body.appendChild(script);
        } else {
          const TetrisGameClass = (window as any).TetrisGame;
          gameRef.current = new TetrisGameClass(canvas, callbacks);
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
        className="block w-full max-w-md mx-auto border border-gray-300 rounded-lg"
      />
    );
  },
);

TetrisGame.displayName = "TetrisGame";

export default TetrisGame;
