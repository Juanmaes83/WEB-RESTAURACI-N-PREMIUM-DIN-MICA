# PROJECT 03 — ORBITAL FOOD SLIDER

## Misión oficial para Claude Code

Repositorio: `Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA`

Rol: Lead Motion Engineer + Interaction Designer + Director Visual de producto.

No estás creando una demo aislada. Estás desarrollando la tercera capacidad reutilizable del **RESTAURANT MOTION ENGINE**.

Prioridad:

`CALIDAD VISUAL + CONTINUIDAD FÍSICA + REUTILIZACIÓN DEL ORBITAL ENGINE EXISTENTE + NO REGRESIONES + PERSONALIZACIÓN DESDE RESTAURANT STUDIO`

---

## 0. Gate obligatorio — no empezar sobre un baseline viejo

Antes de hacer absolutamente nada:

```bash
git fetch origin --prune
git checkout main
git pull origin main
```

Comprueba el HEAD real de `main`.

PROJECT 03 debe empezar únicamente después de que **PROJECT 02 — Anchor Scenes** haya sido:

`HUMAN APPROVED + MERGED TO MAIN`

No crear Project 03 desde `feat/anchor-swap-scenes-lab`.
No apilar Project 03 encima de una rama no aprobada.
No usar como baseline un `main` que todavía no incluya Project 02.

Si Project 02 todavía NO está merged, detenerse y devolver únicamente:

```text
PROJECT 03 — BLOCKED
Reason: waiting for approved Project 02 to be merged into main.
Current main HEAD: ...
Project 02 branch HEAD: ...
```

No desarrollar todavía.

---

## 1. Documentación obligatoria

Antes de programar leer:

- `README.md`
- `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md`
- `docs/CLASS-03-ORBITAL-PREMIUM.md`
- `docs/CLASS-05-MOTION-DIRECTION-PLAN.md`
- `docs/CLASS-05-COMPLETION-VALIDATION.md`
- `docs/CLASS-06-PRODUCT-FINAL.md`
- `docs/CLASS-07-THIRD-CHOREOGRAPHY-EDITORIAL-FLOW.md`
- `docs/PROJECT-01-DEPTH-CAROUSEL.md`
- `docs/PROJECT-02-ANCHOR-SCENES-PIVOT.md` si ya está en main

También analizar:

- `app-v4.js`
- `class4-config.js`
- `class4-store.js`
- `class4-runtime-guard.js`
- `class6-product.js`
- `class6-detail-bridge.js`
- cualquier runtime Motion existente realmente en main después del merge de Project 02.

No asumir nombres o estados antiguos. Inspeccionar el repo real.

---

## 2. Definición oficial

Según `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md`, el siguiente proyecto es:

# PROJECT 03 — ORBITAL FOOD SLIDER

Principio:

> **LA GEOMETRÍA DEL PRODUCTO DEFINE LA NAVEGACIÓN.**

No queremos un Swiper circular.
No queremos una ruleta.
No queremos copiar el Orbital Menu actual y cambiarle colores.

Queremos convertir el conocimiento del **ORBITAL MENU 2.5D EXISTENTE** en un preset gastronómico más compositivo, cinematográfico, físico y configurable.

---

## 3. Nueva rama

Sólo cuando Project 02 esté merged en main:

```bash
git checkout main
git pull origin main
git checkout -b feat/orbital-food-slider-lab
```

Documentar:

- BASE MAIN HEAD
- PROJECT 01 merged
- PROJECT 02 merged
- PROJECT 03 branch HEAD

No mergear al terminar.

---

## 4. Regla arquitectónica principal

**NO CREAR UN SEGUNDO ORBITAL ENGINE INCOMPATIBLE.**

El repositorio ya tiene un Orbital Engine funcional.

`app-v4.js` ya posee conceptualmente:

- `active`
- `orbitProgress`
- `continuousDistance()`
- `renderOrbit()`
- `nearestIndex()`
- `syncActive()`
- `goToIndex()`
- `animateProgress()`
- `next()`
- `prev()`
- `setupOrbitInteraction()`

Y ya resuelve:

- wheel
- trackpad
- drag
- swipe / pointer
- botones
- teclado
- momentum
- snap
- active dish
- counter
- copy
- ficha real
- GSAP Flip

PROJECT 03 debe reutilizar ese estado y esa interacción.

