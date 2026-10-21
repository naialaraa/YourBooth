import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from '../../components/Logo.jsx'
import { BOOTHS, TAGLINE } from '../../utils/constants.js'

const base = import.meta.env.BASE_URL

export default function HomePage({ onSelect }) {
  const [launching, setLaunching] = useState(null)

  const launch = (id) => {
    setLaunching(id)
    setTimeout(() => onSelect(id), 520)
  }

  const hide = (e) => {
    e.currentTarget.classList.add('hidden')
  }

  return (
    <div className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-5 py-8">
      {/* hero */}
      <div className="flex flex-col items-center text-center">
        <Logo size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 font-body text-lg text-ink/70"
        >
          {TAGLINE}
        </motion.p>
        <div className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink/45">
          <span className="h-px w-8 bg-ink/20" />
          pick a booth
          <span className="h-px w-8 bg-ink/20" />
        </div>
      </div>

      {/* booth row — illustration swaps to photo-strip preview on hover */}
      <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-5">
        {BOOTHS.map((b, i) => (
          <motion.button
            key={b.id}
            onClick={() => launch(b.id)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.08 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.97 }}
            className="group flex flex-col items-center"
          >
            <div className="relative flex h-56 w-full items-center justify-center">
              {/* faint placeholder card (until a booth PNG is dropped in) */}
              <div
                className="absolute inset-2 rounded-[1.8rem]"
                style={{ background: `${b.accent}26` }}
              />

              {/* booth illustration (default) */}
              <img
                src={`${base}assets/booths/${b.id}.png`}
                alt={b.name}
                draggable={false}
                onError={hide}
                className="absolute inset-0 z-10 h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0"
              />

              {/* photo-strip preview (on hover) — pops a touch larger than the booth */}
              <motion.img
                src={`${base}assets/previews/${b.id}.png`}
                alt={`${b.name} preview`}
                draggable={false}
                onError={hide}
                className="absolute inset-0 z-20 mx-auto h-full w-auto origin-center scale-95 rounded-xl border-2 border-ink bg-white object-contain opacity-0 shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
              />
            </div>

            <span className="mt-3 font-display text-xl font-700 uppercase tracking-wide text-[#6e4a2c]">
              {b.name}
            </span>
          </motion.button>
        ))}
      </div>

      <p className="mt-8 text-center font-body text-sm text-ink/50">
        Hover a booth to peek at its strip · click to step inside
      </p>

      {/* launch transition */}
      <AnimatePresence>
        {launching && (
          <motion.div
            className="fixed inset-0 z-50 bg-white"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: [0, 1, 1], scale: [1.1, 1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, times: [0, 0.4, 1] }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
