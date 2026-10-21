import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { playTick } from '../../utils/sound.js'

/**
 * Big animated 3 · 2 · 1 overlay. `value` is the current number, or null to hide.
 * Plays a soft tick on each number.
 */
export default function Countdown({ value }) {
  useEffect(() => {
    if (value != null) playTick(value === 1)
  }, [value])

  return (
    <AnimatePresence mode="popLayout">
      {value != null && (
        <motion.div
          key={value}
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span
            className="grid h-[11rem] w-[11rem] place-items-center text-center font-display text-[9rem] font-700 leading-none text-white"
            style={{ textShadow: '0 3px 14px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {value}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
