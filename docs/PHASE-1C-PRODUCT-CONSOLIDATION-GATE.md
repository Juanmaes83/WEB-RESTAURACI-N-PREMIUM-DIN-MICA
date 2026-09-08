# FASE 1C — PRODUCT CONSOLIDATION GATE

**Estado:** READY FOR HUMAN VISUAL REVIEW · **MERGED: NO**
**Rama:** `feat/product-consolidation-gate`

Esta fase no añade una capacidad. Cierra la puerta antes de Memories y Beverages
demostrando que lo construido hasta aquí es **un producto**, no una colección de
laboratorios: un Studio, un Project State, un modelo de media, una experiencia de
producto y once capacidades de movimiento.

Lo que se ha corregido es sólo lo que rompía esa afirmación:

1. **Un LAB seguía siendo el runtime del producto.** La In-App Experience Shell
   (Class 22) abría `labs/…/index.html`. Un LAB es evidencia, no la fuente operativa.
2. **El motor del Circular Dish Rotator vivía dentro de su LAB.** Era el único motor
   fuera de la raíz, así que "no cargar `/labs/`" y "no duplicar el motor" parecían
   incompatibles.
3. **Las tarjetas de módulo abrían un LAB en otra pestaña.** Último rastro de `/labs/`
   en un recorrido productivo interno.
4. **Cromo estático en inglés** dentro de superficies que hoy se ven ya dentro del
   producto.

## Una implementación, dos puertas

La respuesta al punto 2 **no** fue copiar el motor. Fue promoverlo a la raíz —donde ya
viven los otros diez— con `git mv`, para que las dos puertas lo carguen:

```
experiences/circular-dish-rotator/index.html    ← puerta PRODUCTIVA (la que abre Class 22)
                 ↓
     project06-circular-dish-rotator.js/.css
     project06-phase2-premium.js/.css           ← MOTOR CANÓNICO, en la raíz
                 ↑
labs/project06-circular-dish-rotator/index.html ← puerta histórica de evidencia
```

Las dos puertas están a la misma profundidad (`experiences/<id>/` y `labs/<lab>/`), así
que las rutas `../../assets/…` resuelven igual y el `url()` del CSS no se rompe. Dish
Stage y el Rail ya tenían su motor en la raíz: sólo les faltaba la puerta productiva.

### La autoría también sale de `/labs/`

La primera versión de esta fase generaba la puerta productiva **desde el marcado del
LAB**. Eso quitaba la dependencia de *runtime*, pero dejaba al LAB como fuente **autorada**
del producto, incoherente con `LAB = evidencia / regresión`. Corregido: la autoría vive en
una fuente neutral fuera de `/labs/`, y el generador escribe **las dos** puertas desde ella.

```
experiences/_source/<id>.html            ← FUENTE NEUTRAL (autoría)
          +--------------+--------------+
experiences/<id>/index.html      labs/<lab>/index.html
   puerta PRODUCTIVA                puerta de evidencia
          +--------------+--------------+
                MOTOR CANÓNICO en la raíz
```

`scripts/build-experience-entrypoints.mjs` **no lee nada de `/labs/`**: sólo escribe ahí.
Las regiones marcadas `@door:lab` / `@door:product` deciden qué va a cada puerta, así que
no hay dos marcados que puedan divergir. La regeneración del LAB salió byte a byte igual
que el fichero aprobado salvo las localizaciones compartidas y su cabecera: el LAB no
perdió nada.

El gate (`tests/phase-1c-consolidation-gate.mjs`) comprueba después que ambas puertas
cargan exactamente los mismos ficheros de motor, que no queda ningún `.js`/`.css` dentro
del LAB del rotador, y que el generador no lee de `/labs/`.

## Los cuatro bloqueadores de consolidación

Tras la primera revisión la arquitectura quedó aprobada y aparecieron cuatro bloqueadores.
Los cuatro están cerrados.

### 1 · Circular no puede tener un segundo Studio

