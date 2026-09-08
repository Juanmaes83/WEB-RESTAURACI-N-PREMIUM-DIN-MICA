# ROADMAP — RESTAURANT EXPERIENCE ENGINE + RESTAURANT STUDIO

## North Star

El producto no es una web concreta de restaurante. El objetivo es una **plataforma única y reusable para crear múltiples webs premium de restauración sin tocar código**.

Principio rector:

```text
UN PRODUCTO
→ UN REPOSITORIO CANÓNICO
→ UN STUDIO
→ UN PROJECT STATE
→ UNA MEDIA LIBRARY
→ MÚLTIPLES PROYECTOS
→ ACCESO DESDE CUALQUIER ORDENADOR
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

# 0. REGLAS DE CONSOLIDACIÓN

## 0.1 Ramas y LABs no son el producto

Ramas de feature y LABs pueden existir para construir, comparar y validar. Una vez aprobada una capacidad:

- debe mergearse a `main`;
- debe quedar accesible desde el mismo Restaurant Studio;
- debe usar el mismo Project State;
- debe poder previsualizarse desde la misma plataforma;
- no debe obligar al usuario final a conocer una rama, repo o página de laboratorio.

```text
LAB != PRODUCT ENTRY POINT
```

Los LABs se conservan como evidencia, regresión, comparación e historial.

## 0.2 Un solo repositorio canónico

Este repositorio es el núcleo del producto. Backend, API, funciones, schemas, persistence adapters, Studio y app pública deben mantenerse coordinados, preferiblemente como monorepo.

## 0.3 Un solo Studio

No crear paneles paralelos. Toda capacidad debe integrarse usando las convenciones del Studio actual.

No crear:

- un configurador separado por módulo;
- un Studio por motor;
- un store independiente por feature;
- una Media Library por sección.

## 0.4 Un solo Project State

Todo lo configurable pertenece al mismo contrato de proyecto.

```text
REMOTE PROJECT STATE = SOURCE OF TRUTH
LOCAL CACHE / INDEXEDDB = CACHE + RESILIENCIA
```

## 0.5 Una sola Media Library

```text
REMOTE MEDIA LIBRARY = SOURCE OF TRUTH
LOCAL BLOB CACHE = OPTIMIZACIÓN
```

Menu, Memories, Beverages, Brand y futuros dominios consumen la misma capa de media.

---

# 1. ESTRATEGIA DE DISPOSITIVOS

La estrategia aprobada para V1 es:

```text
DESKTOP / LAPTOP FIRST
+
CROSS-COMPUTER OBLIGATORIO
+
PUBLIC WEBSITE RESPONSIVE
+
MOBILE-READY ARCHITECTURE
+
MOBILE STUDIO COMPLETO DESPUÉS
```

## 1.1 Gate V1 obligatorio

```text
ORDENADOR A
→ login
→ abrir proyecto
→ editar
→ subir imagen/vídeo
→ autosave remoto

ORDENADOR B
→ login
→ abrir el mismo proyecto
→ mismo estado
→ misma media
→ continuar
→ preview
→ publish
```

## 1.2 Lo que NO bloquea V1

No es requisito de cierre V1 tener paridad completa del Studio en móvil:

- editor completo a 390 px;
- reorder táctil avanzado;
- cámara/galería optimizada;
- safe areas;
- teclado móvil complejo;
- UX touch 1:1 con desktop.

## 1.3 Lo que sí protegemos desde ahora

No se permiten atajos que hagan cara la futura fase móvil:

- no hover obligatorio para acciones críticas;
- no layouts rígidos innecesarios;
- no lógica de negocio ligada al viewport;
- no estado canónico browser-local;
- no paths locales canónicos;
- nuevas interacciones compatibles con Pointer Events cuando corresponda;
- componentes con estructura semántica y capacidad de reflow.

```text
MOBILE-READY NOW
≠
MOBILE-FINISHED NOW
```

Documento específico:
[`DEVICE-STRATEGY-DESKTOP-FIRST-MOBILE-LATER.md`](DEVICE-STRATEGY-DESKTOP-FIRST-MOBILE-LATER.md)

---

# 2. ARQUITECTURA OBJETIVO

```text
RESTAURANT EXPERIENCE PLATFORM
│
├── ACCOUNT / AUTH
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
│   ├── Product Detail
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
- **Product Detail** pertenece al Product Engine, no a Motion.
- **Section Experiences** son experiencias visuales premium configurables.
- **Optional Modules** añaden funcionalidad comercial/contacto.
- **Integrations** conectan proveedores externos mediante adapters.
- **Project State** es la configuración canónica por proyecto.
- **Media Engine** es la única capa de assets.

