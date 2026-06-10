# Gemini 着用写真生成 prompts (composite workflow / v2)

## 戦略 pivot (06-08)

旧 v1 = 「1 発で人物 + シャツ + ロゴ + 環境」全部 Gemini に投げる方式 → 失敗。drift 軸が掛け算で発散、logo 再現も毎回崩れる。

新 v2 = **3 layer composite**。drift 軸を 1 つずつ閉じ込める。

```
Layer A : 人物 + scene (Gemini)       — シャツは無地、色だけ合わせる
Layer B : ロゴ焼き込み (Pillow)        — composite_shirts.py 路線で px 単位制御
Layer C : 素材 macro / 構造 detail (Gemini) — 人物不要、独立 shot として PDP に出す
```

加えて、人物 drift を抑える **anchor model 固定** 手順を最初に踏む。

---

## STEP 0 : anchor model 1 枚作る (最重要、1 回だけ)

全 shot で「同じ人」に見せるための seed。ここが「いけてる日本人」じゃないと以降全部 NG。5-10 候補から厳選。

### v2.1 改訂理由 (06-10)

旧 v2 失敗 mode:
- `Visible from chest up` → 胸より上だけ出力、全身 framing にならず
- `documentary` + `Magnum / Eggleston` + `slightly tired` + `subtle asymmetry` → Gemini が「年配の孤独な documentary 被写体」prior を引っ張り、tired / 老け顔 / だらしない方向に drift
- East Asian の指定が雑 (中華 / 韓国系 face 混入の隙あり)

新方針:
- **framing 明示**: `full body, head to toe visible` を強調 prefix で
- **editorial vibe**: POPEYE / Auralee lookbook / Takashi Homma 系に置換、documentary 完全削除
- **"tired" "asymmetry" 削除**: 「いけてる」最大の敵
- **Japanese 明示** (East Asian だと中華 / 韓国 prior が混入する)
- **男女両 prompt 用意**、tig が選ぶ
- **生活感の anchor**: 「下北沢の specialty coffee shop で働いてそう」「蔵前の小さな architecture studio」など具体的 neighborhood 名指し

### 共通の framing rule (両 gender 共通の鉄則)

```
⚠️ FRAMING IS CRITICAL — DO NOT FAIL:
- Full body portrait, HEAD TO TOE FULLY VISIBLE within the frame
- Subject centered with breathing room above the head and below the feet
- 4:5 vertical portrait aspect ratio
- 50mm equivalent lens, natural perspective (NOT wide-angle distortion, NOT telephoto compression)
- If you would normally crop at chest or waist, ZOOM OUT and show the entire body

If the subject is cropped at the chest, waist, or knees, this is a FAILURE.
```

### 男性 anchor prompt

```
Editorial fashion portrait photograph, POPEYE Magazine / Auralee Men's lookbook style.

SUBJECT: a single Japanese man, late-20s to early-30s. The kind of person you'd see working at a specialty coffee shop in Shimokitazawa or a small architecture studio in Kuramae. Quietly cool, slightly bookish, comfortable in his own skin. NOT model-handsome, NOT idol-pretty — the kind of face both men and women look at and immediately think 「感じいい」.

FACE: Clean soft Japanese features, slight natural angle in the jaw, well-defined but not sharp. Calm present focused expression, eyes alert and lit (NOT tired, NOT melancholy, NOT sleepy). Soft natural mouth, no smile or just a hint. Looking slightly off-camera left, present and centered. Light natural shadow under brow.

ETHNICITY: Specifically Japanese (NOT Korean, NOT Chinese — Japanese face structure: softer rounded forehead, soft jawline, warm skin tone with subtle yellow-warm undertone, NOT cool pale K-style).

BUILD: 178cm, lean clean build, narrow-to-medium shoulders, NOT muscular, NOT athletic gym-bro, NOT skinny-frail. The build of someone who walks the city a lot and eats well.

HAIR: Slightly grown-out modern Japanese soft black cut, natural movement (not gelled, not messy), parted loosely, slight bangs covering part of forehead. Slight texture, looks lived-in.

WEARING: Plain undyed cream-bone (off-white) T-shirt, NO print, NO logo, NO text, NO graphics. Boxy oversized-but-clean fit, slight drop-shoulder, hits at upper hip. Auralee / Graphpaper / COMOLI silhouette. Worn over softly pleated wide cotton trousers in cream or stone. Bare feet on warm wood floor, or simple worn leather loafers.

FRAMING: ★ FULL BODY, HEAD TO TOE VISIBLE ★. 4:5 vertical portrait, 50mm lens, subject centered, breathing room above head and below feet.

BACKGROUND: Neutral warm beige plaster studio wall, soft north-facing window light from camera-left, faint natural shadow on background. NO furniture, NO props, NO clutter.

PHOTOGRAPHY STYLE: Editorial portrait, the quiet warm style of Takashi Homma's lookbook portraits. Soft fine film grain, slightly warm color cast, slight natural imperfection in light. Auralee / Lemaire / COMOLI lookbook mood. Clean but not sterile.

AVOID:
- Chest-up cropping (FULL BODY REQUIRED)
- Sleepy, tired, melancholy expression
- Symmetric model pose, forced cool stance
- AI-perfect plastic skin (subtle natural skin texture, light grain expected)
- K-pop idol styling (no gelled hair, no perfect makeup, no pale cool tone)
- Chinese / Korean face features (Japanese specifically)
- Athletic / sporty / muscular build
- Documentary tired-old-man mood
- Glossy commercial fashion catalog look
- Logo, text, print on shirt
- Forced "asymmetry" that uglifies the face
```

