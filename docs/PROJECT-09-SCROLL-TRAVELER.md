# PROJECT 09 — SCROLL TRAVELER

A **page-level motion capability**. One visual object persists across several sections
and travels through the page as the visitor scrolls. It is not a product carousel, not
a preset of the Orbital engine and not a variant of Dish Stage: it is transversal, and
it coexists with whichever product choreography the restaurant has selected.

The Wild Red Prawn (`dish-01`) is the demonstration. The architecture is generic — the
same engine carries a lemon, a bottle, a glass, a spoon or a logo.

| | |
|---|---|
| Runtime | `class14-scroll-traveler.js` (loaded by `class4-runtime-guard.js`) |
| Styles | `styles-v14.css` (injected by the runtime) |
| Contract | `window.RestaurantDefaults.scrollTraveler` in `class4-config.js` |
| Object | `assets/scroll-traveler/runtime/dish-01-prawn.webp` |
| Suite | `tests/class14-scroll-traveler-e2e.mjs` — 76/76 |
| Guard | `scripts/check-scroll-traveler.mjs` |
| Evidence | `tests/screenshots/scroll-traveler/`, `tests/video/scroll-traveler-*.webm` |

---

## 1. Historical audit — what the old branches were worth

Two branches carried an earlier attempt. **Neither was merged, rebased or copied**, and
both are left untouched as reference history.

| Branch | HEAD | Shape |
|---|---|---|
| `class7-dish-journey` | `688d812` | 166 lines; the first journey, entered from the dish detail |
| `class7-dish-journey-premium` | `ffebda0` | denser rewrite; adds runtime background removal and an arc |

### KEEP — recovered as concepts, rebuilt in this engine

1. **One persistent fixed layer driven by custom properties.** The old
   `#class7-journey-layer` wrote `--journey-x/y/scale/rotate/tilt/opacity/shadow`.
   That is exactly right, and it is what `--st-*` does now.
2. **Aiming inside tall sections.** `scrollY + rect.top + max(0, height - innerHeight) * .46`
   lands the object while the section is actually on screen instead of at its top edge.
   Kept unchanged — it is the single best idea in the old code.
3. **An entry ramp before the first anchor**, so the object arrives from off-composition
   rather than appearing.
4. **An arc through a segment** — a small lift and an over-rotation, `sin(πt)` — which is
   what makes a move read as travel instead of as a tween between two points.
5. **A frame lerp for weight** (`k ≈ .115`), so the object has inertia and settles.
6. **The five-beat narrative**: the dish leaves the menu and reappears at Origin,
   Atmosphere, Chef and the reservation.
7. **Studio ON/OFF as the exposed control**, and a contact shadow under the object.
8. **Reduced motion handled explicitly** rather than left to chance.

### REWRITE — right idea, wrong construction

| Old | Why it could not stay | Now |
|---|---|---|
| `const RED_PRAWN='dish-01'` gating every behaviour | the capability was one dish wide | `source{}` + `route[]` as data; the guard fails the build on any identity comparison |
| `marks()` with `if (mobile) … else if (tablet) …` coordinate blocks in the engine | the composition was code | `route[]` and `routeMobile[]` in `class4-config.js` |
| `marks()` re-read from the DOM inside `stateAt`, i.e. layout per frame | scroll thrash | `measure()` caches; refreshed on resize and on ScrollTrigger refresh |
| `readEnabled`/`saveEnabled` writing `config.motion.dishJourney`, rebuilding the project object by hand | a second settings location | `data-path` inputs through `RestaurantStudioConfig` → `mutate → applyAll → persist` |
| a custom OFF/ON button group injected after `.motion-card-featured` | a bespoke control surface | a standard `.motion-card` that wires its own `[data-path]` inputs |
| one z-index above everything | there was no choreography, only an overlay | three layer states, with the page's own copy and media lifted so `behind` is really behind |
| entry only from the detail modal | the capability did not exist until a visitor opened a dish | AUTO/PAGE by default; the journey is page motion |

**On the product-story entry (mission §8).** The old journey began when a visitor opened
the Red Prawn's detail and pushed past it. That entry was deliberately *not* recovered:
the traveler is now page motion and the object is already travelling before any dish is
opened, so a "start the journey" affordance would advertise something that has already
started — and the gesture that triggered it was the scroll hijack this project forbids.
AUTO/PAGE is the mode, independent of the detail modal, exactly as §8 requires. If the
review wants a deep link from the product story ("follow this dish"), it is a small
addition on top of the existing `scrollToProgress(0)` — a click, never a gesture.

### DISCARD — deliberately not recovered

