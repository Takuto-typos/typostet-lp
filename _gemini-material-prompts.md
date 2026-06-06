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

# Tokyo night street meet-up — 赤羽の夜 × 若い男女 × K-style crossover (shirt 4 attach 必須)

TYP0stet brand 思想「街中で見かけた人と仲良くなる」を反映した shoot。
**沖縄ビーチ (静か・ソロ) → 東京の夜 (人と繋がる)** で hero に物語性。
Cult brand 寄りなので: anti-touristy / anti-flashy、韓国 Z 世代にも刺さる K-Tokyo crossover style。

### 使い方

Gemini に **4 枚 attach**:

- Image 1 = `~/typostet/lp/img/shirts/bone-front.jpg`
- Image 2 = `~/typostet/lp/img/shirts/bone-back.jpg`
- Image 3 = `~/typostet/lp/img/shirts/black-front.jpg`
- Image 4 = `~/typostet/lp/img/shirts/black-back.jpg`

### Prompt (Variant A: 男=INK BLACK / 女=BONE)

```
ATTACHED REFERENCE IMAGES (mandatory, 4 total):
- Image 1 = TYP0stet Stet 01 T-shirt FRONT in BONE — small '0' monogram on left chest, '4:81' marker on right sleeve
- Image 2 = TYP0stet Stet 01 T-shirt BACK in BONE — TYP0stet wordmark on lower back
- Image 3 = TYP0stet Stet 01 T-shirt FRONT in INK BLACK
- Image 4 = TYP0stet Stet 01 T-shirt BACK in INK BLACK

CRITICAL: Reproduce shirt designs EXACTLY as in the attachments — boxy drop-tail silhouette (crew neck, slightly oversized, dropped back hem), SMALL '0' monogram on left chest (~4cm), SMALL '4:81' on right sleeve (~3cm), SMALL TYP0stet wordmark on lower back. DO NOT enlarge or restyle the prints. The prints must look SMALL and SUBTLE.

SCENE:
Cinematic candid street portrait photography of TWO young Japanese people in their EARLY 20s (around 22-24 years old, a young man and a young woman) who have just met by chance on a narrow back alley in AKABANE (赤羽) Tokyo at NIGHT. They are standing close, mid-conversation, both wearing TYP0stet — a soft moment of "oh, you too?"

The MAN (early 20s, fresh natural look, soft Asian features with a Korean-Japanese crossover style, NOT runway-model perfect — just clean and approachable):
- INK BLACK TYP0stet Stet 01 Tee (Image 3), oversized boxy fit, untucked
- Loose-fit STONE-GRAY or BEIGE LINEN SHORTS (mid-thigh length, slightly oversized, NOT athletic shorts, NOT tight)
- WHITE LOW-TOP SNEAKERS (clean minimal silhouette — Adidas Samba white / New Balance 530 white / Nike Killshot 2 white / Onitsuka Mexico 66 white — pick one that suits the mood)
- Ankle white socks just barely visible
- Natural undone hair, short-to-mid length, soft no-product look, slight half-smile, looking toward the woman

The WOMAN (early 20s, fresh natural look, K-style beauty — minimal makeup, glowy skin, soft undone hair, NOT runway-model perfect):
- BONE TYP0stet Stet 01 Tee (Image 1), oversized boxy fit (front hem softly tucked at the waist for slight shape)
- HIGH-WAIST BLACK or CHARCOAL COTTON SHORTS (mid-thigh, clean cotton — NOT denim cutoffs, NOT athletic)
- WHITE LOW-TOP SNEAKERS matching the man's mood (Adidas Samba / NB 530 / Onitsuka Mexico 66 white)
- Bare ankle or short white socks
- Hair natural-falling shoulder length or soft bob, no styling, one small minimalist earring (optional), warm slight smile, slightly turned toward the man, one hand mid-gesture

Both YOUNG, FRESH, casually stylish — the Korean-Tokyo crossover street look that resonates across East Asia (Seoul × Tokyo Z-gen vibe). NOT high fashion, NOT loud, NOT Harajuku. Quiet confidence, lived-in coolness. Like they're discovering each other.

LOCATION:
A narrow back alley in AKABANE (赤羽) Tokyo — the old shōtengai / yokochō vibe near Akabane Ichibangai. Late evening / early night around 20:00. Warm paper-lantern (chōchin 提灯) glow from a small izakaya doorway lights one side of the alley in soft golden-orange; the other side is softly cool from a vending machine's white-blue glow further down. Old wooden / corrugated-metal shop facades, faded Japanese kanji shop signs (NOT English signage, NOT touristy), narrow asphalt path slightly wet from earlier rain reflecting the lanterns subtly. Low tangled utility wires above. NO crowd — just the two of them.

This is cult-brand niche vibe — quiet, intimate, lived-in, locals-only. Anti-touristy. Anti-Shibuya/Shinjuku/Harajuku flash.

STYLE:
Cinematic night street portrait photography — Fujifilm film-stock look (X-T5 + 35mm f/1.4 vibe). Slight film grain, soft warm-cool color contrast (lantern warm-orange + vending-machine cool-blue mix). Shallow depth of field — both subjects in focus, alley falling off into soft bokeh. Natural mixed lighting from lanterns + vending machine + a faint distant street lamp. NOT flash photography.

Reference mood: Wong Kar-wai's "In the Mood for Love" alley scenes (warm lanterns + cool shadow), or Korean photographer 카가미타 (Kagamita) / Japanese photographer Daido Moriyama's gentler color work, or Magnum Photos urban candid.

Wide editorial composition (16:9), the two figures positioned just right of center, the alley perspective receding to the left into warm-cool bokeh. Camera slightly below eye level for cinematic feel.

NO watermarks, NO overlay text, NO Gemini signature, NO AI artifacts visible.
```

