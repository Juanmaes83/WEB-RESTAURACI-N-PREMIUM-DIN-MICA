# Project 12 — Integration V2 Safety Contract

Branch: `feat/kinetic-product-selector-integration-v2`

Safe base: `570f21f75322d507618782415680ac3a7f73e37a`

Purpose: continue Kinetic Product Selector work without touching the concurrent SEO/GEO/Astra work or the shared Restaurant Studio core.

## Allowed scope during the isolated phase

- `experiences/kinetic-product-selector/**`
- `kinetic-product-selector.js`
- `kinetic-product-source.js`
- `kinetic-product-studio.js`
- `kinetic-product-detail-adapter.js`
- `styles-kinetic-product-selector.css`
- `styles-kinetic-product-selector-integration-v2.css`
- `assets/kinetic-product-selector/**`
- `tests/project12-*`
- `scripts/project12-*`
- `docs/PROJECT-12-*`
- Project 12 specific workflows only

## Protected / forbidden during the isolated phase

Do not modify these files after the safe base commit:

- `index.html`
- `app-v4.js`
- `class4-config.js`
- `class4-store.js`
- `class5-studio-motion.js`
- `styles-mobile-first.css`
- `class19-motion-library.js`
- `class22-experience-shell.js`
- `.gitignore`
- `rubik-seo-geo-core.js`
- `rubik-seo-geo-studio.js`
- `styles-seo-geo.css`
- `docs/SEO-GEO-FOUNDATION.md`
- `docs/SEO-GEO-RELEASE-A-CONTRACT.md`
- `tests/seo-geo-core.test.cjs`
- `tests/seo-geo-studio-e2e.mjs`
- `.github/workflows/seo-geo-foundation.yml`

The isolation gate compares every new commit against the safe base, so inherited Project 12 integration work is preserved while new changes are prevented from entering shared/Astra-owned files.

## Integration rule

No merge to `main` from this branch while concurrent work is active. After Astra/SEO work is approved and merged, create an explicit integration step against the then-current `main`, resolve conflicts consciously, run the full Restaurant Studio regression suite, obtain human visual approval, and only then merge Project 12.
