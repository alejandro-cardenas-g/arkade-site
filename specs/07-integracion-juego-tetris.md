# Spec 07: Integración del juego Tetris en la app

**State:** Implemented  
**Date:** 2026-09-06  
**Depends on:** Spec 04 (Integración Supabase), Spec 05 (Integración juego Asteroids), Spec 06 (Leaderboard y tabla de juegos)  
**Objective:** Integrar el juego Tetris existente en la aplicación Next.js como página jugable accesible desde la biblioteca de juegos, con leaderboard funcional.

## Scope

**In:**

- Adaptar `game.js` de `@references/started-games/03-tetris/` a una clase `TetrisGame` siguiendo el contrato canónico (constructor, métodos públicos, callbacks).
- Refactor de dos canvases a uno: dibujar el preview de siguiente pieza en una esquina del canvas principal.
- Dibujar líneas, nivel y score en el HUD del canvas (no en React).
- Crear componente React `TetrisGame.tsx` que envoltura el juego (wrapper).
- Crear página `/games/tetris` que renderiza el juego con layout normal (header, footer, navbar).
- Integrar el juego con botones: Pausar/Reanudar, Reiniciar, Volver a Biblioteca.
- Mostrar leaderboard top-10 del juego (reutilizando componentes de Spec 06).
- Registrar el juego en el catálogo (`lib/games/catalog.ts`).
- Insertar fila del juego en la tabla `games` de Supabase.
- Controles: teclado (mantener del original: flechas para mover, arriba para rotar, barra espaciadora para hard drop).
- Canvas renderiza dentro del layout (no fullscreen).

**Out:**

- Theme toggle light/dark (es chrome de página, no lógica de juego).
- CSS personalizado arcade (usar Tailwind global del sitio).
- Persistencia de scores en localStorage (solo en Supabase, igual que Asteroids).
- Modos de juego o dificultades adicionales.
- Multijugador o sincronización en red.
- Mobile/touch controls.
- Testing automatizado.
- Integración con autenticación de usuarios.

## Data Model

Se reutiliza la estructura existente de Spec 06:

**Catálogo en `lib/games/catalog.ts`:**

```typescript
{
  id: "tetris",
  name: "Tetris",
  description: "Juego clásico de bloques que caen",
  route: "/games/tetris"
}
```

**Fila en tabla `games` de Supabase:**

```sql
INSERT INTO public.games (nombre, descripción, categoría, activo)
VALUES ('Tetris', 'Juego clásico de bloques que caen', 'Puzzle', true);
```

**Tabla `game_scores`:** sin cambios, compartida con Asteroids.

## Implementation Plan

1. **Adaptar `game.js` a la clase canónica:**
   - Leer `references/started-games/03-tetris/game.js` (procedural, global scope).
   - Convertir a clase `TetrisGame`:
     - Constructor: `constructor(canvasElement, callbacks = {})`.
     - Guardar `this.canvas`, `this.ctx`, `this.onGameOver`, `this.onScoreUpdate`, `this.onPause`.
     - Convertir globales (`board`, `current`, `next`, `score`, `lines`, `level`, etc.) a campos de instancia.
     - Métodos públicos: `start()`, `pause()`, `resume()`, `restart()`, `getScore()`, `isGameOver()`, `destroy()`.
     - Listeners vinculados: `setupEventListeners()` / `removeEventListeners()`.
     - Invocar callbacks: `onScoreUpdate(this.score)` cuando cambia score, `onGameOver(this.score)` en fin de juego, `onPause(isPaused)` en pause/resume.
   - Refactor de canvases: fusionar preview (`next-canvas`) en el canvas principal, dibujando el preview en una esquina (ej. arriba a la derecha).
   - Dibujar líneas/nivel en el HUD del canvas (integrado, no en callbacks React).
   - Remover todas las referencias a elementos DOM (overlay, botones, HUD elements en sidebar).
   - Remover theme toggle logic (localStorage para tema, CSS tema-específico).
   - Export dual: `module.exports = TetrisGame; window.TetrisGame = TetrisGame;`.
   - Guardar en `public/games/tetris/game.js`.

