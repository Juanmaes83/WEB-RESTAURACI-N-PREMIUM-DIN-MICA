# CLASS 20 — Optional Modules / Studio Integration

HUMAN VISUAL REVIEW REQUIRED. Tests and CI are not merge approval.

## Base / recovery

Base main: `4f297057bdfd5dfe49c7f762752e65d20a16cf1a`.
Branch: `feat/modules-studio-integration`.
Location: clean cherry-picks of `27d0634` and `9e7fbfe31809ca98122e9e59b9a9da02b80f9fb5`, touching only its six original files. PR #23 was not merged; its branch and LAB remain intact.

## Architecture

One Project State: `modules.location`, `modules.social`, `modules.whatsapp`. All OFF by default. Production defaults omit fictitious phone numbers, profile URLs and ratings.

Native Módulos tab, current cards/grids/inputs, built only on first opening. `data-path` → `RestaurantStudioConfig.set` → existing `mutate` → `applyAll` → `RestaurantStore`. Same Undo/Redo, import/export and persistence; no new storage key or database.

Class 19 only adds Location, live module state and Configurar shortcuts. Eleven engines and full-screen LAB links are unchanged.

Classes 16/17/18 expose `create(root, mount)` around their existing render functions; LABs still use those functions with their original ON demonstration. Renderer snapshots are applied views, not independent config stores.

- Location mounts after existing `#visit`, preserving the anchor/reservation section. Canonical `full-width-map` / `minimal-location` map to original renderer values `full-width` / `minimal`; `click-to-load` maps to `click`. No iframe before interaction; auto is explicit opt-in. Invalid URLs retain safe address + CTA fallback.
- Social is an additive child of the original footer, without its LAB demo footer. Eight networks retain approved HTTPS/host validation.
- WhatsApp is fixed only in floating mode; inline/direct mount beside visit/location. Floating UI hides while Studio, dish detail or reservation dialog is open.
- OFF removes the public host entirely. No links, iframe, placeholder or reserved space. Public CSS loads only after enable. Unrelated Motion updates do not rebuild unchanged module renderers.
- LAB CSS is mechanically scoped; global LAB body/reset rules never enter production. Brand uses existing `--accent`, `--paper`, `--ink`. Rebuild with `node scripts/build-module-styles.mjs`.
- CTA text interpolation in Location/WhatsApp now uses DOM text nodes, not executable markup.

## Validation / evidence

Class 20: `node tests/class20-modules-studio-integration-e2e.mjs` covers actual controls, clean OFF, presets/modes, consent, URLs/phone, persistence ON/OFF, shared history, export/import, four Motion + Traveler combinations, mobile, reduced motion and page errors.

Local result: Class 20 **43/43**, Class 19 **32/32**. All 12 additional requested regression suites passed (Traveler, Depth, Anchor, Orbital Food, Pizza Slice, Pizza Premium, Circular Dish Rotator, Dish Stage, Cinematic Product Rail, Location, Social, WhatsApp). No historical flake repair or A/B workaround was needed. Runner: `node tests/class20-regression.mjs`; individual results and exit codes under `output/playwright/class20/regression/`.

Screenshots and result JSON: `output/playwright/class20/` (overview, Location/Social/WhatsApp controls, public Location/footer, floating/inline/direct WhatsApp, mobile Studio/public).

Original isolated-branch collision guards still apply on historical LAB branches; integration retains their contracts plus dedicated Class 20 CI.

## Deployment

Dedicated Vercel review project: `restaurant-class20-review`, separate from the existing GitHub Pages restaurant. Historical videos/docs remain in Git but are not deployment payload. Exact deployed SHA, live checks and URL are recorded in the PR (not a self-referential hash here).

Public URL: https://restaurant-class20-review.vercel.app. Full live browser suite: **43/43 PASS**, including reload/persistence and real module output, with no page errors. Live captures/results: `output/playwright/class20/live/`. `node tests/class20-live-integrity.mjs` compares the served HTML, state/store, module/library JS and production CSS against the current committed HEAD (HTTP 200 and content equality).

## Seven human checks before merge

1. Fresh/private window → Studio → Módulos: all OFF, no public modules.
2. Enable Location, enter a real address, compare three presets. Click-to-load must show no Google iframe/request before “Mostrar Google Maps”. A non-Google embed URL must not load.
3. Enable Social with real URLs, inspect all presets inside the existing footer. Invalid hosts must not link; publish only verified ratings.
4. Enable WhatsApp with your number; inspect encoded message, left/right, prompt and three modes. Invalid phone must not navigate externally.
5. Reload ON with edited data. Try Undo/Redo and export/import. Disable all, reload, verify no leftover public space or contact controls.
6. Switch Elegant, Pizza Premium, Anchor and Orbital Food with Traveler ON. Modules retain state; editing modules does not change Motion.
7. Repeat on mobile/reduced motion: readable controls, no horizontal overflow, accessible reservation CTA. Compare committed screenshots.

No Memories, Beverages, ThreeUI, engine rewrite, Project 07 flake repair or merge.
