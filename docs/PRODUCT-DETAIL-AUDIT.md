# UNIFIED PRODUCT DETAIL — AUDITORÍA PREVIA

Estado real de la ficha de producto en cada motor, leído del código en `0997e3a`
(main), **antes** de escribir una línea de la capacidad unificada. La misión exige esta
auditoría primero y con razón: tres de las suposiciones de partida eran falsas.

---

## 1. Cómo funciona hoy la ficha compartida

No hay "el modal de Editorial Flow". Hay **una** ficha, en `index.html`, y tres piezas
que colaboran sobre ella:

| Pieza | Responsabilidad real |
|---|---|
| `index.html` | el marcado de `#dish-detail`, con `#detail-visual` y `.detail-copy` |
| `app-v4.js` | `openDetail()` / `closeDetail()` sobre ese nodo; expuesto en `window.RestaurantOrbit.openDetail`; `Escape` global en `bindGlobal()` |
| `class6-product.js` | rellena el contenido desde `activeDishId()`, inyecta `#class6-story`, emite `restaurant:dish-detail-open` / `-close` y hace la **transición GSAP Flip** del plato real hacia `#detail-visual` |
| `class6-detail-bridge.js` | resuelve qué plato es el héroe cuando las órbitas se solapan (hit-test desde la fase de captura de `.orbit-shell`) y abre ese |

`activeDishId()` elige el plato **geométricamente más cercano al centro** del shell, con
una excepción: un preset puede marcar su héroe con `data-orbit-hero="1"` (lo introdujo
Project 03, cuyo héroe está descentrado a propósito). Ahí vive ya, de facto, el contrato
de "producto activo".

Editorial Flow **no tiene ficha propia**: reutiliza esta. Lo que la auditoría desmiente
es la premisa de "copiar el modal motor por motor" — el 80 % del trabajo ya está
compartido.

## 2. Clasificación por grupos

### GROUP A — ya usan la ficha compartida (6)

Elegant Orbit · Urban Acrobatics · Editorial Flow · Cinematic Depth Carousel ·
Precomposed Anchor Scenes · Orbital Food Slider.

Todos montan sus platos en `#orbit-stage` y heredan `openDetail()` + el bridge.
**No necesitan adaptador**: sólo conectarse al futuro interruptor ON/OFF.

### GROUP B — tienen ficha propia (2)

| Motor | Ficha | Apertura |
|---|---|---|
| Dish Stage (Class 13) | `[data-ds-detail]`, con `openDetail()` / `closeDetail()` propios | arrastre corto (`Math.abs(dist) < .18`) o el botón *Explore dish* |
| Cinematic Product Rail (Class 15) | `#cpr-detail` con título, meta, historia e ingredientes propios | su propio diálogo |

Ambos viven en su **propia página** (`labs/`), con su propio DOM. No comparten
`#dish-detail` porque en su página no existe. Adaptarlos significa que su ficha se
alimente del contrato común, **no** mover su marcado.

### GROUP C — Pizza (2)

Pizza Slice Orbit (Class 11) y Pizza Premium (Class 12) **no abren ninguna ficha**: cero
referencias a `openDetail`/`dish-detail`. Tienen su propio modelo de producto en
`pizzaSliceOrbit.products[]` (ocho registros marcados `demoContent:true` con
`price:null`) y en lugar de ficha emiten intents de comercio
(`pizza:commerce-intent`, `pizza:order-request`, `pizza:reservation-request`).

Aquí el adaptador es obligatorio y es lo que la misión ya anticipa:
`PIZZA PRODUCT RECORD → PRODUCT DETAIL ADAPTER → UNIFIED PRODUCT DETAIL`.
El modelo de Pizza se conserva tal cual; se traduce, no se sustituye.

### Circular Dish Rotator (Project 06) — hallazgo

**No tiene ficha de producto en absoluto**: cero coincidencias de
`detail|modal|dialog|Escape` en `labs/project06-circular-dish-rotator/*.js`. Su lab es
autónomo por contrato (su propia suite asserta que *no depende del motor de movimiento
compartido*). Darle ficha es **capacidad nueva**, no una migración — y por tanto
requiere su propia revisión visual, no colarse en esta.

### GROUP D — fuera del sistema

Scroll Traveler (Project 09) es PAGE MOTION: no selecciona productos y no debe tocarse.

## 3. Consecuencias para el diseño

1. **No crear Class 21 por numeración.** La ficha compartida ya existe y ya es premium
   (Flip desde el plato real). Lo correcto es **elevar** lo que hoy hacen `app-v4` +
   `class6-product` a un contrato con nombre — `RestaurantProductDetail.open(product,
   options)` / `.close()` / `.isOpen()` — que envuelva la implementación actual sin
   reescribirla, y que los motores del GROUP B y C consuman por adaptador.
2. **El "producto activo" ya tiene dueño.** `activeDishId()` + `data-orbit-hero` es el
   contrato de facto; el sistema unificado debe leer de ahí en el GROUP A y pedir al
   adaptador el producto activo en B y C. No debe existir un segundo estado de selección.
3. **La regla de "clic en producto lateral"** ya la resuelve el bridge para el GROUP A
   (`nearestIndex` + navegación previa). Los adaptadores de B/C tienen que declarar
   explícitamente qué es "activo" para no abrir la ficha del producto equivocado.
4. **Pizza no debe convertirse en los seis platos normales.** Su adaptador traduce
   `products[i]` a los campos del contrato y omite lo que no existe: `price:null` no se
   renderiza, y nada se inventa.
5. **Campos vacíos se ocultan.** `RestaurantDefaults.dishes` no tiene todos los campos
   en todos los platos; el contrato debe ocultar bloques vacíos, nunca rellenarlos.
6. **Accesibilidad: hay base, no está completa.** `Escape` ya se gestiona en
   `bindGlobal()` de `app-v4`; el retorno de foco al disparador y `aria-modal` hay que
   verificarlos por motor antes de prometerlos.

## 4. Estado de esta fase

Auditoría **completa**. Implementación **no iniciada**: rama `feat/unified-product-detail`
creada desde `origin/main` (`0997e3a`), base segura que no arrastra CLASS 20 —
pendiente de revisión humana— para no apilar dos cambios visuales sin revisar.

Orden de trabajo previsto, en commits separados como pide la misión:

1. `feat(product-detail): shared product-detail contract` — el envoltorio con nombre
   sobre la ficha existente, sin tocar geometría ni motores.
2. `feat(product-detail): studio configuration` — `productDetail.enabled` y campos, en
   el Studio existente y en el Project State existente.
3. `feat(product-detail): adapters` — GROUP B (Dish Stage, Rail) y GROUP C (Pizza).
4. `test(product-detail): cross-motion regression` — los 19 casos de la misión.
5. `docs(product-detail): architecture and status`.
