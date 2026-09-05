# PROJECT 02 — ANCHOR SWAP / SPLIT DROP

> **STATUS: Ready for Human Visual Review.**
> Rama: `feat/anchor-swap-lab`, creada desde `main` con Project 01 ya integrado.
> Regla vigente: `CLASE N+1 = CLASE N APROBADA + NUEVA CAPACIDAD`.
> Este documento no aprueba nada. Aprueba Juanma tras revisión visual.

---

## 1. Contexto

Project 01 resolvió la **navegación** de producto: una colección que se explora en un
espacio 2.5D. Project 02 resuelve algo distinto y complementario: la **transición**.

No es otro carrusel. No es Depth Carousel V2. Es una capacidad de transición:

> **Objeto persistente + mundo que muta alrededor.**

Hay un único sitio en pantalla —la mano— y no se mueve nunca. Lo que cambia es el
producto que sostiene, y con él el fondo, el decor, el lettering y el copy.

## 2. Relación con el vídeo de referencia

De `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md`, sección **PROJECT 02**:

- la mano permanece como ancla y evita que el espectador pierda la referencia espacial;
- durante la transición coexisten temporalmente **dos estados**: producto saliente y
  entrante, mundo antiguo y nuevo;
- el fondo **se divide o desplaza** hasta completar el cambio.

No copiamos el diseño del vídeo. Extraemos el mecanismo.

## 3. Arquitectura

Contrato heredado de Project 01, deliberadamente sin cambios:

```text
ORBITAL ENGINE (app-v4 / class4-runtime-guard)   ← ESTADO AUTORITATIVO
        │  #dish-counter = única fuente de verdad del índice activo
        │
        ├── class6-product.js / class6-detail-bridge.js   ← ficha real
        ├── class8-depth-carousel.js                      ← Project 01 (aprobado)
        └── class9-anchor-swap.js                         ← SOLO la coreografía visible
```

- Ni segundo índice, ni segundo modelo de plato, ni ficha duplicada, ni persistencia propia.
- `index.html` **no se ha tocado**: el runtime se carga desde `class4-runtime-guard.js`,
  el mismo entrypoint aditivo que usa Project 01.
- Se reutiliza el modelo `dish.depthCarousel` que Project 01 ya añadió: `asset`, `word`,
  `accent`, `backgroundColor`, `foregroundDecor`, `backgroundDecor`. **No se ha creado un
  segundo contrato de datos.**
- Preset en Studio: `#motion-orbital-style` → **Anchor Swap**.

Ficheros nuevos: `class9-anchor-swap.js`, `styles-v9.css`,
`tests/class9-anchor-swap-e2e.mjs`, `tests/record-anchor-swap-video.mjs`,
`scripts/audit-anchor-hand.mjs`, `scripts/anchor-first-proof.mjs`.
Modificado: `class4-runtime-guard.js` (sólo el loader aditivo, al final).

## 4. Assets

```text
MANOS/                                   ← origen, intacto, no se toca
assets/anchor-swap/
├── source/
│   ├── anchor-hand-master.png           ← fuente de verdad
│   ├── anchor-hand-back-source.png
│   └── anchor-hand-front-source.png
├── runtime/
│   ├── anchor-hand-back.png             ← lo que carga el motor
│   └── anchor-hand-front.png
└── audit/                               ← evidencia de la auditoría
    ├── _audit-sheet.png
    ├── _first-proof.png
    ├── composite-back-plus-front.png
    ├── diff-vs-master.png
    ├── audit.json
    └── cup.json
```

## 5. Auditoría de la mano

`scripts/audit-anchor-hand.mjs` mide los tres PNG y **recompone BACK + FRONT sobre un
mismo lienzo para compararlos con el MASTER**, antes de escribir una sola línea del motor.

| | MASTER | BACK | FRONT |
|---|---:|---:|---:|
| Lienzo | 1122×1402 | 1122×1402 | 1122×1402 |
| Cobertura alpha | 27.87% | 23.79% | 5.83% |
| Bounding box | — | 862×1137 | 850×503 |
| Borde semitransparente | — | 6 835 px | 4 735 px |

**Recomposición BACK + FRONT vs MASTER**

