import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCamera } from '../../hooks/useCamera.js'
import { captureFrame } from '../../utils/image.js'
import { playShutter, primeAudio } from '../../utils/sound.js'
import { CELL } from '../../utils/compositor.js'
import Countdown from '../Countdown/Countdown.jsx'
import CanvasImage from '../CanvasImage.jsx'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Live camera (left, enlarged) + captured shots with retake (right).
 * When every slot is filled, auto-advances to decorate.
 */
export default function CameraStage({ count, theme, overlay, decorate, onComplete, onBack }) {
  const { videoRef, ready, error, start } = useCamera()
  const [shots, setShots] = useState(() => Array(count).fill(null))
  const [countdownOn, setCountdownOn] = useState(true)
  const [counting, setCounting] = useState(null)
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    start()
  }, [start])

  const filled = shots.filter(Boolean).length
  const nextIndex = shots.findIndex((s) => s === null)

  const snap = () => {
    const idx = shots.findIndex((s) => s === null)
    if (idx === -1) return
    playShutter()
    setFlash(true)
    const cell = captureFrame(videoRef.current, CELL.w, CELL.h, { mirror: true, decorate })
    setTimeout(() => setFlash(false), 260)
    setShots((prev) => {
      const next = [...prev]
      next[idx] = cell
      // all filled -> advance shortly after
      if (next.every(Boolean) && !doneRef.current) {
        doneRef.current = true
        setTimeout(() => onComplete(next.filter(Boolean)), 850)
      }
      return next
    })
  }

  const trigger = async () => {
    if (busy || !ready || nextIndex === -1) return
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
    snap()
    setBusy(false)
  }

  const retake = (i) => {
    if (doneRef.current) return
    setShots((prev) => {
      const next = [...prev]
      next[i] = null
      return next
    })
  }

  const current = Math.min(filled + 1, count)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="chip hover:-translate-y-0.5">← Back</button>
        <span className="chip" style={{ background: theme.accent }}>
          Photo {current} of {count}
        </span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* LEFT · enlarged camera */}
        <div
          className="relative rounded-5xl border-2 border-ink p-4 shadow-soft sm:p-6"
          style={{ background: theme.accent }}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="font-display text-lg font-700">{theme.name}</span>
            <span className="flex gap-1.5">
              <i className="h-3 w-3 rounded-full border-2 border-ink bg-white" />
              <i className="h-3 w-3 rounded-full border-2 border-ink bg-white" />
            </span>
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-4xl border-2 border-ink bg-ink no-cursor">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {overlay}

            {!ready && (
              <div className="absolute inset-0 grid place-items-center bg-ink/90 px-6 text-center">
                {error ? (
                  <div className="max-w-sm space-y-3 text-white">
                    <p className="font-display text-xl font-700">
                      {error === 'permission-denied'
                        ? 'Camera permission needed'
                        : error === 'no-camera'
                          ? 'No camera found'
                          : "Camera couldn't start"}
                    </p>
                    <p className="font-body text-sm text-white/70">
                      {error === 'permission-denied'
                        ? 'Allow camera access in your browser, then tap retry.'
                        : 'Connect a webcam and tap retry.'}
                    </p>
                    <button onClick={start} className="btn-pop bg-pink">Retry</button>
                  </div>
                ) : (
                  <p className="animate-pulse font-mono text-sm uppercase tracking-widest text-white">
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

          {/* controls */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <AnimatePresence initial={false}>
              {!busy && nextIndex !== -1 && (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="flex items-center gap-1 rounded-full border-2 border-ink bg-white p-1"
                >
                  {[{ label: 'Off', val: false }, { label: '3 Seconds', val: true }].map((opt) => {
                    const on = countdownOn === opt.val
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setCountdownOn(opt.val)}
                        className="relative rounded-full px-4 py-1.5 font-mono text-xs font-700"
                      >
                        {on && (
                          <motion.span
                            layoutId="classic-timer-pill"
                            className="absolute inset-0 rounded-full bg-ink"
                            transition={{ type: 'spring', stiffness: 480, damping: 32 }}
                          />
                        )}
                        <span className={`relative z-10 ${on ? 'text-white' : 'text-ink/60'}`}>
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={trigger}
              disabled={!ready || busy || nextIndex === -1}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="group relative grid h-20 w-20 place-items-center rounded-full border-2 border-ink bg-white shadow-pop disabled:opacity-50"
              aria-label="Take photo"
            >
              <motion.span
                className="h-14 w-14 rounded-full border-2 border-ink"
                style={{ background: theme.accentBold }}
                animate={busy ? { scale: 1 } : { scale: [1, 1.09, 1] }}
                transition={{ duration: 1.4, repeat: busy ? 0 : Infinity, ease: 'easeInOut' }}
              />
            </motion.button>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink/60">
              {nextIndex === -1 ? 'all done ✦' : busy ? 'smile! ✦' : 'tap to capture'}
            </span>
          </div>
        </div>

        {/* RIGHT · captured shots, bigger, with retake */}
        <div className="rounded-4xl border-2 border-ink bg-white/70 p-4 shadow-soft">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-ink/60">
            Your shots
          </p>
          <div className="flex flex-col gap-3">
            {shots.map((shot, i) => (
              <div
                key={i}
                className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 ${
                  shot
                    ? 'border-ink'
                    : i === nextIndex
                      ? 'border-pink-bold'
                      : 'border-ink/20'
                } bg-ink/5`}
              >
                {shot ? (
                  <>
                    <CanvasImage canvas={shot} className="h-full w-full object-cover" />
                    {!doneRef.current && (
                      <button
                        onClick={() => retake(i)}
                        className="absolute bottom-1.5 right-1.5 rounded-full border-2 border-ink bg-white/95 px-2.5 py-1 font-mono text-[10px] font-700 uppercase tracking-wide hover:-translate-y-0.5"
                      >
                        ↻ Retake
                      </button>
                    )}
                  </>
                ) : (
                  <div className="grid h-full w-full place-items-center font-mono text-xs text-ink/35">
                    {i === nextIndex ? 'next ✦' : i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