### 女性 anchor prompt

```
Editorial fashion portrait photograph, GINZA Magazine / Auralee Women's / minä perhonen lookbook style.

SUBJECT: a single Japanese woman, late-20s to early-30s. The kind of person you'd see at a design exhibition in Roppongi or a quiet wine bar in Sangenjaya. Quietly stylish, slightly intellectual, present in herself. NOT model-pretty, NOT idol-cute — the kind of face both men and women look at and immediately think 「感じいい」.

FACE: Clean soft Japanese features, slight natural definition in cheekbones, warm soft skin. Calm present expression, soft natural mouth, slight focus. Eyes alert and lit (NOT tired, NOT melancholy, NOT dreamy-anime). Light natural makeup or bare skin, soft brows, bare lips. Looking slightly off-camera, present and centered.

ETHNICITY: Specifically Japanese (NOT Korean idol-style, NOT Chinese — Japanese face structure: softer rounded jawline, warm yellow-warm skin tone, soft natural brow, NOT K-style cool pale glass skin).

BUILD: 163cm, slim natural build, soft natural shoulders, NOT model-tall, NOT idol-petite. The build of someone who walks a lot.

HAIR: Mid-length natural soft black hair, slight texture, parted center or loose side, slight natural movement. NOT salon-styled, NOT iron-curled. Looks lived-in.

WEARING: Plain undyed cream-bone (off-white) T-shirt, OVERSIZED on her frame (tunic-length, hits at upper thigh), NO print, NO logo, NO text. Worn over softly draped wide trousers or a long skirt (cream / stone / muted olive). Bare feet on warm wood floor, or flat simple sandals.

FRAMING: ★ FULL BODY, HEAD TO TOE VISIBLE ★. 4:5 vertical portrait, 50mm lens, subject centered, breathing room above head and below feet.

BACKGROUND: Neutral warm beige plaster studio wall, soft north-facing window light from camera-left, faint natural shadow on background. NO furniture, NO props.

PHOTOGRAPHY STYLE: Editorial portrait, the quiet warm style of Takashi Homma or Asako Narahashi lookbook portraits. Soft fine film grain, slightly warm color cast, slight natural imperfection in light. Auralee Women / minä perhonen / Lemaire / Toogood lookbook mood.

AVOID:
- Chest-up cropping (FULL BODY REQUIRED)
- Idol / model overly cute or sexy posing
- Heavy makeup, fake lashes, glossy lips
- K-pop idol styling (no glass skin, no gelled bangs)
- Chinese / Korean face features (Japanese specifically)
- Anime-eyed dreamy look
- Documentary tired expression
- Logo, text, print on shirt
- Forced asymmetry
- Commercial catalog gloss
```

### tig の判断: 1 model か 2 model か

| 案 | コスト | 効果 |
|---|---|---|
| **男性 1 人 だけ** | Gemini credit 半分、shot 数 4 色 × 4 = 16 + 共通 | brand voice 「火の前で人と話す」「雲のように」が tig 投影で乗りやすい。一貫性高い |
| **女性 1 人 だけ** | 同上 | apparel brand として女性視点 (cult 想定 buyer に女性層多い) を中心に。Auralee Women 的 |
| **男女 2 人** | credit 倍、shot 数 32 + 共通 | 「男女どちらがみても」の意図最大化、PDP に多様性、ただし運用負荷高 |

