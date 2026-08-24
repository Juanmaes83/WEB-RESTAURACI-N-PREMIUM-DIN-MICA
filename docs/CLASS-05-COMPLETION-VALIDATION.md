# CLASE 05 — COMPLETION & VALIDATION

## Estado

**Implementación completa en rama `class5-final-studio-motion`.**

La Clase 05 conserva la plataforma editable de Clase 04 y añade una capa configurable de Motion Direction Premium.

Contrato cumplido:

`CLASE 05 = CLASE 04 APROBADA + MOTION DIRECTION PREMIUM`

## 1. Studio Motion

Se añade una pestaña **Motion** al Restaurant Studio sin convertir el panel en una herramienta técnica de animación.

Los ajustes se guardan como configuración de proyecto mediante el mismo sistema `data-path` y persistencia de Clase 04.

### Orbital Menu

Selector por proyecto:

- `Elegant Orbit`
- `Urban Acrobatics`

No existe configuración por plato individual.

### Text reveal

Presets seguros por sección:

- Hero: Cinematic / Mask / Soft Rise / Reduced
- Philosophy: Line Reveal / Mask / Soft Rise / Reduced
- Origin: Soft Rise / Mask / Editorial / Reduced
- Atmosphere: Editorial / Mask / Soft Rise / Reduced
- Chef: Mask / Editorial / Soft Rise / Reduced
- Visit: Editorial Rise / Mask / Reduced

### Media motion

- Hero: Cinematic / Slow Zoom / Still
- Origin: Parallax / Mask Reveal / Still
- Atmosphere: Slow Zoom / Cinematic / Still
- Chef: Parallax / Mask Reveal / Still

Cada bloque dispone de **Probar** para reproducir/visitar la sección correspondiente.

## 2. Elegant Orbit

La opción Elegant recupera la coreografía aprobada y archivada previamente:

- soloist con lift + twist + overshoot contenido;
- outgoing que cede el escenario;
- ensemble wave sutil;
- copy accent;
- respiración del plato central.

La geometría orbital de Clase 04 permanece intacta.

## 3. Urban Acrobatics

La opción Urban conserva la coreografía validada V5:

- Outgoing Lead;
- Ensemble beat;
- Feature Dancer;
- Triple Spin 1080°;
- Reverse Sweep;
- Air Turn;
- Soloist pull-back;
- ataque frontal;
- hard brake elegante;
- hero hold;
- recoil sincronizado del resto de platos;
- recuperación de formación;
- protagonista mantiene jerarquía final.

## 4. Motion Director

`class5-motion-director.js` gobierna:

- reveals configurables;
- media motion configurable;
- replay desde Studio;
- hover premium;
- cursor contextual;
- ScrollTrigger de entrada;
- amplitudes reducidas en viewport móvil;
- `prefers-reduced-motion`.

La capa Motion no es fuente de verdad del contenido ni de persistencia.

## 5. Accesibilidad / Reduced Motion

Con `prefers-reduced-motion: reduce`:

- se eliminan animaciones no esenciales;
- el contenido continúa visible;
- Studio sigue operativo;
- Orbital Menu sigue navegable;
- reserva y resto de experiencia funcional permanecen disponibles.

## 6. Validación automática

Workflow: `.github/workflows/class5-orbital.yml`

Test: `tests/class5-complete-e2e.mjs`

Chromium real valida:

1. Studio abre y cierra.
2. Pestaña Motion existe.
3. Elegant es el preset por defecto.
4. Elegant posee la interacción Orbital cuando está seleccionado.
5. Cambio a Urban funciona en runtime.
6. Text reveal preset cambia en runtime.
7. Media motion preset cambia en runtime.
8. Urban mantiene su trayectoria aprobada.
9. Motion se guarda a nivel de proyecto.
10. Urban + text + media se restauran tras reload.
11. Reduced Motion conserva navegación Orbital.
12. No aparecen errores de página/consola en la prueba.

### Métricas del run aprobado

- muestras de animación: `61`
- pull-back protagonista: `0.6603`
- zoom-in protagonista: `1.4200`
- feature dancer energy: `53.20`
- recoil: `5/5` platos secundarios
- persistencia: `urban + text + media` PASS
- reduced motion navigation: `01 / 06 -> 02 / 06` PASS

Resultado:

`CLASS5_COMPLETE_E2E_PASS`

## 7. Archivos principales

- `class5-studio-motion.js`
- `class5-motion-director.js`
- `class5-elegant-orbit.js`
- `class5-urban-harmony.js`
- `styles-v5.css`
- `tests/class5-complete-e2e.mjs`

## 8. Regla de arquitectura

El usuario elige **lenguajes diseñados**, no parámetros de animación.

No se exponen grados, easing, duración, escalas ni delays dentro de Studio.

La configuración pertenece al proyecto completo.

## 9. Puerta a Clase 06

Después de aprobación visual y merge, Clase 06 puede concentrarse en:

- QA exhaustivo;
- responsive final;
- performance final;
- accesibilidad final;
- SEO/schema;
- publicación estable;
- prueba de un segundo restaurante;
- documentación de producto final.
