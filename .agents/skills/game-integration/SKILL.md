---
name: game-integration
description: Integra un juego nuevo (desde references/started-games/ u otra fuente) en la app completa con leaderboard. Adapta el game.js vanilla al contrato de clase+callbacks, crea la página y el wrapper React, lo registra en el catálogo, inserta su fila en Supabase y conecta el leaderboard. Genera un spec que documenta la integración según SDD.
argument-hint: 'id o ruta del juego de referencia (ej. references/started-games/03-tetris, o "tetris")'
allowed-tools: Read, Edit, Write, Bash, AskUserQuestion, Grep, mcp__supabase__execute_sql, mcp__supabase__list_tables, mcp__supabase__get_advisors
disable-model-invocation: false
---

# /game-integration — Integración completa de juegos nuevos

## Propósito

Este skill automatiza la integración de un juego nuevo en la arcade app, desde su fuente de referencia hasta la página jugable con leaderboard funcional. Ejecuta todo en un flujo unificado: recopila información, genera un spec siguiendo SDD, implementa los archivos necesarios, registra el juego en Supabase y verifica que funcione end-to-end.

**Patrón base:** extendido de `specs/05-integracion-juego-asteroids.md` y `specs/06-leaderboard-y-tabla-juegos.md`.

## Metodología Spec-Driven Design (SDD)

Este skill **DEBE usar la metodología Spec-Driven Design completa**, con las siguientes etapas:

1. **Fase de Especificación (`/spec`):** Crear el spec completo con el skill `/spec`, haciendo preguntas puntuales para desambiguar requisitos. El spec documentará la integración de forma canónica.
2. **Cambio de rama:** Crear y cambiar a una rama `feat/integracion-juego-<slug>` antes de implementar.
3. **Fase de Implementación (`/spec-impl`):** Usar el skill `/spec-impl` para ejecutar el Implementation Plan del spec, **verificando el output paso a paso**:
   - Después de cada paso mayor (adaptar `game.js`, crear wrapper React, registrar en Supabase, etc.), hacer una pregunta de verificación al usuario.
   - Mostrar el código generado o los cambios realizados.
   - Pedir confirmación explícita o retroalimentación antes de continuar al siguiente paso.
4. **Cierre:** Hacer PR contra `main`, vincular el spec y la implementación.

## Flujo de ejecución

### Fase 1: Contexto y análisis del juego

1. **Leer plantillas de referencia:**
   - `specs/05-integracion-juego-asteroids.md` — patrón canónico Spec-Driven Design.
   - `specs/06-leaderboard-y-tabla-juegos.md` — patrón de leaderboard/persistencia.
   - `app/games/asteroids/AsteroidsGame.tsx` — wrapper React template.
   - `app/games/asteroids/page.tsx` — página template con leaderboard.
   - `public/games/asteroids/game.js` — clase adaptada template.
   - `lib/games/catalog.ts` — estructura del catálogo.

2. **Resolver el juego objetivo:**
   - Si `$ARGUMENTS` contiene una ruta dentro de `references/started-games/` (ej. `references/started-games/03-tetris`), validar que existe.
   - Si `$ARGUMENTS` es un slug (ej. `tetris`), inferir la ruta como `references/started-games/<##>-<slug>` (ej. `references/started-games/03-tetris`).
   - Si `$ARGUMENTS` está vacío o es otro formato, preguntar por la ruta/ubicación del juego.
   - Leer el `game.js` del juego objetivo para determinar su estructura: ¿es procedural (global scope)? ¿es ya una clase? ¿cuántos canvases? ¿qué assets (imágenes/sonidos)? ¿scripts auxiliares?

### Fase 2: Recopilación de metadatos

Hacer preguntas puntuales **solo sobre lo ambiguo**, no hacer una entrevista tipo `/spec`. Las decisiones ya están heredadas del patrón Asteroids/Spec 06, así que las únicas incógnitas son:

- **Nombre visible:** ¿Cómo aparece en la biblioteca? (ej. "Tetris", "Arkanoid").
- **Descripción:** una línea corta (ej. "Juego clásico de bloques que caen").
- **Categoría:** (ej. "Arcade", "Puzzle"). Libre; por defecto "Arcade".
- **ID/slug:** para rutas y carpeta `public/games/<id>`. Derivar automáticamente en minúsculas sin espacios (ej. "tetris" de "Tetris").
- **Features no-estándar:** si el juego tiene stats/UI más allá de score (ej. líneas/nivel en Tetris, vidas en Arkanoid), preguntar cómo se manejan:
  - Opción A (default): Se dibujan en el canvas HUD del juego, no en React. El callback `onScoreUpdate` lleva solo el score; stats extra los dibuja el game.js.
  - Opción B: Se exponen como getters adicionales (`getLines()`, `getLives()`) y React los renderiza en una barra lateral.
  - **Recomendar Opción A** (mantiene el contrato de callbacks idéntico y el wrapper React genérico).
