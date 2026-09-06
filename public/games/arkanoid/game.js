class ArkanoidGame {
  constructor(canvasElement, callbacks = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.onGameOver = callbacks.onGameOver || (() => {});
    this.onScoreUpdate = callbacks.onScoreUpdate || (() => {});
    this.onPause = callbacks.onPause || (() => {});

    // Game state
    this.paddle = { x: 0, y: 560, w: 81, h: 14 };
    this.ball = { x: 0, y: 0, w: 16, h: 16, vx: 200, vy: -300 };
    this.blocks = [];
    this.explosions = [];
    this.lives = 3;
    this.score = 0;
    this.gameState = "playing"; // 'playing', 'gameover', 'win'
    this.currentLevel = 1;
    this.isPaused = false;
    this.keys = { ArrowLeft: false, ArrowRight: false };
    this.lastTime = null;
    this.animationId = null;

    // Constants
    this.PADDLE_SPEED = 400;
    this.BLOCK_COLS = 10;
    this.BLOCK_ROWS = 6;
    this.BLOCK_W = 64;
    this.BLOCK_H = 24;
    this.BLOCK_COLORS = [
      "red",
      "yellow",
      "cyan",
      "magenta",
      "hotpink",
      "green",
    ];
    this.BLOCKS_ORIGIN_X = (800 - this.BLOCK_COLS * this.BLOCK_W) / 2;
    this.BLOCKS_ORIGIN_Y = 80;
    this.BASE_BALL_VX = 200;
    this.BASE_BALL_VY = -300;

    // Pause overlay constants
    this.PAUSE_BTN_W = 60;
    this.PAUSE_BTN_H = 40;
    this.PAUSE_BTN_GAP = 12;
    this.PAUSE_BTN_Y = 340;
    this.PAUSE_BTN_ROW_X =
      (this.canvas.width - (5 * this.PAUSE_BTN_W + 4 * this.PAUSE_BTN_GAP)) / 2;

    // Levels data (merged from levels.js)
    this.LEVELS = this._initLevels();

    // Sound placeholders (not implemented in this version)
    this.bounceSound = null;
    this.breakSound = null;

    // Bound handlers for cleanup
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
  }

  _initLevels() {
    const rowColors1 = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];
    const rowColors2 = [
      "gray",
      "cyan",
      "hotpink",
      "yellow",
      "magenta",
      "green",
    ];
    const rowColors4 = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];

    const l1 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        l1.push({ col, row, color: rowColors1[row] });

    const l2 = [];
    const pyStart = [4, 3, 2, 1, 0, 0];
    const pyEnd = [5, 6, 7, 8, 9, 9];
    for (let row = 0; row < 6; row++)
      for (let col = pyStart[row]; col <= pyEnd[row]; col++)
        l2.push({ col, row, color: rowColors2[row] });

    const l3 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if ((col + row) % 2 === 0)
          l3.push({ col, row, color: row < 3 ? "yellow" : "magenta" });

    const gaps4 = [
      [2, 5, 8],
      [0, 4, 7, 9],
      [1, 3, 6],
      [2, 5, 8, 9],
      [0, 4, 7],
      [1, 3, 6, 9],
    ];
    const l4 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if (!gaps4[row].includes(col))
          l4.push({ col, row, color: rowColors4[row] });

    const l5 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++) {
        const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
        const isCross = col === 4 || row === 2;
        if (isFrame || isCross)
          l5.push({
            col,
            row,
            color: isCross && !isFrame ? "hotpink" : "cyan",
          });
      }

    return [
      { speed: 1.0, blocks: l1 },
      { speed: 1.1, blocks: l2 },
      { speed: 1.21, blocks: l3 },
      { speed: 1.33, blocks: l4 },
      { speed: 1.46, blocks: l5 },
    ];
  }

  initPaddle() {
    this.paddle.x = (this.canvas.width - this.paddle.w) / 2;
  }

  initBall() {
    const speed = this.LEVELS[this.currentLevel - 1].speed;
    this.ball.x = this.paddle.x + (this.paddle.w - this.ball.w) / 2;
    this.ball.y = this.paddle.y - this.ball.h;
    this.ball.vx = this.BASE_BALL_VX * speed;
    this.ball.vy = this.BASE_BALL_VY * speed;
  }

  loadLevel(n) {
    this.currentLevel = n;
    const level = this.LEVELS[n - 1];
    this.blocks = level.blocks.map((b) => ({
      x: this.BLOCKS_ORIGIN_X + b.col * this.BLOCK_W,
      y: this.BLOCKS_ORIGIN_Y + b.row * this.BLOCK_H,
      w: this.BLOCK_W,
      h: this.BLOCK_H,
      color: b.color,
      alive: true,
    }));
    this.explosions = [];
    this.ball.x = this.paddle.x + (this.paddle.w - this.ball.w) / 2;
    this.ball.y = this.paddle.y - this.ball.h;
    this.ball.vx = this.BASE_BALL_VX * level.speed;
    this.ball.vy = this.BASE_BALL_VY * level.speed;
  }

  collideAABB(block) {
    return (
      this.ball.x < block.x + block.w &&
      this.ball.x + this.ball.w > block.x &&
      this.ball.y < block.y + block.h &&
      this.ball.y + this.ball.h > block.y
    );
  }

  handleCanvasClick(e) {
    if (!this.isPaused) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    for (let i = 0; i < 5; i++) {
      const bx =
        this.PAUSE_BTN_ROW_X + i * (this.PAUSE_BTN_W + this.PAUSE_BTN_GAP);
      if (
        mx >= bx &&
        mx <= bx + this.PAUSE_BTN_W &&
        my >= this.PAUSE_BTN_Y &&
        my <= this.PAUSE_BTN_Y + this.PAUSE_BTN_H
      ) {
        this.loadLevel(i + 1);
        this.isPaused = false;
        this.onPause(false);
        return;
      }
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    this.paddle.x = Math.max(
      0,
      Math.min(this.canvas.width - this.paddle.w, mouseX - this.paddle.w / 2),
    );
  }

  handleKeyDown(e) {
    if (e.key in this.keys) this.keys[e.key] = true;
    if (
      (e.key === "p" || e.key === "P" || e.key === "Escape") &&
      this.gameState === "playing"
    ) {
      this.isPaused = !this.isPaused;
      this.onPause(this.isPaused);
    }
  }

  handleKeyUp(e) {
    if (e.key in this.keys) this.keys[e.key] = false;
  }

  update(dt) {
    if (this.gameState !== "playing") return;

    // Paddle
    if (this.keys.ArrowLeft)
      this.paddle.x = Math.max(0, this.paddle.x - this.PADDLE_SPEED * dt);
    if (this.keys.ArrowRight)
      this.paddle.x = Math.min(
        this.canvas.width - this.paddle.w,
        this.paddle.x + this.PADDLE_SPEED * dt,
      );

    // Ball movement
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Wall bounces (left, right, top)
    if (this.ball.x <= 0) {
      this.ball.x = 0;
      this.ball.vx = Math.abs(this.ball.vx);
    }
    if (this.ball.x + this.ball.w >= this.canvas.width) {
      this.ball.x = this.canvas.width - this.ball.w;
      this.ball.vx = -Math.abs(this.ball.vx);
    }
    if (this.ball.y <= 0) {
      this.ball.y = 0;
      this.ball.vy = Math.abs(this.ball.vy);
    }

    // Paddle bounce
    if (
      this.ball.vy > 0 &&
      this.ball.x + this.ball.w > this.paddle.x &&
      this.ball.x < this.paddle.x + this.paddle.w &&
      this.ball.y + this.ball.h >= this.paddle.y &&
      this.ball.y + this.ball.h <= this.paddle.y + this.paddle.h + 8
    ) {
      this.ball.y = this.paddle.y - this.ball.h;
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    // Block collisions
    for (const block of this.blocks) {
      if (!block.alive) continue;
      if (this.collideAABB(block)) {
        block.alive = false;
        this.explosions.push({
          x: block.x,
          y: block.y,
          w: block.w,
          h: block.h,
          color: block.color,
          elapsed: 0,
        });
        this.score += 10;
        this.onScoreUpdate(this.score);
        this.ball.vy = -this.ball.vy;
        if (this.blocks.every((b) => !b.alive)) {
          if (this.currentLevel < 5) this.loadLevel(this.currentLevel + 1);
          else this.gameState = "win";
        }
        break;
      }
    }

    // Explosions (simplified: just remove after short time)
    for (const exp of this.explosions) exp.elapsed += dt * 1000;
    this.explosions = this.explosions.filter((exp) => exp.elapsed < 150);

    // Ball lost
    if (this.ball.y > this.canvas.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.lives = 0;
        this.gameState = "gameover";
        this.onGameOver(this.score);
      } else {
        this.initBall();
      }
    }
  }

  drawOverlay(message) {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 64px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
  }

  drawPauseOverlay() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 56px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("PAUSA", this.canvas.width / 2, 260);

    this.ctx.font = "bold 16px monospace";
    this.ctx.fillText("Saltar al nivel:", this.canvas.width / 2, 310);

    for (let i = 0; i < 5; i++) {
      const bx =
        this.PAUSE_BTN_ROW_X + i * (this.PAUSE_BTN_W + this.PAUSE_BTN_GAP);
      const isActive = i + 1 === this.currentLevel;
      this.ctx.fillStyle = isActive ? "#f0c040" : "#444";
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(
        bx,
        this.PAUSE_BTN_Y,
        this.PAUSE_BTN_W,
        this.PAUSE_BTN_H,
        6,
      );
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = isActive ? "#000" : "#fff";
      this.ctx.font = "bold 20px monospace";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        i + 1,
        bx + this.PAUSE_BTN_W / 2,
        this.PAUSE_BTN_Y + this.PAUSE_BTN_H / 2,
      );
    }
  }

  draw() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const block of this.blocks) {
      if (block.alive && window.drawSprite) {
        window.drawSprite(
          this.ctx,
          "block_" + block.color,
          block.x,
          block.y,
          block.w,
          block.h,
        );
      }
    }

    for (const exp of this.explosions) {
      if (window.drawFrame && window.EXPLOSION_FRAMES) {
        const frameIndex = Math.min(Math.floor((exp.elapsed / 150) * 4), 3);
        window.drawFrame(
          this.ctx,
          window.EXPLOSION_FRAMES[exp.color][frameIndex],
          exp.x,
          exp.y,
          exp.w,
          exp.h,
        );
      }
    }

    if (window.drawSprite) {
      window.drawSprite(
        this.ctx,
        "paddle",
        this.paddle.x,
        this.paddle.y,
        this.paddle.w,
        this.paddle.h,
      );
      window.drawSprite(
        this.ctx,
        "ball",
        this.ball.x,
        this.ball.y,
        this.ball.w,
        this.ball.h,
      );
    }

    if (this.gameState === "playing") {
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 18px monospace";
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";
      this.ctx.fillText("Score: " + this.score, 10, 10);
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "Nivel: " + this.currentLevel,
        this.canvas.width / 2,
        10,
      );
      const ballSize = 16;
      const ballSpacing = 4;
      for (let i = 0; i < this.lives; i++) {
        const bx =
          this.canvas.width - 10 - (this.lives - i) * (ballSize + ballSpacing);
        if (window.drawSprite) {
          window.drawSprite(this.ctx, "ball", bx, 10, ballSize, ballSize);
        }
      }
    }

    if (this.gameState === "gameover") this.drawOverlay("GAME OVER");
    if (this.gameState === "win") this.drawOverlay("¡Completaste el juego!");
    if (this.isPaused) this.drawPauseOverlay();
  }

  loop = (timestamp) => {
    if (this.lastTime === null) this.lastTime = timestamp;
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (!this.isPaused) this.update(dt);
    this.draw();

    this.animationId = requestAnimationFrame(this.loop);
  };

  start() {
    this.initPaddle();
    this.loadLevel(1);
    this.setupEventListeners();
    this.animationId = requestAnimationFrame(this.loop);
  }

  pause() {
    this.isPaused = true;
    this.onPause(true);
  }

  resume() {
    this.isPaused = false;
    this.onPause(false);
  }

  restart() {
    this.lives = 3;
    this.score = 0;
    this.gameState = "playing";
    this.onScoreUpdate(this.score);
    this.loadLevel(1);
  }

  getScore() {
    return this.score;
  }

  isGameOver() {
    return this.gameState === "gameover" || this.gameState === "win";
  }

  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("click", this.handleCanvasClick);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("click", this.handleCanvasClick);
  }

  destroy() {
    this.removeEventListeners();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = ArkanoidGame;
}
window.ArkanoidGame = ArkanoidGame;
