import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sparkles from './components/Sparkles.jsx'
import BackgroundFX from './components/BackgroundFX.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import HomePage from './pages/HomePage/HomePage.jsx'
import ClassicBooth from './pages/OriginalBooth/OriginalBooth.jsx'
import VintageBooth from './pages/VintageBooth/VintageBooth.jsx'
import AquariumBooth from './pages/AquariumBooth/AquariumBooth.jsx'
import PolaroidBooth from './pages/PolaroidBooth/PolaroidBooth.jsx'

const BOOTH_VIEWS = {
  classic: ClassicBooth,
  vintage: VintageBooth,
  aquarium: AquariumBooth,
  polaroid: PolaroidBooth,
}

const screenFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35 },
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [booth, setBooth] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1700)
    return () => clearTimeout(t)
  }, [])

  const BoothView = booth ? BOOTH_VIEWS[booth] : null

  return (
    <div className="relative min-h-screen overflow-x-hidden dotgrid">
      <BackgroundFX />
      <Sparkles count={26} />

      <AnimatePresence>{loading && <LoadingScreen key="loader" />}</AnimatePresence>

      {!loading && (
        <AnimatePresence mode="wait">
          {!booth ? (
            <motion.div key="home" {...screenFade}>
              <HomePage onSelect={setBooth} />
            </motion.div>
          ) : (
            <motion.div key={booth} {...screenFade}>
              <BoothView onExit={() => setBooth(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
