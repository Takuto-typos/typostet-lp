# TYP0stet — Gemini 一発生成 prompts (logo attachment 込み)

ロゴを Gemini に渡して、bag/sticker に直接焼き込んで生成する方式。
Pillow composite は使わない。

## 共通 attachment

各 prompt の頭に **3 枚** 添付:

- **Image 1** — `~/typostet/lp/img/gemini-reference/01-monogram.png` ─ 0 monogram (textured brush '0' + 4 mint dots)
- **Image 2** — `~/typostet/lp/img/gemini-reference/02-wordmark.png` ─ TYP0stet wordmark (TYP0 ink black + stet mint green)
- **Image 3** — `~/typostet/lp/img/gemini-reference/03-handdrawn-481.png` ─ 4:81 hand-drawn marker (mint green)

---

## 1. Sticker pack (3-piece, square 1:1)

```
ATTACHED REFERENCE IMAGES (mandatory):
- Image 1 = TYP0stet '0' monogram (textured brushstroke zero + mint green dots)
- Image 2 = TYP0stet wordmark "TYP0stet" (TYP0 in ink black + stet in mint green)
- Image 3 = TYP0stet 4:81 hand-drawn marker (mint green)

CRITICAL: Reproduce these three logos EXACTLY as in the attachments — do not redraw, do not restyle, do not change colors. The mint dots, the ink/mint two-tone wordmark, and the hand-drawn 4:81 must all match the references.

SCENE:
Top-down 90-degree flat-lay product photography of a 3-piece die-cut vinyl sticker pack arranged for a PERFECT 1:1 SQUARE composition.

STICKER 1 — CIRCULAR die-cut sticker, ~6cm diameter, white vinyl background, slightly tilted at 4 degrees, placed in the UPPER-LEFT area of the frame. The sticker shows Image 1 (the '0' monogram with mint dots) centered on it, at native size and color.

STICKER 2 — LARGER horizontal RECTANGULAR die-cut sticker, ~8cm × 2.8cm, white vinyl background, slightly tilted at -3 degrees, placed in the MIDDLE-RIGHT area of the frame. The sticker shows Image 2 (the TYP0stet wordmark, "TYP0" in ink black + "stet" in mint green) centered on it.

STICKER 3 — SMALLER horizontal RECTANGULAR die-cut sticker, ~6.5cm × 2.3cm, white vinyl background, slightly tilted at 6 degrees, placed in the LOWER-LEFT area of the frame. The sticker shows Image 3 (the 4:81 hand-drawn marker, mint green) centered on it.

All three stickers have a soft matte vinyl finish, slight gloss only on the cut die edge.

BACKGROUND: Natural unbleached linen with subtle weave texture. Soft northern window light from upper left creating gentle fabric-weave shadows. A small natural kraft paper envelope partially visible at the upper-right corner of the frame.

SQUARE 1:1 ASPECT RATIO. Realistic editorial commerce product photography, 8K resolution, sharp focus, linen weave visible. NO additional logos, NO text overlays, NO watermarks, NO Gemini signature.
```

---

## 2. Tote — 白 (Bone) front view, ink black logos

