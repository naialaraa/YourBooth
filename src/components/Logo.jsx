import { useState } from 'react'
import { motion } from 'framer-motion'

const base = import.meta.env.BASE_URL

/**
 * The YOURBOOTH wordmark. `size` switches between the hero (home) and the
 * compact header version.
 *
 * CUSTOM LOGO (optional): drop a transparent PNG at  public/assets/logo.png
 * and it is used automatically everywhere. If it's missing, the built-in
 * text wordmark below is shown instead. Tweak the h-* classes to resize.
 */
export default function Logo({ size = 'lg', className = '' }) {
  const isHero = size === 'lg'
  const [usePng, setUsePng] = useState(true)

  if (usePng) {
    return (
      <div className={`inline-flex select-none items-center justify-center ${className}`}>
        <img
          src={`${base}assets/logo.png`}
          alt="YourBooth"
          draggable={false}
          onError={() => setUsePng(false)}
          className={isHero ? 'h-20 w-auto sm:h-24 md:h-28' : 'h-9 w-auto'}
        />
      </div>
    )
  }

  // ---- built-in text wordmark (fallback) ----
  return (
    <div className={`inline-flex select-none flex-col items-center ${className}`}>
      <div
        className={`relative font-display font-700 leading-none tracking-tight ${
          isHero ? 'text-6xl sm:text-7xl md:text-8xl' : 'text-2xl'
        }`}
      >
        <span className="text-ink">YOUR</span>
        <span
          className="relative ml-0.5 text-transparent"
          style={{
            WebkitTextStroke: isHero ? '2.5px #111111' : '1.5px #111111',
            backgroundImage: 'linear-gradient(135deg,#FFC9DE,#C9B6FF 55%,#A8D8FF)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          BOOTH
        </span>
        {isHero && (
          <motion.span
            className="absolute -right-7 -top-5 text-3xl"
            animate={{ rotate: [0, 18, -10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✦
          </motion.span>
        )}
      </div>
    </div>
  )
}