**初動 MVP 推奨: 男性 1 人で始める** (brand 体現として tig 系男性が乗りやすい)、Phase 2 で問題なければ Year 1 後半に女性 anchor 追加。tig 判断あれば最初から 2 人でも対応します。

### 採用 checklist (1 枚を選ぶ前に必ず確認)

- [ ] **head to toe 全身映ってる** (← 前回 fail した最大原因、最優先 check)
- [ ] **顔がいけてる** = 男女両方が「感じいい」と思える (idol 感 NG、芸能人感 NG、感じいい人感)
- [ ] **日本人に見える** (K-pop っぽい / 中華っぽい NG)
- [ ] **AI 感極小** (skin pore visible、grain ある、目が plastic じゃない、肌が陶器じゃない)
- [ ] **覚えやすい顔** (Step 1 で reference として使うため、特徴 0 だと別人化しやすい)
- [ ] **brand voice 適合** (誇り高すぎず、自虐すぎず、「火の前で人と話してそう」)
- [ ] シャツが plain (logo 紛れ込んでない、色が指定通り)

**5 項目以下しか満たさないなら不採用、再生成**。5-7 全部満たす 1 枚に出会うまで止まらない。

### 生成手順 (tig の手元)

1. **画像生成 model 選択** — Gemini 2.5 Flash Image (旧 Nano Banana) または Imagen が安定。Gemini Web UI でも API でも可
2. **男性 anchor prompt を copy-paste**、framing rule block も一緒に投げる
3. **5-10 候補生成** (1 発で決めない、これが drift seed なので絶対妥協しない)
4. 候補を `~/typostet/lp/img/wear-shots/anchor/candidates/` に全部保存して並べて見る (Finder で thumbnails)
5. checklist 5/7 以上のもの 1 枚を採用 → `~/typostet/lp/img/wear-shots/anchor/model-anchor.jpg` に rename
6. 私 (Claude) に「これで」と知らせる、Phase 2 (Layer A 量産) に進みます

### 生成 fail 時の retry tip

| 症状 | prompt 追記 |
|---|---|
| 胸より上しか出ない | 「ZOOM OUT MUCH FURTHER. The subject must occupy only 60% of frame height with head and feet visible.」 |
| 韓国 idol 顔になる | 「Japanese face, NOT K-pop, NOT idol. Soft warm Japanese features.」 |
| 中華系顔になる | 「Specifically Japanese ethnicity, soft warm features, NOT Chinese mainland features.」 |
| 古めかしい / おじいさん顔 | 「Late 20s to early 30s, present-day Tokyo creative neighborhood resident.」 |
| シャツに logo が乗る | 「PLAIN blank shirt. ZERO graphics, ZERO text. If unsure, leave shirt empty.」 |
| 直立 model 立ち | 「Slight natural relaxation, weight on one leg, NOT model T-pose.」 |
| 真顔すぎる | 「Calm warm expression, just a hint of internal smile, eyes alive and present.」 |

---

## STEP 1 : 人物 + scene shot (Layer A)

anchor を image reference として attach、各 scene + 色を text prompt で指示。**シャツは plain 無地 (色だけ合わせる)**。ロゴは Step 2 で焼き込むので Gemini に描かせない。

### 共通 base prompt (anchor 画像を attach した状態で)

```
SAME PERSON AS THE ATTACHED REFERENCE IMAGE. Preserve face structure, skin tone, hair, build. Do NOT regenerate as a different person.

The person is wearing a PLAIN solid-color T-shirt (NO print, NO logo, NO text, NO graphics). Just a blank colored T-shirt. Boxy drop-tail silhouette, athleisure cotton-poly blend, 4.5oz weight, slight natural drape.

⚠️ CRITICAL: The shirt MUST be completely blank. Any text, symbol, dot, line, or print is a FAILURE. If you would normally add a brand logo, OMIT it. The shirt is intentionally unprinted.

[+ COLOR (色だけ差し替え)]
[+ SCENE (環境)]
[+ POSE]
[+ MOOD]

PHOTOGRAPHY STYLE: Editorial portrait photography, POPEYE Magazine / Auralee lookbook mood / Takashi Homma style. Soft natural light, fine film grain, slightly warm color cast. NOT documentary tired feel, NOT Magnum / Eggleston (these prior produces sleepy old-soul mood). NOT commercial AI gloss. NO model smile, NO direct camera stare. Mid-motion or relaxed natural standing.

FRAMING: ★ FULL BODY, head to toe fully visible ★ unless explicitly cropped shot (e.g., cropped fit detail). 4:5 vertical, 50mm equivalent lens.

AVOID: chest-up cropping when full body specified, AI-perfect plastic skin (subtle natural skin texture expected), sleepy / tired / old-soul expression, idol-cute K-pop styling, Korean / Chinese face features (Japanese specifically), forced asymmetry that uglifies, symmetric model pose, commercial fashion catalog gloss, oversaturated colors, studio strobe, ANY text/symbol on the shirt.
```

