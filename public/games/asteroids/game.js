"use strict";

class AsteroidsGame {
  constructor(canvasElement, callbacks = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.W = 800;
    this.H = 600;

    // Callbacks
    this.onGameOver = callbacks.onGameOver;
    this.onScoreUpdate = callbacks.onScoreUpdate;
    this.onPause = callbacks.onPause;

    // Input
    this.keys = {};
    this.justPressed = {};
    this.isPaused = false;
    this.lastTime = null;
    this.animationFrameId = null;

    // Game state
    this.ship = null;
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.powerUps = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.state = "playing"; // 'playing' | 'dead' | 'gameover'
    this.deadTimer = 0;
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;

    // Constants
    this.POWERUP_DROP_CHANCE = 0.15;
    this.POWERUP_DURATION = 5;
    this.POWERUP_TTL = 12;
    this.TRIPLE_SPREAD = 0.18;

    this.RADII = [0, 16, 30, 50];
    this.SPEEDS = [0, 85, 55, 32];
    this.POINTS = [0, 100, 50, 20];

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.handleKeyDown = (e) => {
      const gameKeys = [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "KeyP",
      ];
      if (gameKeys.includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys[e.code]) this.justPressed[e.code] = true;
      this.keys[e.code] = true;
    };

    this.handleKeyUp = (e) => {
      const gameKeys = [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "KeyP",
      ];
      if (gameKeys.includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = false;
    };

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  removeEventListeners() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  pressed(code) {
    const val = this.justPressed[code];
    this.justPressed[code] = false;
    return val;
  }

  // Utility functions
  wrap(v, max) {
    return ((v % max) + max) % max;
  }

  dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  rand(min, max) {
    return min + Math.random() * (max - min);
  }

  randInt(min, max) {
    return Math.floor(this.rand(min, max + 1));
  }

  // Bullet class
  createBullet(x, y, angle) {
    return {
      x,
      y,
      vx: Math.cos(angle) * 520,
      vy: Math.sin(angle) * 520,
      ttl: 1.1,
      radius: 2,
      dead: false,
    };
  }

  // Asteroid class
  createAsteroid(x, y, size = 3) {
    const angle = this.rand(0, Math.PI * 2);
    const speed = this.SPEEDS[size] + this.rand(-15, 15);
    const n = this.randInt(8, 13);
    const verts = [];
    const radius = this.RADII[size];

    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = radius * this.rand(0.6, 1.0);
      verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }

    return {
      x,
      y,
      size,
      radius,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotSpeed: this.rand(-1.2, 1.2),
      rot: this.rand(0, Math.PI * 2),
      verts,
      dead: false,
    };
  }

  // PowerUp class
  createPowerUp(x, y) {
    const angle = this.rand(0, Math.PI * 2);
    const speed = this.rand(20, 40);
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 12,
      ttl: this.POWERUP_TTL,
      dead: false,
    };
  }

