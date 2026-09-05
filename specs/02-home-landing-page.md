# Spec 02: Home page como landing page de Arcade Vault

**State:** Implemented  
**Date:** 2026-09-05  
**Depends on:** Spec 01 (Pantallas visuales del MVP)  
**Objective:** Implementar la home page como landing page en la raíz `/` de la aplicación, siguiendo el template visual de referencia con datos mockeados.

## Scope

**In:**

- Convertir el template `home.jsx` a componente funcional `app/page.tsx` en Next.js 13+
- Implementar todas las secciones del template:
  - Hero con eyebrow, título de 3 líneas, subtítulo y CTAs
  - Floating silhouettes (decorativas, SVG pixeladas)
  - Sección "¿Por qué Arcade Vault?" con 4 feature cards
  - Sección "Juegos disponibles ahora" con preview de 6 juegos
  - Sección stats (12+ juegos, miles de partidas, ranking global)
  - Sección "Actividad en vivo" con últimas puntuaciones y top 5 jugadores
  - Sección pricing (plan único JUGADOR VAULT)
  - CTA final "¿Listo para jugar?"
- Usar datos mockeados (juegos, leaderboards, actividad reciente)
- Reutilizar componente `Nav` del Spec 01 con navegación a home activa
- Usar Tailwind CSS para estilos (excepto animaciones complejas que pueden usar CSS global)
- Hacer la página responsiva (mobile-first)

**Out:**

- Funcionalidad interactiva real (las CTAs navegan pero sin backend)
- Sistema de leaderboards persistente (solo visual mock)
- Validación o procesamiento de datos
- Testing

## Data Model

Datos mockeados como constantes:

```typescript
// Juegos para preview (6 primeros)
const games = [
  { id: 1, title: "Caída", cat: "Arcade", cover: "cover-bricks" },
  { id: 2, title: "Glotón", cat: "Puzzle", cover: "cover-tetro" },
  // ... (6 total)
];

// Stats
const stats = [
  { n: "12+", u: "JUEGOS", s: "Y CONTANDO" },
  { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA" },
  { n: "GLOBAL", u: "RANKING", s: "COMPITE CON EL MUNDO" },
];

// Actividad en vivo (últimas puntuaciones)
const recentScores = [
  { p: "NEONFOX", g: "Caída", s: 184220, t: "hace 2 min", c: "magenta" },
  // ... (7 total)
];

// Top 5 jugadores hoy
const topPlayers = [
  { r: 1, p: "NEONFOX", s: 312840 },
  // ... (5 total)
];
```

## Implementation Plan

1. Crear archivo `app/page.tsx` que será la nueva home page en raíz `/`

2. Copiar datos mockeados del template a una constante en el mismo archivo (o en `lib/mockData.ts` si prefieres reutilizarlos en otras páginas)

3. Extraer componentes del template:
   - `FloatingSilhouettes` - SVG decorativas con animaciones
   - `MiniCard` - tarjeta pequeña de juego
   - `FeatureIcon` - iconos pixel de features
   - Home page principal con todas las secciones

4. Adaptar el JSX del template a TypeScript/TSX, mantener estructura HTML igual

5. Importar estilos globales (`styles.css`) que ya existen en el proyecto

6. Usar Tailwind CSS para estilos de layout (grid, flexbox, espaciado)

7. Para animaciones complejas (reveal, floating, bounce):
   - Reutilizar clases CSS del template (`reveal`, `float`, `bounce`, etc.)
   - O usar módulos CSS locales si prefieres aislamiento
   - Las animaciones son nice-to-have, pueden simplificarse si es necesario

8. Importar y usar componente `Nav` en un layout compartido (si no existe, crear `app/layout.tsx`)

9. Asegurar que nav detecte route activa como "home"

10. Verificar en navegador que todas las secciones renderizan correctamente y CTA navegan

## Acceptance Criteria

- [ ] Archivo `app/page.tsx` existe y renderiza sin errores
- [ ] Home page es accesible en raíz `/`
- [ ] Todas las 8 secciones (hero, features, preview de juegos, stats, actividad, pricing, final CTA) se renderizan visualmente
- [ ] Datos mockeados cargan correctamente (juegos, leaderboards, stats)
- [ ] Responsivo en mobile (< 640px), tablet (640-1024px) y desktop (> 1024px)
- [ ] Nav muestra ruta activa como "Inicio"
- [ ] Botones CTA navegan a rutas esperadas (biblioteca, auth, etc.)
- [ ] Estilos coinciden con template de referencia (colores neon, tipografía pixel, glow effects)
- [ ] Sin errores en consola
- [ ] `npm run dev` inicia correctamente

## Decisions Taken and Discarded

- **Datos mockeados en lugar de API real**: Reducir scope, mantener MVPfocusado en visual. Datos pueden vincularse a backend después.
- **Reutilizar Nav del Spec 01**: Consistencia de UI y evitar duplicación. Nav ya está hecha y funciona.
- **Animaciones como nice-to-have**: Algunas animaciones del template son complejas (IntersectionObserver para reveal, floating con delays). Si toman mucho tiempo, pueden quitarse sin quebrar funcionalidad core.
- **Tailwind CSS + global styles**: Mantener consistencia con stack del proyecto. Global styles para efectos especiales (scanlines, grid perspectiva, etc.).
- **Reemplazar home en `/` en lugar de nueva ruta**: El template está diseñado como landing, la raíz es el lugar natural. Pantallas del MVP se siguen accediendo desde nav.

## Identified Risks

- Template usa `React` global (CDN). Next.js/React 19 puede no ser compatible con toda la sintaxis. Necesita adaptación cuidadosa.
- Animaciones IntersectionObserver (reveal) pueden no dispararse en desarrollo si viewport no es suficiente grande. Probar en diferentes resoluciones.
- Datos mockeados hardcoded pueden crecer bastante (7 scores + 5 players + 6 games). Considerar exportar a archivo separado si se vuelve inmanejable.
- CSS global del template puede colisionar con estilos de otras páginas. Usar module CSS o verificar selectores.
