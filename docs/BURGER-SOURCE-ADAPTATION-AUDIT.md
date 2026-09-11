# BURGER SOURCE — ADAPTATION AUDIT

> Auditoría de la referencia de hamburguesa (`thebuggeddev/burger`) frente a esta plataforma.
> Fecha del análisis: 2026-09-10
>
> **Estado posterior:** las decisiones se tomaron y se ejecutaron.
> · La colisión de Class 25 se resolvió sincronizando `main` dentro de
>   `feat/class25-chromatic-ingredient-wipe`, sin perder Beverage Experience.
> · El candidato P0 —Exploded Food Anatomy— se construyó como **Class 26 · Anatomy
>   Theater**: ver [`CLASS-26-ANATOMY-THEATER.md`](CLASS-26-ANATOMY-THEATER.md).
> · Los assets de la referencia se ingirieron a `assets/anatomy/`.
>
> Donde este informe hable del 26 como "provisional" o de los candidatos como
> "pendientes", léase con esa corrección: el análisis se conserva como evidencia de
> POR QUÉ se eligió lo que se eligió.

---

## REPO STATE

**CURRENT MAIN HEAD:** `865421457c3622f2191b1c7a7c0d1952a095016b` — *"Class 25 — Beverage Experience [APPROVED]"*
`HEAD == origin/main == origin/HEAD`. Verificado con `git fetch origin` contra el remoto real.
El working tree usado para esta auditoría es un clon temporal de sólo lectura fuera del proyecto; el
repositorio del usuario no se ha tocado.

**CURRENT LAST CLASS:** **Class 25** en `main` (Beverage Experience).

⚠️ **Colisión de numeración real y no resuelta.** Tres ramas remotas se disputan los números 24/25:

| Rama remota | Contenido | Estado |
|---|---|---|
| `origin/feat/class25-beverage-half-orbit` | Beverages como Class 25 | **mergeada** en main |
| `origin/feat/class24-beverage-experience` | Beverages como Class **24** | huérfana, anterior |
| `origin/feat/class25-chromatic-ingredient-wipe` | **`class25-chromatic-ingredient-wipe.js`** (554 líneas, motor de producto nuevo) | **NO mergeada**, reclama el 25 y su diff *borra* todo Beverages |

`feat/class25-chromatic-ingredient-wipe` salió de `f1a7341` (antes del merge de Beverages), así que
su diff contra `main` aparece como "borra Class 25 Beverages". No es un conflicto de contenido: es
una rama desactualizada que además reutiliza el número. **No asignar Class 26 a nada nuevo hasta
decidir el destino de esa rama.**

**CURRENT PRODUCT ENGINES** (catálogo canónico = `class19-motion-library.js`, `ENGINES[]`, `kind:'preset'`):

| # | id | Clase/Proyecto | Fichero |
|---|---|---|---|
| 01 | `elegant` | Class 05 | `class5-elegant-orbit.js` |
| 02 | `urban` | Class 05 | `class5-urban-harmony.js` |
| 03 | `editorial-flow` | Class 07 | `class7-editorial-flow.js` |
| 04 | `depth-carousel` | Project 01 | `class8-depth-carousel.js` |
| 05 | `anchor-scenes` | Project 02 | `class9-anchor-scenes.js` |
| 06 | `orbital-food` | Project 03 | `class10-orbital-food.js` |
| 08 | `pizza-slice-orbit` | Project 07 | `class11-pizza-slice-orbit.js` + `class12-pizza-premium.js` |
| 12 | `half-orbit` | Class 24 | `class24-half-orbit-selector.js` |

Transversal (`kind:'page'`): **09 Scroll Traveler** (`class14-scroll-traveler.js`).

**CURRENT EXPERIENCES** (`kind:'experience'`, abiertas por `class22-experience-shell.js`):
07 Circular Dish Rotator · 10 Dish Stage · 11 Cinematic Product Rail
→ entrypoints productivos en `experiences/<id>/index.html`.

**Section Experiences** (no están en el catálogo Motion, viven como secciones del proyecto):
Class 23 **Memories** (3 presets) · Class 25 **Beverages** (5 presets, `enabled:false` por defecto).

**Módulos opcionales:** Location/Maps (16) · Social/Reputation (17) · WhatsApp (18), integrados por Class 20.

**Nota de documentación:** `README.md` (fechado 8 sep 2026) dice "11/11 capacidades Motion". El código en
HEAD tiene **12** entradas en `ENGINES[]` (Half Orbit añadida) más Beverages. El README va por detrás del
código. Prioridad: código > documentación, como pediste.

**Sobre "Transition Director":** no existe ningún fichero con ese nombre. Lo que existe es
(a) `class5-motion-director.js` — *Motion Direction* de texto/media por sección, y
(b) el bloque **ANTICIPATE → TRAVEL → SETTLE** dentro de `class24-half-orbit-selector.js:290-365`,
que la propia cabecera llama "ONE TRANSITION DIRECTOR". Es un patrón, no un módulo compartido.

---

## BURGER SOURCE

**SOURCE IDENTIFIED:** Sí, con alta confianza — pero **por inferencia, no por referencia explícita**.

No hay **ninguna** mención a burger/hamburguesa en el código, los docs, los mensajes de commit, los
remotes ni los submódulos de `WEB-RESTAURACI-N-PREMIUM-DIN-MICA`. Lo único relacionado son assets de
producto (`assets/half-orbit/dishes-transparent/HAMBURGUESA*.png`), que son fotos de plato completo,
no un proyecto fuente.

La identificación viene de la cuenta de GitHub: de 2.114 repositorios, **exactamente uno** es un
proyecto de hamburguesa, y es un fork:

**REPOSITORY:**
- Fork del usuario: `https://github.com/Juanmaes83/burger` (push 2026-07-31)
- Upstream real: **`https://github.com/thebuggeddev/burger`**
- Descripción: *"A cool burger landing page developed using Kimi K3"*
- Un único commit: `0e55115 init`

Si tenías en mente otra referencia, dímelo antes de la segunda misión: no hay nada en el repo destino
que lo ate, y no voy a inventar una URL alternativa.

**STACK:**
React 19 + TypeScript + Vite 7 · Tailwind 3.4 + shadcn/ui (53 componentes Radix, **todos sin usar
salvo el scaffold**) · **GSAP 3.15 + @gsap/react (`useGSAP`) + ScrollTrigger** · **Lenis 1.3** (lerp 0.1,
enganchado al ticker de GSAP) · react-router 7 (una sola ruta).
**No hay Zustand, no hay Three.js, no hay Framer Motion.** El estado total de la app es
`useState<number>` con el índice de la hamburguesa activa.

