# MODULE — LOCATION / GOOGLE MAPS

## Status

ISOLATED LAB — HUMAN VISUAL REVIEW REQUIRED — DO NOT MERGE UNTIL APPROVED.

Branch: `feat/location-maps-module-lab`

Base: `main@cb3620bdf2a23da6788d39b9007a93cd3730a89d`

## Why this is not a Motion Engine

Location / Google Maps is an **optional section + external integration**. It belongs to the future `SECTIONS / INTEGRATIONS` layer of Restaurant Studio, not to Product Motion.

The public contract is:

```text
OFF
→ no public section
→ no iframe
→ no Google Maps request

ON
→ render selected preset
→ address / hours / phone / CTA
→ optional Google Maps embed
```

## Isolation contract

This LAB adds only:

- `class16-location-maps.js`
- `styles-v16.css`
- `labs/module-location-maps/index.html`
- `docs/MODULE-LOCATION-MAPS.md`
- `tests/class16-location-maps-contract.mjs`
- `.github/workflows/location-maps-module.yml`

It does not modify Studio, Project State, Motion Director, current motors or shared runtime while Project 09 is being developed separately.

## Configuration target

```js
modules: {
  location: {
    enabled: false,
    title: 'Find us',
    eyebrow: 'Alicante · Spain',
    address: {
      street: '',
      postalCode: '',
      city: '',
      region: '',
      country: ''
    },
    phone: '',
    hours: '',
    maps: {
      mode: 'address',
      googleMapsUrl: '',
      embedUrl: '',
      latitude: null,
      longitude: null,
      privacyMode: 'click'
    },
    cta: { label: 'Cómo llegar' },
    design: { preset: 'split-editorial' }
  }
}
```

This LAB keeps the configuration in memory. Final integration must persist it through the existing Project State instead of introducing a second store.

## Google Maps modes

### Address

Builds a directions/search URL and embed query from the configured postal address. No API key is required for this proof.

### URL

Uses an explicit Google Maps URL for the external CTA after validation.

### Embed

Accepts an explicit HTTPS Google Maps embed URL after allow-list validation.

Arbitrary iframe URLs are rejected.

## Privacy modes

### Click to load — recommended default

The map iframe does not exist until the visitor explicitly presses `Mostrar Google Maps`.

Benefits:

- lower initial network cost;
- fewer third-party requests;
- better privacy posture;
- map failure cannot block the section.

### Auto

The map iframe is created as soon as the section renders.

## Visual presets

### Split Editorial

Editorial copy on the left; large map composition on the right. This is the default flagship preset.

### Full Width Map

Editorial header followed by a large landscape map. Suitable for destination restaurants, beach clubs and venues where location is part of the story.

### Minimal Location

Compact address-led section with a quieter map block. Suitable for restrained premium sites.

## Safety / fallback

- OFF does not create the public `section[data-location-module]`.
- OFF does not create an iframe.
- External links use `noopener noreferrer`.
- Embed URLs are restricted to HTTPS Google hosts/routes.
- If a map cannot load, address and directions CTA remain the canonical fallback.
- The module inherits branding during final integration; this LAB uses neutral LÚMINA-like design tokens only for visual proof.

## Responsive

Desktop uses the selected editorial composition.

Tablet collapses split layouts cleanly.

Mobile uses a dedicated stacked route: copy → address → hours/phone → CTA → map. No horizontal overflow is permitted.

## Reduced motion

No functional dependency on animation. `prefers-reduced-motion` disables transitions and preserves all content/actions.

## Human visual review

Validate:

1. OFF removes the public section.
2. ON immediately creates a premium location composition.
3. Split Editorial feels designed, not like a pasted iframe.
4. Full Width and Minimal are genuinely different presets.
5. Changing Torrevieja/Alicante/address updates the live preview and Maps destination.
6. `Cargar al pulsar` shows a designed placeholder first and only then creates Google Maps.
7. Mobile remains premium and legible.

## Final integration after concurrent work closes

Future Studio target:

```text
STUDIO
└── SECTIONS
    └── Location                       OFF / ON
        ├── Preset
        ├── Address
        ├── Phone / hours
        ├── Google Maps mode
        ├── Privacy mode
        └── CTA
```

The final integration must use existing Project State and must not delete this LAB, which remains as an isolated validation/reference surface.