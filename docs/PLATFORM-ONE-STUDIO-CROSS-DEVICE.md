# PLATFORM CONTRACT — ONE STUDIO / CROSS-COMPUTER V1 / MOBILE STUDIO LATER / MULTI-PROJECT

## Purpose

Este documento fija la arquitectura de producto que debe protegerse en todas las clases futuras.

El objetivo no es mantener un conjunto de demos avanzadas. El objetivo es convertir el Restaurant Experience Engine en una **plataforma única de creación de webs premium para restauración**, capaz de gestionar múltiples restaurantes sin duplicar código y sin depender de un ordenador concreto.

Decisión de dispositivo vigente:

```text
V1 = DESKTOP / LAPTOP FIRST
+
CROSS-COMPUTER OBLIGATORIO
+
PUBLIC WEBSITE RESPONSIVE
+
MOBILE-READY ARCHITECTURE
+
MOBILE STUDIO COMPLETO EN FASE POSTERIOR
```

La edición móvil completa se difiere para acelerar V1. **No se cancela ni puede quedar bloqueada por decisiones tomadas ahora.**

---

# 1. PRINCIPIO CENTRAL

```text
ONE PRODUCT
ONE CANONICAL REPOSITORY
ONE STUDIO
ONE PROJECT MODEL
ONE MEDIA MODEL
ONE DEPLOYMENT EXPERIENCE
MANY RESTAURANT PROJECTS
ANY COMPUTER
MOBILE-READY FUTURE
```

Este principio tiene prioridad sobre la comodidad de una implementación aislada.

Una feature técnicamente brillante no está terminada si sólo vive en:

- una rama;
- un LAB;
- un repo paralelo;
- una URL que el usuario debe conocer aparte;
- un store local imposible de recuperar desde otro ordenador.

---

# 2. GITHUB / REPOSITORY POLICY

## Canonical repository

`Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA` es el repositorio canónico del producto.

## Branches

Las ramas son herramientas temporales de desarrollo y validación.

```text
main
→ feature branch
→ implementation
→ tests
→ live proof
→ human visual review
→ approval
→ merge to main
```

Una rama aprobada no debe convertirse en dependencia permanente del producto.

## LABs

Se conservan para:

- evidencia;
- regresión;
- comparación;
- investigación;
- historial de diseño.

Pero:

```text
LAB != PRODUCT ENTRY POINT
```

El cliente final no debe necesitar abrir `/labs/...` para usar una capacidad aprobada.

---

# 3. APPLICATION POLICY

Studio, preview y project management deben pertenecer a la misma plataforma.

Puede haber rutas internas diferentes, por ejemplo:

```text
/app/projects
/app/studio/:projectId
/app/preview/:projectId
```

pero el usuario no debe sentir que está saltando entre productos distintos.

No deseado:

```text
repo A → editor
repo B → motion lab
repo C → media
external demo → preview
```

## Autonomous visual experiences

Algunos motores actuales tienen DOM/canvas propio. No es obligatorio convertirlos en `#orbit-stage`.

Sí es obligatorio que la UX final permita:

```text
Studio
→ open experience
→ same application shell
→ same project data
→ same media
→ same preview/publish pipeline
```

---

# 4. PROJECT MODEL

Cada restaurante es un **Project**, no una copia del código.

```js
Project {
  id,
  ownerId,
  name,
  slug,
  status,
  version,
  brand,
  content,
  media,
  menu,
  motion,
  productDetail,
  modules,
  publish,
  createdAt,
  updatedAt
}
```

Un nuevo restaurante se crea con:

```text
NEW PROJECT
```

no con:

```text
COPY REPOSITORY
```

---

# 5. SOURCE OF TRUTH

## Current state

La plataforma actual utiliza persistencia local para proyectos/media y dispone de import/export.

Esto demuestra personalización y persistencia local, pero no continuidad real entre ordenadores.

## Target state

