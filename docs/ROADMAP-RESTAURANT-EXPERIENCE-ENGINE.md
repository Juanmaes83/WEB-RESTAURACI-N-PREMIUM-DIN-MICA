# ROADMAP — RESTAURANT EXPERIENCE ENGINE + RESTAURANT STUDIO

## North Star

El producto no es una web concreta de restaurante. El objetivo es una **plataforma única, reusable y cross-device para crear múltiples webs premium de restauración sin tocar código**.

Principio rector:

```text
UN PRODUCTO
→ UN REPOSITORIO CANÓNICO
→ UN STUDIO
→ UN PROJECT STATE
→ UNA MEDIA LIBRARY
→ MÚLTIPLES PROYECTOS
→ ACCESO DESDE CUALQUIER DISPOSITIVO
→ PREVIEW + PUBLICACIÓN DESDE LA MISMA PLATAFORMA
```

Principio evolutivo:

```text
CLASE N+1 = CLASE N APROBADA + NUEVA CAPACIDAD
```

Principio de módulos opcionales:

```text
OFF
→ ACTIVAR
→ DESPLEGAR CAMPOS
→ PERSONALIZAR
→ PREVIEW
→ GUARDAR EN PROJECT STATE
```

Los módulos opcionales están **OFF por defecto**. OFF significa: sin espacio público, sin lógica innecesaria y sin dependencias externas activadas.

---

# 0. REGLAS DE CONSOLIDACIÓN DEL PRODUCTO

## 0.1 Las ramas y LABs no son el producto

Ramas de feature y LABs pueden existir para construir, comparar y validar. Una vez aprobada una capacidad:

- debe mergearse a `main`;
- debe quedar accesible desde el mismo Restaurant Studio;
- debe usar el mismo Project State;
- debe poder previsualizarse desde la misma plataforma;
- no debe obligar al usuario final a conocer una rama, repo o página de laboratorio.

Los LABs se conservan como evidencia histórica y banco de pruebas, no como dependencia operativa.

## 0.2 Un solo repositorio canónico

Este repositorio es el núcleo del producto. La evolución hacia backend, API, funciones y persistencia remota debe priorizar arquitectura **monorepo** para mantener app, Studio, schemas, adapters y tests coordinados.

## 0.3 Un solo Studio

No crear paneles paralelos. Toda nueva capacidad debe integrarse usando las convenciones del Studio actual: mismas cards, toggles, selects, inputs, data-path, preview, autosave y responsive.

## 0.4 Un solo Project State

Todo lo configurable debe pertenecer al mismo contrato de proyecto. No crear stores de feature independientes.

## 0.5 Cross-device es obligatorio

El estado local actual sirve como etapa intermedia. El producto final exige:

```text
REMOTE PROJECT STATE = SOURCE OF TRUTH
INDEXEDDB / LOCAL CACHE = CACHE + RESILIENCIA
```

Lo mismo para media:

```text
REMOTE MEDIA LIBRARY = SOURCE OF TRUTH
LOCAL BLOB CACHE = OPTIMIZACIÓN
```

---

# 1. ARQUITECTURA OBJETIVO

```text
RESTAURANT EXPERIENCE PLATFORM
│
├── ACCOUNT / AUTH
│
├── PROJECTS
│   ├── project A
│   ├── project B
│   └── + new project
│
├── CLOUD PROJECT STATE
├── MEDIA LIBRARY
│
├── RESTAURANT STUDIO
│   ├── Brand
│   ├── Content
│   ├── Media
│   ├── Menu / Products
│   ├── Motion
│   ├── Modules / Integrations
│   ├── Memories
│   ├── Beverages
│   └── Publish
│
├── EXPERIENCE ENGINE
│   ├── Content Engine
│   ├── Media Engine
│   ├── Menu / Product Engine
│   ├── Motion Engine
│   ├── Section Experiences
│   └── Optional Modules
│
└── PREVIEW / PUBLISH
```

Separación obligatoria:

- **Motion Engine** gobierna coreografía de producto y Page Motion.
- **Section Experiences** son experiencias visuales premium activables.
- **Optional Modules** añaden funcionalidad comercial y de contacto.
- **Integrations** conectan proveedores externos mediante adapters.
- **Project State** es la única configuración canónica de cada proyecto.
- **Media Engine** es la única capa de assets del producto.

---

# 2. ESTADO ACTUAL — 8 SEPTIEMBRE 2026