```
ATTACHED REFERENCE IMAGES (mandatory):
- Image 1 = TYP0stet '0' monogram (textured brushstroke zero + mint dots)
- Image 2 = TYP0stet wordmark "TYP0stet" (TYP0 ink + stet mint)

CRITICAL: Reproduce both logos faithfully on the tote — preserve the brushstroke imperfections of the '0', the handwritten letterforms of the wordmark, the dot positions EXACTLY as in the attachments. The logos must be SILK-SCREEN PRINTED in DEEP INK BLACK (recolor from mint/two-tone to monochrome ink black for printing on the natural canvas — preserve the SHAPE and details, change only the color).

PRODUCT:
A heavy 12oz natural cotton canvas tote bag in unbleached "BONE" color (warm cream off-white, NOT pure white). Boxy A4-portrait silhouette, approximately W36 × H40 × D12 cm, self-standing UPRIGHT and facing the CAMERA STRAIGHT-ON (perfect FRONT VIEW, NOT angled, NOT 3/4 view) on a worn wide-plank light oak floor. Shoulder-length handles (~60cm) in the same canvas fabric, both handles visible at the top.

LOGO PLACEMENT (silk-screen printed in INK BLACK on the front panel — ONLY two logos, no 4:81):
- UPPER-CENTER of the front, perfectly centered horizontally (about 11cm down from the top edge): Image 1 — the '0' monogram, approximately 3cm wide. VERY SMALL and subtle, much smaller than typical brand prints.
- LOWER-CENTER of the front, perfectly centered horizontally (about 10cm up from the bottom edge): Image 2 — the TYP0stet wordmark, approximately 6cm wide. ALSO SMALL and subtle.

DO NOT print any 4:81 marker, no third logo, no sleeve graphic, no side label — ONLY these two prints, centered, small.

Both logos must be SILK-SCREEN PRINTED INTO the canvas (slightly absorbed into the weave, NOT glossy, NOT sticker-like).

SCENE:
Soft natural window light from upper left, gentle shadow falling to the lower right. Camera directly in front of the tote (front view, not angled). Background: out-of-focus warm gray plaster wall. Nothing else in the frame — no books, no notebooks, no props.

Realistic editorial commerce product photography, 8K resolution, sharp focus on the tote, canvas weave clearly visible. NO models, NO hands, NO people, NO text overlays, NO watermarks, NO Gemini signature.
```

---

## 3. Tote — 黒 (Ink Black) front view, bone white logos

```
ATTACHED REFERENCE IMAGES (mandatory):
- Image 1 = TYP0stet '0' monogram (textured brushstroke zero + mint dots)
- Image 2 = TYP0stet wordmark "TYP0stet" (TYP0 ink + stet mint)

CRITICAL: Reproduce both logos faithfully on the tote — preserve the brushstroke imperfections, the handwritten letterforms, the dot positions EXACTLY as in the attachments. The logos must be SILK-SCREEN PRINTED in BONE / CREAM OFF-WHITE (recolor from mint/two-tone to monochrome bone cream for printing on the dark canvas — preserve the SHAPE and details, change only the color).

PRODUCT:
A heavy 12oz cotton canvas tote bag in deep INK BLACK color (a soft washed black with slight warm undertone, like aged Japanese sumi-ink black, NOT pure jet black). Boxy A4-portrait silhouette, approximately W36 × H40 × D12 cm, self-standing UPRIGHT and facing the CAMERA STRAIGHT-ON (perfect FRONT VIEW, NOT angled) on a worn wide-plank light oak floor. Shoulder-length handles in the same ink black canvas fabric.

LOGO PLACEMENT (silk-screen printed in BONE CREAM on the front panel — ONLY two logos, no 4:81):
- UPPER-CENTER of the front, perfectly centered horizontally (~11cm from the top): Image 1 — the '0' monogram, ~3cm wide. VERY SMALL and subtle.
- LOWER-CENTER of the front, perfectly centered horizontally (~10cm from the bottom): Image 2 — the TYP0stet wordmark, ~6cm wide. ALSO SMALL and subtle.

DO NOT print any 4:81 marker, no third logo, no sleeve graphic, no side label — ONLY these two prints, centered, small.

Both logos SILK-SCREEN PRINTED in BONE CREAM, slightly absorbed into the dark canvas weave.

SCENE:
Soft natural window light from upper left, lighting tuned to reveal weave texture on the dark canvas without harsh highlights. Camera directly in front (front view). Background: out-of-focus warm gray plaster wall. Nothing else in the frame.

Realistic editorial commerce product photography, 8K resolution, sharp focus, canvas weave visible. NO models, NO hands, NO people, NO text overlays, NO watermarks, NO Gemini signature.
```

---

## 4. Knapsack — Mint front view, ink black logos

