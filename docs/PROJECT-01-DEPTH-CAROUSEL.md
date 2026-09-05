# PROJECT 01 — CINEMATIC DEPTH CAROUSEL

> **STATUS: APPROVED / CLOSED**
> **HUMAN APPROVAL:** Juanma
> **FINAL APPROVED BASELINE:** `532133496e2c861fa24dc905f5b09b8dfc6f1ade`
> **DATE:** 2026-09-05
>
> Rama de desarrollo: `feat/depth-carousel-lab`.
> Regla vigente: `CLASE N+1 = CLASE N APROBADA + NUEVA CAPACIDAD`.
>
> **Este documento tiene tres partes, en orden cronológico.**
> Secciones A–K = **V1** (~40% en revisión humana).
> **VISUAL DIRECTION V2** (~60–65%).
> **VISUAL DIRECTION V3 — FINAL ART DIRECTION PASS**, y dentro de ella **V3b**, la
> micro-iteración de cierre, es el estado vigente.
>
> Cada sección **sustituye** a la anterior en lo relativo a assets, capas, track,
> lettering, fondo, decor y copy. La arquitectura de estado descrita en A–E sigue
> siendo exacta: no se ha reconstruido en ninguna iteración.

---

## A. Contexto — qué problema resuelve

El Restaurant Experience Studio sabía cambiar marca, copy, media y carta. No sabía cambiar
**cómo se mueve y se explora la carta**.

El único lenguaje de navegación de producto disponible era el Orbital Menu (con dos
coreografías, Elegant y Urban, más Editorial Flow como tercera). Los tres comparten la
misma premisa: un único objeto protagonista y el resto orbitando o en columna.

Depth Carousel introduce la primera capacidad realmente distinta: una **colección de platos
que coexiste en un espacio 2.5D**, donde el usuario arrastra una colección física en lugar
de pulsar botones de "siguiente".

Es el primer preset del futuro **Restaurant Motion Engine** y, según el documento maestro,
el que concentra el núcleo técnico reutilizable (state, drag, snap, profundidad, z-order,
escalas, copy sincronizado).

---

## B. Referencia — qué comportamiento del vídeo reproducimos

De `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md`, sección **PROJECT 01**:

- varios productos visibles simultáneamente alrededor del protagonista;
- posiciones `-2 -1 0 +1 +2` con propiedades propias (`x, y, scale, rotation, opacity, blur, z-index`);
- al navegar, **todos** los objetos se recolocan, no se sustituye una imagen por otra;
- distancias y velocidades distintas → parallax y profundidad;
- fondo, gran lettering, nombre, descripción, precio y CTA cambian sincronizados;
- click sobre el protagonista abre la ficha real del plato.

**No** reproducimos las interfaces del vídeo píxel a píxel. Extraemos la gramática.

---

## C. Arquitectura — qué reutilizamos y qué no duplicamos

La decisión central: **no se ha construido un segundo motor de estado**.

```text
ORBITAL ENGINE (app-v4 / class4-runtime-guard)   ← ESTADO AUTORITATIVO
        │  #dish-counter = única fuente de verdad del índice activo
        │
        ├── class6-product.js      ← ficha de plato, bilingüe, storytelling
        ├── class6-detail-bridge.js← apertura por hit-test del héroe visual
        │
        └── class8-depth-carousel.js  ← SOLO la coreografía visible
                 renderiza su propia capa de platos dentro de .orbit-shell
                 mientras styles-v8.css oculta #orbit-stage
```

### Capacidades existentes reutilizadas

| Capacidad | De dónde | Cómo |
|---|---|---|
| Modelo de plato canónico | `class4-config.js` | `id, name, meta, short, price, image, ingredients, origin, technique, pairing, note, allergens, enabled`. No se inventa un segundo modelo. |
| Índice activo / navegación | `app-v4.js` | Se confirma clicando el `.orbit-dish` real (`b.onclick` = `goToIndex(i)`). |
| Copy sincronizado | `app-v4.js` `updateCopy()` + Class 06 | Meta, título y descripción los sigue escribiendo el motor base. |
| Ficha de plato | `class6-product.js` `RestaurantClass6Detail.open()` | API pública de Clase 06, con fallback al click base. |
| Persistencia | `class4-store.js` | `loadProject()` para leer overrides. No se envuelve `saveProject`. |
| Selector de preset | `class5-studio-motion.js` | Se inyecta `<option value="depth-carousel">` en `#motion-orbital-style`. |
| Contrato de eventos | Clase 05/06 | `restaurant:motion-change`, `restaurant:dish-detail-open/close`. |
| Patrón de motor aditivo | `class7-editorial-flow.js` | Mismo contrato: stage propio, ownership de input en fase captura, guardas por modo. |
| Acento por plato | `class7-editorial-flow.js` `dish.editorialFlow.color` | Se reutiliza como acento por defecto para que ambos motores sean cromáticamente coherentes. |
| Carga aditiva | `class4-runtime-guard.js` | Loader dinámico. **`index.html` no se ha tocado.** |
| GSAP | ya presente | Sin dependencias nuevas. Sin Three.js. Sin Canvas. |

### Qué se ha añadido

- `class8-depth-carousel.js` — el motor.
- `styles-v8.css` — capas, z-order y responsive del preset.
- `tests/class8-depth-carousel-e2e.mjs` + `tests/static-server.mjs` — cobertura Playwright.
- `.github/workflows/class8-depth-carousel.yml` — CI.
- Extensión opcional del modelo: `dish.depthCarousel = { word, accent }` (con defaults
  derivados; no es obligatorio que exista en el JSON del proyecto).

---

## D. Implementación — cómo funciona

### Track de profundidad

Una tabla de slots `-3 … +3`, muestreada por **interpolación continua** (`sampleTrack`),
no por posiciones discretas. Cada slot define `x, y, scale, opacity, blur, rotation`.

```text
                              ACTIVE
                    -1                  +1
          -2                                    +2
    -3                                                +3
```

El espaciado es **deliberadamente no lineal**:

| tramo | Δx desktop | Δy desktop |
|---|---:|---:|
| 0 → ±1 | 20 % | 12 % |
| ±1 → ±2 | 13 % | 7 % |
| ±2 → ±3 | 11 % | 4 % |

Un espaciado uniforme haría que todos los platos recorriesen la misma distancia por paso:
eso es exactamente lo que produce la lectura de "slider". Con espaciado decreciente, el
plato activo recorre casi el doble que uno lejano en la misma transición → **parallax real
entre objetos del mismo plano**.

Además cada plato recibe un **arco secundario** (`sin(d·π/1.5)`) que curva la trayectoria a
mitad de transición, distinto según su distancia. Las trayectorias no son rectas ni paralelas.

### Capas y z-order

```text
z 0   .dc-wash    baño cromático del acento del plato   (parallax ×0.42 relativo)
z 1   .dc-word    lettering gigante (palabra del plato) (parallax ×1.00 relativo)
z 2   .dc-plates  platos; z-index por plato = 100 − |d|·12  (back → active → front)
z 20  .dish-copy  meta, título, descripción, precio, ingredientes, CTA
z 20  .orbit-controls  prev / contador / next / indicadores
```

El parallax de fondo se calcula sobre la **fracción respecto al slot más cercano**, no sobre
la posición absoluta: así las capas se retrasan durante el movimiento y siempre resuelven
centradas, sin deriva acumulada.

### Sincronización de escena

Al cambiar el índice activo se actualizan en un mismo timeline: palabra gigante, variable
CSS `--dc-accent` (que tiñe wash, precio e indicador), precio, ingredientes e indicadores.
Meta, título y descripción los sigue escribiendo el motor base — por eso no se desincronizan.

### Confirmación al motor base

El motor visual mueve `position` libremente. Al hacer snap, `syncBaseTo(index)` clica el
`.orbit-dish` real de destino, que en `app-v4` equivale a `goToIndex(i)`. Un click
programático lleva `clientX/Y = 0`, por lo que el hit-test de `class6-detail-bridge` lo
ignora y no abre la ficha por error.

---

## E. Interacción

| Entrada | Desktop | Mobile |
|---|---|---|
| Drag / swipe | continuo, 1 plato ≈ 24 % del ancho del shell | continuo, 1 plato ≈ 32 % del ancho |
| Momentum | proyección de 180 ms a la velocidad suavizada de release, limitada a ±2 platos | igual |
| Snap | siempre a plato entero, `power3.out`, duración proporcional a la distancia | igual |
| Prev / Next | sí | sí |
| Wheel | sí (con throttle de 420 ms) | n/a |
| Teclado | ←/→ navegan, Enter abre ficha (shell enfocado) | n/a |
| Indicadores | click directo al plato | click directo al plato |
| Click en héroe | abre la ficha real | abre la ficha real |
| Click en lateral | navega hasta ese plato | navega hasta ese plato |

