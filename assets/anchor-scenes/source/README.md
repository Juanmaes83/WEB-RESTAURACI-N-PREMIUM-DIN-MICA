# assets/anchor-scenes/source

**The real master scenes now live in `MANO+OBJETO/` at the repository root**, and the
pipeline that consumes them is `scripts/ingest-anchor-scenes.mjs`. This folder is kept
for `scripts/build-anchor-scenes.mjs`, the development fallback that composes a proxy
set when no photography exists yet; that generator writes to
`assets/anchor-scenes/proxy-dev/` and can no longer touch the real runtime set.

## Adding or replacing a master scene

Drop the file in `MANO+OBJETO/`, add it to the curation table at the top of
`scripts/ingest-anchor-scenes.mjs` (which dish it belongs to, and the slug), then run:

```
node scripts/ingest-anchor-scenes.mjs
node scripts/audit-anchor-scenes.mjs
```

The ingest measures every source, decides which ones belong to the same take, solves
the registration that puts their anchors on top of each other, and writes the runtime
assets and `scenes-manifest.json`. Registration is never baked into the pixels: it
lives in the manifest, so a scene that sits a few pixels off is corrected by its own
numbers.

What a scene has to satisfy to be selected:

- the same canvas and orientation as the rest of the take;
- the object within 4.5% of the take's scale and 4.5% of the frame in position;
- the finger zone within 20/255 mean difference, and under 8.5% of pixels moved.

That last one is the strict gate, and it is the one that matters: the palm and the
wrist can be pixel-identical while a differently sized object moves the fingers that
wrap it. A scene failing any of these is reported under `excluded` in the manifest
with the measured reason — it is not silently dropped, and it is not forced through.