1. **`prepareTransparentDish()` — runtime flood-fill background removal.** It ran a
   canvas flood fill from the borders on every load, deciding by colour threshold
   (`l < 58 && max < 86 && sat < 34`) which pixels were background, then re-encoded a
   PNG data URL. It also had a silent `fallback` state that shipped the original
   black-background dish when the canvas was tainted. A cleaned asset built once, from
   an approved master, is better in every way — and the mission is explicit that the
   best current asset wins over reviving background removal.
2. **The scroll hijack.** `detail.addEventListener('wheel', …, {passive:false, capture:true})`
   with `preventDefault()` + `stopPropagation()` turned a scroll gesture into a journey
   trigger. Section 9 forbids it; `scripts/check-scroll-traveler.mjs` now fails the
   build if `preventDefault` or a wheel listener ever appears in the engine.
3. **Injected editorial copy.** `.class7-context` asides with a bilingual `copy{}` table
   hardcoded in the runtime added headlines and paragraphs into four sections. Content
   belongs to the page and to the config, not to a motion layer.
4. **The floating chip label** that followed the object. A label travelling with a dish
   reads as a debug overlay, not as an object in a room.
5. **`config.motion.dishJourney`** as a settings key, and the separate
   `class7-dish-journey.yml` workflow — folded into the existing motion workflow.

---

## 2. The generic contract

```js
window.RestaurantDefaults.scrollTraveler = {
  enabled: true,
  preset: 'red-prawn',
  intensity: 1,          // how much of the designed amplitude to apply
  scale: 1,              // the object's size
  rotationIntensity: 1,
  source: { type:'dish', dishId:'dish-01',
            asset:'assets/scroll-traveler/runtime/dish-01-prawn.webp', alt:'…' },
  route:       [ /* five stops */ ],
  routeMobile: [ /* five stops, composed for 390px */ ]
};
```

A route stop is:

```js
{ anchor:'.chef-section',   // any selector on the page
  chapter:'chef',           // the name published on <html data-traveler-chapter>
  x:30, y:58,               // viewport-relative, because the object is a fixed overlay
  scale:.96, rotation:6, opacity:1, blur:0,
  layer:'front' }           // 'behind' | 'between' | 'front'
```

`source` may be `{type:'dish'}`, `{type:'upload', mediaSlot:'…'}` (validated, stored in
the existing `RestaurantStore` media store) or any transparent asset path. The renderer
contains **no** `if dish === gamba` and **no** `if section === chef`; swap the data and
the same engine carries a different object along a different route.

## 3. One canonical value

```
scrollY → journeyProgress ∈ [0,1] → segment + t → x · y · scale · rotation · opacity
                                                 → layer state → chapter
```

`journeyProgress` is the only authoritative number. There is no `currentSection`, no
`activeJourneyStep` and no `selectedJourneyIndex`. `state()` reports the one progress
and everything derived from it; `<html data-traveler-progress>` is written from the same
value, and the suite asserts the two never disagree at nine route positions.

`stateAt(p)` is a pure function of progress — the suite samples it at 121 points to prove
continuity, and drives the real page from top to bottom to prove the same thing with
actual scrolling.

## 4. The route

| # | Anchor | Chapter | Layer | Desktop | Mobile |
|---|---|---|---|---|---|
| 1 | `#signature` | signature | front | 78 / 74 · 1.00 | 64 / 36 · 0.95 |
| 2 | `#experience` | origin | behind | 24 / 46 · 0.74 | 32 / 18 · 0.86 |
| 3 | `.experience-section` | atmosphere | between | 78 / 44 · 0.88 | 66 / 52 · 0.92 |
| 4 | `.chef-section` | chef | front | 30 / 58 · 0.96 | 34 / 44 · 0.98 |
| 5 | `#visit` | visit | between | 52 / 44 · 1.14 | 50 / 40 · 1.12 |

Each stop is an intentional composition, not a diagonal drift: the object crosses the
page left-to-right and back, changes depth three times, and is largest at the invitation.

**Mobile is its own route.** The object's box is already much smaller on a narrow screen,
so reusing desktop multipliers would leave a 70px dish nobody can read; the mobile stops
are composed against the real 390px layout, keep the copy columns clear, and never let
the object hang outside the viewport (asserted at every stop).

## 5. Cross-layer choreography

A fixed overlay has nothing to go behind: any positive z-index paints over every static
section, and a negative one disappears under the section's own opaque background. So
while the traveler is on, `styles-v14.css` lifts the page's own content into the layer
scale — and nothing else about the page changes:

```
behind   1   the object, under everything the section owns
media    3   the site's photo frames
between  4   the object, in front of a photograph and behind the headline
copy     5   the section's own type — it always wins over behind/between
front   60   the object, in front of the page
```

Because copy always outranks `behind` and `between`, the text stays readable at every
position on the route. `layer` is a discrete state, not a tween: z-index cannot be
interpolated meaningfully, so it hands over at the midpoint of a segment.

## 6. Scroll is never taken