### 色指定 (4 種)

| color | 指定 text |
|---|---|
| BONE | "Soft warm bone (off-white cream, slightly warm undertone) T-shirt" |
| MINT | "Soft pale mint green (#92E5BD-ish, pistachio, NOT neon, NOT yellow-green) T-shirt" |
| OLIVE | "Muted washed olive green (military olive, NOT bright forest, slightly grey-green) T-shirt" |
| INK BLACK | "Deep warm ink black (NOT pure black, slight grey-warm undertone) T-shirt" |

### MVP shot 計画 (色 × shot = 16 + universal 6 ≒ 22 枚)

調査した 7 brand PDP 平均は **8-12 枚 / SKU**。1 color あたり 4 枚 + 共通 6 枚 = 1 SKU 表示で 10 枚見せる構成。

**色ごとに 4 枚** (front / back / cropped fit / scene moment):

#### A. 正面 (前身頃 logo 配置確認用、後で Layer B で 0 monogram 追加)
```
+ SCENE: Neutral warm beige studio wall, soft window light from camera-left
+ POSE: Standing facing camera straight, arms relaxed at sides, slight body asymmetry (one shoulder slightly forward), looking past camera to the left
+ FRAMING: Full body chest-up to mid-thigh, centered, 4:5 portrait
+ MOOD: Quiet, neutral, calm
```

#### B. 背面 (TYP0stet wordmark 配置確認用、後で Layer B で焼き込み)
```
+ SCENE: Same neutral studio
+ POSE: Standing facing AWAY from camera, slight 3/4 turn so we see lower back center and right sleeve edge, arms relaxed
+ FRAMING: Full body chest-up to mid-thigh, centered
+ MOOD: Same calm
```

#### C. cropped torso (fit 詳細、肩線・身幅・drape visible)
```
+ SCENE: Same studio, slightly closer
+ POSE: Half side angle (3/4), hand in front pocket of plain cotton pants
+ FRAMING: Crop from shoulder to hip — show shoulder seam sit, sleeve length, body width, drape across chest
+ MOOD: Casual mid-motion
```

#### D. 1 scene moment (色 × 場面で TYP0stet voice 表現、色別に下記から 1 つ選ぶ)

**BONE — 沖縄海辺、朝の散歩**
```
+ SCENE: Walking on wet sandy Okinawa beach, early morning, soft golden back-light, faint waves
+ POSE: 3/4 from behind, mid-stride, barefoot, holding sandals
+ MOOD: First morning of a quiet trip
```

**MINT — 朝のヨガマット**
```
+ SCENE: Wooden floor near a window, morning light flooding in, plants visible. Yoga mat half-rolled.
+ POSE: Crouching to roll up mat, side angle
+ MOOD: Post-practice, calm
```

**OLIVE — 沖縄、軒下の縁側**
```
+ SCENE: Sitting on wooden engawa (porch) of an Okinawan house, looking out at small garden, warm afternoon filter light. Cold tea glass on floor nearby.
+ POSE: One leg up, one extended, relaxed, head slightly turned to side
+ MOOD: Slow Okinawa afternoon
```

**INK BLACK — 東京、夜の路地裏**
```
+ SCENE: Narrow Tokyo yokocho alley at night (Akabane / Ebisu feel), red paper lanterns and vending machine glow from behind, slight wet ground reflections
+ POSE: Standing, looking up sideways at lanterns, hands in pockets
+ MOOD: After dinner, walking off the meal, alone
```

### tig が判断する変数