| Métrica | Valor |
|---|---:|
| Mismo lienzo | **sí** |
| IoU | **0.9642** |
| Error medio por píxel | 5.26 |
| Píxeles discrepantes | 2.38% |
| Cobertura master / recompuesta | 27.87% / 27.63% |

**Conclusión: el split es fiable.** BACK es la palma, la muñeca y el pulgar; FRONT son
las cuatro yemas que deben cruzar por delante del producto. No ha hecho falta volver a
derivar las capas del master ni regenerar nada con IA.

### El hueco de la mano

`scripts/anchor-first-proof.mjs` mide, sobre el alpha real, el bolsillo vacío entre el
pulgar y las yemas: para cada fila calcula el mayor tramo interior sin tinta y toma la
banda alrededor del máximo.

```text
cup = { x 51.5% · y 30.1% · w 46.4% · h 22.4% }   del lienzo de la mano
```

El motor coloca el producto ahí, en porcentajes del propio contenedor de la mano, así
que producto y mano quedan alineados a cualquier tamaño. **No es un valor estimado a
ojo.**

## 6. First visual proof

Antes de construir nada, la puerta de calidad 1: `assets/anchor-swap/audit/_first-proof.png`
compone BACK + producto + FRONT con tres productos distintos. Las yemas cruzan por
delante del producto y el pulgar queda detrás: la mano **sujeta**, no está *detrás de una
imagen*. Sólo después de verlo se escribió el motor.

## 7. Modelo de capas

```text
L0 .as-bg-a          mundo antiguo, a sangre                rate .20
L1 .as-bg-b          mundo nuevo, recortado por el progreso
L2 .as-decor-back    ingredientes de fondo + atmósfera      rate .35
L3 .as-word          lettering                              rate .55
L4 .as-anchor-back   la mano, detrás del producto
L5 .as-product-out   producto saliente                      rate 1.00
L6 .as-product-in    producto entrante                      rate 1.00
L7 .as-anchor-front  las yemas, delante del producto
L8 .as-decor-front   ingredientes en primer plano           rate 1.20
L9 copy · controles · cursor
```

`L4 < producto < L7` es el preset entero. Todo lo demás lo acompaña.
El ancla es lo único que **no** viaja: se le permite un asentamiento de 3 px.

## 8. Modelo de progreso

```text
progress: 0 ─────────── 0.5 ─────────── 1
          reposo      crossover      confirmado
```

- Lo gobierna directamente el arrastre vertical, no un umbral que dispara al final.
- **0.25 es visualmente el 25%**, 0.5 es el crossover real, 0.75 es el 75%.
- Arrastrar hacia atrás lo revierte de forma continua.
- El índice se compromete **en el crossover**, con histéresis (0.55 al avanzar, 0.45 al
  retroceder), de modo que el copy sigue realmente al gesto y una reversión lo descompromete.

## 9. Gesto

| | Desktop | Mobile |
|---|---|---|
| Arrastre | vertical, continuo, reversible | swipe táctil real |
| Unidad | 46% de la altura del shell | 42% |
| Release | por debajo de 0.42 y sin velocidad → cancela; si no, completa | igual |
| Prev / Next | sí | sí |
| Wheel | sí (throttle 560 ms) | n/a |
| Teclado | ↑↓ ←→ navegan, Enter abre ficha | n/a |
| Indicadores | click directo | click directo |
| Click al producto | abre la ficha real | abre la ficha real |

Arrastrar hacia abajo trae el siguiente producto desde arriba; hacia arriba, el anterior
desde abajo. La causalidad es explícita.

## 10. Background split

Dos mundos puros, nunca mezclados por transparencia:

```text
progress 0.00   ░░░░░░░░░░░░  A
progress 0.30   ▓▓▓▓░░░░░░░░  B invadiendo desde arriba
progress 0.50   ▓▓▓▓▓▓░░░░░░
progress 1.00   ▓▓▓▓▓▓▓▓▓▓▓▓  B
```

`clip-path: polygon()` con arista inclinada, gobernada por `progress`. Al retroceder la
arista retrocede y A se revela de nuevo. El acento se mantiene en A y cruza a B con
`smoothstep(0.44, 0.56)`: puro el 88% del recorrido, sin el punto gris de una
interpolación RGB larga.