El drag es **continuo**: `position` sigue al puntero en cada frame. No es un swipe que
dispara un paso discreto — ésa es la diferencia principal frente a Editorial Flow.

---

## F. Responsive

Dos tracks completos, no una reducción del de escritorio:

- **Desktop (≥700 px)**: shell `min(60vw, 700px)`, plato base `clamp(168px, 23vw, 400px)`,
  héroe a escala 1.18, laterales visibles a ±1 y ±2.
- **Mobile (<700 px)**: shell `58vh`, plato base `clamp(168px, 50vw, 250px)`, amplitud
  horizontal mayor (±26 % vs ±20 %) para que los laterales se recorten en el borde y se
  perciba continuidad, arco vertical más corto, blur reducido, `dragUnit` mayor para que un
  swipe corto de pulgar no salte tres platos.

---

## G. Performance — decisiones tomadas

- Sólo se animan `transform`, `opacity` y `filter`; ningún cambio de layout por frame.
- `gsap.set` directo por plato (6 elementos), sin timeline por objeto durante el drag.
- `filter` se sustituye por `none` cuando la opacidad del slot baja de 0.03: los platos
  invisibles no pagan blur.
- Blur máximo 5 px, y sólo en slots ya casi transparentes.
- `will-change: transform, opacity, filter` acotado a `.dc-plate` y a las dos capas de fondo.
- Un único listener por tipo de evento, en `document`, en fase de captura.
- El breathing idle se cancela durante drag, transición y ficha abierta.
- Sin assets nuevos: se reutilizan las imágenes 1:1 del contrato orbital existente.
- Sin Three.js, sin Canvas, sin escena 3D. Todo es CSS transform + GSAP.

---

## H. Errores encontrados

### H.1 — El observer del contador perseguía índices intermedios

**Síntoma.** Tras un drag, el carrusel volvía al plato de partida. En móvil, motor e índice
base quedaban desincronizados (engine 5 / counter 3).

**Causa.** `app-v4.goToIndex()` interpola progresivamente y su `syncActive()` reescribe
`#dish-counter` en **cada índice intermedio** del recorrido. El `MutationObserver` del
Depth Carousel leía esos valores intermedios como un cambio externo y navegaba tras ellos,
deshaciendo el snap.

**Solución.** Latch `baseSyncTarget`: mientras hay una confirmación al motor base en vuelo,
el observer ignora el contador y sólo lo consume cuando alcanza el destino esperado
(con timeout de seguridad de 1800 ms).

**Validación.** `engine and Orbital state stay in sync` en desktop y mobile.

---

### H.2 — Dos propietarios de drag sobre la misma superficie

**Síntoma.** El drag daba resultados erráticos y a veces nulos.

**Causa.** `app-v4`, `class5-elegant-orbit` y `class5-urban-harmony` enlazan cada uno su
propio `pointerdown/move/up` sobre `.orbit-shell`. Es literalmente el error nº 1 documentado
en `CLASS-04-ERRORS-SOLUTIONS.md`: *"una propiedad crítica de UI no puede tener dos
propietarios de animación simultáneos"*.

**Solución.** En modo `depth-carousel` el motor toma propiedad exclusiva del flujo de puntero
con `stopImmediatePropagation()` en fase de captura sobre `document`. Fuera de ese modo no
intercepta nada y los motores originales siguen intactos.

**Validación.** `drag navigates` / `swipe navigates` + `Orbital preset is restored intact`.

---

### H.3 — GSAP descentraba las capas de parallax

**Síntoma.** El lettering gigante aparecía desplazado a la derecha y recortado; el baño
cromático no se veía.

**Causa.** `.dc-word` y `.dc-wash` se centran en CSS con `transform: translate(-50%,-50%)`.
`gsap.set(el,{x})` **reescribe la propiedad `transform` completa** y, al asumir
`xPercent/yPercent = 0`, elimina ese centrado.

**Solución.** Pasar siempre `xPercent:-50, yPercent:-50` en las llamadas a `gsap.set` de
esas capas.

---

### H.4 — Parallax de fondo con deriva acumulada

**Síntoma.** Tras varios pasos, la palabra gigante salía del encuadre por la izquierda.

**Causa.** El desplazamiento se calculaba sobre la posición absoluta (`-position × rate`),
que crece sin límite conforme el usuario navega.

**Solución.** Calcularlo sobre la fracción respecto al slot más cercano
(`pos - Math.round(pos)`), que oscila en `[-0.5, 0.5]`.

---

### H.5 — `rebuild()` durante la ficha abierta

**Síntoma potencial** (detectado y prevenido antes de manifestarse en producción).

**Causa.** `app-v4.openDetail()` **mueve** el nodo `.orbit-dish` real dentro de
`#detail-visual` mediante GSAP Flip. El `MutationObserver` sobre `#orbit-stage` habría
reconstruido la escena con un plato menos.

**Solución.** `rebuild()` y el observer se abortan si la ficha está abierta; la escena se
reconstruye al cerrarla.

**Validación.** `detail closes and the scene is restored — 6 plates`.

---

### H.6 — Errores del harness, no del producto

Se documentan porque afectaron al diagnóstico:

- El punto de agarre del drag sintético caía **fuera del viewport** (el shell es más alto que
  una pantalla de móvil) → Playwright no entregaba el gesto y el fallo parecía del motor.
  Corregido acotando el punto de agarre al viewport y verificándolo con `elementFromPoint`.
- El swipe móvil se emulaba construyendo objetos `PointerEvent` a mano. Sustituido por
  `Input.dispatchTouchEvent` vía CDP, que produce eventos táctiles reales de Chromium.
- La aserción de título comparaba contra el nombre en inglés de `class4-config.js`, pero
  Clase 06 renderiza el nombre localizado. La aserción ahora comprueba **cambio**, no igualdad.

---

## I. Regresión preexistente (no causada por este proyecto)

`tests/class5-orbital-e2e.mjs` falla también en `main`, sin ningún cambio de esta rama.

Espera `dataset.orbitalChoreography === 'urban-acrobatics-v5-final'`, pero la configuración
por defecto es `motion.orbitalStyle: 'elegant'` y el test no selecciona el preset Urban.

Verificado ejecutándolo en un worktree limpio de `main`: mismo fallo, mismo punto (línea 29).
**No se ha tocado**: corregirlo queda fuera del alcance de Project 01 y debe decidirse aparte.

---

## J. Limitaciones actuales — sin ocultar

1. **Studio sólo expone el preset, no sus parámetros.** No hay control de intensidad de
   movimiento, amplitud, blur ni palabra/acento por plato desde el panel. Decisión
   deliberada (§14 de la misión: el carrusel funcional tiene prioridad).
2. **`dish.depthCarousel` no se persiste.** El modelo lo acepta y lo lee, pero el motor no
   envuelve `saveProject`. Hoy el acento se deriva de `dish.editorialFlow.color` y la palabra
   del nombre del plato.
3. **La palabra gigante es la primera palabra del nombre.** Con nombres largos o con nombres
   cuya primera palabra es poco distintiva, el resultado es mediocre. Necesita campo editable.
4. **Assets del LAB.** Se reutilizan las imágenes 1:1 sobre fondo oscuro del contrato orbital.
   Funcionan, pero el preset ganaría mucho con PNG/WebP recortados con transparencia y luz
   coherente entre platos.
5. **Sin autoplay.** Editorial Flow tiene reproducción automática; aquí no se ha añadido para
   no competir con el drag. Es una decisión revisable.
6. **Flip hacia la ficha.** `alignBaseToHero()` aparca el plato base sobre la geometría del
   héroe para que la transición a la ficha arranque donde el usuario ve el plato. Funciona,
   pero no se ha afinado el timing frente a la coreografía original de Clase 06.
7. **Cursor contextual.** Sigue mostrando la etiqueta `DRAG` heredada del baseline; no se ha
   contextualizado por capa (héroe vs lateral).
8. **Sin medición de FPS.** Las decisiones de performance están razonadas (sección G) pero no
   hay traza de rendimiento capturada en dispositivo real.

---

## K. Qué falta para integrarlo en el Restaurant Motion Engine

1. Extraer a una capa común lo que ya está resuelto aquí y volverá a hacer falta en los
   proyectos 02–05: `activeIndex`, `next/prev`, intent de drag/swipe, momentum, snap,
   muestreo de track, sincronización de copy, breakpoints y reduced motion.
