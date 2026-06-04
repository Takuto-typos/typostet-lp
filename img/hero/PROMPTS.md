# Gemini Hero Image プロンプト

Reference 画像は `ref/` に置いてある (bone/mint/olive/black の front + back、計 8 枚)。Gemini にこのフォルダの画像を全部添付して、下記プロンプトを投げる。

生成画像は `output/` に保存する想定。LP hero に使う最終サイズは **2880 × 1620** (16:9、retina 1920×1080 想定) を狙う。

---

## A. Group 版 (複数人、2-4 人)

```
Editorial fashion campaign photo, horizontal 16:9 hero image, 2880 × 1620.
Three to four young adults (mid 20s to mid 30s, mixed gender, East Asian features, natural unposed expressions — not smiling at camera, half-distracted, talking, looking sideways) wearing the four t-shirts shown in the attached reference images. The shirts MUST match the reference: a small mint "0" monogram on the viewer-left chest, a small "4:81" mark on the viewer-right sleeve, and the TYP0stet wordmark on the lower-left back. Use all four colors across the group: bone (off-white), mint (pistachio sea green), olive (deep olive), and ink black.

Location: late afternoon golden hour, somewhere between a city street and a quiet alley — concrete, vintage tile, weathered wall, a low concrete bench, maybe a single low tree. Okinawa or Tokyo backstreet feel, not staged. Soft natural light, slight haze, faint film grain, 35mm photograph aesthetic.

Mood: quiet confidence of people who have already failed at something today and are okay with it. NOT cheerful, NOT melancholy — a third register: "we are awkwardly human and proud of it." Patagonia × ALD × Auralee editorial direction. Avoid Pinterest perfect, avoid model agency gloss, avoid uncanny AI smoothness.

Composition: full body or three-quarter, generous negative space on the upper left for headline overlay, shirts and brand marks clearly visible. No additional graphics, no text overlay in the image itself, no logos other than what is already on the shirts.

Avoid: studio backdrop, fluorescent lighting, color graded look, oversaturated mint, perfect symmetric posing, plastic skin, group shot cliché (arms around each other), brand collab vibes, hipster mustache, sneaker close-up.
```

---

## B. Solo 版 (1 人)

```
Editorial fashion campaign photo, horizontal 16:9 hero image, 2880 × 1620.
One young adult (mid 20s to early 30s, East Asian features, natural unguarded expression — looking just past the camera, not smiling, slightly tired, slightly relieved) wearing the TYP0stet t-shirt shown in the attached reference. The shirt MUST match the reference: a small mint "0" monogram on the viewer-left chest, a small "4:81" mark on the viewer-right sleeve. Pick ONE color: BONE (off-white) primary version; also generate a MINT (pistachio sea green) variant.

Location: a quiet doorway or street corner in late afternoon, Okinawa or Tokyo backstreet, weathered concrete, soft natural light, slight haze, 35mm film aesthetic. Subject is not posed; might be mid-step, mid-thought, looking off-frame.

Mood: a person who just made a small mistake today (sent the wrong email, missed a train, said the wrong thing at lunch) and is quietly okay with it. Not melancholic, not cheerful — composed. Patagonia × Lemaire × Outdoor Voices direction. Faint film grain. Avoid AI-smooth skin, perfect symmetry, glossy commercial finish.

Composition: three-quarter to full body, generous negative space on either the upper left or upper right for headline overlay, shirt and brand marks visible.

Avoid: studio backdrop, gym shot, gym athletic pose, fluorescent lighting, oversaturated color, idealized model gloss, smiling at camera, neon, plastic skin, AI uncanny.
```

---

## C. ヒント (Gemini 投げ方)

- "Generate Image" モードで投げる
- reference 画像は **シャツの色とロゴ位置を正確に揃えてもらうため** に添付
- 1 回で完璧にならないので 3-5 回 variation 出してもらって selection
- shirts のロゴが歪んだら "the shirt prints must exactly match the reference, do not redesign the logos" と追記
- 顔の AI uncanny が出たら "more natural skin texture, slight imperfection, film grain" を追記