```text
REMOTE DATABASE
= canonical project state

REMOTE OBJECT STORAGE
= canonical media

INDEXEDDB / LOCAL CACHE
= resilience / optimization
```

Nunca diseñar una feature cuya única fuente de verdad sea browser-local si debe formar parte del producto multi-project.

---

# 6. SYNCHRONIZATION CONTRACT

Mínimo necesario:

```text
projectId
version
updatedAt
remote autosave
local cache
sync status
conflict detection
```

Estados Studio recomendados:

```text
Saved
Saving…
Offline
Sync pending
Conflict
```

## Gate V1

El gate cross-device principal de V1 es cross-computer:

```text
PC A
→ edit / upload / save

PC B
→ login
→ same project
→ same media
→ continue / preview / publish
```

Import/export sigue siendo útil para backups, templates, migración y soporte, pero **no** como mecanismo normal de sincronización.

## Gate móvil futuro

```text
PHONE
→ edit / upload / save

PC
→ same project / continue
```

Se implementará en la fase Mobile Studio. El backend/state/media construidos para V1 deben poder servir ese flujo sin rehacerse.

---

# 7. MEDIA CONTRACT

Media debe ser independiente del dispositivo.

Flujo V1:

```text
desktop upload
→ remote media storage
→ mediaId / stable URL
→ Project State reference
→ another desktop opens same asset
```

Flujo futuro móvil:

```text
phone camera/gallery
→ same remote media storage
→ same mediaId / stable URL
→ desktop opens same asset
```

No guardar como estado canónico:

- Blob URLs temporales;
- filesystem paths locales;
- browser-only object references.

La Media Library debe admitir al menos:

- images;
- video;
- logos;
- dish/product assets;
- memories media;
- beverage media.

## Regla de unificación

```text
BRAND     ─┐
MENU      ─┤
MEMORIES  ├─→ ONE MEDIA ENGINE / ONE MEDIA LIBRARY
BEVERAGES ┘
```

No crear uploaders con almacenamiento propio por feature.

---

# 8. RESTAURANT STUDIO CONTRACT

Studio debe seguir siendo uno.

```text
STUDIO
├── Brand
├── Content
├── Media
├── Menu / Products
├── Motion
│   ├── Product Motion
│   └── Page Motion
├── Product Detail
├── Modules / Integrations
│   ├── Location
│   ├── Social / Reputation
│   └── WhatsApp
├── Memories
├── Beverages
├── Project
└── Publish
```

Nueva funcionalidad:

```text
ADDITIVE
```

Nunca:

```text
REPLACE CURRENT STUDIO
```

## V1 Studio target

V1 se optimiza para desktop/laptop:

- navegación clara;
- edición completa;
- upload imagen/vídeo;
- autosave;
- preview;
- project management;
- publish.

## Protección móvil obligatoria desde hoy

Aunque no se cierre UX móvil completa en V1:

- no hover-only para acciones críticas;
- layouts flexibles y reflow posible;
- no lógica de dominio acoplada al viewport;
- no estado específico de dispositivo;
- nuevas interacciones compatibles con Pointer Events cuando corresponda;
- controles semánticos/accesibles;
- no paths locales como contrato.

```text
MOBILE-READY ARCHITECTURE NOW
≠
MOBILE-FINISHED UX NOW
```

---

# 9. MEMORIES CONTRACT

Memories debe ser una Section Experience configurable, no una demo visual cerrada.

Debe incluir en el mismo Studio:

```text
ON / OFF
preset
+ memory
image OR video
Media Library selection
title / story / author / date / place
type
visual weight / featured
order
preview
persist
```

Requisitos:

- Project State único;
- Media Engine único;
- soporte de imagen y vídeo desde el modelo inicial;
- desktop-first editor;
- arquitectura compatible con touch futuro;
- public output responsive.

---

# 10. BEVERAGES CONTRACT

Beverages debe ser configurable desde el mismo Studio.

