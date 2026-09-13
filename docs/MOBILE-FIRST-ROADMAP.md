# MOBILE FIRST ROADMAP — Restaurant Premium

Status date: 2026-09-13

Canonical production baseline: `main@0c22811a90726404e4c2551cd22601a51592e66d`

Production: `https://restaurant-class20-review.vercel.app`

## PRINCIPLE

Checkpoint A proved the public mobile experience. The remaining work must stay incremental: one phase, one branch, one measurable contract, one Vercel review, then merge only after the required human checkpoint. Do not bundle Studio preview, performance and future platform extraction into one large task.

---

## CHECKPOINT A — PUBLIC MOBILE FOUNDATION

**Status: APPROVED + MERGED**

Delivered through PR #40.

Approved outcomes:

- Native vertical page scroll over motion surfaces.
- Intent-based horizontal drag with threshold/cancellation.
- Public mobile task navigation.
- Mobile Product Detail and reservation sheets.
- Safe areas, readable functional copy and touch targets.
- Chromium/WebKit mobile matrix plus desktop regression coverage.
- Motion/governance preservation for approved engines.
- Physical-phone human review: PASS.

Checkpoint A is now the protected baseline for the next phases.

---

## PHASE C1 — REAL STUDIO MOBILE PREVIEW

**Status: IMPLEMENTED IN PR #42 · HUMAN REVIEW NEAR-PASS · ONE OPEN DEFECT**

Branch: `feat/studio-real-mobile-preview`

Current human-review deployment alias:

`https://restaurant-class20-review-git-446049-juanma-espinosas-projects.vercel.app`

### Goal

Make Restaurant Studio preview the same public application at a **real browser viewport**, not a desktop document constrained with `max-width`.

### Architecture implemented

- Studio remains the single editor/state owner.
- Preview renderer is a same-origin iframe and does not create a second durable project owner.
- Project State is synchronized parent → preview through a snapshot/message bridge.
- Preview presets execute at real browser widths/heights, so CSS media queries, viewport units and JS breakpoints evaluate inside the frame.
- Preview persistence is explicitly read-only.
- The same public runtimes remain authoritative; C1 does not introduce a second Motion engine system.

### Preview presets implemented

- Mobile S — 360×800
- Mobile M — 390×844
- Mobile L — 430×932
- Landscape — 844×390
- Tablet — 768×1024
- Desktop — 1440×900

### Motion regression found and fixed during human review

The first C1 implementation synchronized `motion.orbitalStyle` into Project State but did not replay the canonical Motion side effects inside the iframe. This left `data-orbital-motion` and the mounted runtime stale even though the selector/config value had changed.

The bridge now waits for asynchronously injected engine options, moves the real `#motion-orbital-style` selector, emits the canonical `input/change` path and calls the existing `RestaurantMotionStudio.publish()` contract. No Motion engine code was rewritten for this fix.

The dedicated C1 gate now proves end-to-end switching:

- Elegant Orbit → `elegant-orbit-v1`
- Depth Carousel → `depth-carousel-v3`
- Half Orbit → `half-orbit-v3`
- Orbital Food → `orbital-food-v1`
- return to Elegant Orbit
- Text Motion `mask`
- Media Motion `slowZoom`

`STUDIO_REAL_PREVIEW_PASS` is green on the current C1 implementation.

### Human review result — 2026-09-13

**Overall result: almost everything is working correctly. C1 is not yet approved for merge because one visible asset defect remains.**

Confirmed by human review:

- Studio opens correctly on desktop.
- Real Mobile/Tablet/Desktop preview is visible and usable.
- Viewport changes work.
- Project State changes propagate.
- Motion engines now change visually inside the preview.
- Text Motion and Media Motion propagate.
- Product/detail and core preview interaction are working.

### OPEN DEFECT C1-HR-01 — Circular Dish Rotator images do not render

Observed in the full experience:

`/#experience/circular-dish-rotator`

The **Circular Dish Rotator UI, typography, controls, geometry and scene render**, but the expected pizza/product imagery is missing. The browser shows a broken-image indicator and the image alternative text `Pizza completa formada por ocho variedades` instead of the visual asset.

This is currently the only human-review defect recorded for C1.

Important:

- Do not classify this as a Motion-switching regression; Motion switching has already been fixed and proven.
- Do not claim C1 media parity is fully approved while this defect exists.
- Root cause is **not yet documented as confirmed**. It must be reproduced and traced before changing asset paths or runtime code.
- C1 must remain unmerged until this image-loading defect is corrected and the same experience is reviewed again.
- Do not start C2 while C1-HR-01 remains open.

### C1 acceptance contract — current state

- ✅ frame `innerWidth` equals selected preset width;
- ✅ media queries evaluate against the frame width;
- ✅ Project State edits propagate without manual reload;
- ⚠️ Media/experience assets: **open defect C1-HR-01 in Circular Dish Rotator**;
- ✅ changing preset does not create duplicated durable persistence/state owners;
- ✅ public modules preserve ON/OFF state in tested C1 flows;
- ✅ mobile navigation appears in mobile presets and desktop navigation in desktop preset;
- ✅ no horizontal overflow at the standard tested preview size;
- ✅ Product Detail/reservation open and close inside preview;
- ✅ Motion engines switch through their real runtime contract;
- ✅ Text Motion and Media Motion derived state updates;
- ⏳ full existing regression suites must remain green on final C1 HEAD before merge;
- ⏳ final human re-check of Circular Dish Rotator imagery required.

### C1 human checkpoint before merge

The final re-check must confirm:

1. Restaurant name/text/color still update immediately in preview.
2. 390 → 1440 still produces the correct mobile/desktop navigation difference.
3. Product Detail still opens in the mobile preview.
4. Portrait/landscape switching preserves Project State.
5. Motion engines still change visually and do not remain on the previous runtime.
6. **Circular Dish Rotator loads its expected pizza/product images with no broken-image placeholder/alt-text substitution.**

### C1 non-goals

- Do not redesign the whole Studio.
- Do not make the Studio itself a phone-first editor yet.
- Do not do broad lazy-loading/performance work.
- Do not introduce React/Next/Zustand/another SPA/store.
- Do not merge #38/#39 as part of C1.

---

## PHASE C2 — PERFORMANCE / PROGRESSIVE LOADING

**Priority: AFTER C1 APPROVAL AND C1-HR-01 CLOSURE**

### Goal

Reduce initial public cost while preserving the exact approved public composition and motion contracts.

### Baseline rule

Record a new production-equivalent baseline from the approved `main` immediately before C2. Report measurements; do not promise arbitrary percentage improvements.

Track at minimum:

- request count;
- transferred JS/CSS/image/video bytes where observable;
- DOMContentLoaded/load;
- LCP/CLS when reliably available;
- failed resources;
- fatal JS errors;
- initial runtime/module files loaded;
- mobile 390×844 and desktop 1440×900.

### Loading architecture target

Initial public load should contain only what is necessary for:

- core public shell/config;
- selected active motion engine;
- above-the-fold media/critical assets.

Then progressively load capabilities:

- Location / Social / WhatsApp / Memories near viewport or when enabled;
- Studio + Motion Library only when Studio is requested;
- Experience runtimes only when the relevant experience is requested/near use;
- inactive motion engines should not be downloaded merely because they exist in the catalogue;
- optional idle prewarm is allowed only when it does not erase the initial-load gain.

### Media policy

- Hero/critical first media: eager/high priority only where justified.
- Below-fold images: lazy + async decode where safe.
- Below-fold video: avoid eager network cost; activate near viewport/use.
- Preserve `playsInline`, muted/autoplay contracts where needed.
- Respect reduced motion and save-data with static fallbacks where appropriate.
- Later responsive variants/srcset/AVIF/WebP may be introduced only without breaking the shared Media Library contract.

### C2 acceptance contract

- Checkpoint A public-mobile and motion regression suites stay green.
- C1 real Studio preview stays green.
- No visual identity regression.
- No broken transition timing caused by late-loading assets.
- Disabled modules/engines demonstrably avoid unnecessary initial downloads.
- Before/after report is committed.
- Vercel branch review proves public mobile and desktop still match the approved experience.

### C2 human checkpoint

Human review compares the C2 branch against current production for:

- first load;
- first interaction with menu/selected engine;
- transition smoothness;
- opening Product Detail;
- later scroll into modules/experiences;
- no visible pop-in that reduces premium quality.

Suggested branch: `perf/progressive-runtime-loading`

---

## PHASE C3 — MOBILE STUDIO AUTHORING

**Status: OPTIONAL / DECIDE AFTER C2**

### Goal

Allow real editing from a phone if this is commercially useful.

This is separate from C1. C1 is mandatory because accurate preview is needed for production. C3 should happen only if the team genuinely wants to author restaurants from a mobile device.

Potential requirements:

- restore an intentional mobile Studio entry point;
- one-column editor panels;
- 44/48 px controls;
- keyboard-safe dialogs/forms;
- media upload from mobile camera/library;
- sticky save/status/close actions;
- no conflict between editor gestures and public-preview gestures;
- phone/tablet authoring acceptance tests.

Do not start C3 automatically.

---

## PHASE D — RUBIK SOTA MOBILE FIRST MIGRATION SYSTEM

**Status: PLANNED AFTER C1/C2 STABILIZATION**

### Goal

Extract the reusable method proven in Restaurant Premium so other Rubik Sota repositories can be migrated without copying restaurant-specific styling.

### Reusable system

Create project-agnostic assets covering:

- Mobile First audit contract;
- baseline evidence capture;
- standard viewport/browser matrix;
- overflow/JS/resource checks;
- touch target/form/safe-area checks;
- vertical/horizontal/diagonal gesture gates when applicable;
- reduced-motion checks;
- deterministic screenshots;
- performance before/after report;
- GitHub Actions template;
- Vercel human-review checkpoint;
- migration playbook;
- human-review checklist.

### Reference sources

Use:

- `Juanmaes83/ui-ux-pro-max-skill`;
- `Juanmaes83/skills-FOR-DESIGN-ENGINEERS`;
- Playwright / Playwright MCP / suitable Playwright references;
- this repository's Checkpoint A, C1 and C2 as the real implementation reference.

### Critical rule

Reuse **the contract and workflow**, not Restaurant Premium's design. Each target project keeps its own visual system, business priorities, navigation and interaction model.

### Future migration classification

Each repository should first be classified:

- A — already Mobile First: gate/verify only;
- B — responsive but desktop-first: targeted migration;
- C — desktop-heavy or motion-heavy: full migration;
- D — lab/experimental: defer until product direction is stable.

Then migrate one repository at a time:

`AUDIT → BASELINE → P0/P1 FIXES → VERCEL → HUMAN REVIEW → MERGE`

---

## GOVERNANCE FOR ALL NEXT PHASES

- Never work directly on `main` for implementation phases.
- One phase per branch/PR.
- No force push.
- Do not mix PR #38/#39 unless separately approved.
- Do not weaken tests to get green CI.
- Keep evidence noise/generated screenshots out of commits unless deliberately versioned.
- Preserve approved archives.
- Human visual review is mandatory before merging user-visible C1/C2/C3 changes.
- Prefer short execution prompts: prove → fix only demonstrated failures → deploy → stop.
