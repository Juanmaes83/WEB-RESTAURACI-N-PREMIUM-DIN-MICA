# CLASS 25 — BEVERAGE EXPERIENCE

**Base correcta:** `feat/half-orbit-selector` @ `9599ae8c5adc9bba4aa5af9c3dbeb5b32b9d688b`

**Estado:** REVIEW — NO MERGE

## Por qué Class 25

La línea Half Orbit ya usa Class 24 para `Half Orbit Selector` + `Motion Governance`. La primera implementación Beverage salió por error desde `main` y reutilizó el número Class 24. Esta rama corrige ambos problemas: parte del HEAD moderno y usa el siguiente número libre.

## Integración

- un Project State: `beverages`;
- un Restaurant Studio: nueva pestaña `Bebidas` dentro de `#studio`;
- una Media Library: `RestaurantMedia` + `RestaurantMediaPicker`;
- DOM + GSAP; sin React / Next / Zustand / Lenis;
- runtime `mount/refresh/destroy`;
- `?review=beverages` usa la página real, no un HTML reconstruido;
- Half Orbit, Motion Library y Scroll Traveler permanecen intactos y separados.

## Asset policy

El review usa primero el asset local:

`assets/half-orbit/dishes-transparent/ASIATICO 1.png`

Los otros dos productos del fixture son referencias temporales del repo fuente Starbucks únicamente para comparar la transición visual mientras se clasifican visualmente los uploads locales. Cambiar estos fixtures no cambia el motor.

## Fix de Scroll Traveler evidence

El producto moderno deja `scrollTraveler.enabled=false` por defecto. `tests/class14-scroll-traveler-e2e.mjs` ya conoce este contrato: espera las APIs, activa la capability y después espera `data-scroll-traveler=ready`.

`tests/capture-scroll-traveler.mjs` hacía lo contrario: esperaba `ready` sin activar Traveler, generando el timeout que dejó rojo el workflow Motion. Esta rama alinea el capturador con el E2E canónico; no modifica `class14-scroll-traveler.js`.

## Playwright gate

`tests/class25-beverage-e2e.mjs` comprueba en desktop, mobile y reduced motion:

- un solo `header.topbar`;
- un solo `#studio`;
- `#beverages` visible en `?review=beverages`;
- asset local ASIATICO pintado;
- selector y mundo cromático cambian;
- transición termina;
- `Bebidas` y `Motion` son pestañas distintas;
- Scroll Traveler sigue en su grupo transversal;
- Half Orbit sigue cargado;
- Motion Library conserva sus 12 motores existentes;
- no hay overflow móvil ni errores JS.

El workflow guarda screenshots de evidencia como artifact.