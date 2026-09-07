# PROJECT 03 — ORBITAL FOOD SLIDER

> **STATUS: READY FOR HUMAN VISUAL REVIEW.**
> Rama: `feat/orbital-food-slider-lab`, creada desde `main` con Project 01 y Project 02
> ya integrados. No se ha mergeado a `main`.
> Este documento no aprueba nada. Aprueba Juanma tras revisión visual.

---

## 1. Objetivo

Convertir el conocimiento del Orbital Menu 2.5D existente en un preset gastronómico
más compositivo, cinematográfico y configurable, bajo un principio:

> **LA GEOMETRÍA DEL PRODUCTO DEFINE LA NAVEGACIÓN.**

No un Swiper circular, no una ruleta, no el Orbital actual con otros colores. La
colección debe leerse como **un sistema físico orbital** y el visitante debe entender
sin explicación que **puede girarla**.

## 2. Referencia del roadmap

`docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md` → Project 03. Misión oficial:
`docs/PROJECT-03-ORBITAL-FOOD-SLIDER-MISSION.md`.

Tercera capacidad reutilizable del Restaurant Motion Engine, después de
**Project 01 — Cinematic Depth Carousel** y **Project 02 — Precomposed Anchor Scenes**,
ambos aprobados y en `main`.

## 3. Baseline

| | |
|---|---|
| BASE MAIN HEAD | `fc917e0a4457566ccf882c215d4fde175915828f` |
| PROJECT 01 | merged (aprobado 2026-09-05) |
| PROJECT 02 | merged (aprobado 2026-09-07, baseline `c378e05f`) |
| Rama Project 03 | `feat/orbital-food-slider-lab` |

Gate de la misión cumplido: Project 03 arranca sobre un `main` que **ya incluye**
Project 02 aprobado y mergeado.

## 4. Arquitectura

```text
BASE ORBITAL ENGINE  (app-v4.js)          ← ESTADO AUTORITATIVO
│   active · orbitProgress · continuousDistance · nearestIndex
│   next / prev / goToIndex · animateProgress
│   drag · wheel · teclado · momentum · snap · tap
│
├── window.RestaurantOrbit                ← ADAPTADOR (expone, no copia)
│     getProgress · getActiveIndex · nearestIndex · getDishes · getCount
│     continuousDistance · next · prev · goToIndex · animateProgress · setProgress
│     subscribeProgress · subscribeActive · setDishRenderer · isDragging
│
└── class10-orbital-food.js               ← SÓLO PRESENTACIÓN Y COREOGRAFÍA DERIVADA
      trayectoria · profundidad · curva de escala · z-order · tono
      órbita de decor · tipografía · mundo cromático
```

Nuevos: `class10-orbital-food.js`, `styles-v10.css`,
`tests/class10-orbital-food-slider-e2e.mjs`, `tests/record-orbital-food-video.mjs`.
Modificados: `app-v4.js` (adaptador + fix de tap), `class6-product.js` (marca de hero),
`class4-runtime-guard.js` (loader aditivo), `class4-config.js` (`orbitalFood`).
`index.html` **no se ha tocado**.

## 5. Qué reutiliza del Orbital existente

Todo lo que ya estaba resuelto:

- `orbitProgress` fraccional continuo y `continuousDistance()`;
- `active`, `nearestIndex()` y el crossover canónico;
- `next()`, `prev()`, `goToIndex()`, `animateProgress()`;
- drag, wheel, trackpad, teclado, momentum y snap;
- `#dish-counter`, el copy de Clase 06 y la **ficha real** con su bridge;
- el propio DOM de los platos: `#orbit-stage .orbit-dish`.

Los productos en pantalla **son los elementos del motor base**, no una copia. Este
preset sólo se hace cargo de su `transform`.

## 6. Qué es nuevo

- una **gramática compositiva** distinta: órbita que se abre hacia el frente, curva de
  escala con hero dominante, recorrido vertical no lineal y solape real;
- una **segunda órbita** de ingredientes con su propia velocidad angular;
- un **sistema tipográfico** donde cada producto trae su palabra;
- un **mundo cromático** que se interpola con el progreso, no en el snap;
- el **adaptador** `window.RestaurantOrbit`, que cualquier preset futuro puede usar.

## 7. Ownership del estado

**No hay segundo estado.** Ni segundo índice activo, ni segundo progreso, ni segundo
motor de gestos, ni segundo modelo de plato, ni segunda ficha.

`window.RestaurantOrbitalFood.state()` **devuelve los números del motor**, no unos
propios, y hay un test que lo comprueba escribiendo el progreso del motor y verificando
que el preset reporta exactamente ese valor.