```
ATTACHED REFERENCE IMAGES (mandatory):
- Image 1 = TYP0stet '0' monogram
- Image 2 = TYP0stet wordmark "TYP0stet"
- Image 3 = TYP0stet 4:81 hand-drawn marker

CRITICAL: Reproduce the three logos faithfully — preserve brushstroke imperfections, handwritten letterforms, hand-drawn quality EXACTLY as in the attachments. SILK-SCREEN PRINTED in DEEP INK BLACK (recolor from mint to ink black — preserve SHAPE, change only color).

PRODUCT:
A waxed cotton canvas drawstring knapsack (cinch bag) in soft MINT GREEN color (pistachio sea #92E5BD, washed pale mint, low saturation, NOT bright lime). Trapezoidal silhouette, approximately W40 × H46 cm, narrower at the top, wider at the base. Drawstring closure at the top cinched gently with natural ecru cotton cord. Antique brass eyelets at the bottom corners with the cotton cord exiting and looping back up to form shoulder straps.

The knapsack is photographed FRONT VIEW (facing the camera straight-on, NOT angled, NOT 3/4 view), hanging from a single matte black nail on a raw textured plaster wall.

LOGO PLACEMENT (silk-screen printed in INK BLACK on the front panel):
- UPPER-CENTER of the front, below the drawstring gathers (about 12cm down from the top cinch): Image 1 — the '0' monogram, ~5cm wide. SMALL.
- MIDDLE-RIGHT of the front (~3cm from right edge, ~22cm from top): Image 3 — the 4:81 marker, ~3cm wide. SMALL.
- LOWER-CENTER of the front (about 12cm up from the bottom edge): Image 2 — the TYP0stet wordmark, ~9cm wide. Largest of the three.

All three logos SILK-SCREEN PRINTED in INK BLACK, slightly absorbed into the waxed canvas weave.

SCENE:
Soft diagonal cast shadow to the right. Natural soft light from upper left, slightly diffused. Background: warm pale gray plaster wall (slightly imperfect). Lived-in editorial catalog vibe (A.P.C. or Drake's lookbook mood).

Realistic editorial commerce product photography, 8K resolution, sharp focus on the bag, wax-canvas texture visible. NO models, NO hands, NO people, NO text overlays, NO watermarks, NO Gemini signature.
```

---

## 5. Knapsack — Olive front view, bone white logos

```
ATTACHED REFERENCE IMAGES (mandatory):
- Image 1 = TYP0stet '0' monogram
- Image 2 = TYP0stet wordmark "TYP0stet"
- Image 3 = TYP0stet 4:81 hand-drawn marker

CRITICAL: Reproduce the three logos faithfully — preserve brushstroke imperfections, handwritten letterforms, hand-drawn quality EXACTLY as in the attachments. SILK-SCREEN PRINTED in BONE / CREAM OFF-WHITE (recolor from mint to bone — preserve SHAPE, change only color).

PRODUCT:
A waxed cotton canvas drawstring knapsack (cinch bag) in muted military OLIVE color (washed olive drab, low saturation, NOT bright). Trapezoidal silhouette, approximately W40 × H46 cm, narrower at the top, wider at the base. Drawstring closure at the top cinched with natural ecru cotton cord. Antique brass eyelets at the bottom corners with the cord exiting and looping back up to form shoulder straps.

The knapsack is photographed FRONT VIEW (facing the camera straight-on, NOT angled, NOT 3/4 view), hanging from a single matte black nail on a raw textured plaster wall.

LOGO PLACEMENT (silk-screen printed in BONE CREAM on the front panel):
- UPPER-CENTER, below the drawstring gathers (~12cm from top cinch): Image 1 — '0' monogram, ~5cm wide. SMALL.
- MIDDLE-RIGHT (~3cm from right edge, ~22cm from top): Image 3 — 4:81 marker, ~3cm wide. SMALL.
- LOWER-CENTER (~12cm from the bottom): Image 2 — TYP0stet wordmark, ~9cm wide. Largest.

All three logos SILK-SCREEN PRINTED in BONE CREAM, slightly absorbed into the waxed olive canvas weave.

SCENE:
Soft diagonal cast shadow to the right. Natural soft light from upper left. Background: warm pale gray plaster wall. Lived-in editorial catalog vibe.

Realistic editorial commerce product photography, 8K resolution, sharp focus, wax-canvas texture visible. NO models, NO hands, NO people, NO text overlays, NO watermarks, NO Gemini signature.
```

---

## 注意点

- **logo 3 枚 attach 必須** — Gemini に SHAPE を伝えるため
- **「recolor from mint to ink black / bone cream」「preserve SHAPE, change only color」を強調** — 色だけ変えて形は維持
- **「SMALL」「approximately Xcm wide」を強調** — Gemini はロゴ巨大化しがち、絶対 size 指示
- **「FRONT VIEW」「NOT angled」「NOT 3/4」** — bag 正面向きの強制
- **「NO watermarks」「NO Gemini signature」** — ✦ マーク防止 (完全防止不可、生成後 crop 必要なら)
- 生成後 → `~/typostet/lp/img/{tote,knapsack,stickers}/raw/` に保存 → 私が crop + LP 入れ替え

