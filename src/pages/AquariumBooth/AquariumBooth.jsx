import { useRef } from 'react'
import StripBooth from '../../components/StripBooth.jsx'
import AquariumOverlay from '../../components/AquariumOverlay.jsx'
import { decorateAquarium, makeFishSchool } from '../../utils/aquarium.js'
import { BOOTHS, PALETTE } from '../../utils/constants.js'

const booth = BOOTHS.find((b) => b.id === 'aquarium')

export default function AquariumBooth({ onExit }) {
  // one shared school: animated by the overlay, baked by the decorate fn
  const fishRef = useRef(makeFishSchool())

  return (
    <StripBooth
      booth={booth}
      onExit={onExit}
      theme={{ name: booth.name, accent: PALETTE.sky, accentBold: PALETTE.skyBold }}
      overlay={<AquariumOverlay fish={fishRef.current} />}
      decorate={decorateAquarium(fishRef.current)}
    />
  )
}