2. Definir el contrato `MotionPreset` (`activate / deactivate / rebuild / step / goTo /
   renderAt`) que hoy `RestaurantDepthCarousel` ya expone informalmente.
3. Unificar la metadata por plato: `editorialFlow.color` y `depthCarousel.accent` deberían
   ser un único `dish.theme.accent` del modelo canónico.
4. Añadir persistencia y campos de Studio para palabra/acento/intensidad.
5. Resolver la propiedad del input de forma central: hoy cada motor la reclama por su cuenta
   en fase de captura. Debería haber un único árbitro por preset activo.
6. Añadir métricas de rendimiento al contrato de CI.

---

## Archivos

**Nuevos**
- `class8-depth-carousel.js`
- `styles-v8.css`
- `tests/class8-depth-carousel-e2e.mjs`
- `tests/static-server.mjs`
- `.github/workflows/class8-depth-carousel.yml`
- `docs/PROJECT-01-DEPTH-CAROUSEL.md`
- `tests/screenshots/*.png`

**Modificados**
- `class4-runtime-guard.js` — sólo el loader aditivo al final del archivo.
- `.gitignore` — nuevo.

**No modificados** (intencionadamente)
- `index.html`, `app-v4.js`, `class4-config.js`, `class4-store.js`,
  `class5-*.js`, `class6-*.js`, `class7-editorial-flow.js`, `styles-v3/4/5/6.css`.

---

## Cobertura Playwright

62 comprobaciones, desktop 1440×900 + mobile 390×844 + reduced-motion. Todas en verde.

Carga · preset en Studio · platos renderizados · niveles de profundidad simultáneos ·
escala diferencial · z-order en capas · gradiente de blur · arco vertical · recomposición de
toda la colección · trayectorias diferenciales · movimiento continuo (no swap) · copy, precio,
lettering, acento, ingredientes e indicadores sincronizados · next · prev · drag desktop ·
swipe táctil real en móvil · snap · sincronía motor/Orbital · sin overflow horizontal ·
controles accesibles · ficha abre y cierra restaurando la escena · Studio sigue abriendo ·
Orbital se restaura intacto · sin errores de consola · reduced motion conserva contenido y
navegación.

---
---

# VISUAL DIRECTION V2

> Estado: **LAB V2 desarrollado, pendiente de segunda validación humana.**
> Baseline revisado: `d7fb8fe`. Arquitectura V1 conservada, no reconstruida.

## V2.1 — Evaluación humana de la V1

Juanma + ChatGPT puntuaron la V1 en **~40% del resultado visual esperado**.

El diagnóstico no fue de ingeniería. Drag, momentum, snap, profundidad matemática,
escalas, lettering y cambio cromático existían y funcionaban. El problema era de
percepción:

> "La experiencia todavía parece demasiado *The Orbital Menu*."

Cinco problemas concretos, y lo que se ha hecho con cada uno:

| # | Problema V1 | Causa real | Solución V2 |
|---|---|---|---|
| 01 | Los platos siguen pareciendo discos | `border-radius:50%` + `box-shadow` sobre un `div`: la forma era del contenedor, no del producto | Free object assets con alpha + `drop-shadow()` sobre la silueta real |
| 02 | Los fondos casi no se perciben | El fondo era negro + un glow de 35vw dentro del shell | Scene Background Engine: un mundo cromático por plato, a sección completa |
| 03 | El lettering existe pero no domina | 13% de opacidad, tamaño medio, centrado detrás del héroe | Una palabra por plato, 26vw, color propio, ocluida por los objetos |
| 04 | Sigue pareciendo Orbital Menu | Se reutilizaba la presentación además del motor | Anillos, centro, glow y heading orbital desactivados; escena e identidad propias |
| 05 | La composición es demasiado simétrica | El track era un espejo `small–medium–HERO–medium–small` | Track asimétrico con perspectiva, recortes de viewport y z-order por tamaño aparente |
| 06 | El movimiento lee como UI, no como escena | Sólo los platos respondían al gesto | Fondo, lettering, acento, precio, ingredientes e indicadores responden a la posición continua |

---

## V2.2 — Free object assets

### El contrato

```js
dish.depthCarousel = {
  asset,               // imagen con transparencia — el objeto libre
  word,                // lettering gigante de la escena
  accent,              // color de marca del plato
  backgroundColor,     // base del mundo cromático
  backgroundGradient,  // opcional: gradiente completo, sustituye al derivado
  background,          // opcional: imagen de fondo, gana sobre el gradiente
  foregroundDecor,     // reservado para la capa decorativa delantera
  backgroundDecor      // reservado para la capa decorativa trasera
}
```

Todos los campos tienen fallback. Sin `asset` se usa `dish.image` con máscara
circular (`.dc-plate.is-framed`), porque la fotografía orbital 1:1 lleva fondo
oscuro y sin máscara mostraría un cuadrado negro. Sin `word` se usa la primera
palabra del nombre. Sin `accent` se usa `dish.editorialFlow.color` y, en su
defecto, la paleta interna. Un proyecto importado sin `depthCarousel` sigue
funcionando.

### El pipeline

`scripts/build-depth-assets.mjs` convierte la fotografía orbital existente en
objetos libres. No añade ninguna dependencia: usa el Chromium que Playwright ya
instala.

```text
dish.image (2048x2048, producto sobre fondo oscuro)
      -> fetch en Node -> data URL (canvas sin taint)
      -> alpha = smoothstep(luminancia, 0.085, 0.30)
      -> guarda radial: fuera del circulo del plato, alpha 0
      -> trim al bounding box real de la silueta + recentrado
      -> WebP con alpha, 820x820
assets/depth-carousel/<dish-id>.webp   (~230 KB)
```

Se generaron **6/6 assets** (el mínimo pedido eran 3). `assets/depth-carousel/_preview.png`
es la hoja de contactos sobre fondo de color con la que se juzgaron los bordes alpha,
y `manifest.json` guarda los parámetros de keying para poder reproducirlos.

### Limitación honesta de los assets

La fotografía de origen es **cenital y circular**. Al recortarla desaparece la card,
el marco y la sombra de contenedor, y la silueta pasa a ser la del plato real — pero
el plato sigue siendo redondo. La sensación de objeto se consigue combinando el
recorte con `rotateX` por slot, `drop-shadow` sobre la silueta y oclusión entre
objetos. Con fotografía en escorzo (bowls, copas, producto en mano) el mismo motor
daría un salto adicional sin tocar código.

---

## V2.3 — Scene Background Engine

`.dc-backdrop` se inserta como primer hijo de `.orbital-section`, no dentro del
shell: el mundo cromático ocupa **toda la sección**, no un glow local.

Una capa `.dc-bg` por plato. El gradiente se deriva del `accent` y el
`backgroundColor` del plato (tres radiales de acento a distintas escalas sobre una
base oscura) salvo que el proyecto aporte `backgroundGradient` o `background`.

Interpolación: cada capa recibe

```js
opacity = clamp(1 - Math.abs(d), 0, 1) ** 0.75   // d = distancia continua al plato
x       = -d * stepPx * 0.20                      // parallax de fondo
scale   = 1 + Math.abs(d) * 0.04
```

`d` viene de la posición continua, así que a mitad de un drag conviven dos mundos
cromáticos mezclados. Los seis mundos de la demo:

| Plato | Word | Accent | Mundo |
|---|---|---|---|
| Gamba roja | FIRE | `#ff6a3c` | coral quemado sobre `#1e0a05` |
| Atún rojo | BLUEFIN | `#4f8dff` | azul océano sobre `#050f22` |
| Alcachofa | EMBER | `#b9e24d` | verde ácido sobre `#101c07` |
| Lubina | SEA | `#34d3c6` | turquesa sobre `#041d1d` |
| Presa ibérica | IBERIAN | `#ef5b7e` | burdeos sobre `#1d0611` |
| Miel quemada | HONEY | `#ffc23d` | ámbar sobre `#201202` |

El acento se interpola aparte, en RGB con `smoothstep`, y alimenta `--dc-accent`:
kicker, precio, CTA, indicador activo y baño cromático cambian juntos mientras el
dedo todavía se mueve.

---

## V2.4 — Lettering

Una palabra por plato, cada una en su propio raíl.

- Tamaño: `clamp(140px, 26vw, 410px)` en desktop, `clamp(130px, 46vw, 240px)` en móvil.
- Color: el acento del **propio** plato aclarado un 46%, no el acento global
  interpolado — si usara el global, la palabra saliente derivaría hacia el tono del
  plato entrante a mitad de transición.
