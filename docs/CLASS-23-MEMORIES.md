# CLASS 23 — MEMORIES ENGINE + MEMORIES STUDIO

**Estado:** READY FOR HUMAN VISUAL REVIEW · **MERGED: NO**
**Rama:** `feat/memories-engine-studio` · **Base:** `origin/main` con Fase 1C ya integrada

Fase 2 entra como capacidad completa del producto, no como un LAB bonito que después
habría que integrar:

```
PROJECT STATE  →  MEMORIES STUDIO  →  MEDIA COMPARTIDA  →  MEMORIES ENGINE  →  WEB PÚBLICA
```

Un dominio de datos, tres presentaciones. **Cambiar de preset no cambia los datos.**

## Project State

`modules.memories` — la ubicación que el roadmap reservaba.

```js
modules.memories = {
  enabled: false,                       // apagado por defecto
  preset: 'cinematic-memory-wall',      // | 'memory-stack' | 'editorial-journal'
  eyebrow: 'Memoria',
  title:   'Lo que ha pasado en esta casa',
  intro:   '',
  items: []                             // vacío: el proyecto base no afirma nada
}
```

Cada recuerdo:

```js
{
  id, enabled, type,                    // memory | event | testimonial | press | milestone
  title, text, author, date, place,
  rating,                               // null = sin valoración; 0 no pinta estrellas
  link,                                 // sólo http/https; cualquier otra cosa se ignora
  featured,                             // jerarquía visual real, no una etiqueta
  visualWeight,                         // hero | medium | small
  media: [{id, kind:'image'|'video', ref, alt}]
}
```

**El `type` es DATA**, no una rama de arquitectura: no hay cinco sistemas, hay un modelo
con un campo. Un campo vacío no se rellena — no se pinta.

### El detalle de orden de carga que casi obligó a inventar otro sitio

`class20-modules-studio.js` **asigna** `RestaurantDefaults.modules = {…}` (no fusiona) y
se carga antes de `app-v4.js`, que clona la plantilla en su copia de trabajo. Así que
declarar `modules.memories` en `class4-config.js` no serviría —class20 lo borra— y
declararlo desde el runtime llega tarde para la copia de trabajo.

`class23-memories-model.js` hace las dos cosas: añade el modelo a la **plantilla** y
**siembra** la rama en el proyecto vivo si falta, escribiendo por referencia sobre el
objeto que devuelve `RestaurantStudioConfig.get('modules')`. Es una migración de
esquema, no una edición: no entra en el historial de Undo ni marca el proyecto como
sucio. Las ediciones reales pasan todas por `set`.

## Media

**Una sola Media Library.** El almacén sigue siendo `RestaurantStore` (IndexedDB
`restaurant-premium-studio` v3, con fallback a Cache Storage). Memories no crea
IndexedDB, ni localStorage, ni Cache, ni almacén de subidas propio — el gate lo
comprueba.

Lo que faltaba y se ha añadido, **compartido desde el primer día**:

| | |
|---|---|
| `restaurant-media.js` → `RestaurantMedia` | capa de RESOLUCIÓN sobre `RestaurantStore`: `save` `load` `url` `list` `revoke` `forget`. No guarda nada por su cuenta |
| `restaurant-media-picker.js` → `RestaurantMediaPicker` | el selector de Media Library que el producto **no tenía** (el Studio sólo subía a slots fijos, sin forma de elegir un asset ya subido) |

Se llaman `Restaurant*` y no `Memories*` a propósito: **Beverages los usará en Fase 3
sin tocarlos**, y `RestaurantMedia` es el único punto donde Cloud Media tendrá que
sustituir al proveedor.

De paso, `window.RestaurantMediaResolve` —que `class22-experience-shell.js` ya llamaba
con `?.` y **no existía**, cayendo siempre al fallback— ahora existe.

### La referencia de media

El Project State **nunca** guarda un `blob:`, un object URL, una ruta de disco ni un
`File`. Guarda una referencia lógica, estable y legible:

```
project/memories/<itemId>/<mediaId>
```

Se compone del dominio, no del almacén: si mañana el proveedor es remoto, la misma
cadena sigue identificando el asset. Al eliminar un recuerdo la referencia se
**desvincula**; el asset **no** se borra, porque Undo tiene que poder devolver el
recuerdo con su media puesta. La limpieza de huérfanos es otra responsabilidad.

## Studio

El **mismo** Restaurant Studio, una pestaña más — sin segundo Studio, sin popup, sin LAB,
sin editor en iframe. ON/OFF, preset, cabecera de sección, y por recuerdo: título,
historia, autor, fecha, lugar, tipo, valoración, enlace, `featured`, peso visual, subir
imagen, subir vídeo, elegir de la Media Library, quitar referencia, texto alternativo,
`↑ Subir` / `↓ Bajar`, eliminar. Preview inmediato: se escribe en el Project State en el
mismo evento que los controles nativos.

**Mostrar el panel es cosa de Class 23, y no por gusto:** `app-v4.js` asigna el
`onclick` de las pestañas UNA vez, en `bindStudio()`, recorriendo las que existen en ese
momento. Class 20 se salva porque `index.html` la carga antes de app-v4; Class 23 se
carga después, de forma aditiva, así que su pestaña nunca pasaría por ese enlazado y el
panel se construiría sin llegar a verse. Se replica el mismo contrato de DOM del Studio
—`.active` en la pestaña, `hidden` en los paneles— en vez de inventar otra mecánica.

El panel se construye **perezosamente**, en el primer click: Class 19 provocó una carrera
de restauración de preset por construirse con el cajón cerrado.

### Reordenar

El orden **es** data: `modules.memories.items[]`. `↑ Subir` / `↓ Bajar` son la vía
accesible y la única obligatoria; se escribe el array completo, así que cada operación
es UNA entrada de historial y Undo devuelve el recuerdo entero, con sus referencias.

## Presets

Un solo motor (`class23-memories-engine.js`) y tres renderers. Los tres reciben los
mismos ítems y ninguno guarda nada propio.

**01 · Cinematic Memory Wall** — pared editorial asimétrica sobre doce columnas. El peso
visual manda: `hero` toma el momento grande, `medium` acompaña, `small` respira.
`featured` se compone como la apertura de un reportaje: titular a todo el ancho e
historia en columna de lectura, con el resto del ancho como espacio negativo deliberado.
El ritmo sale del dato y de la posición: nada aleatorio, así que la pared se ve igual en
cada carga.

**02 · Memory Stack** — recuerdos apilados con un solo `focus` (un segundo índice que
pueda discrepar con la pantalla es el bug que ya costó dos fases). Los vecinos asoman con
profundidad y desaturación. Botones y teclado son la vía principal; el arrastre es un
extra de desktop. **La rueda no se toca**: cero scroll hijacking.

**03 · Editorial Journal** — cronología con voz de revista: fecha y lugar como
entradilla, media grande y ritmo alternado. El orden lo sigue mandando el proyecto: una
fecha sirve para leerla, no para reordenar a espaldas del restaurante.

### El recuerdo ampliado

Un recuerdo con historia larga (más de 180 caracteres) ofrece `Leer el recuerdo`, que
abre su texto completo en una capa propia con Escape y devolución de foco. **No es un
segundo Product Detail**: no hay contrato de producto, ni adaptadores, ni catálogo — es
el texto largo del mismo recuerdo.

## Vídeo

Primera clase desde esta fase, y con reglas:

- `<video playsinline preload="metadata">`, siempre `muted`: nunca audio automático;
- **nunca todos a la vez**: un `IntersectionObserver` reproduce el que está realmente
  visible (>55%) y pausa el resto;
- pausa fuera del viewport, con el documento oculto (`visibilitychange`) y al apagar
  Memories;
- con `prefers-reduced-motion` **no arranca solo**;
- los object URLs se revocan al desmontar.

## Público

