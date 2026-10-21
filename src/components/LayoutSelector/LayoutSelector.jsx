import { motion } from 'framer-motion'
import { LAYOUT_OPTIONS } from '../../utils/constants.js'

/**
 * Mini preview that mirrors the real strip: portrait cells (~4:4.5), laid out
 * column-major (1 column normally, 2 columns for 4 & 6 -> left stack then right),
 * inside a little frame with a slightly longer bottom border.
 */
function MiniStrip({ n, active }) {
  const cols = n === 6 ? 2 : 1
  const rows = Math.ceil(n / cols)
  const cellW = 21
  const cellH = 16
  const gap = 3
  return (
    <div
      className={`rounded-[7px] border-2 transition-colors ${
        active ? 'border-ink bg-white' : 'border-ink/35 bg-white'
      }`}
      style={{ padding: '4px 4px 11px' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellH}px)`,
          gridAutoFlow: 'column',
          gap: `${gap}px`,
        }}
      >
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className={`rounded-[3px] ${active ? 'bg-pink-bold/70' : 'bg-ink/15'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function LayoutSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {LAYOUT_OPTIONS.map((n) => {
        const active = value === n
        return (
          <motion.button
            key={n}
            onClick={() => onChange(n)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            className={`flex flex-col items-center gap-2.5 rounded-3xl border-2 p-3 transition-all ${
              active
                ? 'border-ink bg-pink-soft shadow-pop-sm'
                : 'border-ink/15 bg-white/70 hover:border-ink/60'
            }`}
            aria-pressed={active}
          >
            <MiniStrip n={n} active={active} />
            <span className="font-mono text-xs font-700">
              {n} {n === 1 ? 'photo' : 'photos'}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
