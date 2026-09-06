# Spec 09: Integración del juego Snake en la app

**State:** Implemented  
**Date:** 2026-09-06  
**Depends on:** Spec 04 (Integración Supabase), Spec 05 (Integración juego Asteroids), Spec 06 (Leaderboard y tabla de juegos)  
**Objective:** Integrar el juego Snake clásico en la aplicación Next.js como página jugable accesible desde la biblioteca de juegos, con sistema de niveles, frutas variadas y leaderboard funcional.

## Scope

**In:**

- Crear `game.js` que implemente una clase `SnakeGame` siguiendo el contrato canónico (constructor, métodos públicos, callbacks).
- Utilizar sprite atlas en `sprites.js` (21 frutas diferentes: manzana, pera, plátano, naranja, etc.) para generar frutas aleatorias en cada partida.
- Sistema de niveles: la velocidad de la serpiente aumenta con cada nivel (5 niveles posibles).
- Puntos variables por tipo de fruta: frutas diferentes tienen distinto valor de puntos.
- La serpiente crece al comer fruta.
- Juego termina cuando la serpiente choca consigo misma o con los bordes del canvas.
- Dibujar score, nivel y velocidad en el HUD del canvas (no en React).
- Crear componente React `SnakeGame.tsx` que envoltura el juego (wrapper).
- Crear página `/games/snake` que renderiza el juego con layout normal (header, footer, navbar).
- Integrar el juego con botones: Pausar/Reanudar, Reiniciar, Volver a Biblioteca.
- Mostrar leaderboard top-10 del juego (reutilizando componentes de Spec 06).
- Registrar el juego en el catálogo (`lib/games/catalog.ts`).
- Insertar fila del juego en la tabla `games` de Supabase.
- Controles: teclado (flechas arriba/abajo/izquierda/derecha para mover la serpiente).
- Canvas renderiza dentro del layout (no fullscreen).

**Out:**

- Modos de juego adicionales (ej. modo sandbox sin muros).
- Obstáculos en el tablero.
- Power-ups o items especiales.
- Modos de dificultad personalizados.
- Multijugador o sincronización en red.
- Mobile/touch controls.
- Testing automatizado.
- Integración con autenticación de usuarios.

## Data Model

Se reutiliza la estructura existente de Spec 06:

**Catálogo en `lib/games/catalog.ts`:**

```typescript
{
  id: "snake",
  name: "Snake",
  description: "Juego clásico de serpiente que crece",
  route: "/games/snake"
}
```

**Fila en tabla `games` de Supabase:**

```sql
INSERT INTO public.games (nombre, descripción, categoría, activo)
VALUES ('Snake', 'Juego clásico de serpiente que crece', 'Arcade', true);
```

**Tabla `game_scores`:** sin cambios, compartida con Asteroids, Tetris, Arkanoid.

**Sprite Atlas:**

- Fuente: `/games/snake/assets/fruits.png` (3790×442 px, fondo transparente).
- Coordenadas: definidas en `window.SPRITE_ATLAS` (inyectado desde `/games/snake/sprites.js`).
- 21 frutas disponibles: banana, orange, grape, garlic, eggplant, strawberry, cherry, carrot, mushroom, broccoli, watermelon, pepper, kiwi, lemon, peach, peanut, apple, tomato, berries, grapes2, pineapple.

## Implementation Plan

1. **Crear `game.js` con la clase canónica:**
   - Crear archivo `public/games/snake/game.js`.
   - Implementar clase `SnakeGame`:
     - Constructor: `constructor(canvasElement, callbacks = {})`.
     - Guardar `this.canvas`, `this.ctx`, `this.onGameOver`, `this.onScoreUpdate`, `this.onPause`.
     - Campos de instancia:
       - `this.snake` (array de segmentos {x, y}).
       - `this.food` (posición actual {x, y}).
       - `this.foodType` (tipo de fruta seleccionado).
       - `this.score`, `this.level`, `this.speed`, `this.direction`, `this.nextDirection`.
       - `this.gameState` (running, paused, gameOver).
       - Mapa de puntos por tipo de fruta: `FRUIT_POINTS = { apple: 10, banana: 15, orange: 20, ... }`.
     - Métodos públicos:
       - `start()`: inicializa la serpiente, genera primera fruta, comienza loop de juego.
       - `pause()`: pausa el juego, invoca `this.onPause(true)`.
       - `resume()`: reanuda, invoca `this.onPause(false)`.
       - `restart()`: reinicia a estado inicial (serpiente pequeña, score 0, level 1).
       - `getScore()`: retorna `this.score`.
       - `getLevel()`: retorna `this.level`.
       - `isGameOver()`: retorna si `this.gameState === 'gameOver'`.
       - `destroy()`: limpia event listeners, detiene game loop.
     - Listeners vinculados: `setupEventListeners()` (escucha arrow keys, aguanta referencia bound), `removeEventListeners()` (cleanup).
     - Lógica de juego:
       - **update()**: mueve serpiente según `this.direction`, detecta colisión con comida/pared/serpiente, actualiza score/nivel/speed.
       - **draw()**: dibuja tablero, serpiente, comida (usando sprite del atlas), HUD (score/nivel/speed).
       - **generateFood()**: elige fruta aleatoria y posición, asigna puntos según tipo.
       - **increaseLevel()**: aumenta `this.level` (máximo 5), aumenta `this.speed` (reduce intervalo de juego).
       - Invocar callbacks:
         - `this.onScoreUpdate(this.score)` cuando cambia score.
         - `this.onGameOver(this.score)` cuando choca (snake/wall).
         - `this.onPause(this.isPaused)` en pause/resume.
     - Game loop: `requestAnimationFrame` o `setInterval` a velocidad variable (nivel aumenta velocidad).
   - Inyectar sprite atlas: al inicio del juego, cargar `window.SPRITE_ATLAS` (definido en `/games/snake/sprites.js`), validar que frutas estén disponibles.
   - Export dual: `module.exports = SnakeGame; window.SnakeGame = SnakeGame;`.

