# CLASS 21 — UNIFIED PRODUCT DETAIL

La ficha de producto sube al **Product Engine**. Antes de esto la abría cada motor por
su cuenta y no había forma de encenderla, apagarla ni configurarla en un sitio.

```
PRODUCT MOTION  →  ACTIVE PRODUCT  →  UNIFIED PRODUCT DETAIL
```

El motor decide **cuál** es el producto activo. La ficha decide **cómo se cuenta**. El
contrato es lo único que comparten, y es opcional.

| | |
|---|---|
| Runtime | `class21-unified-product-detail.js` (lo carga `class4-runtime-guard.js`) |
| Estilos | `styles-v21.css` (los inyecta el runtime) |
| Contrato | `RestaurantDefaults.productDetail` en `class4-config.js` |
| Suite | `tests/class21-unified-product-detail-e2e.mjs` — 47/47 |
| Auditoría previa | `docs/PRODUCT-DETAIL-AUDIT.md` |
| Evidencia | `output/playwright/product-detail/` |

---

## 1. Lo que NO se ha hecho, deliberadamente

- **No se ha reescrito la ficha compartida.** `app-v4.js` + `class6-product.js` +
  `#dish-detail` ya sirven a seis motores con su transición GSAP Flip desde el plato
  real. Ni una línea suya se ha tocado.
- **No hay un segundo estado de producto.** Quién es el producto activo lo siguen
  diciendo el motor (`RestaurantOrbit.getActiveIndex()`, `DishStageEngine`,
  `CinematicProductRail`, `RestaurantPizzaSliceOrbit`) y la excepción documentada
  `[data-orbit-hero="1"]`, que existe porque Project 03 descentra su héroe a propósito.
- **No se ha duplicado la regla del producto lateral.** `class6-product.openDish()` ya
  la implementa —si el plato no es el héroe, navega primero y sólo abre si llega a
  serlo— y se invoca por su evento público `restaurant:class6-open-dish`.
- **No hay segundo panel, segundo Studio ni segundo almacenamiento.** La tarjeta vive
  en el panel **Platos** que ya existía y escribe por `data-path`.
- **No se ha inventado contenido.** Un campo vacío se oculta. `price:null` no se
  renderiza como cero.

## 2. El contrato

```js
RestaurantProductDetail.open(product, options)   // product: id, registro o null (= el activo)
RestaurantProductDetail.close()
RestaurantProductDetail.isOpen()
// y, para adaptar y para probar:
RestaurantProductDetail.register(id, adapter)
RestaurantProductDetail.activeProduct()   ·   .activeAdapter()   ·   .state()
```

`options.via` es `'product' | 'button' | 'api'` y se compara con el disparador
configurado, así que la misma llamada se acepta o se rechaza según lo que el
restaurante haya elegido.

## 3. Adaptadores: el orden ES el contrato

Un adaptador declara `match()`, `activeProduct()`, `open()`, `close()`, `isOpen()`.
Gana **el primero cuyo `match()` sea cierto**, y por eso el orden de registro importa:
un motor que se apodera del escenario se registra antes que el genérico.

| Orden | Adaptador | Motores | Qué hace `open()` |
|---|---|---|---|
| 1 | `pizza` | Pizza Slice Orbit · Pizza Premium | abre el diálogo del Product Engine con el producto de Pizza |
| 2 | `orbit` | Elegant · Urban · Editorial Flow · Depth Carousel · Anchor Scenes · Orbital Food | emite `restaurant:class6-open-dish`: Class 06 aplica su regla y su Flip |
| 3 | `dish-stage` | Dish Stage | `DishStageEngine.openDetail()` — su propia ficha |
| 4 | `product-rail` | Cinematic Product Rail | pulsa `#cpr-explore` — su propio diálogo |

**Un intento equivocado, documentado porque enseña algo.** Primero condicioné el
adaptador `orbit` a que el escenario base estuviese "vivo", copiando la regla
`baseStageLive()` del bridge de Class 06. Es la regla correcta para decidir *quién
manda en los clics* y la equivocada para *elegir adaptador*: Depth Carousel y Anchor
Scenes también ocultan `#orbit-stage` y siguen siendo del GROUP A, usando esa misma
ficha compartida. Lo que distingue a Pizza es su preset, y para eso basta el orden.

**Los adaptadores del GROUP B eran código muerto.** Ninguno de sus labs carga
`class4-runtime-guard.js`, así que el contrato no existía en la página donde viven esos
motores. La adaptación mínima: una etiqueta `<script>` por lab, y el contrato arranca
desde la plantilla cuando no hay Studio —en su propia página los defaults *son* la
configuración—. Su marcado, su diálogo, su disparador y su animación quedan intactos, y
la suite asserta que allí no se crea ningún diálogo del Product Engine (0).

## 4. Pizza se traduce, no se convierte

Pizza es el único motor que no tenía ficha, y conserva su propio modelo:
`pizzaSliceOrbit.products[]`, con `demoContent:true` y `price:null`. El adaptador
traduce ese registro a los campos del contrato — y sólo por eso existe un diálogo
propio del Product Engine: **uno, no cinco**.

```
PIZZA PRODUCT RECORD → PRODUCT DETAIL ADAPTER → UNIFIED PRODUCT DETAIL
```

Nada convierte una pizza en uno de los seis platos: la suite comprueba que su id no
está en `dishes` y que el nombre mostrado es el de su propio registro.

## 5. Campos

`app-v4.fillDetail` escribe `textContent` en nodos con id propio y no conoce esta
capacidad, así que un campo se apaga **ocultando su nodo** — nunca borrando su
contenido y nunca editando Class 06. Se reaplica al abrir y ante cualquier cambio de
configuración, porque el motor rellena la ficha de nuevo mientras navega.

De paso cierra una arista que ya existía: un campo que el producto no tiene dejaba un
bloque vacío a la vista, y el nodo de alérgenos imprimía su prefijo fijo sin nada
detrás. Ahora ambos se ocultan.

## 6. Studio

Tarjeta **21 · Ficha del plato** en el panel Platos:

- **Activada** — ON/OFF
- **Apertura** — al pulsar el producto · mediante botón · ambos
- **Campos** — Descripción · Ingredientes · Origen · Técnica · Maridaje · Alérgenos ·
  Historia

Nueve controles, todos por `data-path` sobre el Project State existente:
persistencia tras reload, presencia en el export global, y Undo/Redo en el **mismo**
historial (asertados los tres).

## 7. Accesibilidad

La ficha compartida conserva lo que ya tenía: `Escape` en `bindGlobal()` de `app-v4`,
`#detail-close`, y el foco al botón de cierre al abrir. El diálogo propio del Product
Engine añade `role="dialog"`, `aria-modal="true"`, cierre por botón y por scrim,
`Escape`, y **devuelve el foco al disparador** — la suite lo demuestra con la traza
`ps-next → upd-close → ps-next`. Bajo `prefers-reduced-motion` no hay transiciones ni
blur y la ficha sigue abriendo, mostrando el producto y cerrando.

## 8. Fuera de esta fase

- **Circular Dish Rotator** no tenía ficha y darle una es capacidad nueva, no
  migración. Además su propia suite asserta que su lab no depende del motor compartido.
- **Scroll Traveler** es Page Motion: no selecciona productos. La suite comprueba que
  sigue con sus cinco anclas y que este archivo no lo menciona.
