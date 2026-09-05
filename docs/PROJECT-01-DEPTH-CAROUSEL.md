# PROJECT 01 — CINEMATIC DEPTH CAROUSEL

> Estado: **LAB desarrollado, pendiente de validación humana.**
> Rama: `feat/depth-carousel-lab`.
> Regla vigente: `CLASE N+1 = CLASE N APROBADA + NUEVA CAPACIDAD`.
> Este documento no aprueba nada. Aprueban Juanma + ChatGPT tras revisión visual.

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