Superficie real: **1.116 líneas** fuera de `components/ui/`, y **464 de ellas son `src/pages/Home.tsx`**.
Todo el producto es una landing de una página con 4 bloques: Hero · Ribbons · Recipe · Food Rules.

**CORE MECHANICS** (lo que hay de verdad, leído en código):

1. **Selector de héroe (3 miniaturas).** `Home.tsx:87-125`. Click → `gsap.to` de salida
   (`scale .45, y 80, rot 7, opacity 0, .3s, back.in(1.6)`) → `onComplete: setActive(i)` → `useEffect`
   dispara la entrada (`fromTo`, `back.out(1.6)`, .65s). `killTweensOf` antes de cada salida.
2. **Stack exhibido de 8 capas transparentes.** `Home.tsx:39-48`. El estado **de reposo ya es el
   estado explotado**: 8 PNG (bun, bacon, tomate, queso, patty, cebolla, lechuga, base+tabla) flotando
   con huecos ≤30 px. Cada capa lleva metadatos de registro derivados de su caja de contenido alfa:
   `w` (ancho vw), `top` (vw), `cx` (fracción del centro visible dentro del PNG) y `sy` (aplastado
   vertical). Se aplican como `top: calc(...)`, `margin-left: calc(w * -cx)` y `transform: scaleY(sy)`.
3. **Scrub de scroll casi nulo.** `Home.tsx:261-268`. ScrollTrigger `top 70% → bottom 60%, scrub:1`,
   deriva de `-(3.5-i)*0.62vw → 0`. Es decir **±42 px como mucho**: una tendencia suave a ensamblarse,
   no un montaje/desmontaje.
4. **Flotación idle por capa.** `y:8, 2.4s, sine.inOut, yoyo, repeat:-1, delay: i*0.15`.
5. **Parallax de puntero por capa, en X únicamente.** `dx * (5 + i*1.5)` px vía `gsap.quickTo`.
   Sin equivalente táctil, sin Y, sin Z.
6. **Ingredient cards.** 6 tarjetas colocadas en `vw` absolutos con rotación medida. Entrada
   `back.out(1.4)` en `top 80%`; hover → `rotate:0, scale:1.04, .35s, power3.out`; leave → vuelve.
7. **Ribbon band.** Dos cintas cruzadas (+4.5° / −3.5°), marquesina infinita `xPercent 0→−50` sobre
   dos mitades idénticas duplicadas (20 s), más un scrub de parallax de 100 px al entrar.
8. **Food Rules.** 5 líneas tipográficas gigantes con **cápsulas-píldora que contienen mini-productos
   embebidos dentro de la línea de texto**; la imagen desborda la píldora (`height:190%`, `overflow:visible`).
9. **Hero parallax global** (ratón, `quickTo`, ±20/±8/±5 px) + stagger de caracteres del titular +
   pill amarilla continua detrás de hero→ribbons→recipe.
10. **Lenis** sincronizado con `gsap.ticker` + `ScrollTrigger.update`, `lagSmoothing(0)`.

**Layout:** *toda* la composición está en `vw` absolutos calibrados contra una referencia @1920
(los comentarios citan coordenadas de página exactas). Los media queries **sólo ponen suelos de
legibilidad**; nunca reorganizan.

**Reduced motion:** `prefersReducedMotion()` se consulta **una vez, al montar**, y cada bloque hace
`return` temprano. El resultado es correcto (el DOM ya está en su estado final), pero **no es reactivo**:
cambiar la preferencia no hace nada hasta recargar.

**Lo que NO tiene, y que la hipótesis previa daba por hecho:**
- ❌ Las capas **no son seleccionables ni clicables**: `.recipe-stack { pointer-events: none }`.
- ❌ Ninguna capa muestra información propia. No hay vínculo capa ↔ tarjeta.
- ❌ No hay explosión ni ensamblaje real (el reposo ya está explotado; el scrub son 42 px).
- ❌ No hay profundidad: cero `translateZ`, cero `perspective`, cero parallax en Y.
- ❌ No hay drag, ni pointer events, ni teclado, ni táctil.
- ❌ No hay ficha de producto, ni datos, ni precio, ni CTA, ni persistencia, ni configuración.
- ❌ No hay preloading, ni gating por visibilidad, ni cleanup de las tweens infinitas.
- ❌ Los productos son 3 imágenes en un array literal. No hay modelo de datos.

---

## WHAT PREMIUM ALREADY HAS

| Mecánica Burger | Equivalente Premium | Veredicto |
|---|---|---|
| Selector de héroe con swap GSAP | `class24-half-orbit-selector.js` — barrido de 180°, drag con inercia, flechas, teclado, doble buffer de héroe/mundo, mezcla cromática real (`mixColor`), timeline ANTICIPATE→TRAVEL→SETTLE con overshoot | **A** — Premium es muy superior |
| Parallax / capas / profundidad | `class8-depth-carousel.js` V3 — `translateZ` real bajo una `perspective` compartida, `foregroundDecor`/`backgroundDecor` con ritmos de parallax propios, mundos de color puros con borde diagonal móvil | **A** |
| Tipografía de fondo gigante | Depth Carousel (`word`) + `class12-pizza-premium.js` (`bgType`, `elBgWord`, `elBgIndex`) | **A** |
| Registro/normalización de assets recortados | `scripts/ingest-pizza-slices.mjs` → `slices-manifest.json` + `audit/slice-registration.json`: mide límites alfa, ápice, eje, longitud y emite **datos de registro generados**, con tolerancias y veredicto, más hoja de contactos de prueba. `class9-anchor-scenes.js` hace lo propio con `hit`/`registration`/`objectPosition` por escena | **A** — y por un margen grande: Burger usa constantes a mano |
| Ficha de producto | `class21-unified-product-detail.js` + `class6-product.js` — transición GSAP **Flip** desde el plato real, adaptadores por motor, campos ON/OFF desde el Studio | **A** |
| Objeto que viaja por la página | `class14-scroll-traveler.js` — ruta como dato, `journeyProgress` único, rutas desktop y móvil separadas, estados de capa discretos | **A** |
| Baraja física con arrastre e inercia | `class23-memories-engine.js` preset `memory-stack` — posición continua con muelle | **A** |
| Marquesina / cinta | — | **no existe** |
| Producto embebido dentro de la línea tipográfica | — | **no existe** |
| Descomposición de UN producto en sus ingredientes | — | **no existe** |
| Ingredientes como dato estructurado | `dish.ingredients` es **una cadena de texto** (`'Red prawn · smoked almond · citrus · sea fennel'`) | **parcial** |
| Smooth scroll (Lenis) | Deliberadamente ausente. `class14` es explícito: *"Scroll drives the animation; the animation never drives scroll. No wheel capture, no preventDefault, no scroll snapping"* | **decisión de arquitectura, no carencia** |