## 2.1 Motion Catalog — 11/11 construidos

| # | Capacidad | Estado | UX actual |
|---|---|---|---|
| 01 | Elegant Orbit | ✅ aprobado | Activar en escenario compartido |
| 02 | Urban Acrobatics | ✅ aprobado | Activar en escenario compartido |
| 03 | Editorial Flow | ✅ aprobado | Activar en escenario compartido |
| 04 | Cinematic Depth Carousel | ✅ aprobado | Activar en escenario compartido |
| 05 | Precomposed Anchor Scenes | ✅ aprobado | Activar en escenario compartido |
| 06 | Orbital Food Slider | ✅ aprobado | Activar en escenario compartido |
| 07 | Circular Dish Rotator | ✅ aprobado | Experiencia autónoma |
| 08 | Pizza Slice Orbit · Premium | ✅ aprobado | Activar en escenario compartido |
| 09 | Scroll Traveler | ✅ aprobado + mergeado | Page Motion ON/OFF |
| 10 | Dish Stage | ✅ aprobado | Experiencia autónoma |
| 11 | Cinematic Product Rail | ✅ aprobado | Experiencia autónoma |

**Class 19 — Motion + Module Studio Integration:** ✅ aprobado y mergeado.

La biblioteca única de Motion ya lista las 11 capacidades dentro de Studio.

### Consolidación pendiente de UX

Circular Dish Rotator, Dish Stage y Cinematic Product Rail siguen teniendo superficie autónoma. Esto es válido como arquitectura técnica actual, pero **no es la experiencia final de producto**.

Objetivo futuro:

```text
EL USUARIO NO SALE DEL PRODUCTO
```

Si una experiencia necesita un canvas/shell propio, debe abrirse dentro del mismo deployment y del mismo flujo de preview del Studio, no como una web externa ni repo diferente.

---

## 2.2 Optional Modules

| Módulo | Runtime | Merge | Studio productivo | Estado |
|---|---|---|---|---|
| Location / Google Maps | Class 16 + Class 20 | ✅ | ✅ | CERRADO: productivo en Studio |
| Social / Reputation | Class 17 + Class 20 | ✅ | ✅ | CERRADO: productivo en Studio |
| WhatsApp Contact | Class 18 + Class 20 | ✅ | ✅ | CERRADO: productivo en Studio |

### Fases cerradas más recientes

**Class 20 — Optional Modules / Studio Integration** → **CERRADA**. Location, Social y
WhatsApp viven dentro del Studio existente, con un único Project State, OFF por defecto
y cero DOM público cuando están apagados.

**Class 21 — Unified Product Detail** → **CERRADA**. La ficha de producto es una
capacidad opcional del Product Engine, con un contrato compartido y adaptadores por
motor; ningún motor aprobado fue reescrito.

### Fase activa

**Fase 1B — Product Consolidation** *(EN CURSO)*

Las tres experiencias autónomas se abren dentro de la misma aplicación mediante la
In-App Experience Shell (`class22-experience-shell.js`), sobre el mismo proyecto:

```text
STUDIO → MOTION LIBRARY → abrir experiencia
       → IN-APP EXPERIENCE VIEWER (misma app, mismo Project State)
       → volver al Studio
```

- experiencias autónomas accesibles en la misma aplicación;
- LABs conservados sólo como evidencia y regresión;
- ninguna dependencia operativa de `/labs/` en el recorrido del usuario.

La capa de plataforma (cuentas, cloud, cross-device) sigue **pendiente**.

Class 20 debía cerrar, y cerró:

```text
LOCATION
SOCIAL / REPUTATION
WHATSAPP
```

con:

- configuración dentro del Studio actual;
- Project State único;
- persistencia;
- public runtime real;
- OFF/ON real;
- responsive;
- reduced motion;
- sin stores paralelos;
- sin borrar LABs históricos.

---

# 3. OPTIONAL MODULES — CONTRATO DE PRODUCTO

## 3.1 Location / Google Maps

**Tipo:** Optional Module + Integration.

Estado productivo objetivo:

```text
OFF
→ no section
→ no iframe
→ no Google Maps request

ON
→ preset
→ address / hours / phone / CTA
→ map mode
→ privacy mode
```

Presets:

- Split Editorial
- Full Width Map
- Minimal Location

Privacy default: **click-to-load**.

---

## 3.2 Social / Reputation

