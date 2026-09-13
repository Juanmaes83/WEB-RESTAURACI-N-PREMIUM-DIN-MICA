# MOBILE FIRST — Restaurant Product Foundation

## 0. CURRENT STATUS — CHECKPOINT A APPROVED · C1 IN HUMAN REVIEW

- Repository: `Juanmaes83/WEB-RESTAURACI-N-PREMIUM-DIN-MICA`.
- Checkpoint A merged through PR #40 on 2026-09-13.
- Approved merge commit on `main`: `0c22811a90726404e4c2551cd22601a51592e66d`.
- Previous approved `main`: `865421457c3622f2191b1c7a7c0d1952a095016b`.
- Production URL: `https://restaurant-class20-review.vercel.app`.
- Human physical-phone review of Checkpoint A: **PASS**. The public restaurant experience is approved as the mobile baseline.
- PRs #38 and #39 remain independent and are not mixed into C1.
- This approval covers the **public restaurant experience**. It does **not** mean that Restaurant Studio itself is already a phone-first editor.
- **Phase C1 is implemented in PR #42 and is now in human review. Almost everything is working; one image-loading defect remains in Circular Dish Rotator and C1 must not merge until it is fixed and rechecked.**

### What is approved / working now

- Public mobile task navigation.
- Native vertical page scroll across interactive/motion surfaces.
- Horizontal touch interaction only after intent is demonstrated.
- Mobile Product Detail and reservation sheets.
- Safe-area handling and touch-target/readability improvements.
- Chromium/WebKit mobile gates plus desktop regressions.
- Half Orbit, Anchor Scenes, Orbital Food, Premium, Scroll Traveler and the approved motion/governance contracts remain intact.
- C1 real Studio preview runs the public application inside a real iframe viewport at mobile/tablet/desktop sizes.
- C1 Project State changes propagate into the preview.
- C1 Motion switching now updates the actual iframe runtime, not only the selector/config value.
- C1 Text Motion and Media Motion derived state also propagate into the preview.

### What remains intentionally pending

1. **Phase C1 — final blocker**: correct and re-review the missing image assets in `/#experience/circular-dish-rotator`. The experience UI renders but the expected pizza/product imagery is currently replaced by a broken-image indicator/alt text.
2. **Phase C2 — Performance / Progressive Loading**: reduce initial public cost without changing the approved visual identity or motion contracts. Do not start until C1 is approved/merged.
3. **Phase C3 — Mobile Studio Editor (optional, separate decision)**: make the authoring panel itself comfortable on a physical phone. This is not required for C1; desktop Studio + true mobile preview is the production priority.
4. **Phase D — Reusable Mobile First Migration System**: extract the proven audit/gate/workflow into a project-agnostic Rubik Sota standard for other repositories.

The canonical sequencing, current C1 human-review result and acceptance criteria live in [MOBILE-FIRST-ROADMAP.md](MOBILE-FIRST-ROADMAP.md).

## 1. BASELINE

- Original BASE SHA: `865421457c3622f2191b1c7a7c0d1952a095016b`.
- Original branch: `feat/mobile-first-restaurant-foundation`.
- Existing Class24 interaction/governance baseline: **21/21 PASS**. It used desktop mouse input and did not by itself prove native touch scrolling.
- Reproduction: `npm install --no-save playwright@1.55.0`, `npx playwright install chromium webkit`, then `BASELINE=1 node tests/mobile-first-product-gate.mjs` (PowerShell: `$env:BASELINE='1'`). Subsequent gates omit BASELINE; `BASE_URL` can target a deployment.
- Cold-context lab metrics and failures: [mobile-first-baseline.json](mobile-first-baseline.json). Full screenshots/results: `output/playwright/mobile-first/{before,after,live}`. Network is not throttled; missing cross-origin byte counts are explicitly recorded. These are not physical-device or field performance measurements.

## 2. DECISIONS

