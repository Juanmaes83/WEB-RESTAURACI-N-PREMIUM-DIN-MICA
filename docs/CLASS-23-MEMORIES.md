# CLASS 23 — MEMORIES ENGINE + MEMORIES STUDIO

**Estado:** READY FOR HUMAN VISUAL REVIEW (tras la RECUPERACIÓN VISUAL) · **MERGED: NO**
**Rama:** `feat/memories-engine-studio` · **Base:** `origin/main` con Fase 1C ya integrada

> **La primera entrega de esta fase fue RECHAZADA en revisión visual humana.** Este
> documento describe el producto después de la recuperación exigida por
> `docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-MISSION.md`. Lo que se conservó: Project State,
> `RestaurantMedia`, `RestaurantMediaPicker`, el Studio, la persistencia, Undo/Redo y la
> Media Library compartida. Lo que se reconstruyó: la multimedia real, el vídeo usable,
> los tres presets y los artefactos materiales. Auditoría de referencias en
> `docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-AUDIT.md`.

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
  artifactStyle,                        // none | paper | cloth  ← TRATAMIENTO material
  media: [{id, kind:'image'|'video', ref, alt}]   // ORDEN = dato; media[0] es la portada
}
```

`artifactStyle` lo elige el restaurante y **nunca** se deduce del `type`: un hito puede
querer papel y una apertura puede querer tela. Cambiar el tratamiento conserva el
recuerdo, sus datos y su media — sólo cambia cómo se presenta.

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

## Multi-media: `firstMedia()` ya no existe

Era el defecto de fondo del rechazo. El modelo admitía `media[]`, pero el runtime pintaba
la **primera** media resoluble y las demás quedaban guardadas e invisibles.

Ahora hay **un visor compartido** —portada + tira navegable— y lo usan los cuatro
destinos, así que **todas** las medias de un recuerdo son alcanzables en todos ellos:

| | cómo se recorren |
|---|---|
| Cinematic Memory Wall | satélites que muerden el borde de la portada + anterior/siguiente |
| Memory Stack | puntos en la tarjeta en foco + anterior/siguiente |
| Editorial Journal | filmstrip bajo el spread |
| Story ampliado | miniaturas, anterior/siguiente y ← → de teclado |

Todas las medias se montan a la vez y se conmuta la activa: el cambio es instantáneo, el
vídeo conserva su posición, y el DOM demuestra —para una persona y para un test— que el
recuerdo tiene más de una. Al cambiar de media, el vídeo anterior se pausa.

El **orden** de `media[]` es dato: `media[0]` es la portada, y «usar como portada» mueve
esa media al índice 0. No hay `primaryMediaId` que pueda discrepar del array. El reorden
de media entra en Undo/Redo como una sola operación.

## Studio

El **mismo** Restaurant Studio, una pestaña más — sin segundo Studio, sin popup, sin LAB,
sin editor en iframe. ON/OFF, preset, cabecera de sección, y por recuerdo: título,
historia, autor, fecha, lugar, tipo, valoración, enlace, `featured`, peso visual,
**tratamiento** (Normal / Papel / Tejido), `↑ Subir` / `↓ Bajar`, eliminar. Preview
inmediato: se escribe en el Project State en el mismo evento que los controles nativos.

**La media se VE en el editor**, que era otra de las carencias: cada archivo aparece con
su miniatura real (fotograma incluido, en el caso del vídeo), su badge IMAGEN/VÍDEO, su
posición, el distintivo PORTADA en el primero, su texto alternativo, y sus controles
`↑` `↓` `Portada` `Quitar`. El vídeo del editor tiene **Play/Pause manual y nunca
autoplay**: se está editando, no viendo la web.

**Mostrar el panel es cosa de Class 23, y no por gusto:** `app-v4.js` asigna el
`onclick` de las pestañas UNA vez, en `bindStudio()`, recorriendo las que existen en ese
momento. Class 20 se salva porque `index.html` la carga antes de app-v4; Class 23 se
carga después, de forma aditiva, así que su pestaña nunca pasaría por ese enlazado y el
panel se construiría sin llegar a verse. Se replica el mismo contrato de DOM del Studio
—`.active` en la pestaña, `hidden` en los paneles— en vez de inventar otra mecánica.

El panel se construye **perezosamente**, en el primer click: Class 19 provocó una carrera
de restauración de preset por construirse con el cajón cerrado.

### Encontrarlo

La entrega anterior se rechazó, entre otras cosas, porque abrir la web real no llevaba a
Memories: la capacidad existía y no se encontraba. Ahora la pestaña se llama
**«Memorias»** —en el idioma del resto del Studio, no `Memories`— y hay tres caminos
hacia ella que no dependen de saber que existe:

- **`[data-mem-entry]` «Memorias del restaurante»** en el panel de Módulos, donde ya se
  buscan las capacidades del proyecto.
- **`[data-mem-preview]` «Ver Memories»**: cierra el cajón, enciende el módulo si estaba
  apagado, y baja a la **sección real** de la página. No abre un preview propio: no hay
  segundo renderizador que pueda discrepar del público.
- **`PRESET_CARDS`**: los tres pesos visuales son **tres tarjetas** con nombre,
  descripción y previsualización —`Wall`, `Stack`, `Journal`— en vez de un `<select>` con
  tres identificadores en inglés. Cada una lleva su `Previsualizar`, que hace lo mismo que
  «Ver Memories» pero fijando ese preset.

### AÑADIR, REEMPLAZAR, QUITAR

Tres verbos distintos, porque confundirlos fue **el** defecto de fondo del rechazo: subir
una segunda imagen **añadía** una referencia y la portada seguía siendo la vieja, así que
la web parecía no enterarse de la subida.

| Verbo | Qué hace | Qué **no** hace |
|---|---|---|
| `+ Añadir imagen` / `+ Añadir vídeo` | añade una media **al final** de `media[]` | no toca las existentes |
| `Reemplazar` (por fila) | sustituye **esa** referencia **en su posición** | no conserva la antigua en el ítem; no borra el asset físico |
| `Quitar` (por fila) | **desvincula** la referencia del recuerdo | no borra el asset de la Media Library |

`replaceMedia(id, ref, kind, file)` guarda el archivo nuevo, escribe la referencia nueva
en el mismo índice y **suelta la anterior del ítem**. Si la fila era la portada, la
portada pasa a ser el archivo nuevo — que es lo que uno espera al reemplazar una portada.
El asset antiguo sobrevive en la Media Library a propósito: Undo tiene que poder devolver
el estado anterior **con su referencia resoluble**, y limpiar huérfanos es otra
responsabilidad (ver `restaurant-media.js`, `forget`).

### RESTABLECER MEMORIES

`[data-mem-reset]`, con `window.confirm` antes de escribir, deja `modules.memories` en sus
DEFAULTS —es decir, apagado y sin recuerdos— y **nada más**: no toca la carta, ni el
branding, ni los otros módulos, ni la Media Library global, ni el resto del Project State.
Es un `set(PATH, clone(DEFAULTS))`, así que entra en el historial como **una** operación y
Undo lo devuelve entero. Va en su propia `.mem-danger-zone`, separada de los controles de
edición.

Existe porque durante la revisión no había forma de volver al punto de partida: quedaban
imágenes de pruebas anteriores persistidas y la única salida era borrar el proyecto
completo.

### Reordenar

El orden **es** data: `modules.memories.items[]`. `↑ Subir` / `↓ Bajar` son la vía
accesible y la única obligatoria; se escribe el array completo, así que cada operación
es UNA entrada de historial y Undo devuelve el recuerdo entero, con sus referencias.

## Presets

Un solo motor (`class23-memories-engine.js`) y tres renderers. Los tres reciben los
mismos ítems y ninguno guarda nada propio.

**01 · Cinematic Memory Wall** — pared editorial asimétrica sobre doce columnas, con
gramática de movimiento propia:

- **revelado material** al entrar en pantalla: la media se abre por `clip-path`, el copy
  entra detrás y los satélites llegan al final, escalonado por posición. Una sola pasada;
  coreografía, no circo.
- **parallax por celda** alimentado desde el motor (`--mem-shift`, `--mem-depth`) en un
  único rAF que **se apaga tras tres frames sin scroll**. Nunca se toca el scroll.
- **micro-inclinación** por puntero, sólo con puntero fino, y sólo en la celda señalada.
- el **destacado** se compone como la apertura de un reportaje: portada 21/9, collage de
  satélites que muerde su borde inferior, y la historia en columna de lectura.

Un detalle que costó encontrar: el `transform` del parallax NO puede ir en la celda. Ahí
crea un contexto de apilamiento que se lleva dentro al texto, y el contrato de capas con
Scroll Traveler deja de valer — el objeto pasaba por encima de la historia. Vive en el
escenario de media, que es lo que debe moverse.

**02 · Memory Stack** — mazo físico con gramática de Koi Studies:

- **posición CONTINUA**: `focus` es un flotante que un muelle persigue, y de la distancia
  al foco salen `x/y/z`, `rotateY`, `rotateZ`, `scale`, `zIndex`, opacidad y desenfoque en
  cada frame. Los estados discretos de la versión rechazada son justo la razón de que no
  se sintiera físico.
- **arrastre real** con `setPointerCapture`, umbral `clamp(ancho·0.18, 52, 88)`, prueba de
  intención horizontal, `tapSlop` de 3 px y supresión del click fantasma.
- **lanzamiento por velocidad**: un gesto rápido cambia de recuerdo aunque no alcance el
  umbral; uno insuficiente vuelve al origen.
- estados de runtime `IDLE` / `DRAGGING` / `SETTLING`, expuestos en `data-stack-state`
  para los tests y **nunca** guardados en Project State. En reposo, cero rAF.
- **la rueda no se toca**: el scroll de la página sigue siendo el scroll de la página.

**03 · Editorial Journal** — archivo editorial: spreads con capas de papel, folio,
entradilla de fecha y lugar, filmstrip de las medias secundarias, ritmo alternado y
revelado por máscara. El orden lo sigue mandando el proyecto: una fecha sirve para leerla,
no para reordenar a espaldas del restaurante.

## Artefactos materiales

Ya no son polish posterior: forman parte de la identidad de Memories. No son motores
aparte — no tienen store, ni Studio, ni Project State propios. Son un **tratamiento** que
el restaurante elige por recuerdo y que cualquier preset pinta.

**Paper Artifact** (`artifactStyle:'paper'`) — hoja cálida con pliegue, canto y sombra
propia, y encima un grabado cinético en canvas 2D: la matemática de roseta del
`kinetic-lathe-certificate` de ThreeUI (familia de curvas anidadas cuya fase deriva) más
dos bandas guilloché que desplazan el contorno por su normal. El documento respira.

**Heritage Cloth** (`artifactStyle:'cloth'`) — tela colgada tras la media, resuelta con el
**solver Verlet** del `lumina-weavers-cloth`: rejilla 18×12 fijada por arriba, la misma
función de viento y tres iteraciones de relajación de distancias por paso. Se dibuja como
urdimbre y trama, con el ancho y el brillo de cada hilo derivados de su profundidad — por
eso parece tela y no una malla.

**Sin Three.js y sin WebGL, y es una decisión, no un atajo.** El sitio no carga Three;
añadirlo por un artefacto son ~600 KB de CDN nuevo y un contexto que hay que mantener y
destruir bien, justo lo que §29 del contrato prohíbe dejar huérfano. En canvas 2D hay
deformación, movimiento, luz y profundidad reales, y el ciclo de vida es trivial de cerrar.

Ciclo de vida de los dos (patrón de `Gallery.tsx`): nada corre si el artefacto no es
visible o el documento está oculto; `destroy()` cancela el rAF, desconecta observers y
suelta el canvas. Con `prefers-reduced-motion` se pinta un fotograma y se para — estado
premium estático, no una caja vacía.

### El recuerdo ampliado

Un recuerdo con historia larga (más de 180 caracteres) ofrece `Leer el recuerdo`, que
abre su texto completo en una capa propia con Escape y devolución de foco. **No es un
segundo Product Detail**: no hay contrato de producto, ni adaptadores, ni catálogo — es
el texto largo del mismo recuerdo.

## Vídeo

El rechazo decía que «se pueden subir vídeos, pero la experiencia no garantiza que una
persona pueda reproducirlos». El contrato está invertido en `class23-memories-video.js`:

- **TODO vídeo tiene un control de Play/Pause visible y usable. Siempre.** Es la vía
  principal, no el plan B del autoplay.
- El **autoplay es el extra**: sólo el vídeo de portada de un recuerdo destacado, sólo si
  es visible, el documento está visible, no hay reduced-motion, está `muted` y es
  `playsinline`. Como máximo **uno a la vez**.
- Si `play()` se rechaza **no se ignora en silencio**: el estado vuelve a «pausado» y el
  control sigue ahí, que es justo lo que faltaba.
- Pausa al salir del viewport, al ocultarse el documento, al cambiar de media, al cambiar
  de recuerdo en el Stack, al cerrar el story y al apagar Memories. Un registro único, así
  que el vídeo del story entra por la misma puerta que el inline.
- `preload="metadata"` y, en las miniaturas, una búsqueda a un instante temprano para que
  **haya fotograma** — el póster que un restaurante no tiene por qué preparar.

Dos detalles que salieron de tests que fallaban con razón:

1. **Pausar por proporción de visibilidad era un error.** El revelado de la sección anima
   un `clip-path`, y el IntersectionObserver *cuenta el recorte*: durante ~1,1 s la
   proporción sube de 0 a 1, así que un vídeo recién arrancado se pausaba solo a mitad de
   la animación. Ahora se pausa por `isIntersecting === false` — «fuera del viewport», que
   es literalmente lo que pide el contrato.
2. **Un vídeo parado en su final no arrancaba.** `play()` lo dejaba donde estaba y volvía
   a terminar en el mismo instante, así que el control no hacía nada visible. Se rebobina,
   como cualquier reproductor.

## Público

La sección entra **antes de `#visit`**: la memoria cierra el relato justo antes de la
invitación a reservar. Queda `… chef → MEMORIES → visit → location → footer`.

