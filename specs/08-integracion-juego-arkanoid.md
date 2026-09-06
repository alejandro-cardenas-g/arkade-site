# Spec 08: Integración del juego Arkanoid en la app

**State:** Implemented  
**Date:** 2026-09-06  
**Depends on:** Spec 04 (Integración Supabase), Spec 05 (Integración juego Asteroids), Spec 06 (Leaderboard y tabla de juegos)  
**Objective:** Integrar el juego Arkanoid existente en la aplicación Next.js como página jugable accesible desde la biblioteca de juegos, con leaderboard funcional.

## Scope

**In:**

- Adaptar `game.js` de `@references/started-games/04-arkanoid/` a una clase `ArkanoidGame` siguiendo el contrato canónico (constructor, métodos públicos, callbacks).
- Fusionar `levels.js` en `game.js` (constantes LEVELS integradas).
- Mantener soporte de spritesheet en `assets/spritesheet.js` — copiar y adaptar para rutas `/games/arkanoid/`.
- Dibujar vidas y nivel en el HUD del canvas (no en React).
- Mantener overlay de pausa con seleción de niveles (1-5) intacto.
- Crear componente React `ArkanoidGame.tsx` que envoltura el juego (wrapper).
- Crear página `/games/arkanoid` que renderiza el juego con layout normal (header, footer, navbar).
- Integrar el juego con botones: Pausar/Reanudar, Reiniciar, Volver a Biblioteca.
- Mostrar leaderboard top-10 del juego (reutilizando componentes de Spec 06).
- Registrar el juego en el catálogo (`lib/games/catalog.ts`).
- Insertar fila del juego en la tabla `games` de Supabase.
- Controles: teclado (flechas izquierda/derecha, P/Escape para pausa) y mouse (mover paleta con movimento de mouse).
- Canvas renderiza dentro del layout (no fullscreen).

**Out:**

- Sonidos (assets/sounds/ copiados pero no reproducidos — feature de-scoped por simplicidad de integración).
- Animaciones de explosión (lógica compleja de frames, puede simplificarse o descartarse).
- Modos de juego o dificultades adicionales.
- Multijugador o sincronización en red.
- Mobile/touch controls (mouse de-scoped para touch).
- Testing automatizado.
- Integración con autenticación de usuarios.

## Data Model

Se reutiliza la estructura existente de Spec 06:

**Catálogo en `lib/games/catalog.ts`:**

```typescript
{
  id: "arkanoid",
  name: "Arkanoid",
  description: "Juego clásico de romper bloques",
  route: "/games/arkanoid"
}
```

**Fila en tabla `games` de Supabase:**

```sql
INSERT INTO public.games (nombre, descripción, categoría, activo)
VALUES ('Arkanoid', 'Juego clásico de romper bloques', 'Arcade', true);
```

**Tabla `game_scores`:** sin cambios, compartida con Asteroids y Tetris.

## Implementation Plan

1. **Adaptar `game.js` a la clase canónica:**
   - Leer `references/started-games/04-arkanoid/game.js` (procedural, global scope).
   - Convertir a clase `ArkanoidGame`:
     - Constructor: `constructor(canvasElement, callbacks = {})`.
     - Guardar `this.canvas`, `this.ctx`, `this.onGameOver`, `this.onScoreUpdate`, `this.onPause`.
     - Convertir globales (`paddle`, `ball`, `blocks`, `lives`, `score`, `gameState`, `currentLevel`, `isPaused`, etc.) a campos de instancia.
     - Métodos públicos: `start()`, `pause()`, `resume()`, `restart()`, `getScore()`, `isGameOver()`, `destroy()`.
     - Listeners vinculados: `setupEventListeners()` / `removeEventListeners()` (teclado + mouse).
     - Invocar callbacks: `onScoreUpdate(this.score)` cuando cambia score, `onGameOver(this.score)` en fin de juego (lives = 0), `onPause(isPaused)` en pause/resume.
   - Fusionar `levels.js`: mover constante `LEVELS` a la clase como `static LEVELS` o `this.LEVELS`.
   - Mantener overlay de pausa con botones de niveles (1-5) — clickear botón carga ese nivel.
   - Dibujar score, nivel, vidas en HUD del canvas (mantener dibujo en `draw()`, no exponer como callbacks).
   - Remover referencias a elementos DOM (canvas solo, no botones HTML fuera).
   - Copiar y adaptar `assets/spritesheet.js` a `/games/arkanoid/spritesheet.js` — actualizar path de imagen a `/games/arkanoid/assets/spritesheet-breakout.png`.
   - Export dual: `module.exports = ArkanoidGame; window.ArkanoidGame = ArkanoidGame;`.
   - Guardar en `public/games/arkanoid/game.js`.