- Parallax: rate `0.55` respecto al raíl de platos.
- Oclusión: vive en la capa 2, bajo los platos, y no se recorta en el shell (se
  recorta en la sección), de modo que atraviesa la escena y los objetos la tapan.

**Una sola palabra en pantalla a la vez.** La V1 hacía crossfade y el resultado era
sopa de letras: dos palabras de ~1600px superpuestas. Ahora la rampa mantiene la
palabra a plena fuerza hasta `|d| 0.38` y la apaga en `0.5`, donde entra la siguiente;
mientras sale también asciende y crece, así que lee como palabra que pasa de largo,
no como palabra que se disuelve.

En vertical la palabra se dimensiona por el eje X, no por el Y: en 390x844 una
palabra al 35% de la altura no dejaría sitio para nada más. Ocupa ~16% de alto y
70–180% de ancho, deliberadamente recortada por ambos lados.

---

## V2.5 — Track, profundidad y oclusión

Track asimétrico, no espejado:

```text
        -2 alto-izquierda                    +1 alto-derecha (mas alto y mas pequeno)
   -1 medio-izquierda (mas bajo y mas grande)
                       HERO
                                                     +2 bajo-derecha, fuera de cuadro
```

| slot | x % | y % | escala | rotZ | rotX |
|---|---:|---:|---:|---:|---:|
| -2 | 14 | 17 | .58 | -11 | 42 |
| -1 | 32 | 33 | .82 | -6 | 29 |
| 0 | 53 | 55 | 1.30 | 0 | 20 |
| +1 | 76 | 25 | .77 | 10 | 35 |
| +2 | 93 | 70 | .60 | 16 | 40 |

- **Perspectiva**: `perspective:1500px` en el shell, `rotateX` por slot. Los objetos
  lejanos están más tumbados; el héroe casi de frente.
- **Oclusión**: `z-index = round(escala*160 + y*0.2)`. El orden lo marca el **tamaño
  aparente**, no el índice de slot: cuando el plato saliente encoge por debajo del
  entrante, intercambian profundidad y se cruzan físicamente.
- **Recorte**: `+2` a x 93% y `-2` a x 14% con escalas grandes salen parcialmente del
  cuadro. La colección continúa fuera de pantalla.
- **El blur no carga la profundidad**: máximo 0.8px en los vecinos inmediatos. La
  distancia la comunican escala (1.30 vs 0.82 = 1.6x), solapamiento, perspectiva,
  posición, recorte, z-order y brillo diferencial (1.06 -> 0.56).

---

## V2.6 — Separación visual respecto a Orbital

Con `data-orbital-motion="depth-carousel"`:

- `#orbit-stage` oculto (sigue siendo el estado autoritativo, invisible);
- `.orbit-ring`, `.orbit-center-mark`, `.orbit-glow` en `display:none`;
- `.orbital-top` oculto — desaparece "The Orbital Menu";
- la sección pasa a `min-height:100svh`, centrada, con el mundo cromático de fondo;
- identidad propia: `SIGNATURE COLLECTION · ARRASTRA PARA EXPLORAR`;
- el copy deja de estar centrado bajo el shell y pasa a columna editorial
  izquierda, con precio e ingredientes;
- los controles se alinean a la izquierda con indicadores.

Al volver a `elegant` todo se restaura: anillos, centro, glow, heading, copy centrado
y geometría orbital. Un test lo comprueba en cada ejecución.

---

## V2.7 — Escena continua

Responden a la **posición fraccionaria**, no al índice comprometido:

| Capa | Rate | Qué hace durante el gesto |
|---|---:|---|
| Platos | 1.00 | posición, escala, rotZ, rotX, opacidad, blur, brillo, z-order, arco secundario |
| Lettering | 0.55 | desplazamiento, ascenso, escala, relevo de palabra |
| Fondo | 0.20 | crossfade entre mundos, desplazamiento, escala |
| Acento | continuo | `--dc-accent` interpolado -> kicker, precio, CTA, indicador |
| Copy | continuo | atenuación proporcional a la fracción |

El copy **no** cambia de texto durante el vuelo: se atenúa hasta un 38% y el motor
base hace el relevo tapado por esa atenuación. Elegante y sin parpadeo.

---

## V2.8 — Errores encontrados en V2

### V2-E1 — Título y precio se desincronizaban en vuelo

**Síntoma.** En la grabación de movimiento aparecían fotogramas con
`Gamba roja salvaje / €22 / ARTICHOKE · EGG YOLK`.

**Causa.** El motor base escribe meta/título/descripción según **su** progreso; este
motor escribía precio/ingredientes según **su** posición. En un vuelo de varios
índices ambos avanzan a ritmos distintos y a mitad de trayecto describen platos
diferentes. Es exactamente el criterio de rechazo "copy y producto se desincronizan".

**Solución.** `activeIndex` sigue marcando el héroe visual, pero ya no gobierna el
texto: precio, ingredientes e indicadores se escriben desde `#dish-counter`, la misma
fuente que el motor base usa para el título. No pueden discrepar.

**Validación.** `V2 title and price never disagree in flight` — muestrea 12 fotogramas
de un vuelo de 3 índices y exige que ningún título aparezca nunca con dos precios.

---

### V2-E2 — El acento saltaba hacia atrás a mitad de gesto

**Síntoma.** A `position` exactamente 0.5 el color volvía al del plato de partida.

**Causa.** El par de colores se elegía con `Math.round(position)`. En 0.5 el redondeo
cambia de plato y el par se invierte, produciendo un salto en vez de una rampa.

**Solución.** Interpolar siempre entre `floor(position)` y `floor(position)+1` con
`smoothstep`. Monótono y continuo en todo el recorrido.

**Validación.** `V2 accent interpolates during the drag`, muestreado en 0 / 0.5 / 0.94.

---

### V2-E3 — El lettering pintaba rectángulos sobre los platos

**Síntoma.** Bandas rectangulares translúcidas cruzando los platos, visibles sobre
todo en móvil durante la transición.

**Causa.** `mix-blend-mode: screen` en `.dc-word`, conviviendo con el contexto
`transform-style: preserve-3d` de `.dc-plates`. Chromium sacaba las cajas de los
glifos fuera de su contexto de apilamiento y las componía por encima de los platos.

**Solución.** Retirado el blend mode; el contraste se recupera aclarando el color de
la palabra y subiendo la opacidad. Sin artefactos y con un compositing más barato.

---

### V2-E4 — El parallax de fondo derivaba sin límite (heredado y resuelto)

Ya corregido en V1 anclando cada capa a su propio índice en lugar de a la posición
absoluta. V2 mantiene ese modelo para fondo, lettering y platos.

---

### V2-E5 — Errores del harness

- La aserción de lettering leía `document.querySelector('.dc-word')`, que con seis
  palabras devuelve siempre la primera. Ahora lee la dominante por opacidad.
- El umbral de tamaño del lettering era el mismo en desktop y móvil. Se ha separado
  por eje, con el motivo documentado en el propio test.

---

## V2.9 — Diagnóstico del workflow rojo

**`.github/workflows/class4-smoke.yml` aparecía en rojo en cada push, de cualquier rama.**

Hay **dos fallos apilados**, ambos anteriores a Project 01.

### Capa 1 — El workflow no era YAML válido

`GET /actions/workflows` devolvía el nombre del workflow como
`.github/workflows/class4-smoke.yml` en lugar de `Class 04 smoke checks`. GitHub usa
el path como nombre cuando no puede parsear el fichero. La página del run lo confirma:

> Invalid workflow file — You have an error in your yaml syntax on line 30

Línea 30:

```yaml
run: node -e "... console.log('NAMI preset: PASS')"
```

Un escalar plano de YAML no puede contener dos puntos seguidos de espacio. El parser
corta ahí y el fichero entero queda inválido. Como tampoco podía leer el bloque `on:`,
GitHub no aplicaba el filtro de ramas y creaba un *startup failure* (run en rojo, cero
jobs, sin logs) en **cada** push, incluidas ramas que el filtro nunca debió aceptar.

Corregido pasando el comando a escalar de bloque (`run: |`). Los seis workflows del
repositorio parsean ahora correctamente.

### Capa 2 — El contrato estático de Clase 04 está caducado

Con el YAML reparado, el workflow se ejecuta por primera vez en semanas y falla en
`scripts/class4-static-check.mjs`:

```text
Studio shell is not loaded independently
```

El check exige que `class4-store.js` contenga `shell.src='studio-shell.js'`. Ese
loader ya no existe y **nadie carga `studio-shell.js`**: es código muerto. La lógica
del drawer se movió a `app-v4.js` en una clase posterior.