La puerta productiva todavía traía el personalizador del LAB: botón *Personalizar*,
`#cdr-customizer`, tres uploaders propios, *Guardar cambios*, *Reset*, y los rótulos
`RESTAURANT PROFILE` / `BRAND` / `ASSETS` / `COMMERCE`. Bloquear la persistencia no
arregla eso: **no puede existir una UI que prometa guardar algo que el proyecto
descarta**. Dentro del producto ya no existe; la configuración se hace en el Studio. El
LAB conserva el suyo intacto para regresión.

Al quitarlo apareció la trampa: `project06-phase2-premium.js` **abortaba** si faltaba
`#cdr-customizer`. Quitar el panel sin tocar esa guarda habría apagado en silencio toda la
capa premium -mundos cromáticos, marca, CTA- en la puerta productiva. El personalizador
salió de la guarda: es cromo opcional, no un requisito de runtime.

### 2 · Circular sobre el mismo Project State y la misma Media

**Auditado antes de escribir una línea**, porque tener ocho pizzas no basta para declarar
dos motores equivalentes:

| | P06 Circular | P07 `pizzaSliceOrbit` | Veredicto |
|---|---|---|---|
| Productos | 8 sectores | 8 products | **compatibles**: coincidencia exacta por nombre |
| Campos | `name` `ingredients` `descriptor` `accent` `lead` `tail` `mood` `price` | superset, con `headlineLead`/`headlineTail` | **compatibles** |
| Orden | atado a las porciones de **una** fotografía horneada | otro orden | **NO** → unir por nombre, nunca por índice |
| `price` | se muestra en la composición | `null` a propósito en las ocho | **NO** → el proyecto es la autoridad: un nulo es *sin precio* |
| `mood` | lleva el ordinal del sector (`FIRE · SIGNATURE 01`) | sólo el ánimo (`FUEGO`) | **NO** → se compone conservando el ordinal |
| Media (logo/rueda/fondo) | uploader propio → IndexedDB | no existe equivalente | **contrato mínimo dentro del Project State** |

Resultado: **adapter de sólo lectura** (`circular-project-adapter.js`) sobre los productos
del proyecto, más el contrato mínimo que le faltaba -sus tres refs de media- dentro del
Project State existente (`RestaurantDefaults.circularDishRotator`). Ningún store nuevo,
ningún catálogo duplicado, ninguna conversión a `dishes`, ninguna geometría tocada.

```
PROJECT STATE                          MEDIA LIBRARY
  |-- pizzaSliceOrbit.products  --+      refs → logo · rueda · fondo
  |-- pizzaSliceOrbit.brand     --+      ('' → asset demo como fallback,
  +-- circularDishRotator.media --+       slot:<nombre> → ranura del proyecto)
                                  v
                    adapter de sólo lectura
                                  v
              MOTOR CANÓNICO · 8 sectores · geometría intacta
```

Verificado en ejecución dentro del producto: `data-circular-source="project:8/8"`, perfil
`Pizza selection` con el acento del proyecto, `cdr.project06.*` en `localStorage` **nulo**,
0 uploaders, y la historia del plato en el idioma del proyecto. La tubería de media se
probó de punta a punta poniendo una ref a una ranura del proyecto: el fondo la tomó de la
Media Library sin que exista ninguna subida propia.

Efecto lateral relevante: el titular en inglés que la revisión anterior dejó listado
(`the slice with` / `Fire at the centre of the table.`) **desaparece dentro del producto**,
porque ahí la historia la escribe el proyecto (`la porción de` / `Fuego en el centro de la
mesa.`). No se tocó ni una línea de diseño para conseguirlo.

#### `price: null` significa SIN precio

Un nulo del proyecto **no** cae al precio demo del motor. Si el proyecto tiene el
producto, es la autoridad sobre su precio, y `pizzaSliceOrbit` deja `null` en las ocho
porque **no hay precio auténtico**: pintar €14 ahí sería inventar un dato del
restaurante, y meterlo además en el evento de pedido.

El adapter distingue tres casos:

| | |
|---|---|
| producto **no** encontrado en el proyecto | el sector se queda como DEMO, entero |
| producto encontrado, `price` nulo | **sin precio** |
| producto encontrado, precio real | ese precio, exactamente |

