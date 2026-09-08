# FASE 2 — CLASS 23 MEMORIES
## VISUAL + MULTIMEDIA RECOVERY — MISSION CONTRACT

> **Estado:** Fase 2 NO aprobada · NO mergear · recuperación visual obligatoria antes de revisión humana final.
>
> Este documento es el contrato operativo completo para cerrar correctamente Fase 2. No es Fase 2B, no es polish y no es una mejora opcional.

---

## 0. CONTEXTO Y ESTADO

Repositorio canónico:

`Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA`

Main aprobado al redactar esta misión:

`477dac235d83d61750f77a77eb6975e5333f1744`

Branch de Fase 2:

`feat/memories-engine-studio`

Último HEAD observado antes de la recuperación:

`5cad03f33331b02ccd510d03d308fa123de0cee0`

Antes de trabajar:

```bash
git fetch origin
```

Confirmar:

- `origin/main`
- HEAD real de `feat/memories-engine-studio`
- ahead / behind
- `git status`

Si la branch avanzó desde `5cad03f`, NO resetear, NO perder cambios y continuar desde su HEAD real.

No crear otra branch salvo necesidad técnica real. No borrar nada. No force push.

---

# 1. VEREDICTO SOBRE LA ENTREGA ACTUAL

## Arquitectura base aprobada y que debe conservarse

- `modules.memories`
- `RestaurantMemoriesModel`
- `RestaurantMedia`
- `RestaurantMediaPicker`
- mismo `RestaurantStore`
- mismo Restaurant Studio
- Project State
- media refs lógicas
- upload imagen
- upload vídeo
- seleccionar desde Media Library
- CRUD de recuerdos
- reorder
- enabled
- featured
- visualWeight
- Undo / Redo
- import/export
- persistencia local actual
- OFF real
- integración pública
- contrato con Scroll Traveler
- desktop-first / mobile-ready

NO reconstruir estas piezas desde cero.

---

# 2. LO RECHAZADO EN HUMAN VISUAL REVIEW

La entrega anterior fue rechazada por producto/visual, aunque gran parte de la infraestructura es válida.

## A. Multi-media falsa

El modelo admite `media[]`, pero el runtime termina usando únicamente la primera media resoluble mediante lógica equivalente a `firstMedia(item)`.

Resultado actual inaceptable:

```text
media[]
→ FIRST MEDIA ONLY
→ resto invisible
```

Esta limitación debe desaparecer.

## B. Vídeo no usable de forma fiable

Se pueden subir vídeos, pero la experiencia no garantiza que una persona pueda reproducirlos de forma evidente.

Problemas a resolver:

- un vídeo secundario no llega a renderizarse;
- autoplay depende del observer;
- no existe vía clara de Play cuando autoplay no ocurre;
- el vídeo del story overlay puede quedar fuera del ciclo normal de observación;
- los tests anteriores comprobaron presencia de `<video>`, no reproducción real.

## C. Cinematic Memory Wall por debajo del objetivo

No se acepta un resultado equivalente a:

```text
CSS Grid
+ spans
+ imagen
+ texto
+ hover translate
```

Debe existir una verdadera gramática visual/motion premium.

## D. Memory Stack por debajo de referencias

Debe recuperar nivel físico/cinético inspirado en Koi Studies.

## E. Editorial Journal demasiado estático

Debe evolucionar hacia archivo/editorial/storytelling multi-media.

## F. Referencias ThreeUI prácticamente ignoradas

Deben auditarse y utilizarse como referencias obligatorias de gramática visual/motion.

## G. Paper / Certificate / Heritage Cloth no son polish posterior

La decisión anterior queda revocada. Los artefactos materiales básicos forman parte de la identidad de Memories.

---

# 3. NORTH STAR DE MEMORIES

Memories NO es una imagen con un bloque de texto.

Debe sentirse como un **ARCHIVO VIVO DEL RESTAURANTE**:

- fotografías
- vídeos
- tarjetas
- historias
- capas
- profundidad
- tactilidad
- materialidad
- secuencias
- movimiento
- recuerdos físicos
- archivo
- prensa
- celebraciones
- testimonios
- hitos

