# Leaderboard y Tabla de Juegos

**State:** Implemented  
**Date:** 2026-09-06  
**Depends on:** SPEC 04 (Integración Supabase), SPEC 05 (Integración Juego Asteroids)

**Objective:** Implementar una tabla de referencia de juegos y un sistema de leaderboard filtrable por juego, visible en un salón de la fama y dentro de cada juego.

---

## Scope

**In:**

- Nueva tabla Supabase `games` para almacenar referencia de juegos disponibles
- Nueva tabla Supabase `game_scores` para almacenar puntuaciones de jugadores con nombre asociado
- Página `/leaderboard` (salón de la fama) con:
  - Tabla de juegos disponibles
  - Leaderboard filtrable por juego (top 10)
- Integración en `/game/[id]`:
  - Leaderboard del juego específico (top 10)
  - Tabla con información del juego actual
- Modal de nombre cuando termina una partida (se guarda en localStorage)
- Creación de registro para Asteroides en tabla `games`
- Mostrar puntuaciones totales por usuario (suma de todas sus puntuaciones)

**Not in:**

- Sistema de admin para agregar juegos (se hace manualmente por ahora)
- Actualizaciones en tiempo real del leaderboard
- Historial completo de partidas (solo puntuación final)
- Filtros adicionales (por categoría, fecha, rango)
- Paginación en leaderboard (top 10 fijo)
- Edición de nombre en el perfil de usuario (solo durante y después de terminar juego)

---

## Data Model

**Tabla `games`**

```
- id (uuid, primary key)
- nombre (text, not null)
- descripción (text)
- categoría (text)
- fecha_lanzamiento (timestamp)
- activo (boolean, default true)
- created_at (timestamp, default now())
```

**Tabla `game_scores`**

```
- id (uuid, primary key)
- usuario_id (uuid, foreign key → auth.users.id)
- juego_id (uuid, foreign key → games.id)
- player_name (text, not null) — nombre del jugador guardado desde localStorage
- puntuación (integer, not null)
- fecha_partida (timestamp, default now())
```

**localStorage**

```
- playerName (string) — nombre del jugador, guardado la primera vez que termina un juego
```

---

## Implementation Plan

1. Crear tablas `games` y `game_scores` en Supabase con políticas RLS (lectura pública, escritura solo usuario autenticado)
2. Insertar registro de Asteroides en tabla `games`
3. Crear lógica de nombre del jugador:
   - Al terminar una partida, verificar si existe `playerName` en localStorage
   - Si no existe, mostrar modal pidiendo nombre
   - Guardar nombre en localStorage para futuras partidas
   - Permitir editar nombre desde el modal
4. Crear página `/leaderboard` con:
   - Selector/filtro de juego (dropdown)
   - Tabla de juegos disponibles
   - Leaderboard top 10 del juego seleccionado
5. Crear componentes reutilizables:
   - `LeaderboardTable` (muestra top 10 con nombre jugador, puntuación, fecha)
   - `GamesTable` (muestra información del juego/s)
   - `PlayerNameModal` (pide/edita nombre del jugador)
6. Integrar componentes en `/game/[id]`:
   - Mostrar `GamesTable` con datos del juego actual
   - Mostrar `LeaderboardTable` con top 10 del juego actual
   - Mostrar `PlayerNameModal` cuando termina la partida
7. Actualizar lógica de fin de partida en Asteroides para:
   - Obtener nombre de localStorage
   - Guardar puntuación en `game_scores` con `player_name`, `usuario_id`, `juego_id`, `puntuación`

---

## Acceptance Criteria

- [x] Tablas `games` y `game_scores` existen en Supabase con estructura correcta (incluido campo `player_name`)
- [x] RLS permite lectura pública y escritura a usuarios autenticados
- [x] Asteroides está registrado en tabla `games`
- [x] Página `/leaderboard` carga correctamente
- [x] Filtro por juego en leaderboard actualiza la tabla
- [x] Leaderboard muestra top 10 ordenado por puntuación (descendente)
- [x] Modal pide nombre cuando termina juego por primera vez
- [x] Nombre se guarda en localStorage y se reutiliza en futuras partidas
- [x] Modal permite editar nombre antes de guardar puntuación
- [x] Puntuación se guarda en Supabase con el nombre del jugador (player_name)
- [x] En `/game/asteroids` aparece tabla del juego y leaderboard de Asteroides
- [x] Las columnas muestran: nombre jugador, puntuación, fecha de partida
- [x] Las tablas se ven bien en mobile y desktop

---

## Decisions Taken and Discarded

1. **Una tabla `game_scores` en lugar de una por juego** — decidido por usuario. Razón: más flexible para agregar juegos en el futuro sin crear tablas nuevas.
2. **Nombre del jugador en `game_scores` y localStorage** — permite que cada jugador tenga un nombre que se recuerda localmente, y se guarda con cada puntuación en Supabase para identificar al jugador en el leaderboard.
3. **Leaderboard global filtrable** — permite ver todos los juegos desde una página, pero cada juego tiene su propio leaderboard dentro de su vista.
4. **Top 10 fijo sin paginación** — suficiente para MVP. Paginación se puede agregar después si es necesario.
5. **Actualizaciones sin tiempo real** — refrescar la página es suficiente. WebSockets/subscripciones quedan para iteraciones futuras.

---

## Identified Risks

1. **Integridad referencial:** Si se elimina un juego, las puntuaciones quedan huérfanas. Solución: usar ON DELETE CASCADE o ON DELETE RESTRICT según política.
2. **Performance con muchas puntuaciones:** Si hay 100k+ registros, queries pueden ser lentas. Mitigation: índice en (juego_id, puntuación DESC), considerar paginación después.
3. **Usuario no autenticado intenta enviar score:** RLS debe validar que usuario_id pertenece a usuario actual.
4. **localStorage puede ser limpiado:** Si el usuario limpia localStorage pierde el nombre guardado. Solución: pedir nombre nuevamente la próxima partida.
