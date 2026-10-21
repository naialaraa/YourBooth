CUSTOM FISH (optional)
======================
1. Put your fish pictures here. You can use 1 up to 7, named EXACTLY:
      public/assets/fish/fish.png
      public/assets/fish/fish1.png
      public/assets/fish/fish2.png
      public/assets/fish/fish3.png
      public/assets/fish/fish4.png
      public/assets/fish/fish5.png
      public/assets/fish/fish6.png
   • Use PNGs with a TRANSPARENT background (no white box).
   • Draw/point each fish facing RIGHT  →
     (the app mirrors them automatically for fish swimming the other way.)
   • Each fish in the tank randomly picks one of your images, so it looks varied.
   • Any names that are missing are simply skipped.

2. To change the SIZE of every fish:
   open  src/utils/aquarium.js  and edit this one line near the top:
      export const FISH_SCALE = 1
   • 1   = normal
   • 1.5 = 50% bigger
   • 0.7 = smaller

If none of these files are here, the app uses its built-in cartoon fish.
