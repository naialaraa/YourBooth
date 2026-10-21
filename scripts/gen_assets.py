#!/usr/bin/env python3
"""Generate static booth preview thumbnails (shown on the home page hover)."""
import os, random
from PIL import Image, ImageDraw, ImageFont

random.seed(7)
OUT = "public/assets"
os.makedirs(f"{OUT}/previews", exist_ok=True)

INK = (17, 17, 17, 255)

def font(size, bold=True):
    p = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(p, size) if os.path.exists(p) else ImageFont.load_default()

# soft solid pastel "photo" with a gentle white silhouette (no harsh gradients)
PASTELS = [(255, 188, 214), (180, 215, 255), (203, 186, 255), (189, 237, 230), (255, 213, 170)]
def cell_photo(w, h):
    base = random.choice(PASTELS)
    img = Image.new("RGBA", (w, h), base + (255,))
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([w*0.30, h*0.16, w*0.70, h*0.60], fill=(255, 255, 255, 70))   # head
    d.ellipse([w*0.36, h*0.45, w*0.64, h*1.05], fill=(255, 255, 255, 50))   # body
    return img

def sepia(img):
    px = img.load(); w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            px[x, y] = (min(255, int(r*0.39+g*0.77+b*0.19)),
                        min(255, int(r*0.35+g*0.69+b*0.17)),
                        min(255, int(r*0.27+g*0.53+b*0.13)), a)
    return img

def draw_fish(d, cx, cy, s, col):
    d.ellipse([cx-s, cy-s*0.6, cx+s, cy+s*0.6], fill=col)
    d.polygon([(cx+s*0.6, cy), (cx+s*1.3, cy-s*0.55), (cx+s*1.3, cy+s*0.55)], fill=col)
    d.ellipse([cx-s*0.55, cy-s*0.18, cx-s*0.2, cy+s*0.18], fill=(40, 70, 90, 255))

def draw_star(d, cx, cy, s, col):
    import math
    pts = []
    for i in range(10):
        ang = -math.pi/2 + i*math.pi/5
        r = s if i % 2 == 0 else s*0.45
        pts.append((cx+r*math.cos(ang), cy+r*math.sin(ang)))
    d.polygon(pts, fill=col)

def strip(n, frame_bg, cols=1, portrait=False, vintage=False, aqua=False,
          stickers=None, pad=22, gap=12, bottom=None, radius=14, cw=None, ch=None):
    cw = cw or (130 if portrait else 220)
    ch = ch or (180 if portrait else 165)
    bottom = pad if bottom is None else bottom
    rows = -(-n // cols)
    W = cols*cw + (cols-1)*gap + pad*2
    H = pad + rows*ch + (rows-1)*gap + bottom
    canvas = Image.new("RGBA", (W, H), frame_bg)
    d = ImageDraw.Draw(canvas, "RGBA")
    for i in range(n):
        col, row = i // rows, i % rows
        x = pad + col*(cw+gap)
        y = pad + row*(ch+gap)
        c = cell_photo(cw, ch)
        if vintage:
            c = sepia(c)
        m = Image.new("L", (cw, ch), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, cw, ch], radius=radius, fill=255)
        canvas.paste(c, (x, y), m)
        d.rounded_rectangle([x, y, x+cw, y+ch], radius=radius, outline=(17, 17, 17, 60), width=2)
        if aqua:
            fishcols = [(255, 150, 120, 255), (255, 205, 110, 255), (255, 130, 175, 255)]
            for _ in range(3):
                fx = x + random.randint(24, cw-24); fy = y + random.randint(24, ch-24)
                draw_fish(d, fx, fy, random.randint(10, 15), random.choice(fishcols))
            for _ in range(4):
                bx = x + random.randint(6, cw-10); by = y + random.randint(6, ch-10); r = random.randint(3, 7)
                d.ellipse([bx, by, bx+r, by+r], outline=(255,255,255,170), width=2)
    if stickers:
        for sx, sy, gl, col in stickers:
            d.text((sx, sy), gl, font=font(30), fill=col)
    d.rounded_rectangle([2, 2, W-3, H-3], radius=18, outline=INK, width=3)
    return canvas

PINK = (255, 158, 196, 255)
VINT = (242, 226, 201, 255)
AQUA = (140, 203, 255, 255)

# Classic — pink empty frame, 3 landscape cells, drawn stars + a doodle accent
o = strip(3, PINK)
od = ImageDraw.Draw(o, "RGBA")
od.line([(40, 120), (90, 95), (150, 130), (210, 100)], fill=(167,134,255,255), width=6, joint="curve")
draw_star(od, 208, 40, 16, (255, 214, 64, 255))
draw_star(od, 34, 250, 13, (255, 143, 184, 255))
o.save(f"{OUT}/previews/classic.png")