---

# 3. ESTADO ACTUAL — 8 SEPTIEMBRE 2026

## 3.1 Motion Catalog — 11/11 construidos

| # | Capacidad | Estado | UX actual |
|---|---|---|---|
| 01 | Elegant Orbit | ✅ aprobado | escenario compartido |
| 02 | Urban Acrobatics | ✅ aprobado | escenario compartido |
| 03 | Editorial Flow | ✅ aprobado | escenario compartido |
| 04 | Cinematic Depth Carousel | ✅ aprobado | escenario compartido |
| 05 | Precomposed Anchor Scenes | ✅ aprobado | escenario compartido |
| 06 | Orbital Food Slider | ✅ aprobado | escenario compartido |
| 07 | Circular Dish Rotator | ✅ aprobado | experiencia autónoma, in-app desde 1B; su carta sigue siendo propia |
| 08 | Pizza Slice Orbit · Premium | ✅ aprobado | escenario compartido |
| 09 | Scroll Traveler | ✅ aprobado | Page Motion ON/OFF |
| 10 | Dish Stage | ✅ aprobado | experiencia autónoma, in-app desde 1B; hereda la carta del proyecto |
| 11 | Cinematic Product Rail | ✅ aprobado | experiencia autónoma, in-app desde 1B; hereda la carta del proyecto |

**Class 19 — Motion Library:** ✅ cerrado y mergeado.

## 3.2 Optional Modules

**Class 20 — Optional Modules / Studio Integration:** ✅ cerrado y mergeado.

Incluye:

- Location / Google Maps;
- Social / Reputation;
- WhatsApp Contact / Concierge;
- OFF/ON real;
- español público por defecto;
- mismo Studio;
- mismo Project State.

## 3.3 Unified Product Detail

**Class 21 — Unified Product Detail:** ✅ cerrado y mergeado.

- seis motores reutilizan la ficha compartida existente;
- Dish Stage y Cinematic Product Rail usan adapters;
- Pizza conserva su modelo propio;
- ON/OFF y campos configurables desde el Studio;
- persistencia / Undo / Redo / import/export;
- misma fuente de verdad.

## 3.4 Fase activa

**FASE 2 — MEMORIES (CLASS 23): READY FOR HUMAN VISUAL REVIEW.**

FASE 1A, 1B y **1C** están **CERRADAS y mergeadas**. Memories entra como capacidad
completa del producto —Project State, Studio, media compartida, motor y web pública— y no
como un LAB pendiente de integrar. Un dominio de datos, tres presentaciones: cambiar de
preset no cambia los datos. Gate 39/39. Detalle en `docs/CLASS-23-MEMORIES.md`.

Lo que cerró la fase anterior, que Memories no toca:

**FASE 1C — PRODUCT CONSOLIDATION GATE: CERRADA.**

FASE 1A y FASE 1B están **CERRADAS**. 1C no añade capacidad: demuestra que lo
construido es un producto — un Studio, un Project State, un modelo de media, una
experiencia de producto y once capacidades de movimiento — y retira el último uso de
`/labs/` en el recorrido productivo. Las tres experiencias abren desde
`experiences/<id>/index.html`, que carga el **mismo motor canónico** que la puerta
histórica del LAB: una implementación, dos puertas. Gate 28/28 con guard de DOM. Detalle
en `docs/PHASE-1C-PRODUCT-CONSOLIDATION-GATE.md`.

Lo entregado en 1B, que 1C conserva intacto:

Entregado: la In-App Experience Shell (`class22-experience-shell.js` + `styles-v22.css`)
abre las tres experiencias dentro de la misma aplicación mediante un iframe same-origin,
con traspaso explícito del proyecto activo a través de `experience-shell-bridge.js`.
Ninguna abre otra pestaña, ninguna exige pasar por `/labs/`, y cerrar devuelve al Studio.
Los motores, su geometría y sus animaciones quedaron intactos. Pendiente sólo de la
revisión visual humana.

Objetivo:

```text
Circular Dish Rotator
Dish Stage
Cinematic Product Rail
        ↓
MISMA APLICACIÓN / MISMO SHELL
        ↓
MISMO PROJECT STATE
MISMA MEDIA
VOLVER AL STUDIO
```

