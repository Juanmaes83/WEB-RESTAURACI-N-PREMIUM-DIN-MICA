# RESTAURANT EXPERIENCE ENGINE + RESTAURANT STUDIO

## North Star

Este repositorio no representa una sola web de restaurante. El producto objetivo es una **plataforma única para crear, personalizar, previsualizar y publicar múltiples webs premium de restauración sin tocar código**.

La regla principal es:

```text
UN PRODUCTO
→ UN REPOSITORIO CANÓNICO
→ UN STUDIO
→ UN PROJECT STATE
→ UNA MEDIA LIBRARY
→ MÚLTIPLES PROYECTOS / RESTAURANTES
→ ACCESO DESDE CUALQUIER ORDENADOR
→ PREVIEW + PUBLICACIÓN DESDE LA MISMA PLATAFORMA
```

LÚMINA y los LABs son superficies de prueba. El activo real es el **Restaurant Experience Engine + Restaurant Studio**.

---

# Estrategia de dispositivos

La estrategia aprobada para acelerar V1 sin hipotecar el futuro es:

```text
V1 = DESKTOP / LAPTOP FIRST
+
CROSS-COMPUTER OBLIGATORIO
+
WEB PÚBLICA RESPONSIVE
+
ARQUITECTURA DEL STUDIO PREPARADA PARA MÓVIL
+
MOBILE STUDIO COMPLETO = FASE POSTERIOR, NO CANCELADA
```

El gate cross-device de V1 es:

```text
ORDENADOR A
→ login
→ editar Restaurante A
→ subir imagen/vídeo
→ autosave remoto

ORDENADOR B
→ login
→ abrir Restaurante A
→ ver exactamente el mismo estado y media
→ continuar
→ preview
→ publish
```

**No es requisito de cierre V1** poder construir cómodamente una web completa desde un teléfono. Sí es obligatorio no tomar decisiones de arquitectura que hagan costosa esa capacidad futura.

La web pública de cada restaurante **sí debe seguir siendo plenamente responsive en móvil/tablet/desktop**.

Documento canónico de esta decisión:
[`docs/DEVICE-STRATEGY-DESKTOP-FIRST-MOBILE-LATER.md`](docs/DEVICE-STRATEGY-DESKTOP-FIRST-MOBILE-LATER.md)

---

# Reglas no negociables

## 1. Todo termina en el mismo producto

Las ramas de feature y los LABs pueden existir durante desarrollo, auditoría y validación, pero **no son dependencias del producto final**.

Una capacidad aprobada debe terminar:

- integrada en `main`;
- accesible desde el mismo Restaurant Studio;
- configurable desde el mismo Project State;
- visible/previsualizable dentro de la misma aplicación;
- sin obligar al usuario a conocer ramas, repositorios o páginas de laboratorio.

Los LABs históricos se conservan como evidencia y referencia, pero no como flujo operativo del cliente.

## 2. Un único repositorio canónico

Este repositorio es el núcleo canónico del producto.

La arquitectura futura debe mantenerse como **monorepo** siempre que sea razonable:

```text
WEB-RESTAURACI-N-PREMIUM-DIN-MICA
├── app / public experience
├── Restaurant Studio
├── engines
├── modules
├── shared schemas
├── server / API / functions
├── persistence adapters
├── media
├── tests
├── labs / research
└── docs
```

Servicios externos de base de datos, almacenamiento, mapas, reservas o mensajería pueden existir como infraestructura/proveedores, pero el usuario **no debe saltar entre aplicaciones para construir su web**.

## 3. Un único Studio

Toda capacidad de producto debe terminar integrada en el Studio actual con la misma jerarquía visual, patrones de campos, toggles, autosave y persistencia.

No crear:

- un segundo panel;
- un configurador separado por módulo;
- un Studio por motor;
- un store independiente por capacidad.

El Studio V1 se optimiza para desktop/laptop. Debe mantener layouts flexibles, controles semánticos y arquitectura compatible con una futura adaptación móvil, pero **el polish móvil avanzado no bloquea V1**.

## 4. Un único Project State

Todo proyecto debe poder serializarse y restaurarse desde un único contrato de estado:

```text
Brand
Content
Media references
Menu / Products
Motion
Product Detail
Modules
Memories
Beverages
Publish settings
```

IndexedDB es actualmente persistencia local de transición, pero **no puede ser la fuente de verdad final** porque no permite abrir el mismo proyecto desde otro ordenador.

Objetivo:

```text
REMOTE PROJECT STATE = SOURCE OF TRUTH
LOCAL CACHE / INDEXEDDB = CACHE + RESILIENCIA
```

## 5. Cross-computer es requisito V1

La personalización nunca debe depender de un navegador o PC concreto.

Import/export seguirá siendo útil para backups/templates/migraciones, pero no será el mecanismo normal para cambiar de ordenador.

## 6. Mobile Studio se difiere, no se abandona

Desde ahora toda feature debe evitar bloqueos futuros:

- no hover obligatorio para acciones críticas;
- evitar layouts rígidos innecesarios;
- Project State y Media independientes del dispositivo;
- no paths locales canónicos;
- nuevas interacciones compatibles con Pointer Events cuando sea razonable;
- no stores browser-only por feature.

Más adelante habrá una fase específica para navegación touch, reorder táctil, cámara/galería, safe areas, teclado móvil y QA en dispositivos.

## 7. Multi-project

La plataforma debe permitir:

```text
PROJECTS
├── Restaurante A
├── Restaurante B
├── Restaurante C
└── + Nuevo proyecto
```

Cada proyecto conserva su propia marca, contenido, carta, media, motion, módulos y publicación sin duplicar el motor.

---

# Estado actual — 8 septiembre 2026

## Motion / Experiences

**11/11 capacidades Motion están construidas y catalogadas en Studio.**

Class 19 — Motion + Module Studio Integration: ✅ aprobada y mergeada.

Catálogo actual:

1. Elegant Orbit
2. Urban Acrobatics
3. Editorial Flow
4. Cinematic Depth Carousel
5. Precomposed Anchor Scenes
6. Orbital Food Slider
7. Circular Dish Rotator
8. Pizza Slice Orbit · Premium
9. Scroll Traveler
10. Dish Stage
11. Cinematic Product Rail

### Product Detail

Class 21 — Unified Product Detail: ✅ aprobada y mergeada.

- seis motores comparten la ficha existente;
- Dish Stage y Cinematic Product Rail usan adapters;
- Pizza conserva su modelo propio;
- configuración ON/OFF y campos desde el Studio existente;
- mismo Project State.

### Product Consolidation

**Fase 1B — CLOSED. Fase 1C — READY FOR HUMAN VISUAL REVIEW.**

Circular Dish Rotator, Dish Stage y Cinematic Product Rail se abren **dentro de la misma aplicación** (1B) y, desde 1C, desde sus propios entrypoints productivos en `experiences/`: el producto ya no carga `/labs/` ni como entrada ni como runtime. Ninguna se convirtió en preset y ningún LAB se borró.

El motor del rotador se promovió a la raíz para conseguirlo sin duplicar nada: **una implementación, dos puertas** — la productiva y la histórica del LAB cargan exactamente los mismos ficheros. Detalle en `docs/PHASE-1C-PRODUCT-CONSOLIDATION-GATE.md`.

---

## Optional Modules

Class 20 — Optional Modules / Studio Integration: ✅ aprobada y mergeada.

Incluye productivamente:

- Location / Google Maps;
- Social / Reputation;
- WhatsApp Contact / Concierge;
- defaults públicos en español;
- mismo Studio y mismo Project State.

---

## Section Experiences pendientes

### Memories

Debe construirse como Section Experience configurable desde el mismo Studio.

Dirección:

```text
MEMORIES ENGINE
├── Cinematic Memory Wall
├── Memory Stack
├── Editorial Journal
└── optional material artifacts
```

**Requisito obligatorio:** panel de personalización con soporte de **imagen y vídeo**, selección desde la Media Library, metadatos, orden/featured, preview y persistencia.

### Beverages

Dirección:

```text
BEVERAGE EXPERIENCE
├── Beverage Cellar
├── Bottle Rail
├── Cocktail Stage
└── Minimal Wine List
```

**Requisito obligatorio:** panel de personalización con soporte de **imagen y vídeo**, datos de bebida, precio, maridaje, disponibilidad, orden/featured, preview y persistencia.

Regla:

```text
MEMORIES ─┐
BEVERAGES ├─→ ONE MEDIA ENGINE / ONE MEDIA LIBRARY
MENU      ┤
BRAND     ┘
```

No crear uploaders, librerías o stores de media paralelos.

---

## Platform Layer pendiente

Antes de considerar V1 comercialmente cerrado faltan:

- autenticación / cuentas;
- lista de proyectos;
- Project State remoto;
- Media Library remota;
- autosave remoto;
- sincronización entre ordenadores;
- duplicar / crear proyecto;
- drafts + published snapshot;
- publicación desde Studio;
- permisos/seguridad.

La edición móvil completa del Studio queda **fuera del gate V1**, pero permanece explícitamente planificada como fase posterior.

---

# Arquitectura objetivo

```text
RESTAURANT EXPERIENCE PLATFORM
│
├── ACCOUNT / AUTH
├── PROJECTS
├── CLOUD PROJECT STATE
├── MEDIA LIBRARY
├── RESTAURANT STUDIO
│   ├── Brand
│   ├── Content
│   ├── Media
│   ├── Menu / Products
│   ├── Motion
│   ├── Product Detail
│   ├── Modules / Integrations
│   ├── Memories
│   ├── Beverages
│   └── Publish
├── EXPERIENCE ENGINE
│   ├── Content Engine
│   ├── Media Engine
│   ├── Menu / Product Engine
│   ├── Motion Engine
│   ├── Section Experiences
│   └── Optional Modules
└── PREVIEW / PUBLISH
```

