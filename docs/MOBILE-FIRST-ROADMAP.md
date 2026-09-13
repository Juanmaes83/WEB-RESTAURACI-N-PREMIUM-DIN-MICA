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

**Priority: NEXT**

### Goal

Make Restaurant Studio preview the same public application at a **real browser viewport**, not a desktop document constrained with `max-width`.

### Problem to eliminate

The current preview selector changes presentation state but does not change `window.innerWidth`, media-query evaluation, viewport units or JS breakpoint logic. A max-width wrapper can therefore report a false mobile success.

### Required architecture

- Studio remains the single editor/state owner.
- The preview renderer must not create a second durable store, second Studio or second Media Library.
- Render the public site in an iframe/frame surface using the same current Project State.
- Synchronize state into the frame through a deliberate snapshot/message bridge or equivalent single-source contract.
- Frame must execute its own true width/height so CSS media queries, JS viewport checks, `svh/dvh`, touch-oriented layout and responsive media behave as they do on a real device.

### Preview presets

Minimum:

- Mobile S — 360×800
- Mobile M — 390×844
- Mobile L — 430×932
- Landscape — 844×390
- Tablet — 768×1024
- Desktop — 1440×900 or fluid desktop

Studio may expose a custom width later; it is not required for C1 acceptance.

### C1 acceptance contract

C1 passes only if:

- frame `innerWidth` equals the selected preset width;
- media queries evaluate against the frame width, not the host Studio width;
- Project State edits propagate to preview without manual reload;
- Media Library references resolve identically in editor and preview;
- changing preset does not create duplicated persistence/state owners;
- public modules preserve ON/OFF state;
- mobile navigation appears in mobile presets and desktop navigation in desktop preset;
- no new same-origin 404 or fatal JS errors;
- no horizontal overflow at standard presets;
- Product Detail/reservation can be opened and closed inside the preview;
- Checkpoint A public-mobile gates remain green outside Studio;
- desktop Studio behavior does not regress.

### C1 human checkpoint

Before merge, provide a real Vercel branch URL. Human review must verify:

1. Edit restaurant name/text/color in Studio and see it immediately in preview.
2. Switch 390 → 1440 and visibly observe the correct mobile/desktop navigation difference.
3. Open mobile Product Detail inside preview.
4. Switch portrait/landscape without losing current Project State.
5. Confirm media and dish content are the same data as the editor.

### C1 non-goals

- Do not redesign the whole Studio.
- Do not make the Studio itself a phone-first editor yet.
- Do not do broad lazy-loading/performance work.
- Do not introduce React/Next/Zustand/another SPA/store.
- Do not merge #38/#39 as part of C1.

Suggested branch: `feat/studio-real-mobile-preview`

---

## PHASE C2 — PERFORMANCE / PROGRESSIVE LOADING

**Priority: AFTER C1 APPROVAL**

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
