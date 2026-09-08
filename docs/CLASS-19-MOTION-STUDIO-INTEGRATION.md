# CLASS 19 — MOTION + MODULE STUDIO INTEGRATION

Eleven motion engines exist in this project. Until this pass they lived in three
different places and there was no screen where you could see them all, let alone pick
one:

- **seven** inside a single `<select>` in the Motion panel;
- **one** as its own transversal card (Scroll Traveler);
- **three** only as isolated labs under `labs/`, with no entry in Studio at all.

This pass adds a **library**: one navigable index at the top of the Motion panel listing
all eleven, plus the two business modules in their own section, explicitly outside the
count.

| | |
|---|---|
| Runtime | `class19-motion-library.js` (loaded by `class4-runtime-guard.js`) |
| Styles | `styles-v19.css` (injected by the runtime) |
| Suite | `tests/class19-motion-library-e2e.mjs` — 32/32 |
| Guard | `scripts/check-motion-library.mjs` |
| Evidence | `tests/screenshots/motion-library/` |

---

## The eleven

| # | Engine | Origin | Kind | How it is chosen |
|---|---|---|---|---|
| 01 | Elegant Orbit | Class 05 | orbit preset | Activar |
| 02 | Urban Acrobatics | Class 05 | orbit preset | Activar |
| 03 | Editorial Flow | Class 07 | orbit preset | Activar |
| 04 | Cinematic Depth Carousel | Project 01 | orbit preset | Activar |
| 05 | Precomposed Anchor Scenes | Project 02 | orbit preset | Activar |
| 06 | Orbital Food Slider | Project 03 | orbit preset | Activar |
| 07 | Circular Dish Rotator | Project 06 | full-screen experience | Abrir experiencia |
| 08 | Pizza Slice Orbit · Premium | Project 07 | orbit preset | Activar |
| 09 | Scroll Traveler | Project 09 | page motion, transversal | Activado / Desactivado |
| 10 | Dish Stage | Project 10 | full-screen experience | Abrir experiencia |
| 11 | Cinematic Product Rail | Project 11 | full-screen experience | Abrir experiencia |

**Modules, outside the eleven:** Social / Reputation (Class 17) and WhatsApp Contact
(Class 18). They are business pieces, not motion languages, so they are listed under
their own heading with the count shown separately.

## Why three of them open instead of activating

This is the one design decision in this pass, and it is deliberate.

The seven presets are choreographies **of the same shared stage**: they decorate
`#orbit-stage`, so switching between them is a value in one `<select>`. The Scroll
Traveler is page motion and coexists with any of them.

The other three are **complete experiences with their own page**. Each builds its own
DOM — `.ds-lab`, `.cpr-page`, and the rotator's own stage — and Project 06's contract
asserts, in its own test suite, that *the isolated lab does not depend on the shared
motion engine JS*. Project 11's documentation explicitly reserves Studio integration for
a later pass, which is this one.

Turning them into orbit presets would mean rewriting three approved engines. So the
library does the honest thing: it lists them with the same weight as the rest, says what
they are, and opens them. Choosing one is still one click.

If they should later run *inside* the main page, that is a port per engine — a real
project each, with its own visual review — not a panel change.

## What the library is not

It owns no motion, no geometry and no state:

- which choreography is active is still `#motion-orbital-style`. The library reads it,
  and to activate one it sets the value and dispatches the same `input` / `change` events
  a visitor produces. There is no `activeEngine` variable anywhere;
- whether the traveler is on is still `scrollTraveler.enabled`, written through
  `RestaurantStudioConfig` — no second settings store;
- availability is read from the page, never assumed. A preset counts as available once
  its runtime has injected its option, so the library cannot advertise a dead engine;
- the catalogue is data and the renderer switches on `kind`. There is no per-engine
  branch, so a twelfth engine is one row.

Change the select from anywhere — the panel, another script, a test — and the library
follows within a beat. It is a view, and the tests assert exactly one card is ever marked
active.

## Navigating it

The library sits under the panel's own introduction and above the cards that tune each
engine, so the panel reads top to bottom as **what do we have → which one is on → how do
I tune it**.

It scrolls with the panel rather than inside its own box: a scroll area nested inside a
scrolling drawer is how you lose people on a trackpad. The filter row is `sticky`
instead, so from any depth you can narrow to *Coreografías*, *Página* or *Experiencias*
in one click. Filtering hides cards with `hidden` and never removes them from the DOM.

Two columns from 760px, one on a phone, where the whole library is reachable and an
engine can be chosen with a single tap.

## Additive

`index.html` is untouched. The runtime loads itself from `class4-runtime-guard.js`,
last, because it reads what every other runtime has registered. No engine was taught
about the library, and no lab was rewired to it — the guard fails the build on either.
