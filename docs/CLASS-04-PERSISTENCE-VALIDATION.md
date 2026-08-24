# CLASS 04 — Persistence & Media Validation

## Scope

This document records the repair and browser validation performed after the Studio could open but project/media changes did not reliably survive reloads.

## Root causes

1. The IndexedDB helper resolved writes from `request.onsuccess` instead of waiting for the transaction `oncomplete` event.
2. Temporary `blob:` URLs were being confused with durable media references. A blob URL is only a session preview; on reload the Blob must be read again from IndexedDB and a new object URL created.
3. The Class 04 runtime still contained legacy Studio open/close GSAP code alongside the CSS-driven Studio shell.
4. The previous standalone validation file used localStorage/Object URLs and therefore was not a valid proof of durable media persistence.

## Repairs

- `class4-store.js` upgraded to DB schema version 2.
- Project and media writes now resolve only after IndexedDB transaction completion.
- Added `tx.onerror` and `tx.onabort` handling.
- Added `RestaurantStore.verifyPersistence()` self-test.
- `app-v4.js` rebuilt around one save queue and explicit `saveNow()`.
- Uploaded image/video files are stored as Blob/File records in IndexedDB.
- On boot, Blob/File records are rehydrated into newly created Object URLs.
- Media upload status now distinguishes `Guardando media…`, `Media guardada ✓`, and errors.
- Project status now reports `Guardado ✓` / `Proyecto restaurado ✓` only after verified storage operations.
- Media cards identify restored local files as `Guardado local ✓`.
- Added safe visual fallback for unavailable remote placeholder images.
- Studio open/close ownership remains in the synchronous CSS shell; the runtime no longer controls the drawer transform.

## Browser E2E test

Environment: headless Chromium through Playwright, repository branch served over local HTTP.

Test sequence:

1. Load the real branch from GitHub.
2. Open Studio.
3. Change brand name to `DECANO TEST`.
4. Upload a generated PNG to the Origin slot.
5. Upload a generated MP4 to the Atmosphere slot.
6. Rename first dish to `Persistent Dish`.
7. Wait for save completion.
8. Reload the page.
9. Re-open Studio.
10. Verify brand, image, video and dish are restored.
11. Verify Atmosphere is rendered as a `<video>` element after reload.
12. Check page runtime errors.

Observed result:

```json
{
  "PASS": true,
  "statusBeforeReload": "Guardado ✓",
  "statusAfterReload": "Proyecto restaurado ✓",
  "brand": "DECANO TEST",
  "image": "Guardado local ✓",
  "video": "Guardado local ✓",
  "dish": "Persistent Dish",
  "videoCount": 1,
  "pageErrors": []
}
```

## Acceptance status

- Studio opens: PASS
- Text/project persistence after reload: PASS
- Image persistence after reload: PASS
- Video persistence after reload: PASS
- Dish edit persistence after reload: PASS
- Video rehydration to DOM after reload: PASS
- Runtime page errors during test: PASS (none)

## Remaining delivery layer

This validates the application itself over HTTP. Public hosting must still be validated independently. A URL must not be marked as accepted until the public deployment returns successfully and the same Studio workflow is exercised there.