- **anchor model の顔出し度** — 顔正面 OK か、後ろ姿 / 顔伏多めか (memory `feedback_face_out_relaxed.md` に従い物理露出 OK、digital 匿名は維持の方針あり)
- **モデル人数** — 1 人で 4 色着回しか、色ごとに別人 (= drift OK と割り切る) か → 推奨は 1 人着回し (brand coherence)
- **scene B 候補** — 各色の moment shot は他案あれば差し替え可

---

## STEP 2 : ロゴ焼き込み (Layer B、Pillow)

Layer A の plain shirt 写真が揃ったら、Pillow で logo を px 単位 composite。**Gemini に logo 描かせない** 鉄則。

### 既存 script 流用

`~/typostet/lp/scripts/composite_shirts.py` は flat mockup 用に書かれてるが、原理は同じ:

1. shirt mask 抽出 (色域指定 or 手動 mask PNG 作成)
2. 0 monogram PNG を left chest 領域に paste
3. 4:81 marker PNG を right sleeve 領域に paste
4. wordmark SVG (rendered PNG) を lower back center に paste
5. 各 paste は perspective / drape を考慮して **手動で位置 + scale + rotate 調整**

### 着用写真用の難所

flat mockup と違って **シャツに drape (シワ・カーブ) がある**。naive な平面 paste だと「シール貼った感」が出る。

選択肢:
- **Easy**: ロゴを 0.5-0.7 opacity で paste + blend mode "multiply" → drape の影が透ける、シール感減
- **Medium**: 手動で warp / mesh distort (Photoshop / GIMP)、Pillow だけでは難しい
- **Hard**: AI inpainting (Photoshop generative fill or Stable Diffusion ControlNet) で logo を mask 領域に焼き込み

**MVP は Easy ルート**: Pillow paste + multiply blend で進めて、不自然なら個別に Photoshop 手動修正。

### Step 2 用 mask 作成支援

tig が Layer A 生成 → tig が「ここに logo」と JSON で座標指定 → Pillow script が自動 paste。後で書きます (Step 1 終わってから)。

---

## STEP 3 : 素材 macro / 構造 detail (Layer C、universal)

人物不要、色ごとに 1-2 枚ずつ。**fabric weight 明記 (Patagonia 路線) と組み合わせると差別化最大化**。

### A. fabric macro (色ごと 1 枚 = 4 枚)

```
Extreme close-up macro photograph of a cotton-poly blend jersey fabric, 4.5oz weight, slight visible weave texture. NO logo, NO print, just the raw fabric surface.

[+ COLOR (Layer A と同じ色指定)]

LIGHTING: Soft side-light revealing weave texture, slight shadow in fabric folds
FRAMING: Macro 1:1, fabric fills frame entirely, slight diagonal weave angle
STYLE: Editorial product photography, like a Patagonia or Outdoor Voices fabric detail shot. NO over-saturation. Slight grain.
```

### B. 構造 detail (色非依存、reuse 可、4-6 枚)

```
[case 1] Close-up of cotton T-shirt collar binding — flat-stitched seam, slight drape, neutral light, editorial product macro feel
[case 2] Close-up of right sleeve hem — folded edge, double-stitched, slight drape
[case 3] Drop-tail hem detail at the back — curved hem cut, slight drape over hip line, neutral background
[case 4] Inner side seam close-up — clean overlock stitch, soft shadow
```

全部 BONE 色で 1 度作れば、後で Pillow tint で色違い量産可能 (= 色ごとに撮り直す必要なし)。

### C. flat lay (色ごと 1 枚 = 4 枚)

```
Flat lay product photograph of a folded T-shirt on a neutral warm beige linen surface, soft natural overhead light, slight shadow.

The T-shirt is folded in half — front-down so the back lower-center is partially visible. NO logo, NO print, just the blank colored shirt.

[+ COLOR]

STYLE: Editorial flat lay, like a Lemaire or Auralee product shot. Slight imperfection in fold (not perfectly geometric). Film grain.
```

flat lay にも後で Pillow で wordmark 焼き込み (Step 2 同様)。

---

## まとめ : 1 launch あたり Gemini 生成枚数

