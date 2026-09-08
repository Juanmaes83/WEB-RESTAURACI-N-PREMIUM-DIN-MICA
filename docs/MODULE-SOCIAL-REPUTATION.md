# MODULE — Social / Reputation

## Status

LAB ORIGINAL: preserved at `labs/module-social-reputation/index.html`.
PRODUCTION INTEGRATION: [Class 20](CLASS-20-MODULES-STUDIO-INTEGRATION.md), via `modules.social`, extending the original footer. Historical LAB notes below are preserved.

Isolated LAB. Production target is optional and defaults OFF. Human visual approval required before merge.

## Product intent

Add social presence and review/reputation signals without replacing the current footer or Studio. Final integration is additive: existing Studio + optional Social/Reputation controls.

## Supported platforms

Instagram, Facebook, Tripadvisor, Google Business Profile / Maps, TheFork, MICHELIN Guide, TikTok and YouTube.

Only validated HTTPS URLs are rendered for known platform hosts. Invalid URLs are ignored rather than published.

## Presets

- `editorial-footer`: large editorial social/reputation composition.
- `reputation-strip`: review-led compact section.
- `social-minimal`: restrained social footer extension.

## Data contract

`enabled`, heading/eyebrow/body, preset, optional rating/review count/CTA and an ordered platform list. Final persistence must reuse existing Project State; do not introduce a parallel storage layer.

## OFF behavior

When disabled, the public module renders nothing in production. The LAB shows an explanatory OFF proof only for review.

## Integration rule

Do not replace the current Studio or footer. Add controls inside the existing panel using the existing field/toggle visual language and data-path/persistence conventions.

## Review checklist

Toggle OFF/ON, switch all three presets, edit rating/review count, enable/disable networks, test valid and invalid platform URLs, and check mobile layout.