No crear:

- un segundo `active index`
- un segundo `orbit progress`
- un segundo sistema de snap
- un segundo gesture engine
- un segundo dish model

---

## 5. Propiedad del estado

La fuente de verdad debe continuar siendo el **BASE ORBITAL ENGINE**.

PROJECT 03 posee:

`PRESENTACIÓN + COREOGRAFÍA DERIVADA`

no un segundo estado.

Arquitectura conceptual:

```text
BASE ORBITAL ENGINE
│
├── canonical dishes
├── orbitProgress
├── active index
├── next / prev / goTo
├── drag / swipe
├── wheel
├── keyboard
├── snap
├── detail
│
└── PROJECT 03 RENDERER
     ├── food orbit geometry
     ├── product depth
     ├── ingredient orbit
     ├── typography
     ├── colour world
     └── visual choreography
```

---

## 6. Si el estado interno no es accesible

`app-v4.js` mantiene parte del Orbital Engine dentro de su closure.

No solventarlo reimplementando todo.

Si realmente hace falta acceso, crear la mínima API / adapter backwards-compatible.

Ejemplo conceptual:

```js
window.RestaurantOrbit = {
  getProgress(),
  getActiveIndex(),
  getDishes(),
  next(),
  prev(),
  goToIndex(),
  subscribeProgress(fn),
  subscribeActive(fn)
}
```

O equivalente tras inspeccionar el código.

La API debe **exponer el motor existente, no copiarlo**.

Elegant Orbit debe continuar funcionando igual aunque nadie use esa API.

No hacer refactor masivo de `app-v4.js`.

---

## 7. Baseline que no se puede romper

Conservar:

- Elegant Orbit
- Urban Acrobatics
- Editorial Flow
- Depth Carousel
- Anchor Scenes
- Studio
- persistence
- dish manager
- detail
- reserve
- media
- keyboard
- wheel
- drag/swipe
- responsive
- reduced motion

Regla:

> `CLASE N+1 = CLASE N APROBADA + NUEVA CAPACIDAD`

Project 03 suma. No sustituye.

---

## 8. Assets del primer LAB

No hace falta generar fotografía nueva todavía.

El repo ya contiene seis platos del Orbital original bajo un contrato común:

- canvas 1:1
- producto/plato centrado
- misma perspectiva
- misma altura de cámara
- misma iluminación
- escala consistente

Usarlos para demostrar primero el motor:

1. Wild Red Prawn
2. Bluefin / Blood Orange
3. Charred Artichoke
4. Wild Sea Bass
5. Iberian Presa
6. Burnt Honey Citrus

No bloquear Project 03 esperando pizzas nuevas.

---

## 9. Reutilización de metadata Motion existente

`class4-config.js` ya contiene por plato información útil procedente de Depth Carousel:

- `depthCarousel.asset`
- `depthCarousel.foregroundDecor`
- `depthCarousel.backgroundDecor`
- `depthCarousel.word`
- `depthCarousel.accent`
- `depthCarousel.backgroundColor`

Palabras actuales: `FIRE`, `BLUEFIN`, `EMBER`, `SEA`, `IBERIAN`, `HONEY`.

Reutilizar accents, worlds, decor y giant word como fallback para el LAB.

La arquitectura futura debe admitir `dish.orbitalFood` como override específico.

Ejemplo conceptual:

```js
orbitalFood: {
  word,
  accent,
  backgroundColor,
  foregroundDecor,
  backgroundDecor,
  orbitScale,
  rotationBias
}
```

Prioridad de datos:

`orbitalFood → metadata reutilizable existente → fallback`

No hardcodear los seis platos dentro del motor.

---

## 10. Qué debe ser visualmente Orbital Food Slider

No:

```text
[card] [card] [card]
```

Sí:

```text
              PRODUCT

        ingredient orbit

   dish                        dish


            ACTIVE HERO


       dish               dish
```

La colección debe sentirse como un sistema físico orbital.

El HERO ocupa el frente de la órbita.
Los platos anteriores y siguientes siguen siendo visibles en profundidad.
Los platos posteriores forman contexto espacial.

El usuario debe percibir inmediatamente:

> “PUEDO GIRAR ESTA COLECCIÓN”.

---

## 11. Diferencia respecto al Orbital actual

