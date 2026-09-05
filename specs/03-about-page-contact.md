# Spec 03: About page con formulario de contacto y envío de email

**State:** Approved  
**Date:** 2026-09-05  
**Depends on:** Spec 01 (Pantallas visuales del MVP), Spec 02 (Home page como landing page)  
**Objective:** Implementar la página about con sección de contacto, formulario funcional y envío de emails mediante Resend.

## Scope

**In:**

- Convertir el template `about.jsx` a componente funcional `app/about/page.tsx` en Next.js 13+
- Implementar todas las secciones del template:
  - Hero "Acerca de Arcade Vault" con misión y visión
  - 3 highlight cards (Hecho con ❤️, Juegos en HTML, Proyecto en constante crecimiento)
  - Sección "Contáctanos" con formulario de contacto
  - Formulario con campos: nombre, email, mensaje
- Crear endpoint API `/api/contact` (Server Route) que:
  - Reciba POST con datos del formulario (name, email, message)
  - Valide los datos en servidor
  - Envíe email mediante Resend API usando credentials de `.env.local`
  - Retorne respuesta JSON (success/error)
- Validación en cliente (no vacíos) + validación en servidor (email válido)
- Mostrar animación de éxito tipo "terminal" después de envío exitoso (igual al template)
- Mostrar mensaje genérico de error en caso de fallo (sin exponer detalles técnicos)
- Reutilizar componente `Nav` del Spec 01 con navegación a about activa
- Usar Tailwind CSS para estilos (excepto animaciones complejas que pueden usar CSS global)
- Hacer la página responsiva (mobile-first)

**Out:**

- Persistencia de mensajes (sin guardar en base de datos)
- Confirmación de email real (double opt-in)
- Sistema de tickets o seguimiento
- Autenticación para acceder a la página
- Testing
- Integración con otras secciones de envío (newsletter, etc.)

## Data Model

No se introduce modelo de datos persistente. Los datos del formulario se envían directamente a Resend:

```typescript
// Estructura del formulario (form state)
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

// Estructura del request POST a /api/contact
interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

// Estructura de la respuesta de /api/contact
interface ContactResponse {
  success: boolean;
  message: string; // "Email enviado correctamente" o mensaje de error genérico
}
```

## Implementation Plan

1. Instalar dependencia de Resend (si no está instalada):

   ```bash
   npm install resend
   ```

2. Crear archivo `app/api/contact/route.ts` que:
   - Exporte función `POST`
   - Lea la API key de `process.env.RESEND_API_KEY`
   - Valide que name, email y message no estén vacíos
   - Valide formato de email básico
   - Instancie cliente Resend y envíe email
   - Retorne { success: true, message: "Email enviado correctamente" } en éxito
   - Retorne { success: false, message: "Hubo un problema al enviar tu mensaje" } en error

3. Crear archivo `app/about/page.tsx`:
   - Convertir JSX del template a TypeScript/TSX
   - Mantener estructura HTML igual
   - Reutilizar componentes `HighlightIcon` del template

4. Implementar lógica del formulario en componente About:
   - Estado local para form (name, email, message)
   - Estado para tracking de envío exitoso (sent)
   - Estado para animación de error (shake)
   - Handler `onSubmit` que:
     - Previene default
     - Valida campos en cliente (no vacíos)
     - Si inválido: dispara animación shake y retorna
     - Si válido: hace POST a `/api/contact` con los datos
     - En éxito: muestra terminal-success y limpia formulario
     - En error: muestra mensaje genérico de error

5. Importar y usar componente `Nav` en layout compartido (reutilizar del Spec 01)

6. Asegurar que nav detecta route activa como "about"

7. Copiar estilos globales del template (CSS para animaciones, terminal, highlight cards)
   - Reutilizar clases CSS del template si existen en `styles.css`
   - O crear módulo CSS local `app/about/about.module.css` si es necesario

8. Verificar en navegador que:
   - La página carga sin errores
   - Formulario valida en cliente
   - Envío POST funciona correctamente
   - Email llega a la bandeja configurada en Resend
   - Mensaje de éxito se muestra correctamente
   - Error genérico se muestra en caso de fallo

## Acceptance Criteria

- [ ] Archivo `app/about/page.tsx` existe y renderiza sin errores
- [ ] Página about es accesible en ruta `/about`
- [ ] Sección "Acerca de" se renderiza con hero, misión y 3 highlight cards
- [ ] Sección "Contáctanos" se renderiza con formulario (3 campos: nombre, email, mensaje)
- [ ] Validación en cliente: formulario rechaza envíos con campos vacíos (muestra animación shake)
- [ ] Endpoint `/api/contact` recibe POST y valida datos en servidor
- [ ] Email se envía exitosamente mediante Resend a dirección configurada en `.env.local`
- [ ] Mensaje de éxito (terminal) se muestra después de envío exitoso
- [ ] Botón "Enviar otro mensaje" limpia formulario y vuelve a form vacío
- [ ] En caso de error de Resend: muestra mensaje genérico sin detalles técnicos
- [ ] Responsivo en mobile (< 640px), tablet (640-1024px) y desktop (> 1024px)
- [ ] Nav muestra ruta activa como "about"
- [ ] Estilos coinciden con template de referencia (colores neon, tipografía pixel, animaciones)
- [ ] Sin errores en consola
- [ ] `npm run dev` inicia correctamente y app carga sin problemas

## Decisions Taken and Discarded

- **Resend como servicio de email**: Decisión del usuario. Alternativa rechazada: SendGrid, Mailgun, o servicio local SMTP.
- **Endpoint `/api/contact` en lugar de Server Action**: Más flexible para debugging y testing. Server Actions son una opción futura.
- **Sin persistencia de mensajes**: Reduce scope. Mensajes se pierden después del envío. Base de datos puede agregarse en spec posterior si es necesario.
- **Validación en cliente + servidor**: Mejor UX (feedback inmediato) + seguridad (no confiar solo en cliente).
- **Mensaje de error genérico**: Protege la aplicación, no expone detalles de Resend o configuración.
- **Reutilizar Nav del Spec 01**: Consistencia de UI y evitar duplicación.
- **Animaciones del template**: Mantener reveal con IntersectionObserver, shake en validación fallida, terminal-success como en template.

## Identified Risks

- **API key de Resend expuesta**: Si `.env.local` se commítea accidentalmente. Mitigación: `.env.local` está en `.gitignore`.
- **Rate limiting de Resend**: Si muchos usuarios envían formularios a la vez. Mitigación: Puede agregarse throttling en futuro si es necesario.
- **Email configuration**: La dirección de destino debe estar verificada en Resend. Si no lo está, el envío fallará silenciosamente.
- **IntersectionObserver en development**: Puede no dispararse correctamente en viewport pequeño. Probar en diferentes resoluciones.
- **CSS global del template colisión**: Selectores globales del template pueden afectar otras páginas. Usar módulo CSS local si es necesario.
