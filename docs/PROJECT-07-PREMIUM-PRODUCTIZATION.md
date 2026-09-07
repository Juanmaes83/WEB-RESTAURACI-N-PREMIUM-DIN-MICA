# PROJECT 07 — PREMIUM PRODUCTIZATION PASS

> **STATUS: READY FOR HUMAN VISUAL REVIEW — PREMIUM PASS.**
> Rama: `feat/pizza-slice-orbit-premium`, creada desde `main` en
> `05660ef876422e554a5d5f4d90619e8ca0e24c4f` (Projects 01, 02, 03, 06 Fase 2 y 07
> aprobados e integrados). No se ha mergeado a `main`.
> Este documento no aprueba nada. Aprueban Juanma + ChatGPT tras revisión visual.

---

## 1. Qué cambia y qué no

El motor de Project 07 está **aprobado** y no se reconstruye. Este paso añade el mundo
de producto **alrededor** de él:

```text
SLICE + HEADLINE + INGREDIENTS + MOOD + COLOR WORLD +
BACKGROUND TYPOGRAPHY + CTA + PERSONALIZATION + ORDER / RESERVATION
```

todo sincronizado con **el mismo `activeIndex` derivado de `rotationProgress`**.

Se han tomado del lenguaje de Project 06 —no de su motor— el modelo de contenido, la
coreografía editorial, los principios de personalización y los adaptadores de
comercio. Project 06 mueve **una** pizza circular completa; Project 07 mueve **ocho**
porciones registradas independientes, y esa imagen completa no se toca aquí.

### Ficheros

Nuevos: `class12-pizza-premium.js`, `styles-v12.css`,
`tests/class12-pizza-premium-e2e.mjs`, `tests/record-pizza-premium-video.mjs`,
`scripts/check-pizza-premium.mjs`.

Modificados, mínimamente y de forma aditiva:

| Fichero | Cambio | Por qué era necesario |
|---|---|---|
| `class4-config.js` | rama `pizzaSliceOrbit` | los datos de producto, editables en Studio |
| `class11-pizza-slice-orbit.js` | `subscribe(fn)` de sólo lectura | la capa premium necesita saber cuándo repintó la órbita |
| `app-v4.js` | `RestaurantStudioConfig` + evento `restaurant:config-applied` | escribir y reaccionar a la configuración **por el sistema existente** |
| `class4-runtime-guard.js` | loader aditivo | mismo patrón que 01/02/03/07 |

`index.html` no se ha tocado.

## 2. Product data layer

La **geometría** vive en `slices-manifest.json` (generada por el ingest, no editable);
la **historia y el comercio** viven en `RestaurantDefaults.pizzaSliceOrbit`, unidas por
`id`, editables en Studio y persistidas por el estado de proyecto existente.

```js
{ id, name, ingredients, price, descriptor, mood,
  headlineOverline, headlineLead, headlineTail,
  accent, background:{a,b,glow}, orderUrl, available, demoContent }
```

### Verdad de datos

Las ocho fichas llevan **`demoContent: true`** y **`price: null`**. Los ingredientes y
el copy editorial son material de demo para probar la composición; **no se presentan
como información oficial del restaurante** y el bloque lleva la etiqueta `DEMO CONTENT`
a la vista. Un `price === null` **no se renderiza en absoluto**: no hay precio
inventado, y el elemento se oculta en lugar de mostrar un guion o un cero.

## 3. Headline system

Tres niveles editoriales, todos por producto:

```text
TONIGHT, CHOOSE            ← overline
the slice with             ← lead
DIAVOLA                    ← nombre héroe, parte de la composición
Fire at the centre of the table.   ← tail
FIRE · spicy · smoky · bold        ← mood + descriptor
```

El nombre es tipografía de display grande (`clamp(46px,5.6vw,92px)`). Al cruzar una
frontera de porción, el bloque entero hace un relevo escalonado —blur, translate,
fade— y **asienta junto** al héroe, al acento y a los ingredientes. No es un slideshow
independiente: el texto se repinta cuando **el índice del motor** cambia, y sólo
entonces.

## 4. Ocho mundos cromáticos

| Producto | Mood | Producto | Mood |
|---|---|---|---|
| 4 Quesos | CREAM | Margarita | CLASSIC |
| Barbacoa | SMOKE | Mortadela y Pistacho | SILK |
| Carbonara | GOLD | Prosciutto Funghi | FOREST |
| Diavola | FIRE | Verduras | GARDEN |

Cambian **acento, halo ambiente, fondo radial suave, detalle de línea, acento del
selector y tono de la tipografía de fondo**. La marca y la arquitectura no cambian:
un sistema premium con ocho personalidades, no ocho webs.

El interruptor `perProductWorlds` los apaga y deja **un único acento de marca** — con
test.

## 5. Background typography

Tres profundidades detrás de la órbita, todas de contraste muy contenido: **mood word**
(hasta 300px, opacidad .085), **índice 01–08** y **nombre del producto**. Reaccionan al
producto seleccionado con un relevo de blur/tracking, derivan un parallax leve del
progreso fraccional durante el arrastre, y se difuminan durante el giro rápido para no
competir con las porciones.