También ya resuelto y que **no hay que volver a construir**:
`RestaurantStore` (IndexedDB v3 + fallback Cache Storage + fallback localStorage) ·
`RestaurantMedia` (resolución por `ref` lógica, nunca URL en el estado) ·
`RestaurantMediaPicker` · `RestaurantStudioConfig` (`get`/`set` por path, `restaurant:config-applied`) ·
`class19-motion-library` (catálogo como dato, `kind` es todo el contrato) ·
`class24-motion-governance` (1 motor de producto + 0/1 transversal + N experiencias) ·
`class22-experience-shell` (apertura in-app, foco, Escape, botón Atrás) ·
el patrón de capacidad nueva: **model → review → engine → studio** con loader determinista
(`class25-beverage-loader.js`), `enabled:false` por defecto y refs `project/<ns>/<item>/<mediaId>`.

**Y muy importante:** `origin/feat/class25-chromatic-ingredient-wipe` ya construyó un motor donde
**un ingrediente gigante cruza la composición y ocluye el cambio de producto**, con
`transitionMediaRef` resuelto por la Media Library compartida. No está en `main`, pero existe.
Cualquier propuesta de "transición por ingrediente" ya está hecha.

---

## WHAT BURGER DOES BETTER / DIFFERENT

Sólo ventajas reales. La lista es corta a propósito.

1. **Trata al producto como un objeto compuesto, no como una foto.** Premium siempre presenta el plato
   como una silueta única —por muy bien orquestada que esté. Burger es el único sitio donde el producto
   **se abre y enseña de qué está hecho**. Es la única idea genuinamente nueva del proyecto.
2. **El estado explotado es el reposo, no un clímax.** Decisión de dirección excelente y contraintuitiva:
   no hay que hacer scroll para "merecerse" el efecto, y el modo `reduced-motion` sigue siendo bonito
   porque el estado estático ya es la composición. Premium debería copiar **esta política**, no el código.
3. **Densidad de apilado, no separación.** Huecos ≤30 px @1920 y solapes intencionados (el tomate pisa
   el bacon). Un "exploded view" con separación generosa parece un diagrama de despiece industrial;
   con esta densidad parece comida. Es el detalle que separa "bonito" de "apetecible".
4. **Producto embebido dentro de la tipografía.** La cápsula-píldora con mini-producto que desborda
   vertical y horizontalmente la línea de texto es un recurso editorial que Premium no tiene: Premium
   pone la tipografía **detrás** del producto, nunca el producto **dentro** de la frase.
5. **Un único parámetro de profundidad percibida.** `dx * (5 + i*1.5)` — el índice de capa *es* la
   profundidad. Es más barato y más robusto que una escena en perspectiva, y sirve para móvil.
6. **`vw` puro para composiciones fijas.** Es la forma correcta de que una composición calibrada
   sobreviva a cualquier ancho sin recomponer. Premium ya lo hace en Half Orbit y Scroll Traveler;
   Burger lo lleva al extremo. (Con la trampa de móvil que se comenta en RISKS.)

Todo lo demás (React, Radix, Lenis, doodles, EcoBadge, ribbons, el propio selector) o es inferior a
lo que Premium tiene, o es específico de la dirección de arte de esa demo.

---

## TOP ADAPTATION CANDIDATES

Tres. No cinco. Y el tercero es honestamente opcional.

---

### 1 · EXPLODED FOOD ANATOMY  ·  P0

**NAME:** Exploded Food Anatomy (working title: *Anatomy Theater*)

**TIPO:** **Section Experience** con adaptador de entrada desde Product Detail.
**No** un preset de Motion, y esto es deliberado: un preset gobierna la navegación de *la colección*
(regla de Class 24: *un solo motor de producto*), y esto no navega la colección — profundiza en **un**
producto. Meterlo como preset rompería la gobernanza sin ganar nada.

**SOURCE MECHANIC:** `src/pages/Home.tsx:21-48` (`LAYERS[]` + metadatos de registro alfa),
`:257-283` (scrub de deriva + flotación idle escalonada + parallax de puntero por índice de capa),
`:331-354` (render de la pila), `src/index.css:354-441` (`.recipe-stack`, `.recipe-layer`).

**QUÉ HACE:** el plato activo se abre en sus componentes. Las capas quedan flotando en un apilado
denso —el reposo *es* el estado abierto—, cada una respira con su propio desfase, responden al puntero
con profundidad derivada del índice, y **cada capa es seleccionable**: al elegirla, la ficha lateral
cuenta ese ingrediente (nombre, procedencia, técnica, nota). Un control de "montar/desmontar" hace el
recorrido completo desde el producto entero hasta la anatomía y de vuelta.

**POR QUÉ ES PREMIUM:** convierte la carta en argumento. Un restaurante que puede enseñar *de qué está
hecho* su plato está haciendo la promesa de calidad de forma visual en vez de escribirla. Es exactamente
lo que ya intentan los campos `origin`, `technique` y `pairing` de `dishes[]` — pero hoy sólo se leen.

**QUÉ APORTA QUE NO TENEMOS:** la única capacidad de la lista que **no tiene equivalente en Premium**.
Los 12 motores actuales presentan, navegan, transicionan y cuentan el plato. Ninguno lo **abre**.

**QUÉ PARTE DEL CÓDIGO FUENTE REUTILIZARÍAMOS:**
- La **política**: estado explotado como reposo; movimiento como refuerzo, no como requisito.
- La **gramática numérica**, portada como valores de partida a calibrar:
  huecos densos ≤1.5vw con solapes intencionados; deriva de scrub ≤±0.62vw por capa;
  idle `y:8px / 2.4s / sine.inOut / yoyo / delay i*0.15`;
  parallax `dx*(5 + i*1.5)` px con el índice de capa como profundidad.
- El **contrato de campos de registro por capa** como *concepto* (`w`, `top`, `cx`, `sy`).