El contrato verificado en cada viewport:

```text
BASE ACTIVE INDEX = HERO MARCADO = #dish-counter = plato de la ficha
BASE ORBIT PROGRESS → gobierna toda la coreografía del preset
```

## 8. Progress

Uno y sólo uno: `orbitProgress` del motor base. Es fraccional y continuo; toda la
composición se deriva de él en cada frame vía `subscribeProgress`.

`animateProgress` **no puede mantener una fracción** —al completar hace
`Math.round(target)`—, así que el adaptador añade `setProgress(v)`, que escribe el
progreso del propio motor y vuelve a renderizar por su propia pasada. Es lo que permite
inspeccionar la órbita a mitad de viaje sin inventar un progreso paralelo.

## 9. Product orbit

Del progreso a la posición, sin estados discretos:

```text
distance → angle → front → depth → trajectory → scale → tone → z-order
```

```js
rx = (mobile?.46:.38)·W        ry = (mobile?.23:.26)·H
spread = mobile ? .60+.24·f : .52+.34·f      // la órbita se abre hacia el frente
x  = cx + sin(a)·rx·spread
y  = cy + ry·(-0.58 + 1.15·f^1.6) + |sin(a)|·ry·0.10
scale = ((mobile?.26:.30) + f^(mobile?2.0:2.2)·(mobile?1.00:1.15)) · orbitScale
```

`spread` creciente con `f` es lo que da lectura de perspectiva: los productos del frente
abren más la órbita, y por eso **se solapan** con el hero en vez de alinearse. El
exponente 1.6 en la vertical evita que el trío delantero quede a la misma altura, que es
lo que convierte una órbita en una fila curva.

En desktop la órbita se sitúa a la derecha del centro y alta (`cx=+0.11·W`,
`cy=-0.15·H`): la columna editorial es dueña del inferior izquierdo, y un plato
cruzando el título del plato es desorden que ningún scrim arregla.

## 10. Depth

Medido, no afirmado (desktop 1440×900, en reposo):

| | HERO | vecino | trasero | fondo |
|---|---:|---:|---:|---:|
| ancho | **543 px** | 375 px | 146 px | 112 px |
| opacidad | 1.00 | 0.82 | 0.47 | 0.30 |
| z-index | 100 | 75 | 25 | 0 |

Hero / vecino = **1.45×**. Cuatro niveles perceptibles, z-order coherente con la
profundidad, y solape real hero-vecino (**~71 px**). El blur máximo es 2.2 px: la
profundidad la llevan escala, trayectoria, solape, z-order y posición vertical — el
desenfoque no sustituye a la profundidad, sólo la acompaña.

El trasero se queda en contexto: nunca supera el 45% del ancho del hero y siempre baja
de su opacidad.

## 11. Decor orbit

Una segunda coreografía orbital, no confeti:

| capa | rate angular |
|---|---:|
| decor back | **0.48** |
| producto | 1.00 (es la órbita) |
| decor front | **1.26** |

Cada grupo **pertenece a su producto**: su opacidad se multiplica por `front²` del plato
del que salió, así que se apaga con él y no puede sobrevivir a su propio plato. Los items
recorren su propia elipse con fase propia, de modo que el parallax es angular y no un
simple desplazamiento.

Verificado por test: existen, se mueven con el progreso, y el decor de un producto que no
está cerca del frente está callado.

## 12. Typography

Cada plato trae su palabra (`FIRE`, `BLUEFIN`, `EMBER`, `SEA`, `IBERIAN`, `HONEY`) y
todas comparten una línea. La legibilidad es una **compuerta**, no una curva: por debajo
de `front .86` una palabra está muda, y en el último tramo sólo habla el par del frente,
que se cruza exactamente donde el motor cambia su índice activo.

Con una caída a la cuarta potencia se leían tres palabras a la vez y la capa parecía un
amasijo de letras. Además cada palabra viaja con su producto (`sin(a)·0.26·W`), así que el
par que cruza el frente **se adelanta** en vez de apilarse.

## 13. World interpolation

El mundo se calcula como una **mezcla continua sobre toda la colección**, con pesos
`front⁴` normalizados — no un cambio en el snap ni un emparejamiento discreto A→B. El
acento resultante se publica en `--of-accent`, que gobierna el copy, el precio, el CTA,
el eyebrow, el cursor y la palabra.

El charco de luz del hero (`.of-glow`) sigue su posición orbital real, calculada con los
mismos pesos.