2. **Copiar assets:**
   - Copiar `/home/acardenas/projects/claude/05-arcade-vault/references/source-assets/snake-assets/fruits.png` a `public/games/snake/assets/fruits.png`.
   - Copiar `/home/acardenas/projects/claude/05-arcade-vault/references/source-assets/snake-assets/sprites.js` a `public/games/snake/sprites.js`.
   - En `sprites.js`, actualizar paths de fuentes para que apunten a `/games/snake/assets/fruits.png` (ya lo tiene, pero validar).

3. **Crear componente React `app/games/snake/SnakeGame.tsx`:**
   - `"use client"` component.
   - `forwardRef<{ pause, resume, restart, getScore }, { callbacks? }>`.
   - `canvasRef` (useRef) + `gameRef` (useRef).
   - `useImperativeHandle` expone: `pause()`, `resume()`, `restart()`, `getScore()`.
   - `useEffect` ([]):
     - Establece canvas size (640×480 px — tablero típico 20×15 segmentos de 32 px).
     - Inyecta `<script src="/games/snake/sprites.js">` (carga sprite atlas).
     - Inyecta `<script src="/games/snake/game.js">`.
     - Instancia `new window.SnakeGame(canvas, callbacks)`, llama `.start()`.
   - Cleanup: `gameRef.current.destroy()`.
   - Render: solo `<canvas ref={canvasRef} />`.
   - Template base: copia adaptada de `app/games/asteroids/AsteroidsGame.tsx`.

4. **Crear página `/games/snake/page.tsx`:**
   - `"use client"` component.
   - `useRef` para gameRef, `useState` para `isPaused`, `isGameOver`, `score`, `showNameModal`.
   - `useEffect` ([]):
     - Fetch de fila `games` WHERE `nombre = "Snake"`.
     - Fetch de leaderboard top-10 filtrando por `juego_id`.
   - Callbacks:
     - `onGameOver(score)`: guarda score, abre modal si no existe `playerName`.
     - `onScoreUpdate(score)`: sincroniza estado local.
     - `onPause(isPaused)`: sincroniza pause state.
   - `saveScore(playerName)`: insert en `game_scores` con `anonymous_id`, `juego_id`, `player_name`, `puntuación`.
   - Handlers: `handlePause`, `handleRestart`.
   - Render:
     - `<SnakeGame ref={gameRef} callbacks={callbacks} />` (canvas del juego).
     - Botones: "Pausar/Reanudar", "Reiniciar", "Volver a Biblioteca".
     - `GamesTable` (info del juego).
     - `LeaderboardTable` (top-10 scores).
     - `PlayerNameModal` (modal de nombre si es primera partida).
   - Template base: copia adaptada de `app/games/asteroids/page.tsx`.

5. **Registrar en catálogo:**
   - Abrir `lib/games/catalog.ts`.
   - Añadir entrada a `GAME_CATALOG`:
     ```typescript
     {
       id: "snake",
       name: "Snake",
       description: "Juego clásico de serpiente que crece",
       route: "/games/snake"
     }
     ```

6. **Registrar en Supabase:**
   - Usar `mcp__supabase__execute_sql` para insertar:
     ```sql
     INSERT INTO public.games (nombre, descripción, categoría, activo)
     VALUES ('Snake', 'Juego clásico de serpiente que crece', 'Arcade', true);
     ```
   - Verificar que las políticas RLS existentes en `game_scores` ya cubren el nuevo juego.

7. **Verificar en navegador:**
   - Navegar a `/biblioteca` → debe mostrar card de Snake.
   - Clickear "Jugar" en Snake → ir a `/games/snake`.
   - Canvas se renderiza correctamente con tablero.
   - Controles de teclado funcionan (flechas para mover).
   - Score/nivel/velocidad se actualizan en el HUD del canvas en tiempo real.
   - Frutas diferentes aparecen con sprites correctos.
   - Serpiente crece al comer.
   - Botones Pausar/Reanudar/Reiniciar funcionan.
   - Mensaje de Game Over aparece cuando choca.
   - Modal de nombre aparece (o auto-guarda con nombre existente).
   - Puntuación se insertan en `game_scores`.
   - Leaderboard muestra top-10 de Snake.
   - Navegar a `/leaderboard` → Snake aparece en el filtro.
   - Sin errores en consola.