**QUÉ PARTE REESCRIBIRÍAMOS:** prácticamente todo el código.
React → DOM nativo con el patrón model/engine/studio de Class 23/25.
Constantes calibradas a mano → **`scripts/ingest-anatomy-layers.mjs`**, hermano de
`ingest-pizza-slices.mjs`, que mida los límites alfa y emita el registro por capa.
`pointer-events:none` → capas seleccionables con Pointer Events (requisito móvil del README §6).
`mousemove` de `window` → Pointer Events + gating por visibilidad.
Tweens infinitas sin ciclo de vida → el ciclo disciplinado de `class23-memories-engine.js`
(nada corre si la sección no es visible o el documento está oculto).

**DEPENDENCIAS:** GSAP 3.13 (ya cargado por CDN en `index.html`) + ScrollTrigger (ya cargado).
**Cero dependencias nuevas.** Sin Lenis, sin React, sin Three.

**DATA SOURCE:** `dishes[]` existente. Adición mínima y **sólo** esta:
```js
dish.anatomy = {
  enabled: true,
  layers: [ { id, label, mediaRef, note, order } ]   // order es dato; layers[0] = capa superior
}
```
`origin`, `technique`, `pairing`, `note` y `allergens` **ya existen** en `dishes[]` y se reutilizan sin
tocarlos. No hace falta `story`, ni `texture`, ni `layers[]` en la raíz del plato. Cero mega-schema.

**MEDIA SOURCE:** `RestaurantMedia` + `RestaurantMediaPicker`, refs `project/anatomy/<dishId>/<layerId>`.
- **REQUERIDO:** nada nuevo. Con sólo `dish.image` la experiencia funciona en modo *héroe anotado*.
- **OPCIONAL:** N recortes transparentes por plato (PNG/WebP con alfa real) → activa el modo explotado.
- **FALLBACK:** sin `anatomy.layers`, o con menos de 3 capas con media resuelta, la sección **no explota**:
  pinta el héroe con llamadas a los ingredientes y las tarjetas de composición. Mejora progresivamente
  según el restaurante suba mejores medios, que es exactamente lo que pide el brief.

**STUDIO INTEGRATION:** un panel más dentro del Studio actual, siguiendo literalmente
`class25-beverages-studio.js:21` (`install()` inyecta el botón en `#studio .studio-nav` antes de
`[data-panel="project"]`, `build()` cuelga la `<section class="studio-panel">` de `#studio-scroll`).
Reordenar capas con ↑/↓ como las bebidas. Subir imagen **o** elegir de la Media Library.
Ningún segundo panel, ningún configurador paralelo.

**PROJECT STATE:** `RestaurantDefaults.anatomy` (globales: `enabled:false`, preset, copy) +
`dish.anatomy` por plato. Escrituras sólo por `RestaurantStudioConfig.set`. Persistencia: la de siempre.

**MOTION LIBRARY:** una fila más en `ENGINES[]` de `class19-motion-library.js` con `kind:'experience'`.
`class24-motion-governance.js` la agrupa sola bajo *"Experiencias completas"* sin tocar la regla de
un único motor de producto.

**PRODUCT DETAIL COMPATIBILITY:** alta, y en los dos sentidos. Un adaptador registrado en
`class21-unified-product-detail.js` añade "Ver anatomía" a la ficha; al cerrar la anatomía se vuelve
a la ficha. No se toca `class6-product.js` ni la transición Flip aprobada.

**MOBILE:** buena, si no se copia el layout de Burger. Composición en `vw`/`vh` sobre el eje vertical
(que es donde el móvil tiene sitio), capas seleccionables por toque con área ≥44px, parallax por
puntero degradado a inclinación o simplemente apagado. Pointer Events desde el día uno.

**REDUCED MOTION:** excelente — es el argumento más fuerte del candidato. Con el estado explotado
como reposo, `prefers-reduced-motion` apaga flotación, parallax y scrub y **la composición sigue
siendo la composición**. Consultar el `matchMedia` de forma reactiva, no una vez al montar como hace
Burger.

**PERFORMANCE RISK:** medio, gestionable. 8 capas × (idle + parallax + scrub) puede convivir con el
motor de órbita y con Scroll Traveler. Mitigación: `IntersectionObserver` + `visibilitychange` (patrón
de Class 23), un solo `quickTo` por capa, `will-change` puesto y **quitado**, y las capas grandes en
WebP con `loading="lazy"`.

**IMPLEMENTATION COMPLEXITY:** **MEDIUM–HIGH**. El motor no es difícil (≈500–700 líneas al nivel de
`class25-beverages-engine.js`). Lo caro es el pipeline de ingesta y la calibración visual.

**VISUAL IMPACT:** **VERY HIGH**.

**RECOMMENDATION:** **BUILD**.

---

### 2 · STRUCTURED INGREDIENT COMPOSITION  ·  P1

**NAME:** Structured Ingredient Composition (+ Composition Cards)

**TIPO:** **Modelo de datos + componente de presentación** dentro de Product Detail. No es un motor.

**SOURCE MECHANIC:** `src/components/IngredientCard.tsx` (completo) + `Home.tsx:52-83` (`CARDS[]`)
+ `Home.tsx:286-321` (entrada `back.out(1.4)` en `top 80%`; hover `rotate→0, scale 1.04, .35s power3.out`)
+ `src/index.css:404-441`.

**QUÉ HACE:** convierte `dish.ingredients` de cadena de texto a colección estructurada, y la presenta
como tarjetas de composición: título que solapa el borde superior, área de imagen con el recorte
transparente sobre color de acento, y su frase. Reposo con rotación propia; hover endereza y acerca.

**POR QUÉ ES PREMIUM:** hoy la ficha de un plato de 34 € resuelve su composición con
`'Sea bass · saffron · leek · fennel'`. Esa cadena es la diferencia entre una carta y un argumento.

**QUÉ APORTA QUE NO TENEMOS:** ingredientes como **entidad** en vez de como texto. Es además el
prerrequisito de datos del candidato 1: sin esto, la anatomía tendría que inventarse su propio
catálogo de ingredientes, que es justo lo que la arquitectura prohíbe.

**QUÉ PARTE DEL CÓDIGO FUENTE REUTILIZARÍAMOS:** la anatomía de la tarjeta y la gramática de
hover/entrada. Literalmente unas 40 líneas de intención.

**QUÉ PARTE REESCRIBIRÍAMOS:** el posicionamiento absoluto en `vw` medido a mano (`left:'7.8vw'`) es
lo peor del fichero fuente: no sobrevive a un número variable de ingredientes. Se reescribe como
grid/rail con rotación derivada del índice.

**DEPENDENCIAS:** ninguna nueva.

**DATA SOURCE:** `dishes[]`. `dish.ingredients` (string) **se conserva** como fallback y para
retrocompatibilidad; se añade `dish.ingredientList[] = [{id, label, note, mediaRef}]`. Si sólo hay la
cadena, se parte por `·` y se pintan tarjetas sin media. Nada se rompe.

