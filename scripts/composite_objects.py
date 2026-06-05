"""Composite TYP0stet brand logos onto bag/sticker material images.

Sources:
  ~/typostet/lp/img/{tote,knapsack,stickers}/raw/*-material.png

Outputs:
  ~/typostet/lp/img/tote/tote-main.jpg       (bone tote + ink logos)
  ~/typostet/lp/img/tote/tote-ink.jpg        (black tote + bone logos)
  ~/typostet/lp/img/knapsack/knapsack-main.jpg  (olive knapsack + bone logos)
  ~/typostet/lp/img/knapsack/knapsack-mint.jpg  (mint knapsack + ink logos)
  ~/typostet/lp/img/stickers/sticker-pack.jpg   (3 white stickers w/ original logo colors)
"""
import os
from PIL import Image

LP = os.path.expanduser('~/typostet/lp')

# Brand colors
INK = (14, 14, 14)
BONE = (244, 237, 223)

# ─── helpers ─────────────────────────────────────────────

def white_to_transparent(img, threshold=235):
    img = img.convert('RGBA')
    pixels = img.load()
    W, H = img.size
    for x in range(W):
        for y in range(H):
            r, g, b, a = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
    return img


def trim(img):
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def recolor(img, rgb):
    img = img.convert('RGBA')
    alpha = img.split()[3]
    new = Image.new('RGBA', img.size, (*rgb, 255))
    new.putalpha(alpha)
    return new


def place(canvas, logo, cx_pct, cy_pct, w_pct):
    cw, ch = canvas.size
    tw = int(cw * w_pct)
    th = int(tw * logo.height / logo.width)
    sized = logo.resize((tw, th), Image.LANCZOS)
    ax = int(cw * cx_pct) - tw // 2
    ay = int(ch * cy_pct) - th // 2
    canvas.alpha_composite(sized, (ax, ay))


def paint_over_watermark(rgba, frac_w=0.10, frac_h=0.10):
    """Paint over Gemini ✦ at the bottom-right with a sample of the adjacent area."""
    W, H = rgba.size
    pw, ph = int(W * frac_w), int(H * frac_h)
    # Sample a clean patch from immediately above the watermark area
    sample_x1, sample_y1 = W - pw, max(0, H - ph * 2 - 20)
    sample_x2, sample_y2 = W, H - ph - 10
    if sample_y2 - sample_y1 < 10:
        return rgba
    patch = rgba.crop((sample_x1, sample_y1, sample_x2, sample_y2))
    patch_resized = patch.resize((pw, ph), Image.LANCZOS)
    rgba.alpha_composite(patch_resized, (W - pw, H - ph))
    return rgba


def save_jpg(rgba, out_path, max_w=1500, bg_color=(255, 255, 255), trim_watermark=True):
    if trim_watermark:
        rgba = paint_over_watermark(rgba, frac_w=0.08, frac_h=0.08)
    bg = Image.new('RGB', rgba.size, bg_color)
    bg.paste(rgba, mask=rgba.split()[3])
    if bg.width > max_w:
        ratio = max_w / bg.width
        bg = bg.resize((max_w, int(bg.height * ratio)), Image.LANCZOS)
    bg.save(out_path, 'JPEG', quality=85, optimize=True)


# ─── load brand logos ────────────────────────────────────
REF = LP + '/img/gemini-reference'
mono = trim(white_to_transparent(Image.open(REF + '/01-monogram.png')))
word = trim(white_to_transparent(Image.open(REF + '/02-wordmark.png')))
ts = trim(white_to_transparent(Image.open(REF + '/03-handdrawn-481.png')))


# ─── tote / knapsack composite ──────────────────────────
def compose_bag(src_path, out_path, color, mono_pos, ts_pos, word_pos,
                mono_w=0.06, ts_w=0.05, word_w=0.13, crop=None):
    bag = Image.open(src_path).convert('RGBA')
    mono_rc = recolor(mono, color)
    ts_rc = recolor(ts, color)
    word_rc = recolor(word, color)
    place(bag, mono_rc, *mono_pos, mono_w)
    place(bag, ts_rc, *ts_pos, ts_w)
    place(bag, word_rc, *word_pos, word_w)
    if crop:
        bag = bag.crop(crop)
    save_jpg(bag, out_path)


# Tote bone (white) — black logos
# Spacing: monogram upper-center, 4:81 mid-right, wordmark bottom-center.
# Keep enough gap between 4:81 and wordmark to avoid overlap.
compose_bag(
    LP + '/img/tote/raw/tote-bone-material.png',
    LP + '/img/tote/tote-main.jpg',
    INK,
    mono_pos=(0.45, 0.43),
    ts_pos=(0.55, 0.56),
    word_pos=(0.45, 0.70),
    mono_w=0.055, ts_w=0.035, word_w=0.11,
)

# Tote ink (black) — bone logos
compose_bag(
    LP + '/img/tote/raw/tote-ink-material.png',
    LP + '/img/tote/tote-ink.jpg',
    BONE,
    mono_pos=(0.45, 0.43),
    ts_pos=(0.55, 0.56),
    word_pos=(0.45, 0.70),
    mono_w=0.055, ts_w=0.035, word_w=0.11,
)

# Knapsack mint — black logos
# Monogram below the drawstring gathers (around y 0.50), 4:81 mid-body, wordmark lower.
compose_bag(
    LP + '/img/knapsack/raw/knapsack-mint-material.png',
    LP + '/img/knapsack/knapsack-mint.jpg',
    INK,
    mono_pos=(0.50, 0.50),
    ts_pos=(0.56, 0.62),
    word_pos=(0.50, 0.74),
    mono_w=0.040, ts_w=0.025, word_w=0.085,
)

# Knapsack olive — bone logos
compose_bag(
    LP + '/img/knapsack/raw/knapsack-olive-material.png',
    LP + '/img/knapsack/knapsack-main.jpg',
    BONE,
    mono_pos=(0.50, 0.50),
    ts_pos=(0.56, 0.62),
    word_pos=(0.50, 0.74),
    mono_w=0.040, ts_w=0.025, word_w=0.085,
)


# ─── sticker composite (keep original logo colors) ──────
# Sticker layout (2048x2048 square):
#   circle sticker:    centered around (0.30, 0.30), diameter ~0.30
#   wordmark rect:     centered around (0.66, 0.51), wide ~0.32 × 0.10
#   4:81 rect:         centered around (0.36, 0.77), wide ~0.32 × 0.10
sticker = Image.open(LP + '/img/stickers/raw/sticker-blank-material.png').convert('RGBA')
# 円形 → 0 monogram (mint), fit within circle
place(sticker, mono, 0.30, 0.30, 0.13)
# 長方形 upper-right → wordmark, sized so the whole "TYP0stet" fits inside the rect
place(sticker, word, 0.66, 0.50, 0.105)
# 長方形 lower-left → 4:81 hand-drawn
place(sticker, ts, 0.36, 0.77, 0.20)
save_jpg(sticker, LP + '/img/stickers/sticker-pack.jpg')


print('All composites saved:')
for p in ['img/tote/tote-main.jpg', 'img/tote/tote-ink.jpg',
          'img/knapsack/knapsack-main.jpg', 'img/knapsack/knapsack-mint.jpg',
          'img/stickers/sticker-pack.jpg']:
    full = os.path.join(LP, p)
    if os.path.exists(full):
        size_kb = os.path.getsize(full) // 1024
        im = Image.open(full)
        print(f'  {p}  {im.size[0]}×{im.size[1]}  {size_kb} KB')
