# PROJECT 06 — CIRCULAR DISH ROTATOR / FULL PIZZA WHEEL

## Status

**ISOLATED LAB / IN DEVELOPMENT — V2 SPECTACLE PASS**

Branch: `feat/circular-dish-rotator-lab`

This project is deliberately developed in isolation while Project 07 — Pizza Slice Orbit / Hero Selector is being implemented in parallel by Claude Code. The isolated LAB does not modify shared Studio, runtime-guard, app state, global workflow, or the existing Motion presets.

## Product distinction

Project 06 and Project 07 are different engines.

### Project 06 — this document

One **complete circular product** rotates as one physical object around its own centre.

Current proof asset:

`assets/pizza-motion/source/full-pizza/PIZZA COMPLETA DE 8 TROZOS.png`

The pizza is one image. Eight 45° sectors are interpreted as selectable states.

```text
          FIXED SELECTOR
                ↓
        ┌───────────────┐
        │   FULL DISC   │
        │      ↻        │
        │   ONE IMAGE   │
        └───────────────┘
```

The same engine is intended to work later with other circular restaurant products: top-down dishes, tarts, bowls, tasting boards, cakes or other radial compositions.

### Project 07 — not this engine

Eight independent pizza-slice assets move around an orbit and one arrives in a fixed hero station. Project 07 must not be implemented by reusing the full-pizza wheel as a shortcut.

## Canonical state

Project 06 owns one continuous variable only:

`rotationProgress`

Rules:

- `1.0 progress = 45°`
- `8.0 progress = 360°`
- active sector = `round(rotationProgress) mod 8`
- visual rotation = `BASE_OFFSET - rotationProgress * 45°`

Everything derives from this value. There is no second active index, no second drag progress and no second spin progress representing product selection.

## Source-sector order

The current full pizza is interpreted clockwise from the top-right sector:

1. Diavola
2. Prosciutto Funghi
3. 4 Quesos
4. Mortadela y Pistacho
5. Carbonara
6. Barbacoa
7. Verduras
8. Margarita

`BASE_OFFSET_DEG = -22.5` centres the first 45° sector under the fixed selector at the top of the composition.

If a future circular asset starts at another physical angle, this offset must become data rather than a motor rewrite.

## Interactions implemented in the isolated LAB

### Direct circular drag

The pointer angle around the physical centre is measured with `atan2()`.

The user's angular gesture directly changes `rotationProgress`.

This means:

**gesture = rotation progress**

The product does not wait until pointer release before moving.

The V2 pass also allows one gesture to cross the ±180° boundary repeatedly because per-frame angular deltas are accumulated instead of reading one start/end angle only.

### Momentum + snap

A slow release projects a short amount of angular momentum and snaps to the nearest 45° sector.

A fast release becomes a **flick**: the release velocity projects several sectors and can produce multiple turns before the same canonical snap.

There is still one source of truth: `rotationProgress`.

### Step navigation

- Previous = `progress - 1`
- Next = `progress + 1`
- ArrowLeft / ArrowRight use the same path.

### Discover / Fortune-wheel mode

`Discover` chooses one of the eight products, adds multiple complete turns, reaches visible rotational speed, then performs a long deceleration to the exact target sector.

The default V2 spin travels four to six complete turns plus the final target distance. A deterministic target/turn override remains available for testing.

Every 45° crossover produces a short pointer/selector tick, so the wheel communicates physical sector crossings rather than looking like one continuous texture rotation.

It is a product-discovery interaction, not a gambling mechanic.

Reduced-motion skips the long travel while preserving the resulting selection.

## Fixed selector

The selection geometry is independent from the rotating product.

A fixed SVG wedge covers exactly one eighth of the circular stage. It does not rotate. The circular product moves underneath it.

This is a key invariant:

**THE FRAME STAYS. THE DISC MOVES.**

## V2 spectacle layer

The first human visual review approved the base concept but requested more editorial impact. V2 adds four additive improvements without replacing the engine.

### 1. Selected product drives the headline

The active pizza is no longer only a small label below generic copy.

The selected name now drives:

- the large editorial headline (`I'm tempted by …`);
- the selection rail;
- the large low-contrast background word behind the rotating product;
- the accessibility announcement after a settled selection.

Crossing into a new sector triggers a short blur/translate copy handoff. Final snap triggers a stronger headline settle.

### 2. Active sector becomes a hero slice

Project 06 still uses one complete pizza asset. It does **not** switch to Project 07's independent slice assets.

A second synchronized copy of the same full-pizza image is clipped by the fixed 45° hero wedge. Because both the base image and this overlay use the same rotation transform, they can never represent different selection states.

During motion the overlay reduces prominence. At final snap it receives:

- a controlled upward lift;
- slight scale gain;
- brightness / saturation emphasis;
- stronger local shadow and light;
- selector flash.

This makes the chosen portion visually emerge from the whole pizza while preserving the one-disc architecture.

### 3. Physical wheel feedback

A fixed pointer lives above the selector. Every sector crossover produces a short pointer kick and selector pulse.

The wheel therefore reads as an indexed physical object rather than a decorative spinning image.

### 4. Drag + flick

The same direct circular drag remains available on desktop and touch. Slow release settles locally. Fast release converts real pointer angular velocity into a longer physical throw.

No alternate selection state is introduced for flick or Discover.

## Current isolated implementation

- `labs/project06-circular-dish-rotator/index.html`
- `labs/project06-circular-dish-rotator/project06-circular-dish-rotator.css`
- `labs/project06-circular-dish-rotator/project06-circular-dish-rotator.js`
- `tests/project06-circular-dish-rotator-contract.mjs`

## Parallel-work safety

Until Project 07 finishes, Project 06 intentionally does **not** modify:

- `app-v4.js`
- `class4-config.js`
- `class4-runtime-guard.js`
- `class6-product.js`
- `.github/workflows/*`
- `tests/live-url-check.mjs`
- `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md`

That avoids branch collisions with Claude Code.

## Next integration phase

After Project 07 reaches human review / integration state:

1. update this branch from the then-current `main`;
2. resolve only integration deltas;
3. add `Circular Dish Rotator` to Studio as a new Motion preset;
4. connect product data rather than hardcoding demo copy;
5. extend the current Motion CI and live checks additively;
6. deploy the branch;
7. generate desktop/mobile screenshots and video;
8. request Juanma + ChatGPT human visual review;
9. do not merge until visually approved.

## Human approval criteria

Project 06 is not approved merely because the disc rotates.

It must satisfy all of these:

- the full circular product feels like one physical object;
- drag feels direct and circular;
- a fast flick creates believable momentum without breaking snap;
- every settled state lands exactly on 45°;
- the selector remains fixed;
- the selected 45° sector gains clear hero prominence without becoming a separate product engine;
- headline, large background type, counter and hero sector remain synchronized;
- Discover visibly travels through multiple turns, communicates sector ticks, decelerates and lands cleanly;
- mobile retains the physical-wheel feeling;
- no regression to Project 01, 02, 03 or Project 07.