Arquitectura objetivo:

```text
MEMORIES ENGINE
│
├── CINEMATIC MEMORY WALL
│   ├── mixed media
│   ├── cinematic movement
│   ├── layered composition
│   ├── depth
│   └── storytelling
│
├── MEMORY STACK
│   ├── physical card grammar
│   ├── drag / flick
│   ├── depth
│   ├── focus
│   └── kinetic transitions
│
├── EDITORIAL JOURNAL
│   ├── image
│   ├── video
│   ├── filmstrip / spread
│   ├── editorial rhythm
│   └── paper/archive language
│
└── MATERIAL ARTIFACTS
    ├── Paper Artifact
    └── Heritage Cloth
```

Todo sigue usando:

```text
ONE STUDIO
ONE PROJECT STATE
ONE MEDIA LIBRARY
ONE MEMORIES DOMAIN
```

---

# 4. REFERENCE RESEARCH — OBLIGATORIO

Antes de rediseñar el visual engine, auditar el repo:

`Juanmaes83/threeui`

No investigar internet salvo necesidad real.

## A. KOI STUDIES

Fuente:

`src/shaders/koi-studies/KoiStudies.tsx`

La implementación referencia:

`/synthralos-halftone.html`

Localizar y estudiar:

`public/synthralos-halftone.html`

Extraer gramática de:

- stacked physical studies
- tarjeta principal
- tarjetas laterales
- profundidad
- superposición
- sensación física
- cambio de foco
- ritmo cinético
- gesture
- movimiento e inercia

Destino: **Memory Stack**.

NO introducir Koi Studies como iframe de producción. NO copiar ThreeUI como segundo runtime. Extraer comportamiento y construirlo nativamente en Memories.

## B. KINETIC CERTIFICATE / PAPER

Fuente:

`src/shaders/neuform-isolated/sources/kinetic-lathe-certificate.html`

Estudiar:

- superficie de papel
- profundidad sutil
- canvas
- líneas cinéticas
- rosette
- drift
- tipografía
- material
- sensación de documento físico

Destino:

- Paper Artifact
- Press
- Milestone
- archivo histórico

## C. HERITAGE CLOTH

Fuente:

`src/shaders/neuform-isolated/sources/lumina-weavers-cloth.html`

Estudiar:

- malla
- deformación
- movimiento
- textura
- luz
- tejido
- profundidad
- GSAP
- Three.js
- lifecycle

Destino: **Heritage Cloth**.

No copiar la demo completa. Crear versión propia, más ligera y adaptada a Memories.

## D. SKETCHBOOK

Fuentes:

- `src/shaders/sketchbook/Sketchbook.tsx`
- `src/shaders/sketchbook/sketchbookDocument.js`
- assets relacionados

Estudiar:

- página
- composición editorial
- collage
- ritmo narrativo
- imagen + texto
- materialidad
- viaje entre piezas

Destino: **Editorial Journal**.

## E. GALLERY

Fuente:

`src/shaders/gallery/Gallery.tsx`

Estudiar:

- múltiples imágenes simultáneas
- profundidad
- estructura espacial
- lifecycle
- IntersectionObserver
- rAF
- cleanup

No hay obligación de crear el mismo cilindro. Usarlo como referencia de experiencia multi-media real con movimiento continuo.

## F. CHARACTER CAROUSEL

Fuente:

`src/shaders/character-carousel/CharacterCarousel.tsx`

Y:

- `sources/character-filmstrip.html`
- `sources/character-wave.html`

Estudiar:

- filmstrip
- wave
- secuencia de media
- control temporal
- pause offscreen
- relación entre contenido y movimiento

Puede informar Wall, Journal y multi-media strip.

---

# 5. LICENCIAS / REUTILIZACIÓN

Revisar antes:

- `threeui/LICENSE`
- `threeui/THIRD_PARTY_NOTICES.md`
- `threeui/ASSET-LICENSES.md`
- `threeui/FONT-LICENSES.md`

Si se reutiliza código permitido, preservar notices correspondientes.

