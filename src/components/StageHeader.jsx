import { motion } from 'framer-motion'
import Logo from './Logo.jsx'

/**
 * Clean booth chrome: a soft Home button on the left, the wordmark in the
 * middle, and a tidy booth pill (accent dot + name) on the right. Light borders
 * and soft shadows instead of chunky offsets.
 */
export function BoothBar({ onExit, name, accent = '#FFC9DE' }) {
  return (
    <header className="mb-8 grid grid-cols-3 items-center">
      <motion.button
        onClick={onExit}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="inline-flex w-fit items-center gap-1.5 justify-self-start rounded-full border border-ink/15 bg-white/85 px-4 py-2 font-display text-sm font-600 text-ink/80 shadow-soft backdrop-blur"
      >
        Home
      </motion.button>

      <div className="justify-self-center">
        <Logo size="sm" />
      </div>

      <span className="inline-flex w-fit items-center gap-2 justify-self-end rounded-full border border-ink/15 bg-white/85 px-4 py-2 font-display text-sm font-600 text-ink/80 shadow-soft backdrop-blur">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} aria-hidden />
        {name}
      </span>
    </header>
  )
}

/**
 * A clean, friendly stage title — solid rounded type with a short pastel accent
 * underline. No gradients, outlines or busy decoration.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children  title text
 * @param {string} [props.icon]             trailing emoji/icon
 * @param {string} [props.sub]              optional subtitle
 * @param {string} [props.accent]           underline colour
 */
export function StageTitle({ children, icon, sub, accent = '#FF8FB8' }) {
  return (
    <div className="mb-7 flex flex-col items-center gap-1.5 text-center">
      <h2 className="font-display text-3xl font-700 text-ink sm:text-4xl">
        {children}
        {icon && <span className="ml-2">{icon}</span>}
      </h2>
      <span className="h-1.5 w-12 rounded-full" style={{ background: accent }} />
      {sub && <p className="mt-1 font-body text-sm text-ink/55">{sub}</p>}
    </div>
  )
}
