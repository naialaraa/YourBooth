import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BoothBar } from '../../components/StageHeader.jsx'
import Countdown from '../../components/Countdown/Countdown.jsx'
import CanvasImage from '../../components/CanvasImage.jsx'
import { useCamera } from '../../hooks/useCamera.js'
import { captureFrame, downloadCanvas } from '../../utils/image.js'
import { playShutter, primeAudio } from '../../utils/sound.js'
import { buildPolaroid, stampPolaroidDate, polaroidDateString } from '../../utils/compositor.js'
import { POLAROID_FRAMES } from '../../utils/constants.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const base = import.meta.env.BASE_URL

export default function PolaroidBooth({ onExit }) {
  const { videoRef, ready, error, start, stop } = useCamera()
  const [phase, setPhase] = useState('camera') // camera | develop | done
  const [countdownOn, setCountdownOn] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [orientation, setOrientation] = useState('portrait') // portrait | landscape
  const [counting, setCounting] = useState(null)
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const [developed, setDeveloped] = useState(false)
  const [card, setCard] = useState(null)
  const [datePos, setDatePos] = useState({ nx: 0.5, ny: 0.91 })
  const [dateScale, setDateScale] = useState(1)
  const [cardDispW, setCardDispW] = useState(0)
  const doneRef = useRef(false)
  const cardBoxRef = useRef(null)
  const dateDragRef = useRef(false)
  const dateResizeRef = useRef(null)
  const frameImgs = useRef({ portrait: null, landscape: null })

  useEffect(() => {
    start()
  }, [start])

  // preload optional custom frame PNGs (used automatically if present)
  useEffect(() => {
    ;['portrait', 'landscape'].forEach((o) => {
      const img = new Image()
      img.onload = () => {
        frameImgs.current[o] = img
      }
      img.onerror = () => {
        frameImgs.current[o] = null
      }
      img.src = `${base}assets/polaroid/${o}.png`
    })
  }, [])

  // measure the displayed card width so the on-screen date matches the export
  useEffect(() => {
    const el = cardBoxRef.current
    if (!el) return
    const update = () => setCardDispW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [card, phase])

  const shoot = async () => {
    if (busy || !ready) return
    primeAudio() // unlock AudioContext on the user gesture so the shutter is audible after the countdown
    setBusy(true)
    if (countdownOn) {
      for (let c = 3; c >= 1; c--) {
        setCounting(c)
        await wait(950)
      }
      setCounting(null)
      await wait(120)
    }
    playShutter()
    setFlash(true)
    await document.fonts?.ready?.catch(() => {})
    const land = orientation === 'landscape'
    const shot = captureFrame(videoRef.current, land ? 840 : 640, land ? 600 : 800, { mirror: true })
    const polaroid = buildPolaroid({
      photo: shot,
      orientation,
      frameImg: frameImgs.current[orientation],
      window: POLAROID_FRAMES[orientation]?.window,
    })
    // start the date in the wide border; the user can drag it anywhere
    setDatePos(land ? { nx: 0.55, ny: 0.9 } : { nx: 0.5, ny: 0.91 })
    setDateScale(1)
    setCard(polaroid)
    await wait(280)
    setFlash(false)
    stop()
    setPhase('develop')
    // slide out, then develop over ~2.6s
    await wait(1300)
    setDeveloped(true)
    await wait(2600)
    if (!doneRef.current) {
      doneRef.current = true
      setPhase('done')
    }
    setBusy(false)
  }

  const reset = () => {
    doneRef.current = false
    setCard(null)
    setDeveloped(false)
    setPhase('camera')
    setBusy(false)
    start()
  }

  // --- draggable + resizable date on the finished card ---
  const onDatePointerDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    dateDragRef.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onDateResizeDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const box = cardBoxRef.current?.getBoundingClientRect()
    if (!box) return
    const cx = box.left + datePos.nx * box.width
    const cy = box.top + datePos.ny * box.height
    dateResizeRef.current = {
      cx,
      cy,
      startDist: Math.hypot(e.clientX - cx, e.clientY - cy) || 1,
      startScale: dateScale,
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onDateAreaMove = (e) => {
    if (dateResizeRef.current) {
      const r = dateResizeRef.current
      const dist = Math.hypot(e.clientX - r.cx, e.clientY - r.cy)
      setDateScale(Math.min(3, Math.max(0.45, r.startScale * (dist / r.startDist))))
      return
    }
    if (!dateDragRef.current || !cardBoxRef.current) return
    const box = cardBoxRef.current.getBoundingClientRect()
    setDatePos({
      nx: Math.min(0.97, Math.max(0.03, (e.clientX - box.left) / box.width)),
      ny: Math.min(0.97, Math.max(0.03, (e.clientY - box.top) / box.height)),
    })
  }
  const onDateAreaUp = () => {
    dateDragRef.current = false
    dateResizeRef.current = null
  }

  const download = async () => {
    if (!card) return
    try {
      await document.fonts?.load?.('19px "Childhood"')
      await document.fonts?.load?.('19px "Gochi Hand"')
      await document.fonts?.ready
    } catch {
      /* font fallback is fine */
    }
    const land = orientation === 'landscape'
    const out = showDate
      ? stampPolaroidDate(card, datePos, { land, color: '#1A1A1A', scale: dateScale })
      : card
    downloadCanvas(out, 'yourbooth-polaroid.png')
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6">
      <BoothBar onExit={onExit} name="Polaroid" accent="#FFF8EE" />

      <div className="flex flex-1 flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* CAMERA */}
          {phase === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg"
            >
              {/* cute instax body */}
              <div className="relative rounded-[2.5rem] border-2 border-ink bg-cream p-5 shadow-soft">
                {/* rainbow stripe */}
                <div className="absolute left-6 top-0 flex h-3 w-24 -translate-y-1/2 overflow-hidden rounded-full border-2 border-ink">
                  {['#FF8FB8', '#FFD37E', '#A8D8FF', '#A586FF'].map((c) => (
                    <span key={c} className="h-full flex-1" style={{ background: c }} />
                  ))}
                </div>

                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="font-display text-lg font-700">instax · mini</span>
                  <span className="h-4 w-4 rounded-full border-2 border-ink bg-pink-bold" />
                </div>

                {/* orientation picker */}
                <div className="mb-3 flex justify-center">
                  <div className="flex items-center gap-1 rounded-full border-2 border-ink bg-white p-1">
                    {[
                      { label: 'Portrait', val: 'portrait' },
                      { label: 'Landscape', val: 'landscape' },
                    ].map((o) => (
                      <button
                        key={o.val}
                        onClick={() => setOrientation(o.val)}
                        className={`rounded-full px-3 py-1 font-mono text-[11px] font-700 transition-colors ${
                          orientation === o.val ? 'bg-ink text-white' : 'text-ink/60'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* lens / viewport */}
                <div
                  className={`relative mx-auto w-full overflow-hidden rounded-[1.6rem] border-[3px] border-ink bg-ink no-cursor ${
                    orientation === 'landscape' ? 'aspect-[7/5]' : 'aspect-[4/5]'
                  }`}
                >
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
                          <button onClick={start} className="btn-pop bg-pink">
                            Retry
                          </button>
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

                {/* controls — timer left · shutter centre · date right */}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 rounded-full border-2 border-ink bg-white p-1">
                    {[
                      { label: 'Off', val: false },
                      { label: '3s', val: true },
                    ].map((o) => (
                      <motion.button
                        key={o.label}
                        onClick={() => setCountdownOn(o.val)}
                        whileTap={{ scale: 0.88 }}
                        className={`rounded-full px-3 py-1 font-mono text-[11px] font-700 transition-colors ${
                          countdownOn === o.val ? 'bg-ink text-white' : 'text-ink/60'
                        }`}
                      >
                        {o.label}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    onClick={shoot}
                    disabled={!ready || busy}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.82 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className="grid h-[72px] w-[72px] place-items-center rounded-full border-2 border-ink bg-white shadow-pop disabled:opacity-50"
                    aria-label="Take photo"
                  >
                    <motion.span
                      className="h-11 w-11 rounded-full border-2 border-ink bg-pink-bold"
                      animate={busy ? { scale: 1 } : { scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.4, repeat: busy ? 0 : Infinity, ease: 'easeInOut' }}
                    />
                  </motion.button>

                  <div className="flex items-center gap-1 rounded-full border-2 border-ink bg-white p-1">
                    {[
                      { label: 'Date', val: true },
                      { label: 'No', val: false },
                    ].map((o) => (
                      <motion.button
                        key={o.label}
                        onClick={() => setShowDate(o.val)}
                        whileTap={{ scale: 0.88 }}
                        className={`rounded-full px-3 py-1 font-mono text-[11px] font-700 transition-colors ${
                          showDate === o.val ? 'bg-ink text-white' : 'text-ink/60'
                        }`}
                      >
                        {o.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center font-body text-ink/60">
                One photo, no edits — just a keepsake.
              </p>
            </motion.div>
          )}

          {/* DEVELOPING */}
          {phase === 'develop' && (
            <motion.div
              key="develop"
              className="relative flex h-[70vh] w-full flex-col items-center justify-start"
            >
              {/* camera slot */}
              <div className="relative z-20 w-72 rounded-[2rem] border-2 border-ink bg-cream pb-2 pt-4 shadow-soft">
                <p className="text-center font-display font-700">printing…</p>
                <div className="mx-auto mt-3 h-3 w-56 rounded-full border-2 border-ink bg-ink/80" />
              </div>

              {/* photo emerging from the slot */}
              <motion.div
                className="relative z-10 -mt-2"
                initial={{ y: -40, opacity: 0.2 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              >
                <motion.div
                  animate={{ rotate: [0, -1.5, 1, 0] }}
                  transition={{ duration: 1.6, delay: 1.2, repeat: Infinity, repeatType: 'mirror' }}
                  className="relative overflow-hidden rounded-xl border-2 border-ink shadow-soft"
                >
                  {card && <CanvasImage canvas={card} className="block w-56" />}
                  {/* developing overlay: white fades away */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-[#fdfbf6]"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: developed ? 0 : 1 }}
                    transition={{ duration: 2.6, ease: 'easeInOut' }}
                  />
                </motion.div>
              </motion.div>

              <p className="mt-6 animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
                ✦ developing ✦
              </p>
            </motion.div>
          )}

          {/* DONE */}
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <h2 className="font-display text-3xl font-700">Your memory is ready ♡</h2>
              {showDate && (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/55">
                  drag the date · resize from the ⤢ corner
                </p>
              )}
              <motion.div
                initial={{ rotate: -3, scale: 0.96 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 12 }}
                ref={cardBoxRef}
                onPointerMove={onDateAreaMove}
                onPointerUp={onDateAreaUp}
                className="relative mt-6 rounded-xl border-2 border-ink shadow-soft"
              >
                {card && (
                  <CanvasImage canvas={card} className="block max-h-[58vh] w-auto rounded-[10px]" />
                )}
                {showDate && (
                  <span
                    onPointerDown={onDatePointerDown}
                    style={{
                      left: `${datePos.nx * 100}%`,
                      top: `${datePos.ny * 100}%`,
                      fontFamily: '"Childhood", "Gochi Hand", cursive',
                      color: '#1A1A1A',
                      WebkitTextStroke: '0.4px #1A1A1A',
                      fontSize: `${
                        cardDispW && card
                          ? ((orientation === 'landscape' ? 38 : 46) * dateScale * cardDispW) /
                            card.width
                          : 16 * dateScale
                      }px`,
                    }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none whitespace-nowrap rounded-md border border-dashed border-ink/25 px-1 leading-none active:cursor-grabbing"
                  >
                    {polaroidDateString()}
                    <button
                      onPointerDown={onDateResizeDown}
                      onPointerMove={onDateAreaMove}
                      onPointerUp={onDateAreaUp}
                      className="absolute -bottom-3 -right-3 grid h-6 w-6 cursor-nwse-resize touch-none place-items-center rounded-full border-2 border-ink bg-white text-[11px] shadow-pop-sm"
                      aria-label="Resize date"
                    >
                      ⤢
                    </button>
                  </span>
                )}
              </motion.div>
              <div className="mt-8 flex gap-3">
                <button onClick={reset} className="btn-pop bg-purple-soft">
                  ↻ Another
                </button>
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={download}
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