**MEDIA SOURCE:** `RestaurantMedia`, refs `project/ingredients/<dishId>/<ingredientId>`.
REQUERIDO: nada. OPCIONAL: recorte por ingrediente. FALLBACK: tarjeta tipográfica sin imagen.

**STUDIO INTEGRATION:** dentro del panel **Platos** existente (`[data-panel="dishes"]`), no un panel
nuevo. Lista con ↑/↓ y picker de media por ingrediente.

**PROJECT STATE:** un campo opcional más en cada plato. Cero estructuras nuevas.

**MOTION LIBRARY:** no aplica — no es un motor y no debe aparecer en el catálogo.

**PRODUCT DETAIL COMPATIBILITY:** total. `productDetail.fields.ingredients` ya existe como toggle;
pasa de renderizar una cadena a renderizar tarjetas cuando hay datos estructurados.

**MOBILE:** buena — rail horizontal con scroll-snap.
**REDUCED MOTION:** trivial (sin entrada, sin hover; las tarjetas ya están en su sitio).
**PERFORMANCE RISK:** bajo.
**IMPLEMENTATION COMPLEXITY:** **LOW–MEDIUM**.
**VISUAL IMPACT:** **MEDIUM** por sí solo; **HIGH** combinado con el candidato 1.
**RECOMMENDATION:** **BUILD** — y antes que el candidato 1, porque es su cimiento de datos.

---

### 3 · EDITORIAL PRODUCT MANIFESTO  ·  P2

**NAME:** Editorial Product Manifesto

**TIPO:** Section Experience ligera (bloque de sección configurable).

**SOURCE MECHANIC:** `src/components/BurgerCapsule.tsx` + `Home.tsx:383-447` (`FR_LINES`) +
`src/index.css:445-478` (`.fr-line`, `.fr-capsule`, `img{height:190%}`, `overflow:visible`).

**QUÉ HACE:** unas pocas líneas de tipografía enorme donde algunas palabras se sustituyen por
cápsulas que contienen un producto real, desbordando la caja de texto por arriba y por abajo.
Revelado línea a línea con ±1.5° de rotación; las cápsulas hacen *pop* con `back.out(2)` 0.15 s
después de su línea.

**POR QUÉ ES PREMIUM:** es la voz de la casa hecha composición. Premium tiene tipografía de fondo,
pero nunca el producto **dentro** de la frase.

**QUÉ APORTA QUE NO TENEMOS:** un bloque narrativo de marca que usa producto real en vez de foto de
stock, alimentado por `dishes[]`.

**QUÉ PARTE DEL CÓDIGO FUENTE REUTILIZARÍAMOS:** la mecánica de la cápsula (píldora + imagen al 190%
de altura sin recorte) y el ritmo del revelado. Unas 30 líneas.

**QUÉ PARTE REESCRIBIRÍAMOS:** las líneas y las anchuras de cápsula están cableadas
(`w: 34.7 / 28.3 / 14.6`) y `white-space:nowrap` a 8vw revienta en cualquier idioma más largo.
Habría que derivar tamaño con `clamp()` y permitir salto de línea.

**DEPENDENCIAS:** ninguna nueva.
**DATA SOURCE:** copy en Project State + `dishRef` por cápsula apuntando a `dishes[].id`. Cero
duplicación de producto.
**MEDIA SOURCE:** `dish.image` existente. REQUERIDO: nada nuevo. FALLBACK: sin plato referenciado,
la cápsula desaparece y la línea queda como tipografía pura.
**STUDIO INTEGRATION:** editor de líneas dentro del panel **Contenido**.
**PROJECT STATE:** `manifesto: {enabled:false, lines:[{words, dishRef}]}`.
**MOTION LIBRARY:** no aplica.
**PRODUCT DETAIL COMPATIBILITY:** opcional — pulsar una cápsula podría abrir la ficha.
**MOBILE:** **riesgo real.** 8vw + `nowrap` es exactamente el fallo del original en pantallas estrechas.
**REDUCED MOTION:** trivial.
**PERFORMANCE RISK:** bajo.
**IMPLEMENTATION COMPLEXITY:** **LOW**.
**VISUAL IMPACT:** **MEDIUM–HIGH**.
**RECOMMENDATION:** **MAYBE** — bonito y barato, pero no mueve el producto hacia el gate V1.
No construir hasta cerrar 1 y 2.

---

### Clasificación completa (A/B/C/D/E) de todo lo encontrado en Burger

| Mecánica | Clase | Motivo |
|---|---|---|
| Selector de héroe con swap GSAP | **A** | Half Orbit lo supera ampliamente |
| Parallax de puntero global del hero | **A** | Depth Carousel y Pizza Premium ya tienen parallax con Z real |
| Tipografía de fondo | **A** | Depth Carousel `word` + Pizza Premium `bgType` |
| Registro alfa de assets recortados | **A** | `ingest-pizza-slices.mjs` es superior: mide y genera, no cablea |
| Ciclo de vida / cleanup | **A** | Class 23 tiene el patrón disciplinado; Burger no limpia sus tweens infinitas |
| Gramática de idle-float y parallax por índice de capa | **B** | Se porta casi tal cual como valores de partida |
| Política "explotado = reposo" | **B** | Se porta como decisión de diseño, no como código |
| Exploded layer stack (la experiencia) | **D** | No existe en Premium. Candidato 1 |
| Ingredientes como entidad + Composition Cards | **D** (datos) / **C** (presentación) | Candidato 2 |
| Producto embebido en la línea tipográfica | **C** | Candidato 3 |
| Densidad de apilado con solapes | **B** | Detalle de dirección que se copia como criterio |
| Ribbon marquee cruzada | **E** | Ruido de marca ajeno a la dirección de LÚMINA; no aporta capacidad |
| Pill/arch amarilla continua | **E** | Dirección de arte específica de la demo |
| Doodles, SmileyDoodle, DoodleArrow | **E** | Idem |
| EcoBadge SVG procedural | **E** | Sello decorativo; no es capacidad |
| Lenis smooth scroll | **E** | Contradice una decisión explícita de arquitectura (Class 14) |
| React / Vite / Radix / shadcn / react-router | **E** | Premium no tiene build step ni `package.json` de app |
| Layout en `vw` absoluto calibrado a 1920 | **E** como método, **B** como técnica puntual | Como sistema global es frágil; como recurso para una composición fija ya se usa en Premium |

---