## 6. Hero emphasis

**Sin tocar la geometría aprobada.** El héroe gana presencia sólo con luz y sombra:
`drop-shadow` más profunda, `brightness 1.06`, `saturate 1.1`, `contrast 1.05`, y el
charco de luz de la estación teñido con el acento del producto. Las vecinas bajan a una
sombra plana. Al asentarse, el borde de la estación da **un único pulso de luz**.

Ni `--ps-x`, ni `--ps-y`, ni `--ps-rot`, ni `--ps-scale`, ni el ápice, ni la posición de
la estación se tocan — y hay una guarda de CI que falla si `styles-v12.css` intenta
escribir cualquiera de ellos o reposicionar `.ps-station`.

## 7. Copy ↔ hero: el puente

Una línea de acento desde la columna editorial que **termina en la punta de la cuña**,
con un marcador que pulsa al asentar. Su geometría la escribe el renderer a partir de
la posición real de la estación en cada frame: un porcentaje fijo dejaba la línea
apuntando al vacío en cuanto cambiaba el grid o el hub.

## 8. Coreografía del spin

El motor de spin aprobado **no se toca**; sólo la presentación. Las fases se **derivan**
midiendo la velocidad del progreso que publica el motor, no con un temporizador propio:

| Fase | Historia | Tipografía de fondo | CTA |
|---|---|---|---|
| `drag` | completa, parallax leve | leve deriva | atenuado |
| `fast` | ingredientes y tail fuera | blur y tracking | atenuado |
| `decelerating` | vuelven al 45% | blur medio | atenuado |
| `resolving` | al 85% | resolviendo | volviendo |
| `settled` | 100% legible | claridad máxima | presente + pulso |

Una clase en la sección gobierna todas las capas, así que copy, tipografía y puente no
pueden desincronizarse entre sí.

## 9. CTA contextual y comercio

`Order <producto>` + `Reserve table`, con prioridad invertible desde el perfil. El CTA
lee **el producto activo del motor**; no hay segundo estado.

Con URL configurada se abre con contexto
(`?source=pizza-slice-orbit&product=<id>&name=<nombre>&action=order`). Sin URL **no se
simula ningún backend**: se emiten los intents y se dice la verdad en pantalla
(«No ordering endpoint is configured yet»).

```text
pizza:commerce-intent      ┐
pizza:order-request        ├ payload {productId, productName, activeIndex, action, source}
pizza:reservation-request  ┘
```

La nota de comercio se **borra al cambiar de producto**: dejarla puesta la convertía en
un mensaje sobre un producto que no era el suyo.

## 10. Panel de personalización

Una tarjeta añadida al panel Motion existente — **sin tocar su contenido**. Usa el
binding `[data-path]` del propio Studio, así que todo persiste por el estado de proyecto
existente y viaja con import/export. **No hay sistema de settings paralelo.**

Restaurante: nombre · colección · acento de marca · mundos por pizza on/off · tipografía
de fondo on/off · acción principal (Order/Reserve) · Order URL · Reservation URL.
Por producto (las ocho): nombre · ingredientes · descriptor · mood · acento · precio
opcional · Order URL. **64 controles enlazados.**

Studio enlaza sus inputs una sola vez al arrancar, así que un panel añadido después no
tenía forma de escribir en el estado. `window.RestaurantStudioConfig` expone el mismo
camino `mutate → applyAll → persist` que ya usan esos inputs, y `applyAll` emite ahora
`restaurant:config-applied`: cualquier runtime puede reaccionar a un cambio de
configuración venga de un input, de un `set` programático, de un import o de un undo —
sin sondeo, que es a lo que recurre un preset cuando no hay señal.

## 11. Contrato de sustitución de assets

Aquí no hay un único asset: el restaurante puede aportar las ocho porciones. **Una
imagen subida no entra en producción sin registro.** Al subirla se mide con el mismo
método que el ingest —alfa, ápice, eje, longitud, apertura— y sólo se acepta si produce
una cuña que **cabe en la estación**. Si no:

```text
Asset requires registration: the wedge opens 40.2° and the station accepts up to 26.5°.
```

y la producción **se queda como estaba**. Una que pasa se guarda como *pending* con su
registration calculada, para que el pipeline emita su runtime asset — nunca se
substituye en silencio. Logo y atmósfera se aceptan sin pasar por registro porque no
afectan al motor.

## 12. Persistencia

Texto, paleta y URLs → **el estado de proyecto existente** (`RestaurantStore`), vía
`data-path`. Binarios → `RestaurantStore.saveMedia` (IndexedDB con fallback), que ya
existía. Nada de almacenamiento paralelo.

Verificado: una edición en el panel sobrevive a un reload completo junto con la
elección de preset.

## 13. Mobile

