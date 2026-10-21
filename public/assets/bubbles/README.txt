CUSTOM BUBBLES (optional)
=========================
Put your bubble pictures here. You can use 1 or 2, named EXACTLY:
      public/assets/bubbles/bubble.png
      public/assets/bubbles/bubble1.png
   • Use PNGs with a TRANSPARENT background (no white box).
   • Each bubble (in the live preview AND in the saved photo) randomly
     picks one of your two images, so they look varied.
   • If one name is missing, only the other is used.

To resize all bubbles, open  src/utils/aquarium.js  and edit:
      export const BUBBLE_SCALE = 1
   • 1 = normal,  1.5 = bigger,  0.7 = smaller

If neither file is here, the app uses simple drawn bubbles.