---

# Hero lifestyle — 沖縄海 × ソロ女性 × 4 colors (shirt attachment 必須)

LP の Hero slider (`/img/hero/output/hero-1.jpg` 〜 `hero-4.jpg`) 用。

### 使い方

各色 1 シーン、Gemini に **2 枚 attach**:

| 色 | Image #1 (front) | Image #2 (back) |
|---|---|---|
| BONE | `~/typostet/lp/img/shirts/bone-front.jpg` | `~/typostet/lp/img/shirts/bone-back.jpg` |
| MINT | `~/typostet/lp/img/shirts/mint-front.jpg` | `~/typostet/lp/img/shirts/mint-back.jpg` |
| OLIVE | `~/typostet/lp/img/shirts/olive-front.jpg` | `~/typostet/lp/img/shirts/olive-back.jpg` |
| INK BLACK | `~/typostet/lp/img/shirts/black-front.jpg` | `~/typostet/lp/img/shirts/black-back.jpg` |

### 共通 prompt (`{COLOR}` と `{COLOR_DESC}` を差し替え)

```
ATTACHED REFERENCE IMAGES (mandatory):
- Image 1 = the FRONT of the TYP0stet Stet 01 T-shirt in {COLOR}, showing the small '0' monogram print on the left chest and a small '4:81' marker on the right sleeve
- Image 2 = the BACK of the same shirt, showing the TYP0stet wordmark print across the lower back

CRITICAL: The woman in the generated image must be wearing THE EXACT SAME SHIRT as in the attachments. Reproduce the shirt design FAITHFULLY:
- Same {COLOR} fabric color ({COLOR_DESC})
- Same boxy drop-tail silhouette (crew neck, slightly oversized fit, dropped hem at back)
- Same '0' monogram print on the LEFT CHEST (small, approximately 4-5cm wide)
- Same '4:81' marker on the RIGHT SLEEVE (small, approximately 3-4cm wide, slightly tilted along the sleeve seam)
- DO NOT enlarge, restyle, or move the prints. The prints must look SMALL and SUBTLE.

SCENE:
Editorial lifestyle photography of a Japanese woman in her late twenties standing alone on a quiet sandy beach in Okinawa, Japan. She is wearing the shirt shown in the attached references. She is also wearing simple natural-tone linen shorts or relaxed cropped trousers. Bare feet on white coral sand.

Soft natural side light from the late afternoon sun (golden hour starting — warm but NOT orange-saturated). Hair natural-falling, minimal makeup, calm observational expression. She is looking slightly AWAY from the camera toward the horizon — NOT a fashion-pose smile, NOT facing the camera, NOT posing.

Background: calm Okinawan turquoise sea, low gentle waves, white coral sand foreground, a few palm trees in the far distance slightly blurred. Wide editorial composition (16:9), woman slightly off-center.

STYLE: Anti-fashion-shoot vibe — natural, lived-in. Reference: Outdoor Voices lookbook + Patagonia editorial + POPEYE Okinawa. 8K, natural color grading.

NO watermarks, NO overlay text, NO Gemini signature, NO AI artifacts.
```

### 色ごとの差し替え値

- **BONE**: `{COLOR}` = `BONE`, `{COLOR_DESC}` = `warm cream off-white, NOT pure white`
- **MINT**: `{COLOR}` = `MINT`, `{COLOR_DESC}` = `pale mint green #92E5BD pistachio sea, washed soft mint, NOT bright lime`
- **OLIVE**: `{COLOR}` = `OLIVE`, `{COLOR_DESC}` = `washed military olive, low saturation, earthy, NOT bright kelly green`
- **INK BLACK**: `{COLOR}` = `INK BLACK`, `{COLOR_DESC}` = `soft washed black, warm undertone, like aged Japanese sumi-ink black, NOT pure jet black` — また末尾に "lighting tuned so the black shirt retains soft fabric detail (not crushed shadows)" を 1 行追記
