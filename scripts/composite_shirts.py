"""TYP0stet shirt composite — overlay logos at shirt-relative positions."""
from PIL import Image, ImageChops
from pathlib import Path

DOWNLOADS = Path("/Users/tig/Downloads")
OUT_DIR = Path("/Users/tig/typostet/lp/img/shirts")
OUT_DIR.mkdir(parents=True, exist_ok=True)

SHIRTS = {
    "bone-front":  "Gemini_Generated_Image_jc167qjc167qjc16.png",
    "bone-back":   "Gemini_Generated_Image_sho0i9sho0i9sho0.png",
    "mint-front":  "Gemini_Generated_Image_y2zc1dy2zc1dy2zc.png",
    "mint-back":   "Gemini_Generated_Image_psixzwpsixzwpsix.png",
    "olive-front": "Gemini_Generated_Image_e3870me3870me387.png",
    "olive-back":  "Gemini_Generated_Image_j1dxm0j1dxm0j1dx.png",
    "black-front": "Gemini_Generated_Image_klcjfkklcjfkklcj.png",
    "black-back":  "Gemini_Generated_Image_ud6hxzud6hxzud6h.png",
}

MONOGRAM = DOWNLOADS / "0 マーク.png"
TIMESTAMP = DOWNLOADS / "481 (1).png"
WORDMARK = DOWNLOADS / "TYP0文字ロゴ (1)/2.png"

CROP_RIGHT = 320
CROP_BOTTOM = 180

# Per-shirt horizontal body center (re-measured 06-04 via /tmp/measure_bodies.py
# scanning the chest band; visual chest-LEFT relative to actual body, not photo center)
SHIRT_BODY_X = {
    "bone-front":  1500, "bone-back":   1500,
    "mint-front":  1330, "mint-back":   1500,
    "olive-front": 1500, "olive-back":  1500,
    "black-front": 1500, "black-back":  1500,
}

CROP_X = {
    "bone-front":  1560, "bone-back":   1350,
    "mint-front":  1390, "mint-back":   1350,
    "olive-front": 1560, "olive-back":  1350,
    "black-front": 1560, "black-back":  1500,
}

# Logo offsets from shirt body center (px), cy/w are frame-fractions
LOGO = {
    "mono_front": dict(dx=-120, cy=0.30, w=0.030),  # one size smaller (0.035 → 0.030)
    "ts_front":   dict(dx=+400, cy=0.43, w=0.032),  # smaller than original 0.035, hand-drawn marker readable
    "wm_back":    dict(dx=-240, cy=0.76, w=0.095),
}

MONO_DX_BY_SHIRT = {
    "bone-front":  -260,
    "olive-front": -240,
    "black-front": -260,
}

TS_DX_BY_SHIRT = {
    "bone-front":  +380,
    "mint-front":  +540,
    "olive-front": +380,
    "black-front": +360,
}

TS_CY_BY_SHIRT = {
    "olive-front": 0.46,
    "black-front": 0.45,
}

# 4:81 sleeve engraving angle (degrees). Positive = counter-clockwise so the
# text runs parallel to the sleeve seam (rising from inner edge to outer edge
# on the viewer-right sleeve).
TS_SLEEVE_ANGLE = +22

INK = (14, 14, 14)
MINT = (146, 229, 189)
BONE = (244, 237, 223)


def recolor(logo, rgb):
    """Repaint logo with rgb while preserving its alpha mask."""
    alpha = logo.split()[3]
    new = Image.new("RGBA", logo.size, (*rgb, 255))
    new.putalpha(alpha)
    return new


def trim(img):
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def white_to_transparent(img, threshold=235):
    """Convert near-white pixels to fully transparent (for RGB-with-white-bg sources)."""
    img = img.convert("RGBA")
    new_data = []
    for r, g, b, a in img.getdata():
        if r >= threshold and g >= threshold and b >= threshold:
            new_data.append((r, g, b, 0))
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)
    return img