Medido por el test: la arista recorre **9 → 34 → 59 → 84 → 109 %** para
progress 0 / .25 / .5 / .75 / 1.

## 11. Product swap

- El saliente cae (o sube) `0.58 × altura del shell`, encoge un 14% y rota 5°.
- El entrante llega desde el lado contrario, creciendo de 0.86 a 1.
- **Coexisten**: a 0.5 el saliente está a opacidad ~1 y el entrante ya por encima de 0.2,
  y ocupan posiciones verticales distintas — el test exige que la separación supere media
  altura de producto, para que no sea un apilamiento.
- Ambos viven entre las dos capas de la mano.

## 12. Decor

Se reutiliza el concepto validado en Project 01, con el mismo modelo de datos: un grupo
por producto y por capa, con la atmósfera teñida por el acento del plato. Cada grupo
lleva su propio rate (`.35` detrás, `1.20` delante) y su propia opacidad, y entra y sale
con su producto. El test comprueba que el decor **cambia cuando cambia el producto**.

## 13. Copy

Un solo bloque, nunca dos superpuestos:

```text
0.00 → 100%   ·   0.35 → ~30%   ·   0.50 → ~0%   ·   0.65 → ~30%   ·   1.00 → 100%
```

El crossover pertenece al producto, al ancla y a los mundos. El motor base sigue
escribiendo título, meta y descripción; precio, ingredientes e indicadores los escribe
este preset desde `#dish-counter`, la misma fuente, así que no pueden discrepar.

## 14. Desktop / Mobile / Reduced motion

- **Desktop**: mano a la derecha, copy en columna editorial izquierda con caída de luz
  propia, controles abajo a la izquierda, lettering en la banda superior.
- **Mobile**: composición propia — la mano se centra, el copy y los controles pasan al
  flujo normal bajo la escena, el scrim se reorienta a 6° porque el texto va debajo, y el
  lettering sube a 26vw. No es una reducción del desktop.
- **Reduced motion**: la transición se resuelve casi instantánea; ancla, producto, copy,
  navegación y ficha siguen disponibles. Verificado por test.

## 15. Performance

- Sólo se animan `transform`, `opacity` y `clip-path`; ningún layout por frame.
- Un único listener por tipo de evento, en `document`, en fase de captura y guardado por modo.
- Los mundos son gradientes CSS: dos capas, sin coste de red.
- Las manos son dos PNG (639 KB + 217 KB) que se cargan una vez y no se re-escalan.
- El decor de fondo va deliberadamente pequeño y muy desenfocado: un trazo de aceite a
  110 px con blur lee como mancha; a 84 px con brillo bajo lee como profundidad.

## 16. Errores encontrados

### P2-E1 — El observer del contador abortaba la propia transición

**Síntoma.** Al pasar del 55% el gesto se reseteaba solo: `progress` volvía a 0 y la
escena reiniciaba.

**Causa.** El índice se compromete en el crossover, lo que cambia `#dish-counter` **a
mitad de gesto**. El observer leía ese cambio como si viniera de fuera y llamaba a
`goTo()`, que reinicia la transición.

**Solución.** Un gesto en vuelo es el dueño de la escena: el observer se retira mientras
`progress > 0.001`, además del latch de sincronización heredado de Project 01.

### P2-E2 — La capa de producto de Clase 06 reconstruía la escena a mitad de gesto

**Síntoma.** Con el fallo anterior corregido, el progreso seguía cayendo a 0 justo
después del crossover.

**Causa.** Confirmar el índice hace que la capa de producto de Clase 06 se vuelva a
aplicar y reconstruya `#orbit-stage`. Mi `MutationObserver` sobre ese nodo llamaba a
`rebuild()`, que pone `progress = 0`.

**Solución.** El rebuild se aplaza (`pendingRebuild`) mientras hay gesto en vuelo y se
ejecuta al cancelar. Al completar no hace falta: `complete()` ya reconstruye el par.

**Validación.** `the split drop tracks the gesture`, que pasó de `9 → 34 → 59 → 9 → 9`
a `9 → 34 → 59 → 84 → 109`.

### P2-E3 — Errores del harness

- El bucle que comprobaba el cambio de producto vivía dentro de la página y leía antes de
  que terminase el tween de 850 ms, arrastrando el estado equivocado a todas las
  aserciones posteriores. Ahora lo conduce el runner, que sí espera.