### El enlace público

Con el módulo encendido aparece **`Memoria` en la navegación** apuntando a `#memories`, y
al apagarlo **desaparece** — `mountNavLink()` / `unmountNavLink()`. Sin él la sección
existía pero no se anunciaba: había que saber que estaba y bajar a buscarla.

El enlace se añade **al final** de `.desktop-nav`, y esa posición no es estética.
`class6-product.js` reetiqueta `.desktop-nav a` **por índice**: un enlace insertado en
medio hacía que el rótulo de un hermano se escribiera encima del suyo y la navegación
mostraba «Visita» dos veces. Al final del contenedor no desplaza ningún índice existente.
Aun así el rótulo se **vuelve a afirmar en cada `applyConfig`**, porque depender de que
otro módulo no cuente es exactamente la clase de acoplamiento que produjo el fallo.

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

## Ruta de revisión — `?review=memories`

Hay **dos URL**, y la distinción importa:

| URL | Qué es |
|---|---|
| `<base>/` | **PRODUCTO.** El proyecto del restaurante. Memories apagado por defecto, sin recuerdos inventados. |
| `<base>/?review=memories` | **REVISIÓN.** Una composición completa lista para juzgar, con assets versionados. |

La razón de existir de la segunda: la demostración visual dependía de que Playwright
inyectara estado **después** de cargar la página, y eso no es el producto. Aquí basta un
`goto`. Admite `&preset=` y trae una banda fija con conmutador `Wall / Stack / Journal`.

