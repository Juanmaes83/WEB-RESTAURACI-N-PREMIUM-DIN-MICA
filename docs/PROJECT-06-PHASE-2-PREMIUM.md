# PROJECT 06 — PHASE 2 PREMIUM PRODUCTIZATION

## Status

**IMPLEMENTED IN ISOLATED LAB / HUMAN VISUAL REVIEW REQUIRED**

Branch: `feat/circular-dish-rotator-lab`

This phase extends Project 06 without touching the shared Studio/runtime files being used in parallel by Project 07.

## Scope approved by Juanma

Phase 2 adds five product-level capabilities:

1. per-pizza chromatic identity;
2. stronger background typography;
3. contextual CTA + personalization panel;
4. restaurant asset loading;
5. order / reservation integration contracts.

## 1. Per-pizza chromatic identity

Eight palettes are mapped one-to-one to the eight canonical pizza sectors.

Each palette owns:

- hero accent;
- secondary accent;
- world background A;
- world background B;
- soft atmospheric glow;
- a large editorial mood word.

Examples:

- Diavola → FIRE / red-orange world;
- Prosciutto Funghi → FOREST / warm earth world;
- 4 Quesos → CREAM / gold-cream world;
- Mortadela y Pistacho → PISTACHIO / green-silk world;
- Carbonara → GOLD;
- Barbacoa → SMOKE;
- Verduras → GARDEN;
- Margarita → CLASSIC.

The palette is derived from the same canonical active index exposed by `window.CircularDishRotator`. Phase 2 does not create a second selection state.

The personalization panel can disable per-pizza palettes and use one restaurant brand accent instead.

## 2. Stronger background typography

The product world now contains a second editorial layer behind the circular product:

- giant mood word;
- giant `01–08` index;
- selected pizza name;
- existing low-contrast ghost typography.

On product changes, the background type performs a blur / scale / tracking handoff. Discover reveal receives a stronger final typography beat.

The intention is to make the complete scene respond to selection rather than only changing a small label.

## 3. Contextual CTA

The selected product now drives a commerce strip.

Default state:

- primary: `Order <selected pizza>`;
- secondary: `Reserve table`.

The restaurant profile can reverse the priority and make reservation the primary CTA.

CTA copy always reads the product selected by the canonical engine.

## 4. Personalization panel

Project 06 now includes an isolated productization panel for human review.

Editable restaurant-level fields:

- restaurant name;
- collection label;
- per-pizza palette on/off;
- fallback brand accent;
- primary commerce action;
- order URL;
- reservation URL.

Text settings persist in `localStorage` under:

`cdr.project06.phase2.profile.v1`

This is deliberately isolated from the main Restaurant Studio until Project 07 finishes and both branches can be reconciled safely.

## 5. Restaurant asset loading

The panel accepts three restaurant-specific image assets:

- logo / wordmark;
- complete circular product image;
- atmosphere / background image.

Binary files are stored client-side with IndexedDB instead of localStorage.

Store:

`cdr-project06-assets / assets`

Important invariant for the wheel asset:

The uploaded circular image is assigned to BOTH:

- the base rotating disc;
- the clipped selected-sector duplicate.

Therefore the hero sector can never visually come from a different product asset than the rotating disc.

`Restaurar assets demo` returns to the canonical repository pizza source.

## 6. Order integration contract

If the restaurant profile contains an Order URL, Project 06 opens that URL with contextual query parameters:

- `source=circular-dish-rotator`;
- `product=<selected product>`;
- `price=<selected price>`;
- `action=order`.

It also emits a neutral intent event:

`cdr:commerce-intent`

If no Order URL is configured, the LAB opens a local order-request dialog. Submission emits:

`cdr:order-request`

with:

- selected product;
- canonical index;
- quantity;
- notes;
- source.

No payment is simulated and no order is sent to a real restaurant.

## 7. Reservation integration contract

If a Reservation URL is configured, Project 06 opens it with product/context query parameters.

If no URL exists, the local reservation-request dialog emits:

`cdr:reservation-request`

with:

- selected product;
- canonical index;
- date;
- guests;
- notes;
- source.

No booking is falsely confirmed in the isolated LAB.

## 8. Runtime adapter

Phase 2 exposes:

`window.CircularDishPremium`

Read / action surface:

- `getProfile()`;
- `getCurrentProduct()`;
- `getCurrentPalette()`;
- `openCustomizer()`;
- `closeCustomizer()`;
- `requestOrder()`;
- `requestReservation()`;
- `resetAssets()`.

This adapter owns productization/presentation only. Rotation remains owned by `window.CircularDishRotator`.

## 9. Parallel development safety

Phase 2 still does not modify:

- `app-v4.js`;
- `class4-config.js`;
- `class4-runtime-guard.js`;
- `class6-product.js`;
- the existing Project 03 engine.

A dedicated workflow was added at:

`.github/workflows/project06-circular-dish-phase2.yml`

It validates Project 06 syntax, the isolated contract and a shared-runtime collision guard.

## Human review criteria

Phase 2 is ready for visual/product review when all of these are true:

- each pizza produces an unmistakably different but coherent premium colour world;
- giant background typography adds spectacle without reducing product legibility;
- CTA follows the selected pizza correctly;
- personalization changes brand, palette mode and commerce configuration without reloading the app architecture;
- uploaded restaurant wheel asset remains synchronized between base disc and hero sector;
- uploaded logo/background feel like restaurant-level customization, not developer tooling;
- Order and Reservation have a real integration path but do not pretend to complete transactions without a backend;
- Project 06 remains independent from Project 07.

No merge before Juanma + ChatGPT human approval.
