<div align="center">

# ✦ YourBooth

**Tiny memories, forever yours.**

A cute, Y2K-flavored photobooth that runs entirely in the browser — no backend,
no uploads, your photos never leave your device. Built as a polished front-end
portfolio piece and deployable to GitHub Pages in one step.

</div>

---

## ✨ Features

- **Four booths**, each with its own vibe:
  - **Original** — classic photostrip, then a full decorate stage: frame, doodle, text & stickers
  - **Vintage** — fully automatic: one tap fires four self-timed portrait shots, then the strip slides out of the machine (sepia, grain, soft vignette, thin frame). No retakes, no edits — pure analog
  - **Aquarium** — swimming fish 🐠 and rising bubbles, baked into the photo *and* shown live
  - **Polaroid** — single Instax-style shot with a "developing" animation and an optional marker-style date
- **Pick your layout** — 1, 2, 3, 4, or 6 photos (6 lays out as two columns, 3 + 3)
- **Real camera capture** via `getUserMedia`, with optional 3-2-1 countdown + camera flash
- **Live shot panel** — captured photos appear beside the camera, each with its own **retake**
- **Frames** — White, Pink, Black, Purple, Blue, or **No Frame** (bare photos, transparent edges) — all empty, no captions
- **Decorate stage** — pen with adjustable **thickness**, eraser, 5 colors, undo/clear, draggable **text**, and emoji **stickers**
- **Export to PNG** — everything composited client-side with the Canvas API
- **Delightful details** — star cursor, floating sparkles, loading screen, smooth Framer Motion transitions
- **100% static** — works offline once loaded, perfect for GitHub Pages

## 🛠 Tech Stack

React · Vite · TailwindCSS · Framer Motion · HTML5 Canvas · MediaDevices `getUserMedia`

## 🚀 Getting Started

```bash
# 1. install dependencies
npm install

# 2. run the dev server
npm run dev
# open the printed localhost URL and allow camera access

# 3. build for production
npm run build

# 4. preview the production build locally
npm run preview
```

> **Camera note:** browsers only allow the camera over `https://` or `localhost`.
> `npm run dev` and GitHub Pages both satisfy this. Opening the built `index.html`
> from `file://` will not.

## 🌐 Deploy to GitHub Pages

Because `vite.config.js` uses `base: './'` (relative asset paths) and the app uses
state-based view switching (no router), it works under any repo subpath with **no
extra config**.

**Option A — GitHub Actions (recommended).** This repo includes
`.github/workflows/deploy.yml`. Push to `main`, then in your repo go to
**Settings → Pages → Build and deployment → Source: GitHub Actions**. Done — every
push builds and publishes automatically.

**Option B — `gh-pages` branch.** A script is already wired up:

```bash
npm run deploy   # builds and pushes dist/ to the gh-pages branch
```

Then set **Settings → Pages → Source: Deploy from a branch → `gh-pages` / root**.

## 🎨 Customizing

| Want to change… | Edit |
| --- | --- |
| Brand colors / shadows / radii | `tailwind.config.js` |
| Star cursor, global styles | `src/index.css` |
| Stickers, layouts, booth list, palette | `src/utils/constants.js` |
| Frame colour presets | `FRAMES` in `src/utils/constants.js` (mirror values in `DoodleEditor.jsx`) |
| Booth preview thumbnails | regenerate with `python3 scripts/gen_assets.py` or drop your own into `public/assets/previews/` |
| Fish / sticker artwork | see the READMEs in `src/assets/fish/` and `src/assets/stickers/` |

## 📁 Project Structure

```
src/
├── assets/            # source design files (frames, stickers, fish) + how-to READMEs
├── components/
│   ├── Camera/        # live capture stage
│   ├── Countdown/     # 3·2·1 overlay
│   ├── DoodleEditor/  # frame + pen/thickness/eraser/colors/undo + text + stickers
│   ├── FrameSelector/ # frame / no-frame + 5 colours
│   ├── LayoutSelector/# 1·2·3·4·6 photo picker
│   ├── StickerEditor/ # sticker pack
│   └── …              # Sparkles, Logo, LoadingScreen, StripBooth, AquariumOverlay, etc.
├── pages/
│   ├── HomePage/      # hero + booth list with hover previews
│   ├── OriginalBooth/
│   ├── VintageBooth/
│   ├── AquariumBooth/
│   └── PolaroidBooth/
├── hooks/             # useCamera (getUserMedia wrapper)
├── utils/             # canvas compositor, filters, aquarium, image helpers, constants
└── App.jsx            # loading → home → booth view state machine
```

## 🔒 Privacy

Every photo is captured, composited, and downloaded locally in your browser.
Nothing is uploaded anywhere. There is no server.

---

<div align="center">
Made with ♡ — tiny memories, forever yours.
</div>
