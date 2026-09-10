# Class 24 — Half Orbit Selector

## Objetivo

Añadir un duodécimo motor Motion visualmente distinto: un **selector de media circunferencia** con el producto protagonista en el centro, nombres flotando sobre el arco y un barrido visual de **180° por selección**.

## Contrato del motor

- `MODE = half-orbit` dentro del selector Motion existente.
- Un único `progress` continuo en runtime; el índice activo se deriva de `Math.round(progress)`.
- Drag horizontal, flechas, teclado y click en nombres convergen en el mismo progreso.
- Los controles interactivos no forman parte de la superficie de drag: flechas, nombres y CTA conservan su `pointerdown/click` y nunca son capturados por el stage.
- La rueda **no** cambia producto ni secuestra el scroll de página.
- Cada paso mueve el arco de etiquetas y hace girar el sweep visual exactamente 180°.
- Al confirmar selección: cambia el mundo/fondo, entra el nuevo producto y el titular se eleva.
- Reduced Motion conserva la composición y reduce las transiciones.
- Al abandonar el preset se desmontan los listeners de interacción del Half Orbit.

## Dos dominios, cero duplicación

### Platos

Lee `RestaurantOrbit.getDishes()`: son los mismos platos activos del Project State. Para la media usa el `src` ya resuelto por el `#orbit-stage`, por lo que una imagen local sustituida en el Studio también llega al Half Orbit sin una segunda Media Library. La firma de sincronización incluye nombre, meta, descripción, ingredientes, precio, imagen, acento y mundo; una edición sólo de copy también repinta el motor.

### Pizzas

Lee `RestaurantStudioConfig.get('pizzaSliceOrbit').products` y une por `id` con `assets/pizza-motion/slices-manifest.json`. El manifest aporta la media runtime; el Project State aporta nombre, descriptor, ingredientes, color y mundo. No se inventan precios.

La fuente se persiste en `motion.halfOrbitSource = dishes | pizzas` usando `RestaurantStudioConfig.set`.

## Motion Governance

Class 24 añade una capa de gobernanza de Studio, no otro motor. La regla visible del producto queda así:

1. **Motor de producto — elige uno**: ocho coreografías, Half Orbit incluida.
2. **Movimiento transversal — opcional**: Scroll Traveler, independiente del motor de producto.
3. **Experiencias completas**: se abren dentro de la aplicación.

`Scroll Traveler` es **OFF por defecto** en un proyecto nuevo/reset. Sus controles avanzados permanecen plegados mientras está OFF y se muestran al activarlo.

`capabilities.motionStudio` permite a una plantilla/restaurante ocultar por completo la autoría Motion avanzada cuando no la necesita. Ocultar el panel no modifica la coreografía pública ya seleccionada.

## Integración Studio

Class 19 registra el motor número 12 en la biblioteca. Class 24 añade una única tarjeta de personalización al panel Motion para elegir **Platos** o **Pizzas**, activar y previsualizar. No existe otro Studio ni otro store.

La biblioteca se reorganiza visualmente en Producto / Transversal / Experiencias para que Scroll Traveler no parezca competir con el motor principal.

## Review determinista

- `?review=half-orbit` → platos.
- `?review=half-orbit&source=pizzas` → pizzas.

El review usa el mismo motor productivo y los datos/assets ya versionados. No inyecta estado, no escribe el Project State y no depende de Playwright.

## Gates

- `tests/class24-half-orbit-selector-e2e.mjs`: motor, 180°, drag, snap, scroll y responsive.
- `tests/class24-interaction-governance-e2e.mjs`: eventos de puntero físicos sobre flechas/nombres/CTA, live sync, lifecycle, Scroll Traveler OFF/ON, agrupación visual y capability para ocultar Motion.
- `.github/workflows/class24-half-orbit.yml`: ejecuta ambos gates y los contratos estáticos directamente afectados.

## Gate humano

No mergear hasta revisión visual de Juanma. Un test verde no sustituye la comprobación de las flechas, el drag, el giro y la arquitectura visual del panel en el navegador real.
