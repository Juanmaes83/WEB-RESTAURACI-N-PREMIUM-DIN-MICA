# PROJECT 11 — CINEMATIC PRODUCT RAIL

## Status

`ISOLATED LAB — READY FOR HUMAN VISUAL REVIEW — DO NOT MERGE`

Branch: `feat/cinematic-product-rail-lab`

Baseline: `main@de42b038dfa0567e0344e7ca23991905c596a4ed`

This work runs in parallel with Project 09 Scroll Traveler. To avoid namespace collision with Claude's likely next class, Product Rail uses **Class 15**.

## Mission

Build the final pending product-navigation motor from the motion roadmap:

> previous / HERO / next visible, the whole collection moves as one physical rail, copy and world remain synchronized with the centre, and the result must never feel like a conventional Swiper/cards carousel.

## Parallel-safety boundary

This LAB adds only new Project 11 files and one dedicated workflow. It does **not** modify shared Studio/runtime, Project 09, Pizza Slice Orbit, Circular Dish Rotator or Dish Stage files.

Studio/runtime integration waits until Project 09 is closed and merged.

## Source of truth

The LAB reads `window.RestaurantDefaults.dishes` from current `class4-config.js`.

It does not duplicate the restaurant menu. Hero assets use:

1. `dish.depthCarousel.asset`
2. fallback `dish.image`

Copy uses current name, meta, short, ingredients, price, origin, technique and pairing.

## Canonical state

Exactly one continuous scalar owns rail position:

```js
railProgress
```

Everything derives from it:

```text
railProgress
→ signed wrapped distance for every product
→ x / y / scale / rotation / opacity / filter / z
→ activeIndex = round(railProgress)
→ copy / ingredients / price / world / detail
```

`lastRenderedIndex` is only a DOM-render cache and is never product state.

## Interaction grammar

All inputs converge on the same progress:

- Previous / Next
- ArrowLeft / ArrowRight
- horizontal drag
- touch swipe
- wheel while focused/over the rail
- direct product click

Pointer drag is genuinely fractional: the collection follows the gesture before release.

Release uses measured progress velocity, restrained momentum and snap. A single drag is capped to the current or adjacent product so Product Rail stays controlled and editorial rather than roulette-like.

## Spatial hierarchy

The centre is canonical HERO.

Neighbor products remain visible as contextual collection members:

- HERO: scale 1.00, highest light/contrast/z
- ±1: scale ~0.72, still clearly readable
- ±2: scale ~0.48, contextual depth
- farther: low-opacity atmosphere only

The entire collection changes continuously with `railProgress`; products do not teleport between slots.

## Story and world sync

The nearest canonical HERO controls:

- title
- meta/kicker
- short story
- ingredients
- price
- giant background word
- detail modal data

The chromatic world interpolates continuously between adjacent dishes while progress is fractional using existing dish accent/background metadata.

## Detail

The LAB includes a small isolated proof modal fed by the same active dish data.

During final Studio/runtime integration, HERO/Explore must reconnect to the existing Class 06 immersive detail system instead of shipping a second permanent detail implementation.

## Responsive

Desktop: editorial story left + large collection rail right.

Tablet/mobile: story stacks above a dedicated shorter rail; product assets remain large enough to preserve the collection idea and horizontal overflow is clipped by the rail viewport rather than the page.

## Reduced motion

Navigation remains fully functional; long easing/copy flourish is removed and targets resolve immediately.

## Human review gates

Approve only if:

1. it reads immediately as a premium collection rail, not cards or Swiper;
2. previous / HERO / next are clearly readable at rest;
3. slow drag proves the complete collection follows fractional progress;
4. 50% drag creates a convincing handoff, not a crossfade;
5. release/snap feels controlled and premium;
6. 01→02→03→04 proves the grammar works across the collection;
7. background/copy always correspond to the centre result;
8. mobile preserves the rail idea.

## Integration after Project 09

After Scroll Traveler is human-approved and merged:

1. update this branch against the new `main`;
2. rerun contract/regression checks;
3. integrate `Cinematic Product Rail` into Studio → Product Motion;
4. reconnect Explore/HERO to existing Class 06 detail;
5. perform a short final human validation;
6. merge only after explicit Juanma approval.
