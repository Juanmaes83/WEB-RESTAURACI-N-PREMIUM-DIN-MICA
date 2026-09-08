# RESTAURANT EXPERIENCE ENGINE + RESTAURANT STUDIO

## North Star

Este repositorio no representa una sola web de restaurante. El producto objetivo es una **plataforma única para crear, personalizar, previsualizar y publicar múltiples webs premium de restauración desde cualquier móvil, tablet u ordenador**.

La regla principal es:

```text
UN PRODUCTO
→ UN REPOSITORIO CANÓNICO
→ UN STUDIO
→ UN PROJECT STATE
→ UNA MEDIA LIBRARY
→ MÚLTIPLES PROYECTOS / RESTAURANTES
→ ACCESO CROSS-DEVICE
→ PREVIEW + PUBLICACIÓN DESDE LA MISMA PLATAFORMA
```

LÚMINA y los LABs son superficies de prueba. El activo real es el **Restaurant Experience Engine + Restaurant Studio**.

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

Toda capacidad de producto debe terminar integrada en el Studio actual con la misma jerarquía visual, patrones de campos, toggles, autosave, responsive y persistencia.

No crear:

- un segundo panel;
- un configurador separado por módulo;
- un Studio por motor;
- un store independiente por capacidad.

## 4. Un único Project State

Todo proyecto debe poder serializarse y restaurarse desde un único contrato de estado:

```text
Brand
Content
Media references
Menu / Products
Motion
Modules
Memories
Beverages
Publish settings
```

IndexedDB es actualmente la persistencia local del Studio, pero **no puede ser la fuente de verdad final** porque no permite abrir el mismo proyecto desde otro dispositivo.

El objetivo de plataforma es:

```text
REMOTE PROJECT STATE = SOURCE OF TRUTH
LOCAL CACHE / INDEXEDDB = CACHE + OFFLINE/FALLBACK
```

## 5. Cross-device es requisito de producto

El mismo proyecto debe poder seguir este flujo:

```text
MÓVIL
→ login
→ abrir Restaurante A
→ cambiar texto / foto / motion
→ autosave remoto

ORDENADOR
→ login
→ abrir Restaurante A
→ ver exactamente los cambios
→ continuar editando
→ publicar
```

La personalización nunca debe depender de un navegador concreto.

## 6. Multi-project

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

Class 19 — Motion + Module Studio Integration está aprobada y mergeada.

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

Estado UX actual:

- siete coreografías se activan sobre el escenario compartido;
- Scroll Traveler funciona como Page Motion transversal;
- Circular Dish Rotator, Dish Stage y Cinematic Product Rail siguen siendo experiencias autónomas abiertas desde la biblioteca.

**Objetivo final:** ninguna experiencia aprobada debe exigir abandonar la plataforma. Si una experiencia necesita una superficie propia, debe vivir dentro del mismo deployment y del mismo shell de producto/preview, no como una web externa o repositorio separado.

## Optional Modules

- Social / Reputation — **CERRADO**: productivo dentro del Studio, con Project State único.
- WhatsApp Contact / Concierge — **CERRADO**: productivo dentro del Studio.
- Location / Google Maps — **CERRADO**: productivo dentro del Studio, con carga del mapa bajo consentimiento.

Class 20 (módulos opcionales) y Class 21 (Unified Product Detail) están **CERRADAS y
mergeadas**.

La fase activa es **Fase 1B — Product Consolidation**: las tres experiencias autónomas
(Circular Dish Rotator, Dish Stage, Cinematic Product Rail) se abren **dentro de la
misma aplicación**, sobre el mismo proyecto, en lugar de mandar al usuario a `/labs/`
en otra pestaña. Los LABs se conservan como evidencia y regresión: dejan de ser el
punto de entrada del producto.

La capa de plataforma (cuentas, cloud, cross-device) **no** está terminada.

## Section Experiences pendientes

- Memories / Guest Stories — diseño de producto pendiente.
- Beverage Experience — diseño de producto pendiente.

Dirección acordada:

```text
MEMORIES
├── Cinematic Memory Wall
├── Memory Stack
├── Editorial Journal
└── optional material artifacts

BEVERAGES
├── Beverage Cellar
├── Bottle Rail
├── Cocktail Stage
└── Minimal Wine List
```

## Platform Layer pendiente

Todavía falta convertir el Studio local en una plataforma cross-device real:

- autenticación / cuentas;
- lista de proyectos;
- Project State remoto;
- Media Library remota;
- autosave remoto;
- sincronización entre dispositivos;
- duplicar / crear proyecto;
- drafts + published snapshot;
- publicación desde Studio;
- permisos/seguridad;
- responsive completo del Studio móvil/tablet.

---

# Arquitectura objetivo

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
│
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

---

# Fuente de verdad y sincronización

Objetivo:

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

El navegador puede cachear y trabajar de forma resiliente, pero la versión canónica del proyecto debe vivir remotamente para permitir acceso desde cualquier dispositivo.

Los assets deben seguir el mismo principio:

```text
REMOTE MEDIA LIBRARY = SOURCE OF TRUTH
LOCAL BLOB CACHE = OPTIMIZATION
```

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
```

---

# Próximas fases

1. ~~**Class 20 — Location + Social + WhatsApp dentro del Studio y Project State.**~~ — CERRADO.
2. ~~**Class 21 — Unified Product Detail:** la ficha como capacidad del Product Engine.~~ — CERRADO.
3. **Fase 1B — Product Consolidation** *(en curso)*: las experiencias autónomas se
   previsualizan dentro de la misma aplicación, sin LABs como punto de entrada.
3. **Memories + Beverages:** diseño y construcción como Section Experiences configurables.
4. **Platform Layer:** cuentas, proyectos, persistencia cloud, media cloud y cross-device.
5. **Publish Layer:** drafts, preview y publicación desde el mismo proyecto.
6. **Hardening:** mobile Studio, accesibilidad, performance, SEO, cross-browser y seguridad.
7. **Prueba de producto:** crear un segundo restaurante totalmente diferente sin tocar código y continuar editándolo desde otro dispositivo.

---

# Documentación canónica

- **Roadmap:** [`docs/ROADMAP-RESTAURANT-EXPERIENCE-ENGINE.md`](docs/ROADMAP-RESTAURANT-EXPERIENCE-ENGINE.md)
- **Arquitectura de plataforma / cross-device:** [`docs/PLATFORM-ONE-STUDIO-CROSS-DEVICE.md`](docs/PLATFORM-ONE-STUDIO-CROSS-DEVICE.md)
- **Class 19 Motion Library:** [`docs/CLASS-19-MOTION-STUDIO-INTEGRATION.md`](docs/CLASS-19-MOTION-STUDIO-INTEGRATION.md)

La documentación histórica de Classes y LABs se conserva, pero estos tres documentos definen la dirección actual del producto.
