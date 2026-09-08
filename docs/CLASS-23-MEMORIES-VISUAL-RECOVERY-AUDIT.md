# CLASS 23 — MEMORIES · REFERENCE AUDIT (VISUAL RECOVERY)

Auditoría de `Juanmaes83/threeui` (`main`, clon superficial) leída **antes** de rediseñar
el motor visual. Sin buscar en internet: todo sale de esos ficheros.

**Licencia:** `threeui/LICENSE` es **MIT © 2026 Meng To**, así que reutilizar está
permitido conservando el aviso. `THIRD_PARTY_NOTICES.md` sólo cubre React, Vite,
Three.js y las tipografías (OFL) — nada de eso entra aquí. Dirección aplicada, la que
pide la misión: **fuente exacta → referencia → gramática extraída → motor propio de
Restaurant**. Cero iframes de ThreeUI, cero segundo runtime. Donde la mecánica extraída
es reconocible, el fichero de Memories lo cita en su cabecera.

---

## Tabla

### A · KOI STUDIES → **Memory Stack**

| | |
|---|---|
| **SOURCE FILE** | `src/shaders/koi-studies/KoiStudies.tsx` → `public/synthralos-halftone.html` (1624 líneas) |
| **VISUAL GRAMMAR** | `.stack-scene` con `perspective:900px`; tarjetas apiladas en `position:absolute; inset:0` sobre `transform-style:preserve-3d`; cada obra con `--stack-rotation` / `--stack-scale` y `transform-origin:90% 90%` — el mazo gira desde una esquina, no desde el centro; sombra larga (`0 2.6cqw 6.5cqw rgb(0 0 0 /.38)`) + `inset 0 0 0 1px rgb(255 255 255 /.1)` como canto de papel |
| **MOTION GRAMMAR** | tres perfiles de transición conmutados por clase: `is-tracking` (70 ms lineal, sigue al dedo), `is-dragging` (sin transición), `is-releasing` (180 ms `cubic-bezier(.32,0,.2,1)` + `blur 16px` + `opacity 0` para el lanzamiento) |
| **INTERACTION** | `setPointerCapture` sobre la tarjeta superior; `touch-action:none`; el arrastre compone `translate3d(x,y)` + `rotateX(-y/w·6)` + `rotateY(x/w·7)` + `rotateZ(x/w·11)`, todo clampeado; umbral de compromiso `clamp(ancho·0.18, 52, 88)` con test de intención horizontal `|x| ≥ |y|·0.75`; `tapSlop` de 3 px separa tap de arrastre; `suppressClickUntil = now+360` evita el click fantasma tras soltar; reduced-motion ⇒ duración 0 |
| **MEDIA BEHAVIOR** | una obra por tarjeta (no multimedia) |
| **LIFECYCLE** | reordena el array `order`, resetea transiciones a `none` antes de recolocar y las restaura después |
| **WHAT WE REUSE** | la **física**: pointer capture, umbral con intención, tap slop, supresión de click, los tres perfiles de transición, el lanzamiento con desenfoque, el origen de transformación en esquina |
| **WHAT WE DO NOT REUSE** | halftone/shader, el contenido, el DOM, `KoiStudies.tsx`, React, el iframe |
| **DESTINATION** | **Memory Stack** |

### B · KINETIC LATHE CERTIFICATE → **Paper Artifact**

| | |
|---|---|
| **SOURCE FILE** | `src/shaders/neuform-isolated/sources/kinetic-lathe-certificate.html` (576) |
| **VISUAL GRAMMAR** | tres canvas superpuestos (`plate`, `rosette`, `drift`) sobre un papel; grabado a línea fina con tinta translúcida (`ink(alpha)`), `lineJoin:'round'` |
| **MOTION GRAMMAR** | `phase` que deriva con el tiempo: la roseta es una familia de curvas anidadas `x = cx + A(1−shrink·f)·cos t + d·cos(m·t+φ)`, `y = cy + A(1−shrink·f)·sin t − d·sin(m·t+φ)`, con `f = k/n`; las bandas guilloché desplazan un contorno por su normal `off = amp·sin(waves·u·2π + φ)` |
| **INTERACTION** | ninguna: es un documento que respira |
| **MEDIA BEHAVIOR** | ninguno |
| **LIFECYCLE** | `fit(canvas, ctx, w, h)` con DPR y `setTransform(S,0,0,S,0,0)`; redibuja sólo al cambiar tamaño o fase |
| **WHAT WE REUSE** | la **matemática** de roseta y guilloché, el grabado a línea con alfa bajo, el ajuste por DPR |
| **WHAT WE DO NOT REUSE** | el texto y el contenido del certificado, su maquetación, sus tres capas (una basta) |
| **DESTINATION** | **Paper Artifact** (`artifactStyle:'paper'`) |

### C · LUMINA WEAVERS CLOTH → **Heritage Cloth**

