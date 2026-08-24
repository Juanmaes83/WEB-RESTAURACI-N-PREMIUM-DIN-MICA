# CLASE 04 — Restaurant Studio: de demo a plantilla editable

## Objetivo

Corregir el principal fallo de Clase 03: el Studio no podía considerarse un panel de personalización completo. Clase 04 convierte la experiencia orbital en una plantilla de restaurante editable sin tocar HTML o JavaScript.

## Correcciones sobre Clase 03

1. Se elimina el conflicto `transform` CSS + GSAP que podía dejar el drawer fuera de pantalla.
2. La configuración se separa del HTML en `class4-config.js`.
3. La persistencia pasa de un único `localStorage` a IndexedDB mediante `class4-store.js`.
4. Se incorporan media slots explicados por sección.
5. Hero, Origin, Atmosphere y Chef aceptan imagen o vídeo.
6. El menú orbital mantiene imagen 1:1 para preservar coherencia 2.5D.
7. Se exponen todos los campos gastronómicos de la ficha del plato.
8. Los platos pueden añadirse, duplicarse, ocultarse, reordenarse y eliminarse.
9. Se añade autosave, Undo/Redo, import/export JSON y reset de proyecto.
10. Se incorpora preview Desktop / Tablet / Mobile.
11. Se añade un segundo preset (`presets/NAMI-CLASS04.json`) para demostrar que el motor puede cambiar de restaurante sin modificar código.

## Arquitectura

```text
index.html
  ↓
class4-config.js      = contenido / marca / platos / slots
class4-store.js       = IndexedDB proyecto + media
app-v4.js             = render + Studio + órbita + detalle + reserva
styles-v3.css         = base visual Clase 03
styles-v4.css         = Studio y correcciones Clase 04
```

La regla central es:

> ENGINE != CONTENT != MEDIA

## Studio

El panel se organiza en seis áreas.

### 01 · Marca

- nombre del restaurante
- color acento
- fondo oscuro
- fondo editorial
- logo / wordmark

### 02 · Contenido

Edita textos visibles de:

- Hero
- Philosophy
- Origin
- Atmosphere
- Chef

Cada bloque explica dónde aparece y dispone de acceso de preview a la sección.

### 03 · Media

Slots:

- Hero — fondo principal
- Origin — producto/procedencia
- Atmosphere — sala
- Chef — retrato

Cada slot acepta imagen o vídeo, enseña preview y describe el formato recomendado.

### 04 · Platos

- añadir
- duplicar
- subir / bajar orden
- ocultar / mostrar
- eliminar
- sustituir imagen orbital
- editar nombre
- meta
- descripción
- precio
- ingredientes
- origen
- técnica
- maridaje
- alérgenos
- chef note

El uploader del plato recuerda el contrato visual obligatorio: 1:1, plato centrado, misma distancia, misma perspectiva y mismo fondo oscuro.

### 05 · Visita

- kicker
- titular
- CTA
- Booking URL
- dirección
- horario
- contacto
- footer

Si existe Booking URL, los CTA pueden enviar al sistema de reservas externo.

### 06 · Proyecto

- preview desktop/tablet/mobile
- Undo
- Redo
- export JSON
- import JSON
- reset completo
- estado de autosave

## Persistencia

`class4-store.js` utiliza IndexedDB y dos stores:

- `projects`
- `media`

Los archivos subidos se guardan como Blob/File, no como base64 dentro de localStorage. Al recargar, el proyecto vuelve a hidratar sus media locales.

## Prueba de transformación

Se incluye `presets/NAMI-CLASS04.json`.

Procedimiento:

1. Abrir Studio.
2. Ir a Proyecto.
3. Importar `presets/NAMI-CLASS04.json`.
4. La web debe cambiar marca, paleta, hero, relato, platos, reserva y footer sin editar código.
5. El motor orbital debe seguir funcionando.

Esta prueba es el criterio pedagógico principal de Clase 04: si el segundo restaurante requiere cambiar código, la clase no está aprobada.

## Automatización de QA

`.github/workflows/class4-smoke.yml` ejecuta:

- `node --check` sobre el JavaScript de Clase 04
- contrato estático de IDs críticos
- contrato de media slots
- parseo del preset NAMI

## Lo que deliberadamente NO resuelve Clase 04

La clase se centra en plataforma y personalización. La Motion Direction avanzada queda para Clase 05.

Pendiente para Clase 05:

- secuencia cinematográfica de apertura
- reveals diferenciados por sección
- hover zoom y focal displacement
- transición narrativa entre secciones
- cursor contextual completo
- presets de intensidad de movimiento
- coreografía de entrada del Orbital Menu

Pendiente para Clase 06:

- backend remoto multiusuario
- publicación final validada
- SEO estructurado completo
- QA cross-browser/device
- performance final

## Criterios de aprobación Clase 04

- [x] Studio diseñado como builder, no mini editor.
- [x] Configuración separada del HTML.
- [x] Textos principales editables.
- [x] Branding editable.
- [x] Logo sustituible.
- [x] Media slots explicados.
- [x] Imagen y vídeo en secciones editoriales.
- [x] Platos gestionables.
- [x] Ficha gastronómica completamente editable.
- [x] IndexedDB.
- [x] Autosave.
- [x] Undo/Redo.
- [x] Import/export.
- [x] Segundo restaurante importable.
- [x] CI de humo.
- [ ] Validación visual pública antes de fusionar a `main`.
