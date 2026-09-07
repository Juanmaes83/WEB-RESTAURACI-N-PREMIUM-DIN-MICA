# PROJECT 07 — PIZZA SLICE ORBIT / HERO SELECTOR

> **STATUS: READY FOR HUMAN VISUAL REVIEW.**
> Rama: `feat/pizza-slice-orbit-lab`, creada desde `main` con Projects 01, 02 y 03
> aprobados e integrados. No se ha mergeado a `main`.
> Este documento no aprueba nada. Aprueban Juanma + ChatGPT tras revisión visual.

---

## 1. Qué es

**THE FRAME STAYS. THE PRODUCTS MOVE. EVERY PRODUCT FITS THE SAME FRAME.**

Ocho porciones de pizza independientes recorren una órbita radial. Hay **una estación
fija** en la composición que no se mueve nunca: la porción activa entra en ella,
normalizada por sus propios datos de registro, y rellena el mismo contorno siempre.

No es la pizza completa girando, no es una ruleta, no es Project 03 con imágenes
triangulares. Las cuñas **radian hacia fuera desde un centro hueco** con escalas
propias, así que se leen como ocho productos en órbita y no como una pizza montada. La
imagen de la pizza completa pertenece a **Project 06** y aquí no se mueve nunca.

## 2. Baseline

| | |
|---|---|
| BASE MAIN HEAD | `7f6e52832c80993be156146b71346df5d0efae2d` |
| PROJECT 01 | merged (aprobado 2026-09-05) |
| PROJECT 02 | merged (aprobado 2026-09-07) |
| PROJECT 03 | merged (aprobado 2026-09-07) |
| Rama Project 07 | `feat/pizza-slice-orbit-lab` |

## 3. Los assets reales

Ocho PNG RGBA de **1254×1254** en `assets/pizza-motion/source/slices/`, tratados como
**masters inmutables**: se leen, nunca se sobrescriben, recortan ni recomprimen. Un test
comprueba que siguen ahí byte a byte.

La pizza completa (`source/full-pizza/`) se inspeccionó **sólo como referencia visual**.
Un test comprueba que no aparece en el escenario de Project 07.

## 4. Auditoría y normalización — el paso que decide el proyecto

Las ocho comparten lienzo pero **no ocupan lo mismo dentro de él**, así que las
dimensiones de la imagen no son registro. Lo medido por `scripts/ingest-pizza-slices.mjs`:

| slice | bbox | apex | longitud | eje | semiángulo |
|---|---|---|---:|---:|---:|
| quattro-formaggi | 958×1208 | 614,1225 | 1207.0 | 0.18° | 23.38° |
| barbacoa | 966×1217 | 614,1231 | 1216.0 | 0.26° | 23.33° |
| carbonara | 965×1210 | 614,1227 | 1209.0 | 0.31° | 23.42° |
| **diavola** | 936×1070 | 640,1156 | **1069.8** | −2.19° | **25.62°** |
| **margarita** | 924×1069 | 635,1157 | **1068.7** | −2.07° | **25.47°** |
| mortadela-pistacho | 961×1205 | 613,1224 | 1204.1 | 0.62° | 23.44° |
| prosciutto-funghi | 967×1220 | 641,1237 | 1219.1 | −0.78° | 23.11° |
| **verduras** | 938×1080 | 642,1164 | **1079.6** | −1.85° | **25.51°** |

Tres porciones (**diavola, margarita, verduras**) son un 12% más cortas y están cortadas
más abiertas. Eso no es un defecto de las fotos: es cómo se cortaron.

### El ancla es el ápice

Una cuña **radia desde su punta**, así que la punta es el ancla de registro: si todos los
ápices caen en el mismo punto, con el mismo eje y la misma longitud ápice→corteza, todas
llenan el mismo contorno. `registration` por porción:

```js
registration: { scale, offsetX, offsetY, rotationBias, apex:{x,y} }
```

El motor **escala y rota alrededor del ápice propio de la porción** y luego lleva ese
ápice al ápice canónico. Cero condicionales por porción dentro del renderer.

### Resultado

```text
longitud: dispersión 0.00%      eje: dispersión 0°
apertura: dispersión 2.51°      estación: margen mínimo 0.9°, ninguna se sale
```

La **apertura no se puede normalizar**: cambiarla deformaría la comida. Así que la
estación se dibuja para **contener** la más abierta más un margen, y las ocho caben. Ése
es el requisito real, y es el que se verifica.

