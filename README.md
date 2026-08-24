# WEB RESTAURACIÓN PREMIUM DINÁMICA

## CLASE 04 — Restaurant Studio Platform

Clase 04 corrige el principal fallo de Clase 03: el Studio era un mini editor y no una plataforma real de personalización.

La web mantiene el **Orbital Menu 2.5D** de Clase 03, pero ahora separa claramente:

```text
ENGINE
CONTENT
MEDIA
PROJECT STATE
```

El objetivo ya no es editar LÚMINA. El objetivo es demostrar que el mismo motor puede convertirse en otro restaurante sin tocar código.

## Qué incorpora Clase 04

### Restaurant Studio real

El panel se reorganiza en:

- Marca
- Contenido
- Media
- Platos
- Visita
- Proyecto

Cada zona explica qué parte de la web modifica y ofrece accesos directos de preview.

### Marca

- nombre del restaurante
- logo / wordmark
- color acento
- fondo oscuro
- fondo editorial

### Contenido

Los textos principales dejan de ser fuente de verdad en HTML y pasan a `class4-config.js`.

Se editan Hero, Philosophy, Origin, Atmosphere, Chef, reserva y footer.

### Media slots

Las secciones editoriales admiten imagen o vídeo:

- Hero
- Origin
- Atmosphere
- Chef

Cada slot incluye descripción de uso, preview y formato recomendado.

El menú orbital mantiene imágenes 1:1 para preservar el contrato visual 2.5D: mismo encuadre, distancia, perspectiva y fondo oscuro.

### Gestor de platos

- añadir
- duplicar
- reordenar
- ocultar
- eliminar
- sustituir imagen
- editar ficha gastronómica completa

Campos: nombre, meta, descripción, precio, ingredientes, origen, técnica, maridaje, alérgenos y chef note.

### Persistencia

Clase 03 usaba `localStorage`. Clase 04 usa IndexedDB:

- store `projects`
- store `media`

Los archivos se guardan como Blob/File y se rehidratan al volver a abrir el proyecto.

También existen:

- autosave
- Undo / Redo
- import JSON
- export JSON
- reset
- preview desktop/tablet/mobile

### Segundo restaurante de prueba

`presets/NAMI-CLASS04.json`

Importar este archivo desde **Studio → Proyecto → Importar JSON** transforma marca, copy, paleta, carta, contacto y narrativa sin modificar código.

Éste es el examen principal de Clase 04.

## Arquitectura

```text
/
├── index.html
├── styles-v3.css
├── styles-v4.css
├── styles-v4-fixes.css
├── class4-config.js
├── class4-store.js
├── app-v4.js
├── presets/
│   └── NAMI-CLASS04.json
├── scripts/
│   └── class4-static-check.mjs
├── docs/
│   ├── CLASS-04-RESTAURANT-STUDIO.md
│   ├── CLASS-04-ERRORS-SOLUTIONS.md
│   ├── CLASS-03-ORBITAL-PREMIUM.md
│   └── CLASS-03-ERRORS-SOLUTIONS.md
└── .github/workflows/
    ├── class4-smoke.yml
    └── pages.yml
```

## QA de Clase 04

El workflow `Class 04 smoke checks` comprueba:

- sintaxis JavaScript
- IDs críticos de Studio y Orbital Menu
- contratos de media slots
- validez JSON del preset NAMI

La validación visual sigue siendo obligatoria antes de declarar la clase cerrada.

## Qué queda para Clase 05

Clase 04 prioriza producto y personalización. Clase 05 será la **Motion Direction premium**:

- apertura cinematográfica
- reveals diferentes por sección
- zoom/focal hover
- transiciones entre secciones
- cursor contextual completo
- coreografía de entrada del Orbital Menu
- presets de intensidad de movimiento

## Qué queda para Clase 06

- QA final cross-browser/device
- performance
- SEO estructurado
- publicación validada
- evolución hacia backend remoto multiusuario si procede

## Historia del curso

- Clase 01 — lectura y reconstrucción del componente visual
- Clase 02 — integración en web completa
- Clase 03 — Orbital Menu, 2.5D y fichas inmersivas
- **Clase 04 — plataforma editable / Restaurant Studio**
- Clase 05 — Motion Direction premium
- Clase 06 — QA, producto y publicación

LÚMINA sigue siendo una marca docente. El activo real es el **Restaurant Experience Engine + Restaurant Studio**.
