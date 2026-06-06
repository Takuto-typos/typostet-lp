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

## 2. Tote — 白 (Bone) front view, single ink-black 0 monogram

```
ATTACHED REFERENCE IMAGE (mandatory, only one):
- Image 1 = TYP0stet '0' monogram (textured brushstroke zero + 4 mint dots horizontally aligned below)

CRITICAL: Reproduce the '0' monogram faithfully — preserve the brushstroke imperfections of the zero, the exact position of the 4 dots EXACTLY as in the attachment. The logo must be SILK-SCREEN PRINTED in DEEP INK BLACK (recolor the mint dots to ink black as well — entire logo monochrome ink black — preserve SHAPE, change only color).

PRODUCT:
A heavy 12oz natural cotton canvas tote bag in unbleached "BONE" color (warm cream off-white, NOT pure white). Boxy A4-portrait silhouette, approximately W36 × H40 × D12 cm, self-standing UPRIGHT and facing the CAMERA STRAIGHT-ON (perfect FRONT VIEW, NOT angled, NOT 3/4 view) on a worn wide-plank light oak floor. Shoulder-length handles (~60cm) in the same canvas fabric, both handles visible at the top.

LOGO PLACEMENT — ONLY ONE LOGO ON THE TOTE:
- UPPER-CENTER of the front, perfectly centered horizontally, about 12cm down from the top edge: Image 1 — the '0' monogram, approximately 3cm × 5cm (3cm wide, 5cm tall including the 4 dots below the zero). VERY SMALL, almost a subtle detail, like a tiny luxury brand mark.

ABSOLUTELY NO OTHER PRINTS:
- NO TYP0stet wordmark
- NO 4:81 marker
- NO additional graphics, NO side labels, NO inner-tag visible from outside
- The rest of the tote canvas is COMPLETELY BLANK

The single '0' monogram must be SILK-SCREEN PRINTED INTO the canvas (slightly absorbed into the weave, NOT glossy, NOT sticker-like).

SCENE:
Soft natural window light from upper left, gentle shadow falling to the lower right. Camera directly in front of the tote (front view, not angled). Background: out-of-focus warm gray plaster wall. Nothing else in the frame — no books, no notebooks, no props.

Realistic editorial commerce product photography, 8K resolution, sharp focus on the tote, canvas weave clearly visible. NO models, NO hands, NO people, NO text overlays, NO watermarks, NO Gemini signature.
```

---

## 3. Tote — 黒 (Ink Black) front view, single bone-cream 0 monogram

```
ATTACHED REFERENCE IMAGE (mandatory, only one):
- Image 1 = TYP0stet '0' monogram (textured brushstroke zero + 4 mint dots horizontally aligned below)

CRITICAL: Reproduce the '0' monogram faithfully — preserve brushstroke imperfections, exact dot positions EXACTLY as in the attachment. The logo must be SILK-SCREEN PRINTED in BONE / CREAM OFF-WHITE (recolor the mint dots to bone as well — entire logo monochrome bone cream — preserve SHAPE, change only color).

PRODUCT:
A heavy 12oz cotton canvas tote bag in deep INK BLACK color (soft washed black with slight warm undertone, like aged Japanese sumi-ink black, NOT pure jet black). Boxy A4-portrait silhouette, approximately W36 × H40 × D12 cm, self-standing UPRIGHT and facing the CAMERA STRAIGHT-ON (perfect FRONT VIEW, NOT angled) on a worn wide-plank light oak floor. Shoulder-length handles in the same ink black canvas fabric.

LOGO PLACEMENT — ONLY ONE LOGO ON THE TOTE:
- UPPER-CENTER of the front, perfectly centered horizontally, ~12cm from the top: Image 1 — the '0' monogram, approximately 3cm × 5cm (3cm wide, 5cm tall including dots). VERY SMALL.

ABSOLUTELY NO OTHER PRINTS:
- NO TYP0stet wordmark
- NO 4:81 marker
- NO additional graphics, NO labels
- The rest of the tote canvas is COMPLETELY BLANK

The single '0' monogram SILK-SCREEN PRINTED in BONE CREAM, slightly absorbed into the dark canvas weave.

SCENE:
Soft natural window light from upper left, lighting tuned to reveal weave texture on the dark canvas without harsh highlights. Camera directly in front (front view). Background: out-of-focus warm gray plaster wall. Nothing else in the frame.

Realistic editorial commerce product photography, 8K resolution, sharp focus, canvas weave visible. NO models, NO hands, NO people, NO text overlays, NO watermarks, NO Gemini signature.
```