Artefactos: `assets/pizza-motion/audit/slice-contact-sheet.png` ·
`slice-registration.json` · y la prueba obligatoria
**`tests/screenshots/pizza-slice-orbit-registration-proof.png`**, con las ocho
normalizadas sobre el mismo contorno.

Dos errores propios que la prueba visual destapó antes de seguir, tal como pide §20:

1. el semiángulo se medía con `atan` sobre la **cuerda** de la corteza cuando
   `cuerda/2 = R·sin(semi)`, así que salía **corto** y el contorno cortaba la corteza;
2. las esquinas del contorno se colocaban a la altura completa del radio con un
   desplazamiento tangente, lo que dibuja el triángulo **circunscrito** al sector en vez
   del sector. Las esquinas de un sector están **sobre** la circunferencia:
   `(ápice ± R·sin(semi), ápice − R·cos(semi))`.

## 5. Runtime assets

`assets/pizza-motion/runtime/slices/<id>.webp`, 1000×1000 con transparencia, generados
desde los masters sin hornear el registro.

```text
8 fuentes  12 732 KB   →   8 runtime  1 732 KB      (7.3× más ligero)
```

El héroe y sus dos vecinas cargan `eager`; el resto de la órbita `lazy`.

## 6. Estado canónico

**Una sola variable continua**: `rotationProgress`. 1.0 = una porción, 8.0 = una vuelta
completa = 360°, 1 porción = 45°.

```text
rotationProgress
  → continuousDistance(i) → ángulo → posición → proximidad al héroe
  → escala / opacidad / z-order / rotación → activeIndex
```

`activeIndex = ((round(progress) % 8) + 8) % 8`. **Step, drag y spin escriben ese mismo
escalar.** No hay progreso de drag, progreso de spin ni índice seleccionado aparte que
pudieran discrepar de lo que se ve. Verificado por test en seis valores de progreso,
incluidos negativos y mayores que una vuelta.

### Por qué motor propio y no `RestaurantOrbit`

La colección del motor base es el modelo de **seis platos con fichas reales**. Éstas son
ocho porciones **sin datos de plato**: meterlas por ahí obligaría a inventar platos, y la
misión prohíbe inventar datos de producto. Así que Project 07 tiene un motor rotatorio
pequeño —un progreso, un índice derivado, un camino de interacción— y no toca ningún otro
preset. `app-v4.js` no se ha refactorizado.

## 7. Geometría

El ápice de cada porción cabalga un **hub elíptico** y la cuña radia **hacia fuera**, de
modo que el centro queda hueco. Ocho puntas convergiendo en un punto es exactamente cómo
las cuñas dejan de ser productos y se convierten en pizza — el trabajo de Project 06.

```text
rx .52·w   ry .17·h   hub a .70·h   heroLen .56·h   curva 2.8   spread .62   (desktop)
```

El hub va **bajo** en la composición: con el hub a media altura el héroe se sale por
arriba. Y se abre con la distancia (`spread`), así que la parte lejana de la órbita queda
más afuera y más pequeña — profundidad, no rueda plana.

Medido en reposo a 1440×900: escalas `1.00 / 0.73 / 0.36 / 0.21`, héroe **1.37×** sobre
su vecina, cuatro niveles de profundidad, z-order por proximidad, y sin teletransportes
(paso máximo 118 px sobre 17 muestras de una vuelta completa).

## 8. La estación fija

SVG dibujado **sólo desde la cuña canónica** del manifest: ápice, radio y apertura vienen
de la auditoría, nunca de una imagen. Es **hermana** del anillo en el DOM, así que ningún
transform aplicado a un producto puede alcanzarla, y su caja se calcula con los mismos
números que el héroe (ápice en el hub a las 12, radio = longitud del héroe).

Verificado con la órbita en movimiento, en seis valores de progreso incluidos fraccionales:
posición y tamaño idénticos a ±0.6 px y `transform: none`. Lleva el acento, un borde fino
con degradado y un halo contenido. No es una tarjeta.

## 9. STEP

`prev → progress − 1`, `next → progress + 1`. Botones, ArrowLeft/ArrowRight, drag y
swipe. Vuelta completa en los dos sentidos: `08 → 01` y `01 → 08`.