Y sin precio **no queda un rótulo colgando**: el bloque entero desaparece, `DESDE`
incluido — ni guiones, ni ceros, ni valores inventados. El LAB abierto directamente no
tiene proyecto detrás, así que conserva sus precios demo históricos.

### 3 · El LAB no puede ser la fuente autorada del producto

Resuelto con la fuente neutral descrita arriba.

### 4 · Cromo de producto

Fuera de las puertas productivas: `ISOLATED LAB · PHASE 2`, `ISOLATED LAB · HUMAN REVIEW`
y las notas `LAB: emite ...`. Localizado en la fuente, para las dos puertas: `PRICE` →
`PRECIO`, `TABLE REQUEST` → `SOLICITUD DE MESA`, `DRAG · WHEEL · ARROWS` → `ARRASTRA ·
RUEDA · FLECHAS`, las instrucciones del Rail, y los avisos que inyectan los motores.

Y la navegación de marca: el Rail llevaba `href="index.html"`, que **dentro del iframe**
recarga la experiencia sin `#shell` -perdiendo el proyecto- o abre una app raíz anidada.
En la puerta productiva la marca ya no navega: se conserva la etiqueta como `<span>` con
sus clases y su id, que es lo que usan el CSS y el motor.

## Tabla de consolidación

`STATE SOURCE` = de dónde sale la configuración que la capacidad pinta.
`MEDIA SOURCE` = de dónde salen sus imágenes y vídeos.

| CAPABILITY | PRODUCT ENTRY | STATE SOURCE | MEDIA SOURCE | LAB AS ENTRY? | LAB AS RUNTIME? | NEW TAB? | PRODUCT PASS? |
|---|---|---|---|---|---|---|---|
| 01 Elegant Orbit | Studio → Motion → preset | `RestaurantStudioConfig` (`motion.preset`) | Project media (slots de `RestaurantStore`) | NO | NO | NO | ✅ |
| 02 Urban Acrobatics | Studio → Motion → preset | `RestaurantStudioConfig` | Project media | NO | NO | NO | ✅ |
| 03 Editorial Flow | Studio → Motion → preset | `RestaurantStudioConfig` | Project media | NO | NO | NO | ✅ |
| 04 Cinematic Depth Carousel | Studio → Motion → preset | `RestaurantStudioConfig` | Project media + assets precompuestos | NO | NO | NO | ✅ |
| 05 Precomposed Anchor Scenes | Studio → Motion → preset | `RestaurantStudioConfig` | Project media + assets precompuestos | NO | NO | NO | ✅ |
| 06 Orbital Food Slider | Studio → Motion → preset | `RestaurantStudioConfig` | Project media | NO | NO | NO | ✅ |
| 07 Circular Dish Rotator | Studio → Motion → **In-App Shell** | `pizzaSliceOrbit` del proyecto vía `circular-project-adapter.js` (sólo lectura) | Media Library del proyecto vía refs en `circularDishRotator.media` | NO | NO | NO | ✅ |
| 08 Pizza Slice Orbit · Premium | Studio → Motion → preset | `RestaurantStudioConfig` + modelo propio de pizza | Project media + assets de porción | NO | NO | NO | ✅ |
| 09 Scroll Traveler | Studio → Motion (transversal, `scrollTraveler.enabled`) | `RestaurantStudioConfig` | Project media (asset del viajero) | NO | NO | NO | ✅ |
| 10 Dish Stage | Studio → Motion → **In-App Shell** | Project State del padre vía bridge | Project media del padre | NO | NO | NO | ✅ |
| 11 Cinematic Product Rail | Studio → Motion → **In-App Shell** | Project State del padre vía bridge | Project media del padre | NO | NO | NO | ✅ |
| Product Detail (Class 21) | Studio → Producto → ON/OFF + adapters | `RestaurantStudioConfig` (`productDetail.*`) | Project media del plato/porción | NO | NO | NO | ✅ |
| Módulo Location / Maps | Studio → Módulos → Configurar (18 campos) | `RestaurantStudioConfig` (`location.*`) | Sin media propia (mapa bajo consentimiento) | NO | NO | NO¹ | ✅ |
| Módulo Social / Reputation | Studio → Módulos → Configurar (27 campos) | `RestaurantStudioConfig` (`social.*`) | Sin media propia | NO | NO | NO¹ | ✅ |
| Módulo WhatsApp Contact | Studio → Módulos → Configurar (11 campos) | `RestaurantStudioConfig` (`whatsapp.*`) | Sin media propia | NO | NO | NO¹ | ✅ |