## Acceptance Criteria

- [x] Archivo `public/games/snake/game.js` existe con la clase `SnakeGame` adaptada.
- [x] Constructor acepta `canvasElement` y `callbacks`.
- [x] Métodos públicos `start()`, `pause()`, `resume()`, `restart()`, `getScore()`, `getLevel()`, `isGameOver()`, `destroy()` están implementados.
- [x] Callbacks `onGameOver`, `onScoreUpdate`, `onPause` se invocan en momentos correctos.
- [x] Sprite atlas (`window.SPRITE_ATLAS`) se carga correctamente desde `sprites.js`.
- [x] Frutas diferentes aparecen en el tablero con sprites correctos.
- [x] Puntos varían según tipo de fruta (validar en HUD).
- [x] Nivel aumenta cada N frutas comidas (máximo 5 niveles).
- [x] Velocidad aumenta con cada nivel.
- [x] Score se dibuja en el HUD del canvas.
- [x] Nivel se dibuja en el HUD del canvas.
- [x] Velocidad se dibuja en el HUD del canvas.
- [x] Serpiente crece correctamente al comer fruta.
- [x] Juego termina al chocar con pared.
- [x] Juego termina al chocar consigo misma.
- [x] Componente `app/games/snake/SnakeGame.tsx` existe y renderiza canvas sin errores.
- [x] Página `/games/snake` es accesible, carga sin errores, usa layout compartido (Nav visible).
- [x] Controles de teclado (flechas) funcionan correctamente.
- [x] Botón "Pausar" pausa el juego, texto cambia a "Reanudar".
- [x] Botón "Reanudar" reanuda el juego.
- [x] Botón "Reiniciar" reinicia a score 0, nivel 1.
- [x] Mensaje de "Game Over" aparece cuando termina.
- [x] Botón "Volver a Biblioteca" redirige a `/biblioteca`.
- [x] Página `/biblioteca` muestra card de Snake con nombre, descripción, botón "Jugar".
- [x] Modal de nombre aparece al terminar primera partida.
- [x] Nombre se guarda en localStorage y se reutiliza.
- [x] Puntuación se insertó en `game_scores` con datos correctos.
- [x] Leaderboard muestra top-10 de Snake filtrado por `juego_id`.
- [x] Página `/leaderboard` incluye Snake en el filtro de juegos.

## Decisions Taken and Discarded

1. **Sistema de niveles vs. infinito:** Se mantiene sistema de 5 niveles (speed aumenta) para evitar complejidad infinita y dar sensación de progresión clara. Discardado: sistema infinito sin límite.

2. **Frutas variables vs. una sola:** Se usan 21 frutas del sprite atlas con puntos diferentes para mayor variedad y jugabilidad. Discardado: una sola fruta genérica.

3. **HUD en canvas vs. React:** El HUD (score/nivel/velocidad) se dibuja en el canvas, no en React UI, para mantener consistencia con Asteroids/Tetris/Arkanoid y evitar sincronización de estado duplicada.

4. **Colisión con pared vs. wrap-around:** Se usa colisión mortal con pared (juego termina). Discardado: juego que envuelve al otro lado.

5. **Callbacks estándar:** Se mantienen los 3 callbacks canónicos (`onGameOver`, `onScoreUpdate`, `onPause`), sin callbacks adicionales para `getLevel()` o `getFruitType()`. Justificación: el HUD del canvas dibuja nivel/velocidad; React solo recibe notificaciones de cambio de score/game-over/pause.

## Identified Risks

1. **Sprite atlas loading:** Si `window.SPRITE_ATLAS` no se carga antes de instanciar `SnakeGame`, las frutas no se dibujarán. Mitigación: garantizar que `sprites.js` se inyecta antes de `game.js` en el useEffect, o validar que `window.SPRITE_ATLAS` existe antes de instanciar.

2. **Game loop performance:** Si la serpiente es muy grande (200+ segmentos) o el nivel es muy alto, el `requestAnimationFrame` podría no mantener 60 FPS. Mitigación: limitar longitud de serpiente o optimizar draw loop.

3. **Keyboard input buffering:** Si el jugador presiona dos flechas muy rápido, la serpiente podría cambiar de dirección "atrás" sobre sí misma. Mitigación: validar que dirección nueva no es opuesta a la actual, o guardar `nextDirection` y aplicar en siguiente frame.

4. **Canvas size:** 640×480 es estándar, pero puede ser muy pequeño en móviles. Mitigación: es in-scope de "sin mobile/touch controls", así que se deja como está.

## Related Specs

- Spec 05 (Asteroids): patrón base de integración de juegos.
- Spec 06 (Leaderboard): componentes reutilizados.
- Spec 04 (Supabase): políticas RLS y tablas.
