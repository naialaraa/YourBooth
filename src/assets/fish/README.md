# Fish

The Aquarium Booth animates emoji fish (🐠 🐟 🐡 🦈 🐙) and bubbles over the
live camera **and** bakes them into the saved photo — no image files needed.

## Swap in custom fish art
1. Add transparent PNGs here (e.g. `clownfish.png`, `pufferfish.png`).
2. Reference them from `src/components/AquariumOverlay.jsx` (live preview) and
   `src/utils/aquarium.js` (the version baked into the captured photo) so both the
   on-screen and downloaded results match.

Until then, the emoji fish swim happily on their own. 🐠
