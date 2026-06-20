#!/usr/bin/env python3
"""
Build the theme's transparent Wapuu derivatives from the master art.

The master (hperkins-wapuu.png) ships on an opaque ~white field, which renders
as an ugly box behind the figure and muddies any small circular crop. This
script cuts two clean, transparent, trimmed assets the theme actually uses:

    wapuu-hero.png  full figure, used by the Wapuu homepage hero pattern
    wapuu-mark.png  square head crop, used as the compact header brand mark

Background removal is an EDGE-CONNECTED flood fill keyed on near-white, so
interior whites fenced by the black outline (the W logo, coffee cup, hoodie
strings, laptop screen) are preserved. A light feather kills the anti-aliased
halo. Requires Pillow:  py -3 -m pip install Pillow

Usage (from anywhere):  py -3 build-wapuu-assets.py
"""
from collections import deque
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
SRC = HERE / "hperkins-wapuu.png"
OUT_HERO = HERE / "wapuu-hero.png"
OUT_MARK = HERE / "wapuu-mark.png"

THRESH = 236          # channel >= THRESH counts as "white-ish"
FEATHER_LIGHT = 205   # opaque edge pixels lighter than this get alpha-scaled


def is_white(r, g, b):
    return r >= THRESH and g >= THRESH and b >= THRESH


def build():
    im = Image.open(SRC).convert("RGBA")
    W, H = im.size
    px = im.load()

    # --- border-connected flood fill over the white field ---
    bg = bytearray(W * H)
    visited = bytearray(W * H)
    q = deque()
    for x in range(W):
        q.append((x, 0)); q.append((x, H - 1))
    for y in range(H):
        q.append((0, y)); q.append((W - 1, y))
    while q:
        x, y = q.popleft()
        i = y * W + x
        if visited[i]:
            continue
        visited[i] = 1
        r, g, b, _ = px[x, y]
        if not is_white(r, g, b):
            continue
        bg[i] = 1
        if x > 0:     q.append((x - 1, y))
        if x < W - 1: q.append((x + 1, y))
        if y > 0:     q.append((x, y - 1))
        if y < H - 1: q.append((x, y + 1))

    def touches_bg(x, y):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and bg[ny * W + nx]:
                return True
        return False

    # --- clear background, feather the anti-aliased ring ---
    for y in range(H):
        for x in range(W):
            i = y * W + x
            r, g, b, a = px[x, y]
            if bg[i]:
                px[x, y] = (r, g, b, 0)
            elif touches_bg(x, y):
                m = min(r, g, b)
                if m >= FEATHER_LIGHT:
                    scale = max(0.0, (255 - m) / (255 - FEATHER_LIGHT))
                    px[x, y] = (r, g, b, int(a * scale))

    # --- full figure, trimmed with a hair of padding ---
    fig = im.crop(im.getbbox())
    fw, fh = fig.size
    pad = round(max(fw, fh) * 0.03)
    hero = Image.new("RGBA", (fw + 2 * pad, fh + 2 * pad), (0, 0, 0, 0))
    hero.paste(fig, (pad, pad), fig)
    hero.save(OUT_HERO)

    # --- head crop: square from the top, centered on the head's mass ---
    head_h = int(fh * 0.52)
    fpx = fig.load()
    sx = n = 0
    for y in range(head_h):
        for x in range(fw):
            if fpx[x, y][3] > 40:
                sx += x; n += 1
    cx = (sx / n) if n else fw / 2
    side = min(head_h, fw)
    left = max(0, min(int(round(cx - side / 2)), fw - side))
    head = fig.crop((left, 0, left + side, min(head_h, fh)))
    mpad = round(side * 0.06)
    mark = Image.new("RGBA", (head.width + 2 * mpad, head.height + 2 * mpad), (0, 0, 0, 0))
    mark.paste(head, (mpad, mpad), head)
    mark.save(OUT_MARK)

    print(f"wrote {OUT_HERO.name} {hero.size} and {OUT_MARK.name} {mark.size}")


if __name__ == "__main__":
    build()