Debe incluir:

```text
ON / OFF
preset
+ beverage
image OR video
Media Library selection
name / category / producer / origin / vintage
description / notes / pairing
price glass / bottle
availability
tags
order / featured
preview
persist
```

Requisitos:

- Beverage Domain único;
- no duplicar producto por preset;
- Media Engine único;
- Project State único;
- desktop-first editor;
- arquitectura compatible con touch futuro;
- public output responsive.

---

# 11. MULTI-PROJECT CONTRACT

Dashboard objetivo:

```text
MY RESTAURANTS

[ Restaurante A ]   Draft
[ Restaurante B ]   Published
[ Restaurante C ]   Draft

+ New restaurant
```

Operaciones mínimas:

- create;
- open;
- duplicate;
- rename;
- archive;
- delete;
- publish/unpublish;
- inspect last modified.

Duplicar un restaurante duplica datos/configuración, no el engine.

---

# 12. AUTH / SECURITY CONTRACT

Antes de multi-project comercial:

- autenticación;
- autorización por ownership;
- drafts privados;
- media privada cuando corresponda;
- validación server-side de writes;
- separación entre editor y public snapshot.

La infraestructura concreta puede decidirse más adelante. El contrato de producto no depende del proveedor.

---

# 13. PUBLISH CONTRACT

El mismo Project State alimenta preview y publicación.

```text
WORKING DRAFT
→ autosave
→ preview
→ publish
→ immutable/versioned published snapshot
```

El sitio público no debe depender del estado incompleto que el editor modifica en ese instante.

Campos conceptuales:

```text
project.draftVersion
project.publishedVersion
project.publishedAt
```

---

# 14. PUBLIC RESPONSIVE CONTRACT

Diferir Mobile Studio **no reduce el estándar móvil de la web pública**.

Toda web publicada debe funcionar en:

- móvil;
- tablet;
- desktop.

Siguen siendo requisitos V1:

- responsive público;
- accesibilidad;
- reduced-motion;
- performance;
- controles públicos touch-friendly.

---

# 15. MOBILE STUDIO CONTRACT — POST-V1, NO CANCELADO

La edición móvil completa tendrá una fase propia posterior al V1 desktop/cross-computer.

Objetivo:

```text
PHONE
→ login
→ open project
→ edit
→ camera/gallery upload
→ reorder
→ save

DESKTOP
→ same project
→ continue
```

La fase incluirá:

- navegación touch;
- reflow de paneles;
- inputs cómodos;
- reorder táctil;
- cámara/galería;
- safe areas;
- teclado móvil;
- viewport preview;
- nested scroll QA;
- dispositivos físicos.

Esta fase debe poder añadirse sin reescribir Project State, Media Engine, Memories, Beverages, Auth o Publish.

---

# 16. MODULE CONTRACT

Toda feature nueva debe responder antes de implementarse:

1. ¿Dónde vive en Project State?
2. ¿Cómo se edita en el Studio actual?
3. ¿Cómo se guardará remotamente?
4. ¿Qué media utiliza y pertenece a la Media Library común?
5. ¿Cómo se ve en preview?
6. ¿Cómo pasa a published snapshot?
7. ¿El sitio público funciona en móvil?
8. ¿Qué ocurre OFF?
9. ¿Puede abrirse desde otro ordenador?
10. ¿La arquitectura permite móvil futuro sin reescritura de dominio?
11. ¿Introduce un store, uploader o producto paralelo? Si sí, rediseñar.

---

# 17. CURRENT GAP ANALYSIS — 8 SEPTIEMBRE 2026

## Ya conseguido

- Engine reusable;
- Studio editable;
- Project State local;
- Media local;
- menu/product editing;
- 11 Motion capabilities;
- Motion Library;
- Scroll Traveler;
- Class 20 Location + Social + WhatsApp productivos;
- Spanish public defaults;
- Class 21 Unified Product Detail;
- autosave local;
- import/export;
- second-restaurant preset proof.

