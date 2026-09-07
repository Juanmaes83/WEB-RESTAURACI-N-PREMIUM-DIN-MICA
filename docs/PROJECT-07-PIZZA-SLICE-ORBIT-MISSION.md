# PROJECT 07 — PIZZA SLICE ORBIT / HERO SELECTOR

## Mission for Claude Code

Repository: `Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA`

This is an additive Restaurant Motion Engine project. It does **not** replace Project 03 — Orbital Food Slider, Project 04 — Dish Stage, or Project 05 — Cinematic Product Rail.

The original five-project roadmap remains intact. Two pizza-specific motion extensions are added after it:

- **Project 06 — Circular Dish Rotator / Full Pizza Wheel** — the easy line, based on one complete circular pizza image rotating as a single object. This is handled separately by ChatGPT/GitHub. **Do not implement it here.**
- **Project 07 — Pizza Slice Orbit / Hero Selector** — the hard line, based on eight independent pizza-slice assets moving as a radial/orbital product system with a fixed hero selection station. **This is your mission.**

The distinction is mandatory. If the implementation turns into a full pizza wheel, the project has failed.

---

## 0. Baseline gate

Before touching code:

```bash
git fetch origin --prune
git checkout main
git pull origin main
```

Record the real main HEAD.

Main already contains:

- Project 01 — Depth Carousel;
- Project 02 — Anchor Scenes;
- Project 03 — Orbital Food Slider;
- the source pizza assets under `assets/pizza-motion/source/`.

Create a new branch from the updated main:

```bash
git checkout -b feat/pizza-slice-orbit-lab
```

Do not work from the old Project 03 feature branch. Do not merge when finished.

---

## 1. Read before coding

Read the current repository, not remembered assumptions:

- `README.md`
- `docs/VIDEO-AUDIT-05-MOTION-PROJECTS.md`
- `docs/PROJECT-03-ORBITAL-FOOD-SLIDER.md`
- `docs/PROJECT-03-ORBITAL-FOOD-SLIDER-MISSION.md`
- `class10-orbital-food.js`
- `styles-v10.css`
- `app-v4.js`
- `class4-config.js`
- `class4-runtime-guard.js`
- `class6-product.js`
- `class6-detail-bridge.js`
- current Motion workflow and live-check scripts.

Project 03 is useful knowledge, but this project must not merely swap round dishes for pizza wedges.

---

## 2. Product definition

### What Project 07 IS

Eight independent pizza slices form a radial/orbital selection system.

There is one fixed **HERO STATION** / selector in the composition. The active slice arrives into this station and fits the same fixed outline every time.

The other seven slices remain visible around an arc/orbit as contextual products.

Conceptually:

```text
                         FIXED HERO SELECTOR
                                ↓
                         [ ACTIVE SLICE ]

              slice 8                         slice 2

         slice 7                                   slice 3

              slice 6                         slice 4

                         slice 5
```

The user can either move one slice at a time or trigger a spin that travels through several slices and settles on one result.

### What Project 07 IS NOT

It is not:

- the complete pizza image rotating as one disc;
- an assembled pizza roulette;
- the existing Orbital Food Slider with triangular images dropped into it;
- a normal card carousel;
- a static radial menu;
- an HTML casino wheel;
- a Three.js/WebGL 3D scene.

Project 06 owns the complete circular pizza wheel. Project 07 owns the independent-slice orbit.

---

## 3. Real source assets — use them, do not invent replacements

The assets are already in `main`.

### Complete pizza — reference only for this project

`assets/pizza-motion/source/full-pizza/PIZZA COMPLETA DE 8 TROZOS.png`

Project 07 must **not** use this as its moving product. It may be inspected only as a visual cross-reference.

### Eight independent slices — Project 07 source of truth

`assets/pizza-motion/source/slices/`

Expected files:

1. `TROZO PIZZA 4 QUESOS.png`
2. `TROZO PIZZA BARBACOA.png`
3. `TROZO PIZZA CARBONARA.png`
4. `TROZO PIZZA DIAVOLA.png`
5. `TROZO PIZZA MARGARITA.png`
6. `TROZO PIZZA MORTADELA Y PISTACHO.png`
7. `TROZO PIZZA PROSCIUTTO FUNGI.png`
8. `TROZO PIZZA VERDURAS.png`

All source files are 1254×1254 RGBA PNGs with transparent backgrounds.

Treat `source/` as immutable user masters. Never overwrite, crop destructively, rename, or recompress them in place.

---

## 4. Asset audit and normalization is mandatory

The eight files share the same canvas but their visible alpha bounds are not identical. Some slices are materially smaller inside the transparent canvas than others.

Therefore **do not trust raw image dimensions as visual registration**.

Before building the final renderer:

1. inspect alpha bounds for all eight files;
2. measure visible width/height, visual center, crust line and tip position;
3. choose a canonical wedge geometry;
4. create runtime registration data per slice;
5. generate optimized runtime assets if useful, while preserving source files untouched.

Use a data contract such as:

```js
{
  id: 'margarita',
  name: 'Margarita',
  source: '...',
  runtimeAsset: '...',
  registration: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotationBias: 0
  }
}
```

Small differences should be solved with registration, not hardcoded conditionals inside the renderer.

Create an audit artifact, for example:

- `assets/pizza-motion/audit/slice-contact-sheet.png`
- `assets/pizza-motion/audit/slice-registration.json`

A fixed hero outline is only credible if every normalized slice lands inside it consistently.

---

## 5. One canonical state inside Project 07

Project 07 needs one continuous scalar state only:

```text
rotationProgress
```

One item step = `1.0` progress unit.

Eight items mean one full logical revolution = `8.0` progress units = `360°`.

Derive everything else from that scalar:

```text
rotationProgress
      ↓
continuousDistance(index)
      ↓
angle
      ↓
position
      ↓
front / hero proximity
      ↓
scale / opacity / z-order / rotation
      ↓
activeIndex = nearest logical slice
```

Do not create separate conflicting states for drag, spin, buttons and selected item.

The authoritative selected slice must be derived from the same progress that paints the visual orbit.

---

## 6. Reuse Project 03 knowledge without forcing the wrong model

Project 03 introduced a useful pattern:

- continuous progress;
- derived geometry;
- gesture = progress;
- momentum;
- snap;
- one active selection;
- Studio preset lifecycle;
- cleanup;
- mobile/reduced-motion contracts.

Reuse these principles and reusable primitives where clean.

However, **do not force the six-dish RestaurantOrbit data model onto eight pizza slices if that creates fake state or awkward adapters**.

The new slice set is an eight-item product collection. It can own a small dedicated rotary-selection engine, provided it has only one progress scalar and one derived active index and remains isolated from existing presets.

If you can extract a genuinely generic rotary primitive from the existing Orbital Engine with a small backwards-compatible change, that is acceptable. Do not perform a broad refactor of `app-v4.js` merely to achieve code reuse.

---

## 7. Geometry — the slices must read as a physical radial system

Use a virtual circular or elliptical path.

The active station is fixed near the visual center/front of the composition. The active slice is upright with crust at top and tip downward, matching the reference composition.

Neighbour slices travel around the virtual circle and rotate radially with the path.

A valid geometry has:

- one unmistakable hero slice;
- previous and next clearly visible;
- additional slices visible farther around the orbit;
- at least three perceptible depth/importance levels;
- real overlap and z-order changes;
- continuous movement between positions;
- no teleport at index boundaries.

A useful conceptual mapping is:

```text
distance → angle → x/y → heroProximity → scale → opacity → z
```

The active slice should dominate without hiding the fact that the collection continues around it.

Do not assemble the eight wedges into a complete pizza circle in Project 07.

---

## 8. Fixed HERO selector / outline

The selection frame is a separate UI layer and **must not rotate with the slices**.