---

## 4. Knapsack — Mint front view, single ink-black 0 monogram

```
ATTACHED REFERENCE IMAGE (mandatory, only one):
- Image 1 = TYP0stet '0' monogram (textured brushstroke zero + 4 mint dots horizontally aligned below)

CRITICAL: Reproduce the '0' monogram faithfully — preserve brushstroke imperfections, exact dot positions EXACTLY as in the attachment. SILK-SCREEN PRINTED in DEEP INK BLACK (recolor the mint dots to ink black as well — entire logo monochrome ink black — preserve SHAPE, change only color).

PRODUCT:
A waxed cotton canvas drawstring knapsack (cinch bag) in soft MINT GREEN color (pistachio sea #92E5BD, washed pale mint, low saturation, NOT bright lime). Trapezoidal silhouette, approximately W40 × H46 cm, narrower at the top, wider at the base. Drawstring closure at the top cinched gently with natural ecru cotton cord. Antique brass eyelets at the bottom corners with the cotton cord exiting and looping back up to form shoulder straps.

The knapsack is photographed FRONT VIEW (facing the camera straight-on, NOT angled, NOT 3/4 view), hanging from a single matte black nail on a raw textured plaster wall.

LOGO PLACEMENT — ONLY ONE LOGO ON THE KNAPSACK:
- UPPER-CENTER of the front, perfectly centered horizontally, about 14cm down from the top cinch (just below the drawstring gathers): Image 1 — the '0' monogram, approximately 3cm × 5cm (3cm wide, 5cm tall including the 4 dots below the zero). VERY SMALL, almost a subtle detail.

ABSOLUTELY NO OTHER PRINTS:
- NO TYP0stet wordmark
- NO 4:81 marker
- NO additional graphics, NO labels
- The rest of the canvas is COMPLETELY BLANK

The single '0' monogram SILK-SCREEN PRINTED in INK BLACK, slightly absorbed into the waxed canvas weave.

SCENE:
Soft diagonal cast shadow to the right. Natural soft light from upper left, slightly diffused. Background: warm pale gray plaster wall (slightly imperfect). Lived-in editorial catalog vibe (A.P.C. or Drake's lookbook mood).

Realistic editorial commerce product photography, 8K resolution, sharp focus on the bag, wax-canvas texture visible. NO models, NO hands, NO people, NO text overlays, NO watermarks, NO Gemini signature.
```

---

## 5. Knapsack — Olive front view, single bone-cream 0 monogram

```
ATTACHED REFERENCE IMAGE (mandatory, only one):
- Image 1 = TYP0stet '0' monogram (textured brushstroke zero + 4 mint dots horizontally aligned below)

CRITICAL: Reproduce the '0' monogram faithfully — preserve brushstroke imperfections, exact dot positions EXACTLY as in the attachment. SILK-SCREEN PRINTED in BONE / CREAM OFF-WHITE (recolor the mint dots to bone as well — entire logo monochrome bone cream — preserve SHAPE, change only color).

PRODUCT:
A waxed cotton canvas drawstring knapsack (cinch bag) in muted military OLIVE color (washed olive drab, low saturation, NOT bright). Trapezoidal silhouette, approximately W40 × H46 cm, narrower at the top, wider at the base. Drawstring closure at the top cinched with natural ecru cotton cord. Antique brass eyelets at the bottom corners with the cord exiting and looping back up to form shoulder straps.

The knapsack is photographed FRONT VIEW (facing the camera straight-on, NOT angled, NOT 3/4 view), hanging from a single matte black nail on a raw textured plaster wall.

LOGO PLACEMENT — ONLY ONE LOGO ON THE KNAPSACK:
- UPPER-CENTER, perfectly centered horizontally, ~14cm from top cinch (just below drawstring gathers): Image 1 — '0' monogram, approximately 3cm × 5cm. VERY SMALL.

ABSOLUTELY NO OTHER PRINTS:
- NO TYP0stet wordmark
- NO 4:81 marker
- NO additional graphics, NO labels
- The rest of the canvas is COMPLETELY BLANK

The single '0' monogram SILK-SCREEN PRINTED in BONE CREAM, slightly absorbed into the waxed olive canvas weave.

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

---

# Tokyo street meet-up — 男女が街で出会ってちょっとおしゃべり (shirt 4 attach 必須)

TYP0stet brand 思想「街中で見かけた人と仲良くなる」を反映した shoot。
LP の hero slider に投入予定。

### 使い方

Gemini に **4 枚 attach**:

- Image 1 = `~/typostet/lp/img/shirts/bone-front.jpg`
- Image 2 = `~/typostet/lp/img/shirts/bone-back.jpg`
- Image 3 = `~/typostet/lp/img/shirts/black-front.jpg`
- Image 4 = `~/typostet/lp/img/shirts/black-back.jpg`

### Prompt (Variant A: 男=BLACK / 女=BONE)

```
ATTACHED REFERENCE IMAGES (mandatory, 4 total):
- Image 1 = TYP0stet Stet 01 T-shirt FRONT in BONE — small '0' monogram on left chest, '4:81' marker on right sleeve
- Image 2 = TYP0stet Stet 01 T-shirt BACK in BONE — TYP0stet wordmark print across the lower back
- Image 3 = TYP0stet Stet 01 T-shirt FRONT in INK BLACK — same monogram + sleeve print
- Image 4 = TYP0stet Stet 01 T-shirt BACK in INK BLACK — same wordmark print