- Preserve the editorial public site and its selected choreography. Mobile task access extends existing navigation; desktop remains the expanded layout.
- Vertical gestures belong to the browser. Horizontal interaction starts only after 10 CSS px and clear X dominance. Multi-touch and cancellation must not commit a product or open its detail.
- No change to ownership: app-v4 owns config mutations/autosave and `restaurant:config-applied`; RestaurantStore persists; RestaurantStudioConfig exposes configuration. RestaurantMedia and its picker resolve the same library. Class19 indexes, Class21 unifies detail, Class22 hosts experiences. Modules remain opt-in.
- Keep Class24's anticipate/travel/settle, retargeting and velocity projection. Fix the input boundary, not the transition director.
- Checkpoint A ends public phases A/B. The next work is split deliberately into C1 Preview and C2 Performance so that neither phase becomes a large mixed refactor.
- Studio authoring on a phone is a different problem from previewing the public website at a real mobile viewport. C1 solves the latter first.
- A human-visible defect overrides a green automated gate. C1 remains unapproved while Circular Dish Rotator imagery is missing even though the C1 iframe and Motion synchronization gates are green.

## 3. IMPLEMENTATION — CHECKPOINT A

- The existing header gains 48 px mobile controls. A compact three-action bar exposes Menu, Reservation and Visit; when Location is ON it links to that module. It reads the same configuration and locale, and owns no state or persistence.
- The bar yields to Product Detail, reservation, Studio and Experience Shell. Floating WhatsApp sits above it with safe-area clearance. The document's old global horizontal overflow mask is removed; clipping remains local to artwork/stages.
- Orbital/Half Orbit use delayed capture, an undecided state and 10 px/1.25× intent threshold. Cancel returns to the starting product. Decorative Class5 motion is interrupted only when horizontal drag starts. Vertical wheel input also remains page scroll.
- Anchor Scenes now follows the same public touch contract: touch uses horizontal intent to change scene while vertical touch remains native page scroll; desktop preserves its established vertical wipe choreography.
- Mobile detail uses one scrolling surface and a sticky close control. Reservation inputs, actions and functional body copy are 16 px; public controls are at least 44 px (normally 48 px). Existing demo/provider reservation behavior is preserved.
- Versioned tests use Pixel/iPhone device contexts, native Chromium CDP touch, touch taps for mobile public actions, OFF/ON/OFF fixtures, target geometry, resources and all-page overflow.
- Legacy Class5/6 suites use isolated OS-assigned ports. Class20/21/22 fixture drift was reproduced against the original BASE SHA; tests now expect the approved twelve-engine baseline where appropriate and explicitly opt in to Traveler. No assertion was removed or skipped merely to make CI green.
- Evidence recorders that require opt-in modules activate them through the canonical configuration API; they do not change public defaults.

## 4. RESULTS

Baseline evidence showed Elegant/Urban swallowing vertical and vertical-dominant diagonal swipes; Half Orbit scrolled but entered drag on pointerdown. At 360 px, important controls and functional copy were below mobile interaction/readability thresholds. Desktop navigation disappeared on mobile without a task replacement. CSS was predominantly desktop-first/max-width based. Studio preview was a max-width wrapper rather than a true viewport.

Checkpoint A corrected the public interaction contract and passed the project regression suite. During CI closure it also exposed and fixed three contract/fixture issues without expanding product scope:

- Class6 E2E server lifecycle now closes on all exit paths.
- Anchor Scenes mobile input now matches the universal public contract: vertical scroll, horizontal scene change.
- Scroll Traveler video evidence explicitly opts into Traveler instead of assuming it is public-ON by default.

The final Checkpoint A feature HEAD `20bd03af89e78343044943b20cdc50701a43d34e` completed the Mobile First Public Product and motion-engine workflows successfully before PR #40 was merged. The merge commit `0c22811a90726404e4c2551cd22601a51592e66d` is deployed to production and was approved on a physical phone.

### Studio status after Checkpoint A / during C1