Verificado por test: cinco muestras del acento a lo largo de una vuelta dan cuatro
valores distintos, y el de la mitad no coincide ni con el inicial ni con el final.

## 14. Studio

`Studio → Motion → Coreografía de platos → **Orbital Food Slider**`.

Convive con `Elegant Orbit`, `Urban Acrobatics`, `Editorial Flow`, `Depth Carousel` y
`Anchor Scenes`; no sustituye a ninguno. Sin panel de configuración todavía: primero
motor y contrato de datos.

## 15. Data contract

```js
dish.orbitalFood = {
  word, accent, backgroundColor,      // identidad
  foregroundDecor, backgroundDecor,   // órbita de ingredientes
  orbitScale,                         // el producto ocupa más o menos órbita
  rotationBias                        // inclinación propia al alejarse del frente
}
```

Prioridad de datos: **`orbitalFood` → metadata reutilizable existente → fallback**. Así
Project 03 hereda paleta, palabra y decor que Depth Carousel ya describió, y un
restaurante puede sobreescribir cualquier campo por plato. Nada de los seis platos está
cableado en el motor.

En el LAB hay dos overrides reales, para que el contrato no sea teórico:
`dish-03 {orbitScale:1.06, rotationBias:-3}` y
`dish-06 {word:'HONEY', orbitScale:.96, rotationBias:4}`.

## 16. Detail

No hay segunda ficha. Click en el hero → `openDetail()` del motor base → la ficha real de
Clase 06, con su bridge y su Flip. Click en un vecino → `goToIndex()`: navega, no abre.
Al cerrar, el producto vuelve a su sitio en la órbita (verificado: el índice activo no
cambia y el hero recupera su dominancia).

### El tap de producto estaba roto en el baseline

`setPointerCapture` en `.orbit-shell` **retargetea el pointerup al shell**, así que el
navegador dispara `click` sobre el shell y el `onclick` que `buildOrbit` pone en cada
plato nunca se alcanzaba: tocar un producto no hacía nada, **tampoco en Elegant Orbit**.
Comprobado en el baseline antes de tocar nada.

Como §21 exige ese comportamiento, se resuelve el tap en el propio motor compartido, con
el mismo contrato que aquel handler: el plato activo abre su ficha, cualquier otro navega
hasta él. El arreglo beneficia a todos los presets.

## 17. Desktop

Composición editorial: órbita a la derecha y alta, columna de copy abajo a la izquierda
con su propia caída de luz, controles abajo a la derecha, palabra detrás de los productos.
Hero inequívoco con sombra propia, órbita visible, decor lejos del precio y del CTA, sin
clipping y sin scroll horizontal. Un test mide que **ningún plato visible tape más del
30% del título**.

## 18. Mobile

No es el desktop encogido:

- la órbita se cierra (`spread .60+.24·f`, `rx .46·W`) para que el hero siga grande y
  **previous y next conserven presencia real** en los bordes;
- los platos bajan a `clamp(150px,44vw,230px)`;
- el swipe domina, y es el mismo drag del motor;
- copy, precio, ingredientes y CTA pasan al flujo normal debajo;
- el identificador de sección arranca por debajo del header fijo, y la palabra queda por
  detrás de los productos en vez de recortada arriba;
- sin overflow horizontal y sin productos escapándose del viewport.

Medido en 390×844: hero 216 px, vecino 151 px (1.43×), traseros 65/45 px, recorrido
vertical 116 px, solape 63 px.

## 19. Reduced motion

Con `prefers-reduced-motion` no se pierde nada: hero, copy, precio, controles, navegación
y ficha siguen operativos; se relaja el `will-change` y el motor base ya acorta sus
easings. Verificado por test.

## 20. Persistence

`orbitalFood` vive en el modelo de plato, así que Clase 04 lo guarda sin reescribir nada.
Verificado: sobrevive a editar **otro** campo y a un reload completo.

La elección de preset también persiste. Hizo falta un arreglo: la opción de este preset la
inyecta un runtime que carga **después** de que el Studio haya aplicado la configuración
guardada, así que si el proyecto se guardó en este modo el `<select>` aún no tenía la
opción y caía silenciosamente a `elegant`. El preset re-aplica su propia elección una vez,
sólo para su modo.

## 21. Tests

`tests/class10-orbital-food-slider-e2e.mjs` — **91/91** en desktop 1440×900, móvil 390×844,
reduced motion y persistencia.

Las puertas que deciden el proyecto:

- **el contrato de reutilización**: los productos son los elementos del motor; el preset
  reporta el progreso del motor; índice activo = hero = contador = ficha;
