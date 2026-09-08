# DEVICE STRATEGY — DESKTOP-FIRST V1 / MOBILE-READY ARCHITECTURE / MOBILE STUDIO LATER

## Purpose

Este documento fija una decisión de producto para evitar dos errores opuestos:

1. **perder tiempo ahora** intentando convertir Restaurant Studio en un editor móvil profesional antes de que el producto base esté cerrado;
2. **hipotecar el futuro** construyendo un Studio tan dependiente del escritorio que añadir edición móvil después obligue a rehacer Project State, Media, módulos o experiencias.

La estrategia aprobada es:

```text
V1 = DESKTOP / LAPTOP FIRST
+
CROSS-COMPUTER OBLIGATORIO
+
PUBLIC WEBSITE MOBILE-READY / RESPONSIVE
+
ARCHITECTURA DEL STUDIO PREPARADA PARA MÓVIL
+
MOBILE STUDIO COMPLETO = FASE POSTERIOR, NO ABANDONADA
```

---

# 1. QUÉ ES OBLIGATORIO EN V1

## 1.1 Trabajar desde cualquier ordenador

Este es el gate cross-device principal de V1:

```text
ORDENADOR A
→ login
→ abrir Restaurante A
→ editar contenido / media / menú / motion / módulos
→ autosave remoto

ORDENADOR B
→ login
→ abrir Restaurante A
→ ver exactamente el mismo estado y media
→ continuar editando
→ preview
→ publish
```

No debe existir dependencia de:

- un PC concreto;
- un navegador concreto;
- un IndexedDB local concreto;
- rutas de filesystem locales;
- export/import manual como mecanismo normal de cambio de ordenador.

Por tanto:

```text
REMOTE PROJECT STATE = SOURCE OF TRUTH
REMOTE MEDIA LIBRARY = SOURCE OF TRUTH
LOCAL CACHE = RESILIENCIA / OPTIMIZACIÓN
```

## 1.2 Studio excelente en desktop/laptop

V1 debe ofrecer una experiencia de edición profesional en pantallas de escritorio y portátil:

- navegación clara;
- formularios completos;
- drag/reorder cuando corresponda;
- upload de imagen y vídeo;
- preview;
- autosave;
- estado de sincronización;
- creación y gestión de proyectos;
- publicación.

## 1.3 Web pública responsive

La relajación del editor móvil **NO afecta al sitio público**.

Las webs publicadas para restaurantes deben seguir funcionando correctamente en:

- móvil;
- tablet;
- desktop.

Responsive público, accesibilidad, reduced-motion y performance siguen siendo requisitos de V1.

---

# 2. QUÉ NO BLOQUEA V1

No es requisito de cierre V1 que Restaurant Studio permita hacer cómodamente desde un teléfono todas estas tareas:

- construir una web completa;
- reordenar estructuras complejas con touch;
- editar paneles densos a 390 px;
- gestionar todo el catálogo desde teclado móvil;
- utilizar una UX específica de cámara/galería;
- resolver todos los casos de safe-area / teclado virtual / nested scroll;
- ofrecer paridad 1:1 entre Studio desktop y Studio móvil.

Estas capacidades se **difieren**, no se cancelan.

---

# 3. REGLA DE PROTECCIÓN DEL FUTURO MÓVIL

Aunque Mobile Studio completo no sea gate V1, desde hoy ninguna feature puede introducir decisiones que hagan costosa su incorporación posterior.

Reglas baratas que sí son obligatorias ahora:

- usar layout flexible (`grid`, `flex`, containers), evitando widths rígidos innecesarios;
- no depender de hover para acciones críticas;
- preferir Pointer Events / eventos compatibles cuando se añadan nuevas interacciones;
- Project State independiente del dispositivo;
- Media independiente del dispositivo;
- no guardar paths locales como estado canónico;
- no crear stores browser-only por feature;
- no acoplar lógica de negocio al tamaño de viewport;
- componentes con jerarquía semántica y controles accesibles;
- evitar APIs exclusivas de mouse si existe alternativa equivalente;
- preservar posibilidad de reflow del Studio sin reescribir el dominio.

Principio:

```text
MOBILE-READY ARCHITECTURE NOW
≠
MOBILE-FINISHED UX NOW
```

---

# 4. MEMORIES Y BEVERAGES — REGLA ESPECÍFICA

Memories y Beverages se construirán **desktop-first**, pero deben nacer con dominio y media totalmente reutilizables en móvil futuro.

## Memories

Debe permitir desde el mismo Studio:

```text
ON / OFF
preset
+ añadir recuerdo
imagen o vídeo
seleccionar Media Library
texto / historia
metadatos
ordenar
featured / visual weight
preview
persistencia
```

## Beverages

Debe permitir desde el mismo Studio:

```text
ON / OFF
preset
+ añadir bebida
imagen o vídeo
seleccionar Media Library
nombre / categoría / productor / origen / añada
descripción / notas / maridaje
precio copa / botella
disponibilidad
ordenar / destacar
preview
persistencia
```

Regla de media:

```text
MEMORIES ─┐
BEVERAGES ├─→ ONE MEDIA ENGINE / ONE MEDIA LIBRARY
MENU      ┤
BRAND     ┘
```

No crear uploader, librería o store de media independiente para cada sección.

El modelo de datos debe aceptar imagen y vídeo desde el primer día aunque la UX de captura móvil avanzada se implemente después.

---

# 5. FASE MÓVIL POSTERIOR — COMPROMISO EXPLÍCITO

La edición móvil completa forma parte de la visión de producto y debe tener una fase propia posterior al cierre del V1 desktop/cross-computer.

Objetivo futuro:

```text
PHONE
→ login
→ abrir proyecto
→ editar
→ subir foto/vídeo desde cámara o galería
→ reordenar
→ guardar

DESKTOP
→ abrir el mismo proyecto
→ continuar sin diferencias de estado
```

Esa fase incluirá específicamente:

- navegación touch del Studio;
- reflow de paneles;
- inputs y controles táctiles;
- reorder táctil;
- cámara/galería;
- safe areas;
- teclado móvil;
- viewport preview;
- QA real en dispositivos.

No requiere rehacer el backend ni los dominios si las reglas de este documento se respetan.

---

# 6. ACCEPTANCE GATES

## Gate V1 — obligatorio

```text
PC A
→ EDIT / UPLOAD / SAVE

PC B
→ LOGIN / SAME PROJECT / SAME MEDIA / CONTINUE / PREVIEW / PUBLISH
```

## Gate Mobile Studio — posterior

```text
PHONE
→ EDIT / UPLOAD / SAVE

PC
→ SAME PROJECT / CONTINUE
```

El segundo gate se programa después; no desaparece del roadmap.

---

# 7. DECISION RULE

Cuando una implementación ofrezca dos caminos, elegir:

```text
¿Podemos terminar V1 más rápido sin bloquear Mobile Studio futuro?
```

- Si **sí** → elegir el camino desktop-first.
- Si acelera V1 pero crea una dependencia rígida que obligará a reescribir dominio, media o estado → **rechazarlo**.
- Si el coste de dejar compatibilidad futura es pequeño → pagarlo ahora.
- Si el coste es puramente polish móvil → diferirlo.

Esta regla tiene prioridad sobre la búsqueda de paridad móvil prematura.

---

# 8. APLICACIÓN DE LA REGLA — FASES 1A / 1B / 1C

| Fase | Estado | Validación de dispositivo |
|---|---|---|
| FASE 1A — Unified Product Detail + defaults públicos en español | **CLOSED** | desktop prioritario; web pública responsive |
| FASE 1B — In-App Experience Consolidation | **CLOSED** | desktop prioritario; smoke móvil real a 390 px |
| FASE 1C — Product Consolidation Gate | **CLOSED** | desktop prioritario; smoke móvil |
| FASE 2 — Memories (Class 23) | **READY FOR HUMAN VISUAL REVIEW** | Studio desktop-first; web pública responsive con smoke real a 390 px |

Las tres siguieron la DECISION RULE de §7 sin pagar deuda móvil:

- La consolidación de 1C **no** introdujo ninguna dependencia rígida nueva. Movió el
  motor del rotador a la raíz y le dio al producto un entrypoint propio en
  `experiences/`; dominio, media y estado siguen siendo los mismos objetos, así que el
  futuro Mobile Studio no hereda ninguna reescritura.
- La evidencia visual de 1C es **desktop prioritario con smoke móvil**, exactamente lo
  que §2 permite: pulir el Studio en móvil no bloquea V1.
- La web pública sigue siendo responsive (§1.3) y se comprueba en el gate.
- El compromiso de §5 sigue en pie: **Mobile Studio está diferido, no cancelado**, y
  aparece como Fase 9 del roadmap.
- Memories y Beverages mantienen intacta su regla de §4: panel de personalización,
  imagen **y** vídeo, una sola Media Library y el mismo Project State. **Memories la
  cumple ya**: su panel vive en el Studio existente, admite imagen y vídeo, y no creó
  ningún almacén — `RestaurantMedia` y `RestaurantMediaPicker` son compartidos y
  Beverages los reutilizará.
- Memories no gastó la fase en paridad móvil del editor (§2 lo permite) y **no tomó
  ninguna decisión que impida el Mobile Studio futuro**: el reorden tiene vía accesible
  además del arrastre, el dominio no depende del almacén y la media se referencia por una
  clave lógica, no por una ruta de IndexedDB.