---

# Fuente de verdad y media

```text
Cloud DB
   ↓
projectId + version
   ↓
Restaurant Studio
   ↕
local cache
   ↓
Preview
   ↓
Published snapshot
```

```text
REMOTE MEDIA LIBRARY = SOURCE OF TRUTH
LOCAL BLOB CACHE = OPTIMIZATION
```

Los dominios Memories y Beverages deben referenciar media estable del proyecto; nunca deben construir una segunda biblioteca.

---

# Qué NO queremos

```text
NO proyecto repartido entre varios repos
NO funciones aprobadas que sólo vivan en ramas
NO cliente obligado a abrir LABs
NO configuradores separados por feature
NO estado crítico sólo en localStorage / IndexedDB
NO copiar la aplicación para cada restaurante
NO tocar código para crear un nuevo restaurante
NO abrir otra web para editar una capacidad del mismo proyecto
NO sacrificar arquitectura futura móvil por un atajo desktop
NO retrasar V1 por polish móvil avanzado que no aporta al gate principal
```

---

# Roadmap actual

1. **Fase 0 — CLOSED:** Class 20 + Optional Modules + Spanish Defaults.
2. **Fase 1A — CLOSED:** Unified Product Detail.
3. **Fase 1B — CLOSED:** experiencias autónomas dentro del mismo app shell. La In-App
   Experience Shell (`class22-experience-shell.js`) abre Circular Dish Rotator, Dish
   Stage y Cinematic Product Rail **dentro de la misma aplicación**, sobre el mismo
   Project State; ninguna abre ya otra pestaña. Los LABs se conservan como evidencia y
   regresión, no como punto de entrada del producto.
4. **Fase 1C — READY FOR HUMAN VISUAL REVIEW:** gate de consolidación. 11 Motion +
   Product Detail + los tres módulos desde una sola app, un solo Project State y un solo
   modelo de media. El producto dejó de depender de `/labs/`: las tres experiencias
   tienen entrypoint productivo en `experiences/`, cargando el **mismo motor canónico**
   que la puerta del LAB. Gate 28/28 con guard de DOM: ninguna acción productiva interna
   apunta a `/labs/` ni abre pestaña nueva. Ver
   `docs/PHASE-1C-PRODUCT-CONSOLIDATION-GATE.md`.
5. **Fase 2 — Memories:** diseño + Studio + imagen/vídeo + Project State + Media Engine.
6. **Fase 3 — Beverages:** diseño + Studio + imagen/vídeo + Project State + Media Engine.
7. **Fase 4 — Project Model final:** congelar contrato de datos antes de cloud.
8. **Fase 5 — Platform Layer:** Auth + Projects + Cloud State + Cloud Media + autosave cross-computer.
9. **Fase 6 — Preview / Publish:** draft → preview → published snapshot.
10. **Fase 7 — Hardening V1:** responsive público, accesibilidad, performance, SEO, seguridad y desktop/browser QA.
11. **Fase 8 — Product Proof V1:** segundo restaurante + continuidad PC A → PC B sin código.
12. **Fase 9 — Mobile Studio Completion:** edición touch completa, cámara/galería, reorder, safe areas y QA móvil.

---

# Gates

## Gate V1 principal

```text
PC A
→ LOGIN / EDIT / UPLOAD / SAVE

PC B
→ LOGIN / SAME PROJECT / SAME MEDIA / CONTINUE / PREVIEW / PUBLISH
```

## Gate móvil posterior

```text
PHONE
→ EDIT / UPLOAD / SAVE

PC
→ SAME PROJECT / CONTINUE
```

El segundo gate está diferido; no eliminado.

---

# Documentación canónica

- **Roadmap:** [`docs/ROADMAP-RESTAURANT-EXPERIENCE-ENGINE.md`](docs/ROADMAP-RESTAURANT-EXPERIENCE-ENGINE.md)
- **Arquitectura de plataforma:** [`docs/PLATFORM-ONE-STUDIO-CROSS-DEVICE.md`](docs/PLATFORM-ONE-STUDIO-CROSS-DEVICE.md)
- **Estrategia de dispositivos:** [`docs/DEVICE-STRATEGY-DESKTOP-FIRST-MOBILE-LATER.md`](docs/DEVICE-STRATEGY-DESKTOP-FIRST-MOBILE-LATER.md)
- **Unified Product Detail:** [`docs/CLASS-21-UNIFIED-PRODUCT-DETAIL.md`](docs/CLASS-21-UNIFIED-PRODUCT-DETAIL.md)
- **Class 19 Motion Library:** [`docs/CLASS-19-MOTION-STUDIO-INTEGRATION.md`](docs/CLASS-19-MOTION-STUDIO-INTEGRATION.md)

Estos documentos definen la dirección actual del producto. La documentación histórica de Classes y LABs se conserva como evidencia.