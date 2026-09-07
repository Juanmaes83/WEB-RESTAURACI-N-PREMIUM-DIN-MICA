# PROJECT 06 — CIRCULAR DISH ROTATOR / FULL PIZZA WHEEL

## Status

**ISOLATED LAB / IN DEVELOPMENT**

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

Everything derives from this value. There is no second active index, no second drag state and no second spin state representing product selection.

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

### Momentum + snap

Pointer velocity is projected conservatively on release. The resulting progress is snapped to the nearest integer, therefore always to a 45° sector.

### Step navigation

- Previous = `progress - 1`
- Next = `progress + 1`
- ArrowLeft / ArrowRight use the same path.

### Discover

`Discover` chooses one of the eight products, adds multiple complete turns, then decelerates to the exact target sector.

It is a product-discovery interaction, not a gambling mechanic.

Reduced-motion skips the long travel while preserving the resulting selection.

## Fixed selector

The selection geometry is independent from the rotating product.

A fixed SVG wedge covers exactly one eighth of the circular stage. It does not rotate. The circular product moves underneath it.

This is a key invariant:

**THE FRAME STAYS. THE DISC MOVES.**

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
- every settled state lands exactly on 45°;
- the selector remains fixed;
- sector/copy selection never diverges;
- Discover visibly travels, decelerates and lands cleanly;
- mobile retains the physical-wheel feeling;
- no regression to Project 01, 02, 03 or Project 07.