CRITICAL: Both people in the generated image must be wearing TYP0stet Stet 01 Tees EXACTLY as shown in the attachments. Preserve the print designs faithfully:
- Same boxy drop-tail silhouette (crew neck, slightly oversized, dropped hem at back)
- Same SMALL '0' monogram on left chest (~4-5cm wide)
- Same SMALL '4:81' marker on right sleeve (~3-4cm wide)
- DO NOT enlarge or restyle the prints. They should look SMALL and SUBTLE.

SCENE:
Editorial candid lifestyle photography of TWO Japanese people in their late twenties — ONE MAN, ONE WOMAN — who have just met by chance on a quiet residential side street in Tokyo. They are standing close to each other on the sidewalk, mid-conversation, casually noticing they are both wearing TYP0stet shirts.

The MAN is wearing the INK BLACK Tee (front view, Image 3) with relaxed loose-fit charcoal or dark navy trousers and minimal low-profile sneakers. Hair natural, no styling, calm friendly half-smile listening to the woman.

The WOMAN is wearing the BONE Tee (front view, Image 1) with relaxed natural-tone linen pants or wide cropped trousers and simple low sneakers or loafers. Hair natural-falling, minimal makeup, expression warm and lightly amused, slightly turned toward the man with one hand softly gesturing.

This is the moment of "we just realized we're both wearing the same brand" — NOT a posed fashion shot, NOT both squarely facing the camera. They are angled toward each other, comfortable, unposed.

LOCATION:
A quiet residential side street in central Tokyo (the vibe of Kuramae 蔵前 / Yanaka 谷中 / Daikanyama 代官山 backstreets). Narrow asphalt sidewalk, low brick or wood-fence buildings, a few potted plants beside a doorway, a faint wooden utility pole. Late afternoon sun creating long soft shadows across the pavement. Optional subtle Tokyo cues in the background: a vending machine in soft blur, an old shop facade, a small wooden sign — but kept understated, NOT touristy.

STYLE:
Candid editorial photography, "street portrait" mood — natural posture, no rigid posing, soft natural color grading. Reference: POPEYE city issue / Fujifilm GFX street portrait look / Magnum Photos relaxed urban candid. 8K, sharp focus on both subjects, gentle background bokeh.

Wide editorial composition (16:9), the two figures slightly off-center on the right, the side street perspective leading in from the left.

NO watermarks, NO overlay text, NO Gemini signature, NO AI artifacts visible.
```

### Prompt (Variant B: 男=BONE / 女=INK BLACK)

Same as Variant A above, but swap the shirt colors:
- The MAN wears the BONE Tee (front view, Image 1) with darker bottoms for contrast
- The WOMAN wears the INK BLACK Tee (front view, Image 3) with lighter or natural-tone bottoms

Everything else identical (location, style, mood, composition).

### Tokyo street 共通注意点
- **「TWO people, ONE MAN ONE WOMAN」「mid-conversation」「NOT posed」を強調** — Gemini が typical fashion shoot を生成しがち
- **「we just realized we're both wearing the same brand」narrative** を加えると pose が自然になる
- **「Kuramae / Yanaka / Daikanyama 系の quiet residential side street」** で specific vibe を伝える (派手な渋谷・原宿は avoid)
- **prints SMALL を強調** — bag prompt と同じく Gemini はロゴ巨大化しがち
- 生成後 → `~/typostet/lp/img/hero/output/raw/` に保存 → crop + JPEG q85 → LP hero slider に追加 (現状 hero-1〜4 で 4 image rotation)