| | |
|---|---|
| **SOURCE FILE** | `src/shaders/neuform-isolated/sources/lumina-weavers-cloth.html` (369) |
| **VISUAL GRAMMAR** | `PlaneGeometry(BW,BH,GX,GY)` con `MeshPhongMaterial` y `CanvasTexture`, luz ambiente cálida + direccional + rim rojo |
| **MOTION GRAMMAR** | **Verlet** sobre la rejilla: `v = (cur−prev)·DAMP`, `cur += v + a·dt²` con `GRAV −3.1`, `DAMP .985`, `dt .016`; viento `fz = (sin(travel + cx·3.3) + .5·sin(travel·1.7 + cx·6))·amp·gust` con `travel = t·1.7 − cy·4.2`, amplitud creciente hacia el borde libre; **3 iteraciones** de relajación de distancias (horizontal y vertical) por paso; fila superior fijada |
| **INTERACTION** | ninguna; GSAP + ScrollTrigger sólo revelan el copy |
| **MEDIA BEHAVIOR** | ninguno |
| **LIFECYCLE** | WebGL con `dispose` de geometría/material/textura |
| **WHAT WE REUSE** | el **solver**: Verlet + restricciones + esa función de viento, y el pinado superior |
| **WHAT WE DO NOT REUSE** | **Three.js y WebGL**. El sitio no carga Three y añadirlo por un artefacto significa ~600 KB de CDN nuevo y un contexto WebGL que mantener vivo — justo lo que §29 prohíbe dejar huérfano. La misma tela se resuelve en **canvas 2D** dibujando la urdimbre y la trama con iluminación por normal local: deformación, movimiento, luz y profundidad reales, sin caja plana y sin contexto que se pueda quedar colgado |
| **DESTINATION** | **Heritage Cloth** (`artifactStyle:'cloth'`) |

### D · SKETCHBOOK → **Editorial Journal**

| | |
|---|---|
| **SOURCE FILE** | `src/shaders/sketchbook/Sketchbook.tsx` + `sketchbookDocument.js` |
| **VISUAL GRAMMAR** | el documento canónico viaja **como cadena** (`CANONICAL_SKETCHBOOK_HTML`, con su SHA-256) y se inyecta con un `HOST_STYLE`: no hay componentes que leer, es una página servida entera. Gramática observable: página, collage, ritmo de spread, imagen + texto conviviendo |
| **MOTION GRAMMAR** | del documento; no expuesta como API |
| **INTERACTION** | recorrido entre piezas |
| **MEDIA BEHAVIOR** | varias piezas por página |
| **LIFECYCLE** | documento aislado |
| **WHAT WE REUSE** | la **idea de spread**: página con hueco, collage controlado, capas de papel, caption como voz aparte |
| **WHAT WE DO NOT REUSE** | el documento (es un blob generado), sus assets, su tipografía |
| **DESTINATION** | **Editorial Journal** |

### E · GALLERY → lifecycle de todo el motor

| | |
|---|---|
| **SOURCE FILE** | `src/shaders/gallery/Gallery.tsx` (204) |
| **VISUAL GRAMMAR** | varias imágenes simultáneas en estructura espacial |
| **MOTION GRAMMAR** | movimiento continuo por rAF |
| **INTERACTION** | — |
| **MEDIA BEHAVIOR** | multi-media real y simultánea |
| **LIFECYCLE** | **el patrón que se copia tal cual**: bandera `disposed`, `hostVisible` por `IntersectionObserver` **y** `documentVisible` por `visibilitychange`; el rAF sólo se programa si ambas son ciertas; `cancelAnimationFrame`, `dispose()` de texturas y `removeEventListener` al desmontar |
| **WHAT WE REUSE** | esa disciplina de ciclo de vida, entera |
| **WHAT WE DO NOT REUSE** | el cilindro, Three.js |
| **DESTINATION** | Wall, Stack, Journal y los dos artefactos |

### F · CHARACTER FILMSTRIP / WAVE → **strip multimedia** y **Stack**

| | |
|---|---|
| **SOURCE FILE** | `src/shaders/character-carousel/CharacterCarousel.tsx` + `sources/character-filmstrip.html` (443) |
| **VISUAL GRAMMAR** | `.deck` en `preserve-3d`; cada tarjeta absoluta con `--focus` propio, y la imagen reacciona a él: `scale(1.04 + (1−focus)·0.06)`, `sepia((1−focus)·0.24)`, `saturate(.66 + focus·.34)` — el foco **destiñe** lo que no está elegido |
| **MOTION GRAMMAR** | **estado continuo, no discreto**: de un `activeIndex` flotante sale `distance`, y de ahí `x/y/z`, `rotateX/Y/Z`, `scale`, `zIndex = 1000 − distance·100`, `opacity = max(.13, side·.76 + focus·.24)` y `blur = max(0, distance−1.5)·.38`, recalculado en cada frame |
| **INTERACTION** | puntero alimenta `pointerX/pointerY`, que sólo inclinan la tarjeta en foco |
| **MEDIA BEHAVIOR** | secuencia de medias con control temporal y pausa fuera de pantalla |
| **LIFECYCLE** | rAF permanente mientras es visible |
| **WHAT WE REUSE** | el **estado continuo** (mi versión anterior usaba clases `data-state` discretas, y eso es exactamente lo que hacía que el Stack no se sintiera físico), el desaturado por foco, el `zIndex`/`blur` derivados de la distancia |
| **WHAT WE DO NOT REUSE** | los personajes, el wave shader, React |
| **DESTINATION** | **Memory Stack** (posición continua) y el **media strip** del Wall y del Journal |

---

## Lo que esta auditoría cambia respecto a la entrega rechazada

1. **El Stack pasa de estado discreto a estado continuo con física real** (Koi + Filmstrip). Era la causa de que "no se sintiera como Koi Studies".
2. **`firstMedia()` desaparece como contrato de producto** (Gallery, Filmstrip): un recuerdo es una colección y los tres presets la recorren.
3. **Los artefactos se hacen en canvas 2D, no en WebGL** — con la matemática real de la roseta y del Verlet, pero sin traer Three.js ni un contexto que se quede huérfano.
4. **El ciclo de vida se unifica** con la disciplina de `Gallery.tsx`: visible + documento visible, y nada de rAF, observers o listeners sobrevivientes.
