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

## Asset policy — revisión visual real

El fixture ya no usa `ASIATICO 1.png` ni imágenes externas del repo Starbucks.

Se inventariaron y renderizaron con Playwright los once archivos `HELADO *.jpg` existentes en `assets/half-orbit/dishes-transparent/`. Todos cargan correctamente y son 360×360. La revisión visual los separa en tres familias de cámara:

- **Bowls / producto + envase, 3/4 frontal:** `HELADO 1.jpg`, `HELADO 2.jpg`, `HELADO 3.jpg`, `HELADO 4.jpg`.
- **Single cups, frontal:** `HELADO 11.jpg`, `HELADO 12.jpg`, `HELADO 13.jpg`, `HELADO 17.jpg`.
- **Paired cups, sostenidos por manos:** `HELADO 8.jpg`, `HELADO 15.jpg`, `HELADO 18.jpg`.

El selector principal usa sólo **HELADO 1–4** porque forman la familia visual más homogénea. Los once assets permanecen catalogados en `RestaurantBeveragesReview.allAssets` y sus familias en `RestaurantBeveragesReview.families`; no se descarta ningún upload.

## Fix de Scroll Traveler evidence

El producto moderno deja `scrollTraveler.enabled=false` por defecto. `tests/class14-scroll-traveler-e2e.mjs` ya conoce este contrato: espera las APIs, activa la capability y después espera `data-scroll-traveler=ready`.

`tests/capture-scroll-traveler.mjs` hacía lo contrario: esperaba `ready` sin activar Traveler, generando el timeout que dejó rojo el workflow Motion. Esta rama alinea el capturador con el E2E canónico; no modifica `class14-scroll-traveler.js`.

## Playwright gate

`tests/class25-beverage-e2e.mjs` comprueba en desktop, mobile y reduced motion:

- un solo `header.topbar`;
- un solo `#studio`;
- `#beverages` visible en `?review=beverages`;
- los cuatro assets seleccionados son locales y cargan;
- los once `HELADO` están inventariados;
- selector y mundo cromático cambian en cada producto;
- transición termina correctamente;
- `Bebidas` y `Motion` son pestañas distintas;
- Motion Governance agrupa `preset`, `page` y `experience`;
- Scroll Traveler sigue como tuner transversal único;
- Half Orbit sigue cargado;
- Motion Library conserva sus 12 motores existentes;
- no hay overflow móvil ni errores JS.

`tests/class25-helado-inventory.mjs` genera además `helados-contact-sheet.png` y `inventory.json` como evidencia de curación visual.

El workflow guarda screenshots de desktop, Studio, móvil y la hoja de inventario como artifact.