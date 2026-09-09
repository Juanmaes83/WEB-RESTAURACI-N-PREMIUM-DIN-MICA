# Class 24 — Half Orbit Selector

## Objetivo

Añadir un duodécimo motor Motion visualmente distinto: un **selector de media circunferencia** con el producto protagonista en el centro, nombres flotando sobre el arco y un barrido visual de **180° por selección**.

## Contrato

- `MODE = half-orbit` dentro del selector Motion existente.
- Un único `progress` continuo en runtime; el índice activo se deriva de `Math.round(progress)`.
- Drag horizontal, flechas, teclado y click en nombres convergen en el mismo progreso.
- La rueda **no** cambia producto ni secuestra el scroll de página.
- Cada paso mueve el arco de etiquetas y hace girar el sweep visual exactamente 180°.
- Al confirmar selección: cambia el mundo/fondo, entra el nuevo producto y el titular se eleva.
- Reduced Motion conserva la composición y reduce las transiciones.

## Dos dominios, cero duplicación

### Platos

Lee `RestaurantOrbit.getDishes()`: son los mismos platos activos del Project State. Para la media usa el `src` ya resuelto por el `#orbit-stage`, por lo que una imagen local sustituida en el Studio también llega al Half Orbit sin una segunda Media Library.

### Pizzas

Lee `RestaurantStudioConfig.get('pizzaSliceOrbit').products` y une por `id` con `assets/pizza-motion/slices-manifest.json`. El manifest aporta la media runtime; el Project State aporta nombre, descriptor, ingredientes, color y mundo. No se inventan precios.

La fuente se persiste en `motion.halfOrbitSource = dishes | pizzas` usando `RestaurantStudioConfig.set`.

## Integración Studio

Class 19 registra el motor número 12 en la biblioteca. Class 24 añade una única tarjeta de personalización al panel Motion para elegir **Platos** o **Pizzas**, activar y previsualizar. No existe otro Studio ni otro store.

## Review determinista

- `?review=half-orbit` → platos.
- `?review=half-orbit&source=pizzas` → pizzas.

El review usa el mismo motor productivo y los datos/assets ya versionados. No inyecta estado, no escribe el Project State y no depende de Playwright.

## Gate humano

No mergear hasta revisión visual de Juanma. El gate técnico mínimo está en `tests/class24-half-orbit-selector-e2e.mjs` y audita ambas fuentes, 180°, drag continuo, snap, scroll no secuestrado y smoke 390px.