Use SVG/CSS/path geometry or another clean technique to create a premium fixed wedge outline around the hero station.

The outline should:

- be visually aligned to the normalized canonical slice;
- remain perfectly fixed during navigation and spin;
- never be baked into the source pizza image;
- not flicker when the active slice changes;
- work on desktop and mobile;
- not cover important toppings excessively.

The key illusion is:

```text
THE FRAME STAYS
THE PRODUCTS MOVE
EVERY PRODUCT FITS THE SAME FRAME
```

This is a hard approval gate.

---

## 9. Interaction mode A — STEP

Support deliberate one-at-a-time exploration.

Inputs:

- Previous / Next buttons;
- ArrowLeft / ArrowRight;
- drag / swipe;
- wheel/trackpad only if it remains controllable and does not hijack normal page scroll.

Step contract:

```text
prev → progress - 1
next → progress + 1
```

Drag must be fractional:

```text
pointer movement = continuous rotationProgress
```

Do not wait for pointerup before moving the slices.

On release:

- use measured velocity for modest momentum;
- settle to the nearest valid integer progress;
- snap cleanly;
- selected index and visual hero must agree.

A cancelled/short drag must be able to return to the original slice.

---

## 10. Interaction mode B — SPIN / DISCOVER

Provide a separate `SPIN` or `DISCOVER` action.

This is not gambling. It is a product-discovery interaction.

On trigger:

1. choose one of the eight slices uniformly for the first LAB;
2. calculate a target progress that includes several additional full revolutions;
3. accelerate;
4. reach a readable fast phase;
5. decelerate progressively;
6. settle exactly on the target slice;
7. update the selected-product presentation only from the canonical progress/index.

A target should not simply tween to the nearest index. The user must perceive genuine travel.

For testing, random selection must be injectable/deterministic. Expose a test-only seed or RNG hook instead of making E2E flaky.

During a spin:

- prevent a second simultaneous spin;
- define whether manual drag is ignored or cancels the spin, and implement one consistent rule;
- keep rendering from the same progress scalar;
- do not fake the final result independently of the visual motion.

Reduced motion may skip the long revolutions and reveal the selected slice with a short accessible transition.

---

## 11. Product information

Do not invent prices, ingredients or marketing claims that do not exist in data.

For the first LAB, the descriptive filenames provide valid product names:

- 4 Quesos
- Barbacoa
- Carbonara
- Diavola
- Margarita
- Mortadela y Pistacho
- Prosciutto Funghi
- Verduras

Create a small data manifest that can later receive real price, ingredients, allergens, CTA and product IDs.

The visual label/copy must always correspond to the slice currently in the fixed hero station.

If a real product-detail mapping is unavailable, do not build a fake duplicate detail modal. Leave a clean extension point or use the existing Detail Bridge only where a real mapping exists.

---

## 12. Visual direction

The result must feel like a premium interactive food campaign, not a game widget pasted into a website.

Use the existing Restaurant Studio art direction:

- dark cinematic stage;
- strong but restrained typography;
- product photography dominant;
- minimal chrome;
- soft branded accent light;
- decorative basil/herb/ingredient layers only when they add depth;
- controls visually secondary to the food.

The fixed hero frame can carry the accent colour.

Avoid casino aesthetics, flashing lights, roulette numerals or prize-wheel graphics.

---

## 13. Studio integration

Add a new Motion preset with a clear name, recommended:

`Pizza Slice Orbit`

Suggested value:

`pizza-slice-orbit`

It must coexist with all existing presets, including:

- Elegant Orbit;
- Urban Acrobatics;
- Editorial Flow;
- Depth Carousel;
- Anchor Scenes;
- Orbital Food Slider.

Leaving the preset must completely clean up:

- custom layers;
- transforms that are not owned by the baseline;
- event listeners;
- timers / RAF loops;
- spin state;
- selector frame;
- CSS variables/datasets.

Returning to an existing preset must restore it intact.