El Orbital actual ya demuestra productos recorriendo una elipse + profundidad.

Project 03 debe añadir una **NUEVA GRAMÁTICA COMPOSITIVA**:

### A. PRODUCT ORBIT
Los platos recorren una órbita real continua.

### B. HERO FOCUS
El plato delantero domina inequívocamente.

### C. INGREDIENT / DECOR ORBIT
Ingredientes y elementos decorativos del producto forman una segunda coreografía orbital.

### D. TYPOGRAPHY SYSTEM
La palabra asociada al producto forma parte de la composición.

### E. COLOUR WORLD
El universo cromático responde continuamente al progreso.

### F. INTERACTION PHYSICS
El gesto debe sentirse como manipular el sistema completo.

No basta con reestilizar `.orbit-dish`.

---

## 12. Product Orbit

Conservar el principio continuo del Orbital actual.

La posición visual debe derivarse del progreso fraccional real:

`distance → angle → depth → trajectory → scale → z-order`

No usar estados discretos `left / center / right`.

El HERO debe avanzar físicamente desde profundidad hacia el espectador y volver a profundidad al abandonar el foco.

---

## 13. HERO

El activo debe ser:

- el plato más grande
- el más nítido
- el más luminoso
- el mayor z-index
- el único con prioridad de interacción directa
- claramente asociado al copy

Pero no tan enorme que deje de verse la colección.

Queremos:

`HERO + CONTEXTO ORBITAL`

---

## 14. Productos vecinos

Desktop: suficiente colección visible para que la affordance orbital sea inmediata.

Idealmente:

`HERO + 2 vecinos principales + presencia parcial del resto`

Los posteriores pueden reducir escala, contraste y opacidad, usar blur muy ligero y quedar parcialmente ocultos.

No usar blur como sustituto de profundidad.

La profundidad debe venir principalmente de:

- scale
- trajectory
- overlap
- z-order
- vertical position

---

## 15. Segunda órbita — ingredientes / decor

Añadir una órbita secundaria de elementos gastronómicos:

- cítricos
- hojas
- hierbas
- chile
- ingredientes
- partículas
- pequeños recortes de decor existente

No confeti arbitrario.

Cada grupo pertenece al producto activo.

Dirección visual orientativa:

- PRODUCT RATE ≈ 1.00
- DECOR BACK ≈ 0.35–0.55
- DECOR FRONT ≈ 1.15–1.35

No son valores obligatorios.

La órbita secundaria debe reforzar `PARALLAX + DEPTH + IDENTIDAD DEL PRODUCTO`.

---

## 16. Typography Orbital

No dejar simplemente la palabra quieta detrás.

La tipografía debe participar sutilmente en el sistema orbital mediante una o varias de estas ideas:

- arco tipográfico
- palabra gigante detrás
- fragments siguiendo un radio
- pequeño drift angular
- rotación editorial limitada

No convertir el texto en una ruleta.

El copy real —nombre, meta, precio, ingredientes, CTA— debe seguir estable y usable.

---

## 17. World transition

Cada plato ya tiene `accent` y `backgroundColor`.

Project 03 debe interpolar el mundo según **FRACTIONAL ORBIT PROGRESS**.

No esperar únicamente al commit del índice.

Queremos:

`dish A world → interpolación → dish B world`

mientras B avanza hacia el HERO.

No permitir que el fondo cambie de golpe al snap final.

---

## 18. Copy synchronization

No permitir durante un periodo perceptible:

`plato B + nombre del plato A`

Usar el crossover real del Orbital Engine como CUE.

Secuencia ideal:

```text
OUTGOING HERO inicia viaje
↓
decor / word reaccionan
↓
incoming avanza
↓
crossover canónico
↓
copy / price / meta pasan al nuevo producto
↓
incoming HERO termina de asentarse
```

No cambiar toda la escena sólo después del index commit.

---

## 19. Drag

Gate crítico.

El drag debe controlar directamente el progreso orbital.

Mientras el pointer está a mitad, **los platos deben estar a mitad de su órbita**.

No:

`drag detectado → release → animación automática`

Sí:

`GESTURE = PROGRESS`

Al soltar: momentum + snap del motor existente.

---

## 20. Wheel / buttons / keyboard

Todos deben converger en **EL MISMO MOTOR + LA MISMA COREOGRAFÍA**.

No crear animaciones separadas por input.

