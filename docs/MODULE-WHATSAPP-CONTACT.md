# MODULE — WhatsApp Contact / Concierge

## Status

Isolated LAB. Production target is optional and defaults OFF. Human visual approval required before merge.

## Product intent

Add a direct WhatsApp contact capability without inserting a generic green bubble that breaks the restaurant's visual language. Final integration is additive inside the current Studio.

## Modes

- `floating-launcher`: premium capsule launcher with optional pre-contact prompt.
- `inline-concierge`: editorial concierge block inside the page composition.
- `direct-cta`: compact direct WhatsApp action.

## Data contract

`enabled`, `mode`, international phone, prefilled message, CTA label, concierge eyebrow/title/body/availability, side position and prompt visibility.

The module builds a `https://wa.me/<digits>?text=...` URL only when the normalized number contains 8–15 digits. Invalid numbers render no active external destination.

No third-party chatbot/provider script is loaded by this base module. A later provider adapter can be added without replacing the core contact contract.

## OFF behavior

When disabled, production renders no launcher, no WhatsApp CTA and no external request. The LAB displays an explanatory OFF proof only for review.

## Security / UX

- phone normalization removes punctuation/spaces before building `wa.me`;
- prefilled message is URL encoded;
- external navigation uses `noopener noreferrer`;
- the floating launcher has left/right placement and mobile rules;
- no full-screen takeover or scroll interception.

## Integration rule

Do not replace the current Studio, header, footer or reservation controls. Add WhatsApp as an optional module within the existing panel, using existing toggle/input styling and Project State/data-path persistence.

## Review checklist

Test OFF/ON, all three modes, left/right position, prompt ON/OFF, phone validation, message encoding, CTA destination, desktop and mobile.
