#!/usr/bin/env python3
"""Convert capture-screens.mjs PNGs into web-sized WebP files in public/screens/.

Usage: python3 scripts/screens-to-webp.py <png-dir>
"""
import os, sys
from PIL import Image

src = sys.argv[1]
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "screens")
os.makedirs(dst, exist_ok=True)
for name in sorted(os.listdir(src)):
    if not name.endswith(".png") or name.startswith("combo"):
        continue
    im = Image.open(os.path.join(src, name)).convert("RGB")
    limit = 900 if name.startswith("mobile") else 2400
    if im.width > limit:
        im = im.resize((limit, round(im.height * limit / im.width)), Image.LANCZOS)
    out = os.path.join(dst, name[:-4] + ".webp")
    im.save(out, "WEBP", quality=82, method=6)
    print(f"{out}  {im.width}x{im.height}  {os.path.getsize(out) // 1024} KB")