---

## 14. Desktop

Desktop should show enough of the eight-slice collection to communicate the radial system instantly.

Minimum visual read:

```text
HERO + previous + next + farther orbit context
```

Keep the hero product large and premium.

Do not let the orbit cover title, CTA or navigation.

No horizontal page overflow.

---

## 15. Mobile

Do not simply shrink desktop.

Mobile must use a tighter radius and lower visual density while retaining:

- hero slice;
- visible previous/next affordance;
- swipe;
- fixed hero selector;
- selected name;
- step controls or equivalent accessible controls;
- spin/discover action;
- no clipping of crust/tip;
- no horizontal overflow.

The hero frame and normalized slice must remain registered at common phone widths.

---

## 16. Accessibility / reduced motion

Provide:

- semantic buttons;
- keyboard navigation;
- visible focus;
- accessible labels;
- a polite live region that announces the selected pizza after a committed step/spin;
- reduced-motion behavior with no long spin animation.

Reduced motion must preserve all product-selection functionality.

---

## 17. Performance

The source PNGs are large. Do not serve them blindly if optimized runtime assets materially reduce weight.

Create runtime WebP/AVIF copies if useful while keeping source immutable.

The first paint should not wait for all decorative assets.

Preload the active and nearest slices; preload the remaining six intelligently or load all eight if the optimized total remains reasonable.

No Three.js is required.

---

## 18. Tests

Create a focused Project 07 E2E suite using the next coherent naming available in the repository.

At minimum test:

### Assets
- exactly 8 slice products discovered;
- all runtime assets load without 404;
- full pizza asset is not used as the Project 07 moving product;
- normalization/registration data exists for all eight.

### State
- one canonical progress scalar;
- one derived active index;
- active index agrees with hero station;
- no duplicate state per input mode.

### Step mode
- next = +1;
- prev = -1;
- keyboard;
- fractional drag visibly changes progress before release;
- cancel/return;
- complete/snap;
- wrap 8 → 1 and 1 → 8.

### Spin mode
- deterministic test RNG can force a target;
- progress travels through multiple turns;
- final progress snaps exactly;
- final active slice equals the requested deterministic target;
- repeated trigger during active spin is handled safely.

### Geometry
- selector frame does not rotate;
- active slice fits the selector within a defined tolerance;
- z-order changes during motion;
- no teleport at sampled progress points;
- hero is measurably larger than neighbours.

### Product sync
- displayed name matches active slice;
- spin result and label cannot diverge.

### Responsive
- desktop no overflow;
- mobile no overflow;
- mobile hero/selector registration.

### Reduced motion
- step works;
- discover result works without long animation;
- selection announcement works.

### Regressions
Run the current green Motion suites, especially:

- Project 01 Depth Carousel;
- Project 02 Anchor Scenes;
- Project 03 Orbital Food Slider;
- current Class 05/06/07 contracts used by main.

Do not "fix" known obsolete tests unrelated to this project unless the current main workflow requires them.

---

## 19. Visual evidence

Generate fresh screenshots from the final implementation.

Desktop:

- `pizza-slice-orbit-desktop-01-idle.png`
- `pizza-slice-orbit-desktop-02-quarter-drag.png`
- `pizza-slice-orbit-desktop-03-half-drag.png`
- `pizza-slice-orbit-desktop-04-next-settled.png`
- `pizza-slice-orbit-desktop-05-spin-fast.png`
- `pizza-slice-orbit-desktop-06-spin-result.png`
- `pizza-slice-orbit-desktop-07-wrap.png`

Mobile:

- `pizza-slice-orbit-mobile-01-idle.png`
- `pizza-slice-orbit-mobile-02-half-drag.png`
- `pizza-slice-orbit-mobile-03-settled.png`
- `pizza-slice-orbit-mobile-04-spin-result.png`

Also create a **registration proof sheet** showing all eight normalized slices over the same fixed hero outline.

