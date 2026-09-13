# Motion 15 — Three Native Product Engines

Status: **IMPLEMENTED IN FEATURE BRANCH · AUTOMATED GATE + HUMAN VISUAL REVIEW REQUIRED**

Branch: `feat/three-native-product-engines`

## Product contract

This change is additive. The existing Motion catalogue is not reduced or reclassified.

Before:

- 8 Product Engines / product choreographies
- 1 transversal Page Motion
- 3 full-page Experiences
- **12 Motion elements total**

After:

- 11 Product Engines / product choreographies
- 1 transversal Page Motion
- 3 full-page Experiences
- **15 Motion elements total**

The three original Experiences remain unchanged and continue to open through the in-app Experience Shell:

1. Circular Dish Rotator
2. Dish Stage
3. Cinematic Product Rail

Three new native Product Engines are added to the normal Motion selector:

13. `circular-product` — Circular Dish Rotator · Engine
14. `dish-stage-product` — Dish Stage · Engine
15. `cinematic-rail-product` — Cinematic Product Rail · Engine

## Architecture

The new Product Engines are native siblings inspired by the approved Experiences. They are not iframes and they do not replace, delete or rewrite the original Experiences.

They share the existing platform contracts:

- one Restaurant Studio;
- one Project State;
- `dishes[]` as the canonical product collection;
- the shared Media/product data already resolved by the public website;
- the shared Product Detail;
- the existing Signature section as the host surface.

Only the product choreography inside Signature changes. Hero, Story, Origin, Atmosphere, Chef, Reservation, Visit, footer and the rest of the website remain the same.

## Runtime and performance contract

The three selector values exist before Project State hydration so a saved project can restore them normally.

The shared native runtime and stylesheet are lazy-loaded only when one of the three new Product Engines becomes active. With Elegant, Urban, Half Orbit or another existing engine selected, the new runtime is not requested.

When a native engine is OFF its host is hidden and inert; it must not retain visible UI or an animation loop.

## Mobile interaction contract

The engines follow the Mobile First checkpoint rules:

- vertical touch intent belongs to page scroll;
- horizontal intent must cross a threshold before the engine captures the gesture;
- controls remain reachable and at least 48px where functional;
- no global horizontal-overflow masking.

## Acceptance gate

Before merge, automated review must prove:

- Motion Library count = 15;
- 11 presets/Product Engines + 1 Page Motion + 3 Experiences;
- all three new engine values are selectable through the real Motion control;
- native runtime remains lazy before first native selection;
- Circular Product, Dish Stage Product and Cinematic Rail Product mount and switch products;
- shared Product Detail opens from all three;
- switching back to Elegant produces true OFF;
- the three original Experiences still open through Class 22;
- desktop 1440×960, mobile 390×844 and landscape 844×390 have no horizontal page overflow;
- no page errors or failed same-origin resources.

## Human visual review

Do **not merge** until a human has reviewed the branch deployment and explicitly approved:

`Elegant → Circular Product → Dish Stage Product → Cinematic Rail Product → Half Orbit`

Then separately confirm that the three original Experience cards still open as Experiences.

PR #38 and PR #39 are outside this change and must remain untouched.
