# Spec 05: Integración del juego Asteroids en la app

**State:** Implemented  
**Date:** 2026-09-05  
**Depends on:** Spec 01 (Pantallas visuales del MVP)  
**Objective:** Integrar el juego de Asteroids existente en la aplicación Next.js como página jugable accesible desde la biblioteca de juegos.

## Scope

**In:**

- Crear estructura de rutas `/games/:gameId` para juegos jugables
- Crear página `/games/asteroids` que renderiza el juego Asteroids
- Adaptar el archivo `game.js` del proyecto referencia para funcionar con React mediante callbacks
- Crear componente React `AsteroidsGame.tsx` que wrappea el código del juego
- Integrar el juego en la página con layout normal (header, footer, navbar)
- Modificar game.js para que dispare callbacks en eventos importantes: game over, score actualizado, pausa
- Crear UI de React con botones: Pausar/Reanudar, Reiniciar, Volver a Biblioteca (React solo recibe notificaciones del juego)
- El HUD del juego (score, estado) ya viene integrado en el canvas del juego, no se renderiza UI React adicional
- Añadir el juego al catálogo de la biblioteca existente
- Controles: teclado (mantener del juego original)
- Canvas renderiza dentro del layout (no fullscreen)

**Out:**

- Persistencia de scores en base de datos (diferida a otro spec)
- Leaderboard o historial de juegos
- Modos de juego o dificultades adicionales
- Multijugador o sincronización en red
- Mobile/touch controls
- Testing automatizado
- Integración con autenticación de usuarios

## Data Model

Se introduce un catálogo de juegos como estructura de datos:

```typescript
// Estructura de cada juego en el catálogo
interface GameCatalog {
  id: string; // "asteroids", "pacman", etc.
  name: string; // "Asteroids"
  description: string; // "Juego clásico de asteroides"
  thumbnail?: string; // Ruta a imagen de preview (opcional)
  component: () => ReactNode; // Componente del juego
  route: string; // "/games/asteroids"
}

// Estructura de eventos del juego (callbacks que dispara game.js)
// React se suscribe a estos eventos para sincronizar su estado con el juego
interface GameCallbacks {
  onGameOver?: (finalScore: number) => void; // Cuando el juego termina
  onScoreUpdate?: (score: number) => void; // Cuando cambia el score (el HUD del juego lo muestra, React recibe notificación)
  onPause?: (isPaused: boolean) => void; // Cuando el jugador pausa/reanuda
  onRestart?: () => void; // Cuando el juego se reinicia
}
```

## Implementation Plan

1. Crear archivo de configuración `lib/games/catalog.ts`:
   - Definir array `GAME_CATALOG` con metadatos de cada juego (id, name, description, thumbnail, route)
   - Por ahora incluir solo Asteroids, pero estructura extensible para futuros juegos
   - Exportar funciones helper: `getGameById(id)`, `getAllGames()`

2. Copiar y adaptar archivo del juego:
   - Copiar `@references/started-games/02-asteroids/game.js` a `public/games/asteroids/game.js`
   - Modificar `game.js` para:
     - Aceptar elemento canvas como parámetro en constructor
     - Exponer métodos: `start()`, `pause()`, `resume()`, `restart()`, `getScore()`, `isGameOver()`
     - Aceptar callbacks: `onGameOver`, `onScoreUpdate`, `onPause` en constructor
     - Llamar callbacks en eventos correspondientes (fin del juego, cambio de score, pausa)

3. Crear componente React `app/games/asteroids/AsteroidsGame.tsx`:
   - Componente "use client" (Client Component)
   - useRef para mantener referencia a canvas
   - useEffect para inicializar el juego cuando se monta
   - useEffect para cleanup cuando se desmonta
   - Exportar refs/métodos: `pause()`, `resume()`, `restart()`, `getScore()`
   - Pasar callbacks (onGameOver, onScoreUpdate, onPause) como props

4. Crear página `/app/games/asteroids/page.tsx`:
   - Importar componente AsteroidsGame
   - Estado local: isPaused, isGameOver (para controlar UI de botones fuera del canvas)
   - Handlers: handlePause (pausa/reanuda en game.js), handleRestart (reinicia en game.js), handleGameOver (recibe callback del juego)
   - Render UI con:
     - Componente AsteroidsGame (canvas con HUD del juego integrado)
     - Botones: "Pausar/Reanudar", "Reiniciar", "Volver a Biblioteca" (solo controlan el juego)
     - Mensaje de "Game Over" cuando recibe callback `onGameOver`
   - Los botones Pausar/Reiniciar envían comandos al juego; React no renderiza UI del score (el HUD del canvas ya lo muestra)
   - Botón "Volver a Biblioteca" redirige a `/biblioteca`
   - Usar layout compartido (Nav del Spec 01)

5. Modificar `/app/biblioteca/page.tsx` (o crear si no existe):
   - Importar GAME_CATALOG de `lib/games/catalog`
   - Renderizar lista de juegos del catálogo
   - Mostrar para cada juego: nombre, descripción, thumbnail
   - Botón "Jugar" en cada juego que enlaza a su ruta `/games/:gameId`
   - Detectar en Nav que la ruta activa es `/biblioteca` cuando está en esta página