Dirección preferida:

```text
THREEUI EXACT SOURCE
→ REFERENCE / RESEARCH
→ EXTRACT VISUAL GRAMMAR
→ RESTAURANT ENGINE PROPIO
```

No queremos:

```text
Restaurant Studio
→ iframe ThreeUI
→ segunda aplicación
```

---

# 6. DOCUMENTO DE REFERENCE AUDIT

Crear:

`docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-AUDIT.md`

Debe ser corto y concreto.

Tabla:

```text
REFERENCE
SOURCE FILE
VISUAL GRAMMAR
MOTION GRAMMAR
INTERACTION
MEDIA BEHAVIOR
LIFECYCLE
WHAT WE REUSE
WHAT WE DO NOT REUSE
DESTINATION IN MEMORIES
```

No procrastinar con la auditoría. Después, implementar.

---

# 7. MULTI-MEDIA ES FIRST CLASS

Un Memory Item tiene `media[]`.

Eso significa realmente:

```text
media[0]
media[1]
media[2]
media[3]
...
```

La limitación `firstMedia()` queda eliminada como contrato de producto.

---

# 8. REGLA DE TODOS LOS MEDIOS

Todas las medias válidas de un recuerdo deben ser:

A. visibles, o

B. navegables/reproducibles mediante una interacción evidente.

Ninguna debe quedar almacenada y ser invisible sin explicación.

Ejemplo:

```text
MEMORY
├── foto 01
├── foto 02
├── vídeo 01
└── foto 03
```

El usuario debe poder llegar a las cuatro en **cada preset**.

No necesariamente todas simultáneamente, pero sí todas accesibles.

---

# 9. MEDIA ORDER

El orden de `item.media[]` también es DATA.

Studio por recuerdo:

```text
MEDIA DEL RECUERDO

01 [thumb] FOTO
02 [thumb] VÍDEO
03 [thumb] FOTO
04 [thumb] FOTO
```

Controles:

- ↑
- ↓
- quitar
- editar alt
- usar como portada

`Usar como portada` puede resolverse moviendo esa media a índice 0.

No crear `primaryMediaId` si no aporta valor real.

Undo / Redo debe cubrir reorder de media.

---

# 10. STUDIO — MEDIA DEBE SER VISIBLE

El editor no puede limitarse a botones de subir sin mostrar lo que contiene el recuerdo.

Cada Memory Item debe mostrar:

- thumbnail de imagen
- preview de vídeo
- badge IMAGEN / VÍDEO
- orden
- eliminar
- reordenar
- alt
- seleccionar desde Media Library
- subir nueva

Vídeo en Studio:

- Play / Pause manual
- no autoplay obligatorio

---

# 11. VIDEO — REPRODUCCIÓN REAL

Cada vídeo público debe tener:

- `playsinline`
- `preload="metadata"`
- `muted` para autoplay
- poster cuando sea posible o fondo elegante
- Play accesible
- Pause accesible

Puede usar native controls o custom premium controls.

No puede existir un vídeo que el usuario no pueda arrancar manualmente.

---

# 12. AUTOPLAY

Autoplay sólo para vídeos hero/ambient.

Condiciones:

- visible
- documento visible
- reduced-motion OFF
- muted
- playsinline

Máximo un autoplay simultáneo.

Si `video.play()` rechaza, NO ignorar silenciosamente. El control Play debe seguir disponible.

---

# 13. STORY OVERLAY — CORREGIR

El story/detail debe tener lifecycle propio de vídeo o registrarse en un controlador común.

Al abrir:

```text
story
→ media gallery completa
```

NO:

```text
story
→ firstMedia()
```

Debe permitir recorrer todas las medias mediante una solución premium adecuada:

- anterior/siguiente
- thumbnails
- dots
- filmstrip

Al llegar a vídeo:

- Play visible
- reproducción posible
- pausa al cambiar de media
- pausa al cerrar story

---

# 14. VIDEO TEST REAL

No aceptar como prueba:

```js
document.querySelector('video') !== null
```

Debe demostrarse:

```text
CLICK PLAY
→ paused === false
→ currentTime avanza

CLICK PAUSE
→ paused === true
```

Probar tanto:

A. vídeo inline

B. vídeo en story overlay

---

# 15. CINEMATIC MEMORY WALL — RECONSTRUIR

El Wall actual NO se aprueba como experiencia principal.

Debe ser un Memory Wall cinematográfico con verdadero motion language.

Requisitos:

- composición asimétrica
- hero claramente dominante
- múltiples medios
- layering
- solapes controlados cuando corresponda
- profundidad
- entrada progresiva
- salida
- parallax controlado
- movimiento asociado al scroll sin scroll hijacking
- micro-tilt/pointer cuando tenga sentido
- transición entre media del mismo recuerdo
- filmstrip o satellite media para secundarios
- vídeo integrado
- featured como apertura editorial
- espacio negativo
- variedad geométrica controlada

---

# 16. WALL — MULTI-MEDIA COMPOSITION

Un recuerdo featured con 4 medias debe demostrar visualmente que:

```text
UN RECUERDO
≠
UNA FOTO
```

Ejemplo conceptual:

```text
          ┌─────────────────────┐
          │      HERO MEDIA     │
          │        VIDEO        │
          └─────────────────────┘
           ┌─────────┐ ┌───────┐
           │ FOTO 02 │ │FOTO 03│
           └─────────┘ └───────┘
               [FOTO 04]
```

Puede ser otro layout, pero debe existir multi-media real.

---

# 17. WALL — MOTION

Movimiento esperado:

```text
ENTER VIEWPORT
→ material reveal
→ media emerge
→ copy reveal
→ satellite media arrive
→ subtle depth settles
```

Durante scroll:

- desplazamiento relativo controlado
- no wobble permanente
- no mareo

Pointer:

- tilt/depth sutil opcional

Reduced motion:

- composición sigue premium
- sin coreografías innecesarias

---

# 18. MEMORY STACK — KOI-LEVEL GRAMMAR

El Stack debe sentirse como una colección física de recuerdos sobre mesa/archivo.

Requisitos:

- mínimo 3 cards perceptibles cuando haya suficientes items
- card foco
- anteriores/siguientes asomando
- perspectiva real
- solape
- rotate
- scale
- depth
- sombras coherentes
- entrada
- salida
- reorganización visual por foco
- drag
- flick
- inertia
- spring/settle
- pointer capture
- threshold
- velocity

No basta:

```text
click
→ index++
→ CSS transition
```

Debe sentirse física.

---

# 19. STACK — NO SCROLL HIJACKING

La rueda del ratón NO se secuestra.

Scroll de página sigue siendo scroll de página.

Interacciones:

- drag horizontal
- flick horizontal
- botones
- keyboard ← →

Preferencia: no usar wheel para cambiar recuerdo.

---

# 20. STACK — MULTI-MEDIA

La card enfocada debe exponer su colección de medios.

Puede usar:

- cover + media strip
- media reel
- dots + cambio

Las cards no enfocadas pueden mostrar sólo cover.

Al cambiar de card, vídeo anterior pausa.

---

# 21. STACK — PHYSICS

Runtime state explícito:

```text
IDLE
DRAGGING
SETTLING
```

No guardar estos estados en Project State.

Usar pointer delta, velocity y threshold para decidir:

- snap back
- next
- previous

Usar rAF / GSAP / CSS según arquitectura existente.

No añadir una librería enorme sólo para springs si no es necesario.

---

# 22. EDITORIAL JOURNAL — RECONSTRUIR

Debe parecer archivo editorial / diario de una casa.

Referencia combinada:

```text
Sketchbook
+
Character Filmstrip
+
paper grammar
```

Requisitos:

- grandes spreads
- date/place como cues editoriales
- fotografía
- vídeo
- secuencias de 2–4 media
- collage controlado
- páginas/paper layers
- filmstrip
- ritmo alternado
- columna de texto
- caption
- material reveal
- entradas animadas
- continuidad narrativa

---

# 23. JOURNAL — MULTIMEDIA