No convertir estos motores en orbit presets. No borrar LABs. Eliminar sólo la dependencia operativa de abrirlos fuera del producto.

Estado real tras 1B: ninguno se convirtió en preset, ningún LAB se borró y la dependencia
operativa está eliminada — los LABs sólo se usan ya como evidencia y regresión. La
auditoría previa y sus limitaciones documentadas están en `docs/IN-APP-EXPERIENCE-AUDIT.md`;
la limitación viva es que el rotador conserva su propia carta (ocho pizzas con su
geometría de sectores) y hereda del proyecto sólo la marca.

---

# 4. MEMORIES — FASE 2

## Objetivo

Convertir historia, clientes, recuerdos, prensa, eventos y testimonios en una experiencia visual memorable, no en un grid genérico.

Dirección:

```text
MEMORIES ENGINE
├── Cinematic Memory Wall
├── Memory Stack
├── Editorial Journal
└── optional material artifacts
```

## Requisito de Studio — obligatorio

Memories no está terminada si sólo existe como experiencia visual.

Debe incluir dentro del **mismo Restaurant Studio**:

```text
ON / OFF
preset
+ añadir recuerdo
subir IMAGEN
subir VÍDEO
seleccionar desde Media Library
título
texto / historia
autor
fecha
lugar
tipo
visualWeight / featured
orden
preview
persistencia
```

## Modelo conceptual

```text
type
media[]
title
text
author
date
place
rating
link
visualWeight
featured
```

Imagen y vídeo son capacidades del dominio desde V1, aunque la UX de captura móvil avanzada se difiera.

## Reglas

- no uploader independiente;
- no Media Library paralela;
- no store propio;
- Project State único;
- Media Engine único;
- desktop-first Studio;
- estructura compatible con futuro touch/mobile.

---

# 5. BEVERAGES — FASE 3

## Objetivo

Experiencia para vinos, espumosos, cervezas, cócteles, destilados, bebidas sin alcohol, café y té.

Dirección:

```text
BEVERAGE EXPERIENCE
├── Beverage Cellar
├── Bottle Rail
├── Cocktail Stage
└── Minimal Wine List
```

## Requisito de Studio — obligatorio

Debe incluir dentro del mismo Studio:

```text
ON / OFF
preset
+ añadir bebida
subir IMAGEN
subir VÍDEO
seleccionar desde Media Library
nombre
categoría
productor
origen
añada
descripción
notas
maridaje
precio copa
precio botella
disponibilidad
tags
orden / featured
preview
persistencia
```

## Modelo conceptual

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
media[]
availability
tags
accentColor
world
featured
```

Los datos pertenecen al Beverage/Product Domain. El preset gobierna presentación, no duplica producto.

---

# 6. PROJECT STATE — CONTRATO OBJETIVO

```js
project: {
  id,
  ownerId,
  name,
  slug,
  status,
  version,
  brand: {},
  content: {},
  media: {},
  menu: {},
  motion: {},
  productDetail: {},
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
  publish: {},
  createdAt,
  updatedAt
}
```

Este contrato debe evolucionar sin crear stores separados por feature.

---

# 7. PLATFORM LAYER — FASE 5

Esta capa es **obligatoria para cerrar V1 comercial**.

## 7.1 Accounts / Auth

- login;
- sesión segura;
- ownership de proyectos;
- drafts privados;
- permisos preparados para futura colaboración.

## 7.2 Projects Dashboard

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
- Draft / Published;
- última modificación.

## 7.3 Cloud Project State

- autosave remoto;
- `projectId` estable;
- `version` / `updatedAt`;
- detección de conflicto;
- recuperación entre ordenadores;
- cache local como resiliencia.

## 7.4 Cloud Media Library

- imágenes y vídeos;
- referencias estables (`mediaId` / URL estable);
- misma media desde cualquier ordenador;
- no Blob URLs como fuente canónica;
- Menu / Memories / Beverages / Brand consumen la misma librería.

## 7.5 Gate V1 de cross-device

**No usamos el móvil como gate principal de esta fase.**

El criterio crítico es:

```text
PC A
→ SAVE