## BEST OPPORTUNITY

### **Exploded Food Anatomy** (candidato 1).

Es la única cosa del proyecto Burger que Premium **no puede hacer hoy de ninguna manera**.

Los doce motores actuales son variaciones sobre el mismo verbo: *presentar y navegar* la colección.
Elegant Orbit, Urban, Editorial Flow, Depth Carousel, Anchor Scenes, Orbital Food, Pizza Slice Orbit y
Half Orbit resuelven todos la misma pregunta — *"¿cómo paso de un plato al siguiente con belleza?"* —
y la resuelven ya muy bien. Añadir un motor número trece de esa familia sería poner un nombre nuevo a
una función existente, que es exactamente lo que la misión pide evitar.

Exploded Food Anatomy responde a una pregunta que el producto **todavía no ha formulado**:
*"¿qué hay dentro de este plato?"*

Y encaja con lo que ya está construido de tres maneras concretas:

1. **Los datos ya están y están sin usar.** `origin`, `technique`, `pairing`, `note` y `allergens`
   existen en los seis platos de `class4-config.js` desde Class 04. Hoy sólo se leen como texto en la
   ficha. La anatomía es la superficie visual que esos campos llevan un año esperando.
2. **El pipeline duro ya está resuelto.** El problema difícil de un exploded view es el registro de
   assets recortados, y Premium **ya tiene** un ingestor que mide límites alfa, ápice y eje, emite
   datos de registro con tolerancias y produce una hoja de contactos de prueba. Burger resolvió eso a
   mano con ocho constantes; Premium lo tiene automatizado y auditado. La segunda misión hereda esa
   máquina en vez de reinventarla.
3. **La política de reduced-motion sale gratis y sale bien.** Al ser el reposo el estado abierto,
   apagar el movimiento no degrada la experiencia: la deja quieta. Eso es raro y valioso, y es la
   mejor idea de dirección de todo el proyecto Burger.

Y es generalizable de verdad, que era la pregunta del §10:
hamburguesa → capas · plato de autor → composición · postre → texturas · cóctel → ingredientes ·
pizza → toppings. En todos los casos es la misma estructura: *N capas ordenadas, cada una con etiqueta,
media opcional y una nota*. Un solo motor, `dishes[]` como fuente, nada duplicado.

---

## SECOND BEST OPPORTUNITY

### **Structured Ingredient Composition** (candidato 2).

Se elige en segundo lugar por una razón poco glamurosa: **es la fundación del primero**, y tiene valor
por sí mismo aunque el primero nunca se construya.

Hoy la ficha unificada de Class 21 —que es trabajo aprobado y bueno— resuelve la composición de un
plato con una cadena de texto separada por puntos medios. Estructurar ese campo:

- mejora **inmediatamente** los seis motores que ya usan la ficha, sin tocar ninguno;
- da a la anatomía su catálogo de ingredientes sin crear un segundo dominio;
- es de riesgo bajo, complejidad baja y completamente retrocompatible (si sólo hay la cadena, se parte
  y se pinta);
- y no compromete nada: si la anatomía se descarta, las Composition Cards siguen valiendo la pena.

Construirlo antes convierte el candidato 1 de "una experiencia nueva con su propio modelo" en
"una presentación nueva sobre datos que ya existen". Esa es la diferencia entre encajar en la
arquitectura y añadirse a ella.

---

## DO NOT PORT

- **React, Vite, TypeScript, react-router.** Premium no tiene `package.json` de aplicación ni build
  step: es HTML + CSS + JS nativo cargado por `index.html`. Introducir un bundler para una sección
  fragmentaría el producto y rompería la regla "un repositorio canónico, una app".
- **Radix / shadcn/ui (53 componentes).** En el propio Burger están sin usar. Cero valor.
- **Lenis.** No es sólo una dependencia de más: **contradice una decisión explícita** documentada en
  `class14-scroll-traveler.js` (*"Scroll drives the animation; the animation never drives scroll"*).
  Además el smooth scroll a `lerp 0.1` empeora la sensación en móvil y compite con ScrollTrigger.
- **El selector de héroe de Burger.** Half Orbit es estrictamente superior en cada eje.
- **El layout global en `vw` absoluto calibrado contra una captura @1920.** Es la razón por la que la
  demo original es ilegible en un teléfono (8vw de titular, `white-space:nowrap`, media queries que
  sólo ponen suelos de tamaño de fuente sin recomponer nada). Contradice el punto 6 del README.
- **Las constantes de registro escritas a mano** (`w`/`top`/`cx`/`sy` por capa). Sustituirlas por
  registro **generado** con el ingestor, como ya se hace con las porciones de pizza.
- **`pointer-events: none` sobre la pila.** Es precisamente lo que impide que Burger sea interactivo.
- **`prefers-reduced-motion` evaluado una sola vez al montar.** Debe ser reactivo.
- **Las tweens infinitas sin gating por visibilidad ni teardown.** Class 23 ya tiene el patrón correcto.
- **Ribbon marquee, yellow pillar, doodles, SmileyDoodle, EcoBadge.** Dirección de arte de esa demo,
  incompatible con LÚMINA, y ninguna es una capacidad.
- **El `useIsMobile()` basado en `window.innerWidth`** cuando Premium ya usa `matchMedia` y
  `isMobile()` en varios motores.
- **Los assets de Burger** (`public/*.png`). Son de otro proyecto y de otra marca.
- **Cualquier segundo store, segunda Media Library, segundo Studio o segundo Project State.** No
  aplica aquí porque Burger no tiene ninguno, pero conviene dejarlo escrito: la anatomía **no** lleva
  su propio almacén.

---

## ARCHITECTURE FIT

**Studio.** Un panel más en el Studio de siempre, inyectado con el mismo `install()` que Beverages:
botón en `#studio .studio-nav` antes de `[data-panel="project"]`, `<section class="studio-panel">`
colgada de `#studio-scroll`, escritura exclusivamente vía `RestaurantStudioConfig.set`, relectura en
`restaurant:config-applied`. Los ingredientes estructurados van **dentro del panel Platos existente**,
no en uno nuevo. Cero paneles duplicados, cero configuradores paralelos.

**Project State.** `RestaurantDefaults.anatomy` para los globales (`enabled:false` por defecto, preset,
copy) y `dish.anatomy` / `dish.ingredientList` por plato. Se sigue el patrón exacto de
`class25-beverages-model.js`: `DEFAULTS` congelado, `normalize()` defensivo, `item()` factory,
`clone()`. Un solo contrato serializable, sin IndexedDB nueva.

