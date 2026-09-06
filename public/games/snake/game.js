class SnakeGame {
  constructor(canvasElement, callbacks = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.onGameOver = callbacks.onGameOver || (() => {});
    this.onScoreUpdate = callbacks.onScoreUpdate || (() => {});
    this.onPause = callbacks.onPause || (() => {});

    // Game grid settings
    this.gridSize = 32;
    this.gridWidth = Math.floor(this.canvas.width / this.gridSize);
    this.gridHeight = Math.floor(this.canvas.height / this.gridSize);

    // Game state
    this.snake = [{ x: 10, y: 10 }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = null;
    this.foodType = "apple";
    this.score = 0;
    this.level = 1;
    this.fruitEaten = 0;
    this.gameState = "stopped"; // stopped, running, paused, gameOver
    this.isPaused = false;

    // Fruit data: 21 fruits with different point values
    this.fruitList = [
      { name: "apple", points: 10 },
      { name: "banana", points: 15 },
      { name: "berry", points: 12 },
      { name: "berries", points: 12 },
      { name: "broccoli", points: 18 },
      { name: "carrot", points: 14 },
      { name: "cherry", points: 11 },
      { name: "eggplant", points: 16 },
      { name: "garlic", points: 13 },
      { name: "grape", points: 10 },
      { name: "grapes2", points: 10 },
      { name: "kiwi", points: 17 },
      { name: "lemon", points: 13 },
      { name: "melon", points: 20 },
      { name: "mushroom", points: 15 },
      { name: "orange", points: 16 },
      { name: "peach", points: 14 },
      { name: "peanut", points: 12 },
      { name: "pepper", points: 18 },
      { name: "pineapple", points: 19 },
      { name: "strawberry", points: 11 },
      { name: "tomato", points: 13 },
      { name: "watermelon", points: 21 },
    ];

    // Speed levels (milliseconds between game updates)
    this.speedByLevel = {
      1: 100,
      2: 85,
      3: 70,
      4: 55,
      5: 40,
    };
    this.currentSpeed = this.speedByLevel[1];

    // Game loop
    this.gameLoopId = null;
    this.lastUpdateTime = 0;

    // Event listeners
    this.boundKeydown = this.handleKeydown.bind(this);
    this.boundArrowKey = this.handleArrowKey.bind(this);
  }

  start() {
    this.gameState = "running";
    this.snake = [
      { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) },
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.level = 1;
    this.fruitEaten = 0;
    this.currentSpeed = this.speedByLevel[1];
    this.isPaused = false;
    this.generateFood();
    this.setupEventListeners();
    this.lastUpdateTime = Date.now();
    this.gameLoop();
  }

  pause() {
    if (this.gameState === "running") {
      this.gameState = "paused";
      this.isPaused = true;
      this.onPause(true);
    }
  }

  resume() {
    if (this.gameState === "paused") {
      this.gameState = "running";
      this.isPaused = false;
      this.lastUpdateTime = Date.now();
      this.onPause(false);
    }
  }

  restart() {
    this.start();
  }

  getScore() {
    return this.score;
  }

  getLevel() {
    return this.level;
  }

  isGameOver() {
    return this.gameState === "gameOver";
  }

  destroy() {
    this.removeEventListeners();
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
    this.gameState = "stopped";
  }

  setupEventListeners() {
    window.addEventListener("keydown", this.boundKeydown);
  }

  removeEventListeners() {
    window.removeEventListener("keydown", this.boundKeydown);
  }

  handleKeydown(e) {
    const key = e.key.toLowerCase();

    if (key === "arrowup" || key === "w") {
      e.preventDefault();
      if (this.direction.y === 0) {
        this.nextDirection = { x: 0, y: -1 };
      }
    } else if (key === "arrowdown" || key === "s") {
      e.preventDefault();
      if (this.direction.y === 0) {
        this.nextDirection = { x: 0, y: 1 };
      }
    } else if (key === "arrowleft" || key === "a") {
      e.preventDefault();
      if (this.direction.x === 0) {
        this.nextDirection = { x: -1, y: 0 };
      }
    } else if (key === "arrowright" || key === "d") {
      e.preventDefault();
      if (this.direction.x === 0) {
        this.nextDirection = { x: 1, y: 0 };
      }
    } else if (key === "p" || key === " ") {
      e.preventDefault();
      if (this.gameState === "running") {
        this.pause();
      } else if (this.gameState === "paused") {
        this.resume();
      }
    } else if (key === "escape") {
      e.preventDefault();
      if (this.gameState === "paused") {
        this.resume();
      }
    }
  }

  handleArrowKey(e) {
    // Reserved for future use
  }

  generateFood() {
    let x, y, collision;

    do {
      collision = false;
      x = Math.floor(Math.random() * this.gridWidth);
      y = Math.floor(Math.random() * this.gridHeight);

      for (let segment of this.snake) {
        if (segment.x === x && segment.y === y) {
          collision = true;
          break;
        }
      }
    } while (collision);

    const fruit =
      this.fruitList[Math.floor(Math.random() * this.fruitList.length)];
    this.food = { x, y };
    this.foodType = fruit.name;
    this.foodPoints = fruit.points;
  }

  increaseLevel() {
    if (this.level < 5) {
      this.level++;
      this.currentSpeed = this.speedByLevel[this.level];
    }
  }

  checkCollision(segment) {
    // Check wall collision
    if (
      segment.x < 0 ||
      segment.x >= this.gridWidth ||
      segment.y < 0 ||
      segment.y >= this.gridHeight
    ) {
      return true;
    }

    // Check self collision (skip head)
    for (let i = 1; i < this.snake.length; i++) {
      if (segment.x === this.snake[i].x && segment.y === this.snake[i].y) {
        return true;
      }
    }

    return false;
  }

  update() {
    if (this.gameState !== "running") return;

    // Apply direction change
    this.direction = this.nextDirection;

    // Calculate new head
    const newHead = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };

    // Check collision
    if (this.checkCollision(newHead)) {
      this.gameState = "gameOver";
      this.onGameOver(this.score);
      return;
    }

    // Add new head
    this.snake.unshift(newHead);

    // Check food collision
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += this.foodPoints;
      this.fruitEaten++;
      this.onScoreUpdate(this.score);

      // Increase level every 5 fruits
      if (this.fruitEaten % 5 === 0) {
        this.increaseLevel();
      }

      this.generateFood();
    } else {
      // Remove tail (snake doesn't grow unless it eats food)
      this.snake.pop();
    }
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.gridWidth; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.gridSize, 0);
      this.ctx.lineTo(i * this.gridSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.gridHeight; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.gridSize);
      this.ctx.lineTo(this.canvas.width, i * this.gridSize);
      this.ctx.stroke();
    }

    // Draw snake
    for (let i = 0; i < this.snake.length; i++) {
      const segment = this.snake[i];
      const x = segment.x * this.gridSize;
      const y = segment.y * this.gridSize;

      if (i === 0) {
        // Head
        this.ctx.fillStyle = "#00ff00";
        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        // Eyes
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(x + 6, y + 6, 4, 4);
        this.ctx.fillRect(x + this.gridSize - 10, y + 6, 4, 4);
      } else {
        // Body
        this.ctx.fillStyle = "#00cc00";
        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
      }
    }

    // Draw food (fruit sprite)
    if (this.food && window.SPRITE_ATLAS) {
      const foodCoords = window.SPRITE_ATLAS.fruits[this.foodType];
      if (foodCoords) {
        const foodImg = new Image();
        foodImg.src = "/games/snake/assets/fruits.png";
        const fx = this.food.x * this.gridSize;
        const fy = this.food.y * this.gridSize;

        if (foodImg.complete) {
          this.ctx.drawImage(
            foodImg,
            foodCoords.x,
            foodCoords.y,
            foodCoords.w,
            foodCoords.h,
            fx,
            fy,
            this.gridSize,
            this.gridSize,
          );
        }
      } else {
        // Fallback: draw simple circle
        this.ctx.fillStyle = "#ff0000";
        this.ctx.beginPath();
        this.ctx.arc(
          this.food.x * this.gridSize + this.gridSize / 2,
          this.food.y * this.gridSize + this.gridSize / 2,
          this.gridSize / 2 - 4,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
      }
    }

    // Draw HUD
    this.drawHUD();
  }

  drawHUD() {
    const hudY = 20;
    const hudX = 10;

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "left";

    this.ctx.fillText(`Score: ${this.score}`, hudX, hudY);
    this.ctx.fillText(`Level: ${this.level}`, hudX, hudY + 25);
    this.ctx.fillText(`Speed: ${this.currentSpeed}ms`, hudX, hudY + 50);

    if (this.gameState === "paused") {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = "#fff";
      this.ctx.font = "32px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "PAUSED",
        this.canvas.width / 2,
        this.canvas.height / 2,
      );

      this.ctx.font = "16px Arial";
      this.ctx.fillText(
        "Press P or SPACE to resume",
        this.canvas.width / 2,
        this.canvas.height / 2 + 40,
      );
    }

    if (this.gameState === "gameOver") {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = "#ff0000";
      this.ctx.font = "40px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "GAME OVER",
        this.canvas.width / 2,
        this.canvas.height / 2 - 20,
      );

      this.ctx.fillStyle = "#fff";
      this.ctx.font = "20px Arial";
      this.ctx.fillText(
        `Final Score: ${this.score}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 30,
      );
    }
  }

  gameLoop() {
    const now = Date.now();
    const elapsed = now - this.lastUpdateTime;

    if (this.gameState === "running" && elapsed >= this.currentSpeed) {
      this.update();
      this.lastUpdateTime = now;
    }

    this.draw();

    if (this.gameState !== "stopped") {
      this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }
  }
}

module.exports = SnakeGame;
window.SnakeGame = SnakeGame;