**Tipo:** Optional Module.

Presets:

- Editorial Footer
- Reputation Strip
- Social Minimal

Plataformas:

- Instagram
- Facebook
- Tripadvisor
- Google Business Profile
- TheFork
- MICHELIN Guide
- TikTok
- YouTube

Debe extender el footer actual, no reemplazarlo.

---

## 3.3 WhatsApp Contact / Concierge

**Tipo:** Integration.

Modes:

- Floating Launcher
- Inline Concierge
- Direct CTA

Debe heredar la identidad premium del restaurante. No usar como default un gran botón verde genérico.

---

# 4. SECTION EXPERIENCES PENDIENTES

## 4.1 Memories / Guest Stories

**Estado:** diseño de producto pendiente.

Objetivo: convertir historia, clientes, recuerdos, prensa, eventos y testimonios en una experiencia visual memorable, no en un grid de cards.

Dirección actual:

```text
MEMORIES ENGINE
├── Cinematic Memory Wall
├── Memory Stack
├── Editorial Journal
└── optional material artifacts
```

### Flagship recomendado

**Cinematic Memory Wall**

- composición asimétrica;
- imágenes y vídeo;
- citas;
- layering;
- profundidad;
- scroll editorial;
- ritmo cinematográfico.

### Memory Stack

Inspiración de interacción física:

- stack de recuerdos;
- tilt;
- drag;
- depth;
- mask reveal;
- tactilidad.

### Items

```text
type
media
title
text
author
date
place
rating
link
visualWeight
```

---

## 4.2 Beverage Experience

**Estado:** diseño de producto pendiente.

Objetivo: experiencia independiente para vinos, espumosos, cervezas, cócteles, destilados, copas, sin alcohol, café y té.

Presets objetivo:

```text
BEVERAGE EXPERIENCE
├── Beverage Cellar      ← flagship nuevo
├── Bottle Rail          ← reutiliza gramática Product Rail
├── Cocktail Stage       ← reutiliza gramática Dish Stage
└── Minimal Wine List    ← editorial / performance-first
```

### Modelo beverage

```text
name
category
producer
origin
vintage
description
notes
pairing
priceGlass
priceBottle
image
availability
tags
accentColor
world
```

### Principio

Los datos son del Beverage/Product Domain. El preset gobierna presentación, no duplica producto.

---

# 5. PROJECT STATE — CONTRATO OBJETIVO

```js
project: {
  id,
  ownerId,
  name,
  version,
  brand: {},
  content: {},
  media: {},
  menu: {},
  motion: {},
  modules: {
    location: { enabled: false },
    social: { enabled: false },
    whatsapp: { enabled: false },
    memories: {
      enabled: false,
      preset: 'cinematic-memory-wall',
      items: []
    },
    beverages: {
      enabled: false,
      preset: 'beverage-cellar',
      categories: [],
      products: []
    }
  },
  publish: {}
}
```

Este esquema conceptual debe evolucionar sin crear stores separados por feature.

---

# 6. PLATFORM LAYER — CROSS-DEVICE Y MULTI-PROJECT

Esta capa es **obligatoria antes de considerar el producto comercialmente cerrado**.

## 6.1 Accounts / Auth

- login;
- sesión segura;
- ownership de proyectos;
- permisos preparados para futura colaboración.

## 6.2 Projects Dashboard

```text
MY RESTAURANTS
├── Restaurante A
├── Restaurante B
├── Restaurante C
└── + New Project
```

Acciones mínimas:

- crear;
- abrir;
- duplicar;
- renombrar;
- archivar;
- eliminar con confirmación;
- ver estado Draft / Published.

## 6.3 Cloud Project State

Requisitos:

- autosave remoto;
- `projectId` estable;
- versionado / `updatedAt`;
- estrategia de conflictos;
- recuperación tras cambio de dispositivo;
- drafts privados.

## 6.4 Cloud Media Library

- uploads desde móvil/desktop;
- imágenes/vídeos accesibles desde cualquier dispositivo;
- referencias estables en Project State;
- no depender de Blob URLs locales;
- cache local permitida como optimización.

## 6.5 Same Studio Everywhere

El Studio debe ser realmente usable en:

- desktop;
- tablet;
- móvil.

No basta con que la web pública sea responsive.

## 6.6 Publish Layer

Objetivo:

```text
DRAFT PROJECT
→ PREVIEW
→ PUBLISH
→ PUBLISHED SNAPSHOT
```