La sección entra **antes de `#visit`**: la memoria cierra el relato justo antes de la
invitación a reservar. Queda `… chef → MEMORIES → visit → location → footer`.

### Scroll Traveler

Su ruta ancla en `.chef-section` y `#visit`, y Memories entra justo en medio, así que el
objeto sobrevuela la sección. **Project 09 no se rediseña.** `styles-v14.css` documenta
el contrato de capas y Memories se suma a él: sus marcos de media viajan en la escala del
viajero (3) y su **texto va por encima incluso de `front` (61 < 120, la cabecera del
sitio sigue ganando)**. El objeto sigue cruzando la sección por encima de las fotos —
donde no hay nada que leer— y nunca por encima de una palabra.

Eso se descubrió **mirando la captura**, no con un test: `layer` es un estado discreto
que cambia en el punto medio del segmento, y durante la primera mitad de la sección el
viajero viajaba en `front` y tapaba la historia.

## OFF

`enabled:false` significa: cero sección, cero espacio, cero vídeo, cero observers, cero
trabajo de render. Desmontar el nodo **es** el teardown. Medido: la página pasa de 10 386
a 7 120 px de alto.

## Persistencia · Undo/Redo · Import/Export

Todo pasa por `RestaurantStudioConfig` y el Project State actual: autosave existente,
recarga con el mismo estado y las mismas referencias, y Undo/Redo sobre el historial de
la casa — **sin history propia**. El export del proyecto incluye `modules.memories` con
sus `mediaRef`.

## Ficheros

**Nuevos:** `class23-memories-model.js` · `class23-memories-engine.js` ·
`class23-memories-studio.js` · `restaurant-media.js` · `restaurant-media-picker.js` ·
`styles-v23.css` · `tests/class23-memories-e2e.mjs` · `tests/memories-fixtures.mjs` ·
`tests/capture-class23-live.mjs` · `docs/CLASS-23-MEMORIES-AUDIT.md` · este documento.
**Modificado:** `class4-runtime-guard.js` (una cadena de carga aditiva).
**`index.html` no se toca**, como en Class 21 y Class 22.

## Gate

`tests/class23-memories-e2e.mjs` — **39/39 · MEMORIES_PASS**. Cubre los 35 puntos de la
misión. La media de los tests es real: la imagen sale de un asset del repositorio y el
vídeo se **genera** con MediaRecorder, así que la subida se recorre de verdad.

Dos defectos que salieron de MIRAR el resultado, no de un test en rojo:

1. **El marco del Stack desbordaba su fila.** Con `grid-template-rows:auto 1fr` en una
   tarjeta de altura fija, un marco con `aspect-ratio` reclamaba 349 px en una fila de
   260 y el título aparecía **encima de la foto**. Cada rect era correcto por separado.
2. **Una resolución de media fallida se cacheaba para siempre**, así que un asset que
   aparecía después —recién subido, o con el almacén aún hidratando— no se volvía a
   intentar y su recuerdo se quedaba sin media hasta recargar.

## Limitaciones honestas

- **La media local no viaja entre ordenadores.** Los assets viven en el IndexedDB del
  navegador; el export lleva las **referencias**, no los bytes. En otro ordenador esas
  refs no resuelven y el recuerdo se pinta sin media (no roto: se salta). **Cross-computer
  NO está terminado**, y la capa Cloud es la que lo cierra.
- **Project State remoto y Media Library remota siguen pendientes**, y siguen siendo
  obligatorios para V1. **La Platform Layer no está terminada.**
- Una celda compone con la **primera** media que resuelve; las refs extra se conservan en
  el dato para una galería futura.
- **Studio desktop-first**: no se ha hecho paridad móvil del editor, y no se ha tomado
  ninguna decisión que la impida. La web pública **sí** es responsive (smoke real a
  390 px en el gate).
- Los *optional material artifacts* (lenguaje de papel/herencia) del roadmap **no** entran
  aquí: encajarían como detalle de presentación dentro de este mismo motor, y se dejan
  como polish posterior para no arriesgar el cierre de la fase.
