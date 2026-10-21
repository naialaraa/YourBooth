import { applyFilm, applyPolaroidFilm } from './filters.js'

// Photo cell 4:3 (landscape). Bigger so each shot reads large on the strip.
const CELL_W = 640
const CELL_H = 480

export const CELL = { w: CELL_W, h: CELL_H }

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/**
 * Build a photostrip. Frame is an empty coloured border — no captions.
 * Layouts: 4 -> 2x2 grid, 6 -> 2x3 grid (column-major), everything else 1 column.
 *
 * @param {object} cfg
 * @param {HTMLCanvasElement[]} cfg.photos
 * @param {{bg:string, accent:string}} [cfg.frame]
 * @param {boolean} [cfg.noFrame]
 * @param {('color'|'bw')} [cfg.film]  optional analog treatment per cell
 * @param {{w:number,h:number}} [cfg.cell]
 * @param {number} [cfg.columns]
 * @param {number} [cfg.pad] [cfg.gap] [cfg.bottomPad] [cfg.radius]
 * @returns {HTMLCanvasElement}
 */
export function buildStrip(cfg) {
  const {
    photos,
    frame = { bg: '#FFFFFF', accent: '#111111' },
    noFrame = false,
    film,
    cell = CELL,
    columns,
    radius: radiusOpt,
    pad: padOpt,
    gap: gapOpt,
    bottomPad: bottomOpt,
  } = cfg

  const n = photos.length
  // single column for 1–4 shots (classic strip); 6 splits into 3 left + 3 right
  const cols = columns ?? (n === 6 ? 2 : 1)
  const rows = Math.ceil(n / cols)

  const pad = noFrame ? 0 : padOpt ?? 34 // top + side border
  const gap = noFrame ? 0 : gapOpt ?? 32
  const bottomPad = noFrame ? 0 : bottomOpt ?? 230 // footer (trimmed)
  const radius = noFrame ? 0 : radiusOpt ?? 22

  const cw = cell.w
  const ch = cell.h

  const W = cols * cw + (cols - 1) * gap + pad * 2
  const H = rows * ch + (rows - 1) * gap + pad + bottomPad

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  if (!noFrame) {
    ctx.fillStyle = frame.bg
    ctx.fillRect(0, 0, W, H)
    const isWhite = frame.bg.toLowerCase() === '#ffffff'
    const isBlack = frame.bg.toLowerCase() === '#111111'
    if (!isWhite && !isBlack) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      roundRect(ctx, pad * 0.32, pad * 0.32, W - pad * 0.64, H - pad * 0.64, 24)
      ctx.fill()
    }
  }

  // column-major fill so 6 reads as 3 left + 3 right
  photos.forEach((cellCanvas, i) => {
    const col = Math.floor(i / rows)
    const row = i % rows
    const x = pad + col * (cw + gap)
    const y = pad + row * (ch + gap)

    ctx.save()
    roundRect(ctx, x, y, cw, ch, radius)
    ctx.clip()
    ctx.drawImage(cellCanvas, x, y, cw, ch)
    if (film) applyFilm(ctx, x, y, cw, ch, film)
    ctx.restore()

    if (!noFrame) {
      ctx.save()
      roundRect(ctx, x + 1, y + 1, cw - 2, ch - 2, radius)
      ctx.strokeStyle = film ? 'rgba(40,30,20,0.5)' : 'rgba(17,17,17,0.16)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    }
  })

  return canvas
}

// ---- Polaroid (Instax) ----