- **Features problemáticas:** (ej. el theme toggle de Tetris que usa localStorage/DOM). Preguntar si se conservan o se simplifican/descartan. Default: se descartan (no es lógica de juego, es chrome de página).

Usar `AskUserQuestion` para estas preguntas.

### Fase 3: Generación del spec

**Usar el skill `/spec` para generar el spec completo.**

El `/spec` debe producir `specs/NN-integracion-juego-<slug>.md` con estructura idéntica a los specs 05/06:

- **Header:** State=Draft, Depends on=Spec 04 (Supabase), Objective (una línea: "Integrar el juego <Nombre> en la aplicación...").
- **Scope:** In/Out — heredar del spec 05/06, adaptar solo nombres.
- **Data Model:** (simplificar) una entrada en el catálogo de `lib/games/catalog.ts`, una fila en `games` de Supabase.
- **Implementation Plan:** pasos numerados (adaptar `game.js`, copiar assets, crear wrapper React, crear página, registrar en catalog, insertar en Supabase, verificar).
- **Acceptance Criteria:** checklist verificable.
- **Decisions Taken and Discarded:** explicar por qué se mantiene el contrato de callbacks estándar, etc.
- **Identified Risks:** si aplica (ej. si el juego tiene múltiples canvases, si hace mucidas DOM mods).

**Lenguaje:** español, estilo/convenciones idénticas a specs 05/06.

**Proceso:**

1. Invocar `/spec` con el contexto de la integración (juego, análisis inicial del game.js, metadatos).
2. El skill `/spec` hará preguntas puntuales si es necesario — **responder con los metadatos recopilados en Fase 2**.
3. Validar que el spec generado captura correctamente el plan de implementación.
4. No pedir confirmación sección por sección — generar el spec completo de una vez (el patrón es heredado, no hay diseño nuevo a refinar).

### Fase 4: Cambio de rama

Antes de implementar:

1. **Crear y cambiar a rama:** `git checkout -b feat/integracion-juego-<slug>`
2. Esta rama será usada por `/spec-impl` para los cambios de implementación.

### Fase 5: Implementación (usando `/spec-impl`)

**Usar el skill `/spec-impl` para ejecutar el Implementation Plan del spec.**

El `/spec-impl` debe automatizar los pasos siguiendo el plan, **con verificación paso a paso**:

#### Proceso de verificación:

Después de cada paso mayor (ej. adaptar `game.js`, crear wrapper React, insertar en Supabase), el skill DEBE:

1. **Mostrar el código/cambios realizados** — qué archivos fueron creados/modificados, extractos del código.
2. **Hacer una pregunta explícita de verificación** al usuario:
   - "¿Se ve bien el wrapper React? ¿Necesitas ajustes antes de continuar?"
   - "¿Coincide el código adaptado de `game.js` con lo esperado?"
   - "¿La fila en Supabase se insertó correctamente? ¿Quieres verificar antes de seguir?"
3. **Permitir retroalimentación antes de continuar** — si el usuario identifica un error o quiere cambios, hacer ajustes antes del siguiente paso.

#### Ejecución detallada:

#### 4.1. Adaptar `game.js` a la clase canónica

- Leer el `game.js` original del juego objetivo.
- Refactorizar para convertir todo el código procedural/global en una clase `<PascalCase>Game`:
  - Constructor: `constructor(canvasElement, callbacks = {})`.
  - Guardar `this.canvas`, `this.ctx`, `this.onGameOver`, `this.onScoreUpdate`, `this.onPause` desde callbacks.
  - Convertir `let`/`const` globales a campos de instancia (`this.*`).
  - Métodos públicos: `start()`, `pause()`, `resume()`, `restart()`, `getScore()`, `isGameOver()`, `destroy()`.
  - Listeners vinculados: `setupEventListeners()` (agrega listeners a `window`/`document`/`canvas`, guarda refs bound para poder remover), `removeEventListeners()` (cleanup).
  - Invocar callbacks en puntos clave: `this.onGameOver(this.score)` en fin de juego, `this.onScoreUpdate(this.score)` cuando cambia score, `this.onPause(isPaused)` en pause/resume.
  - Export dual: `module.exports = <Name>Game; window.<Name>Game = <Name>Game;`.

