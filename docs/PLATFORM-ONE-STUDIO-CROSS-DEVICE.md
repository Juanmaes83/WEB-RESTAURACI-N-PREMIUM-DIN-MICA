# PLATFORM CONTRACT — ONE STUDIO / CROSS-DEVICE / MULTI-PROJECT

## Purpose

Este documento fija la arquitectura de producto que debe protegerse en todas las clases futuras.

El objetivo no es mantener un conjunto de demos avanzadas. El objetivo es convertir el Restaurant Experience Engine en una **plataforma única de creación de webs premium para restauración**, accesible desde cualquier dispositivo y capaz de gestionar múltiples restaurantes sin duplicar código.

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
ANY DEVICE
```

Este principio tiene prioridad sobre la comodidad de una implementación aislada.

Una feature técnicamente brillante no está terminada si sólo vive en:

- una rama;
- un LAB;
- un repo paralelo;
- una URL que el usuario debe conocer aparte;
- un store local imposible de recuperar desde otro dispositivo.

---

# 2. GITHUB / REPOSITORY POLICY

## Canonical repository

`Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA` es el repositorio canónico del producto.

## Branches

Las ramas son herramientas temporales de desarrollo y validación.

Flujo:

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

Los LABs se conservan para:

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

## Research / third-party references

Investigación o exact-source references pueden vivir dentro del mismo repo bajo una zona explícita, por ejemplo:

```text
research/
labs/
```

No deben convertirse automáticamente en dependencias del runtime productivo.

---

# 3. APPLICATION POLICY

## Same application

Studio, preview y project management deben pertenecer a la misma plataforma.

Puede haber rutas internas diferentes, pero el usuario no debe sentir que está saltando entre productos distintos.

Permitido:

```text
/app/projects
/app/studio/:projectId
/app/preview/:projectId
```

No deseado:

```text
repo A → editor
repo B → motion lab
repo C → media
external demo → preview
```

## Autonomous visual experiences

Algunos motores actuales tienen DOM/canvas propio. No es obligatorio convertirlos en el antiguo `#orbit-stage`.

Sí es obligatorio que la UX final permita abrirlos desde la misma plataforma:

```text
Studio
→ select/open experience
→ same application shell
→ same project data
→ same media
→ same preview/publish pipeline
```

---

# 4. PROJECT MODEL

Cada restaurante es un **Project**, no una copia del código.

Conceptualmente:

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

La plataforma actual utiliza IndexedDB para proyectos/media y dispone de import/export JSON.

Esto demuestra personalización y persistencia local, pero no cross-device.

## Target state

```text
REMOTE DATABASE
= canonical project state

REMOTE OBJECT STORAGE
= canonical media

INDEXEDDB
= local cache / resilience
```

Nunca volver a diseñar una feature cuya única fuente de verdad sea un browser-local store si debe formar parte del producto multi-device.

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

El usuario debe poder cerrar el móvil después de `Saved`, abrir el ordenador y continuar.

Import/export JSON seguirá siendo útil para:

- backups;
- templates;
- migration;
- support;

pero no será el mecanismo normal de sincronización.

---

# 7. MEDIA CONTRACT

Media debe ser cross-device.

Flujo objetivo:

```text
mobile upload
→ remote media storage
→ mediaId / stable URL
→ Project State reference
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

---

# 8. RESTAURANT STUDIO CONTRACT

Studio debe seguir siendo uno.

Objetivo de IA:

```text
STUDIO
├── Brand
├── Content
├── Media
├── Menu / Products
├── Motion
│   ├── Product Motion
│   └── Page Motion
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

---

# 9. MULTI-PROJECT CONTRACT

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

# 10. AUTH / SECURITY CONTRACT

Antes de multi-project comercial:

- autenticación;
- autorización por project ownership;
- drafts privados;
- media privada cuando corresponda;
- validación server-side de writes;
- separación clara entre editor y public snapshot.

La infraestructura concreta puede decidirse más adelante. El contrato de producto no depende del proveedor.

---

# 11. PUBLISH CONTRACT

El mismo Project State alimenta preview y publicación.

