import { useState } from 'react'
import { motion } from 'framer-motion'
import { FRAMES } from '../../utils/constants.js'

/**
 * Two-tier frame picker: choose Frame vs No Frame, then a colour.
 * `value` is a frame id ('white'|'pink'|'black'|'purple'|'blue') or 'none'.
 */
export default function FrameSelector({ value, onChange }) {
  const isNone = value === 'none'
  const [lastColor, setLastColor] = useState(value !== 'none' ? value : 'white')

  const pickFrame = () => onChange(lastColor || 'white')
  const pickNone = () => onChange('none')
  const pickColor = (id) => {
    setLastColor(id)
    onChange(id)
  }

  return (
    <div className="space-y-3">
      {/* mode toggle */}
      <div className="flex gap-2 rounded-full border-2 border-ink bg-white p-1">
        <button
          onClick={pickFrame}
          className={`flex-1 rounded-full px-4 py-1.5 font-display text-sm font-600 transition-colors ${
            !isNone ? 'bg-ink text-white' : 'text-ink/60'
          }`}
        >
          Frame
        </button>
        <button
          onClick={pickNone}
          className={`flex-1 rounded-full px-4 py-1.5 font-display text-sm font-600 transition-colors ${
            isNone ? 'bg-ink text-white' : 'text-ink/60'
          }`}
        >
          No Frame
        </button>
      </div>

      {/* colour swatches (hidden in no-frame mode) */}
      {!isNone && (
        <div className="flex flex-wrap items-center gap-2.5">
          {FRAMES.map((f) => {
            const active = value === f.id
            return (
              <motion.button
                key={f.id}
                onClick={() => pickColor(f.id)}
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.92 }}
                aria-label={f.name}
                aria-pressed={active}
                className={`h-10 w-10 rounded-2xl border-2 transition-shadow ${
                  active ? 'border-ink shadow-pop-sm ring-2 ring-ink ring-offset-2' : 'border-ink/40'
                }`}
                style={{ background: f.bg }}
              />
            )
          })}
        </div>
      )}
      {isNone && (
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/45">
          just the photos — transparent edges
        </p>
      )}
    </div>
  )
}
