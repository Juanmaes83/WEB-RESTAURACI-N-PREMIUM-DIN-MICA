# Motion 16 — Circular Product Engines

**Estado:** APROBADO + MERGED  
**Fecha:** 2026-09-14  
**PR:** #43  
**Merge commit:** `5c25f346e96e3ced24d3de01ffae48c3473c1457`

## Decisión canónica

Los dos motores circulares son productos distintos y deben coexistir en Restaurant Studio. **Ninguno sustituye al otro.**

- `circular-product` → **Full Pizza Rotator · Engine**
- `circular-radial-product` → **Circular Dish Rotator · Radial**

La Experience completa **Circular Dish Rotator** también se conserva de forma independiente en `experiences/circular-dish-rotator/index.html`.

## Inventario Motion

Tras Motion 16, la biblioteca contiene **16 elementos Motion**:

- **12 Product Engines / coreografías de producto**
- **1 Page Motion transversal**
- **3 Experiences completas**

Los módulos de negocio (Location / Google Maps, Social / Reputation y WhatsApp Contact) no forman parte de este recuento.

## Full Pizza Rotator · Engine

**Selector:** `circular-product`

Motor nativo integrado en la sección Signature. Utiliza una pizza completa horneada formada por ocho sectores y mantiene el selector fijo mientras rota la composición.

Contrato:

- usa el dominio existente `pizzaSliceOrbit.products`;
- asset canónico: `assets/pizza-motion/runtime/full-pizza/full-pizza.png`;
- exactamente 8 sectores de 45°;
- porción activa elevada/recortada sobre la pizza completa;
- navegación anterior/siguiente;
- acción Discover con giro de varias vueltas;
- drag circular directo sobre la pizza;
- copy sincronizado con la porción activa;
- no crea Store, Project State, Media Library ni aplicación paralelos.

## Circular Dish Rotator · Radial

**Selector:** `circular-radial-product`

Es la recuperación del primer motor nativo radial desarrollado antes de incorporar Full Pizza. Se conserva como motor independiente porque responde a una gramática visual distinta.

Contrato:

- utiliza la colección canónica `dishes[]`;
- plato hero en el centro;
- nombres/productos distribuidos en órbita alrededor del centro;
- producto activo sincronizado con copy, imagen y estado;
- navegación mediante flechas;
- drag horizontal con snap;
- abre el detalle de producto existente;
- comparte el mismo Studio y el mismo Project State que el resto de motores.

## Circular Dish Rotator — Experience completa

La Experience original permanece separada de los Product Engines nativos:

`experiences/circular-dish-rotator/index.html`

No debe convertirse en preset ni eliminarse al evolucionar los motores nativos.

## Contrato de arquitectura

Motion 16 mantiene las reglas estructurales del producto:

- **un Restaurant Studio**;
- **un Project State**;
- **una Media Library**;
- sin segundo Store;
- sin segunda aplicación;
- los Product Engines nativos cambian únicamente la presentación de producto de Signature mientras están activos;
- volver a una coreografía no nativa debe producir **true OFF** del runtime nativo;
- las Experiences completas siguen siendo experiencias independientes y se abren mediante el Experience Shell existente.

## Validación y aprobación

La integración fue aprobada mediante revisión visual humana el **14 de septiembre de 2026** antes del merge.

Validaciones específicas previas al merge:

- Native Product Engines gate — **PASS**
- Motion Library regression — **PASS**
- Half Orbit regression — **PASS**

PR #43 fue mergeado a `main` mediante el commit `5c25f346e96e3ced24d3de01ffae48c3473c1457`.

## Gobernanza para cambios futuros

El desarrollo de motores circulares debe ser **aditivo**:

1. no reutilizar `circular-product` para sustituir al motor Radial;
2. no eliminar ni reconvertir `circular-radial-product` cuando evolucione Full Pizza;
3. no eliminar la Experience completa Circular Dish Rotator;
4. cualquier nuevo motor debe añadirse como opción independiente cuando su gramática de interacción o presentación sea distinta;
5. mantener un único Studio / Project State / Media Library.

## Follow-up conocido — fuera del merge #43

Existe un defecto visual de interacción pendiente en **Full Pizza Rotator**: durante determinadas operaciones de drag el navegador puede mostrar selección/highlight azul sobre la porción y/o el fondo.

Este defecto **no forma parte del alcance aprobado de PR #43** y se resolverá en un cambio posterior, preservando exactamente la arquitectura y los dos motores aprobados. La corrección deberá impedir selección y drag nativos del navegador sin alterar el drag propio del motor ni su diseño visual.
