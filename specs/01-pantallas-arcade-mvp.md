# Spec 01: Pantallas visuales del MVP de Arcade Vault

**State:** Approved  
**Date:** 2026-09-04  
**Objective:** Implementar la interfaz visual de todas las pantallas del MVP de Arcade Vault con navegación libre entre ellas.

## Scope

**In:**

- Convertir los 5 templates JSX existentes a componentes/páginas funcionales en Next.js 13+:
  - Autenticación (login)
  - Biblioteca (listado de juegos/contenido)
  - Salón (selección de juego)
  - Detalle (información del juego)
  - Reproductor (player/visualizador)
- Implementar barra de navegación global que permite navegar libremente entre todas las pantallas
- Crear datos mockeados para que cada pantalla muestre contenido de ejemplo
- Usar Tailwind CSS para estilos (excepto componentes base que usan global styles)
- Layout compartido con nav component

**Out:**

- Autenticación real (validación de credenciales, sesiones, persistencia de login)
- Lógica de juegos o interactividad de videojuegos
- Rutas dinámicas o parámetros en URL
- Base de datos o persistencia
- Testing

## Data Model

Datos mockeados como constantes/fixtures:

```typescript
// Juegos
const games = [
  { id: 1, title: "Pac-Man", genre: "Arcade", year: 1980 },
  { id: 2, title: "Space Invaders", genre: "Arcade", year: 1978 },
  // ...
];

// Salas (grupos de juegos)
const rooms = [
  { id: 1, name: "Clásicos 80s", gameCount: 12 },
  { id: 2, name: "Maquinitas", gameCount: 8 },
  // ...
];
```

## Implementation Plan

1. Crear estructura de app directory en Next.js:
   - `app/layout.tsx` (layout global con nav)
   - `app/auth/page.tsx`
   - `app/biblioteca/page.tsx`
   - `app/salon/page.tsx`
   - `app/detalle/page.tsx`
   - `app/reproductor/page.tsx`

2. Crear componente `Nav.tsx` que lista todas las rutas y permite navegar entre ellas

3. Convertir cada template JSX a componente/página:
   - Extraer JSX del template
   - Adaptar a TypeScript/TSX
   - Reemplazar estilos CSS con Tailwind
   - Insertar datos mockeados

4. Crear archivo de datos mockeados (`data/mockData.ts`) que export constantes de juegos/salas/contenido

5. Verificar que todas las rutas sean accesibles desde la nav y funcionen sin errores

## Acceptance Criteria

- [ ] Estructura de Next.js 13+ (app directory) está creada
- [ ] Existen 5 páginas funcionales (auth, biblioteca, salon, detalle, reproductor)
- [ ] Nav component permite navegar a todas las pantallas sin errores
- [ ] Cada pantalla renderiza con datos mockeados
- [ ] No hay errores en consola
- [ ] Estilos usan Tailwind (excepto componentes base con global styles)
- [ ] Se puede acceder a cualquier ruta desde cualquier otra
- [ ] `npm run dev` inicia sin problemas y app carga correctamente

## Decisions Taken and Discarded

- **Next.js 13+ app directory over pages directory**: Proyecto ya usa esta estructura, mantener consistencia.
- **Tailwind sobre CSS puro**: Especificado en briefing, más mantenible.
- **Sin autenticación real**: Reducir scope a visual puro, no incluir lógica de auth.
- **Rutas estáticas, no dinámicas**: Simplificar MVP, cada pantalla es una ruta fija.

## Identified Risks

- Templates existentes (JSX) pueden usar una versión antigua de React o sintaxis incompatible con React 19 — verificar compatibilidad al convertir.
- Datos mockeados pueden no ser suficientemente realistas — confirmar que son adecuados durante implementación.