Composición: **5 recuerdos · 12 medias · 9 imágenes · 3 vídeos**, uno con cuatro medias
mezcladas, uno con imagen+vídeo+imagen, un destacado hero, uno de papel, uno de tejido.

Tres reglas la separan de una trampa:

1. **No escribe en el Project State.** Publica `window.RestaurantMemoriesReview` y el
   motor lo prefiere mientras exista: `config()` lee `review() || cfg().get(PATH)`. Ni un
   `set`, ni un guardado, ni una entrada de Undo — el gate lo comprueba con
   `projectUntouched`. Es literalmente el problema que se reportó («aparecen imágenes
   antiguas»), y esta ruta no puede volver a causarlo.
2. **La media es estática y del repositorio.** Las refs conservan la forma del dominio
   (`project/memories/<item>/<media>`) y se resuelven con `RestaurantMedia.map(ref, url)`,
   que registra una URL **sin guardar nada**. No hay segundo almacén: es la capa de
   resolución haciendo su trabajo, y es la misma vía por la que Cloud Media resolverá una
   ref remota. Los tres vídeos —`assets/memories-review/*.webm`, 160–214 KB— están
   versionados, así que la URL no necesita subidas.
3. **El contenido está etiquetado como DEMO.** El antetítulo, la entradilla, cada texto
   alternativo y la banda fija lo dicen. Sirve para valorar Wall, Stack y Journal; no para
   publicar.