`next() / prev() / goToIndex()` deben terminar en el mismo estado.

---

## 21. Click en productos

Comportamiento deseado:

- click HERO → abre ficha real
- click producto vecino → navega hasta él

Al llegar al HERO puede abrirse en segundo click o mantener el contrato existente si ya está bien resuelto.

No abrir fichas de productos que todavía están detrás.

---

## 22. Detail Bridge

No construir otra ficha.

Reutilizar la ficha real.

Preservar:

`ORBIT → DETAIL → ORBIT`

mediante Flip o el bridge actual.

Al cerrar, el producto debe volver exactamente a la posición orbital correcta.

---

## 23. Studio

Añadir un nuevo preset:

**Orbital Food Slider**

en `Studio → Motion`.

Usar el contrato real existente del selector tras inspeccionarlo.

Debe coexistir con todos los modos aprobados.
No reemplazar `Elegant Orbit`.

---

## 24. Contrato de configuración

Project 03 debe poder personalizarse sin tocar motor.

Por plato, como mínimo:

- word
- accent
- background
- decor
- opcional orbit presentation overrides

No construir todavía un panel grande.

Primero: `motor + data contract`.

---

## 25. Desktop art direction

Debe sentirse como una composición editorial premium.

Prioridades:

- HERO inequívoco
- órbita visible
- buena separación del copy
- decor no encima del precio/CTA
- no clipping accidental
- no scroll horizontal
- buen uso del espacio

---

## 26. Mobile

No reducir desktop simplemente a 390px.

Mobile necesita:

- órbita más compacta
- HERO suficientemente grande
- al menos parte de previous/next visible
- swipe dominante
- copy legible
- CTA accesible
- decor sin tapar controls
- no overflow
- no productos gigantes saliendo accidentalmente del viewport

Puede variar `rx`, `ry`, scale curve, decor density y word size respecto a desktop.

---

## 27. Reduced motion

Con `prefers-reduced-motion` debe existir toda la funcionalidad:

- next/prev
- producto activo
- copy
- precio
- CTA
- ficha
- Studio

Reducir momentum, parallax, decor travel y long easing.
No eliminar navegación.

---

## 28. Autoplay

No añadir autoplay por defecto.

Si se prueba, debe ser opcional y OFF por defecto salvo regla clara ya existente en main.

Orbital Food Slider es ante todo manipulable.

---

## 29. Qué no quiero

No quiero:

- otro Swiper
- cards circulando
- Pizza Roulette disfrazada
- spinner
- productos pegados a un círculo CSS
- nuevo dish model
- segundo active index
- segundo gesture engine
- segundo detail modal
- 3D / Three.js
- física excesiva
- blur extremo
- demasiadas decoraciones
- refactor global
- romper Project 01
- romper Project 02
- demo sólo para LÚMINA

---

## 30. Orden de implementación

1. AUDIT
2. BRANCH
3. ORBIT ADAPTER / HOOK si hace falta
4. nuevo renderer visual
5. seis platos reales
6. HERO + vecinos
7. progress continuo
8. drag existente
9. background interpolation
10. decor orbit
11. word
12. detail
13. mobile
14. reduced motion
15. Studio
16. tests
17. screenshots
18. vídeo
19. revisión visual propia
20. deploy

No empezar por 100 tests.

Primero demostrar visualmente:

> **ESTO ES UN FOOD ORBIT FÍSICO.**

---

## 31. Primer gate visual

Antes de refinamientos, generar una captura desktop con:

- HERO
- previous
- next
- productos traseros
- decor orbit
- word
- copy

Luego una segunda captura con `progress = 0.50` entre dish 01 y dish 02.

La segunda debe demostrar que **los dos productos están realmente en tránsito por la órbita**.

FAIL si:

- uno desaparece y otro aparece
- parece una fila curva

CONTINÚA si se percibe volumen orbital.

---

## 32. Criterios geométricos

No fijar números arbitrarios antes de mirar.

Validar:

- HERO claramente mayor que vecino
- al menos 3 niveles perceptibles de profundidad
- z-order coherente
- productos se solapan cuando la órbita lo exige
- trayectoria vertical y horizontal
- no rail horizontal
- rear dishes no dominan
- vecino entrante se acerca al HERO de forma continua
- vecino saliente se aleja de forma continua

---