Ejemplo conceptual:

```text
1987
APERTURA

[FOTO HERO]

   [FOTO]
   [VIDEO]
   [FOTO]

texto
historia
autor
```

Si un recuerdo tiene varias medias, Journal debe utilizarlas.

---

# 24. JOURNAL MOTION

Movimiento editorial:

- mask reveal
- page reveal
- clip-path
- translate
- stagger
- parallax suave
- filmstrip travel
- video activation

No convertirlo en feria de efectos.

El movimiento debe reforzar:

```text
MEMORY
TIME
ARCHIVE
STORY
```

---

# 25. MATERIAL ARTIFACTS — YA NO SON POLISH

Implementar dentro del mismo engine:

A. Paper Artifact

B. Heritage Cloth

No son engines separados, no tienen stores ni Studio independiente.

---

# 26. PRESENTATION DATA

Se permite ampliar Memory Item mínimamente con:

```js
artifactStyle: 'none' | 'paper' | 'cloth'
```

Default: `none`.

Studio:

```text
TRATAMIENTO
- Normal
- Papel / Archivo
- Tejido / Heritage
```

Cambiar treatment conserva el mismo item, datos y media.

---

# 27. PAPER ARTIFACT

Inspirado en `kinetic-lathe-certificate.html`.

No copiar texto ni contenido demo.

Debe incluir al menos:

- papel con materialidad
- borde/pliegue/sombra
- microtextura
- profundidad
- elemento gráfico/canvas cinético sutil
- reveal
- fotografía/media incrustada cuando exista

Adecuado para press, milestone o documento histórico, pero NO asignar automáticamente por type.

El usuario elige treatment.

---

# 28. HERITAGE CLOTH

Inspirado en `lumina-weavers-cloth.html`.

Crear versión ligera con:

- superficie tipo tela
- deformación/movimiento
- luz
- profundidad
- sensación física

Puede funcionar como hero artifact, banner memory o backdrop parcial.

Debe aceptar Project State.

Si Three.js existente es apropiado, usarlo correctamente. Si CSS/canvas logra el nivel con menor coste, usar la solución más simple. No sacrificar resultado hasta convertirlo en caja plana.

---

# 29. LIFECYCLE DE ARTEFACTOS

```text
OFFSCREEN
→ pause

document.hidden
→ pause

Memories OFF
→ destroy/remove

preset change
→ teardown anterior

reduced-motion
→ static premium state
```

No dejar:

- rAF vivos
- observers duplicados
- WebGL contexts huérfanos
- listeners globales repetidos

---

# 30. PERFORMANCE

Premium no significa gastar CPU sin control.

Reglas:

- lazy activation
- IntersectionObserver
- no cargar vídeos completos fuera de necesidad
- máximo un autoplay simultáneo
- WebGL sólo visible
- DPR limitado
- dispose geometry/material/texture
- disconnect observers
- remove listeners
- cancel rAF
- pause vídeos

---

# 31. FIX UNDO / REDO REORDER DEL STUDIO

Existe un microbug pendiente.

`restaurant:config-applied` no puede decidir `render()` únicamente por cantidad de items.

Debe comparar:

- rendered item IDs
- order

contra Project State.

Caso obligatorio:

```text
A,B
→ reorder
B,A
→ Undo
A,B
```

Debe quedar:

```text
Project State A,B
+
Studio DOM A,B
```

No DOM B,A con inputs apuntando a otro orden.

También debe cubrir import/reset con mismo número de items.

Añadir test DOM real.

---

# 32. MEDIA REORDER — UNDO / REDO

Caso obligatorio:

```text
media A,B,C
→ move C to cover
C,A,B
→ Undo
A,B,C
→ Redo
C,A,B
```

Studio, public y story gallery deben reflejar el mismo orden.

---

# 33. DATA MODEL — NO OTRA ARQUITECTURA

Seguir usando:

`modules.memories`

Memory Item:

```js
{
  id,
  enabled,
  type,
  title,
  text,
  author,
  date,
  place,
  rating,
  link,
  featured,
  visualWeight,
  artifactStyle,
  media: []
}
```