This proof sheet is mandatory.

---

## 20. Video evidence

Generate:

- `tests/video/pizza-slice-orbit-desktop.webm`
- `tests/video/pizza-slice-orbit-mobile.webm`

Desktop video must show:

1. idle;
2. slow partial drag;
3. hold around 50%;
4. cancel or return;
5. complete one step;
6. several one-by-one steps;
7. trigger SPIN/DISCOVER;
8. visible multi-turn travel;
9. deceleration;
10. exact final selection;
11. switch to Orbital Food Slider and prove it still works.

Mobile must show real swipe and a spin result.

The recorder must fail if `pizza-slice-orbit` is not the active preset.

---

## 21. CI / live preview

Integrate Project 07 additively into the existing Motion workflow. Do not duplicate Playwright installation or create an unnecessarily slow parallel pipeline.

Deploy the feature branch to the same preview mechanism used by recent Motion projects.

Before reporting success, verify:

```text
DEPLOYED SHA = FINAL BRANCH HEAD
```

and run live checks against the public URL.

---

## 22. Human approval gate

Claude Code does not approve this project.

Final state can only be:

`READY FOR HUMAN VISUAL REVIEW`

or

`BLOCKED`.

Do not merge to main.

The project is rejected if any of the following is true:

- it looks like the complete pizza wheel from Project 06;
- the eight wedges assemble into a full pizza instead of remaining independent products;
- it is only Orbital Food Slider with triangular images;
- the fixed hero outline moves or rotates;
- different slices do not fit the same hero outline;
- drag is not continuous;
- spin fakes a result independently of visual progress;
- there is no visible multi-turn travel in spin mode;
- mobile loses the hero selection concept;
- existing Project 03 is degraded.

It passes the concept gate only if a viewer immediately understands:

> there are eight different pizza slices, I can rotate through them one by one, and I can trigger a playful spin that lands one slice into a fixed premium hero selector.

---

## 23. Execution style

Do not spend a day producing plans before building.

The repository, assets and product direction already exist.

Use this order:

```text
AUDIT REAL ASSETS
→ NORMALIZE / REGISTER
→ BUILD MINIMAL ORBIT
→ FIXED HERO SELECTOR
→ FRACTIONAL DRAG
→ SNAP / STEP
→ SPIN
→ COPY SYNC
→ MOBILE
→ REDUCED MOTION
→ REGRESSIONS
→ EVIDENCE
→ DEPLOY
→ HUMAN REVIEW
```

If the first orbit or registration is visually wrong, fix it before expanding the feature. Do not hide visual failure behind tests.

---

## 24. Final report format

Return:

```text
PROJECT 07 — PIZZA SLICE ORBIT / HERO SELECTOR

STATUS
READY FOR HUMAN VISUAL REVIEW / BLOCKED

BRANCH
feat/pizza-slice-orbit-lab

HEAD
...

BASE MAIN
...

SOURCE SLICES FOUND
8 / 8

SOURCE DIMENSIONS
...

NORMALIZATION / REGISTRATION
...

RUNTIME ASSETS
...

CANONICAL PROGRESS STATE
...

HERO SELECTOR FIXED
PASS / FAIL

STEP MODE
...

FRACTIONAL DRAG
...

MOMENTUM / SNAP
...

SPIN / DISCOVER
...

RNG TEST HOOK
...

FINAL SELECTION SYNC
...

DESKTOP
...

MOBILE
...

REDUCED MOTION
...

PROJECT 01 REGRESSION
...

PROJECT 02 REGRESSION
...

PROJECT 03 REGRESSION
...

TESTS
...

CI
...

SCREENSHOTS
...

VIDEOS
...

LIVE URL
...

DEPLOYED SHA
...

KNOWN ISSUES
...

MERGED TO MAIN
NO

HUMAN VISUAL VALIDATION REQUIRED
YES
```

Do not implement Project 06 in this branch. Do not merge. Execute Project 07 to a real public visual proof.