El drag es **fraccional**: mientras el puntero está abajo las porciones se mueven de
verdad (medido: 0.16 → 0.33 → 0.49 → 0.66 → 1.18 con `dragging` activo). Al soltar,
velocidad → momento moderado → snap al entero más próximo. Un tirón corto vuelve a la
porción de partida; uno largo completa.

## 10. SPIN / DISCOVER

No es casino: es descubrimiento de producto.

1. elige una porción entre ocho (uniforme, RNG inyectable);
2. calcula un progreso objetivo que incluye **2–4 vueltas completas**;
3. arranque corto que acelera (`power2.in`);
4. fase rápida legible;
5. deceleración larga (`power3.out`);
6. aterriza exactamente en el objetivo;
7. la presentación sale **del mismo escalar**, nunca de un resultado decidido aparte.

Verificado: plan `target 5, turns 3 → finalProgress 29`, recorrido medido de **3.4
vueltas**, progreso final exactamente 29, `activeIndex` 5, etiqueta, contador y anuncio
todos «Mortadela y Pistacho». Un segundo disparo durante un spin se **rechaza**
(`spin()` devuelve `null`), y salir del preset **cancela** el spin en vuelo.

`setRng(fn)` y `spin({target,turns})` son la costura de test: nada de azar no
controlable en el suite.

## 11. Datos de producto

Los nombres vienen de los propios ficheros — **no se ha inventado nada más**:
4 Quesos · Barbacoa · Carbonara · Diavola · Margarita · Mortadela y Pistacho ·
Prosciutto Funghi · Verduras.

El manifest declara `price`, `ingredients`, `allergens`, `productId`, `cta` y `accent`
**en `null`**: puntos de extensión explícitos, no campos falsos. La UI muestra nombre,
contador y acción, y nada más. No se ha construido una ficha duplicada: sin mapeo real de
producto, el punto de extensión queda limpio.

## 12. Studio

`Studio → Motion → Coreografía de platos → **Pizza Slice Orbit**`, junto a los seis
presets aprobados, sin sustituir a ninguno.

Al salir se limpia todo: tween muerto, spin cancelado, listeners retirados, escenario
oculto, `datasets` (`pizzaSliceOrbit`, `pizzaProgress`, `pizzaDrag`, `pizzaSpin`) y la
variable `--ps-accent` eliminados. Verificado por test, incluido salir **con un spin en
vuelo**.

## 13. Un bug del baseline que este preset destapó

`class6-detail-bridge.js` escuchaba `click` en fase de captura sobre `.orbit-shell` y
abría la ficha para **cualquier** click cuyo punto cayera dentro de la elipse del plato
central — sin mirar qué preset manda. Como este preset pone contenido interactivo dentro
del shell, un drag terminaba abriendo una ficha que nadie pidió, y esa ficha se comía el
siguiente `pointerdown`: el segundo arrastre seguido no hacía nada.

El puente ahora **se retira cuando `#orbit-stage` no es el escenario interactivo**: un
preset que oculta los platos base manda en el shell y en su propia selección. Project 01
y Project 02 también ocultan `#orbit-stage`, así que el arreglo les corrige el mismo
disparo espurio.

## 14. Accesibilidad

Botones semánticos (`prev`, `discover`, `next`, y cada porción es un `<button>` con
`aria-label`), teclado (flechas para girar, Enter/Espacio para seleccionar), foco visible
con el acento, `aria-current` en la porción activa, y una **live region** `role="status"
aria-live="polite"` que anuncia `Selected pizza: <nombre>` **sólo al comprometer** un
paso o un spin — nunca en cada frame.

## 15. Desktop / Mobile / Reduced motion

- **Desktop**: héroe grande y centrado en la estación, vecinas a los lados, resto de la
  órbita perceptible abajo, nombre y contador arriba, controles debajo. Sin overflow.
- **Mobile**: no es el desktop encogido. Hub más cerrado (`rx .50` frente a `.52` sobre
  un viewport tres veces más estrecho), héroe más corto, menos densidad; se conservan
  estación fija, previous/next, swipe, nombre, contador y Descubrir.
- **Reduced motion**: STEP funciona; DISCOVER **sigue dando resultado** pero se salta las
  vueltas (medido: objetivo alcanzado en 236 ms) y el anuncio se mantiene.

## 16. Tests

`tests/class11-pizza-slice-orbit-e2e.mjs` — **94/94** en desktop 1440×900, móvil 390×844
y reduced motion.