**Media.** Todo por `RestaurantMedia` (refs lógicas `project/anatomy/<dishId>/<layerId>`, nunca un
`blob:` ni una URL en el estado) y `RestaurantMediaPicker` para elegir de la biblioteca. Se respeta la
regla del README: `MEMORIES / BEVERAGES / MENU / BRAND → ONE MEDIA ENGINE / ONE MEDIA LIBRARY`.
`RestaurantMedia.forget()` no se llama nunca de forma implícita.

**Motion.** Una fila más en `ENGINES[]` de `class19-motion-library.js` con `kind:'experience'`.
`class24-motion-governance.js` la agrupa bajo *"Experiencias completas"* automáticamente, sin cambios:
la regla *1 motor de producto + 0/1 transversal + N experiencias* queda intacta. **No se añade ningún
preset**, así que no compite con Half Orbit ni con ningún otro motor de producto.

**Product Detail.** Un adaptador registrado en `class21-unified-product-detail.js` —que ya define los
adaptadores como datos con `match()`— añade la entrada "Ver anatomía". No se toca `class6-product.js`,
ni `#dish-detail`, ni la transición GSAP Flip aprobada.

**dishes[].** Fuente única de producto, sin duplicar. Se leen `name`, `image`, `ingredients`, `origin`,
`technique`, `pairing`, `note`, `allergens`, `enabled` tal cual. Se añaden dos campos opcionales.
Un plato sin `anatomy` simplemente no ofrece anatomía; un campo vacío no se pinta (regla de la casa).

**Convivencia con Scroll Traveler.** La sección debe respetar el contrato de capas de Project 09
(`behind` / `between` / `front`) igual que hizo Class 23 desde `styles-v23.css`. Project 09 no se toca.

**Carga.** Loader determinista propio siguiendo `class25-beverage-loader.js`: espera a
`RestaurantMedia`, `RestaurantMediaPicker` y `RestaurantStudioConfig`, y encadena
`model → review → engine → studio`. Aditivo: si falla, el resto del producto no se entera.

**OFF ES OFF.** `enabled:false` por defecto. Apagado = desmontar el nodo = cero sección, cero espacio,
cero observers, cero rAF. Es el teardown, como en Class 23.

---

## SOURCE FILES WORTH STUDYING

Repositorio: `github.com/thebuggeddev/burger` (fork: `github.com/Juanmaes83/burger`), rama `main`, commit `0e55115`.

| Path | Por qué | Líneas clave |
|---|---|---|
| `src/pages/Home.tsx` | **El fichero que importa.** Todo el producto está aquí | `21-48` metadatos de capa · `52-83` specs de tarjeta · `231-321` `RecipeSection` completo · `257-268` scrub · `270-283` idle + parallax · `286-321` tarjetas · `383-447` Food Rules |
| `src/index.css` | El sistema de layout completo | `354-441` `.recipe-stage/.recipe-layer/.ing-card` · `445-478` `.fr-line/.fr-capsule` · `537-568` la (mala) estrategia responsive |
| `src/components/IngredientCard.tsx` | Anatomía de la tarjeta de ingrediente | fichero completo, 48 líneas |
| `src/components/BurgerCapsule.tsx` | La cápsula tipográfica | fichero completo, 25 líneas |
| `src/lib/gsap.ts` | Registro de plugins y helper de reduced-motion | 11 líneas |
| `src/components/Layout.tsx` | **Estudiar para NO portar**: el enganche Lenis ↔ `gsap.ticker` | `17-32` |
| `src/components/RibbonBand.tsx` | Marquesina seamless por `xPercent` (clasificada E, pero la técnica es correcta) | `27-46` |
| `public/layer-*.png` | Las 8 capas: qué tipo de recorte hace falta de verdad (alfa real, 1536×1024, mismo encuadre) | — |
| `public/card-*.png` | Los 6 recortes de ingrediente para tarjeta | — |
| `package.json` | Inventario de lo que **no** vamos a traer | — |

---

## DESTINATION FILES THAT WOULD BE INVOLVED

Repositorio: `Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA` @ `8654214`. **No se ha modificado ninguno.**

**A leer como plantilla (no se tocarían):**
- `class25-beverages-model.js` — patrón de modelo: `DEFAULTS`, `normalize()`, `item()`, `refFor()`
- `class25-beverages-studio.js` — patrón exacto de inyección de panel (`install()` / `build()` / `render()`)
- `class25-beverages-engine.js` — patrón de motor de sección
- `class25-beverage-loader.js` — loader determinista y espera de plataforma
- `class23-memories-engine.js` — ciclo de vida disciplinado, gating por visibilidad, visor de media compartido
- `class24-half-orbit-selector.js:290-365` — la coreografía ANTICIPATE → TRAVEL → SETTLE
- `class8-depth-carousel.js` — parallax por capa con `translateZ` real
- `scripts/ingest-pizza-slices.mjs` — el ingestor a clonar para las capas de anatomía
- `assets/pizza-motion/slices-manifest.json` / `audit/slice-registration.json` — forma del manifiesto
- `restaurant-media.js` · `restaurant-media-picker.js` — API de media compartida
- `tests/class25-beverage-e2e.mjs` · `tests/class24-half-orbit-selector-e2e.mjs` — forma de los gates

**A extender en una segunda misión (todavía NO tocados):**
- `class4-config.js` — `RestaurantDefaults.anatomy` + `dish.anatomy` / `dish.ingredientList`
- `class19-motion-library.js` — una fila en `ENGINES[]` con `kind:'experience'`
- `class21-unified-product-detail.js` — un adaptador de entrada
- `index.html` — una etiqueta `<script>` más en la cadena (o carga aditiva desde el loader)
- `.github/workflows/` — un workflow de gate nuevo (siguiendo `class25-beverage.yml`)
- `docs/` — el doc de la clase nueva + actualizar el catálogo del README

**A crear (segunda misión):**
`class26-anatomy-model.js` · `class26-anatomy-review.js` · `class26-anatomy-engine.js` ·
`class26-anatomy-studio.js` · `class26-anatomy-loader.js` · `styles-v26.css` ·
`scripts/ingest-anatomy-layers.mjs` · `assets/anatomy/…` · `tests/class26-anatomy-e2e.mjs`

⚠️ **El número 26 es provisional.** No se fija hasta resolver la colisión de `feat/class25-chromatic-ingredient-wipe`.

---

## RISKS