**El producto no está roto**: Studio abre, cierra, edita, persiste y sobrevive a
recarga, verificado por `class8`, `class5-complete-e2e` y `class6-product-e2e`.
Lo que está desactualizado es la aserción, que protege una implementación sustituida.

**Verificado en `main` limpio**: `node scripts/class4-static-check.mjs` sale con
código 1 exactamente igual, sin ningún cambio de esta rama.

**No se ha tocado.** Corregirlo implica decidir entre reponer `studio-shell.js` o
actualizar el contrato a la arquitectura vigente, y esa decisión pertenece a Clase 04,
no a Project 01. La misión es explícita: no cambiar código funcional sólo para poner
un check en verde.

### La otra regresión preexistente sigue igual

`tests/class5-orbital-e2e.mjs` continúa fallando en `main` y aquí por el mismo motivo
documentado en V1: espera `orbitalChoreography === 'urban-acrobatics-v5-final'` cuando
el preset por defecto es `elegant` y el test no lo selecciona.

---

## V2.10 — Responsive

**Desktop (>=820px)**: sección a pantalla completa, shell `min(58vw,660px)`, objeto
base `clamp(200px,30vw,520px)`, héroe a 1.30, copy en columna editorial izquierda,
lettering a 26vw, `+2` y `-2` recortados por los bordes.

**Móvil (<820px)**: no es una reducción del desktop.
- shell `52vh`, objeto base `clamp(200px,62vw,330px)`, héroe a 1.30 -> domina el cuadro;
- exactamente 2 secundarios perceptibles (`±1`), fuertemente solapados con el héroe;
- `±2` sólo insinuados en los bordes;
- lettering a 46vw, recortado por ambos lados;
- `dragUnit` a 0.34 del ancho para que un swipe corto de pulgar no salte tres platos;
- arco secundario reducido (7px vs 16px) y blur más bajo;
- copy alineado a la izquierda, a ancho completo, plenamente legible.

---

## V2.11 — Performance

Se mantienen las decisiones de V1 y se añaden:

- `drop-shadow` sólo en objetos visibles; los de opacidad < 0.02 reciben `filter:none`;
- blur máximo 3.2px y sólo en slots ya casi transparentes;
- `mix-blend-mode` retirado (V2-E3): además de artefacto, era una capa de compositing cara;
- los mundos cromáticos son gradientes CSS, no imágenes: seis capas sin coste de red;
- los assets libres pesan ~230KB cada uno en WebP, por debajo de las fotografías originales;
- se sigue animando sólo `transform`, `opacity` y `filter`; ningún layout por frame;
- un único listener por tipo de evento, en `document`, en fase de captura.

---

## V2.12 — Resultados Playwright

**92/92** en desktop 1440x900, móvil 390x844 y reduced motion.

Cobertura V2 añadida: objetos libres sin card circular · lenguaje Orbital silenciado ·
mundo cromático distinto por plato · lettering arquitectónico · oclusión entre objetos
a distinta profundidad · colección recortada por el cuadro · composición asimétrica ·
profundidad no sostenida por blur · crossfade de fondo con el gesto · acento
interpolado durante el drag · una sola palabra en pantalla · atenuación del copy sin
parpadeo · la escena se mueve antes de que el índice se comprometa · título y precio
nunca discrepan en vuelo.

Regresión verificada en cada ejecución: `class5-complete-e2e`, `class6-product-e2e`,
`class7-editorial-flow-static`, Studio, ficha de plato, persistencia y restauración
íntegra del preset Orbital.

**Evidencia de movimiento**: `tests/video/depth-carousel-v2-desktop.webm` (14.1s) y
`tests/video/depth-carousel-v2-mobile.webm` (13.0s), generados por
`tests/record-depth-carousel-video.mjs`. El vídeo móvil usa toques reales vía CDP,
no `PointerEvent` fabricados.

---

## V2.13 — Limitaciones que siguen abiertas

1. **La fotografía es cenital.** Los objetos ya no son cards, pero el plato sigue
   siendo redondo. El salto siguiente es de producción de assets, no de código.
2. **Studio sólo expone el preset.** `word`, `accent`, `asset` y los fondos viven en
   el modelo y se exportan con el proyecto, pero no hay campos en el panel. Deliberado:
   la misión V2 prohíbe convertir esto en una reconstrucción del Studio.
3. **`foregroundDecor` / `backgroundDecor` están declarados y no implementados.** El
   contrato los reserva; el motor todavía no pinta capas decorativas.
4. **La interpolación de acento es RGB.** Entre tonos opuestos (naranja -> azul) pasa
   por un punto desaturado. Sólo se ve a mitad de gesto, pero un recorrido en HSL
   daría una transición más limpia.
5. **El héroe no pasa por delante del copy.** `.dish-copy` mantiene z-index superior
   por legibilidad. Es una decisión de UX; invertirlo pondría texto detrás de un plato.
6. **Sin medición de FPS en dispositivo real.** Las decisiones están razonadas y las
   capas caras eliminadas, pero no hay traza capturada.
7. **Sin autoplay.** Decisión: competiría con el drag. Revisable.
8. **El cursor contextual sigue siendo el heredado**, sin distinguir héroe de lateral.

---

## V2.14 — Qué falta para el Restaurant Motion Engine

Sin cambios respecto a V1, más dos puntos que V2 hace evidentes:

9. El **asset contract** (`depthCarousel.asset` + pipeline de recorte) debería subir a
   la capa común: Anchor Swap y Dish Stage necesitan exactamente lo mismo.
10. El **Scene Background Engine** es reutilizable tal cual por los cinco presets y
    debería extraerse antes de escribir Project 02.

---
---

# VISUAL DIRECTION V3 — FINAL ART DIRECTION PASS

> Estado: **LAB V3, pendiente de revisión humana final.**
> Baseline revisado: `f7a4a3c`. Arquitectura V1/V2 conservada, no reconstruida.

## V3.1 — Punto de partida

| Iteración | Valoración humana |
|---|---|
| V1 | ~40% |
| V2 | ~60–65% |
| V3 | objetivo 80–90% |

La V2 resolvió la identidad (adiós al lenguaje Orbital), los mundos cromáticos, el
lettering grande, el track asimétrico y el drag continuo. La revisión humana señaló
siete problemas perceptivos. Esta sección documenta qué se hizo con cada uno.

---

## V3.2 — Problema 01 · Los productos seguían siendo platos redondos

**Diagnóstico correcto de la revisión:** no era un problema de CSS. El pipeline V2
quitaba la card, el fondo y la sombra de contenedor, pero conservaba **el plato
cenital completo**. La silueta seguía siendo un círculo.

### Asset Pass V3

`scripts/build-depth-assets-v3.mjs` segmenta **la comida separándola de la
porcelana** y la exporta con su relación de aspecto real.

```text
dish.image (2048x2048)
  1  localizar la PORCELANA (masa clara y desaturada), no el marco
  2  percentil 70 de luminancia dentro del disco = referencia del plato
     — un promedio hace que media vajilla se lea como comida por su viñeteado
  3  comida = saturación > .24  OR  luminancia < porcelana - .22
     nunca "más brillante que la media", que es el propio brillo del plato
  4  cierre morfológico (dilate+erode r=2) -> el emplatado es UNA composición
  5  componentes conexos; se descartan los arcos del borde interior del plato
     (bounding box enorme, relleno < 14%)
  6  recorte al bounding box real + feather de 2px
  7  WebP con alpha, lado máximo 900px, SIN forzar cuadrado
```

Resultado: **seis siluetas realmente distintas.**

| Plato | Silueta | Ratio |
|---|---|---:|
| Gamba roja | gambas en S sobre crema, irregular | 0.94 |
| Atún rojo | cinta curva vertical | **0.67** |
| Alcachofa | racimo radial de bordes rotos | 1.00 |
| Lubina | filete + puerros, horizontal | 1.03 |
| Presa ibérica | láminas + cebolleta, horizontal | 1.01 |
| Miel quemada | racimo cítrico compacto | 1.10 |

`.dc-plate img` usa `object-fit: contain`, así que una cinta alta se dibuja alta y
un filete ancho se dibuja ancho. Ya no hay seis discos.

`assets/depth-carousel/_preview-v3.png` es la hoja de contactos sobre fondo de color
con la que se juzgaron los bordes alpha. Los recortes de plato de la V2 se conservan
en el repositorio como comparación.

**Lo que sigue sin resolverse desde código:** la fotografía de origen es cenital.
Alcachofa y postre siguen siendo composiciones aproximadamente redondas porque el
emplatado lo es. Un bowl en tres cuartos o una copa darían otro salto — el contrato
ya los acepta sin tocar el motor.