**No es un LAB, ni un segundo motor, ni un iframe:** es el motor productivo pintando otro
conjunto de datos. Si dejara de funcionar el producto, dejaría de funcionar la review.

## Ficheros

**Nuevos:** `class23-memories-model.js` · `class23-memories-engine.js` ·
`class23-memories-studio.js` · `class23-memories-review.js` · `restaurant-media.js` ·
`restaurant-media-picker.js` · `styles-v23.css` · `assets/memories-review/*.webm` ·
`tests/class23-memories-e2e.mjs` · `tests/class23-human-review-gate.mjs` ·
`tests/memories-fixtures.mjs` · `tests/capture-class23-live.mjs` ·
`tests/capture-class23-final-video.mjs` · `docs/CLASS-23-MEMORIES-AUDIT.md` ·
`docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-AUDIT.md` · este documento.
**Modificado:** `class4-runtime-guard.js` (una cadena de carga aditiva) ·
`restaurant-media.js` (`map()`, y `revoke` sólo revoca `blob:`).
**`index.html` no se toca**, como en Class 21 y Class 22.

## Gate

`tests/class23-memories-e2e.mjs` — **64/64 · MEMORIES_PASS**, sobre los §36–§41 del
contrato de recuperación. No comprueba presencia de nodos: comprueba comportamiento.

