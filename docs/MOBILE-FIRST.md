# MOBILE FIRST — Restaurant Product Foundation

## 1. BASELINE

- Repository: `Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA`.
- BASE SHA: `865421457c3622f2191b1c7a7c0d1952a095016b`, verified with `git fetch origin` on 2026-09-12. Local main and origin/main agree.
- Branch: `feat/mobile-first-restaurant-foundation`, created from origin/main with a clean worktree. Open PRs #38/#39 excluded.
- Existing Class24 interaction/governance baseline: **21/21 PASS**. It uses desktop mouse input; it does not prove native touch scrolling.
- Reproduction: `npm install --no-save playwright@1.55.0`, `npx playwright install chromium webkit`, then `BASELINE=1 node tests/mobile-first-product-gate.mjs` (PowerShell: `$env:BASELINE='1'`). Subsequent gates omit BASELINE; `BASE_URL` targets a deployment.
- Cold-context lab metrics and failures: [mobile-first-baseline.json](mobile-first-baseline.json). Full screenshots/results: `output/playwright/mobile-first/{before,after,live}`. Network is not throttled; missing cross-origin byte counts are explicitly recorded. These are not physical-device or field performance measurements.

## 2. DECISIONS

- Preserve the editorial public site and its selected choreography. Mobile task access extends existing navigation; desktop remains the expanded layout.
- Vertical gestures belong to the browser. Horizontal interaction starts only after 10 CSS px and clear X dominance. Multi-touch and cancellation must not commit a product or open its detail.
- No change to ownership: app-v4 owns config mutations/autosave and `restaurant:config-applied`; RestaurantStore persists; RestaurantStudioConfig exposes configuration. RestaurantMedia and its picker resolve the same library. Class19 indexes, Class21 unifies detail, Class22 hosts experiences. Modules remain opt-in.
- Keep Class24's anticipate/travel/settle, retargeting and velocity projection. Fix the input boundary, not the transition director.
- First public checkpoint ends phases A/B. Performance restructuring and Studio iframe preview require the user's subsequent human approval (phase C).

## 3. IMPLEMENTATION

- The existing header gains 48 px mobile controls. A compact three-action bar exposes Menu, Reservation and Visit; when Location is ON it links to that module. It reads the same configuration and locale, and owns no state or persistence.
- The bar yields to Product Detail, reservation, Studio and Experience Shell. Floating WhatsApp sits above it with safe-area clearance. The document's old global horizontal overflow mask is removed; clipping remains local to artwork/stages.
- Orbital/Half Orbit use delayed capture, an undecided state and 10 px/1.25× intent threshold. Cancel returns to the starting product. Decorative Class5 motion is interrupted only when horizontal drag starts. Vertical wheel input also remains page scroll.
- Mobile detail uses one scrolling surface and a sticky close control. Reservation inputs, actions and functional body copy are 16 px; public controls are at least 44 px (normally 48 px). Existing demo/provider reservation behavior is preserved.
- Versioned tests use Pixel/iPhone device contexts, native Chromium CDP touch, touch taps for mobile public actions, OFF/ON/OFF fixtures, target geometry, resources and all-page overflow. Touch start is hit-tested with clearance from controls; narrow landscape is not allowed to accidentally test the navigation bar.
- Three legacy Class5/6 suites now start their own server on an OS-assigned port. Class20/21/22 fixture drift was reproduced against the exact BASE SHA using `MOBILE_BASELINE_SHA`; tests now expect the approved 12-engine catalogue and explicitly opt in to Traveler. No test assertions were removed or skipped.

## 4. RESULTS

Baseline evidence: Elegant/Urban swallow vertical and vertical-dominant diagonal swipes; Half Orbit scrolls but enters drag on pointerdown. At 360 px: brand target 100×16; language buttons about 23×22; header reservation 78×34; Explore 107×29. Functional menu/visit copy is below 16 px. Existing desktop navigation disappears on mobile without a task replacement. CSS is predominantly max-width based. Studio preview is demonstrably a max-width wrapper (`styles-v4.css`), reserved for phase C. Runtime loaders start unselected engines; cold-load metrics retain their cost for the later optimization comparison. Existing WhatsApp/detail/reservation layer hiding was already present and is retained, rather than reported as a new fix.

WebKit Windows reports `maxTouchPoints=0` despite device emulation. The gate therefore proves receipt of a real `touchstart` plus coarse-pointer media queries, rather than asserting an unreliable navigator property. Native multi-point swipe proof is Chromium CDP; WebKit scroll gestures still need the requested physical iPhone review.

Motion review (Apple Design + Review Animations):

| Before | After | Why |
|---|---|---|
| Pointerdown immediately captures and interrupts motion | Intent precedes capture in app-v4 and Class24 | Vertical scroll does not enter drag or interrupt the director |
| Transferring implicit touch capture emits a bubbling loss event | Handle loss only for the actual captured stage | Native touch drag remains continuous |
| Class5 pauses breathing on every touch-down | Pause only on the base engine's horizontal-drag signal; resume on cancellation | Scrolling does not freeze the premium choreography |
| Small mobile controls/copy compete with the gesture surface | Readable copy, 48 px arrows/CTA, measurable gesture clearance | Preserve composition and direct manipulation |

Code review: **approve for checkpoint testing**. Class24's director, velocity projection, rapid-click handling and reduced-motion path remain intact; its 21/21 governance and 15/15 transition tests pass. Perceived motion and real-device safe areas require human review; no phase C optimization is claimed.

Reservation is the existing explicitly labelled demo. A real booking provider is used only when configured; this task does not invent a backend. Optional Maps/WhatsApp destinations are verified with isolated test config, not published fictional restaurant data.

## 5. REFERENCES

| Reference | Rule | Applied where |
|---|---|---|
| [UI UX Pro Max](https://github.com/Juanmaes83/ui-ux-pro-max-skill) — CLAUDE.md, README, skill, canonical data/search.py | Task-first restaurant access; 44 px targets; 16 px body; safe areas; image/loading budgets | Public task navigation, mobile controls, baseline |
| [Apple Design](https://github.com/Juanmaes83/skills-FOR-DESIGN-ENGINEERS/blob/main/skills/apple-design/SKILL.md) | Gesture intent, direct manipulation, presentation-state interruption, velocity projection | Orbital/Half Orbit input contracts |
| [Review Animations](https://github.com/Juanmaes83/skills-FOR-DESIGN-ENGINEERS/blob/main/skills/review-animations/STANDARDS.md) | Interruptibility, reduced motion, no unnecessary UI latency or layout animation | Review of changed motion |
| [Playwright](https://github.com/Juanmaes83/playwright), [Playwright MCP](https://github.com/Juanmaes83/playwright-mcp) | Versioned CLI-driven tests, device contexts and browser isolation | Public product gate |

Concrete searches executed against canonical CSVs: restaurant/food service/mobile/menu/reservation/location/hours; mobile/touch target/safe area/gesture conflict/navigation; mobile performance/responsive images/lazy loading/input latency. Style recommendations were not copied. Interface Design is reserved for phase C Studio work.