2. **Copiar assets:**
   - Copiar `/references/started-games/04-arkanoid/assets/spritesheet-breakout.png` a `public/games/arkanoid/assets/spritesheet-breakout.png`.
   - Copiar `/references/started-games/04-arkanoid/assets/spritesheet.js` a `public/games/arkanoid/assets/spritesheet.js` (adaptar paths).
   - Copiar sonidos (opcional, de-scoped por ahora pero presentes): `assets/sounds/*.mp3` → `public/games/arkanoid/assets/sounds/`.

3. **Crear componente React `app/games/arkanoid/ArkanoidGame.tsx`:**
   - `"use client"` component.
   - `forwardRef<{ pause, resume, restart, getScore }, { callbacks? }>`.
   - `canvasRef` (useRef) + `gameRef` (useRef).
   - `useImperativeHandle` expone: `pause()`, `resume()`, `restart()`, `getScore()`.
   - `useEffect` ([]): establece canvas size (800×600px), inyecta scripts en orden:
     1. `<script src="/games/arkanoid/assets/spritesheet.js">`
     2. `<script src="/games/arkanoid/game.js">`
     - Instancia `new window.ArkanoidGame(canvas, callbacks)`.
     - Llama `.start()`.
   - Cleanup: `gameRef.current.destroy()` (cleanup de listeners).
   - Render: solo `<canvas ref={canvasRef} />`.
   - Template base: copia adaptada de `app/games/tetris/TetrisGame.tsx`.

4. **Crear página `/games/arkanoid/page.tsx`:**
   - `"use client"` component.
   - `useRef` para gameRef, `useState` para `isPaused`, `isGameOver`, `score`, `showNameModal`.
   - `useEffect` ([]): fetch de fila `games` WHERE `nombre = "Arkanoid"`, fetch de leaderboard top-10 filtrando por `juego_id`.
   - Callbacks: `onGameOver` guarda score, abre modal si no existe `playerName`; `onScoreUpdate` sincroniza estado; `onPause` sincroniza pause state.
   - `saveScore(playerName)`: insert en `game_scores` con `anonymous_id`, `juego_id`, `player_name`, `puntuación`.
   - Handlers: `handlePause`, `handleRestart`.
   - Render: `<ArkanoidGame ref={gameRef} callbacks={callbacks} />`, botones (Pausar/Reanudar, Reiniciar, Volver a Biblioteca), `GamesTable`, `LeaderboardTable`, `PlayerNameModal`.
   - Template base: copia adaptada de `app/games/tetris/page.tsx`.

5. **Registrar en catálogo:**
   - Abrir `lib/games/catalog.ts`.
   - Añadir entrada a `GAME_CATALOG`:
     ```typescript
     {
       id: "arkanoid",
       name: "Arkanoid",
       description: "Juego clásico de romper bloques",
       route: "/games/arkanoid"
     }
     ```

6. **Registrar en Supabase:**
   - Usar `mcp__supabase__execute_sql` para insertar:
     ```sql
     INSERT INTO public.games (nombre, descripción, categoría, activo)
     VALUES ('Arkanoid', 'Juego clásico de romper bloques', 'Arcade', true);
     ```
   - Verificar que las políticas RLS existentes en `game_scores` ya cubren el nuevo juego.

7. **Verificar en navegador:**
   - Navegar a `/biblioteca` → debe mostrar card de Arkanoid.
   - Clickear "Jugar" en Arkanoid → ir a `/games/arkanoid`.
   - Canvas se renderiza correctamente (800×600).
   - Controles de teclado funcionan (flechas, P/Escape para pausa).
   - Mouse mueve paleta correctamente.
   - Score/nivel/vidas se actualizan en el HUD del canvas en tiempo real.
   - Pausar overlay aparece con botones de niveles; clickear cambia nivel.
   - Botones Pausar/Reanudar/Reiniciar funcionan.
   - Mensaje de Game Over aparece cuando lives = 0.
   - Modal de nombre aparece (o auto-guarda con nombre existente).
   - Puntuación se inserta en `game_scores`.
   - Leaderboard muestra top-10 de Arkanoid.
   - Navegar a `/leaderboard` → Arkanoid aparece en el filtro.
   - Sin errores en consola.

## Acceptance Criteria

