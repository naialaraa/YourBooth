// Robust SFX: pre-rendered WAV data-URIs played through <audio> elements.
// This works in more environments (incl. sandboxed iframes) than raw WebAudio,
// and unlocks automatically on the first user interaction anywhere on the page.

const RATE = 22050

function encodeWav(samples) {
  const len = samples.length
  const buf = new ArrayBuffer(44 + len * 2)
  const dv = new DataView(buf)
  const wr = (off, s) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i))
  }
  wr(0, 'RIFF')
  dv.setUint32(4, 36 + len * 2, true)
  wr(8, 'WAVE')
  wr(12, 'fmt ')
  dv.setUint32(16, 16, true)
  dv.setUint16(20, 1, true)
  dv.setUint16(22, 1, true)
  dv.setUint32(24, RATE, true)
  dv.setUint32(28, RATE * 2, true)
  dv.setUint16(32, 2, true)
  dv.setUint16(34, 16, true)
  wr(36, 'data')
  dv.setUint32(40, len * 2, true)
  let off = 44
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    off += 2
  }
  let bin = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return 'data:audio/wav;base64,' + btoa(bin)
}

function genShutter() {
  const n = Math.floor(RATE * 0.15)
  const a = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / RATE
    const env1 = Math.max(0, 1 - t / 0.045)
    const env2 = t > 0.06 ? Math.max(0, 1 - (t - 0.06) / 0.08) : 0
    a[i] = (Math.random() * 2 - 1) * env1 * 0.85 + (Math.random() * 2 - 1) * env2 * 0.6
  }
  return a
}

function genTick(freq) {
  const n = Math.floor(RATE * 0.14)
  const a = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / RATE
    const env = Math.exp(-t * 20)
    a[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.8
  }
  return a
}

let shutterURI = ''
let tickLoURI = ''
let tickHiURI = ''
function ensure() {
  if (shutterURI || typeof window === 'undefined') return
  try {
    shutterURI = encodeWav(genShutter())
    tickLoURI = encodeWav(genTick(620))
    tickHiURI = encodeWav(genTick(880))
  } catch {
    /* ignore */
  }
}

function play(uri, vol) {
  if (!uri) return
  try {
    const a = new Audio(uri)
    a.volume = vol
    const p = a.play()
    if (p && p.catch) p.catch(() => {})
  } catch {
    /* ignore */
  }
}

/** Unlock audio during a user gesture (also auto-bound to first interaction). */
export function primeAudio() {
  ensure()
  if (!shutterURI) return
  try {
    const a = new Audio(shutterURI)
    a.volume = 0
    const p = a.play()
    if (p && p.then) p.then(() => { a.pause(); a.currentTime = 0 }).catch(() => {})
  } catch {
    /* ignore */
  }
}

export function playShutter() {
  ensure()
  play(shutterURI, 0.9)
}

export function playTick(accent = false) {
  ensure()
  play(accent ? tickHiURI : tickLoURI, accent ? 0.65 : 0.5)
}

ensure()

if (typeof window !== 'undefined') {
  const kick = () => primeAudio()
  window.addEventListener('pointerdown', kick)
  window.addEventListener('touchstart', kick)
  window.addEventListener('keydown', kick)
}