- un recuerdo con **cuatro medias mezcladas** (imagen · vídeo · imagen · vídeo) y hay que
  llegar a las cuatro en Wall, Stack, Journal y Story — §35 prohíbe el atajo de «un
  recuerdo de foto y otro de vídeo», y los fixtures lo respetan;
- el vídeo se prueba con **Play, `currentTime` avanzando y Pause**, inline y en el story;
- el arrastre del Stack se prueba **moviendo el puntero de verdad**: que el mazo se mueve,
  que un lanzamiento cambia de recuerdo, que un gesto corto vuelve al origen y que la
  página **no** se secuestra;
- los artefactos se prueban leyendo el canvas: hay píxeles pintados, no una clase CSS;
- el reorden de media y de recuerdos se prueba en el estado **y en el DOM del Studio**.

Los fixtures cumplen §34 al pie de la letra: 5 recuerdos, 12 medias (9 imágenes + 3
vídeos), uno con cuatro medias, uno con imagen+vídeo+imagen, uno de papel, uno de tela, un
destacado hero y los tres pesos. Las imágenes salen de assets del repositorio y los vídeos
se **generan** con MediaRecorder, así que la subida se recorre de verdad.

### El gate de revisión humana

`tests/class23-human-review-gate.mjs` — **36/36 · `CLASS23_HUMAN_REVIEW_GATE_PASS`**.
Es el que comprueba lo que se rechazó, y por eso **Playwright actúa como auditor, no como
actor**: la URL de revisión se abre con un `goto` y nada más. Si necesitara inyección para
verse bien, es un FAIL.

- **Perfil limpio**: módulo apagado, cero medias, cero recuerdos inventados y **ningún
  enlace `#memories` huérfano** en la navegación.
- **Encontrabilidad**: la entrada en Módulos, las tres tarjetas de preset, «Ver Memories»,
  los tres `Previsualizar` y la zona de restablecer existen y hacen lo que dicen.
- **El recorrido humano completo**: cuatro medias subidas, las cuatro visibles; un
  `Reemplazar` que deja de vincular la anterior **y conserva el asset**; un `Restablecer`
  que toca `modules.memories` **y nada más** y que Undo revierte.
- **La URL de revisión** desde `goto`: 5 recuerdos, 12 medias, 9+3, el hero con cuatro,
  papel y tejido, `projectUntouched: true`.
- **Auditoría de movimiento**, midiendo en vez de suponer: cuatro `transform` distintos
  durante un arrastre, la transición `DRAGGING → SETTLING → IDLE`, desplazamientos de
  parallax que cambian, `currentTime` avanzando inline y en el story, y **cero secuestro
  de la rueda**.
- **390 px** de viewport, sin desbordamiento horizontal.

### Evidencia visual

