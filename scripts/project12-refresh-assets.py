from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "kinetic-product-selector"
FILES = [
    "01-midnight-wagyu.webp",
    "02-ramen-riot.webp",
    "03-glazed-outlaw.webp",
    "04-beet-royale.webp",
    "05-tidal-gold.webp",
    "06-lava-brisket.webp",
]

MIN_LONG_EDGE = 640
SCALE = 3

for name in FILES:
    path = ASSET_DIR / name
    if not path.exists():
        raise SystemExit(f"Missing Project 12 asset: {path}")

    with Image.open(path) as src:
        src = src.convert("RGBA")
        w, h = src.size
        if max(w, h) >= MIN_LONG_EDGE:
            print(f"KEEP {name}: {w}x{h}")
            continue

        target = (w * SCALE, h * SCALE)
        out = src.resize(target, Image.Resampling.LANCZOS)
        # Mild edge recovery only. This avoids browser-side 2.5x–3x scaling blur;
        # it does not claim to recreate detail absent from the original crop.
        rgb = out.convert("RGB").filter(ImageFilter.UnsharpMask(radius=1.15, percent=105, threshold=2))
        alpha = out.getchannel("A")
        out = rgb.convert("RGBA")
        out.putalpha(alpha)
        out.save(path, "WEBP", quality=92, method=6, exact=True)
        print(f"UPSCALE {name}: {w}x{h} -> {target[0]}x{target[1]}")