Publicar no debe requerir salir a otro repo, otra web o editar código.

---

# 7. ORDEN DE EJECUCIÓN ACTUALIZADO

## Fase A — Motion / Experience Engine

- [x] 11/11 capacidades construidas.
- [x] Scroll Traveler integrado.
- [x] Class 19 Motion Library.
- [x] Regression + human visual validation.

**Estado: CERRADA para construcción de nuevos motores.**

---

## Fase B — Optional Modules / Studio

- [x] Class 20: Location productivo.
- [x] Class 20: Social productivo.
- [x] Class 20: WhatsApp productivo.
- [x] Class 21: Unified Product Detail como capacidad del Product Engine.
- [~] Fase 1B: experiencias autónomas dentro de la misma aplicación *(en curso)*.
- [ ] Project State único.
- [ ] public runtime.
- [ ] persistence.
- [ ] human visual validation.

**Estado: EN CURSO.**

---

## Fase C — Product Design / Section Experiences

- [ ] Memories concept board.
- [ ] Memories mobile.
- [ ] Memories motion board.
- [ ] Beverage Cellar concept board.
- [ ] Beverage mobile.
- [ ] Beverage motion board.
- [ ] Studio UX de Memories/Beverages.
- [ ] Build sólo después de validación de diseño.

**Estado: PENDIENTE DE DISEÑO.**

---

## Fase D — Product Consolidation

- [ ] Todas las capacidades accesibles sin abandonar la plataforma.
- [ ] In-app preview para experiencias autónomas.
- [ ] eliminar dependencias operativas de LABs.
- [ ] mantener LABs sólo como evidencia.

---

## Fase E — Platform Layer / Cross-device

- [ ] Auth / accounts.
- [ ] Projects dashboard.
- [ ] Cloud Project State.
- [ ] Cloud Media Library.
- [ ] autosave remoto.
- [ ] sync cross-device.
- [ ] duplicate/new project.
- [ ] drafts / published snapshots.
- [ ] publish from Studio.

**Criterio crítico:** editar en móvil y continuar el mismo proyecto en ordenador sin export/import manual.

---

## Fase F — Hardening

- [ ] Studio responsive completo.
- [ ] public responsive completo.
- [ ] accessibility.
- [ ] reduced motion.
- [ ] performance budgets.
- [ ] cross-browser/device QA.
- [ ] SEO / structured data.
- [ ] security / permissions.
- [ ] adapter contracts para reservas, pedidos, chat y reviews.

---

## Fase G — Product Proof

Crear un segundo restaurante completamente diferente usando sólo Studio:

```text
NEW PROJECT
→ brand
→ content
→ media
→ menu
→ motion
→ modules
→ memories
→ beverages
→ preview
→ publish
```

Después:

```text
MÓVIL
→ editar
→ guardar

ORDENADOR
→ abrir el mismo proyecto
→ continuar
→ publicar
```

Si esto funciona sin tocar código, sin copiar el repositorio y sin abrir una herramienta paralela, el Restaurant Experience Engine queda demostrado como producto reutilizable.

---

# 8. REGLAS DE ACEPTACIÓN

```text
CODE PASS
+
FUNCTIONAL PASS
+
VISUAL PASS
+
PRODUCT PASS
=
APPROVED
```

Además, desde la fase de plataforma:

```text
CROSS-DEVICE PASS
+
PERSISTENCE PASS
+
PUBLISH PASS
```

son obligatorios.

Una capacidad no está cerrada si sólo funciona en su LAB o en un dispositivo concreto.

---

# 9. DEFINICIÓN DE “PRODUCTO TERMINADO”

El producto está listo cuando una persona puede:

1. entrar desde cualquier dispositivo;
2. autenticarse;
3. crear o abrir un restaurante;
4. personalizar todo desde el mismo Studio;
5. elegir Motion y módulos;
6. gestionar media y productos;
7. guardar automáticamente;
8. abrir el mismo proyecto en otro dispositivo;
9. previsualizar;
10. publicar;
11. crear un segundo restaurante sin tocar código.

No debe necesitar:

- conocer GitHub;
- cambiar de rama;
- abrir un LAB;
- abrir otro repositorio;
- exportar/importar manualmente para cambiar de dispositivo;
- tocar HTML/JS/CSS;
- reconstruir la aplicación para cada cliente.
