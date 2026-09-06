"use strict";

class TetrisGame {
  constructor(canvasElement, callbacks = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");

    this.onGameOver = callbacks.onGameOver || (() => {});
    this.onScoreUpdate = callbacks.onScoreUpdate || (() => {});
    this.onPause = callbacks.onPause || (() => {});

    // Constants
    this.COLS = 10;
    this.ROWS = 20;
    this.BLOCK = 30;
    this.PREVIEW_SIZE = 30;

    this.COLORS = [
      null,
      "#4dd0e1", // I - cyan
      "#ffd54f", // O - yellow
      "#ba68c8", // T - purple
      "#81c784", // S - green
      "#e57373", // Z - red
      "#90caf9", // J - pale blue
      "#ffb74d", // L - orange
      "#9e9e9e", // N - tuerca (gris metálico)
    ];

    this.PIECES = [
      null,
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ], // I
      [
        [2, 2],
        [2, 2],
      ], // O
      [
        [0, 3, 0],
        [3, 3, 3],
        [0, 0, 0],
      ], // T
      [
        [0, 4, 4],
        [4, 4, 0],
        [0, 0, 0],
      ], // S
      [
        [5, 5, 0],
        [0, 5, 5],
        [0, 0, 0],
      ], // Z
      [
        [6, 0, 0],
        [6, 6, 6],
        [0, 0, 0],
      ], // J
      [
        [0, 0, 7],
        [7, 7, 7],
        [0, 0, 0],
      ], // L
      [
        [8, 8, 8],
        [8, 0, 8],
        [8, 8, 8],
      ], // N (tuerca)
    ];

    this.LINE_SCORES = [0, 100, 300, 500, 800];

    // Game state
    this.board = null;
    this.current = null;
    this.next = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.paused = false;
    this.gameOver = false;
    this.lastTime = 0;
    this.dropAccum = 0;
    this.dropInterval = 1000;
    this.animId = null;