/** subtle paper speckle so the white frame reads like real film stock. */
function paperTexture(ctx, W, H) {
  ctx.save()
  for (let i = 0; i < Math.round((W * H) / 1400); i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const a = Math.random() * 0.05
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.restore()
}

/**
 * Instax-style card. Pure-white textured frame; thick bottom (portrait) /
 * thick right (landscape). The photo gets a soft Polaroid film treatment.
 * The date is NOT baked here — it is stamped separately so it can be dragged.
 *
 * @param {object} cfg
 * @param {HTMLCanvasElement} cfg.photo
 * @param {('portrait'|'landscape')} [cfg.orientation]
 * @returns {HTMLCanvasElement}
 */
export function buildPolaroid({ photo, orientation = 'portrait', frameImg, window: win }) {
  const land = orientation === 'landscape'

  // --- custom frame PNG path: size to the PNG, drop the photo into its window ---
  if (frameImg && frameImg.complete && frameImg.naturalWidth) {
    const W = frameImg.naturalWidth
    const H = frameImg.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    const wx = (win?.x ?? 0.08) * W
    const wy = (win?.y ?? 0.06) * H
    const ww = (win?.w ?? 0.84) * W
    const wh = (win?.h ?? 0.74) * H
    ctx.save()
    ctx.beginPath()
    ctx.rect(wx, wy, ww, wh)
    ctx.clip()
    const scale = Math.max(ww / photo.width, wh / photo.height)
    const dw = photo.width * scale
    const dh = photo.height * scale
    ctx.drawImage(photo, wx + (ww - dw) / 2, wy + (wh - dh) / 2, dw, dh)
    applyPolaroidFilm(ctx, wx, wy, ww, wh)
    ctx.restore()
    ctx.drawImage(frameImg, 0, 0, W, H) // frame (with transparent window) on top
    return canvas
  }

  // --- default drawn frame ---
  // window + paper geometry
  const photoW = land ? 700 : 520
  const photoH = land ? 500 : 650
  const padTop = land ? 48 : 46
  const padLeft = land ? 48 : 50
  const padRight = land ? 150 : 50
  const padBottom = land ? 60 : 150

  const W = padLeft + photoW + padRight
  const H = padTop + photoH + padBottom

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // pure-white film paper with a whisper of texture so it isn't flat
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)
  paperTexture(ctx, W, H)
  // very faint cool edge so the white card has some depth
  const edge = ctx.createLinearGradient(0, 0, W, H)
  edge.addColorStop(0, 'rgba(244,246,248,0.45)')
  edge.addColorStop(0.5, 'rgba(255,255,255,0)')
  edge.addColorStop(1, 'rgba(242,240,244,0.45)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, W, H)

  // photo window
  const x = padLeft
  const y = padTop
  ctx.save()
  roundRect(ctx, x, y, photoW, photoH, 6)
  ctx.clip()
  const scale = Math.max(photoW / photo.width, photoH / photo.height)
  const dw = photo.width * scale
  const dh = photo.height * scale
  ctx.drawImage(photo, x + (photoW - dw) / 2, y + (photoH - dh) / 2, dw, dh)
  // analog Polaroid look: lifted blacks, warm/creamy cast, soft contrast
  applyPolaroidFilm(ctx, x, y, photoW, photoH)
  ctx.restore()

  // soft inner edge around the window
  ctx.save()
  roundRect(ctx, x, y, photoW, photoH, 6)
  ctx.strokeStyle = 'rgba(17,17,17,0.16)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  return canvas
}

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "13 June 2026" — day-number, month-name, year. */
export function polaroidDateString(d = new Date()) {
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Stamp the handwritten date onto a copy of the card at a normalised position.
 * Used on download so the user can drag the date anywhere first.
 *
 * @param {HTMLCanvasElement} card
 * @param {object} pos  { nx, ny } in 0..1 (centre of the text)
 * @param {object} [opts] { color, land }
 * @returns {HTMLCanvasElement}
 */
export function stampPolaroidDate(card, { nx, ny }, opts = {}) {
  const { color = '#1A1A1A', land = false, scale = 1 } = opts
  const out = document.createElement('canvas')
  out.width = card.width
  out.height = card.height
  const ctx = out.getContext('2d')
  ctx.drawImage(card, 0, 0)

  ctx.save()
  ctx.translate(nx * out.width, ny * out.height)
  ctx.rotate(-0.02)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const size = (land ? 38 : 46) * scale
  ctx.font = `400 ${size}px "Childhood", "Gochi Hand", cursive`
  // a hair of stroke gives the marker a slightly bolder, hand-pressed weight
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.lineWidth = 1.4
  ctx.fillStyle = color
  const text = polaroidDateString()
  ctx.strokeText(text, 0, 0)
  ctx.fillText(text, 0, 0)
  ctx.restore()

  return out
}