---

## V3.3 — Problema 02 · Barro cromático en el crossfade

Se sustituye la mezcla por transparencia por **dos mundos puros y una invasión
espacial**.

```text
.dc-bg-a   mundo A, a sangre, sin recortar
.dc-bg-b   mundo B, encima, recortado por el gesto

t = 0.00   ████████████████████ A
t = 0.30   ██████████████░░░░░░ A | B
t = 0.50   ██████████░░░░░░░░░░ A | B
t = 1.00   ░░░░░░░░░░░░░░░░░░░░ B
```

`clip-path: polygon()` con arista inclinada (7% de skew) y una fina línea de acento
sobre la costura (`.dc-wipe-edge`) que sólo aparece durante la transición. Ambos
colores conservan su saturación en todo momento: nunca se mezclan.

**Dirección**: B es siempre el plato `floor(pos)+1`. Al arrastrar hacia adelante B
entra por la derecha; al arrastrar hacia atrás la costura retrocede y A se revela
desde la izquierda. La continuidad espacial sale gratis del modelo.

**Acento sin barro** (Option A del brief): se mantiene el acento de A y se cruza a B
con `smoothstep(0.44, 0.56)`. Durante el 88% del recorrido el color es puro; el
cruce dura un 12% y queda tapado por la propia transición.

---

## V3.4 — Problemas 03 y 04 · Lettering tapado y transición con agujero

**Posición.** La palabra sube a `top: -7%` del shell, es decir a la banda superior
de la escena, con `font-size: clamp(120px, 20vw, 300px)` y opacidad 0.50. Los
objetos la cruzan por abajo: oclusión medida en los tests, exigida por debajo del
55% del área de la palabra.

**Transición enmascarada.** La V2 apagaba una palabra antes de encender la otra —
limpio pero con un agujero. Ahora **ambas palabras existen a plena fuerza**, cada una
recortada a un lado de la **misma costura** que separa los dos mundos cromáticos:

```text
t = 0.00   FIRE ────────────────────────
t = 0.50   FIRE ──────┤├────── BLUEFIN
t = 1.00   ──────────────────── BLUEFIN
```

Nunca hay sopa (ocupan regiones espaciales disjuntas) y nunca hay agujero (la suma de
sus fracciones visibles es 1 en todo momento; el test lo comprueba). Además se
separan horizontalmente con `sin(π·t)·0.09·W`, máximo a mitad de gesto y cero en los
extremos, para que se lean como dos palabras y no como una rota.

**El campo `word` es curado, no derivado.** FIRE, BLUEFIN, EMBER, SEA, IBERIAN,
HONEY viven en `dish.depthCarousel.word`. El fallback a la primera palabra del nombre
sigue existiendo para proyectos que no lo definan.

---

## V3.5 — Problema 05 · Falta de profundidad Z real

El track incorpora `z` (translateZ) dentro de `perspective: 1500px`:

| slot | x (pantalla) | y | escala | z | tamaño aparente |
|---|---:|---:|---:|---:|---:|
| -2 | 9% | 16% | .56 | -560 | .41 |
| -1 | 43% | 28% | .74 | -250 | .63 |
| **0** | **62%** | **62%** | **1.16** | **+150** | **1.29** |
| +1 | 83% | 20% | .72 | -210 | .63 |
| +2 | 104% | 76% | .60 | -500 | .45 |

El héroe es **2.05x** su vecino y esa diferencia viene de la distancia a cámara, no
de un sprite mayor. El orden de pintado sale de `z`, así que cuando el objeto
saliente retrocede por debajo del entrante **intercambian plano y se cruzan**; el
test lo comprueba comparando el orden en `position 0` y `position 1`.

**Corrección importante:** con perspectiva, un objeto con Z negativa se proyecta
*hacia el punto de fuga*. La tabla V2 describía coordenadas pre-perspectiva y la
composición se comprimía hacia el centro — ningún objeto llegaba al borde del cuadro.
Ahora `x`/`y` son **posiciones de pantalla** y `renderAt()` divide por
`P/(P-z)` antes de posicionar. La tabla dice lo que se ve.

---

## V3.6 — Problema 06 · Objetos secundarios declarados pero no usados

`foregroundDecor` y `backgroundDecor` ahora se renderizan.

El mismo pipeline extrae, en una **segunda pasada sobre la máscara sin cerrar**, los
componentes individuales del emplatado: hierbas, flores, gajos de cítrico, quenelles
de salsa. Se rankean por saturación ponderada por tamaño (un ingrediente con color
vale más que un punto de salsa beige) y se exportan aparte. 15 recortes disponibles;
la asignación por plato es dirección de arte, no automática, y dos platos toman
prestada una guarnición de un plato hermano porque su emplatado segmenta como una
sola masa.

| Capa | Rate | Tratamiento |
|---|---:|---|
| `.dc-decor-back` | 0.32 | pequeño, `blur(4px) brightness(.62)`, opacidad 0.42 |
| `.dc-decor-front` | **1.30** | grande, `blur(.9px)` + sombra proyectada, opacidad plena |

La capa delantera **va más rápido que los productos** (1.30 vs 1.00): durante una
transición entra por un borde, cruza por delante del héroe y sale por el otro. Es lo
que produce la sensación de cámara física. El test lo verifica midiendo que recorre
al menos un 15% más que un plato en el mismo intervalo.

---

## V3.7 — Problema 07 · Copy legible y mejor situado

- El copy pasa a **posición absoluta en la sección**: `left: 6vw`, `top: 31%`,
  ancho `min(350px, 25vw)`. Sube y participa en la composición.
- `.dc-scrim` es una caída de luz sobre el tercio izquierdo, dentro del backdrop:
  garantiza contraste sin dibujar una caja.
- **El track respeta al copy, no al revés.** El héroe vive en el 62% y el vecino
  izquierdo en el 43%. Un test mide el solapamiento real entre la caja del copy y
  todo plato con opacidad > 0.5, y exige que no supere el 25%.
- `.dish-copy` mantiene `z-index` superior al de los productos. §40: el copy es
  interfaz y tiene que seguir siendo usable.
- Curva de atenuación durante la transición: `1 − smoothstep(0.10, 0.42, |frac|)·0.9`.
  A mitad de gesto el copy baja al 10%, el motor base hace el relevo tapado por esa
  atenuación, y a 0.75 ya ha vuelto. Un solo bloque, nunca dos superpuestos.

---

## V3.8 — Cursor

En modo Depth Carousel el cursor heredado se reestiliza con `--dc-accent`: contorno
sobre fondo transparente con la etiqueta `DRAG`, y **relleno sólido en color de
acento con la etiqueta `VIEW`** cuando está sobre el héroe, que es donde el click
abre la ficha. Cambia de color con cada mundo cromático.

---

## V3.9 — Errores encontrados en V3

### V3-E1 — El click sobre el objeto no abría la ficha

**Síntoma.** `document.elementFromPoint()` en el centro exacto del héroe devolvía
`.orbit-shell`. Ningún objeto era seleccionable con el ratón; sólo funcionaba el CTA.

**Causa.** Los objetos viven en un contexto `transform-style: preserve-3d` cuyo
ancestro `.dc-scene` es `pointer-events: none`. Reactivar `pointer-events: auto` en
el hijo — e incluso en el contenedor — no los hace hit-testables en Chromium cuando
además llevan `translateZ` y `filter`.

**Solución.** Selección **geométrica**, el mismo enfoque que ya usaba
`class6-detail-bridge`: el objeto visible bajo el puntero, el más cercano a cámara
por su `z`. El `closest('.dc-plate')` del DOM se mantiene como vía rápida. El cursor
usa el mismo test, así que `VIEW` y la apertura coinciden siempre.

**Validación.** `clicking the hero object opens the dish`, y el vídeo desktop termina
abriendo la ficha de Clase 06 desde el propio producto.

---

### V3-E2 — La perspectiva comprimía la composición

Descrito en V3.5. Ningún objeto alcanzaba el borde del cuadro porque la tabla estaba
en coordenadas pre-perspectiva. Detectado por el test
`the collection continues past the frame`, que pasó de 0 objetos recortados a
cumplirse tras convertir la tabla a coordenadas de pantalla.

---

### V3-E3 — Segmentación inicial que conservaba plato y bajoplato

Dos iteraciones fallidas antes de acertar:
1. el guard radial usaba el disco equivocado y conservaba el bajoplato oscuro;
2. usar la luminancia media de la porcelana como referencia hacía que su propio
   viñeteado se leyera como comida, conservando el plato entero.

