// A small shared fish "school". The same fish array is animated by the live
// overlay AND read by the photo bake, so what you see is what gets saved.
// Fish are drawn as vector shapes (not emoji) so they render identically on the
// live canvas and the exported PNG.

const COLORS = ['#FF9F68', '#FF6FA5', '#6EC1FF', '#FFD166', '#7FE0C9', '#C9A0FF']

// ============================================================
//  CUSTOM FISH (optional)
//  • Drop transparent PNGs in:  public/assets/fish/
//    Named exactly:  fish.png, fish1.png, fish2.png ... up to fish6.png
//    (you can use just 1, or all 7 — each fish picks one at random)
//    Draw them facing RIGHT →  — they get mirrored automatically.
//  • Make every fish bigger/smaller with FISH_SCALE below
//    (1 = normal, 1.5 = 50% bigger, 0.7 = smaller, etc.)
//  If no PNGs are found, the built-in cartoon fish is used instead.
// ============================================================
export const FISH_SCALE = 1

const FISH_NAMES = ['fish', 'fish1', 'fish2', 'fish3', 'fish4', 'fish5', 'fish6']
const base = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/'
const fishImgs = new Array(FISH_NAMES.length).fill(null)
if (typeof window !== 'undefined') {
  FISH_NAMES.forEach((name, i) => {
    const im = new Image()
    im.onload = () => {
      if (im.naturalWidth) fishImgs[i] = im
    }
    im.src = `${base}assets/fish/${name}.png`
  })
}

// ============================================================
//  CUSTOM BUBBLES (optional)
//  • Drop transparent PNGs in:  public/assets/bubbles/
//    Named exactly:  bubble.png  and  bubble1.png  (2 kinds)
//    (you can use just 1 or both — bubbles pick one at random)
//  • Resize all bubbles with BUBBLE_SCALE below (1 = normal).
//  If no PNGs are found, simple drawn bubbles are used instead.
// ============================================================
export const BUBBLE_SCALE = 1

const BUBBLE_NAMES = ['bubble', 'bubble1']
const bubbleImgs = new Array(BUBBLE_NAMES.length).fill(null)
if (typeof window !== 'undefined') {
  BUBBLE_NAMES.forEach((name, i) => {
    const im = new Image()
    im.onload = () => {
      if (im.naturalWidth) bubbleImgs[i] = im
    }
    im.src = `${base}assets/bubbles/${name}.png`
  })
}

/** Draw a bubble of diameter d at (x,y): custom PNG if present, else a drawn circle. */
export function drawBubble(ctx, x, y, d, key = 0) {
  const img = bubbleImgs[key] || bubbleImgs.find(Boolean)
  const size = d * BUBBLE_SCALE
  if (img) {
    const ih = size * (img.naturalHeight / img.naturalWidth)
    ctx.drawImage(img, x - size / 2, y - ih / 2, size, ih)
  } else {
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.stroke()
  }
}

function spawn(dir, y) {
  return {
    dir, // +1 swims left->right, -1 swims right->left
    x: dir > 0 ? -0.15 - Math.random() * 0.35 : 1.15 + Math.random() * 0.35,
    y: y ?? 0.12 + Math.random() * 0.72,
    speed: 0.07 + Math.random() * 0.12, // fraction of width per second
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 0.12 + Math.random() * 0.06, // fraction of height (body length)
    wob: Math.random() * Math.PI * 2,
    key: Math.floor(Math.random() * FISH_NAMES.length), // which custom PNG (if any)
  }
}

/** 4 fish swimming right, 4 swimming left, each on its own random row. */
export function makeFishSchool() {
  const rows = (n) => {
    const ys = []
    for (let i = 0; i < n; i++) ys.push(0.1 + (0.78 * (i + Math.random() * 0.7)) / n)
    return ys.sort(() => Math.random() - 0.5)
  }
  const r = rows(4)
  const l = rows(4)
  return [...r.map((y) => spawn(1, y)), ...l.map((y) => spawn(-1, y))]
}

/** Advance positions by dt seconds; respawn on the far side when off-screen. */
export function stepFish(fish, dt) {
  fish.forEach((f) => {
    f.x += f.dir * f.speed * dt
    f.wob += dt * 2.4
    if (f.dir > 0 && f.x > 1.25) Object.assign(f, spawn(1))
    else if (f.dir < 0 && f.x < -0.25) Object.assign(f, spawn(-1))
  })
}

/** lighten/darken a #rrggbb hex by amt (-255..255). */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt))
  const b = Math.max(0, Math.min(255, (n & 255) + amt))
  return `rgb(${r},${g},${b})`
}

/** A cute cartoon fish, drawn facing +x (right). */
function oneFish(ctx, len, color) {
  const rx = len * 0.5
  const ry = len * 0.34
  const dark = shade(color, -22)

  // tail
  ctx.beginPath()
  ctx.moveTo(-rx * 0.7, 0)
  ctx.lineTo(-rx * 1.5, -ry * 0.9)
  ctx.quadraticCurveTo(-rx * 1.15, 0, -rx * 1.5, ry * 0.9)
  ctx.closePath()
  ctx.fillStyle = dark
  ctx.fill()

  // top fin
  ctx.beginPath()
  ctx.moveTo(-rx * 0.1, -ry * 0.78)
  ctx.quadraticCurveTo(rx * 0.1, -ry * 1.5, rx * 0.45, -ry * 0.6)
  ctx.closePath()
  ctx.fillStyle = dark
  ctx.fill()

  // body
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // belly highlight
  ctx.beginPath()
  ctx.ellipse(rx * 0.1, ry * 0.28, rx * 0.6, ry * 0.42, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.fill()

  // eye
  ctx.beginPath()
  ctx.arc(rx * 0.52, -ry * 0.18, ry * 0.2, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(rx * 0.57, -ry * 0.18, ry * 0.1, 0, Math.PI * 2)
  ctx.fillStyle = '#1A1A1A'
  ctx.fill()
}

export function drawFish(ctx, w, h, fish) {
  fish.forEach((f) => {
    const px = f.x * w
    const py = (f.y + Math.sin(f.wob) * 0.014) * h
    const len = f.size * h * FISH_SCALE
    ctx.save()
    ctx.translate(px, py)
    // body drawn facing right (+x); flip for fish swimming left
    if (f.dir < 0) ctx.scale(-1, 1)
    ctx.rotate(Math.sin(f.wob) * 0.08 * (f.dir < 0 ? -1 : 1))
    const img = fishImgs[f.key] || fishImgs.find(Boolean)
    if (img) {
      const iw = len * 1.4
      const ih = iw * (img.naturalHeight / img.naturalWidth)
      ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih)
    } else {
      oneFish(ctx, len, f.color)
    }
    ctx.restore()
  })
}

export function drawTint(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, 'rgba(150,205,255,0.20)')
  g.addColorStop(1, 'rgba(170,225,255,0.22)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function staticBubbles(ctx, w, h) {
  for (let i = 0; i < 14; i++) {
    const d = (4 + Math.random() * 12) * 2
    drawBubble(ctx, Math.random() * w, Math.random() * h, d, Math.floor(Math.random() * BUBBLE_NAMES.length))
  }
}

/**
 * Build the per-shot bake fn bound to a live fish array. The fish are drawn at
 * their current positions, so the saved photo matches the preview.
 */
export function decorateAquarium(fish) {
  return (ctx, w, h) => {
    drawTint(ctx, w, h)
    drawFish(ctx, w, h, fish)
    staticBubbles(ctx, w, h)
  }
}