## En curso

- Fase 1B: in-app consolidation de Circular Dish Rotator, Dish Stage y Cinematic Product
  Rail — **CERRADA**. Cumple ONE PRODUCT · ONE STUDIO · ONE PROJECT · ONE PREVIEW
  EXPERIENCE: las tres se previsualizan dentro de la misma aplicación sobre el mismo
  Project State, sin abrir otra pestaña y sin store paralelo.

- Fase 1C: consolidation gate — **entregada y pendiente de revisión visual humana**.
  Cierra `LAB != PRODUCT ENTRY POINT` también como runtime: el producto abre
  `experiences/<id>/index.html`, no una página de `/labs/`, y ambas puertas cargan el
  **mismo motor canónico** — una implementación, dos entradas, ningún motor duplicado.
  El guard de DOM prohíbe que cualquier acción productiva interna apunte a `/labs/` o
  abra otra pestaña; los enlaces comerciales públicos sí pueden salir, y se comprueba
  que siguen ahí. Gate 28/28 en `tests/phase-1c-consolidation-gate.mjs`, tabla capacidad
  por capacidad en `docs/PHASE-1C-PRODUCT-CONSOLIDATION-GATE.md`.

  Sigue pendiente para ONE MEDIA MODEL completo: el rotador aún no consume la carta del
  proyecto, documentado en `docs/IN-APP-EXPERIENCE-AUDIT.md`.

  Nada de esto cierra la Platform Layer: cuentas, cloud, Project State remoto, Media
  Library remota y autosave cross-computer siguen pendientes y siguen siendo
  obligatorios para V1.

## Falta para V1
- Memories con Studio + image/video;
- Beverages con Studio + image/video;
- final Project Model;
- auth;
- projects dashboard;
- remote Project State;
- remote Media Library;
- cross-computer sync;
- publish layer;
- security/permissions;
- public responsive hardening;
- final second-restaurant cross-computer proof.

## Falta después de V1

- Mobile Studio completion;
- phone → desktop editing proof.

---

# 18. V1 COMPLETION TEST

No declararemos V1 terminado hasta superar:

```text
PC A
1. Login
2. New Restaurant
3. Set brand
4. Upload logo/photos/video
5. Build/edit menu
6. Choose motion
7. Configure Product Detail
8. Enable modules
9. Configure Memories
10. Configure Beverages
11. Save remotely

PC B
12. Login
13. Open same restaurant
14. See identical state/media
15. Continue editing
16. Preview
17. Publish

SECOND RESTAURANT
18. Create/duplicate new project
19. Make visually different website
20. Publish without touching code
```

Resultado:

```text
ONE ENGINE
MANY RESTAURANTS
ANY COMPUTER
NO CODE
NO REPO COPYING
NO LAB HUNTING
```

---

# 19. MOBILE COMPLETION TEST — FASE POSTERIOR

```text
PHONE
1. Login
2. Open restaurant
3. Edit fields
4. Upload image/video
5. Reorder where applicable
6. Save

DESKTOP
7. Open same restaurant
8. Same project/media
9. Continue editing
```

Resultado:

```text
SAME PLATFORM
PHONE + DESKTOP
NO DOMAIN REWRITE
```

---

# 20. DECISION RULE

Ante cualquier propuesta nueva:

```text
¿Acelera V1 sin fragmentar el producto ni bloquear Mobile Studio futuro?
```

- Si sí → implementar.
- Si sólo falta polish móvil → diferir.
- Si el atajo crea deuda estructural en Project State, Media, dominio o componentes → rechazarlo.
- Si la compatibilidad futura tiene coste pequeño → pagar ese coste ahora.

Documento complementario:
[`DEVICE-STRATEGY-DESKTOP-FIRST-MOBILE-LATER.md`](DEVICE-STRATEGY-DESKTOP-FIRST-MOBILE-LATER.md)