`output/playwright/class23-review/` — **11 capturas** a 1440×1000
(`01-review-wall` … `11-review-mobile`) y **un vídeo** de **42,9 s**,
`video/class23-memories-final.webm`, grabado por
`tests/capture-class23-final-video.mjs`: **una sola sesión, sin montaje**, que empieza en
la URL de revisión con un `goto` y termina en la URL de producto abriendo el Studio,
gestionando cuatro medias, reemplazando la portada y bajando a ver el resultado en la
página pública.

Dos cosas se ajustaron **por mirar los fotogramas**, no por un test: el papel se veía como
una banda porque la cámara llegaba mientras el scroll suave aún viajaba —se le da reposo
fijo, no escalado—, y el remate se cortaba justo al aparecer la sección.

### Defectos que salieron de MIRAR el resultado, no de un test en rojo

1. **El `transform` del parallax en la celda** creaba un contexto de apilamiento y anulaba
   el contrato de capas con Scroll Traveler: el objeto pasaba sobre la historia.
2. **La superficie del artefacto desaparecía**: una regla mía del contrato de capas le
   forzaba `position:relative`, le anulaba el `inset` y la dejaba con altura cero.
3. **El artefacto tapaba la fotografía**: el visor tiene `transform` de inclinación, así
   que es contexto de apilamiento y el `z-index` de su marco quedaba encerrado dentro.
4. **El mazo salía descentrado** porque `margin-left:min(-280px,-42%)` no es la mitad del
   ancho de la tarjeta.
5. **Banda negra bajo el vídeo** cuando su proporción no coincidía con la del marco: el
   slot activo estaba en flujo normal en vez de rellenar la caja.
6. **Desbordamiento real en móvil**: el Journal medía 468 px de ancho en un viewport de
   390, porque el mínimo automático de una tira `nowrap` es la suma de sus miniaturas.
   Faltaba `min-width:0`.
7. **El rAF del parallax no se apagaba nunca** mientras la sección estuviera a la vista.

## Limitaciones honestas

- **La media local no viaja entre ordenadores.** Los assets viven en el IndexedDB del
  navegador; el export lleva las **referencias**, no los bytes. En otro ordenador esas
  refs no resuelven y el recuerdo se pinta sin media (no roto: se salta). **Cross-computer
  NO está terminado**, y la capa Cloud es la que lo cierra.
- **Project State remoto y Media Library remota siguen pendientes**, y siguen siendo
  obligatorios para V1. **La Platform Layer no está terminada.**
- **Studio desktop-first**: no se ha hecho paridad móvil del editor, y no se ha tomado
  ninguna decisión que la impida — el reorden tiene vía accesible además del arrastre, el
  dominio no depende del almacén y la media se referencia por una clave lógica. La web
  pública **sí** es responsive, y el gate la comprueba en los tres presets a 390 px.
- El **arrastre del Stack** es la vía rica; en móvil funciona por Pointer Events, y en
  cualquier caso los botones y el teclado hacen lo mismo.
- Los artefactos son **canvas 2D**, no WebGL: hay materialidad, movimiento y luz, pero no
  sombras proyectadas ni refracción. Si algún día se quiere ir más allá, el sitio tendrá
  que decidir si trae Three.js — hoy no lo trae.

- **El Scroll Traveler sobrevuela también los textos de Memories** en parte del
  recorrido, como sobrevuela el resto de las secciones que cruza. Es comportamiento
  histórico de Project 09, no una regresión de Class 23, y no se toca aquí: cambiarlo es
  rediseñar la ruta del viajero para todo el sitio. Queda anotado para revisión humana.
- **La ruta de revisión no sustituye una prueba con contenido del restaurante.** Demuestra
  Wall, Stack, Journal, papel y tejido con una composición rica; lo que no puede demostrar
  es qué tal se ve la casa con **sus** fotos, que es justo lo que decide la revisión
  humana.

### Tres limitaciones de entregas anteriores que quedan RETIRADAS

- ~~«una celda compone con la primera media»~~ — falso ya: **todas** las medias de un
  recuerdo son alcanzables en los cuatro destinos.
- ~~«los material artifacts quedan como polish posterior»~~ — **Paper Artifact y Heritage
  Cloth están implementados** dentro de este mismo motor, elegibles por recuerdo desde el
  Studio.
- ~~«la demostración visual necesita estado inyectado por Playwright»~~ — la URL de
  revisión funciona con un `goto` y assets versionados, y el gate lo comprueba.