Resueltos con detección explícita de la porcelana, percentil 70 como referencia y
un criterio de comida basado en saturación **o** oscuridad real, nunca en brillo.

---

### V3-E4 — Errores del harness

- Las aserciones de lettering leían `getComputedStyle().clipPath` buscando
  porcentajes; el navegador lo resuelve a **píxeles**. Toda medida de la palabra
  daba 1.00 y las comprobaciones eran falsos positivos. El helper ahora acepta
  ambas unidades y calcula la fracción visible real.
- La aserción heredada exigía que la palabra estuviese contenida en el nombre del
  plato. En V3 la palabra es una etiqueta curada, así que se compara contra
  `dish.depthCarousel.word`.

---

## V3.10 — Mobile

No es una reducción del desktop:

- shell `46vh`, objeto base `clamp(190px, 58vw, 300px)`, héroe a 1.14 con z +140 →
  domina el cuadro;
- exactamente **dos** secundarios perceptibles (`±1`), fuertemente solapados con el
  héroe y recortados por los bordes;
- `±2` sólo insinuados;
- lettering a 40vw, `top: -4%`, recortado por ambos lados;
- scrim reorientado a 6° (caída inferior) porque el copy va debajo, no a la izquierda;
- copy y controles en flujo normal, a ancho completo y plenamente legibles;
- `dragUnit` a 0.34 del ancho para que un swipe corto de pulgar no salte tres platos.

---

## V3.11 — Resultados Playwright

**110/110** en desktop 1440×900, móvil 390×844 y reduced motion.

Nuevas comprobaciones V3: dos mundos cromáticos coexistiendo a plena opacidad · la
costura del wipe sigue al gesto (100% → 50% → 0%) · `translateZ` reparte la colección
en profundidad y el héroe lee como el objeto más cercano · los objetos intercambian
plano al cruzarse · las capas de decor están renderizadas y visibles · el decor
delantero viaja más rápido que los productos · el lettering sigue legible bajo la
oclusión · la zona segura del copy se respeta · el cursor pertenece a esta escena ·
el click sobre el objeto abre la ficha · lettering enmascarado continuo, sin sopa y
sin agujero.

Se conservan todas las comprobaciones V1/V2, incluidas la sincronía título/precio en
vuelo y la restauración íntegra del preset Orbital.

Regresión verificada: `class5-complete-e2e`, `class6-product-e2e`,
`class7-editorial-flow-static`, Studio, ficha, persistencia y preset restaurado.

**Evidencia de movimiento**: `tests/video/depth-carousel-v3-desktop.webm` (16.8s) y
`tests/video/depth-carousel-v3-mobile.webm` (17.6s). El guion incluye parada sobre la
costura al 50%, arrastre inverso, cambio de producto y apertura de la ficha desde el
propio objeto. El vídeo móvil usa toques reales vía CDP.

---

## V3.12 — Limitaciones que siguen abiertas

1. **La fotografía es cenital.** El asset pass elimina el plato, pero alcachofa y
   postre siguen siendo composiciones redondas porque el emplatado lo es. El motor ya
   acepta escorzo, bowls y copas; falta producirlos.
2. **Studio sólo expone el preset.** `asset`, `word`, `accent`, fondos y decor viven
   en el modelo y se exportan con el proyecto, pero no hay campos en el panel. La
   misión V3 prohíbe expresamente ampliarlo.
3. **La asignación de decor es manual.** El pipeline genera 15 recortes; cuál va a
   cada escena es una decisión de arte escrita en `class4-config.js`. Dos platos
   toman prestada una guarnición de un plato hermano.
4. **Un solo decor por capa y plato.** El contrato acepta la cadena; no hay soporte
   todavía para varios assets por capa.
5. **El héroe no pasa por delante del copy.** Decisión de UX (§40): invertirlo
   pondría texto detrás de un producto.
6. **Sin medición de FPS en dispositivo real.** Las decisiones están razonadas y las
   capas caras eliminadas (`mix-blend-mode` fuera desde V2, blur acotado, sombras
   sólo en objetos visibles), pero no hay traza capturada.
7. **Sin autoplay** y **sin varios idiomas para `word`**: la palabra es única por
   plato, no bilingüe como el resto del copy de Clase 06.

---

## V3.13 — Qué falta para el Restaurant Motion Engine

A lo ya listado en V1 y V2 se añade:

11. El **asset pipeline** (`build-depth-assets-v3.mjs`) es una capacidad de producto,
    no un script de laboratorio: debería poder ejecutarse sobre la fotografía que
    suba un restaurante desde Studio.
12. El **wipe A/B** y el **lettering enmascarado** comparten una única arista. Esa
    arista es un primitivo reutilizable: Anchor Swap (Project 02) es exactamente el
    mismo mecanismo con un ancla encima.
13. Las **capas de decor con rate propio** son genéricas y deberían subir a la capa
    común antes de escribir Project 02.

---

## V3b — MICRO-ITERACIÓN FINAL DE CIERRE

> Dos ajustes concretos sobre `f7a4a3c`/`6e61119`. Sin rediseño, sin features nuevas,
> sin tocar Studio, wipe A/B, lettering, copy safe zone ni arquitectura.

### V3b.1 — Cinco presencias simultáneas

La revisión veía tres productos claros. **No era una decisión de composición: era un
bug.** Los slots `±2` se estaban pintando fuera del cuadro desde la V3.

**Causa.** `perspective` sólo proyecta a los **hijos directos** del elemento que la
declara. Estaba en `.orbit-shell`, y un plato es bisnieto:

```text
.orbit-shell (perspective)  →  .dc-scene  →  .dc-plates  →  .dc-plate
```

`.dc-scene` es un div plano, así que la cadena 3D se rompía ahí. Los platos recibían
su `translateZ` pero **nunca la proyección**, de modo que un slot autorizado a
`x = 109%` del shell (valor pre-perspectiva, pensado para proyectarse a 95%) se
pintaba literalmente en el 109% — fuera de pantalla. Y `getBoundingClientRect()` sí
aplicaba la perspectiva, así que **toda medición decía que el objeto estaba en
pantalla**: los tests pasaban y el objeto no existía visualmente.

Se detectó marcando el elemento con un contorno: el contorno aparecía en la esquina
inferior derecha de su propio rect declarado.

**Solución.** La perspectiva pasa a `.dc-plates`, que es el padre directo de los
platos. Como consecuencia:

- desaparece la necesidad de `transform-style: preserve-3d` para la proyección;
- `opacity` y `filter` se mueven del botón a la imagen. Ambas son propiedades de
  agrupación: cualquiera de las dos aplana su elemento fuera del contexto 3D, que era
  la segunda mitad del mismo problema. El botón conserva sólo `transform`.

Con la proyección funcionando, el track se reequilibró para cinco presencias reales:

| slot | x pantalla | escala | opacidad | z | ancho medido |
|---|---:|---:|---:|---:|---:|
| −2 | 28% | .64 | .70 | −540 | 158 px |
| −1 | 45% | .76 | .96 | −250 | 230 px |
| **0** | **63%** | **1.16** | **1** | **+150** | **439 px** |
| +1 | 84% | .74 | .96 | −210 | 220 px |
| +2 | 95% | .70 | .72 | −470 | 178 px |

Cinco presencias, tres escalones de tamaño, héroe 2.8× los lejanos, y los dos
extremos recortados por los bordes del cuadro. En móvil se mantienen cinco, pero con
los lejanos mucho más insinuados para no amontonar.

### V3b.2 — Decorativos reales por plato

`foregroundDecor` acepta ahora **una cadena o una lista**. Cada plato tiene:

- **2 ingredientes en primer plano** (rate 1.35, por delante del héroe);
- **1 ingrediente de fondo** (rate 0.34, detrás del lettering);
- **1 atmósfera propia** — un lavado radial teñido con el acento del plato, generado
  en CSS. Es el humo / vapor / agua que pedía el brief, no cuesta red, y garantiza
  que ningún plato se quede sin ecosistema aunque su emplatado no dé recortes.

Los recortes ambiguos (quenelles de salsa, motas blancas, migas negras) se retiraron
de la asignación: sólo se usan ingredientes identificables — hojas, flores, gajos de
cítrico, trazos de aceite. 18 elementos y 6 atmósferas en escena, **6/6 combinaciones
distintas**.

| Plato | Primer plano | Fondo |
|---|---|---|
| FIRE | gajo cítrico + hoja de salvia | trazo de aceite cálido |
| BLUEFIN | gajo de naranja sanguina + flor y hoja | punto verde |
| EMBER | trazo de aceite verde + brizna | punto verde |
| SEA | flor y hoja + brizna cítrica | punto verde |
| IBERIAN | hoja de salvia + gajo cítrico | punto verde |
| HONEY | trazo de aceite cálido + flor y hoja | hoja de salvia |

