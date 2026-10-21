import { motion } from 'framer-motion'
import { STICKERS } from '../../utils/constants.js'

/** Tap a sticker to drop it onto the photo (it spawns centered, then drag it). */
export default function StickerEditor({ onAdd }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/60">
        Stickers · tap to add
      </p>
      <div className="flex flex-wrap gap-2">
        {STICKERS.map((s) => (
          <motion.button
            key={s}
            onClick={() => onAdd(s)}
            whileHover={{ scale: 1.18, rotate: -6 }}
            whileTap={{ scale: 0.85 }}
            className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink bg-white text-2xl shadow-pop-sm"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