¹ Los módulos publican enlaces **comerciales públicos** —Google Maps, Instagram,
WhatsApp— que sí salen del sitio, como debe ser. Lo que el guard prohíbe es que una
**acción productiva interna** salga a otra pestaña o a `/labs/`; el propio guard
comprueba además que esos enlaces comerciales siguen presentes.

### Fuentes únicas, escritas una sola vez

| | Fuente única | Dónde |
|---|---|---|
| Plantilla de proyecto | `RestaurantDefaults` | `class4-config.js` |
| Lectura/escritura de configuración | `RestaurantStudioConfig` (`get`/`set`/`snapshot`, `mutate → applyAll → persist`) | `class4-runtime-guard.js` |
| Persistencia | `RestaurantStore` — IndexedDB `restaurant-premium-studio` v3, con fallback a `localStorage` | `class4-store.js` |
| Media | slots de `RestaurantStore` + Cache API `restaurant-premium-media-v1` | `class4-store.js` |
| Notificación de cambio | evento `restaurant:config-applied` | `class4-runtime-guard.js` |

Las tres experiencias enmarcadas **no** añaden ninguna fuente. `experience-shell-bridge.js`
sólo actúa si la página está enmarcada (`window.parent!==window`, `#shell`, y el padre
expone `RestaurantExperienceShell.project`): funde el proyecto del padre en
`RestaurantDefaults`, sirve las lecturas de perfil del rotador desde `brand`, descarta
sus escrituras y **le niega IndexedDB**, de modo que una experiencia no puede convertirse
en un segundo origen de verdad. Fuera del marco no hace nada: los LABs siguen
funcionando solos, y el gate lo comprueba (`framed=0`).

## Catálogo intacto

Once motores, numerados 01..11, exactamente los aprobados en CLASS 19: siete presets de
órbita, una capacidad de página transversal y tres experiencias a pantalla completa. No
se ha añadido, quitado, renumerado ni rediseñado ninguno. Los tres módulos siguen en su
propia sección, fuera de la cuenta.

El invariante del guard de la biblioteca sí cambió, y a mejor: antes exigía que la
tarjeta de un módulo apuntase a una página de LAB existente; ahora exige que el módulo
sea **configurable en el Studio**. El contrato queda atado al Studio, no a un lab.

## Limpieza de copy (acotada)

Sólo UI estática de producto, en su fuente autorada, sin ningún dataset traducido y sin
framework de i18n: `Explore dish` → `Ver plato`, las cuatro etiquetas de ficha
(`Ingredientes` / `Origen` / `Técnica` / `Maridaje`), los `aria-label` de navegación de
platos, el anuncio `Plato seleccionado:` que inyectan los dos motores, y el copy de demo
propio del rotador (`Esta noche, elige`, `Porción seleccionada`, `Solicitud de pedido`).
No se han tocado ids, `data-path`, nombres de eventos (`cdr:order-request`), enums,
presets ni nombres técnicos de motor.

Dos correcciones salieron de MIRAR las capturas, no de los tests:

- **Las etiquetas de CTA del rotador se reescriben en cada cambio de porción.** Traducir
  el marcado inicial del lab no servía de nada: `updateContextCta()` volvía a poner
  `Order Diavola` / `Reserve table` al primer giro. La fuente canónica del copy era esa
  función, y ahí se corrigió (`Pedir <porción>` / `Reservar mesa`).