No crear:

- wallItems
- stackItems
- journalItems
- paperItems

Los presets son presentación.

---

# 34. VISUAL FIXTURES — NO TRAMPA

Crear fixtures explícitos de test con mínimo:

- 5 Memories
- 12 media assets
- 8 imágenes mínimo
- 3 vídeos mínimo
- 1 recuerdo con 4 medias
- 1 recuerdo con imagen + vídeo + imagen
- 1 recuerdo `artifactStyle=paper`
- 1 recuerdo `artifactStyle=cloth`
- 1 featured hero
- hero / medium / small

No son defaults productivos. Son test fixtures.

---

# 35. PROHIBIDO DISEÑAR TESTS PARA ESQUIVAR BUGS

No hacer:

```text
Memory 1 = imagen
Memory 2 = vídeo
```

para demostrar vídeo evitando multi-media.

Debe probarse:

```text
Memory 1
├── image
├── video
├── image
└── video
```

Y acceder a todas.

---

# 36. TESTS — MULTI-MEDIA REAL

Actualizar `tests/class23-memories-e2e.mjs` o dividir sólo si mejora claridad.

Obligatorio:

1. Memory con 4 medias guarda 4 refs.
2. Studio muestra las 4.
3. Wall permite acceder a las 4.
4. Stack focus permite acceder a las 4.
5. Journal permite acceder a las 4.
6. Story permite acceder a las 4.
7. Ninguna media desaparece por preset switch.
8. Reorder media cambia cover.
9. Undo media reorder.
10. Redo media reorder.

---

# 37. VIDEO TESTS — REALES

11. Upload vídeo real.
12. Vídeo aparece sin reload.
13. Play manual funciona.
14. `currentTime` avanza.
15. Pause funciona.
16. Vídeo inline.
17. Vídeo story.
18. Cambiar media pausa vídeo anterior.
19. Cambiar memory pausa vídeo anterior.
20. Cerrar story pausa vídeo.
21. Scroll offscreen pausa vídeo.
22. `document.hidden` pausa.
23. Memories OFF pausa/destroy.
24. reduced-motion no autoplay.
25. Play manual disponible en reduced-motion.

---

# 38. STACK TESTS

26. 3+ cards visibles.
27. Pointer drag mueve físicamente deck/card.
28. Flick cambia focus.
29. Drag insuficiente vuelve a origen.
30. Keyboard ← →.
31. Buttons.
32. Page scroll NO secuestrado.
33. Focus card media reel funciona.
34. Vídeo pausa al perder focus.

---

# 39. WALL TESTS

35. Featured con jerarquía hero.
36. Secondary multi-media visible/navegable.
37. Más de una media visible en recuerdo multi-media.
38. Motion/reveal ocurre.
39. No single-image-only genérico.
40. Scroll Traveler no tapa texto crítico.

---

# 40. JOURNAL TESTS

41. Mixed-media spread.
42. Filmstrip/collage usa secondary media.
43. Video playable.
44. Paper artifact.
45. Cloth artifact.
46. Date/place/story intactos.

---

# 41. PERSISTENCE / DOMAIN TESTS

47. OFF real.
48. Preset switch conserva media/order.
49. Reload conserva.
50. Undo item reorder DOM correcto.
51. Redo item reorder DOM correcto.
52. Import same-count actualiza DOM.
53. No new localStorage.
54. No Memories IndexedDB.
55. No second Media Library.
56. No second Studio.
57. No `/labs/` product dependency.
58. No Blob URL en Project State.
59. `artifactStyle` persiste.
60. `artifactStyle` cambia sólo presentación.

El número final puede superar 60. Importa demostrar comportamiento real, no optimizar para contador verde.

---

# 42. VISUAL QUALITY GATE

Los tests NO cierran Fase 2.

Después del functional pass, hacer visual product review interno.

Crear:

`output/playwright/class23-recovery/`

Con:

- `references/`
- `implementation/`
- `video/`

---

# 43. CAPTURAR REFERENCIAS

Capturar como mínimo:

- Koi Studies
- Kinetic Certificate
- Heritage Cloth
- Sketchbook

No necesitamos pixel matching.

Debemos documentar:

```text
REFERENCE
→ RESTAURANT ADAPTATION
```

---

# 44. CAPTURAS DE IMPLEMENTACIÓN

Desktop obligatorias:

01. Studio Memories con un recuerdo que tenga 4 medias visibles.
02. Media Library Picker con imágenes y vídeos.
03. Cinematic Memory Wall general.
04. Cinematic Memory Wall featured multi-media.
05. Memory Stack con 3+ cards visibles.
06. Memory Stack durante/tras interacción.
07. Memory Stack card foco con media múltiple.
08. Editorial Journal general.
09. Editorial Journal spread multi-media.
10. Paper Artifact.
11. Heritage Cloth.
12. Story Gallery con thumbnails/filmstrip y vídeo.
13. Memories OFF.
14. Reload con misma data.
15. Responsive public smoke a 390 px.

No hacer Studio móvil completo.

---

# 45. VIDEO EVIDENCE — OBLIGATORIO

Vídeo real de producto, aprox. 20–40 segundos.

Debe mostrar en una sola sesión:

```text
Studio
→ Memories
→ recuerdo con varias medias
→ imagen
→ vídeo
→ Play funcionando
→ Wall
→ movimiento
→ Stack
→ drag/flick
→ media de card
→ Journal
→ Paper
→ Cloth
→ Story
→ vídeo reproduciéndose
→ cerrar
→ volver Studio
```

No usar montaje falso de capturas.

---

# 46. HUMAN-LEVEL VISUAL CHECK

Antes de escribir `READY FOR HUMAN VISUAL REVIEW`, mirar realmente el resultado.

Preguntas obligatorias:

A. ¿Parece galería/memoria premium o grid de CMS?

Si parece CMS: NO terminado.

B. ¿Memory Stack recuerda en calidad de interacción a Koi Studies?

Si no: NO terminado.

C. ¿Wall tiene coreografía visible sin convertirse en circo?

Si no: NO terminado.

D. ¿Journal parece editorial/archivo/diario?

Si parece timeline: NO terminado.

E. ¿Se ven y pueden usar varios medios de un mismo recuerdo?

Si no: NO terminado.

F. ¿Los vídeos se pueden reproducir por una persona normal sin conocer IntersectionObserver?

Si no: NO terminado.

G. ¿Paper y Cloth tienen materialidad visible?

Si son simples backgrounds: NO terminado.

---

# 47. NO AUTO-APROBACIÓN

Aunque todo esté verde, NO escribir `VISUAL PASS = APPROVED`.

La aprobación visual final corresponde a Juanma.

Estado máximo:

`READY FOR HUMAN VISUAL REVIEW`

---

# 48. REGRESSION

Después de Class 23 Recovery:

- Class 19
- Class 20
- Class 21
- Class 22
- Phase 1C Gate
- Scroll Traveler
- Project State / Store guards
- contratos directamente afectados

No repetir suites innecesarias cinco veces.

Si aparece flake conocido: A/B contra `origin/main`.

No arreglar flakes ajenos.

---

# 49. NO TOCAR

NO:

- Beverages
- Auth
- Cloud
- backend
- publish
- Mobile Studio completo
- nuevos Motion presets globales
- Product Detail
- Pizza
- Circular
- Scroll Traveler salvo evidencia real de conflicto de layers
- refactor general
- segundo Studio
- segundo store
- segundo Media Engine
- otro repo

---

# 50. PUBLIC WEBSITE RESPONSIVE

La sección pública debe funcionar en desktop, tablet y mobile.

Móvil:

- Wall → reflow premium
- Stack → touch vía Pointer Events
- Journal → reflow editorial
- Paper/Cloth → no overflow ni crash

No se exige paridad completa del Studio móvil.

---

# 51. DOCUMENTACIÓN

Actualizar:

`docs/CLASS-23-MEMORIES.md`

Eliminar como limitaciones aceptadas:

- “una celda compone con la primera media”
- “material artifacts quedan como polish posterior”