    // Bound event handlers for cleanup
    this.keydownHandler = this.handleKeyDown.bind(this);
  }

  createBoard() {
    return Array.from({ length: this.ROWS }, () =>
      new Array(this.COLS).fill(0),
    );
  }

  randomPiece() {
    const type = Math.floor(Math.random() * 8) + 1;
    const shape = this.PIECES[type].map((row) => [...row]);
    return {
      type,
      shape,
      x: Math.floor(this.COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }

  collide(shape, ox, oy) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= this.COLS || ny >= this.ROWS) return true;
        if (ny >= 0 && this.board[ny][nx]) return true;
      }
    }
    return false;
  }

  rotateCW(shape) {
    const rows = shape.length,
      cols = shape[0].length;
    const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result[c][rows - 1 - r] = shape[r][c];
      }
    }
    return result;
  }

  tryRotate() {
    const rotated = this.rotateCW(this.current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.collide(rotated, this.current.x + kick, this.current.y)) {
        this.current.shape = rotated;
        this.current.x += kick;
        return;
      }
    }
  }

  merge() {
    for (let r = 0; r < this.current.shape.length; r++) {
      for (let c = 0; c < this.current.shape[r].length; c++) {
        if (this.current.shape[r][c]) {
          this.board[this.current.y + r][this.current.x + c] =
            this.current.shape[r][c];
        }
      }
    }
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((v) => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array(this.COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      this.lines += cleared;
      this.score += (this.LINE_SCORES[cleared] || 0) * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 90);
      this.onScoreUpdate(this.score);
    }
  }

  ghostY() {
    let gy = this.current.y;
    while (!this.collide(this.current.shape, this.current.x, gy + 1)) gy++;
    return gy;
  }

  hardDrop() {
    const gy = this.ghostY();
    this.score += (gy - this.current.y) * 2;
    this.current.y = gy;
    this.lockPiece();
    this.onScoreUpdate(this.score);
  }

  softDrop() {
    if (!this.collide(this.current.shape, this.current.x, this.current.y + 1)) {
      this.current.y++;
      this.score += 1;
      this.onScoreUpdate(this.score);
    } else {
      this.lockPiece();
    }
  }

  lockPiece() {
    this.merge();
    this.clearLines();
    this.spawn();
  }

  spawn() {
    this.current = this.next;
    this.next = this.randomPiece();
    if (this.collide(this.current.shape, this.current.x, this.current.y)) {
      this.endGame();
    }
  }

  endGame() {
    this.gameOver = true;
    this.onGameOver(this.score);
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    this.onPause(this.paused);
    if (!this.paused) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    } else {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
      }
    }
  }

  drawBlock(context, x, y, colorIndex, size, alpha) {
    if (!colorIndex) return;
    const color = this.COLORS[colorIndex];
    context.globalAlpha = alpha ?? 1;
    context.fillStyle = color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    // highlight
    context.fillStyle = "rgba(255,255,255,0.12)";
    context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    context.globalAlpha = 1;
  }

  drawGrid() {
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 0.5;
    for (let c = 1; c < this.COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.BLOCK, 0);
      this.ctx.lineTo(c * this.BLOCK, this.ROWS * this.BLOCK);
      this.ctx.stroke();
    }
    for (let r = 1; r < this.ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.BLOCK);
      this.ctx.lineTo(this.COLS * this.BLOCK, r * this.BLOCK);
      this.ctx.stroke();
    }
  }

  drawPreviewHUD() {
    const previewX = this.COLS * this.BLOCK + 10;
    const previewY = 10;
    const previewGridSize = 4;
    const blockSize = this.PREVIEW_SIZE;

    // Preview title
    this.ctx.fillStyle = "#999";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText("NEXT", previewX, previewY - 5);

    // Preview box
    this.ctx.strokeStyle = "#555";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      previewX,
      previewY,
      previewGridSize * blockSize + 2,
      previewGridSize * blockSize + 2,
    );

    // Draw next piece
    const shape = this.next.shape;
    const offX = Math.floor((previewGridSize - shape[0].length) / 2);
    const offY = Math.floor((previewGridSize - shape.length) / 2);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this.drawBlock(
            this.ctx,
            (previewX + offX + c * blockSize) / blockSize,
            (previewY + offY + r * blockSize) / blockSize,
            shape[r][c],
            blockSize,
          );
        }
      }
    }
  }

  drawHUD() {
    const hudX = this.COLS * this.BLOCK + 10;
    let hudY = 150;

    this.ctx.fillStyle = "#999";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "left";

    // Score
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, hudX, hudY);
    hudY += 20;

    // Lines
    this.ctx.fillText(`LINES: ${this.lines}`, hudX, hudY);
    hudY += 20;

    // Level
    this.ctx.fillText(`LEVEL: ${this.level}`, hudX, hudY);
  }

  draw = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();

    // board
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        this.drawBlock(this.ctx, c, r, this.board[r][c], this.BLOCK);
      }
    }

    // ghost
    if (this.current) {
      const gy = this.ghostY();
      for (let r = 0; r < this.current.shape.length; r++) {
        for (let c = 0; c < this.current.shape[r].length; c++) {
          if (this.current.shape[r][c]) {
            this.drawBlock(
              this.ctx,
              this.current.x + c,
              gy + r,
              this.current.shape[r][c],
              this.BLOCK,
              0.2,
            );
          }
        }
      }

      // current piece
      for (let r = 0; r < this.current.shape.length; r++) {
        for (let c = 0; c < this.current.shape[r].length; c++) {
          if (this.current.shape[r][c]) {
            this.drawBlock(
              this.ctx,
              this.current.x + c,
              this.current.y + r,
              this.current.shape[r][c],
              this.BLOCK,
            );
          }
        }
      }
    }

    // Draw HUD and preview
    this.drawPreviewHUD();
    this.drawHUD();
  };

  loop = (ts) => {
    const dt = ts - this.lastTime;
    this.lastTime = ts;
    this.dropAccum += dt;
    if (this.dropAccum >= this.dropInterval) {
      this.dropAccum = 0;
      if (
        !this.collide(this.current.shape, this.current.x, this.current.y + 1)
      ) {
        this.current.y++;
      } else {
        this.lockPiece();
      }
    }
    if (this.gameOver) return;
    this.draw();
    this.animId = requestAnimationFrame(this.loop);
  };

  handleKeyDown = (e) => {
    if (e.code === "KeyP") {
      this.togglePause();
      return;
    }
    if (this.paused || this.gameOver) return;
    switch (e.code) {
      case "ArrowLeft":
        if (
          !this.collide(this.current.shape, this.current.x - 1, this.current.y)
        )
          this.current.x--;
        break;
      case "ArrowRight":
        if (
          !this.collide(this.current.shape, this.current.x + 1, this.current.y)
        )
          this.current.x++;
        break;
      case "ArrowDown":
        this.softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        this.tryRotate();
        break;
      case "Space":
        e.preventDefault();
        this.hardDrop();
        break;
    }
  };

  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  start() {
    this.board = this.createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.paused = false;
    this.gameOver = false;
    this.dropInterval = 1000;
    this.dropAccum = 0;
    this.lastTime = performance.now();
    this.next = this.randomPiece();
    this.spawn();
    this.setupEventListeners();
    this.animId = requestAnimationFrame(this.loop);
  }

  pause() {
    if (!this.paused && !this.gameOver) {
      this.togglePause();
    }
  }

  resume() {
    if (this.paused && !this.gameOver) {
      this.togglePause();
    }
  }

  restart() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    this.start();
  }

  getScore() {
    return this.score;
  }

  isGameOver() {
    return this.gameOver;
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    this.removeEventListeners();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TetrisGame;
}
if (typeof window !== "undefined") {
  window.TetrisGame = TetrisGame;
}
