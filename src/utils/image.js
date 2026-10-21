// Low-level canvas/image helpers shared by every booth.

/** Load an image URL into an HTMLImageElement (resolves even cross-origin if served same-host). */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Draw a video frame into an offscreen canvas, cropping "cover" to a target aspect.
 * @param {HTMLVideoElement} video
 * @param {number} targetW  output pixel width
 * @param {number} targetH  output pixel height
 * @param {object} opts
 * @param {boolean} opts.mirror  flip horizontally (selfie view)
 * @param {(ctx:CanvasRenderingContext2D, w:number, h:number)=>void} opts.decorate
 *        optional callback drawn on top of the (un-mirrored) photo — used to bake
 *        the aquarium overlay into the final image.
 * @returns {HTMLCanvasElement}
 */
export function captureFrame(video, targetW, targetH, opts = {}) {
  const { mirror = true, decorate } = opts
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')

  const vw = video.videoWidth || targetW
  const vh = video.videoHeight || targetH

  // cover-fit: scale source so it fully covers the target, crop the overflow
  const scale = Math.max(targetW / vw, targetH / vh)
  const dw = vw * scale
  const dh = vh * scale
  const dx = (targetW - dw) / 2
  const dy = (targetH - dh) / 2

  ctx.save()
  if (mirror) {
    ctx.translate(targetW, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, dx, dy, dw, dh)
  ctx.restore()

  // overlays drawn un-mirrored so emoji/decorations stay readable
  if (typeof decorate === 'function') decorate(ctx, targetW, targetH)

  return canvas
}

/** Trigger a browser download of a canvas as a PNG. No server involved. */
export function downloadCanvas(canvas, filename = 'yourbooth.png') {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    // give the browser a tick before revoking
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}

/** A friendly timestamp stamped onto strips, e.g. "06 · 13 · 26". */
export function stampDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)} · ${p(d.getDate())} · ${String(d.getFullYear()).slice(2)}`
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Handwritten-style date: day-number, month-name, year — e.g. "13 June 2026". */
export function stampDateLong(d = new Date()) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
