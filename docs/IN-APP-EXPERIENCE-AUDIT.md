# IN-APP EXPERIENCE AUDIT — FASE 1B

Estado real de las tres experiencias autónomas, leído del código en `ebf6e8d` (main),
**antes** de escribir la shell. La conclusión cambia la estrategia por defecto: dos de
las tres ya consumen el proyecto, y la tercera trae su propio store.

---

## Tabla

| | **Circular Dish Rotator** (P06) | **Dish Stage** (Class 13) | **Cinematic Product Rail** (Class 15) |
|---|---|---|---|
| **CURRENT ENTRY** | `labs/project06-circular-dish-rotator/index.html` (`target="_blank"` desde Class 19) | `labs/project10-dish-stage/index.html` (idem) | `labs/project11-cinematic-product-rail/index.html` (idem) |
| **STATE SOURCE** | propio. 0 referencias a `RestaurantDefaults`, `RestaurantStudioConfig` o `RestaurantStore` | `window.RestaurantDefaults` — `dishes` (filtrados por `enabled`) y `brand.accent` | `window.RestaurantDefaults.dishes`; si no existe, **aborta** (`return` temprano) |
| **PRODUCT DATA** | array `PIZZAS[]` **hardcoded** en su propio motor (8 pizzas, con su geometría de sectores) | los platos del proyecto | los platos del proyecto |
| **MEDIA SOURCE** | sus propios assets + `SOURCE_WHEEL` relativo a su carpeta; assets subidos en **su** IndexedDB | `depthCarousel.asset` / imagen del plato | imagen del plato |
| **OWN STORE?** | **SÍ, dos**: `localStorage['cdr.project06.phase2.profile.v1']` (perfil de restaurante propio: `restaurantName`, `collectionLabel`, `brandAccent`) e `indexedDB 'cdr-project06-assets'` | no | no |
| **MOUNT MODEL** | IIFE al cargar; exige su propio DOM (`#cdr-*`) y su CSS de página completa; expone `CircularDishRotator` y `CircularDishPremium` (congelados). **Sin `destroy()`** | IIFE al cargar; exige `[data-ds-*]` y `.ds-lab` (página completa); expone `DishStageEngine` (con `openDetail`). **Sin `destroy()`** | IIFE al cargar; exige `#cpr-*`; expone `CinematicProductRail`. **Sin `destroy()`** |
| **DEPENDENCIAS** | su propio CSS ×2, su propio JS ×2; sin `<base href>` (assets relativos a su carpeta) | `class4-config.js`, `styles-v13.css`, GSAP; `<base href="../../">` | `styles-v15.css`; `<base href="../../">` |
| **rAF / timers / listeners** | 2 rAF · 4 timers · 8 listeners | 2 rAF · 15 listeners | 2 rAF · 13 listeners |
| **SAFE EMBED STRATEGY** | **iframe same-origin** | **iframe same-origin** | **iframe same-origin** |
| **RISKS** | trae un segundo store al producto; sus datos no son los del proyecto; su perfil de marca compite con `brand` | ninguno grave: ya lee el proyecto | aborta si el proyecto no le llega antes de arrancar |

## Por qué iframe, y no integración nativa

La misión pide no presuponerlo, así que la decisión sale de tres hechos medidos, no de
la comodidad:

1. **Ninguna de las tres tiene `destroy()`.** Instalan rAF, timers y listeners globales
   y no los desmontan. Embebidas en el mismo documento habría que **escribirles un
   ciclo de vida**, es decir, reescribir su motor — justo lo prohibido. Con un iframe,
   quitar el nodo destruye rAF, timers, listeners, canvas y audio sin tocar su código:
   el requisito 7 (open→close→open sin degradación) sale gratis y sin riesgo.
2. **Su CSS es de página completa.** `.ds-lab`, `.cpr-page` y el de P06 dan por hecho
   que son el documento. Inyectados en el Studio colisionarían con los estilos de la
   app; el iframe aísla sin editar una sola regla suya.
3. **P06 trae persistencia propia.** Dentro del mismo documento, su `localStorage` y su
   IndexedDB serían un segundo store del producto. En un iframe same-origin el padre
   puede **neutralizar sus escrituras** sin tocar su motor, y el lab sigue funcionando
   igual cuando se abre solo.

Y same-origin conserva lo que un iframe normalmente rompe: el padre puede escribir en el
`window` del hijo, así que el traspaso del proyecto es explícito y sincrónico, sin
`postMessage` asíncrono ni una segunda fuente de verdad.

Las obligaciones que la misión impone al iframe se cumplen todas: mismo origen, ningún
`target="_blank"`, la shell del padre sigue siendo la superficie de producto, cerrar
devuelve al Studio, traspaso explícito del Project State, el hijo no persiste nada, y el
`src` sólo se asigna al abrir (cerrada no hace ninguna petición).

## Traspaso del Project State

Los dos que leen `RestaurantDefaults` lo hacen **al arrancar**, así que el padre tiene
que dejar el proyecto en el hijo *antes* de que corra su motor. Same-origin lo permite
con un puente diminuto cargado por el lab **antes** de su propio script:

```
STUDIO (padre)  →  window.RestaurantExperienceShell.project()
                        ↓  (sincrónico, mismo origen)
LAB (hijo)      →  shell-bridge.js  →  window.RestaurantDefaults = proyecto activo
                        ↓
                   el motor arranca y lee lo que ya siempre leía
```

El puente **sólo actúa enmarcado por la shell**. Abierto directamente, el lab se comporta
exactamente como hoy — que es la condición para que siga sirviendo de regresión
(requisito 25).

## Qué hereda cada una, y qué no

| | hereda | no hereda (limitación documentada) |
|---|---|---|
| Dish Stage | `dishes` del proyecto (nombre, meta, precio, descripción, ingredientes, origen, técnica, maridaje, alérgenos, imagen) y `brand.accent` | — |
| Product Rail | `dishes` del proyecto y su imagen | — |
| Circular Dish Rotator | la **marca** del proyecto (nombre y acento) leída sin persistir | su carta: sus productos son 8 pizzas con la geometría de sectores de su propio motor. Mapear los platos del restaurante a esos sectores sería convertir el modelo o inventar datos. Queda para una fase posterior |

Su IndexedDB de assets propios sigue siendo suya y sólo se llena si alguien sube algo
desde su propio personalizador dentro de la shell; enmarcada, esa escritura se bloquea.
`restoreAssets()` ya envuelve cada lectura en `try/catch`, así que degrada sin ruido.

## Lo que NO se toca

Geometría, animaciones, easings, arrastre, autoplay y DOM interno de las tres. Motion
Engine, Scroll Traveler, los once motores de Class 19, Class 20 y Class 21. Los LABs se
conservan como evidencia y regresión: dejan de ser el punto de entrada del producto, no
desaparecen.
