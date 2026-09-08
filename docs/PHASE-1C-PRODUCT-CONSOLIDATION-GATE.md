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

Los tres `experiences/<id>/index.html` los **genera** `scripts/build-experience-entrypoints.mjs`
a partir del marcado del LAB, y su salida se commitea: una sola fuente de marcado
autorado, sin dependencia de `/labs/` en runtime. El gate (`tests/phase-1c-consolidation-gate.mjs`)
comprueba después que ambas puertas cargan exactamente los mismos ficheros de motor y que
no queda ningún `.js`/`.css` dentro del LAB del rotador.

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
| 07 Circular Dish Rotator | Studio → Motion → **In-App Shell** | Project State del padre vía `experience-shell-bridge.js` | Project media del padre (misma sesión) | NO | NO | NO | ✅ |
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

Dentro del rotador queda copy en inglés que **no** entra en esta limpieza acotada y que
se deja explícitamente a decisión humana: el titular de demo (`the slice with` / `Fire at
the centre of the table.`), y los rótulos tipográficos `NOW SERVING`, `DISCOVER`, `FROM`
y `SPICY · SMOKY · BOLD`. Son composición tipográfica y narrativa de demo de ese motor,
no chrome de producto; tocarlos cambia longitudes de línea y entra en terreno de diseño,
que esta fase tiene prohibido. Quedan listados aquí para que se decidan aparte.

## El gate

`tests/phase-1c-consolidation-gate.mjs` — **28/28 · PHASE_1C_GATE_PASS**. Cubre los 25
puntos de la misión más el guard de DOM y la paridad de motor canónico:

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
  rotador; los tres LABs siguen respondiendo 200 y funcionando sin marco.

## Fuera de alcance (explícito)

Memories, Beverages, Auth, Cloud, backend, capa de publicación, router general,
refactor global, motor nuevo, Product Detail nuevo, framework de i18n, mejoras de diseño
gratuitas. Ningún LAB ni rama se ha borrado.

## Estado de las fases

| Fase | Estado |
|---|---|
| FASE 1A — Product Detail unificado + defaults públicos en español | **CLOSED** |
| FASE 1B — In-App Experience Consolidation | **CLOSED** |
| FASE 1C — Product Consolidation Gate | **READY FOR HUMAN VISUAL REVIEW** |

Siguiente frontera, ya con el producto consolidado: **Memories** y **Beverages**, cada
una con panel de personalización, imagen y vídeo desde la misma Media Library y el mismo
Project State.
