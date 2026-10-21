# Stickers

By default the Doodle Editor uses **emoji stickers** (⭐ ✦ ♡ 🎀 🌷 🩷 🦋 🌟),
so no image files are required to run YourBooth.

## Want PNG stickers instead?
1. Add transparent PNGs here (e.g. `star.png`, `heart.png`).
2. Import them in `src/utils/constants.js` and extend the `STICKERS` array.
3. Update `StickerEditor` / `DoodleEditor` to draw the image instead of `fillText`.

Emoji keep the bundle tiny and look great out of the box — PNGs are an optional upgrade.