La geometría móvil aprobada **no se toca**. La historia se reordena y se recorta:
nombre grande, descriptor, ingredientes en una línea, contador, Discover y CTA. El tail
y el puente se ocultan, la tipografía de fondo se reduce. Sin overflow nuevo.

El contador venía del bloque de cabecera del motor, que la editorial premium sustituye:
se ha **reconstruido desde el mismo índice** en lugar de perderlo.

## 14. Tests

| Suite | Resultado |
|---|---|
| `class12-pizza-premium-e2e.mjs` (nuevo) | **90/90** |
| `class11-pizza-slice-orbit-e2e.mjs` (motor aprobado, **sin tocar**) | **94/94** |
| `class10-orbital-food-slider-e2e.mjs` | 91/91 |
| `class9-anchor-scenes-e2e.mjs` | 80/80 |
| `class8-depth-carousel-e2e.mjs` | 114/114 |
| Class 05 · 06 · 07 · scene audit · Project 06 contract | PASS |

Que la suite del motor siga intacta y verde **es** la prueba de que este paso no lo
alteró. La suite premium cubre: ocho fichas con el esquema completo · ids unidos al
manifest · demo marcado y sin precio inventado · headline, ingredientes, descriptor,
paleta, palabra de fondo, índice, contador, CTA y héroe **todos siguiendo el índice del
motor** · ausencia de segundo estado de producto en cuatro progresos incluidos negativos
· ocho mundos distintos · el interruptor de mundo único · el spin suprimiendo el detalle
en fase rápida y restaurándolo al asentar · héroe = headline = ingredientes = CTA tras el
spin · payloads de order y reservation · nada falsificado sin URL · URL abierta con
contexto · prioridad de CTA invertible · dos uploads rechazados por registro y la
producción intacta · la estación sin moverse bajo la capa premium · registration
idéntica · el panel sin perturbar Motion · persistencia tras reload · y Projects 01, 02,
03 y Elegant intactos.

`scripts/check-pizza-premium.mjs` guarda lo que el comportamiento no ve: las constantes
de geometría aprobadas siguen literalmente iguales, la capa premium no contiene
`rotationProgress`, `setProgress`, `selectedIndex`, `full-pizza` ni lógica de Project 06,
y el CSS premium no escribe ninguna variable de geometría ni reposiciona la estación.

## 15. Evidencia

| | |
|---|---|
| Desktop | `premium-01-diavola-idle` · `02-quattro-formaggi` · `03-verduras` · `04-half-drag` · `05-spin-fast` · `06-spin-deceleration` · `07-spin-result` · `08-personalization-panel` · `09-order-cta` |
| Mobile | `premium-mobile-01-idle` · `02-story` · `03-spin` · `04-result` |
| Reduced motion | `premium-reduced-motion.png` |
| Regresión | `premium-regression-orbital-food.png` |
| Vídeos | `tests/video/pizza-premium-desktop.webm` · `pizza-premium-mobile.webm` |

El grabador se niega a grabar si el preset no está activo **o** si la capa premium no
está componiendo el mundo.

## 16. Known issues

1. **En móvil las vecinas ±1 siguen tocando los bordes** (issue heredado del motor
   aprobado, ~18 px de caja rotada). Corregirlo exige mover el hub aprobado, así que se
   deja documentado tal como pedía la misión.
2. **La palabra de fondo queda parcialmente tras el header en móvil.** La tipografía de
   fondo está autorizada a reducirse en móvil y no lleva información única.
3. **El puente se oculta en móvil**: en 390 px la línea competía con la historia.
4. **La subida de porción queda en *pending***, no entra en producción: hace falta que el
   pipeline de ingest emita el runtime asset. Deliberado — es lo que evita que un asset
   sin registrar llegue al héroe.
5. **Sin datos reales de precio ni de disponibilidad.** El esquema los espera; hasta
   entonces no se muestra ningún precio.
6. **El copy editorial de demo está en inglés** y los ingredientes en español, como en el
   material de Project 06. Un restaurante real reemplaza ambos desde el panel.
7. **Sin traza de FPS en dispositivo real.**
8. `tests/class5-orbital-e2e.mjs` sigue en rojo **como en `main`**: contrato obsoleto
   ajeno a este proyecto y fuera del workflow Motion.

## 17. Estado de revisión

**READY FOR HUMAN VISUAL REVIEW — PREMIUM PASS.** No aprobado, no cerrado, no mergeado.

Lo que conviene juzgar: si el héroe se ha convertido en el centro narrativo de un mundo
completo; si los ocho mundos se sienten como un sistema con ocho personalidades y no
como ocho webs; si la tipografía de fondo aporta espectáculo sin robar legibilidad al
producto; si el spin cuenta ahora una historia (rápido → tensión → aterrizaje → relato →
CTA); si la personalización se siente de nivel restaurante; y si el motor aprobado se
percibe exactamente igual de bueno que antes.

Primera evidencia recomendada: `premium-07-spin-result.png`, después el vídeo desktop
completo, y `premium-03-verduras.png` junto a `premium-01-diavola-idle.png` para juzgar
los mundos cromáticos.