**Estructura.** Un grupo por plato y por capa. El grupo lleva el parallax y la
opacidad; los ingredientes van dentro, anclados a su propia posición. Así todo el
ecosistema viaja junto a una velocidad que no es la del producto, con un solo
`gsap.set` por capa y plato.

**Ventana de visibilidad.** Sólo el plato en foco conserva su ecosistema
(`1 − |d|·1.55` delante, `1 − |d|·1.45` detrás). Una ventana más ancha parecía más
rica en un fotograma y en el siguiente barría la guarnición de un plato vecino por
encima del copy y de los controles, precisamente porque el raíl delantero viaja más
rápido que los productos.

### V3b.3 — Validaciones pedidas

| | Comprobación | Resultado |
|---|---|---|
| A | Cinco productos simultáneos en desktop | **5** · anchos 158/230/439/220/178 · 3 escalones |
| B | Decor visible en cada plato | 18 elementos + 6 atmósferas; 1 fondo y 2 frente visibles por escena |
| C | El decor cambia por plato | **6/6 combinaciones distintas** |
| D | El decor se mueve a otra velocidad | delantero 116 px vs plato 42 px en el mismo intervalo (2.8×) |
| E | Sin regresiones | 114/114 · `class5-complete-e2e`, `class6-product-e2e`, `class7-editorial-flow-static` en verde |

### V3b.4 — Nota sobre las pruebas

El bug de perspectiva pasó desapercibido en V3 porque **todas las mediciones se
hacían con `getBoundingClientRect()`**, que aplicaba una proyección que el pintado no
aplicaba. La lección para el Motion Engine: en escenas 3D, una aserción geométrica no
sustituye a mirar el fotograma. Las comprobaciones nuevas de esta micro-iteración
miden tamaños relativos y escalones, no sólo presencia en el DOM, y `geom()` lee ahora
opacidad y filtro de la imagen, que es donde viven.

---
---

# PROJECT 01 — FINAL CLOSURE

**STATUS: APPROVED / CLOSED** · aprobado por **Juanma** el **2026-09-05**
**Baseline aprobado:** `532133496e2c861fa24dc905f5b09b8dfc6f1ade`
**Rama de desarrollo:** `feat/depth-carousel-lab` → integrada en `main`

---

## Resultado final aprobado

Depth Carousel es la primera capacidad completa del **Restaurant Motion Engine**: un
preset de navegación de producto que convive con Orbital, Elegant, Urban y Editorial
Flow sin sustituir a ninguno, seleccionable desde Studio → Motion.

Lo que entrega, verificado en la revisión humana:

- **Cinco productos simultáneos** en desktop, con anchos 158/230/**439**/220/178,
  tres escalones de tamaño y héroe 2.8× los lejanos.
- **Profundidad Z real**: `translateZ` por slot dentro de una perspectiva compartida,
  con intercambio de plano cuando dos objetos se cruzan.
- **Assets recortados**: la comida segmentada de la porcelana, con siluetas
  irregulares y relación de aspecto real. No son seis discos.
- **Dos mundos cromáticos puros** con **spatial wipe**: B invade a A por una arista
  inclinada gobernada por el gesto. Sin barro RGB.
- **Masked lettering**: las dos palabras a plena fuerza a lados opuestos de esa misma
  arista. Continuo, sin sopa y sin agujero.
- **Copy safe zone** con caída de luz propia: el track respeta al copy, no al revés.
- **Ecosistema decorativo por plato**: dos ingredientes en primer plano, uno de fondo
  y una atmósfera teñida con el acento del plato.
- **Parallax diferencial** por capas: fondo 0.20 · decor de fondo 0.34 · lettering
  0.52 · productos 1.00 · decor delantero 1.35.
- Desktop, mobile con composición propia, reduced motion, ficha de plato real,
  Studio, persistencia y restauración íntegra del preset Orbital.

## Evidencia de cierre

| | |
|---|---|
| Playwright | **114/114** (desktop 1440×900 · móvil 390×844 · reduced motion) |
| Regresión | `class5-complete-e2e`, `class6-product-e2e`, `class7-editorial-flow-static` en verde |
| CI | `Project 01 Depth Carousel` verde en el baseline aprobado |
| Capturas | `tests/screenshots/v3b-*` (idle, ¼, ½, ¾, next-scene, detalle, regresión Orbital) |
| Vídeo | `tests/video/depth-carousel-v3b-desktop.webm` (18.2s) · `…-mobile.webm` (17.8s) |
| URL | https://juanmaes83.github.io/WEB-RESTAURACI-N-PREMIUM-DIN-MICA/ |

## La lección que nos llevamos

El defecto más caro del proyecto no fue de diseño: fue de **método de verificación**.

Durante tres iteraciones los slots `±2` se pintaron fuera del cuadro y nadie lo vio en
los tests, porque **todas las aserciones medían `getBoundingClientRect()`**. Ese
método aplicaba la proyección de perspectiva que el pintado **no** estaba aplicando
—la `perspective` estaba declarada en un ancestro que no era el padre directo— de modo
que cada medición confirmaba un objeto que en pantalla no existía. Los tests estaban
verdes sobre una composición incompleta.

> **En escenas 3D, una aserción geométrica no es prueba visual.**
> Medir el DOM demuestra que el elemento existe, no que se ve. Toda capacidad del
> Motion Engine necesita, además de tests: captura, vídeo y revisión humana del
> fotograma.

Las comprobaciones actuales miden tamaños relativos y escalones, no mera presencia, y
`geom()` lee opacidad y filtro de la imagen, que es donde viven desde el arreglo.

## Limitaciones conocidas que NO bloquean el cierre

1. **La fotografía de origen es cenital.** El plato ha desaparecido de las siluetas,
   pero alcachofa y postre siguen siendo composiciones redondas porque el emplatado lo
   es. El contrato ya acepta escorzo, bowls y copas sin tocar el motor: es producción
   de assets, no ingeniería.
2. **Studio expone el preset, no sus parámetros.** `asset`, `word`, `accent`, fondos y
   decor viven en el modelo y se exportan con el proyecto, pero no hay campos en el
   panel.
3. **La asignación de decor es manual**, escrita en `class4-config.js`. Dos platos
   toman prestada una guarnición de un plato hermano.
4. **Un solo asset por capa de fondo**; el primer plano ya acepta lista.
5. **El héroe no pasa por delante del copy** — decisión de UX: el copy es interfaz.
6. **Sin traza de FPS en dispositivo real.** Las decisiones están razonadas y las capas
   caras eliminadas, pero no medidas.
7. **Sin autoplay** y `word` no es bilingüe, a diferencia del resto del copy de Clase 06.

## Regresiones preexistentes, ajenas a este proyecto

- `scripts/class4-static-check.mjs` falla en `main` desde antes de Project 01: exige
  que `class4-store.js` cargue `studio-shell.js`, que ya no existe y es código muerto.
  El comportamiento que protegía sigue funcionando. Diagnóstico completo en V2.9.
- `tests/class5-orbital-e2e.mjs` espera `urban-acrobatics-v5-final` sin seleccionar el
  preset Urban.

Ninguna se ha tocado: pertenecen a Clase 04 y Clase 05.

## Declaración

> **Project 01 queda congelado como capacidad aprobada del Restaurant Motion Engine.**

No se reabre para rediseño. Cualquier evolución futura entra como preset nuevo o como
extracción de sus primitivos a la capa común, nunca como otra iteración visual sobre
esta.

## Qué hereda el Motion Engine

Primitivos ya probados que Project 02 y siguientes deben reutilizar en lugar de
reescribir:

1. **Contrato de motor aditivo**: el motor base conserva el estado autoritativo del
   producto; el preset posee sólo la coreografía visible y confirma navegando el DOM
   real. Ni segundo índice, ni segundo modelo de plato, ni ficha duplicada.
2. **Propiedad exclusiva del puntero** en fase de captura, con guarda por modo.
3. **Selección geométrica** del objeto bajo el cursor: en contextos 3D el hit-testing
   del DOM no es fiable.
4. **Arista única compartida** entre el wipe de fondo y el relevo de lettering.
5. **Grupos de decor con rate propio**, y el aviso de que el raíl delantero, al ir más
   rápido que los productos, barre la zona del copy si su ventana de visibilidad es
   demasiado ancha.
6. **Pipeline de recorte de assets** sobre la fotografía existente.
7. **Latch de sincronización** con el contador del motor base, que barre índices
   intermedios durante su tween.