PC B
→ SAME PROJECT
→ SAME MEDIA
→ CONTINUE
```

La arquitectura debe seguir preparada para añadir Phone → Desktop después.

---

# 8. PUBLISH LAYER — FASE 6

```text
WORKING DRAFT
→ autosave
→ preview
→ publish
→ versioned published snapshot
```

Campos conceptuales:

```text
draftVersion
publishedVersion
publishedAt
```

Publicar no debe requerir GitHub, otra web ni tocar código.

---

# 9. ORDEN DE EJECUCIÓN OFICIAL

## Fase 0 — Optional Modules + Spanish Defaults

- [x] Location.
- [x] Social.
- [x] WhatsApp.
- [x] integración Studio / Project State.
- [x] español público por defecto.
- [x] human visual validation.

**CERRADA.**

---

## Fase 1A — Unified Product Detail

- [x] contrato compartido.
- [x] seis motores compartidos.
- [x] Dish Stage adapter.
- [x] Cinematic Product Rail adapter.
- [x] Pizza adapter.
- [x] Studio ON/OFF/campos.
- [x] persistencia.
- [x] human visual validation.

**CERRADA.**

---

## Fase 1B — In-App Experience Consolidation

- [x] Circular dentro del mismo app shell.
- [x] Dish Stage dentro del mismo app shell.
- [x] Product Rail dentro del mismo app shell.
- [x] mismo Project State.
- [x] misma Media.
- [x] lifecycle limpio.
- [x] no nuevas pestañas / no flujo operativo LAB.
- [x] preservar LABs como evidencia.
- [x] human visual validation.

**CERRADA.**

---

## Fase 1C — Consolidation Gate

**CERRADA Y MERGEADA.**

- [x] once motion capabilities elegibles desde un solo Studio.
- [x] Unified Product Detail ON/OFF con Pizza conservando su modelo.
- [x] Location + Social + WhatsApp configurables desde el mismo Studio.
- [x] runtime productivo fuera de `/labs/` (`experiences/`), sin duplicar motor.
- [x] un solo Project State y un solo modelo de media.
- [x] guard de DOM: ninguna acción productiva interna sale a `/labs/` ni a otra pestaña.
- [x] catálogo de once intacto: nada añadido, quitado, renumerado ni rediseñado.
- [x] limpieza acotada de copy estático, sin i18n ni dataset traducido.
- [x] human visual validation.

Debe demostrarse:

```text
11 MOTION CAPABILITIES
+
UNIFIED PRODUCT DETAIL
+
LOCATION
+
SOCIAL
+
WHATSAPP
        ↓
UNA SOLA APP
UN SOLO STUDIO
UN SOLO PROYECTO
```

---

## Fase 2 — Memories

**READY FOR HUMAN VISUAL REVIEW — MERGED: NO.**

- [x] diseño desktop.
- [x] modelo de datos en `modules.memories` (un dominio, `type` como dato).
- [x] Studio UX dentro del Studio existente: ON/OFF, preset, items, campos, media,
      reorden accesible, preview inmediato.
- [x] imagen **y** vídeo, con ciclo de vida de vídeo real.
- [x] Media Engine compartido: `RestaurantMedia` + `RestaurantMediaPicker`, un solo
      almacén, referencias lógicas en el Project State.
- [x] Project State, autosave, Undo/Redo e import/export existentes; sin history propia.
- [x] flagship Cinematic Memory Wall.
- [x] Memory Stack y Editorial Journal sobre el MISMO motor y los MISMOS datos.
- [x] public responsive (smoke real a 390 px).
- [ ] human visual validation.

Pendiente declarado, no olvidado: la media local **no** viaja entre ordenadores (el
export lleva las referencias, no los bytes) y los *optional material artifacts* quedan
como polish posterior.

**Mobile Studio polish: no bloquea esta fase; arquitectura mobile-ready sí es obligatoria.**

---

## Fase 3 — Beverages

1. diseño Beverage Cellar;
2. motion board;
3. modelo Beverage Domain;
4. Studio UX;
5. imagen + vídeo;
6. Media Engine;
7. Project State;
8. presets derivados sólo cuando reutilicen el mismo dominio;
9. public responsive;
10. human visual validation.

**Mobile Studio polish: no bloquea esta fase; arquitectura mobile-ready sí es obligatoria.**

---

## Fase 4 — Project Model Final

- [ ] congelar schema de proyecto;
- [ ] versionado/migraciones;
- [ ] media references consistentes;
- [ ] módulos y section experiences serializables;
- [ ] import/export compatible;
- [ ] ninguna feature con store paralelo.

---

## Fase 5 — Platform Layer / Cross-Computer

- [ ] Auth / accounts.
- [ ] Projects dashboard.
- [ ] Cloud Project State.
- [ ] Cloud Media Library.
- [ ] autosave remoto.
- [ ] sync PC A ↔ PC B.
- [ ] conflicts/version.
- [ ] duplicate/new project.
- [ ] drafts privados.

**Gate:** PC A → PC B sin export/import manual.

---

## Fase 6 — Preview / Publish

- [ ] preview del draft.
- [ ] published snapshot.
- [ ] publish/unpublish.
- [ ] versionado básico.
- [ ] publicación desde Studio.

---

## Fase 7 — Hardening V1

- [ ] web pública responsive móvil/tablet/desktop.
- [ ] Studio desktop/laptop robusto.
- [ ] accessibility.
- [ ] reduced motion.
- [ ] performance budgets.
- [ ] desktop cross-browser QA.
- [ ] SEO / structured data.
- [ ] security / permissions.
- [ ] adapter contracts externos.

**No bloquear V1 por paridad móvil completa del Studio.**

---

## Fase 8 — Product Proof V1

Crear un segundo restaurante completamente diferente usando sólo Studio:

```text
NEW PROJECT
→ brand
→ content
→ media
→ menu
→ motion
→ product detail
→ modules
→ memories
→ beverages
→ preview
→ publish
```

Prueba cross-computer:

```text
PC A
→ editar
→ subir media
→ guardar

