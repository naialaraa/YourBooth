import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BoothBar } from '../../components/StageHeader.jsx'
import Countdown from '../../components/Countdown/Countdown.jsx'
import CanvasImage from '../../components/CanvasImage.jsx'
import { useCamera } from '../../hooks/useCamera.js'
import { captureFrame, downloadCanvas } from '../../utils/image.js'
import { buildStrip } from '../../utils/compositor.js'
import { playShutter, primeAudio } from '../../utils/sound.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const SHOTS = 4
const PORTRAIT = { w: 470, h: 630 }
const VINTAGE_FRAME = { bg: '#111111', accent: '#FFFFFF' }

export default function VintageBooth({ onExit }) {
  const { videoRef, ready, error, start, stop } = useCamera()
  const [phase, setPhase] = useState('idle') // idle | shooting | develop | done
  const [mode, setMode] = useState('color') // color | bw
  const [counting, setCounting] = useState(null)
  const [flash, setFlash] = useState(false)
  const [taken, setTaken] = useState(0)
  const [strip, setStrip] = useState(null)
  const [exposed, setExposed] = useState(false)
  const [devSec, setDevSec] = useState(3)
  const runningRef = useRef(false)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const shooting = phase === 'shooting'

  useEffect(() => {
    start()
  }, [start])

  const run = async () => {
    if (runningRef.current || !ready) return
    primeAudio()
    runningRef.current = true
    setPhase('shooting')
    const cells = []
    for (let i = 0; i < SHOTS; i++) {
      setTaken(i)
      for (let c = 3; c >= 1; c--) {
        setCounting(c)
        await wait(1000)
      }
      setCounting(null)
      await wait(100)
      playShutter()
      setFlash(true)
      cells.push(captureFrame(videoRef.current, PORTRAIT.w, PORTRAIT.h, { mirror: true }))
      await wait(260)
      setFlash(false)
      await wait(420)
    }
    setTaken(SHOTS)

    const composed = buildStrip({
      photos: cells,
      frame: VINTAGE_FRAME,
      film: modeRef.current === 'bw' ? 'bw' : 'color',
      cell: PORTRAIT,
      columns: 1,
      pad: 22,
      gap: 12,
      bottomPad: 44,
      radius: 0,
    })
    setStrip(composed)
    stop()

    setExposed(false)
    setDevSec(3)
    setPhase('develop')
    await wait(950)
    setExposed(true)
    for (let s = 3; s >= 0; s--) {
      setDevSec(s)
      await wait(820)
    }
    await wait(450)
    setPhase('done')
    runningRef.current = false
  }

  const reset = () => {
    runningRef.current = false
    setStrip(null)
    setExposed(false)
    setTaken(0)
    setDevSec(3)
    setPhase('idle')
    start()
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6">
      <BoothBar onExit={onExit} name="Vintage Booth" accent="#E9C9A8" />

      <div className="flex flex-1 flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {(phase === 'idle' || phase === 'shooting') && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex w-full max-w-md flex-col items-center"
            >
              <div className="relative aspect-[3/4] w-full max-w-sm">
                {/* little star, top-left like the reference */}
                <motion.span
                  className="absolute -left-3 -top-4 z-30 text-3xl"
                  animate={{ rotate: [0, 14, -8, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ⭐
                </motion.span>

                {/* the photo sits straight, aligned inside the hand-drawn frame */}
                <div className="absolute inset-[8%] overflow-hidden bg-ink no-cursor shadow-soft">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {!ready && (
                    <div className="absolute inset-0 grid place-items-center bg-ink/90 px-6 text-center text-white">
                      {error ? (
                        <div className="space-y-3">
                          <p className="font-display text-lg font-700">
                            {error === 'permission-denied' ? 'Allow camera access' : 'No camera found'}
                          </p>
                          <button onClick={start} className="btn-pop bg-pink">Retry</button>
                        </div>
                      ) : (
                        <p className="animate-pulse font-mono text-xs uppercase tracking-widest">
                          ✦ waking the camera…
                        </p>
                      )}
                    </div>
                  )}
                  <Countdown value={counting} />
                  <AnimatePresence>
                    {flash && (
                      <motion.div
                        className="absolute inset-0 bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.95 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      />
                    )}
                  </AnimatePresence>
                </div>

                <Sketchy vw={300} vh={400} stroke={7} seed={7} amp={2.4} still />

                {shooting && (
                  <span className="absolute -top-3 right-3 z-30 rounded-full border-2 border-ink bg-white px-3 py-0.5 font-mono text-[11px] font-700">
                    {Math.min(taken + 1, SHOTS)} / {SHOTS}
                  </span>
                )}
              </div>

              {/* controls */}
              <div className="mt-8 flex w-full items-center justify-between gap-4">
                <ModeLever mode={mode} setMode={setMode} disabled={shooting} />
                <motion.button
                  onClick={run}
                  disabled={!ready || shooting}
                  whileHover={shooting ? {} : { scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="flex items-center gap-2.5 font-display text-2xl font-700 text-ink disabled:opacity-100"
                >
                  <motion.span
                    className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink"
                    style={{ background: shooting ? '#FF4D4D' : '#7FE0A0' }}
                    animate={shooting ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.8, repeat: shooting ? Infinity : 0 }}
                  />
                  Take picture
                </motion.button>
              </div>
              <p className="mt-5 text-center font-body text-sm text-ink/55">
                Four portraits, one tap · live view is the real camera — the film look prints on the result.
              </p>
            </motion.div>
          )}

          {/* PRINTING / DEVELOP — like the reference machine */}
          {phase === 'develop' && (
            <motion.div
              key="develop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="flex w-full flex-col items-center"
            >
              {/* delivery sign */}
              <div className="relative w-52 px-5 py-4">
                <Sketchy vw={220} vh={210} stroke={6} double={false} seed={3} amp={3} still />
                <Screw className="left-2.5 top-2.5" />
                <Screw className="right-2.5 top-2.5" />
                <Screw className="bottom-2.5 left-2.5" />
                <Screw className="bottom-2.5 right-2.5" />
                <p className="relative text-center font-display text-lg font-700 leading-tight text-[#16233a]">
                  PHOTOS<br />DELIVERED<br />HERE IN<br />{Math.max(0, devSec)} SECONDS
                </p>
                <div className="relative mt-1 flex justify-center text-2xl text-[#16233a]">▽</div>
              </div>

              {/* metal slot the strip comes out of */}
              <div className="relative mt-4 w-56" style={{ height: '56vh' }}>
                <Sketchy vw={224} vh={460} stroke={6} seed={5} amp={3} still />
                <div className="absolute inset-[9%] overflow-hidden">
                  {/* the strip slides down, centered */}
                  <motion.div
                    className="absolute left-1/2 top-0"
                    initial={{ x: '-50%', y: '-96%' }}
                    animate={{ x: '-50%', y: '2%' }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  >
                    <div className="relative">
                      {strip && <CanvasImage canvas={strip} className="block h-[46vh] w-auto" />}
                      <motion.div
                        className="pointer-events-none absolute inset-0 bg-[#0b0b0b]"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: exposed ? 0 : 1 }}
                        transition={{ duration: 2.4, ease: 'easeInOut' }}
                      />
                    </div>
                  </motion.div>
                  {/* horizontal metal bar */}
                  <div
                    className="pointer-events-none absolute left-0 top-[34%] z-10 h-3 w-full"
                    style={{ background: 'linear-gradient(180deg,#7e7e7e,#cfcfcf 45%,#9a9a9a)' }}
                  />
                </div>
                {/* vertical metal bar — runs almost the full slot so it doesn't look like it floats */}
                <div
                  className="pointer-events-none absolute left-1/2 top-[5%] z-20 h-[91%] w-3 -translate-x-1/2"
                  style={{ background: 'linear-gradient(90deg,#7e7e7e,#cfcfcf 45%,#9a9a9a)' }}
                />
              </div>

              <p className="mt-4 animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-ink/55">
                ✦ developing ✦
              </p>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <h2 className="font-display text-3xl font-700">Your photo is ready ♡</h2>
              <motion.div
                initial={{ rotate: -2, scale: 0.96 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 12 }}
                className="mt-8 overflow-hidden border-2 border-ink shadow-soft"
              >
                {strip && <CanvasImage canvas={strip} className="block max-h-[74vh] w-auto" />}
              </motion.div>
              <div className="mt-8 flex gap-3">
                <button onClick={reset} className="btn-pop bg-purple-soft">↻ Again</button>
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => downloadCanvas(strip, 'yourbooth-vintage.png')}
                  className="btn-pop bg-pink-bold text-white"
                >
                  ↓ Save Picture
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ---- hand-drawn wobbly frame with a gentle, alive jiggle ---- */
function mulberry(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function wobble(w, h, inset, seed, amp = 6) {
  const rnd = mulberry(seed)
  const j = () => (rnd() - 0.5) * amp
  const x0 = inset
  const y0 = inset
  const x1 = w - inset
  const y1 = h - inset
  const mx1 = x0 + (x1 - x0) * 0.34
  const mx2 = x0 + (x1 - x0) * 0.67
  const my1 = y0 + (y1 - y0) * 0.34
  const my2 = y0 + (y1 - y0) * 0.67
  return (
    `M ${x0 + j()} ${y0 + j()} ` +
    `C ${mx1 + j()} ${y0 + j()}, ${mx2 + j()} ${y0 + j()}, ${x1 + j()} ${y0 + j()} ` +
    `C ${x1 + j()} ${my1 + j()}, ${x1 + j()} ${my2 + j()}, ${x1 + j()} ${y1 + j()} ` +
    `C ${mx2 + j()} ${y1 + j()}, ${mx1 + j()} ${y1 + j()}, ${x0 + j()} ${y1 + j()} ` +
    `C ${x0 + j()} ${my2 + j()}, ${x0 + j()} ${my1 + j()}, ${x0 + j()} ${y0 + j()} Z`
  )
}

function Sketchy({ vw = 300, vh = 400, stroke = 7, double = true, seed = 1, amp = 3, still = false, className = '' }) {
  const outer = useMemo(() => wobble(vw, vh, stroke * 1.4, seed, amp), [vw, vh, stroke, seed, amp])
  const inner = useMemo(() => wobble(vw, vh, stroke * 3.4, seed + 11, amp), [vw, vh, stroke, seed, amp])
  const anim = still
    ? undefined
    : { rotate: [0, 0.4, -0.4, 0], x: [0, 1, -1, 0], y: [0, -0.8, 1, 0] }
  return (
    <motion.svg
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="none"
      fill="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      animate={anim}
      transition={still ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d={outer}
        stroke="#111111"
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {double && (
        <path
          d={inner}
          stroke="#111111"
          strokeWidth={stroke * 0.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </motion.svg>
  )
}

function Screw({ className = '' }) {
  return (
    <span className={`absolute z-10 grid h-4 w-4 place-items-center rounded-full border-2 border-[#16233a] ${className}`}>
      <span className="h-0.5 w-2 rotate-45 bg-[#16233a]" />
    </span>
  )
}

/** Doodle lever: left = b&w, right = colour. */
function ModeLever({ mode, setMode, disabled }) {
  const bw = mode === 'bw'
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={() => setMode('bw')}
        disabled={disabled}
        className={`font-body text-base transition-opacity ${bw ? 'font-700 text-ink' : 'text-ink/45'}`}
      >
        b&amp;w
      </button>
      <button
        onClick={() => setMode(bw ? 'color' : 'bw')}
        disabled={disabled}
        aria-label="Toggle black & white / colour"
        className="relative h-8 w-16 rounded-full border-[3px] border-ink bg-white disabled:opacity-60"
      >
        <motion.span
          className="absolute top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border-[3px] border-ink"
          style={{ background: bw ? '#222' : '#fff' }}
          animate={{ left: bw ? '2px' : 'calc(100% - 26px)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      <button
        onClick={() => setMode('color')}
        disabled={disabled}
        className={`font-body text-base transition-opacity ${bw ? 'text-ink/45' : 'font-700 text-ink'}`}
      >
        color
      </button>
    </div>
  )
}
