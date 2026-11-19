#!/usr/bin/env python3
"""Builds desktop/build/icon.ico (and icon.png) from the Android adaptive launcher foreground.

The Android icon is a foreground layer over a solid #0D0B0A background, so we composite the
same two layers onto a rounded square and export every Windows icon size.
Run from desktop/:  python3 scripts/make-icon.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
FG = ROOT.parent / "android-emberarena/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png"
OUT = ROOT / "build"
BG = (0x0D, 0x0B, 0x0A, 255)
SIZE = 512


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    fg = Image.open(FG).convert("RGBA")
    # Adaptive icons keep the safe zone in the centre 66%; crop to it so the mark fills the tile.
    w, h = fg.size
    inset = int(w * 0.17)
    fg = fg.crop((inset, inset, w - inset, h - inset)).resize((SIZE, SIZE), Image.LANCZOS)

    tile = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=int(SIZE * 0.22), fill=255)
    base = Image.new("RGBA", (SIZE, SIZE), BG)
    base.alpha_composite(fg)
    tile.paste(base, (0, 0), mask)

    tile.save(OUT / "icon.png")
    tile.save(OUT / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("wrote", OUT / "icon.ico")


if __name__ == "__main__":
    main()