- **La puerta productiva se anunciaba como laboratorio.** La placa `ISOLATED LAB ·
  PHASE 2` viajaba al producto. El generador la sustituye ahora por `VISTA PREVIA DEL
  PROYECTO` en la puerta productiva; **el LAB conserva la suya**, porque ahí es verdad.

### Lo que sigue en inglés, a propósito

En el rotador quedan los rótulos tipográficos `NOW SERVING`, `DISCOVER`, `FROM` y
`SPICY · SMOKY · BOLD`. Son composición tipográfica de ese motor, no chrome de producto;
tocarlos cambia longitudes de línea y entra en terreno de diseño, que esta fase tiene
prohibido. Quedan listados aquí para decidirse aparte.

El titular de demo que esta lista incluía antes (`the slice with` / `Fire at the centre of
the table.`) ya no aparece dentro del producto: lo escribe el proyecto.

## El gate

`tests/phase-1c-consolidation-gate.mjs` — **50/50 · PHASE_1C_GATE_PASS**. Cubre los 25
puntos de la misión, el guard de DOM, la paridad de motor canónico y los cuatro
bloqueadores finales:

- once motores numerados y elegibles; los siete presets aplican de verdad; Scroll
  Traveler es transversal;
- las tres experiencias abren **dentro** de la app con `src=experiences/<id>/index.html#shell`
  y el `IFRAME.xs-frame` por delante (comprobado con `elementFromPoint`, no con rects);
- cero pestañas nuevas en todo el recorrido;
- los tres módulos se configuran desde el Studio (18/27/11 campos) con OFF/ON intacto;
- Product Detail ON/OFF correcto y Pizza conservando su propio modelo;
- un Project State, sin store paralelo, la web pública en pie;
- **guard de DOM:** ninguna acción productiva interna con `href` a `/labs/` ni
  `target="_blank"` a un LAB — y los enlaces comerciales públicos siguen presentes;
- las dos puertas cargan el mismo motor canónico; no queda `.js`/`.css` en el LAB del
  rotador; los tres LABs siguen respondiendo 200 y funcionando sin marco;
- **el generador no lee de `/labs/`** y la fuente autorada vive fuera;
- **ninguna puerta productiva** dice `ISOLATED LAB` ni `HUMAN REVIEW`, contiene
  `#cdr-customizer`, un `input[type=file]` propio, una UI que prometa guardar, ni una
  navegación hacia una app raíz o hacia `/labs/`;
- **el LAB conserva** su personalizador histórico;
- **Circular dentro del producto**: ocho sectores del proyecto unidos por nombre, perfil
  del proyecto, `localStorage` propio nulo, cero uploaders y la capa premium viva.

## Fuera de alcance (explícito)

Memories, Beverages, Auth, Cloud, backend, capa de publicación, router general,
refactor global, motor nuevo, Product Detail nuevo, framework de i18n, mejoras de diseño
gratuitas. Ningún LAB ni rama se ha borrado.

## Gate real de ONE PROJECT / ONE MEDIA

| Circular dentro del producto | |
|---|---|
| geometría propia | ✅ ocho sectores, 45°, orden del asset horneado — intacta |
| mismo Project State | ✅ productos y perfil del proyecto, unidos por nombre |
| el proyecto manda en sus datos | ✅ `price: null` es *sin precio*, no el precio demo |
| misma Media layer | ✅ refs en el Project State, resueltas por la Media Library |
| 0 store productivo paralelo | ✅ `cdr.project06.*` nulo; su IndexedDB no se abre |
| 0 uploader paralelo | ✅ 0 `input[type=file]` |
| 0 Studio paralelo | ✅ sin `#cdr-customizer`, sin Guardar/Reset |

## Estado de las fases

| Fase | Estado |
|---|---|
| FASE 1A — Product Detail unificado + defaults públicos en español | **CLOSED** |
| FASE 1B — In-App Experience Consolidation | **CLOSED** |
| FASE 1C — Product Consolidation Gate | **READY FOR HUMAN VISUAL REVIEW** |

Siguiente frontera, ya con el producto consolidado: **Memories** y **Beverages**, cada
una con panel de personalización, imagen y vídeo desde la misma Media Library y el mismo
Project State.