```text
WORKING DRAFT
→ autosave
→ preview
→ publish
→ immutable/versioned published snapshot
```

El sitio público nunca debería depender del estado incompleto que el editor está modificando en ese instante.

Campos conceptuales:

```text
project.draftVersion
project.publishedVersion
project.publishedAt
```

---

# 12. MOBILE STUDIO CONTRACT

Cross-device no significa únicamente "la URL abre".

Studio debe ser realmente usable con touch:

- navegación accesible;
- inputs cómodos;
- media upload desde cámara/galería;
- reorder táctil;
- preview viewport;
- toggles grandes;
- sin hover obligatorio;
- sin nested scroll imposible;
- safe areas;
- teclado móvil respetado.

Prueba obligatoria futura:

```text
CREATE / EDIT / SAVE FROM PHONE
→ CONTINUE FROM DESKTOP
```

---

# 13. MODULE CONTRACT

Toda feature nueva debe responder antes de implementarse:

1. ¿Dónde vive en Project State?
2. ¿Cómo se edita en el Studio actual?
3. ¿Cómo se guarda remotamente?
4. ¿Qué media utiliza?
5. ¿Cómo se ve en preview?
6. ¿Cómo pasa a published snapshot?
7. ¿Funciona en móvil?
8. ¿Qué ocurre OFF?
9. ¿Puede abrirse desde otro dispositivo?
10. ¿Introduce un store o producto paralelo? Si sí, rediseñar.

---

# 14. CURRENT GAP ANALYSIS

## Ya conseguido

- Engine reusable;
- Studio editable;
- Project State local;
- Media local;
- menu/product editing;
- 11 Motion capabilities;
- Motion Library;
- Scroll Traveler;
- Social runtime;
- WhatsApp runtime;
- Location LAB;
- autosave local;
- import/export;
- second-restaurant preset proof.

## Cerrado recientemente

- Class 20: Location + Social + WhatsApp productivos dentro de Studio, con Project
  State único y sin store paralelo.
- Class 21: Unified Product Detail — la ficha de producto como capacidad opcional del
  Product Engine, compartida por los motores mediante adaptadores.

## En curso

- **Fase 1B — Product Consolidation**: las tres experiencias autónomas se previsualizan
  dentro de la misma aplicación (In-App Experience Shell) sobre el mismo proyecto, en
  lugar de abrirse como LAB en otra pestaña. `LAB != PRODUCT ENTRY POINT`.

  Cumple ya: ONE PRODUCT · ONE STUDIO · ONE PROJECT · ONE PREVIEW EXPERIENCE.
  Sigue pendiente: ONE MEDIA MODEL completo para la experiencia que aún no consume la
  carta del proyecto (Circular Dish Rotator), documentado en
  `docs/IN-APP-EXPERIENCE-AUDIT.md`.

  Esto **no** cierra la Platform Layer: cuentas, cloud y cross-device siguen pendientes.

## Falta

- Memories;
- Beverages;
- unified in-app preview para experiencias autónomas;
- auth;
- projects dashboard;
- remote Project State;
- remote Media Library;
- cross-device sync;
- publish layer;
- mobile Studio hardening;
- permissions/security;
- final second-restaurant cross-device proof.

---

# 15. PRODUCT COMPLETION TEST

No declararemos el producto terminado hasta superar este escenario:

```text
PHONE
1. Login
2. New Restaurant
3. Set brand
4. Upload logo/photos
5. Build/edit menu
6. Choose motion
7. Enable modules
8. Save

DESKTOP
9. Login
10. Open same restaurant
11. See identical state/media
12. Continue editing
13. Preview
14. Publish

SECOND RESTAURANT
15. Create/duplicate new project
16. Make visually different website
17. Publish without touching code
```

Resultado esperado:

```text
ONE ENGINE
MANY RESTAURANTS
ANY DEVICE
NO CODE
NO REPO COPYING
NO LAB HUNTING
```

---

# 16. DECISION RULE FOR FUTURE WORK

Ante cualquier propuesta nueva, priorizar:

```text
Does this strengthen the one-platform product?
```

Si la respuesta es no, o si crea fragmentación operativa, no se integra todavía.
