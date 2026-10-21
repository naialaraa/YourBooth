import { useEffect, useRef } from 'react'
import { stepFish, drawFish, drawTint, drawBubble } from '../utils/aquarium.js'

/**
 * Live underwater scene over the camera preview. Animates the SAME fish array
 * that the photo bake reads, so the saved shot matches what's on screen.
 *
 * @param {object} props
 * @param {Array} props.fish  shared fish school (mutated in place)
 */
export default function AquariumOverlay({ fish }) {
  const canvasRef = useRef(null)
  const bubblesRef = useRef(
    Array.from({ length: 16 }, () => ({
      x: Math.random(),
      r: 4 + Math.random() * 14,
      speed: 0.1 + Math.random() * 0.18,
      phase: Math.random(),
      key: Math.floor(Math.random() * 2), // which bubble PNG (if any)
    })),
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let last = performance.now()

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      // keep backing store matched to the displayed size
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      ctx.clearRect(0, 0, w, h)
      drawTint(ctx, w, h)

      // rising bubbles
      const t = now / 1000
      bubblesRef.current.forEach((b) => {
        const y = (1 - ((t * b.speed + b.phase) % 1)) * h
        drawBubble(ctx, b.x * w, y, b.r * 2, b.key)
      })

      if (fish) {
        stepFish(fish, dt)
        drawFish(ctx, w, h, fish)
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [fish])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  )
}
