import { motion } from 'framer-motion'

/**
 * First-paint loader: a little camera that flashes, with sparkles.
 * Shown ~1.5s on initial load.
 */
export default function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper dotgrid"
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ scale: 0.7, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="relative"
      >
        {/* camera body */}
        <div className="relative grid h-28 w-36 place-items-center rounded-4xl border-2 border-ink bg-white shadow-pop">
          <div className="absolute -top-3 left-6 h-5 w-12 rounded-t-xl border-2 border-b-0 border-ink bg-pink" />
          <motion.div
            className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-purple-soft"
            animate={{ scale: [1, 0.92, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          >
            <div className="h-8 w-8 rounded-full border-2 border-ink bg-sky" />
          </motion.div>
          <div className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-pink-bold" />
        </div>

        {/* flash */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-4xl bg-white"
          animate={{ opacity: [0, 0, 0.9, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, times: [0, 0.55, 0.62, 0.8] }}
        />

        {/* orbiting sparkles */}
        {['-top-6 -left-6', '-bottom-7 -right-5', '-top-7 right-4'].map((pos, i) => (
          <motion.span
            key={i}
            className={`absolute ${pos} text-2xl`}
            animate={{ rotate: [0, 360], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2.4 + i, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✦
          </motion.span>
        ))}
      </motion.div>

      <motion.p
        className="mt-8 font-mono text-sm uppercase tracking-[0.3em] text-ink"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        ✦ Loading YourBooth…
      </motion.p>
    </motion.div>
  )
}
