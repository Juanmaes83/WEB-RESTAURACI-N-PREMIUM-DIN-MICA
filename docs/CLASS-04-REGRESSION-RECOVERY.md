# CLASS 04 — REGRESSION RECOVERY

## Why this document exists

During Class 04, the Restaurant Studio was expanded correctly in scope, but the public experience regressed compared with the final Class 03 state (`97d30a0d85b2aee427fef9d17484a8bd4664db9b`).

The regression was visible as:

- orbital plates appearing frozen;
- reduced or missing scroll transitions;
- reduced parallax;
- missing cinematic reveal behaviour;
- detail/reservation interactions not always binding;
- Studio media save errors affecting the rest of the page.

## Root cause

Class 03 separated the visual experience into a proven runtime and final motion tuning. Class 04 replaced that runtime with a new application boot sequence.

The critical architectural mistake was coupling storage verification and visual initialisation inside the same `try` block.

When IndexedDB failed or was blocked, the Class 04 `boot()` path skipped parts of the visual setup. A persistence problem was therefore able to disable:

- orbit interaction;
- ScrollTrigger motion;
- cursor behaviour;
- immersive dish detail;
- reservation interaction.

That violates the intended architecture.

## Recovery principle

> ENGINE must keep working even when CMS / STORAGE fails.

The public restaurant experience is now treated as the primary runtime. Studio and persistence are enhancement layers.

## Repairs

### 1. Storage degradation instead of application failure

Primary persistence remains IndexedDB.

If IndexedDB cannot be used:

- project/config falls back to `localStorage`;
- image/video blobs fall back to Cache Storage;
- storage mode is reported instead of crashing visual boot.

### 2. Class 03 cinematic grammar restored

A dedicated `class4-cinematic-restore.js` restores the proven visual language:

- cinematic Hero entrance;
- masked headline reveals;
- Hero parallax;
- section-specific reveal directions;
- parallax for the new Class 04 media-host DOM;
- orbital chapter entrance;
- image hover zoom;
- progressive section choreography.

### 3. Orbital regression guard

`class4-runtime-guard.js` checks whether the primary runtime actually bound the Orbital Menu controls.

If it did not, the fallback restores:

- previous/next;
- wheel;
- keyboard;
- pointer drag;
- momentum/snap;
- continuous centre-first orbital geometry;
- scale / blur / brightness / opacity / z-index depth;
- synchronized dish copy;
- dish detail opening;
- reserve interaction;
- contextual cursor.

This means a Studio/storage failure can no longer freeze the plates.

## Comparison with Class 03

The recovery uses the Class 03 final commit as the visual baseline:

`97d30a0d85b2aee427fef9d17484a8bd4664db9b`

Class 04 must be a strict superset:

- Class 03 motion quality: preserved or improved;
- Class 03 orbital behaviour: preserved;
- Class 03 immersive dish detail: preserved;
- Class 04 full content editing: added;
- Class 04 image/video media slots: added;
- Class 04 project persistence: added;
- Class 04 fallback persistence: added.

## New acceptance rule

No future class may replace a working lower layer simply to add a higher one.

The evolution contract is:

`CLASS N+1 = CLASS N WORKING EXPERIENCE + NEW CAPABILITY`

not

`CLASS N+1 = REWRITE CLASS N + HOPE FOR PARITY`.