Crear:

`docs/CLASS-23-MEMORIES-VISUAL-RECOVERY-AUDIT.md`

Actualizar README, ROADMAP y PLATFORM sólo con estado real.

Mientras no haya aprobación humana:

```text
FASE 2 = READY FOR HUMAN VISUAL REVIEW
```

No marcar CLOSED.

---

# 52. DEFINITION OF DONE — FUNCIONAL

Debe funcionar:

```text
STUDIO
→ Memories ON
→ add memory
→ upload FOTO 1
→ upload FOTO 2
→ upload VIDEO 1
→ upload FOTO 3
→ ver las 4 medias
→ reorder
→ seleccionar portada
→ configurar Paper/Cloth
→ save
```

Public:

```text
Wall
→ usa las 4 medias

Stack
→ usa las 4 medias

Journal
→ usa las 4 medias

Story
→ usa las 4 medias
```

Vídeo:

```text
Play
→ reproducción real
→ Pause
```

---

# 53. DEFINITION OF DONE — VISUAL

## Cinematic Memory Wall

Debe tener:

- composición
- varias medias
- capas
- profundidad
- movimiento
- hero
- narrativa

## Memory Stack

Debe tener:

- física
- profundidad
- cards
- drag
- flick
- focus
- inertia
- media múltiple

## Editorial Journal

Debe tener:

- spreads
- collage
- paper
- filmstrip
- vídeo
- narrativa
- motion editorial

## Material

Paper + Cloth deben sentirse materiales, no clases CSS con nombres bonitos.

---

# 54. REGLA FUNDAMENTAL

NO OPTIMIZAR PARA EL TEST.

OPTIMIZAR PARA EL PRODUCTO.

El error anterior fue:

```text
FUNCTIONAL PASS
sin
VISUAL PRODUCT PASS
```

Orden correcto:

```text
ARCHITECTURE
→ FUNCTION
→ MEDIA
→ MOTION
→ VISUAL
→ EVIDENCE
→ HUMAN REVIEW
```

---

# 55. FORMATO DE ENTREGA FINAL

Usar exactamente:

```text
FASE 2 — CLASS 23 MEMORIES
VISUAL RECOVERY COMPLETE

STATUS:

BASE MAIN:
BRANCH:
HEAD:
AHEAD/BEHIND:
DEPLOYED HEAD:

ARCHITECTURE PRESERVED:

REFERENCE AUDIT:
KOI STUDIES:
KINETIC PAPER:
HERITAGE CLOTH:
SKETCHBOOK:
GALLERY / FILMSTRIP:

MULTI-MEDIA:
MEDIA PER MEMORY:
MEDIA REORDER:
MEDIA COVER:
MEDIA PICKER:

VIDEO INLINE:
VIDEO STORY:
MANUAL PLAY:
AUTOPLAY:
VIDEO LIFECYCLE:

CINEMATIC MEMORY WALL:
MOTION:
MULTI-MEDIA COMPOSITION:

MEMORY STACK:
DRAG:
FLICK:
INERTIA:
DEPTH:
MULTI-MEDIA:

EDITORIAL JOURNAL:
MULTI-MEDIA:
MOTION:

PAPER ARTIFACT:
HERITAGE CLOTH:

UNDO/REDO:
IMPORT/EXPORT:
PERSISTENCE:
RESPONSIVE:

CLASS 23 TESTS:
REGRESSION:

REFERENCE SCREENSHOTS:
IMPLEMENTATION SCREENSHOTS:
VIDEO EVIDENCE:

LIVE URL:

DOCS UPDATED:

KNOWN LIMITATIONS:

MERGED: NO
HUMAN VISUAL REVIEW REQUIRED: YES

READY FOR HUMAN VISUAL REVIEW
```

---

# 56. PROHIBICIÓN FINAL

NO MERGEAR.

NO EMPEZAR BEVERAGES.

NO DECLARAR FASE 2 CERRADA.

No se avanza hasta que Juanma abra el deploy, suba varias imágenes y vídeos personalmente, pruebe los tres presets y apruebe visualmente Memories.