Scroll drives the animation; the animation never drives scroll. The engine adds two
listeners (`scroll`, `resize`), both passive; it never calls `preventDefault`, never
listens for the wheel, and introduces no scroll snapping or scroll lock. The suite
proves it behaviourally — a wheel event is not cancelled, a 900px scroll moves the page
900px — and the guard proves it statically.

The layer is `pointer-events:none` and `aria-hidden`, so it can never swallow a click:
the suite hit-tests through the object and confirms the reservation CTA under the finale
is still the click target.

## 7. The object

`dish-01-food.webp` — the cut used by Project 01's dark stage — could not be the
traveler. Its broad cream sauce field spans almost the whole frame at full alpha, which
reads as sauce on black and as a pale rectangle behind the prawns on a cream section.
Those pixels are legitimately sauce; no hygiene pass can fix that.

`dish-01.webp`, the plated dish, has a round silhouette that survives both grounds — and
the plate *is* the object the journey is about. It carries a **baked drop shadow**: a
dark crescent outside the plate, up and to the left, invisible on black and a grey stain
on cream, lit from the opposite side to the page's own shadow.

`scripts/build-traveler-asset.mjs` builds the runtime object from the approved master,
which is never written to. This is alpha hygiene, not background removal — no colour is
reinterpreted and no pixel of the dish is re-decided:

1. **de-shadow**: the plate's own disk is located from its bright opaque mass and alpha
   outside it is cleared. Luminance only *locates* the plate; everything inside the disk
   is kept exactly as authored. What this removes is a shadow, which a runtime object
   should not carry — the page supplies its own.
2. **alpha floor** at 24: sub-visible on any ground, but `drop-shadow` reads the alpha
   channel, so those pixels would still cast a real shadow.
3. **largest connected component only**, dropping specks the cut left behind.
4. **crop** to the silhouette with a 2% margin.

```
dish-01-prawn   source 820×820, 220KB (untouched) → runtime 640×640, 94KB
                plate disk r=307 at 444,463 — baked shadow outside it removed
                alpha <= 24 cleared 5776 px
                84 components, largest kept, 494 px of debris dropped
                cropped to 616×615, silhouette solid over 65% of the frame
```

Proof sheet: `assets/scroll-traveler/audit/traveler-asset-proof.png` — source and runtime
on light and dark, carrying the page's own shadow.

`dish-01` stays the single product record; the traveler *references* it by `dishId` and
duplicates none of its content.

### A note on `contain: paint`

The layer originally carried `contain: layout style paint`. Paint containment both clips
the object's shadow — which is meant to fall outside its box — and, with a filtered child
inside a transformed composited layer, rasterises the box itself. That appeared as a
pale rotated square around the dish on the cream sections. The layer now uses
`contain: layout style`, and the guard fails the build if `paint` returns.

## 8. Studio

The traveler is **PAGE MOTION**, so it gets its own card in the Motion panel and is not
an option in product navigation — it coexists with Depth Carousel, Anchor Scenes,
Orbital Food, Pizza Slice Orbit and every other preset, all of which the suite exercises
with the traveler live.

Controls: ON/OFF, route preset, motion intensity, object scale, rotation, and an object
upload. No Bezier control points. Persistence uses the existing project state through
`data-path` — the card wires its own inputs through `RestaurantStudioConfig.set`, because
Studio binds `[data-path]` once at boot and this card is added later. Uploads go to the
existing `RestaurantStore` media store; an unreadable file is refused and the current
object stays.

## 9. Reduced motion

Under `prefers-reduced-motion: reduce` the object resolves directly to each composed
position with no easing tail and no velocity response. The content, the scrolling and
the Studio ON/OFF all keep working; the suite asserts each of them under the preference.

## 10. Performance

One layer, one image, placed by a single `translate3d + scale + rotate` fed by custom
properties. No clone per frame — the suite scrolls 40 frames and asserts the DOM gains no
elements. No canvas, no WebGL. Section geometry is measured once and cached, refreshed on
resize and on ScrollTrigger refresh. The frame loop stops requesting frames once the
object has settled.

## 11. Evidence

Desktop: `01-signature-start` · `02-between-signature-origin` · `03-origin-anchor` ·
`04-between-origin-atmosphere` · `05-atmosphere-anchor` · `06-chef-approach` ·
`07-chef-landing` · `08-reservation-approach` · `09-reservation-landing`.
Mobile: `mobile-01-start` … `mobile-05-reservation`. Plus `reduced-motion.png`.

Every frame is taken by **scrolling** to a route position and waiting for the object to
settle — never by posing it. `desktop-route-log.json` and `mobile-route-log.json` record
the progress, chapter, layer and z-index of each frame.

Video: one slow continuous scroll from the start of the journey to the reservation, with
a hold at each chapter and one reversal, on desktop and on mobile.