- **Asset paths:** si el código referencia assets relativos (ej. `new Image(); img.src = 'assets/spritesheet.png'`), actualizar a `/games/<id>/assets/spritesheet.png`.

- **Scripts auxiliares:** si el juego depende de otros scripts (ej. `levels.js`, `spritesheet.js` en Arkanoid), decidir:
  - Opción A (recomendado): Fusionar su contenido en el mismo `game.js` (ej. los datos de `levels.js` como constantes, o `spritesheet.js` como funciones/constantes auxiliares).
  - Opción B (si es complejo): Mantener scripts separados, actualizar el loader React (`app/games/<id>/GameComponent.tsx`, ver paso 4.3) para inyectarlos en secuencia.

- Guardar en `public/games/<id>/game.js`.

#### 4.2. Copiar assets estáticos

- Listar assets en la carpeta del juego de referencia: imágenes (`.png`, `.jpg`, `.svg`), sonidos (`.mp3`, `.wav`), fuentes (`.ttf`, `.woff`).
- Crear estructura en `public/games/<id>/assets/` si aplica.
- Copiar archivos respetando la estructura relativa.
- Actualizar paths en el código de `game.js` adaptado (arriba).

#### 4.3. Crear wrapper React (`app/games/<id>/<PascalCase>Game.tsx`)

- `"use client"` component, `forwardRef<{ pause, resume, restart, getScore }, { callbacks? }>`.
- `canvasRef` (useRef) + `gameRef` (useRef para guardar instancia de la clase).
- `useImperativeHandle` expone métodos: `pause()` → `gameRef.current.pause()`, etc.
- `useEffect` ([]): establece canvas size, verifica `window.<Name>Game`, inyecta `<script src="/games/<id>/game.js">`, instancia game, llama `.start()`.
- `useEffect` (cleanup): `gameRef.current.destroy()`.
- Render: solo `<canvas ref={canvasRef} />`.

Template base: copia adaptada de `app/games/asteroids/AsteroidsGame.tsx`, cambiar nombres.

#### 4.4. Crear página del juego (`app/games/<id>/page.tsx`)

- `"use client"` component.
- `useRef` para gameRef, `useState` para `isPaused`, `isGameOver`, `score`, `showNameModal`.
- `useEffect` ([]): fetch de fila `games` WHERE `nombre = "<Nombre>"`, fetch de leaderboard top-10 filtrando por `juego_id`.
- Callbacks: `onGameOver` guarda score y abre modal si no existe `playerName`; usa `getPlayerName()` de `lib/playerName.ts`.
- `saveScore(playerName)`: insert en `game_scores` con `anonymous_id` (vía `getAnonymousUserId()`), `juego_id`, `player_name`, `puntuación`.
- Handlers: `handlePause`, `handleRestart` llaman métodos del ref del game.
- Render: `<AsteroidsGameComponent ref={gameRef} callbacks={callbacks} />` (usar el nombre correcto del componente), botones (Pausar/Reanudar, Reiniciar, Volver a Biblioteca), `GamesTable`, `LeaderboardTable`, `PlayerNameModal`.

Template base: copia adaptada de `app/games/asteroids/page.tsx`, cambiar nombres y rutas.

#### 4.5. Crear/actualizar layout (`app/games/layout.tsx`, si no existe)

- Debe ser un passthrough: solo renderizar `{children}`. El Nav está en la raíz (`app/layout.tsx`).
- Si ya existe, dejar intacto.

#### 4.6. Registrar en el catálogo

- Abrir `lib/games/catalog.ts`.
- Añadir entrada a `GAME_CATALOG`:
  ```typescript
  {
    id: "<id>",
    name: "<Nombre>",
    description: "<Descripción>",
    route: "/games/<id>"
  }
  ```

#### 4.7. Registrar en Supabase

- Usar `mcp__supabase__execute_sql` para insertar fila en tabla `games`:
  ```sql
  INSERT INTO public.games (nombre, descripción, categoría, activo)
  VALUES ('<Nombre>', '<Descripción>', '<Categoría>', true);
  ```
  - `nombre` debe coincidir EXACTAMENTE con lo que `page.tsx` usará en `.eq("nombre", "...")`.
  - No hay que crear políticas RLS nuevas — las existentes ya cubren writes/reads públicos en `game_scores`.