Restaurant Studio remains the single customization system and still owns the existing Marca, Contenido, Media, Platos, Visita, Proyecto and extension panels. On mobile public breakpoints the Studio launch control is intentionally hidden.

C1 adds the accurate preview layer without changing that ownership:

- **Public mobile site:** approved.
- **Desktop Studio authoring:** retained.
- **Real mobile/tablet/desktop preview inside Studio:** implemented in PR #42 and functioning in human review.
- **Full Studio authoring from a phone:** still pending a separate C3 decision.

### C1 Motion synchronization — fixed

Human review found that changing Motion in the parent Studio updated `motion.orbitalStyle` inside the iframe Project State but initially left the previous mounted runtime active. The cause was that snapshot hydration did not replay the canonical Motion publisher side effects.

C1 now reuses the existing Motion contract: it waits for engine options, moves the real selector, dispatches its canonical change path and calls `RestaurantMotionStudio.publish()`. The dedicated gate proves:

- Elegant → `elegant-orbit-v1`;
- Depth Carousel → `depth-carousel-v3`;
- Half Orbit → `half-orbit-v3`;
- Orbital Food → `orbital-food-v1`;
- return to Elegant;
- Text Motion `mask`;
- Media Motion `slowZoom`.

This part of C1 is working.

### C1-HR-01 — remaining human-review defect

In `/#experience/circular-dish-rotator`, the experience shell/page itself renders: layout, typography, copy, controls and circular/sector geometry are visible. However, the expected pizza/product image asset does not load. The human-review screenshot shows a broken-image marker and the visible alternative text:

`Pizza completa formada por ocho variedades`

Therefore the current C1 status is:

- **Real preview:** working.
- **Viewport switching:** working.
- **Project State synchronization:** working.
- **Motion engine switching:** working after the C1 fix.
- **Text/Media Motion synchronization:** working.
- **Circular Dish Rotator image assets:** **NOT working — open blocker C1-HR-01**.

The root cause of C1-HR-01 has not yet been confirmed. Do not guess or rewrite asset paths until the failed request/source is traced. C1 must remain unmerged and C2 must not start until the image issue is corrected and visually rechecked.

### Performance status after Checkpoint A

Checkpoint A was a UX/interaction correction, not a performance claim. The measured cold local baseline remained roughly in the same cost class and in some samples increased because one script/style and additional test-visible resources were added. C2 owns the performance work and must report before/after measurements rather than arbitrary promises.

## 5. REFERENCES

| Reference | Rule | Applied where |
|---|---|---|
| [UI UX Pro Max](https://github.com/Juanmaes83/ui-ux-pro-max-skill) — CLAUDE.md, README, skill, canonical data/search.py | Task-first access; 44 px targets; 16 px body; safe areas; responsive/performance discipline | Public mobile baseline and future C1/C2 review |
| [Apple Design](https://github.com/Juanmaes83/skills-FOR-DESIGN-ENGINEERS/blob/main/skills/apple-design/SKILL.md) | Gesture intent, direct manipulation, presentation-state interruption, velocity projection | Orbital/Half Orbit/Anchor input contracts |
| [Review Animations](https://github.com/Juanmaes83/skills-FOR-DESIGN-ENGINEERS/blob/main/skills/review-animations/STANDARDS.md) | Interruptibility, reduced motion, no unnecessary UI latency or layout animation | Motion review and C2 non-regression |
| [Playwright](https://github.com/Juanmaes83/playwright), [Playwright MCP](https://github.com/Juanmaes83/playwright-mcp), awesome-playwright references | Versioned CLI-driven tests, device contexts, browser isolation, deterministic acceptance gates | Public gate and reusable Phase D system |
| Restaurant Premium Checkpoint A + C1 | Proven implementation, CI fixes, real-viewport preview, human review and merge discipline | Reference implementation for future Rubik Sota Mobile First migrations |

Interface-oriented design references should be used primarily for C1/C3 Studio work. Public restaurant styling is not a template to copy into unrelated products; the reusable asset is the **contract, QA matrix, workflow and evidence discipline**.