2. **Crear componente React `app/games/tetris/TetrisGame.tsx`:**
   - `"use client"` component.
   - `forwardRef<{ pause, resume, restart, getScore }, { callbacks? }>`.
   - `canvasRef` (useRef) + `gameRef` (useRef).
   - `useImperativeHandle` expone: `pause()`, `resume()`, `restart()`, `getScore()`.
   - `useEffect` ([]): establece canvas size (300×600px), inyecta `<script src="/games/tetris/game.js">`, instancia `new window.TetrisGame(canvas, callbacks)`, llama `.start()`.
   - Cleanup: `gameRef.current.destroy()`.
   - Render: solo `<canvas ref={canvasRef} />`.
   - Template base: copia adaptada de `app/games/asteroids/AsteroidsGame.tsx`.

3. **Crear página `/games/tetris/page.tsx`:**
   - `"use client"` component.
   - `useRef` para gameRef, `useState` para `isPaused`, `isGameOver`, `score`, `showNameModal`.
   - `useEffect` ([]): fetch de fila `games` WHERE `nombre = "Tetris"`, fetch de leaderboard top-10 filtrando por `juego_id`.
   - Callbacks: `onGameOver` guarda score, abre modal si no existe `playerName`; `onScoreUpdate` sincroniza estado; `onPause` sincroniza pause state.
   - `saveScore(playerName)`: insert en `game_scores` con `anonymous_id`, `juego_id`, `player_name`, `puntuación`.
   - Handlers: `handlePause`, `handleRestart`.
   - Render: `<TetrisGame ref={gameRef} callbacks={callbacks} />`, botones (Pausar/Reanudar, Reiniciar, Volver a Biblioteca), `GamesTable`, `LeaderboardTable`, `PlayerNameModal`.
   - Template base: copia adaptada de `app/games/asteroids/page.tsx`.

4. **Registrar en catálogo:**
   - Abrir `lib/games/catalog.ts`.
   - Añadir entrada a `GAME_CATALOG`:
     ```typescript
     {
       id: "tetris",
       name: "Tetris",
       description: "Juego clásico de bloques que caen",
       route: "/games/tetris"
     }
     ```

5. **Registrar en Supabase:**
   - Usar `mcp__supabase__execute_sql` para insertar:
     ```sql
     INSERT INTO public.games (nombre, descripción, categoría, activo)
     VALUES ('Tetris', 'Juego clásico de bloques que caen', 'Puzzle', true);
     ```
   - Verificar que las políticas RLS existentes en `game_scores` ya cubren el nuevo juego.

6. **Verificar en navegador:**
   - Navegar a `/biblioteca` → debe mostrar card de Tetris.
   - Clickear "Jugar" en Tetris → ir a `/games/tetris`.
   - Canvas se renderiza correctamente.
   - Controles de teclado funcionan (flechas, arriba para rotar, barra espaciadora).
   - Score/líneas/nivel se actualizan en el HUD del canvas en tiempo real.
   - Botones Pausar/Reanudar/Reiniciar funcionan.
   - Mensaje de Game Over aparece cuando el juego termina.
   - Modal de nombre aparece (o auto-guarda con nombre existente).
   - Puntuación se insertan en `game_scores`.
   - Leaderboard muestra top-10 de Tetris.
   - Navegar a `/leaderboard` → Tetris aparece en el filtro.
   - Sin errores en consola.

## Acceptance Criteria

