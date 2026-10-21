import { useMemo } from 'react'
import { motion } from 'framer-motion'

// Cute outlined stars (like the reference sticker) drifting behind everything,
// in a spread of pastel colours. Purely decorative; never blocks pointers.
const STAR = 'M12 1.6 L14.9 8.6 L22.4 9.2 L16.7 14.1 L18.5 21.4 L12 17.4 L5.5 21.4 L7.3 14.1 L1.6 9.2 L9.1 8.6 Z'
const COLORS = ['#FF8FB8', '#C9A0FF', '#8CCBFF', '#7FE0C9', '#FFC36E', '#FF9ECF', '#A6E3A1']

export default function Sparkles({ count = 34 }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)]
        return {
          id: i,
          color,
          left: Math.random() * 100,
          top: Math.random() * 100,
          size: 16 + Math.random() * 30,
          delay: Math.random() * 5,
          dur: 3.5 + Math.random() * 4,
          rot: Math.random() * 40 - 20,
        }
      }),
    [count],
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {items.map((s) => (
        <motion.svg
          key={s.id}
          viewBox="0 0 24 24"
          className="absolute"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }}
          initial={{ opacity: 0.18, scale: 0.6, rotate: s.rot }}
          animate={{
            opacity: [0.18, 0.95, 0.18],
            scale: [0.6, 1.12, 0.6],
            y: [0, -16, 0],
            rotate: [s.rot, s.rot + 12, s.rot],
          }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d={STAR}
            fill={s.color}
            fillOpacity="0.22"
            stroke={s.color}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </motion.svg>
      ))}
    </div>
  )
}
