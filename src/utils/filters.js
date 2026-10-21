// Analog-film treatments applied per photo cell so grain stays crisp.

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function vignette(ctx, x, y, w, h, edge) {
  const cx = x + w / 2
  const cy = y + h / 2
  const radius = Math.max(w, h) * 0.72
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, edge)
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)
}

/**
 * Colour film: keep the real colours, just add fine grain + a soft vignette.
 */
export function applyFilmColor(ctx, x, y, w, h) {
  const image = ctx.getImageData(x, y, w, h)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 20
    data[i] = clamp(data[i] * 1.02 + grain)
    data[i + 1] = clamp(data[i + 1] * 1.01 + grain)
    data[i + 2] = clamp(data[i + 2] * 0.99 + grain)
  }
  ctx.putImageData(image, x, y)
  vignette(ctx, x, y, w, h, 'rgba(20,16,12,0.34)')
}

/**
 * Classic analog photobooth black & white: a warm, grayish-brown monochrome.
 * Punchy mid contrast with soft highlight/shadow roll-off so faces stay clear
 * but transitions are gentle; the range is slightly faded for a nostalgic,
 * film-printed feel.
 */
export function applyFilmBW(ctx, x, y, w, h) {
  const image = ctx.getImageData(x, y, w, h)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    let t = lum / 255
    // smoothstep S-curve = strong mid contrast with soft shoulders
    const s = t * t * (3 - 2 * t)
    let c = t * 0.32 + s * 0.68
    if (c < 0) c = 0
    else if (c > 1) c = 1
    // faded: lifted blacks, pulled-down whites (reduced dynamic range)
    c = 0.08 + c * 0.86
    const v = c * 255
    const warm = (1 - c) * 16 // shadows lean browner
    const grain = (Math.random() - 0.5) * 18
    data[i] = clamp(v + warm + 6 + grain) // R
    data[i + 1] = clamp(v + warm * 0.4 + 3 + grain) // G
    data[i + 2] = clamp(v - warm - 2 + grain) // B (warm = less blue)
  }
  ctx.putImageData(image, x, y)
  vignette(ctx, x, y, w, h, 'rgba(40,30,20,0.36)')
}

/** Dispatch by mode: 'color' | 'bw'. */
export function applyFilm(ctx, x, y, w, h, mode) {
  if (mode === 'bw') applyFilmBW(ctx, x, y, w, h)
  else if (mode === 'color') applyFilmColor(ctx, x, y, w, h)
}

/**
 * Modern instant-film (Fujifilm Instax) look: warm tone, soft contrast and
 * slightly reduced saturation. Whites drift to cream/off-white while skin and
 * objects pick up gentle peach + soft-yellow — bright, warm, a touch nostalgic.
 */
export function applyPolaroidFilm(ctx, x, y, w, h) {
  const image = ctx.getImageData(x, y, w, h)
  const data = image.data
  // tonal curve: deepen shadows (higher low-end contrast), keep highlights clean
  const curve = (v) => {
    const t = v / 255
    const k = t < 0.46 ? 1.3 : 1.05
    return (0.46 + (t - 0.46) * k) * 255
  }
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    const lum = r * 0.299 + g * 0.587 + b * 0.114

    // medium saturation (only a touch of desaturation → stays realistic)
    r += (lum - r) * 0.1
    g += (lum - g) * 0.1
    b += (lum - b) * 0.1

    r = curve(r)
    g = curve(g)
    b = curve(b)

    // warm peach cast
    r += 11
    g += 5
    b -= 10

    // clean off-white highlights
    const hl = Math.max(0, (lum - 168) / 87)
    r += 4 * hl
    g += 2 * hl
    b -= 7 * hl

    const grain = (Math.random() - 0.5) * 8
    data[i] = clamp(r + grain)
    data[i + 1] = clamp(g + grain)
    data[i + 2] = clamp(b + grain)
  }
  ctx.putImageData(image, x, y)

  // faint cream bloom + very light warm vignette (shadows already deepened)
  ctx.save()
  ctx.fillStyle = 'rgba(255,247,231,0.08)'
  ctx.fillRect(x, y, w, h)
  ctx.restore()
  vignette(ctx, x, y, w, h, 'rgba(70,52,34,0.16)')
}