### Prompt (Variant B: 男=BONE / 女=INK BLACK)

Same as Variant A above, but swap the shirt colors:
- The MAN wears the BONE Tee (Image 1), boxy oversized fit, untucked. Pair with DARK CHARCOAL or BLACK loose-fit cotton shorts + white low-top sneakers.
- The WOMAN wears the INK BLACK Tee (Image 3), oversized boxy fit with front hem softly tucked. Pair with STONE-GRAY or BEIGE high-waist cotton shorts + white low-top sneakers.

Everything else identical — Akabane night alley, K-Tokyo crossover early-20s vibe, lantern + vending machine lighting, cinematic mood, NOT touristy.

### Tokyo street 共通注意点
- **「EARLY 20s」「young」「fresh」「K-style crossover」を強調** — late 20s だと cult-brand には少し老けて見える
- **「AKABANE 赤羽 back alley」「yokochō」「chōchin lantern」「vending machine glow」** で specific 夜の東京ローカル感を伝える (Shibuya/Shinjuku/Harajuku は明示的に avoid)
- **半ズボン (mid-thigh cotton/linen shorts) + 白 low-top sneakers** を明示 — 夏季想定、cult brand 寄りのコーデ
- **「Korean-Tokyo crossover」「Seoul × Tokyo Z-gen vibe」** を入れて K-audience にも刺さる look に
- **「Wong Kar-wai mood」「Fujifilm X-T5 35mm f/1.4」** の cinematic reference で chinmoku な雰囲気
- **prints SMALL を強調** — Gemini はロゴ巨大化しがち
- 生成後 → `~/typostet/lp/img/hero/output/raw/` に保存 → crop + JPEG q85 → LP hero slider に追加

---

# Shibuya scramble — 昼間の渋谷スクランブル × 男 OLIVE × 女 BONE × 動的 pose

夜の赤羽 (Tokyo 1/2) と並ぶ昼間の東京 image、対比で hero slider に厚みを出す。
**AI 感削減の hard requirement**: 直立 NOT、肌の質感 natural、ポージング NOT、mid-motion。

### 使い方

Gemini に **4 枚 attach**:

- Image 1 = `~/typostet/lp/img/shirts/olive-front.jpg`
- Image 2 = `~/typostet/lp/img/shirts/olive-back.jpg`
- Image 3 = `~/typostet/lp/img/shirts/bone-front.jpg`
- Image 4 = `~/typostet/lp/img/shirts/bone-back.jpg`

### Prompt (男 OLIVE / 女 BONE / 昼間スクランブル交差点)

