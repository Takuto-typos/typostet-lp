"""Build 3 reference PNGs to attach to Gemini for SKU mockup generation.

Output: ~/typostet/lp/img/gemini-reference/
  01-monogram.png         (brushed '0' ink black + 4 mint dots on white)
  02-wordmark.png         (TYP0stet handwritten wordmark: TYP0 black + stet mint, on white)
  03-handdrawn-481.png    (existing hand-drawn 4:81 marker, on white)

Source files:
  /Users/tig/typostet/lp/assets/brand/monogram/tentative-final.svg
  /Users/tig/typostet/lp/assets/brand/wordmark/2.svg
  /Users/tig/typostet/lp/assets/brand/timestamp/handdrawn-481.png

Uses macOS qlmanage (Quick Look) for SVG → PNG. No cairo needed.
"""
import os
import shutil
import subprocess
import tempfile
from PIL import Image, ImageDraw

SRC = os.path.expanduser('~/typostet/lp/assets/brand')
DEST = os.path.expanduser('~/typostet/lp/img/gemini-reference')
os.makedirs(DEST, exist_ok=True)


def render_svg_to_png(svg_path_or_text, out_path, render_size=2000, final_padding_ratio=0.08):
    """Render SVG via qlmanage; trim to content; add padding; flatten on white."""
    with tempfile.TemporaryDirectory() as tmp:
        if os.path.exists(str(svg_path_or_text)):
            svg_in = svg_path_or_text
        else:
            svg_in = os.path.join(tmp, 'in.svg')
            with open(svg_in, 'w') as f:
                f.write(svg_path_or_text)

        subprocess.run(
            ['qlmanage', '-t', '-s', str(render_size), '-o', tmp, svg_in],
            check=True, capture_output=True,
        )
        rendered = os.path.join(tmp, os.path.basename(svg_in) + '.png')
        if not os.path.exists(rendered):
            raise RuntimeError(f'qlmanage failed: {rendered}')

        # Flatten on white background
        im = Image.open(rendered).convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        flat = Image.alpha_composite(bg, im).convert('RGB')

        # Trim to content using grayscale threshold (any pixel darker than near-white)
        gray = flat.convert('L')
        mask = gray.point(lambda v: 0 if v >= 248 else 255).convert('L')
        bbox = mask.getbbox()
        if bbox:
            # add a small inset margin (1%) before crop to avoid clipping any anti-aliased edges
            inset = max(2, max(flat.size) // 200)
            l, t, r, b = bbox
            l = max(0, l - inset)
            t = max(0, t - inset)
            r = min(flat.size[0], r + inset)
            b = min(flat.size[1], b + inset)
            flat = flat.crop((l, t, r, b))

        # Final padding (white)
        pad = int(max(flat.size) * final_padding_ratio)
        canvas = Image.new('RGB', (flat.width + pad * 2, flat.height + pad * 2), 'white')
        canvas.paste(flat, (pad, pad))
        canvas.save(out_path, 'PNG')


def normalize_existing_png(in_path, out_path, final_padding_ratio=0.08):
    """Same crop + padding logic, for an existing PNG."""
    im = Image.open(in_path).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    flat = Image.alpha_composite(bg, im).convert('RGB')
    gray = flat.convert('L')
    mask = gray.point(lambda v: 0 if v >= 248 else 255).convert('L')
    bbox = mask.getbbox()
    if bbox:
        inset = max(2, max(flat.size) // 200)
        l, t, r, b = bbox
        l = max(0, l - inset)
        t = max(0, t - inset)
        r = min(flat.size[0], r + inset)
        b = min(flat.size[1], b + inset)
        flat = flat.crop((l, t, r, b))
    pad = int(max(flat.size) * final_padding_ratio)
    canvas = Image.new('RGB', (flat.width + pad * 2, flat.height + pad * 2), 'white')
    canvas.paste(flat, (pad, pad))
    canvas.save(out_path, 'PNG')


# 1. monogram — render the '0' alone via qlmanage (Canva dots render as half-moons
#    due to a qlmanage rendering bug, regardless of clipPath or <circle> form),
#    then draw four full circular dots beneath the '0' via Pillow.
mono_src = os.path.join(SRC, 'monogram', 'tentative-final.svg')
with open(mono_src) as f:
    mono_svg = f.read()
# Strip everything from the first dot group onwards, close svg cleanly
dot_start = mono_svg.find('<g clip-path="url(#bf22d36156)">')
if dot_start > -1:
    mono_svg = mono_svg[:dot_start] + '</svg>'

with tempfile.TemporaryDirectory() as _tmp:
    zero_only = os.path.join(_tmp, 'zero.png')
    render_svg_to_png(mono_svg, zero_only, render_size=2000, final_padding_ratio=0.02)

    zero_img = Image.open(zero_only).convert('RGB')
    gray = zero_img.convert('L')
    mask = gray.point(lambda v: 0 if v >= 248 else 255).convert('L')
    bbox = mask.getbbox()  # tight bbox of the '0'
    z_l, z_t, z_r, z_b = bbox
    zero_w = z_r - z_l

    # Dot geometry, sized relative to the '0'
    dot_r = int(zero_w * 0.075)
    dot_gap = int(zero_w * 0.12)
    total_dots_w = dot_r * 8 + dot_gap * 3
    dot_y = z_b + int(zero_w * 0.20) + dot_r

    # Build a canvas tall enough for '0' + gap + dots + bottom margin
    pad_bottom = int(zero_w * 0.20)
    pad_side = int(zero_w * 0.15)
    pad_top = int(zero_w * 0.15)
    canvas_w = max(zero_img.width, total_dots_w + pad_side * 2)
    canvas_h = dot_y + dot_r + pad_bottom

    # Compose: white canvas, paste the cropped '0' centered, draw dots below
    canvas = Image.new('RGB', (canvas_w, canvas_h + pad_top), 'white')
    zero_cropped = zero_img.crop((z_l, z_t, z_r, z_b))
    paste_x = (canvas_w - zero_cropped.width) // 2
    canvas.paste(zero_cropped, (paste_x, pad_top))

    # Recompute dot baseline relative to the pasted '0' bottom
    zero_paste_bottom = pad_top + zero_cropped.height
    dot_baseline = zero_paste_bottom + int(zero_w * 0.20) + dot_r

    draw = ImageDraw.Draw(canvas)
    mint = (146, 229, 189)
    dot_center_x_start = (canvas_w - total_dots_w) // 2 + dot_r
    for i in range(4):
        cx = dot_center_x_start + i * (dot_r * 2 + dot_gap)
        cy = dot_baseline
        draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=mint)

    # Final canvas height adjustment so there's matching bottom padding
    final_h = dot_baseline + dot_r + pad_bottom
    final = Image.new('RGB', (canvas_w, final_h), 'white')
    final.paste(canvas.crop((0, 0, canvas_w, min(canvas.height, final_h))), (0, 0))
    final.save(os.path.join(DEST, '01-monogram.png'), 'PNG')

# 2. wordmark/2.svg — already has TYP0 in #0e0e0e and stet in #92e5bd.
# qlmanage clips the original viewBox (content overflows right edge), so expand it.
import re
word_src = os.path.join(SRC, 'wordmark', '2.svg')
with open(word_src) as f:
    word_svg = f.read()
word_svg = re.sub(r'viewBox="0 0 [\d.]+ [\d.]+"', 'viewBox="0 0 3000 1700"', word_svg)
word_svg = re.sub(r'\swidth="[^"]+"', ' width="3000"', word_svg, count=1)
word_svg = re.sub(r'\sheight="[^"]+"', ' height="1700"', word_svg, count=1)
render_svg_to_png(word_svg, os.path.join(DEST, '02-wordmark.png'), render_size=3000)

# 3. handdrawn-481.png — normalize (crop + pad) the existing PNG
normalize_existing_png(
    os.path.join(SRC, 'timestamp', 'handdrawn-481.png'),
    os.path.join(DEST, '03-handdrawn-481.png'),
)

print('Reference set built:')
for fname in sorted(os.listdir(DEST)):
    p = os.path.join(DEST, fname)
    size_kb = os.path.getsize(p) / 1024
    im = Image.open(p)
    print(f'  {fname}  {im.size[0]}x{im.size[1]}  ({size_kb:.1f} KB)')