## 33. Continuidad

En navegación `0 → 1`, muestrear:

`0.00, 0.20, 0.40, 0.50, 0.60, 0.80, 1.00`

No debe existir teleport.
Cada plato debe ocupar una posición interpolada coherente.
El z-order también debe cambiar durante el paso, no sólo al final.

---

## 34. Tests Project 03

Crear `tests/class10-orbital-food-slider-e2e.mjs` si `class10` es realmente el siguiente naming libre tras inspeccionar main. Si no, usar el siguiente naming correcto.

Comprobar en desktop:

- Studio expone preset
- 6 productos
- HERO
- multi-depth
- z-order
- continuous orbit
- drag controla fractional progress
- active cambia en crossover
- copy coincide con active
- accent/world interpola
- decor orbit existe
- next
- prev
- keyboard
- wheel
- click neighbour
- click hero
- detail abre
- detail cierra
- no overflow
- no JS errors

Mobile: equivalentes relevantes.

Reduced motion: contenido, navegación, detail y no pérdida funcional.

---

## 35. Regresiones obligatorias

Ejecutar el suite real de main.

Como mínimo:

- Project 01 — Depth Carousel completo
- Project 02 — Anchor Scenes completo
- Class 05 PASS
- Class 06 PASS
- Class 07 PASS
- Elegant Orbit intacto
- Urban intacto
- Editorial Flow intacto

Al abandonar Orbital Food no deben quedar nodes, transforms, decor, handlers, dataset o copy overrides contaminando otro preset.

---

## 36. Test de reutilización del Orbital real

Añadir un contrato que demuestre que Project 03 NO posee un segundo estado.

Debe cumplirse:

`BASE ACTIVE INDEX = ORBITAL FOOD ACTIVE INDEX = DISH COUNTER = DETAIL DISH`

Y:

`BASE ORBIT PROGRESS → gobierna visual Project 03`

Si el renderer posee un progress independiente, revisar la arquitectura.

---

## 37. Persistencia

Si Project 03 añade metadata `orbitalFood`, comprobar que:

- se guarda
- reload la mantiene
- editar otro campo no la destruye
- import/export no la pierde

No reescribir Class 04 persistence.

---

## 38. Evidencia visual obligatoria

Generar:

```text
tests/screenshots/orbital-food-desktop-01-idle.png
tests/screenshots/orbital-food-desktop-02-quarter.png
tests/screenshots/orbital-food-desktop-03-half.png
tests/screenshots/orbital-food-desktop-04-three-quarter.png
tests/screenshots/orbital-food-desktop-05-complete.png
tests/screenshots/orbital-food-desktop-06-detail.png
orbital-food-desktop-depth-proof.png
```

Mobile:

```text
orbital-food-mobile-01-idle.png
orbital-food-mobile-02-half.png
orbital-food-mobile-03-complete.png
orbital-food-mobile-04-detail.png
```

Regresiones:

```text
orbital-food-regression-elegant.png
orbital-food-regression-depth.png
orbital-food-regression-anchor-scenes.png
```

---

## 39. Vídeos

Generar:

```text
tests/video/orbital-food-desktop.webm
tests/video/orbital-food-mobile.webm
```

Desktop:

`idle → slow drag 0→.5 → hold → finish → next → prev → click neighbour → hero → detail → close → change preset → Orbital baseline restored`

Mobile:

`idle → swipe parcial → cancel → swipe complete → next product → detail → close`

El recorder debe FAIL si el preset activo no es Orbital Food Slider.

---

## 40. Documentación del proyecto

Crear:

`docs/PROJECT-03-ORBITAL-FOOD-SLIDER.md`

Debe contener:

1. objetivo
2. referencia del roadmap
3. baseline
4. arquitectura
5. qué reutiliza del Orbital existente
6. qué es nuevo
7. ownership de estado
8. progress
9. product orbit
10. depth
11. decor orbit
12. typography
13. world interpolation
14. Studio
15. data contract
16. detail
17. desktop
18. mobile
19. reduced motion
20. persistence
21. tests
22. evidence
23. regressions
24. known issues
25. human review status

---

## 41. Actualización del roadmap

No declarar Project 03 APPROVED.

Se puede actualizar `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md` a:

`PROJECT 03 — ACTIVE / IN DEVELOPMENT`

cuando arranque.