PC B
→ login
→ mismo proyecto
→ misma media
→ continuar
→ publicar
```

Si funciona sin tocar código, copiar repo o abrir LABs, V1 queda demostrado.

---

## Fase 9 — Mobile Studio Completion (POST-V1, COMPROMETIDA)

Esta fase está **diferida, no cancelada**.

- [ ] navegación touch.
- [ ] reflow de paneles.
- [ ] inputs cómodos en móvil.
- [ ] reorder táctil.
- [ ] upload cámara/galería.
- [ ] safe areas.
- [ ] teclado móvil.
- [ ] viewport preview.
- [ ] nested scroll QA.
- [ ] dispositivo físico.

Gate futuro:

```text
PHONE
→ EDIT / UPLOAD / SAVE

DESKTOP
→ SAME PROJECT / CONTINUE
```

---

# 10. REGLAS DE ACEPTACIÓN

Para features actuales:

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

Desde Platform Layer:

```text
CROSS-COMPUTER PASS
+
PERSISTENCE PASS
+
PUBLISH PASS
```

son obligatorios para V1.

En la fase Mobile Studio se añadirá:

```text
MOBILE EDITING PASS
+
PHONE → DESKTOP PASS
```

Una capacidad no está cerrada si sólo funciona en un LAB. En V1 una feature sí puede estar cerrada aunque el Studio no tenga paridad móvil completa, siempre que:

1. el sitio público sea responsive;
2. el dominio/state/media no bloquee el móvil futuro;
3. el Studio desktop sea productivo;
4. el proyecto sea recuperable desde cualquier ordenador.

---

# 11. DEFINICIÓN DE V1 TERMINADO

V1 está listo cuando una persona puede:

1. entrar desde cualquier ordenador moderno;
2. autenticarse;
3. crear o abrir un restaurante;
4. personalizarlo desde el mismo Studio;
5. gestionar imagen y vídeo;
6. editar menú/productos;
7. elegir Motion y Product Detail;
8. configurar módulos;
9. configurar Memories;
10. configurar Beverages;
11. guardar automáticamente en remoto;
12. abrir el mismo proyecto en otro ordenador con el mismo estado/media;
13. previsualizar;
14. publicar;
15. crear un segundo restaurante sin tocar código.

No debe necesitar:

- conocer GitHub;
- cambiar de rama;
- abrir un LAB;
- copiar un repositorio;
- exportar/importar manualmente para cambiar de ordenador;
- tocar HTML/JS/CSS.

**La edición móvil completa del Studio no forma parte de esta definición V1, pero sí permanece como Fase 9 obligatoria de evolución del producto.**

---

# 12. DECISION RULE

Ante una propuesta nueva:

```text
¿Acelera V1 sin fragmentar el producto ni bloquear el móvil futuro?
```

- sí → implementar;
- no → rechazar o rediseñar;
- si el coste es sólo polish móvil → diferir;
- si el atajo crea deuda estructural en Project State, Media o dominio → no aceptarlo.