# Vintage — 4 portrait sepia cells, thin cream frame with an even thinner bottom
strip(4, VINT, portrait=True, vintage=True, pad=14, gap=9, bottom=10, radius=10,
      cw=150, ch=200).save(f"{OUT}/previews/vintage.png")

# Aquarium — sky frame, 3 cells, fish + bubbles (no light shafts)
strip(3, AQUA, aqua=True).save(f"{OUT}/previews/aquarium.png")

# Polaroid — square photo + marker-ish date, no caption
def polaroid():
    W, H = 250, 300
    c = Image.new("RGBA", (W, H), (253, 251, 246, 255))
    d = ImageDraw.Draw(c, "RGBA")
    photo = cell_photo(200, 200)
    m = Image.new("L", (200, 200), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, 200, 200], radius=8, fill=255)
    c.paste(photo, (25, 22), m)
    d.rounded_rectangle([25, 22, 225, 222], radius=8, outline=(17, 17, 17, 40), width=2)
    f = font(26)
    txt = "06 / 13 / 26"
    tw = d.textlength(txt, font=f)
    d.text(((W-tw)/2, 246), txt, font=f, fill=(42, 42, 42, 255))
    d.rounded_rectangle([2, 2, W-3, H-3], radius=16, outline=INK, width=3)
    return c
polaroid().save(f"{OUT}/previews/polaroid.png")

# ---- placeholder booth illustrations (replace with your own PNGs) ----
os.makedirs(f"{OUT}/booths", exist_ok=True)

def booth_base(body, sign_text, sign_col, curtain, accent_dark):
    W, H = 560, 620
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    # awning / sign
    d.rounded_rectangle([110, 40, 450, 120], radius=14, fill=sign_col, outline=INK, width=5)
    f = font(40)
    tw = d.textlength(sign_text, font=f)
    d.text(((W-tw)/2, 58), sign_text, font=f, fill=(255, 255, 255, 255))
    # body
    d.rounded_rectangle([80, 120, 480, 560], radius=26, fill=body, outline=INK, width=6)
    # doorway with curtain
    d.rounded_rectangle([140, 180, 420, 540], radius=16, fill=(245, 240, 232, 255), outline=INK, width=5)
    d.rounded_rectangle([150, 188, 290, 532], radius=10, fill=curtain, outline=INK, width=4)
    for cx in range(165, 290, 26):
        d.line([(cx, 192), (cx, 528)], fill=accent_dark, width=3)
    # stool
    d.rounded_rectangle([320, 470, 400, 490], radius=8, fill=accent_dark, outline=INK, width=4)
    d.line([(330, 490), (330, 532)], fill=INK, width=5)
    d.line([(390, 490), (390, 532)], fill=INK, width=5)
    img.save(f"{OUT}/booths/{body_name}.png")

# classic — cream booth, pink sign, red curtain
body_name = "classic"; booth_base((255, 241, 224, 255), "PHOTO", (255, 158, 196, 255), (214, 80, 96, 255), (150, 40, 56, 255))
# vintage — brown booth, dark red sign
body_name = "vintage"; booth_base((176, 122, 74, 255), "PHOTOS", (150, 60, 50, 255), (110, 60, 40, 255), (70, 36, 22, 255))
# aquarium — blue booth
body_name = "aquarium"; booth_base((120, 180, 240, 255), "PHOTO", (60, 120, 200, 255), (90, 150, 220, 255), (40, 80, 150, 255))

# polaroid — an instax-style camera instead of a booth
def polaroid_cam():
    W, H = 560, 620
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle([90, 170, 470, 470], radius=30, fill=(250, 246, 238, 255), outline=INK, width=6)
    # rainbow stripe
    for i, c in enumerate([(255,143,184,255),(255,211,126,255),(168,216,255,255),(165,134,255,255)]):
        d.rectangle([90, 200+i*16, 150, 216+i*16], fill=c)
    # lens
    d.ellipse([210, 230, 350, 370], fill=(40, 40, 48, 255), outline=INK, width=6)
    d.ellipse([245, 265, 315, 335], fill=(90, 110, 130, 255))
    d.ellipse([262, 282, 290, 310], fill=(200, 220, 235, 255))
    # shutter button + small lens
    d.ellipse([150, 250, 195, 295], fill=(214, 80, 96, 255), outline=INK, width=5)
    d.ellipse([380, 250, 420, 290], fill=(60, 60, 70, 255), outline=INK, width=5)
    # ejected photo
    d.rounded_rectangle([200, 430, 360, 560], radius=8, fill=(255, 255, 255, 255), outline=INK, width=5)
    d.rectangle([214, 444, 346, 528], fill=(180, 215, 255, 255))
    img.save(f"{OUT}/booths/polaroid.png")
polaroid_cam()

print("previews:", sorted(os.listdir(f"{OUT}/previews")), "booths:", sorted(os.listdir(f"{OUT}/booths")))
