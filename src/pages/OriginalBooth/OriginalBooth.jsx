import StripBooth from '../../components/StripBooth.jsx'
import { BOOTHS, PALETTE } from '../../utils/constants.js'

const booth = BOOTHS.find((b) => b.id === 'classic')

export default function OriginalBooth({ onExit }) {
  return (
    <StripBooth
      booth={booth}
      onExit={onExit}
      theme={{ name: booth.name, accent: PALETTE.pink, accentBold: PALETTE.pinkBold }}
    />
  )
}