No marcar `APPROVED / CLOSED` sin aprobación humana.

---

## 42. CI

Integrar Project 03 en el workflow Motion existente de manera aditiva.

No crear CI redundante si no hace falta.

Flujo:

`syntax → Project 03 → regressions → screenshots/video → artifact`

Reutilizar instalación de Playwright existente.

---

## 43. Live preview

Necesitamos URL real.

Usar el mecanismo de branch preview / GitHub Pages existente después del merge de Project 02.

Entregar:

- URL
- ruta exacta `Studio → Motion → Orbital Food Slider`
- confirmación `DEPLOYED SHA = FINAL BRANCH HEAD`

---

## 44. Criterios humanos de aprobación

Project 03 no se aprueba porque todos los tests pasen.

Necesitamos:

`CODE PASS + FUNCTIONAL PASS + VISUAL PASS + PRODUCT PASS`

Juanma evaluará:

1. ¿se siente físicamente orbital?
2. ¿el producto domina?
3. ¿es claramente diferente del Orbital existente?
4. ¿es premium?
5. ¿se entiende el drag sin explicación?
6. ¿los ingredientes/decor añaden valor?
7. ¿la coreografía ayuda a descubrir platos?
8. ¿lo compraría un restaurante?
9. ¿móvil conserva impacto?
10. ¿parece producto real y no experimento?

---

## 45. Criterio de rechazo

REJECT si:

- parece carrusel circular normal
- parece ruleta
- sólo hay `scale()`
- platos saltan de slots
- drag no controla progress
- active y copy se desincronizan
- se pierde momentum
- se pierde snap
- se degrada Orbital original
- mobile es sólo versión encogida
- decor parece sticker
- HERO no domina
- no existe sensación inequívoca de sistema físico

---

## 46. No hacer todavía

No hacer:

- Pizza Roulette
- Pizza Table
- Dish Stage
- Product Rail
- Center Stage
- generador IA
- backend
- nuevo CMS
- WebGL
- Three.js

Son otros módulos/proyectos.

---

## 47. Futura variante pizza

La documentación conecta Project 03 con PIZZERIAS, pero no meter ese repo dentro del LAB ahora.

Primero demostrar el engine usando los seis platos actuales controlados.

Después de aprobar Project 03 se podrá probar una variante específica de pizza con pizzas cenitales e ingredientes orbitales.

---

## 48. Reporte final obligatorio

Entregar exactamente:

```text
PROJECT 03 — ORBITAL FOOD SLIDER

STATUS
Ready for Human Visual Review / Blocked

BRANCH
feat/orbital-food-slider-lab

HEAD
...

BASE MAIN
...

PROJECT 01 BASELINE
PASS / FAIL

PROJECT 02 BASELINE
PASS / FAIL

ORBITAL BASE ENGINE REUSED
YES / NO

SECOND ACTIVE INDEX CREATED
NO

SECOND ORBIT PROGRESS CREATED
NO

ORBIT ADAPTER
...

PRODUCT ORBIT
...

HERO DEPTH
...

NEIGHBOURS
...

DECOR ORBIT
...

TYPOGRAPHY
...

WORLD INTERPOLATION
...

GESTURE / FRACTIONAL PROGRESS
...

MOMENTUM
...

SNAP
...

COPY SYNC
...

DETAIL BRIDGE
...

STUDIO
...

PERSISTENCE
...

DESKTOP
...

MOBILE
...

REDUCED MOTION
...

TESTS
...

REGRESSIONS
...

SCREENSHOTS
...

VIDEOS
...

CI
...

LIVE URL
...

DEPLOYED SHA
...

KNOWN ISSUES
...

MERGED TO MAIN
NO

HUMAN VISUAL VALIDATION REQUIRED
YES
```

---

## 49. Regla final

No quiero que Project 03 demuestre:

> “podemos hacer un círculo con productos”.

Eso ya lo sabemos.

Quiero demostrar:

> **“el producto gastronómico puede convertirse en una interfaz física orbital completa”.**

REUTILIZA EL ORBITAL ENGINE.
AMPLÍA SU LENGUAJE VISUAL.
NO DUPLIQUES SU ESTADO.
NO DEGRADES LO APROBADO.

No hagas merge.

Entrega:

`código + URL + screenshots + vídeo`

para revisión de Juanma + ChatGPT.
