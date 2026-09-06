# Spec 04: Integración de Supabase con Next.js

**State:** Implemented  
**Date:** 2026-09-05  
**Objective:** Integrar el cliente de Supabase en el proyecto Next.js para habilitar conexión a la base de datos.

## Scope

**In:**

- Instalar dependencias de Supabase: `@supabase/supabase-js` y `@supabase/ssr`
- Configurar variables de entorno (`.env.local`) con credenciales de Supabase
- Crear cliente de Supabase para el navegador (`lib/supabase/client.ts`)
- Crear cliente de Supabase para el servidor (`lib/supabase/server.ts`)
- Exportar clientes desde un punto central (`lib/supabase/index.ts`)
- Verificar conexión exitosa desde la aplicación

**Out:**

- Middleware de sesiones
- Autenticación de usuarios
- Tablas de base de datos
- Realtime o edge functions
- Testing
- Integración con features existentes

## Data Model

No se introduce modelo de datos. Este spec solo configura la infraestructura de conexión a Supabase.

## Implementation Plan

1. Instalar dependencias:

   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```

2. Configurar archivo `.env.local` con las credenciales del proyecto Supabase:
   - Copiar desde `.env.example` si no existe `.env.local`
   - Llenar `NEXT_PUBLIC_SUPABASE_URL` (URL del proyecto Supabase)
   - Llenar `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave anónima pública)

3. Crear archivo `lib/supabase/client.ts`:
   - Exportar función que crea cliente de Supabase para el navegador (Client Components)
   - Usar `createClient` de `@supabase/supabase-js`
   - Leer `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` de variables de entorno

4. Crear archivo `lib/supabase/server.ts`:
   - Exportar función que crea cliente de Supabase para Server Components
   - Usar helpers de `@supabase/ssr`
   - Leer URLs y claves de variables de entorno

5. Crear archivo `lib/supabase/index.ts`:
   - Exportar cliente del navegador desde `./client`
   - Exportar cliente del servidor desde `./server`
   - Punto central de importación para toda la aplicación

6. Verificar que no hay errores al inicializar:
   - Ejecutar `npm run dev`
   - Abrir la app en navegador
   - Verificar en consola que no hay errores de conexión a Supabase
   - Verificar que la aplicación carga correctamente

## Acceptance Criteria

- [x] Dependencias `@supabase/supabase-js` y `@supabase/ssr` están instaladas en `package.json`
- [x] Archivo `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con valores válidos
- [x] Archivo `lib/supabase/client.ts` existe y exporta cliente de Supabase para navegador
- [x] Archivo `lib/supabase/server.ts` existe y exporta cliente de Supabase para servidor
- [x] Archivo `lib/supabase/index.ts` existe y exporta ambos clientes
- [x] `npm run dev` inicia sin errores
- [x] App carga en navegador sin errores de conexión en la consola del navegador
- [x] Cliente de Supabase puede ser importado desde `lib/supabase` en cualquier archivo de la aplicación
- [x] No hay warnings de variables de entorno faltantes

## Decisions Taken and Discarded

- **`@supabase/supabase-js` + `@supabase/ssr` juntos**: Ambas librerías necesarias para soportar Client Components y Server Components en Next.js 13+.
- **Sin middleware de sesiones en este spec**: Se configura en spec futuro si es necesario. Por ahora, solo la conexión base.
- **Variables de entorno públicas (`NEXT_PUBLIC_*`)**: La clave anónima de Supabase es pública por diseño, segura para exponerla en el navegador.
- **Punto central de importación (`lib/supabase/index.ts`)**: Facilita cambios futuros y evita importaciones repetidas de diferentes archivos.

## Identified Risks

- **Credenciales no configuradas**: Si `.env.local` no se llena correctamente, la aplicación no se conectará a Supabase. Mitigación: documentar claves en `.env.example` y verificar en Acceptance Criteria.
- **Variables de entorno expuestas accidentalmente**: Si `.env.local` se commítea a Git. Mitigación: `.env.local` está en `.gitignore` por defecto.
- **Incompatibilidad de versiones**: Supabase actualiza frecuentemente. Mitigación: fijar versiones específicas en `package.json`.
- **Falta de proyecto en Supabase**: Si el usuario no ha creado proyecto en Supabase, las credenciales serán inválidas. Mitigación: documentar en README o guía de setup.