- Antes de insertar, listar tablas (`mcp__supabase__list_tables`) para confirmar que `games` y `game_scores` existen con sus columnas correctas.

### Fase 6: Verificación end-to-end

Después de que `/spec-impl` complete todos los pasos:

- Iniciar dev server: `npm run dev`.
- Navegar a `/biblioteca` → debe aparecer card nueva del juego.
- Navegar a `/games/<id>` → canvas debe renderizar, controles de teclado funcionar.
- Jugar hasta game-over → modal de nombre debe aparecer (o auto-guardar si el nombre ya estaba guardado).
- Verificar que la puntuación se insertó en Supabase.
- Navegar a `/leaderboard` → filtro debe incluir el juego nuevo, top-10 debe mostrarse.
- Verificar que nav muestra `/games/<id>` como parte de Biblioteca.
- No hay errores en la consola del navegador.

**Hacer una pregunta final:** "¿Funciona todo correctamente? ¿Hay algo que ajustar antes de hacer el commit final?"

### Fase 7: Cierre y PR

- **Actualizar el spec:**
  - Cambiar `State: Draft` → `State: Implemented`.
  - Marcar todos los checkboxes de Acceptance Criteria como `[x]`.
- **Hacer commit en la rama** `feat/integracion-juego-<slug>`:
  - Mensaje: `feat: implement <Name> game integration with leaderboard`
  - Incluir referencia al spec: `Implements spec NN-integracion-juego-<slug>`
- **Crear PR contra `main`:**
  - Título: `feat: Integrate <Name> game with leaderboard`
  - Descripción: enlazar el spec, resumir cambios principales.
  - El PR debe incluir todos los archivos nuevos/modificados en `app/games/<id>/`, `public/games/<id>/`, cambios en `lib/games/catalog.ts`, y el spec nuevo en `specs/`.

## Estructura de archivos finales

```
app/games/<id>/
  ├── <PascalCase>Game.tsx     (wrapper React)
  ├── page.tsx                  (página del juego)
  └── layout.tsx                (passthrough, si es nueva)
public/games/<id>/
  ├── game.js                   (clase adaptada)
  └── assets/                   (images, sounds, etc.)
specs/
  └── NN-integracion-juego-<slug>.md (documentación SDD)
lib/games/catalog.ts            (entrada añadida)
```

## Reglas de oro

1. **Nunca tocar Asteroids.** El código en `app/games/asteroids/`, `public/games/asteroids/game.js` y la lógica de Supabase en `app/games/asteroids/page.tsx` quedan intactos — son la referencia, no se retro-aplican cambios.
2. **Contrato de callbacks fijo:** `onGameOver(score)`, `onScoreUpdate(score)`, `onPause(isPaused)`. No inventar nuevos callbacks para cada juego.
3. **Contrato de métodos fijo:** `start()`, `pause()`, `resume()`, `restart()`, `getScore()`, `isGameOver()`, `destroy()`. Todos todo juego debe implementar.
4. **Lookup por nombre, no por ID:** El código de página consulta `.eq("nombre", "<Nombre>")` en `games`, igual que Asteroids. Esto mantiene consistencia con la implementación real, no con el spec original que hablaba de IDs. El `id` del catálogo (`lib/games/catalog.ts`) es solo para rutas, no es usado en Supabase.
5. **Span de cambios:** cada juego nuevo afecta solo `app/games/<id>/`, `public/games/<id>/`, una línea en `lib/games/catalog.ts`, una línea SQL en Supabase, y un spec nuevo en `specs/`. Sin refactoring de código existente.
6. **Idioma:** español. El spec y las respuestas en español, siguiendo el estilo de los specs 05/06.

## Ejemplos

**Invocación para Tetris:**

```
/game-integration references/started-games/03-tetris
```

o

```
/game-integration tetris
```

**Invocación para Arkanoid:**

```
/game-integration 04-arkanoid
```

## Notas técnicas

- El wrapper React inyecta el `game.js` como `<script>` dinámicamente, esperando que la clase sea accesible en `window.<Name>Game`. Esto permite que cada juego tenga su propia clase sin colisiones.
- Las políticas RLS de `game_scores` actualmente permiten insert público (sin auth) — esto es deliberado para soportar juegos anónimos. La fila se marca con `anonymous_id` UUID desde localStorage.
- El leaderboard top-10 se cachea en React state y se refresrca al guardar score — no hay suscripciones/real-time (eso es future work).
- `lib/playerName.ts` maneja `playerName` y `anonymousUserId` en localStorage — este módulo es compartido por todos los juegos.