- [x] Archivo `public/games/arkanoid/game.js` existe con la clase `ArkanoidGame` adaptada.
- [x] Constructor acepta `canvasElement` y `callbacks`.
- [x] Métodos públicos `start()`, `pause()`, `resume()`, `restart()`, `getScore()`, `isGameOver()`, `destroy()` están implementados.
- [x] Callbacks `onGameOver`, `onScoreUpdate`, `onPause` se invocan en momentos correctos.
- [x] LEVELS integrado en game.js (no archivo separado).
- [x] Spritesheet helpers copiados y adaptados en `/games/arkanoid/assets/spritesheet.js`.
- [x] Score/nivel/vidas dibujados en HUD del canvas.
- [x] Overlay de pausa con botones de niveles funciona (clickear cambia nivel).
- [x] Componente `app/games/arkanoid/ArkanoidGame.tsx` existe y renderiza canvas sin errores.
- [x] Página `/games/arkanoid` es accesible, carga sin errores, usa layout compartido (Nav visible).
- [x] Canvas size correcto (800×600).
- [x] Controles de teclado (flechas, P/Escape) funcionan correctamente.
- [x] Mouse mueve paleta correctamente.
- [x] Score se muestra en canvas y se actualiza en tiempo real.
- [x] Nivel se muestra en canvas y cambia al completar un nivel o usar overlay.
- [x] Vidas se muestran en canvas como bolitas y decrecen al perder.
- [x] Botón "Pausar" pausa el juego, texto cambia a "Reanudar".
- [x] Botón "Reanudar" reanuda el juego.
- [x] Botón "Reiniciar" reinicia a score 0, lives 3, nivel 1.
- [x] Mensaje de "Game Over" aparece cuando lives = 0.
- [x] Botón "Volver a Biblioteca" redirige a `/biblioteca`.
- [x] Página `/biblioteca` muestra card de Arkanoid con nombre, descripción, botón "Jugar".
- [x] Modal de nombre aparece al terminar primera partida.
- [x] Nombre se guarda en localStorage y se reutiliza.
- [x] Puntuación se guarda en `game_scores` con `player_name`, `anonymous_id`, `juego_id`, `puntuación`.
- [x] `LeaderboardTable` muestra top-10 de Arkanoid ordenado por puntuación descendente.
- [x] Navegación a `/leaderboard` incluye Arkanoid en el filtro de juegos.
- [x] Catálogo en `lib/games/catalog.ts` incluye entrada de Arkanoid.
- [x] Fila en `games` de Supabase existe con `nombre="Arkanoid"`.
- [x] RLS de `game_scores` permite lectura/insert sin cambios.
- [x] Responsive en mobile, tablet, desktop.
- [x] Sin errores en consola del navegador.
- [x] `npm run dev` inicia correctamente.

## Decisions Taken and Discarded

- **Un canvas en lugar de múltiples:** Arkanoid original tiene un solo canvas. Se mantiene igual en la integración (a diferencia de Tetris que fusionaba dos).
- **HUD en canvas, no en React:** Score/nivel/vidas se dibujan en el canvas (mantiene Arkanoid visualmente igual), evitando callbacks adicionales y manteniendo contrato canónico.
- **Overlay de pausa con level-jump conservado:** A diferencia de Tetris que simplificó, Arkanoid mantiene la UI de selección de niveles en pausa — es parte integral de la experiencia de juego en este título.
- **Sonidos de-scoped por simplicidad:** Los audios existen en assets pero no se reproducen en la integración (audio context complexity, no core para leaderboard). Puede re-habilitarse en future work.
- **Animaciones de explosión simplificadas/descartadas:** Lógica de frames complejos; se asume que bloques simplemente desaparecen o se usa dibujo directo sin animaciones multi-frame.
- **Contrato de callbacks idéntico:** Arkanoid, igual que Asteroids y Tetris, usa `onGameOver(score)`, `onScoreUpdate(score)`, `onPause(isPaused)`.
- **Lookup por nombre, no por ID:** La página consulta `.eq("nombre", "Arkanoid")` en Supabase, manteniendo consistencia con implementaciones anteriores.
- **Categoría "Arcade" en lugar de "Puzzle":** Arkanoid es conceptualmente un arcade action game.

## Identified Risks

- **Canvas redimensionamiento:** Arkanoid es 800×600px fijo. Si React monta con tamaño diferente, se distorsionará. Mitigación: fijar en componente React.
- **Listeners de teclado + mouse:** Arkanoid escucha ambos (flechas + mouse para paddle). Colisiones de listeners si múltiples instancias. Mitigación: `setupEventListeners()` / `removeEventListeners()` con refs bound.
- **Spritesheet injection:** Necesita `spritesheet.js` antes de `game.js`. Orden de scripts crítica.
- **Pausa overlay DOM parsing:** Overlay de pausa usa `canvas.getBoundingClientRect()` para detectar clicks en botones de nivel. Si canvas se redimensiona/reposiciona, clicks pueden fallar. Mitigación: testear manualmente en navegador.

## Qué NO incluye este spec

- Sonidos (audio implementado pero de-scoped de integración).
- Animaciones multi-frame de explosiones.
- Highscores persistentes en servidor (cubierto por leaderboard de Spec 06).
- Sincronización en red o multijugador.
- Mobile/touch controls (mouse de-scoped).