1. **Los medios no existen, y son el 80% del resultado.** Premium tiene recortes de **plato completo**
   (`assets/half-orbit/dishes-transparent/`, ~50 archivos), no recortes **por ingrediente**. Las 8 capas
   de Burger son assets generados a medida para una hamburguesa concreta. Un restaurante real no tiene
   una foto con alfa de su loncha de queso. *Mitigación:* fallback obligatorio a "héroe anotado" y
   mejora progresiva; nunca prometer la anatomía como capacidad universal de `dishes[]`.
2. **Colisión de numeración Class 25.** Real y hoy sin resolver: `feat/class25-chromatic-ingredient-wipe`
   contiene un motor de producto completo (554 líneas) que reclama el 25 y cuyo diff contra `main`
   aparece como borrado de Beverages. *Mitigación:* decidir su destino **antes** de asignar número nuevo.
3. **`feat/class25-chromatic-ingredient-wipe` ya usa `transitionMediaRef`.** Si en la segunda misión se
   diseña un campo de media por ingrediente sin mirar esa rama, se crearán dos contratos distintos para
   la misma idea. *Mitigación:* leer esa rama antes de fijar el modelo de datos.
4. **El README está desactualizado respecto al código** (dice 11 motores; `ENGINES[]` tiene 12, y no
   menciona Class 24 ni Class 25 en el catálogo). Cualquier planificación que arranque del README
   contará mal. *Mitigación:* tratar `class19-motion-library.js` como catálogo canónico.
5. **Presupuesto de movimiento.** La anatomía puede coincidir en pantalla con un motor de producto, con
   Scroll Traveler y con Memories. Sin gating por visibilidad son decenas de tweens infinitas simultáneas
   —fallo que el propio Burger tiene—. *Mitigación:* patrón de ciclo de vida de Class 23, obligatorio.
6. **Móvil.** El vertical es el eje natural de un despiece, y también el eje donde el móvil escasea.
   Ocho capas apiladas en 390 px o quedan minúsculas o exigen scroll largo. *Mitigación:* diseñar la
   variante móvil como composición propia, no como la de escritorio reducida — exactamente la lección
   que ya está escrita en el comentario de `routeMobile` de Scroll Traveler.
7. **Riesgo de rechazo en revisión visual.** Class 23 ya fue rechazada una vez y hubo que reconstruirla.
   Un despiece mal calibrado parece un diagrama de montaje de IKEA, no comida. La densidad y los
   solapes de Burger no son un detalle: son *el* detalle. *Mitigación:* gate visual humano con
   evidencia antes de dar nada por cerrado.
8. **Coste de oportunidad frente al gate V1.** El README es claro: lo que falta para V1 es la
   **Platform Layer** (auth, proyectos, estado remoto, media remota, autosave cross-computer).
   Ninguno de estos tres candidatos acerca ese gate. Son valor de producto, no de plataforma.
   *Mitigación:* decisión consciente y explícita del §12 del ROADMAP.
9. **La identificación de la fuente es inferencial.** Nada en el repositorio destino apunta a
   `thebuggeddev/burger`. La conclusión se sostiene en que es el único repo de hamburguesa de 2.114 y
   en la coincidencia temporal, no en una referencia escrita.

---

## RECOMMENDED NEXT MISSION

**NO construir todavía nada de esto.** Antes hacen falta dos decisiones tuyas y una tarea barata.

### Paso 0 — decisiones que sólo tú puedes tomar (bloqueantes)

- **¿Qué pasa con `feat/class25-chromatic-ingredient-wipe`?** ¿Se mergea como Class 26, se descarta o se
  archiva? Hasta responder esto no se puede numerar nada nuevo sin repetir el caos.
- **¿Producto o plataforma?** Estos candidatos son valor de producto. El gate V1 del README es la
  Platform Layer. Confirma que la siguiente misión es de producto.
- **¿Es `thebuggeddev/burger` la referencia correcta?**

### Misión 2 (recomendada) — *Structured Ingredient Composition*

Alcance cerrado y pequeño, sobre trabajo aprobado:

1. Añadir `dish.ingredientList[] = [{id, label, note, mediaRef}]` como campo **opcional** en
   `class4-config.js`, conservando `dish.ingredients` (string) como fallback con parseo por `·`.
2. Editor dentro del panel **Platos** existente: alta/baja, reordenar con ↑/↓, nota por ingrediente,
   subir imagen **o** elegir de la Media Library con `RestaurantMediaPicker`. Ni un panel nuevo.
3. Renderizar Composition Cards dentro de la ficha unificada cuando el toggle
   `productDetail.fields.ingredients` esté activo y haya datos estructurados. Sin tocar
   `class6-product.js` ni la transición Flip.
4. Gramática de movimiento portada de Burger: entrada `back.out(1.4)` en `top 80%`, hover
   `rotate→0 / scale 1.04 / .35s power3.out`, rotación de reposo **derivada del índice**, no cableada.
5. Gate Playwright siguiendo `tests/class25-beverage-e2e.mjs`: retrocompatibilidad de la cadena,
   campo vacío no pintado, refs de media resueltas, `prefers-reduced-motion` reactivo, sin regresión
   en los seis motores que ya usan la ficha.

**Entregable:** capacidad completa en `main`, configurable desde el Studio de siempre, con gate verde.
**No incluye** la anatomía explotada.

### Misión 3 (después, y sólo si la 2 se aprueba) — *Exploded Food Anatomy*

Fase A · **Pipeline y prueba de assets, antes que nada de motor.**
`scripts/ingest-anatomy-layers.mjs` clonado de `ingest-pizza-slices.mjs`: mide límites alfa por capa,
emite `assets/anatomy/<dishId>/manifest.json` con el registro, y produce una hoja de contactos.
Se prueba con **un** plato real de `assets/half-orbit/dishes-transparent/`. Si no se consigue un juego
de capas convincente para un solo plato, **la misión se detiene aquí** y se ahorra el motor entero.

Fase B · `class2X-anatomy-model.js` + panel de Studio, `enabled:false`, sin motor todavía.

Fase C · El motor: pila densa como reposo, capas seleccionables por Pointer Events, ficha lateral
alimentada por `ingredientList`, control montar/desmontar, idle escalonado, parallax por índice de
capa, ciclo de vida con `IntersectionObserver` + `visibilitychange`.

Fase D · Fila en `class19-motion-library.js` (`kind:'experience'`), adaptador en Class 21, gate
Playwright, doc de clase, actualización del catálogo del README.

**Gate humano obligatorio al final de la Fase A y al final de la Fase C.** Class 23 ya enseñó lo que
cuesta saltárselo.

---

*Fin del informe. No se ha modificado, commiteado ni empujado nada en ningún repositorio.*