- `getComputedStyle().clipPath` resuelve a píxeles **o** a porcentajes según el caso; el
  parser acepta ambos.

## 17. Tests

**59/59** en desktop 1440×900, móvil 390×844 y reduced motion.

Cobertura: el ancla existe y está cargada · **el ancla no se mueve** (deriva máxima
medida ≤ 6 px entre progress 0, 0.5 y 1) · **el producto está entre las dos capas de la
mano** · orden de capas back < producto < front · al menos tres productos · el producto
sostenido cambia realmente · saliente y entrante coexisten al 50% y en posiciones
distintas · los dos mundos están en escena · el copy se aparta en el crossover · el split
sigue al gesto · arrastrar hacia atrás revierte · un release cancelado no compromete nada
· un gesto completado sí · el arrastre y el swipe completan el cambio · el decor cambia
con el producto · copy, precio e indicador describen el mismo plato · la ficha real se
abre y la escena sobrevive · sin overflow · **Project 01 sigue funcionando y se aparta**
· **Orbital se restaura intacto** · Studio abre · sin errores de consola.

### La puerta de oclusión es un test de píxeles, no de geometría

Project 01 nos costó tres iteraciones aprender que `getBoundingClientRect()` demuestra
que un elemento existe, no que se ve. Aquí la comprobación de que el producto queda
**entre** las dos capas de la mano se hace contra el frame buffer: se calcula el
solapamiento entre yemas y producto, se captura ese recorte, se ocultan las yemas, se
vuelve a capturar y se exige que los dos fotogramas difieran. Si las yemas no estuvieran
realmente pintando encima, las imágenes serían idénticas.

## 18. Known issues

1. **PRODUCT ASSET LIMITATION.** Los tres productos del LAB son las composiciones de
   comida recortadas de Project 01: fotografía cenital de plato sin vajilla. Sostenidas
   por la mano funcionan mejor de lo esperado —la primera prueba visual lo confirma— pero
   no son objetos fotografiados *para ser sostenidos*. Una copa, un bowl en tres cuartos
   o un cucurucho darían otro salto. El motor los aceptaría sin tocar código: sólo cambia
   `dish.depthCarousel.asset`.
2. **Una sola mano, una sola pose.** El ancla no reacciona al peso ni al tipo de producto.
   Las variantes B (mesa), C (copa) y D (utensilio) del documento maestro no están
   implementadas.
3. **Sin panel en Studio.** El preset se selecciona, pero no hay controles de intensidad,
   dirección ni tamaño del ancla. Deliberado: la misión pedía probar la experiencia primero.
4. **Un transitorio en `goTo`.** Tras un salto directo a un índice lejano, el contador
   base puede quedar un índice por detrás durante un instante antes de resincronizarse.
   No afecta al arrastre ni a prev/next, que son los caminos principales, pero está aquí
   sin adornar.
5. **El ancla no se recorta contra el copy.** En viewports muy estrechos la muñeca puede
   acercarse a la columna de texto; el scrim lo compensa, pero no hay una zona reservada
   estricta como en Project 01.
6. **Sin traza de FPS en dispositivo real.**

## 19. Qué es reutilizable para el Restaurant Motion Engine

1. **La arista única** que gobierna a la vez el split de fondo y el relevo de lettering
   es el mismo primitivo que Project 01 usó en horizontal. Debería extraerse: es un
   `WipeEdge(progress, direction, skew)` común.
2. **El modelo de progreso reversible con commit en el crossover** —con histéresis y
   cancelación— es genérico y sirve para cualquier transición futura.
3. **El contrato de ancla** (`back` / `product` / `front` + un `cup` medido sobre el
   alpha) vale para cualquiera de las variantes B, C y D sin tocar el motor.
4. **La auditoría de assets** (`audit-anchor-hand.mjs`) es reutilizable para validar
   cualquier ancla que suba un restaurante.
5. **Los grupos de decor con rate propio** ya se comparten con Project 01 y confirman que
   merecen subir a la capa común antes de escribir Project 03.
6. **La puerta de oclusión por píxeles** debería ser el patrón de test por defecto para
   toda capacidad que dependa de orden de capas.