```
ATTACHED REFERENCE IMAGES (mandatory, 4 total):
- Image 1 = TYP0stet Stet 01 T-shirt FRONT in OLIVE — small '0' monogram on left chest, '4:81' on right sleeve
- Image 2 = TYP0stet Stet 01 T-shirt BACK in OLIVE — TYP0stet wordmark on lower back
- Image 3 = TYP0stet Stet 01 T-shirt FRONT in BONE
- Image 4 = TYP0stet Stet 01 T-shirt BACK in BONE

CRITICAL: Reproduce shirt designs EXACTLY as in the attachments — boxy drop-tail silhouette, SMALL '0' monogram on left chest (~4cm), SMALL '4:81' on right sleeve (~3cm), SMALL TYP0stet wordmark on lower back. DO NOT enlarge or restyle the prints.

SCENE:
Mid-day documentary-style street photograph captured at SHIBUYA SCRAMBLE CROSSING (渋谷スクランブル交差点), Tokyo, around 13:00–14:00. A young Korean-Japanese-looking man and woman in their EARLY 20s are caught mid-motion crossing the intersection — NOT posed, NOT standing still, NOT looking at the camera. This is a candid documentary moment, not a fashion shoot.

THE MAN (early 20s, ~22-23, fair light skin tone — pale-warm complexion typical of clean K-pop visual, NOT tanned, NOT dark — natural undone soft hair, no styling product):
- OLIVE TYP0stet Stet 01 Tee (Image 1), boxy oversized fit, untucked
- Loose-fit STONE-GRAY or BEIGE linen shorts (mid-thigh, NOT tight, NOT athletic)
- WHITE LOW-TOP SNEAKERS (Adidas Samba white / New Balance 530 / Onitsuka Mexico 66 / Nike Killshot 2)
- Mid-stride, walking briskly across the crosswalk, looking sideways toward the woman with a half-smile and one hand raised slightly as if mid-gesture or holding a phone

THE WOMAN (early 20s, ~22-23, fair light skin tone — same pale-warm K-style complexion — natural shoulder-length or short bob, undone hair lightly windswept):
- BONE TYP0stet Stet 01 Tee (Image 3), boxy oversized fit
- High-waist BLACK or CHARCOAL cotton shorts (mid-thigh, clean cotton)
- WHITE LOW-TOP SNEAKERS matching the man's silhouette
- Mid-motion: turning her head slightly, looking back over her shoulder at the man, mouth slightly open as if mid-laugh, one hand brushing hair from her face

POSES & MOTION (CRITICAL — anti-AI):
- BOTH IN MOTION, NOT standing upright, NOT facing camera squarely
- Their bodies should show natural asymmetry — one leg forward, shoulders rotated, slight blur on the trailing foot suggesting motion
- Expressions are imperfect: slight squint from sunlight, hair out of place, NOT model-smooth poses

SKIN & TEXTURE (CRITICAL — anti-AI):
- Natural skin texture with subtle visible pores and slight imperfections (a small mole, a faint freckle, slight redness near the nose from the sun)
- NOT airbrushed, NOT plastic-smooth
- Realistic catchlights in the eyes, soft natural eyelash detail, faint skin highlights from sweat or warm midday sun

LOCATION:
The famous Shibuya Scramble Crossing — wide intersection, multiple lanes, painted crosswalk lines visible on the asphalt. Background: out-of-focus crowd of pedestrians from various ages and styles, distant Shibuya 109 building or Q-FRONT facade with large LED billboards visible but softly blurred (NOT readable text). Some pedestrians are walking past, some are paused, some checking phones — natural city density, NOT a posed crowd.

LIGHTING:
Midday natural sunlight from slightly behind the subjects — harsh enough to create soft shadows on the asphalt and crisp highlights on the shirts, but NOT noon-overhead (avoid raccoon-eye shadows). Soft shadow on the woman's face from her hair. The light is real Tokyo summer 13:00 — bright, slightly humid, real.

STYLE:
Documentary street photography aesthetic — Fujifilm X-T5 + 23mm f/1.4 or Leica Q3 vibe, mid-frame zone focus. Slight grain like Kodak Portra 400. NOT cinematic-dramatic, NOT glossy fashion — this is a real-feeling candid frame.

Reference mood: Daido Moriyama gentler color work, William Eggleston street, Ko Ji-Min (코지민) Korean street docs, or Magnum Photos Tokyo street.

Wide editorial composition (16:9), the two figures off-center, the crosswalk lines and crowd providing depth.

NO watermarks, NO overlay text, NO Gemini signature, NO AI-generated artifacts (no glossy plastic skin, no impossible symmetry, no rigid posing, no over-saturated colors).
```

### Shibuya scramble 共通注意点
- **「MID-MOTION」「NOT standing still」「NOT facing camera」を強い repeated emphasis** — Gemini が直立 portrait を生成する強い癖の counter
- **「fair light skin tone, pale-warm K-style complexion」** で肌白め指定 (Gemini は tan skin デフォ生成しがち)
- **「natural skin texture with subtle visible pores」「imperfections」「a small mole」「faint freckle」** で AI plastic skin 防止
- **「documentary street photography」「Magnum」「William Eggleston」** で fashion shoot mood 防止
- **「Shibuya 109 / Q-FRONT」「crosswalk lines」「out-of-focus crowd」** で specific location vibe
- **prints SMALL** を強調 (Gemini ロゴ巨大化防止)
- 生成後 → `~/typostet/lp/img/hero/output/raw/` → crop + JPEG q85 → LP hero slider 差し替え予定 (現 hero-4 = 旧 Tokyo 2 を上書き候補)
