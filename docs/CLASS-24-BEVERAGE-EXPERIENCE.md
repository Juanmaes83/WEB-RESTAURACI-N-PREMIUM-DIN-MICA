# CLASS 24 — STARBUCKS → BEVERAGE EXPERIENCE

**Estado:** READY FOR VISUAL REVIEW — NO MERGE

## Objetivo

Convertir el motor visual del repo fuente `Juanmaes83/starbucks` en una capacidad nativa, reutilizable y sin marca del Restaurant Experience Engine.

No se importa Next.js, React, Zustand, Lenis ni la aplicación Starbucks. Se porta la lógica que aporta valor: selector de producto, transición interrumpible latest-wins, mundo cromático por bebida, hero product, precio, copy y atmósfera.

## Arquitectura

```text
Restaurant Project State
  └── beverages
       ├── enabled
       ├── preset
       ├── section copy
       └── items[]
            ├── product data
            ├── media[] refs
            ├── theme
            └── motionPreset
                ↓
RestaurantMedia / RestaurantMediaPicker
                ↓
RestaurantBeveragesEngine
                ↓
Public Beverage Experience
                ↑
Existing Restaurant Studio → tab «Bebidas»
```

Reglas:

- un solo Project State;
- un solo Restaurant Studio;
- una sola Media Library;
- nada de Zustand/localStorage/IndexedDB propio;
- selección activa y transición son runtime y no se persisten;
- `destroy()` elimina la sección y mata el timeline;
- OFF significa nodo ausente;
- imágenes de revisión no se guardan en el proyecto.

## Archivos

- `class24-beverages-model.js` — dominio y contrato de datos.
- `class24-beverages-engine.js` — Dynamic Beverage Selector nativo DOM + GSAP.
- `class24-beverages-studio.js` — panel «Bebidas» dentro del Studio existente.
- `class24-beverages-review.js` — fixture visual sólo con `?beverage-review=1`.
- `styles-v24.css` — producto público + Studio.
- `beverage-review.html` — superficie de revisión frame-free: hidrata directamente el markup del `index.html` canónico y carga su runtime más Class 24, sin modificar todavía el entrypoint productivo. Se evitó iframe porque el preview protegido de Vercel envía `X-Frame-Options: DENY`.

## Review fixture

La revisión reutiliza temporalmente tres imágenes del repo fuente:

- Matcha Fusion
- Vanilla Flow
- Strawberry Cloud

Se registran como referencias lógicas a través de `RestaurantMedia.map()`. El Project State permanece sin contenido demo.

## Gate de aprobación

1. Abrir `beverage-review.html` en el preview de la rama.
2. Ver la nueva sección Beverage Experience dentro de la web real.
3. Cambiar entre las tres bebidas y comprobar transición, theme, precio, copy y selector.
4. Abrir `Studio · Bebidas` desde la barra de review.
5. Confirmar que existe una única pestaña «Bebidas» dentro del Studio existente.
6. En un proyecto no-review: añadir bebida, subir/elegir media, guardar y refrescar.
7. Desactivar la sección: `#beverages` debe desmontarse.
8. React/Next/Zustand/Lenis no deben ser dependencias de esta Class.

## Paso tras aprobación humana

Sólo tras aprobación se añadirá el wiring productivo de Class 24 al `index.html` (carga de model/media/engine/studio) y se mergeará la rama a `main`. La superficie de review puede conservarse como evidencia o moverse a `labs/review` sin convertirse en flujo operativo.