- **hero y profundidad**: 1.45× sobre el vecino, ≥3 niveles, z-order por profundidad,
  solape real, recorrido vertical, trasero en contexto;
- **continuidad**: se muestrea `0 · .2 · .4 · .5 · .6 · .8 · 1` y se exige que ningún
  producto teletransporte, que el entrante se acerque y el saliente se aleje de forma
  monótona, que el z-order **cambie durante** la vuelta y que el entrante crezca;
- **gesto = progreso**: con el puntero abajo a mitad de recorrido, la órbita está a mitad;
  al soltar, snap del motor;
- **convergencia de inputs**: next, prev, teclado y wheel acaban en el mismo motor;
- **copy**: precio y contador describen el plato activo, y el relevo ocurre en el
  crossover del motor;
- **clicks**: vecino navega y no abre nada; hero abre la ficha real del mismo plato;
- **regresiones**: Project 01, Project 02, Elegant, Urban y Editorial Flow intactos, y al
  salir no queda renderer registrado, ni marca de hero, ni `saturate()` en los platos.

Regresión ejecutada: Depth Carousel **114/114** · Anchor Scenes **80/80** ·
scene audit PASS · Class 05 PASS · Class 06 PASS · Class 07 PASS.

## 22. Evidence

| | |
|---|---|
| Desktop | `orbital-food-desktop-0{1..6}-*.png` (idle · quarter · half · three-quarter · complete · detail) |
| Prueba de profundidad | `orbital-food-desktop-depth-proof.png` — una vuelta completa a 0 / .25 / .50 / .75 |
| Mobile | `orbital-food-mobile-0{1..6}-*.png` |
| Reduced motion | `orbital-food-reduced-motion.png` |
| Regresiones | `orbital-food-regression-elegant.png` · `-depth.png` · `-anchor-scenes.png` |
| Vídeos | `tests/video/orbital-food-desktop.webm` · `orbital-food-mobile.webm` |

El grabador **se niega a grabar** si Orbital Food Slider no es el preset activo y no está
componiendo los productos.

## 23. Regressions

Nada de lo aprobado cambia de comportamiento. Los dos cambios en ficheros aprobados son
aditivos y con fallback:

- `app-v4.js`: el adaptador (sin renderer registrado ni suscriptores, `renderOrbit` se
  comporta exactamente como antes) y la resolución del tap, que **arregla** un handler que
  nunca se alcanzaba.
- `class6-product.js`: si un preset marca su hero, se respeta; si no —y ninguno de los
  aprobados lo hace— sigue la deducción geométrica de siempre.

## 24. Known issues

1. **La proximidad al centro ya no decide el hero cuando un preset lo marca.** Es
   deliberado y es lo que arregla el copy, pero conviene saber que Clase 06 tiene ahora
   dos caminos para identificar el plato activo.
2. **El par de palabras se solapa unos píxeles** justo en el cruce del frente. Se
   separaron a `0.26·W` y se atenuaron; a exactamente 0.50 los remates aún se tocan.
3. **Sin panel en Studio**: el preset se selecciona, pero dirección, intensidad,
   radios y densidad de decor todavía no se editan desde la UI.
4. **`orbitScale` y `rotationBias` no tienen UI**: son datos, no controles.
5. **El copy base parpadea al idioma por defecto** un instante antes de que Clase 06
   escriba el idioma activo. Es anterior a Project 03 y se ve en todos los presets.
6. **Sin traza de FPS en dispositivo real.** Una pasada mueve seis platos, seis palabras
   y hasta 36 items de decor con `gsap.set`, sin capas nuevas por frame, pero no está
   medido.
7. **`tests/class5-orbital-e2e.mjs` sigue en rojo**, como en `main`: espera
   `urban-acrobatics-v5-final` cuando el preset por defecto es `elegant`. Contrato
   obsoleto, ajeno a Project 03, no incluido en el workflow Motion; no se ha tocado.

## 25. Human review status

**READY FOR HUMAN VISUAL REVIEW.** No aprobado, no cerrado, no mergeado.

Lo que pide la misión que se juzgue: si se siente físicamente orbital, si el producto
domina, si es claramente distinto del Orbital existente, si es premium, si el drag se
entiende sin explicación, si el decor aporta, si la coreografía ayuda a descubrir platos,
si un restaurante lo compraría, si el móvil conserva impacto y si parece producto real.

Primera evidencia recomendada: **`orbital-food-desktop-depth-proof.png`**, que es donde
se ve si los productos viajan por una órbita o sólo cambian de tamaño.
