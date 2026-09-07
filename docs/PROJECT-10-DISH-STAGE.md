# PROJECT 10 — DISH STAGE

## Status

`LAB ISOLATED — HUMAN VISUAL REVIEW REQUIRED — DO NOT MERGE`

Branch: `feat/dish-stage-lab`

Baseline: `main@05660ef876422e554a5d5f4d90619e8ca0e24c4f`

This branch is intentionally parallel to `feat/pizza-slice-orbit-premium` and does not touch the Pizza Slice Orbit premium work.

## Mission

Build the original Project 04 from `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md`:

> Clean stage + hero product + spatial continuity.

The result must feel like gastronomic staging, never like a slideshow or conventional card carousel.

## Parallel-safety boundary

This branch does **not** modify:

- `app-v4.js`
- `class4-runtime-guard.js`
- `class5-studio-motion.js`
- `class11-pizza-slice-orbit.js`
- `styles-v11.css`
- `index.html`

No Studio registration or production runtime integration happens until Project 07 Premium is human-approved and merged.

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

During later production integration, this proof must be replaced by/reconnected to the existing Class 06 immersive detail rather than shipping a second detail system.

## Responsive

Desktop: editorial copy left + large hero stage right.

Mobile: hero first, story below, vertical incoming/outgoing trajectory, compact copy and controls.

## Reduced motion

Reduced motion keeps navigation and detail functional, resolves steps immediately and removes non-essential flourish.

## Human review gates

Approve only if:

1. It immediately reads as a product stage, not another Orbital/Depth Carousel.
2. Slow drag proves physical coexistence of outgoing and incoming products.
3. Release/snap feels controlled and premium.
4. 01→02→03→04 proves the choreography works across the collection.
5. Copy, ingredients, price, word and world always match the visible hero.
6. Mobile keeps the idea rather than shrinking desktop.

## Integration after Project 07 Premium

If human-approved while Claude is still working, freeze this branch and wait.

After Project 07 Premium is merged:

1. update/rebase this branch onto the new `main`;
2. run regressions;
3. register `Dish Stage` in Studio/runtime using the existing Motion Engine pattern;
4. reconnect HERO click to Class 06 detail;
5. perform a short final human validation;
6. merge only after explicit Juanma approval.
