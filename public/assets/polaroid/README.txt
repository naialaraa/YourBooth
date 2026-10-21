CUSTOM POLAROID FRAME (optional)
================================
Drop your own transparent-PNG Instax frames here:

  public/assets/polaroid/portrait.png    (used for Portrait shots)
  public/assets/polaroid/landscape.png   (used for Landscape shots)

How it works:
- The PNG IS the whole card. Leave the photo opening fully TRANSPARENT; the photo
  is drawn into that opening and the frame is laid on top.
- Tell the app where the opening sits by editing POLAROID_FRAMES in
  src/utils/constants.js  ->  window {x, y, w, h} as fractions (0..1) of the PNG.
  Defaults assume the opening is roughly centered with a thick bottom border.

If no PNG is present, the app draws its built-in white frame automatically.
