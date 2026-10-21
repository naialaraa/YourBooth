import { useEffect, useState } from 'react'

/**
 * Display a generated HTMLCanvasElement as an <img>.
 * Re-derives the data URL whenever the source canvas reference changes.
 */
export default function CanvasImage({ canvas, alt = '', className = '', style }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!canvas) {
      setUrl(null)
      return
    }
    try {
      setUrl(canvas.toDataURL('image/png'))
    } catch {
      setUrl(null)
    }
  }, [canvas])

  if (!url) return null
  return <img src={url} alt={alt} className={className} style={style} draggable={false} />
}
