import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LayoutSelector from './LayoutSelector/LayoutSelector.jsx'
import CameraStage from './Camera/CameraStage.jsx'
import DoodleEditor from './DoodleEditor/DoodleEditor.jsx'
import { BoothBar, StageTitle } from './StageHeader.jsx'

const fade = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.99 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

/**
 * Photostrip booth used by Original + Aquarium.
 * Flow: layout -> camera -> decorate (frame + doodle + text + stickers).
 *
 * @param {object}  cfg.booth
 * @param {object}  cfg.theme       { name, accent, accentBold }
 * @param {Function}[cfg.decorate]  per-shot canvas bake (aquarium)
 * @param {React.ReactNode}[cfg.overlay] live camera overlay
 */
export default function StripBooth({ booth, onExit, theme, decorate, overlay }) {
  const [step, setStep] = useState('layout')
  const [count, setCount] = useState(4)
  const [photos, setPhotos] = useState([])

  const handleComplete = (canvases) => {
    setPhotos(canvases)
    setStep('decorate')
  }

  const reset = () => {
    setPhotos([])
    setStep('layout')
  }

  return (
    <div className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-4 py-6">
      <BoothBar onExit={onExit} name={booth.name} accent={theme.accent} />

      <AnimatePresence mode="wait">
        {step === 'layout' && (
          <motion.section key="layout" {...fade} className="mx-auto max-w-2xl text-center">
            <StageTitle sub="How many shots on your strip?">
              Choose a layout
            </StageTitle>
            <div className="mt-2">
              <LayoutSelector value={count} onChange={setCount} />
            </div>
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep('camera')}
              className="btn-pop mt-10 bg-pink-bold px-10 text-white"
            >
              Start session →
            </motion.button>
          </motion.section>
        )}

        {step === 'camera' && (
          <motion.section key="camera" {...fade}>
            <CameraStage
              count={count}
              theme={theme}
              overlay={overlay}
              decorate={decorate}
              onBack={() => setStep('layout')}
              onComplete={handleComplete}
            />
          </motion.section>
        )}

        {step === 'decorate' && photos.length > 0 && (
          <motion.section key="decorate" {...fade}>
            <StageTitle>Decorate!</StageTitle>
            <DoodleEditor
              photos={photos}
              onRetake={reset}
              filename={`yourbooth-${booth.id}.png`}
            />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