| Layer | 種類 | 色 × 枚 | 合計 |
|---|---|---|---|
| Anchor | model seed | × 1 | 1 (使い回す) |
| A | 正面 | 4 色 × 1 | 4 |
| A | 背面 | 4 色 × 1 | 4 |
| A | cropped fit | 4 色 × 1 | 4 |
| A | scene moment | 4 色 × 1 | 4 |
| C | fabric macro | 4 色 × 1 | 4 |
| C | 構造 detail | × 4-6 | 4-6 |
| C | flat lay | 4 色 × 1 | 4 |
| **合計** | | | **29-31 枚** |

各 prompt 3-5 回 retry 想定 → 実生成 100-150 回。Gemini クレジット消費覚悟。

---

## tig の作業手順

### Phase 1 (anchor 固定)

1. STEP 0 prompt を Gemini に投げる、5-10 候補生成
2. 1 枚採用 → `~/typostet/lp/img/wear-shots/anchor/model-anchor.jpg` 保存
3. tig 判断 (顔出し度、雰囲気)、私に「これで」と伝えてくれれば次へ

### Phase 2 (Layer A 量産)

4. anchor 画像を毎回 attach、STEP 1 の base prompt + 色 + shot 種を組み合わせて投げる
5. 結果を `~/typostet/lp/img/wear-shots/output/{color}-{shot-type}.jpg` に保存
   - 例: `bone-front.jpg`, `bone-back.jpg`, `bone-fit.jpg`, `bone-scene.jpg`
6. **シャツが無地で生成されてるか必ず確認** (logo が出てたら fail、生成し直し)

### Phase 3 (Layer C 量産)

7. STEP 3 prompt で fabric macro / 構造 detail / flat lay を生成
8. `~/typostet/lp/img/wear-shots/output/fabric-{color}.jpg`, `detail-{type}.jpg`, `flat-{color}.jpg`

### Phase 4 (Layer B 焼き込み、私が担当)

9. tig が Layer A + Layer C 揃った時点で「これで揃った」と知らせる
10. 私が:
    - Pillow composite で logo 焼き込み script 書き直し / 更新
    - 各色 mask 作成 (shirt 領域 detection)
    - 0 monogram / 4:81 / wordmark を multiply blend で paste
    - 自然さ check、Photoshop 手動修正が必要な箇所を tig に list で返す

### Phase 5 (LP / PDP 反映)

11. 完成画像を `/img/wear-shots/final/` に移し、PDP と LP の hero / thumb を差し替え (私が担当)

---

## 失敗 mode と対応

| 失敗 | 原因 | 対応 |
|---|---|---|
| 顔が毎回違う人になる | anchor reference 効きが弱い | anchor を 2-3 枚 attach、prompt 先頭で "SAME PERSON" 強調連発 |
| シャツに勝手に logo が出る | Gemini が brand 認識して描き足した | prompt の "BLANK shirt" "OMIT logo" を強調、再生成 |
| シャツ色が指定と違う | 色名解釈の差 | hex 指定 + 参考色名 (pistachio / military olive) 併記、再試行 |
| 人物が AI 感プラスチック肌 | style prompt 弱い | "natural skin pores", "subtle asymmetry", "film grain" を強化 |
| ポーズが直立 model 感 | "mid-motion" を強調 | "looking away", "captured mid-step", "candid moment" 反復 |

---

## logo 素材 (Step 2 用 Pillow paste source)

既存: `~/typostet/lp/assets/brand/` 配下

- monogram: `monogram/tentative-final*.svg` (PNG export 推奨、左胸用 ink black + bone-cream 2 色)
- wordmark: `wordmark/tentative-final*.svg`
- 4:81: `timestamp/handdrawn-481.png` (PNG 既存)

composite 時:
- 0 monogram: 横幅 シャツ身幅の 6% (約 2.5cm 相当、近づいたら分かる程度)
- 4:81: 横幅 シャツ身幅の 5% (約 2cm)
- wordmark: 横幅 シャツ身幅の 18% (約 7.5cm)

---

## memo : 何故 1 発生成じゃダメだったか

旧 v1 prompt は logo 再現を Gemini に直接命令していた (CRITICAL LOGO REPRODUCTION RULE)。Gemini は brand logo を「学習した何か別の logo」に書き換える failure mode が強い。reference attach しても完全 copy にならず、毎回:

- 0 monogram の dots 数がブレる
- 4:81 が "481" や "4.81" になる
- wordmark の "stet" が "Stet" や "stetson" に化ける

これは prompt engineering で解決しない (Gemini の生成 prior が強い)。composite 方式に pivot することで、**Gemini に logo を任せる場面を完全排除**。
