import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Soft pastel blobs drifting slowly behind everything. Sits at -z-10 so it
 * floats above the dotgrid but stays behind all content. Decorative only.
 */
export default function BackgroundFX() {
  const blobs = useMemo(
    () => [
      { c: '#FFD3E6', size: 380, left: '6%', top: '12%', dur: 19, dx: 36, dy: -28 },
      { c: '#D4E6FF', size: 440, left: '70%', top: '6%', dur: 23, dx: -32, dy: 30 },
      { c: '#E7D8FF', size: 400, left: '58%', top: '64%', dur: 21, dx: 28, dy: 24 },
      { c: '#D2FBEC', size: 340, left: '14%', top: '70%', dur: 26, dx: -26, dy: -22 },
      { c: '#FFF0CF', size: 300, left: '38%', top: '34%', dur: 17, dx: 22, dy: 26 },
    ],
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 50% 50%, ${b.c} 0%, ${b.c}00 70%)`,
            filter: 'blur(26px)',
            opacity: 0.6,
          }}
          animate={{
            x: [0, b.dx, b.dx * 0.4, 0],
            y: [0, b.dy, b.dy * -0.5, 0],
            scale: [1, 1.12, 0.95, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
