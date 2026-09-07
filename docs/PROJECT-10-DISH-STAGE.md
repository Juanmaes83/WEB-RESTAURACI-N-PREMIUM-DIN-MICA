# PROJECT 10 — DISH STAGE

## Status

`HUMAN VISUAL APPROVED — READY TO MERGE`

Branch: `feat/dish-stage-lab`

Visual approval: Juanma, 2026-09-07.

Approved HEAD: `b42512e4dde0c9e51a270d3f90731dfc02fb52ea`

Baseline used for isolated implementation: `main@05660ef876422e554a5d5f4d90619e8ca0e24c4f`.

Project 07 Premium was developed in parallel and has since been approved and merged into main. Dish Stage remains Class 13 so it does not collide with Pizza Premium Class 12.

## Mission

Build the original Project 04 from `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md`:

> Clean stage + hero product + spatial continuity.

The result must feel like gastronomic staging, never like a slideshow or conventional card carousel.

## Source of truth

The LAB loads `class4-config.js` read-only and uses `window.RestaurantDefaults.dishes`.

Dish Stage does not create a second product catalog. Per-dish presentation is derived from existing reusable metadata:

- `depthCarousel.asset` → hero visual, fallback to `dish.image`
- `depthCarousel.word` → background word
- `depthCarousel.accent` → accent
- `depthCarousel.backgroundColor` → chromatic world
- existing `name`, `meta`, `short`, `ingredients`, `price`, `origin`, `technique`, `pairing` → copy/detail

An optional future `dish.dishStage` object may override presentation without duplicating product truth.

## Canonical motion state

There is one canonical scalar:

```js
position
```

Everything derives from it:

```text
position
→ continuousDistance(product)
→ trajectory
→ x / y / scale / rotation / opacity / blur / z
→ activeIndex = round(position)
→ copy / price / ingredients / word / chromatic world
```

`lastRenderedIndex` is only a DOM-render cache and never product state.

## Choreography

### REST
One product dominates the stage.

### DEPARTURE
The outgoing product moves down/left on desktop, loses scale and tone.

### CROSSOVER
The incoming product is already visible from the upper/right trajectory while the outgoing product remains visible. Both coexist physically.

### ARRIVAL
Incoming product reaches zero rotation, maximum scale/clarity and receives a contained settle pulse.

Mobile uses a dedicated vertical grammar: incoming from above, outgoing below.

## Interaction ownership

All inputs converge on the same position:

- Previous / Next
- ArrowLeft / ArrowRight
- wheel
- direct fractional pointer drag
- touch swipe
- restrained release momentum

A single drag is intentionally limited to the current or adjacent product. Dish Stage is controlled staging, not a roulette.

## Product storytelling

The active product controls:

- overline / index
- metadata
- large name
- short description
- ingredients
- price
- giant background word
- accent
- chromatic world
- detail content

Chromatic world interpolates continuously while `position` is fractional.

## Detail

The LAB includes an isolated detail proof fed by the same derived active dish. It demonstrates the product contract only.

During later production integration, this proof should reconnect to the existing Class 06 immersive detail rather than shipping a second product truth.

## Responsive

Desktop: editorial copy left + large hero stage right.

Mobile: hero first, story below, vertical incoming/outgoing trajectory, compact copy and controls.

## Reduced motion

Reduced motion keeps navigation and detail functional, resolves steps immediately and removes non-essential flourish.

## Visual-review repair

The first human screenshot exposed broken product images because repo-root paths such as `assets/depth-carousel/dish-01-food.webp` were resolving relative to the nested LAB folder.

Fixed with `<base href="../../">` so CSS, JS and product assets resolve from repository root. The contract suite guards this behavior.

## Human approval

After the asset-path repair, Juanma performed the human visual review and explicitly approved Dish Stage for merge.

The capability is therefore approved. Shared Studio/runtime registration can be completed additively from the current unified main without deleting or replacing any existing motor.