  // Particle class
  createParticle(x, y) {
    const angle = this.rand(0, Math.PI * 2);
    const speed = this.rand(30, 130);
    const life = this.rand(0.4, 1.1);
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      ttl: life,
      dead: false,
    };
  }

  // Ship class
  createShip() {
    return {
      x: this.W / 2,
      y: this.H / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      radius: 12,
      thrusting: false,
      invincible: 3,
      shootCooldown: 0,
      tripleShot: 0,
      dead: false,
    };
  }

  spawnAsteroids(count) {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = this.rand(0, this.W);
        y = this.rand(0, this.H);
      } while (Math.hypot(x - this.W / 2, y - this.H / 2) < SAFE_DIST);
      this.asteroids.push(this.createAsteroid(x, y, 3));
    }
  }

  initGame() {
    this.ship = this.createShip();
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.state = "playing";
    this.spawnAsteroids(4);
  }

  nextLevel() {
    this.level++;
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.ship = this.createShip();
    this.spawnAsteroids(3 + this.level);
  }

  explode(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(x, y));
    }
  }

  killShip() {
    this.explode(this.ship.x, this.ship.y, 14);
    this.ship.dead = true;
    this.lives--;
    if (this.lives <= 0) {
      this.state = "gameover";
      if (this.onGameOver) this.onGameOver(this.score);
    } else {
      this.state = "dead";
      this.deadTimer = 2;
    }
  }

  update(dt) {
    if (this.isPaused) return;

    if (this.state === "gameover") {
      this.particles.forEach((p) => {
        p.ttl -= dt;
        if (p.ttl <= 0) p.dead = true;
      });
      this.particles = this.particles.filter((p) => !p.dead);
      return;
    }

    if (this.state === "dead") {
      this.deadTimer -= dt;
      this.particles.forEach((p) => {
        p.ttl -= dt;
        if (p.ttl <= 0) p.dead = true;
      });
      this.particles = this.particles.filter((p) => !p.dead);
      this.asteroids.forEach((a) => {
        a.x = this.wrap(a.x + a.vx * dt, this.W);
        a.y = this.wrap(a.y + a.vy * dt, this.H);
        a.rot += a.rotSpeed * dt;
      });
      if (this.deadTimer <= 0) {
        this.state = "playing";
        this.ship = this.createShip();
      }
      return;
    }

    // Shoot
    if (this.pressed("Space")) {
      this.bullets.push(...this.shipTryShoot());
    }

    // Ship update
    const ROT = 3.5;
    const THRUST = 260;
    const DRAG = 0.987;

    if (this.keys["ArrowLeft"]) this.ship.angle -= ROT * dt;
    if (this.keys["ArrowRight"]) this.ship.angle += ROT * dt;

    this.ship.thrusting = !!this.keys["ArrowUp"];
    if (this.ship.thrusting) {
      this.ship.vx += Math.cos(this.ship.angle) * THRUST * dt;
      this.ship.vy += Math.sin(this.ship.angle) * THRUST * dt;
    }

    this.ship.vx *= DRAG;
    this.ship.vy *= DRAG;
    this.ship.x = this.wrap(this.ship.x + this.ship.vx * dt, this.W);
    this.ship.y = this.wrap(this.ship.y + this.ship.vy * dt, this.H);

    if (this.ship.invincible > 0) this.ship.invincible -= dt;
    if (this.ship.shootCooldown > 0) this.ship.shootCooldown -= dt;
    if (this.ship.tripleShot > 0) this.ship.tripleShot -= dt;

    // Update bullets
    this.bullets.forEach((b) => {
      b.x = this.wrap(b.x + b.vx * dt, this.W);
      b.y = this.wrap(b.y + b.vy * dt, this.H);
      b.ttl -= dt;
      if (b.ttl <= 0) b.dead = true;
    });

    // Update asteroids
    this.asteroids.forEach((a) => {
      a.x = this.wrap(a.x + a.vx * dt, this.W);
      a.y = this.wrap(a.y + a.vy * dt, this.H);
      a.rot += a.rotSpeed * dt;
    });

    // Update particles
    this.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.ttl -= dt;
      if (p.ttl <= 0) p.dead = true;
    });

    // Update powerups
    this.powerUps.forEach((p) => {
      p.x = this.wrap(p.x + p.vx * dt, this.W);
      p.y = this.wrap(p.y + p.vy * dt, this.H);
      p.ttl -= dt;
      if (p.ttl <= 0) p.dead = true;
    });

    // Cleanup
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.particles = this.particles.filter((p) => !p.dead);
    this.powerUps = this.powerUps.filter((p) => !p.dead);

    // Powerup collision
    for (const p of this.powerUps) {
      if (!p.dead && this.dist(this.ship, p) < this.ship.radius + p.radius) {
        p.dead = true;
        this.ship.tripleShot = this.POWERUP_DURATION;
      }
    }

    // Bullet vs asteroid
    const newAsteroids = [];
    for (const b of this.bullets) {
      for (const a of this.asteroids) {
        if (!a.dead && !b.dead && this.dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          const oldScore = this.score;
          this.score += this.POINTS[a.size];
          if (this.onScoreUpdate) this.onScoreUpdate(this.score);
          this.explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...this.splitAsteroid(a));
          if (!this.powerUpSpawned) {
            this.killsSinceSpawn++;
            const guaranteed = this.killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < this.POWERUP_DROP_CHANCE) {
              this.powerUps.push(this.createPowerUp(a.x, a.y));
              this.powerUpSpawned = true;
            }
          }
        }
      }
    }
    this.asteroids = this.asteroids.filter((a) => !a.dead).concat(newAsteroids);
    this.bullets = this.bullets.filter((b) => !b.dead);

    // Ship vs asteroid
    if (this.ship.invincible <= 0) {
      for (const a of this.asteroids) {
        if (this.dist(this.ship, a) < this.ship.radius + a.radius * 0.82) {
          this.killShip();
          break;
        }
      }
    }

    // Level complete
    if (this.asteroids.length === 0) this.nextLevel();
  }

  splitAsteroid(asteroid) {
    if (asteroid.size <= 1) return [];
    return [
      this.createAsteroid(asteroid.x, asteroid.y, asteroid.size - 1),
      this.createAsteroid(asteroid.x, asteroid.y, asteroid.size - 1),
    ];
  }

  shipTryShoot() {
    if (this.ship.shootCooldown > 0 || this.ship.dead) return [];
    this.ship.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.ship.x + Math.cos(this.ship.angle) * NOSE;
    const oy = this.ship.y + Math.sin(this.ship.angle) * NOSE;
    if (this.ship.tripleShot > 0) {
      return [
        this.createBullet(ox, oy, this.ship.angle - this.TRIPLE_SPREAD),
        this.createBullet(ox, oy, this.ship.angle),
        this.createBullet(ox, oy, this.ship.angle + this.TRIPLE_SPREAD),
      ];
    }
    return [this.createBullet(ox, oy, this.ship.angle)];
  }

  drawLifeIcon(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1.2;
    this.ctx.lineJoin = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(9, 0);
    this.ctx.lineTo(-6, -5);
    this.ctx.lineTo(-3, 0);
    this.ctx.lineTo(-6, 5);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawHUD() {
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "15px monospace";

    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE  ${this.score}`, 14, 26);

    this.ctx.textAlign = "center";
    this.ctx.fillText(`NIVEL ${this.level}`, this.W / 2, 26);

    for (let i = 0; i < this.lives; i++)
      this.drawLifeIcon(this.W - 16 - i * 22, 18);

    if (this.ship.tripleShot > 0) {
      this.ctx.textAlign = "left";
      this.ctx.fillStyle = "#0ff";
      this.ctx.fillText(`3x  ${this.ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }

  drawOverlay(title, sub) {
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 46px monospace";
    this.ctx.fillText(title, this.W / 2, this.H / 2 - 18);
    this.ctx.font = "18px monospace";
    this.ctx.fillStyle = "rgba(255,255,255,0.65)";
    this.ctx.fillText(sub, this.W / 2, this.H / 2 + 22);
  }

  drawBullet(b) {
    this.ctx.fillStyle = "#fff";
    this.ctx.beginPath();
    this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawAsteroid(a) {
    this.ctx.save();
    this.ctx.translate(a.x, a.y);
    this.ctx.rotate(a.rot);
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1.5;
    this.ctx.lineJoin = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(a.verts[0][0], a.verts[0][1]);
    for (let i = 1; i < a.verts.length; i++)
      this.ctx.lineTo(a.verts[i][0], a.verts[i][1]);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawPowerUp(p) {
    if (p.ttl < 2 && Math.floor(p.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(Math.PI / 4);
    this.ctx.strokeStyle = "#0ff";
    this.ctx.lineWidth = 2;
    const r = p.radius * pulse;
    this.ctx.strokeRect(-r, -r, r * 2, r * 2);
    this.ctx.restore();
    this.ctx.fillStyle = "#0ff";
    this.ctx.font = "bold 12px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("3x", p.x, p.y);
  }

  drawParticle(p) {
    const alpha = p.ttl / p.life;
    this.ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
    this.ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
    this.ctx.stroke();
  }

  drawShip() {
    if (this.ship.dead) return;
    if (
      this.ship.invincible > 0 &&
      Math.floor(this.ship.invincible * 8) % 2 === 0
    )
      return;

    this.ctx.save();
    this.ctx.translate(this.ship.x, this.ship.y);
    this.ctx.rotate(this.ship.angle);
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1.5;
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(20, 0);
    this.ctx.lineTo(-12, -9);
    this.ctx.lineTo(-7, 0);
    this.ctx.lineTo(-12, 9);
    this.ctx.closePath();
    this.ctx.stroke();

    if (this.ship.thrusting && Math.random() > 0.35) {
      this.ctx.beginPath();
      this.ctx.moveTo(-8, -4);
      this.ctx.lineTo(-8 - this.rand(6, 14), 0);
      this.ctx.lineTo(-8, 4);
      this.ctx.strokeStyle = "rgba(255, 130, 0, 0.85)";
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  draw() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.W, this.H);

    this.particles.forEach((p) => this.drawParticle(p));
    this.asteroids.forEach((a) => this.drawAsteroid(a));
    this.powerUps.forEach((p) => this.drawPowerUp(p));
    this.bullets.forEach((b) => this.drawBullet(b));
    this.drawShip();

    this.drawHUD();

    if (this.state === "gameover")
      this.drawOverlay(
        "GAME OVER",
        `PUNTAJE: ${this.score}   —   ESPACIO PARA REINICIAR`,
      );
  }

  loop(ts) {
    const dt =
      this.lastTime === null ? 0 : Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    this.update(dt);
    this.draw();
    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  start() {
    this.initGame();
    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  pause() {
    this.isPaused = true;
    if (this.onPause) this.onPause(true);
  }

  resume() {
    this.isPaused = false;
    if (this.onPause) this.onPause(false);
  }

  restart() {
    this.initGame();
  }

  getScore() {
    return this.score;
  }

  isGameOver() {
    return this.state === "gameover";
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.removeEventListeners();
  }
}

// Export for use in modules and as global
if (typeof module !== "undefined" && module.exports) {
  module.exports = AsteroidsGame;
}
if (typeof window !== "undefined") {
  window.AsteroidsGame = AsteroidsGame;
}
