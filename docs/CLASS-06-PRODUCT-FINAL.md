# CLASE 06 — PRODUCT FINAL + QA + PUBLICACIÓN

## Contrato

`CLASE 06 = CLASE 05 APROBADA + PRODUCTO FINAL`

La rama de trabajo nace del merge aprobado de Clase 05 (`cd5b7224d5d3055facb54eccff5497d4a547d808`). La rama `archive/class-05-approved` permanece congelada.

## Capacidades nuevas

### 1. ES / EN

- selector público `ES | EN`;
- idioma inicial configurable por proyecto;
- persistencia de preferencia de visitante en `localStorage`;
- Hero, Philosophy, Orbital, Origin, Atmosphere, Chef, Visit y ficha de plato bilingües;
- copy bilingüe editable desde Studio;
- `html[lang]`, title, description y schema actualizados por idioma.

### 2. Ficha emocional de plato

El plato protagonista conserva la apertura inmersiva de Clase 04/05 y añade:

- primer plano reforzado;
- storytelling emocional;
- elaboración;
- ingredientes;
- origen;
- técnica;
- maridaje;
- nota del chef;
- alérgenos.

Los seis platos LÚMINA incluyen storytelling ES/EN de demostración. El Studio permite editar la narrativa de cada plato e idioma. Nuevos platos quedan bajo responsabilidad editorial del restaurante.

### 3. Portabilidad: segundo restaurante

`presets/MAREA-CLASS06.json` demuestra que la plataforma puede convertirse en otro restaurante desde el importador existente, sin modificar código.

MAREA incluye:

- marca distinta;
- paleta distinta;
- contenido ES/EN;
- carta distinta;
- storytelling propio;
- configuración de Motion propia.

### 4. SEO / semántica

Runtime de Clase 06 añade:

- canonical;
- alternates ES/EN;
- Open Graph title/description;
- `Restaurant` JSON-LD;
- `inLanguage` dinámico;
- descripción por idioma.

En publicación real las URLs ES/EN deberían convertirse en rutas estables del dominio del cliente; la demo usa `?lang=es|en`.

### 5. Responsive / accesibilidad

- ficha emocional pasa de dos columnas a una en tablet/móvil;
- plato protagonista adapta escala al viewport;
- foco visible en selector de idioma y Studio;
- selector ES/EN usa `aria-pressed`;
- `prefers-reduced-motion` conserva navegación y elimina motion decorativo de Clase 06;
- labels de ficha cambian con el idioma.

## Regresión heredada

Clase 06 no modifica los módulos de coreografía aprobados:

- `class5-elegant-orbit.js`;
- `class5-urban-harmony.js`;
- `class5-motion-director.js`.

El E2E de Clase 06 vuelve a medir el `pull-back` y `zoom-in` del protagonista Urban para impedir regresiones silenciosas.

## QA automatizado

Workflow: `.github/workflows/class6-product.yml`

Test: `tests/class6-product-e2e.mjs`

Debe demostrar:

1. Studio abre y muestra Idiomas & Story;
2. español inicial;
3. cambio público a inglés;
4. storytelling y elaboración visibles;
5. storytelling editable persiste tras reload;
6. Urban mantiene pull-back < 0.80 y zoom-in > 1.30;
7. MAREA se importa sin tocar código;
8. reduced motion conserva teclado/orbital;
9. canonical + hreflang + Restaurant schema existen;
10. cero `pageerror` / console errors.

## Criterio de aprobación

La Clase 06 se considera candidata a producto final cuando:

- CI pasa;
- la demo visual es aprobada;
- Clase 05 no presenta regresiones;
- LÚMINA y el segundo restaurante pueden funcionar desde el mismo Studio.

No fusionar a `main` hasta aprobación visual.