def find_shirt_bbox(img, bg_threshold=35):
    """Detect shirt bbox by diffing against a top-left sampled bg color."""
    rgb = img.convert("RGB")
    # sample bg from top-left 40x40
    bg_sample = rgb.crop((0, 0, 40, 40))
    bg_pixels = list(bg_sample.getdata())
    avg_r = sum(p[0] for p in bg_pixels) // len(bg_pixels)
    avg_g = sum(p[1] for p in bg_pixels) // len(bg_pixels)
    avg_b = sum(p[2] for p in bg_pixels) // len(bg_pixels)
    bg_img = Image.new("RGB", rgb.size, (avg_r, avg_g, avg_b))
    diff = ImageChops.difference(rgb, bg_img).convert("L")
    # threshold
    mask = diff.point(lambda p: 255 if p > bg_threshold else 0)
    bbox = mask.getbbox()
    return bbox


def place(canvas, logo, center_x_px, dx, cy, w):
    """Place logo at (center_x_px + dx) horizontal, cy * frame_height vertical."""
    fw, fh = canvas.size
    target_w = int(fw * w)
    target_h = int(target_w * logo.height / logo.width)
    sized = logo.resize((target_w, target_h), Image.LANCZOS)
    abs_x = (center_x_px + dx) - target_w // 2
    abs_y = int(fh * cy) - target_h // 2
    canvas.alpha_composite(sized, (abs_x, abs_y))


def crop_square_at(img, center_x):
    """Crop to 1:1 square centered horizontally at center_x."""
    iw, ih = img.size
    x0 = max(0, center_x - ih // 2)
    x1 = min(iw, x0 + ih)
    x0 = x1 - ih
    return img.crop((x0, 0, x1, ih))


mono = trim(Image.open(MONOGRAM).convert("RGBA"))
# new hand-drawn 4:81 PNG has white background instead of transparent, convert first
ts_raw = trim(white_to_transparent(Image.open(TIMESTAMP)))
wm = trim(Image.open(WORDMARK).convert("RGBA"))

# Rotate 4:81 to follow sleeve seam angle, then re-trim to drop transparent margins.
ts = trim(ts_raw.rotate(TS_SLEEVE_ANGLE, resample=Image.BICUBIC, expand=True))

# Ink-recolored variants (used on bone + mint shirts)
mono_ink = recolor(mono, INK)
ts_ink = recolor(ts, INK)
wm_ink = recolor(wm, INK)

# Bone-recolored variants (used on olive + black shirts)
mono_bone = recolor(mono, BONE)
ts_bone = recolor(ts, BONE)
wm_bone = recolor(wm, BONE)

for name, fname in SHIRTS.items():
    shirt = Image.open(DOWNLOADS / fname).convert("RGBA")
    shirt = shirt.crop((0, 0, shirt.width - CROP_RIGHT, shirt.height - CROP_BOTTOM))

    body_x = SHIRT_BODY_X[name]
    crop_x = CROP_X[name]
    # bone + mint shirts → all-ink logos; olive + black → all-bone logos
    if "bone" in name or "mint" in name:
        m_logo, t_logo, w_logo = mono_ink, ts_ink, wm_ink
    else:
        m_logo, t_logo, w_logo = mono_bone, ts_bone, wm_bone

    if "front" in name:
        m_args = dict(LOGO["mono_front"])
        if name in MONO_DX_BY_SHIRT:
            m_args["dx"] = MONO_DX_BY_SHIRT[name]
        place(shirt, m_logo, body_x, **m_args)
        ts_args = dict(LOGO["ts_front"])
        if name in TS_DX_BY_SHIRT:
            ts_args["dx"] = TS_DX_BY_SHIRT[name]
        if name in TS_CY_BY_SHIRT:
            ts_args["cy"] = TS_CY_BY_SHIRT[name]
        place(shirt, t_logo, body_x, **ts_args)
    else:
        place(shirt, w_logo, body_x, **LOGO["wm_back"])

    shirt = crop_square_at(shirt, crop_x)

    bg = Image.new("RGB", shirt.size, (236, 227, 207))
    bg.paste(shirt, mask=shirt.split()[3])
    out = OUT_DIR / f"{name}.jpg"
    bg.save(out, "JPEG", quality=88, optimize=True)
    print(f"saved: {out.name} ({bg.size[0]}×{bg.size[1]})")