La prueba que decide el proyecto es **en píxeles**: se lleva cada una de las ocho a la
estación, se recorta la caja de la estación y se mide la tinta dentro. Ocho cuñas
cortadas distinto no pueden ser idénticas, pero deben ocupar la misma caja:

```text
dispersión de ancho 4.6% · de alto 1.9% · centro x 1.4% · centro y 1.1%
```

Eso es lo que significa «cada producto cabe en el mismo marco», y no es geometría de
acuerdo consigo misma.

El resto: ocho productos independientes con ids distintos · todos desde `runtime/` · la
pizza completa ausente del escenario · registro para las ocho · un escalar y un índice
derivado · el héroe en pantalla **es** el índice activo en seis valores de progreso · la
etiqueta no puede discrepar · héroe 1.3× sobre la vecina · tres niveles de profundidad ·
**la estación no se mueve ni rota** · next/prev exactos · teclado · vuelta en ambos
sentidos · drag fraccional con el puntero abajo · cancelar y completar · snap · spin
multivuelta · objetivo determinista honrado · resultado visual = resultado anunciado ·
sin teletransportes · z-order cambiando durante el giro · sin overflow · héroe nunca
recortado · limpieza al salir · spin cancelado al cambiar de preset · y Projects 01, 02 y
03, Elegant, Studio, todos intactos.

Regresión ejecutada: Depth Carousel **114/114** · Anchor Scenes **80/80** · Orbital Food
Slider **91/91** · Class 05 PASS · Class 06 PASS · Class 07 PASS.

## 17. Evidencia

| | |
|---|---|
| Prueba de registro | `pizza-slice-orbit-registration-proof.png` **(obligatoria)** |
| Desktop | `01-idle` · `02-quarter-drag` · `03-half-drag` · `04-next-settled` · `05-spin-fast` · `06-spin-result` · `07-wrap` |
| Mobile | `01-idle` · `02-half-drag` · `03-settled` · `04-spin-result` |
| Reduced motion | `pizza-slice-orbit-reduced-motion.png` |
| Regresiones | `pizza-slice-orbit-regression-orbital-food.png` · `-depth-carousel.png` |
| Auditoría | `assets/pizza-motion/audit/slice-contact-sheet.png` · `slice-registration.json` |
| Vídeos | `tests/video/pizza-slice-orbit-desktop.webm` · `pizza-slice-orbit-mobile.webm` |

El grabador **se niega a grabar** si el preset activo no es éste con las ocho porciones
declaradas en escena.

## 18. Known issues

1. **En móvil las vecinas ±1 tocan los bordes del viewport.** Sus cajas rotadas
   sobresalen unos 18 px a cada lado; el héroe nunca se recorta (verificado por test) y
   la órbita continuando fuera de cuadro es lectura legítima, pero en un teléfono
   estrecho se ve el corte.
2. **La apertura de la cuña no está normalizada** (dispersión 2.51°): tres porciones se
   cortaron más abiertas y llenan la estación un poco más que las otras. Igualarlas
   deformaría la comida, así que la estación las contiene con 0.9° de margen.
3. **La etiqueta recorre nombres durante un spin**, porque siempre coincide con el héroe.
   Es coherente y honesto, pero durante la fase rápida se lee como un contador.
4. **Sin ficha de producto**: no hay datos reales de precio o ingredientes, así que no se
   ha construido ninguna. El punto de extensión está declarado en el manifest.
5. **Sin panel en Studio**: el preset se selecciona; radios, curva y densidad no se
   editan desde la UI.
6. **Sin traza de FPS en dispositivo real.** Un frame mueve ocho imágenes con
   transforms, sin capas nuevas, pero no está medido.
7. **`tests/class5-orbital-e2e.mjs` sigue en rojo**, como en `main`: contrato obsoleto
   ajeno a este proyecto y fuera del workflow Motion; no se ha tocado.

## 19. Estado de revisión

**READY FOR HUMAN VISUAL REVIEW.** No aprobado, no cerrado, no mergeado.

La puerta de concepto: un espectador debe entender de inmediato que **hay ocho porciones
distintas, que puede girar entre ellas una a una, y que puede lanzar un giro que aterriza
una porción en un selector fijo premium**.

Primera evidencia recomendada: **`pizza-slice-orbit-registration-proof.png`**, y después
el vídeo desktop, que es donde se ve el recorrido real del spin.