6. Crear archivo `app/games/layout.tsx` (si es necesario):
   - Layout compartido para todas las páginas de juegos
   - Reutilizar Nav del Spec 01
   - Asegurar que nav muestra estado de ruta activa

7. Copiar archivos estáticos del juego (si existen):
   - Imágenes, sprites, assets de `@references/started-games/02-asteroids/` a `public/games/asteroids/`
   - Favicon, si está presente en referencia

8. Verificar en navegador:
   - Navegar a `/biblioteca` → debe mostrar lista de juegos con Asteroids
   - Clickear "Jugar" en Asteroids → debe ir a `/games/asteroids`
   - Canvas se renderiza dentro del layout
   - Controles de teclado funcionan (flechas, espacio)
   - Botones Pausar/Reiniciar funcionan correctamente
   - Score se actualiza en UI cuando cambia en el juego
   - Mensaje de Game Over aparece cuando el juego termina
   - Botón Volver regresa a `/biblioteca`
   - Sin errores en consola

## Acceptance Criteria

- [ ] Archivo `lib/games/catalog.ts` existe con estructura de catálogo
- [ ] Juego Asteroids está registrado en GAME_CATALOG con metadatos correctos
- [ ] Archivo `public/games/asteroids/game.js` existe (copia adaptada del original)
- [ ] `game.js` expone métodos: start(), pause(), resume(), restart(), getScore(), isGameOver()
- [ ] `game.js` acepta y dispara callbacks: onGameOver, onScoreUpdate, onPause
- [ ] Componente `app/games/asteroids/AsteroidsGame.tsx` existe y renderiza canvas
- [ ] Canvas se renderiza correctamente sin errores
- [ ] Página `/games/asteroids` es accesible y carga sin errores
- [ ] Página usa layout compartido (Nav visible, responsive)
- [ ] Controles de teclado (flechas, espacio) funcionan para jugar
- [ ] Score se muestra en UI y se actualiza en tiempo real
- [ ] Botón "Pausar" pausa el juego y texto cambia a "Reanudar"
- [ ] Botón "Reanudar" reanuda el juego
- [ ] Botón "Reiniciar" reinicia el juego a score 0
- [ ] Mensaje de "Game Over" aparece cuando el juego termina
- [ ] Botón "Volver a Biblioteca" redirige a `/biblioteca`
- [ ] Página `/biblioteca` existe y lista todos los juegos del catálogo
- [ ] Cada juego en biblioteca tiene: nombre, descripción, botón "Jugar"
- [ ] Botón "Jugar" en Asteroids lleva a `/games/asteroids`
- [ ] Nav muestra ruta activa correctamente en `/biblioteca` y `/games/asteroids`
- [ ] Responsive en mobile, tablet y desktop
- [ ] Sin errores en consola del navegador
- [ ] `npm run dev` inicia correctamente

## Decisions Taken and Discarded

- **Ruta `/games/:gameId` en lugar de `/jugar/:gameId`**: Más semántica y escalable. Acomoda futuro `/games/leaderboard`, `/games/settings`, etc.
- **Catálogo centralizado en `lib/games/catalog.ts`**: Facilita agregar nuevos juegos sin tocar rutas o componentes. Mantenible a medida que crece.
- **Canvas dentro del layout en lugar de fullscreen**: Consistencia visual con el resto de la app. Fullscreen puede agregarse en spec futuro si se requiere.
- **Callbacks como única comunicación juego↔React**: El juego dispara eventos, React escucha. No hay duplicación de UI. El HUD ya viene en el canvas.
- **HUD y score integrados en el juego**: El canvas del juego renderiza su propio score y estado (no React). React solo recibe notificaciones por callbacks para sincronizar su estado (botones, Game Over).
- **Métodos expuestos en componente React**: Los botones (pausa, reinicio) son controlados desde React llamando métodos en el juego.
- **Controles solo teclado**: Reduce scope. Touch/mouse puede agregarse en spec posterior si es necesario.
- **Sin persistencia de scores en esta spec**: Base de datos se agrega cuando sea necesario (puede usarse Supabase del Spec 04).
- **Botón "Volver a Biblioteca" en lugar de back del navegador**: UX más clara y explícita. El usuario siempre sabe adónde va.

## Identified Risks

- **game.js depende de DOM APIs específicas**: Si el código original usa APIs que no están disponibles en SSR o tiene efectos secundarios globales, puede romper. Mitigación: `AsteroidsGame` es "use client" y se inicializa solo en browser.
- **Canvas no disponible al renderizar**: Si game.js intenta acceder a canvas en import time (no en init). Mitigación: todo debe estar en método `start()` o similar, llamado desde useEffect.
- **Multiple instancias del juego**: Si el usuario navega entre juegos rápidamente, puede haber memory leaks. Mitigación: cleanup en useEffect (desmontar el juego cuando el componente desmonta).
- **Keyboards events globales**: Si game.js escucha en `window` o `document` sin namespacing, puede colisionar con otros handlers de la app. Mitigación: revisar que listeners se remuevan en cleanup.
- **Assets no encontrados**: Si sprites o imágenes en `public/games/asteroids/` no se copian correctamente, el juego será invisible. Mitigación: verificar rutas en imports.
- **Conflicto de rutas**: Si existe otra página en `/games/asteroids` o la ruta es ambigua en Next.js. Mitigación: revisar app directory structure antes de implementar.
