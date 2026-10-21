import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Manage a webcam stream via MediaDevices.getUserMedia.
 * Returns a ref to bind to a <video>, plus status flags and controls.
 */
export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setReady(false)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('camera-unsupported')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setReady(true)
    } catch (err) {
      if (err?.name === 'NotAllowedError') setError('permission-denied')
      else if (err?.name === 'NotFoundError') setError('no-camera')
      else setError('camera-error')
    }
  }, [])

  // tidy up on unmount
  useEffect(() => () => stop(), [stop])

  return { videoRef, ready, error, start, stop }
}