- [x] Archivo `public/games/tetris/game.js` existe con la clase `TetrisGame` adaptada.
- [x] Constructor acepta `canvasElement` y `callbacks`.
- [x] Métodos públicos `start()`, `pause()`, `resume()`, `restart()`, `getScore()`, `isGameOver()`, `destroy()` están implementados.
- [x] Callbacks `onGameOver`, `onScoreUpdate`, `onPause` se invocan en momentos correctos.
- [x] Dos canvases fusionados a uno; preview dibujado en esquina del canvas principal.
- [x] Líneas/nivel dibujados en HUD del canvas.
- [x] Componente `app/games/tetris/TetrisGame.tsx` existe y renderiza canvas sin errores.
- [x] Página `/games/tetris` es accesible, carga sin errores, usa layout compartido (Nav visible).
- [x] Controles de teclado (flechas, arriba, espacio) funcionan correctamente.
- [x] Score se muestra en canvas y se actualiza en tiempo real.
- [x] Botón "Pausar" pausa el juego, texto cambia a "Reanudar".
- [x] Botón "Reanudar" reanuda el juego.
- [x] Botón "Reiniciar" reinicia a score 0.
- [x] Mensaje de "Game Over" aparece cuando termina.
- [x] Botón "Volver a Biblioteca" redirige a `/biblioteca`.
- [x] Página `/biblioteca` muestra card de Tetris con nombre, descripción, botón "Jugar".
- [x] Modal de nombre aparece al terminar primera partida.
- [x] Nombre se guarda en localStorage y se reutiliza.
- [x] Puntuación se guarda en `game_scores` con `player_name`, `anonymous_id`, `juego_id`, `puntuación`.
- [x] `LeaderboardTable` muestra top-10 de Tetris ordenado por puntuación descendente.
- [x] Navegación a `/leaderboard` incluye Tetris en el filtro de juegos.
- [x] Catálogo en `lib/games/catalog.ts` incluye entrada de Tetris.
- [x] Fila en `games` de Supabase existe con `nombre="Tetris"`.
- [x] RLS de `game_scores` permite lectura/insert sin cambios.
- [x] Responsive en mobile, tablet, desktop.
- [x] Sin errores en consola del navegador.
- [x] `npm run dev` inicia correctamente.

## Decisions Taken and Discarded

- **Un canvas en lugar de dos:** Tetris original tiene canvas separados para main y preview. Al integrarlo en React, se fusiona preview en una esquina del canvas principal para simplificar el wrapper y mantenerlo genérico (un solo `<canvas ref>` por componente). La lógica de dibujo se adapta pero la jugabilidad no cambia.
- **HUD en canvas, no en React:** Score/líneas/nivel se dibujan directamente en el canvas del juego (mantiene Tetris visualmente igual), evitando callbacks adicionales y manteniendo el contrato canónico (`onScoreUpdate(score)` es suficiente).
- **Theme toggle descartado:** Es chrome de página (UI), no lógica de juego. La integración en Next.js hereda el tema global del sitio (Tailwind), que ya está centralizado en `app/layout.tsx`.
- **Contrato de callbacks idéntico:** Tetris, igual que Asteroids, usa `onGameOver(score)`, `onScoreUpdate(score)`, `onPause(isPaused)`. No se inventan callbacks para `onLinesUpdate`, `onLevelUpdate`, etc. — eso se dibuja en el game.js, no en React.
- **Lookup por nombre, no por ID:** La página consulta `.eq("nombre", "Tetris")` en Supabase, manteniendo consistencia con Asteroids (la implementación real, no el spec original).
- **Categoría "Puzzle" en lugar de "Arcade":** Tetris es conceptualmente un puzzle, no un arcade shooter. Diferencia respecto a Asteroids.

## Identified Risks

- **Canvas redimensionamiento:** Tetris original es 300×600px fijo. Si React monta el canvas con tamaño diferente, el juego se distorsionará. Mitigación: fijar `canvas.width = 300; canvas.height = 600;` en el componente React.
- **Fusión de dos canvases:** El refactor de dibujar preview en el canvas principal puede introducir bugs visuales o de overlay. Mitigación: testear manualmente en navegador que preview aparece en esquina correcta y no tape controles.
- **Listeners de teclado globales:** Tetris escucha en `window`/`document` directamente. Si hay múltiples instancias o colisiones de listeners, puede fallar. Mitigación: usar `setupEventListeners()` / `removeEventListeners()` con refs bound, llamar ambas en init/destroy del componente React.
- **Rendimiento del canvas:** Tetris redibuja en cada frame. Si hay lag o bajo FPS, la experiencia de juego se degrada. Mitigación: monitorear en browser DevTools; si es problema, optimizar redraw o considerar requestAnimationFrame tuning.
- **Pérdida de localStorage:** Si usuario limpia datos del navegador pierde `playerName` guardado — modal pide nombre nuevamente. Esto es comportamiento esperado, no un bug.
