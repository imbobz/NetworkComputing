import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'starting' | 'live' | 'error'

export interface CameraInfo {
  width: number
  height: number
  frameRate: number
  facing: string | null
}

function describeError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : ''
  switch (name) {
    case 'NotAllowedError':
      return "Accès à la caméra refusé. Autorise-la dans les réglages du navigateur puis réessaie."
    case 'NotFoundError':
      return 'Aucune caméra détectée sur cet appareil.'
    case 'NotReadableError':
      return "La caméra est utilisée par une autre application."
    case 'OverconstrainedError':
      return "Cette caméra n'est plus disponible. Choisis-en une autre."
    case 'SecurityError':
      return 'La caméra exige une connexion sécurisée (HTTPS ou localhost).'
    default:
      return err instanceof Error ? err.message : 'Erreur inconnue.'
  }
}

export function useCamera() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<CameraInfo | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const requestRef = useRef(0)

  const supported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const all = await navigator.mediaDevices.enumerateDevices()
    setDevices(all.filter((d) => d.kind === 'videoinput'))
  }, [])

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(
    async (deviceId?: string) => {
      if (!supported) {
        setStatus('error')
        setError('Ce navigateur ne permet pas d’accéder à la caméra.')
        return
      }

      const request = ++requestRef.current
      releaseStream()
      setStream(null)
      setInfo(null)
      setError(null)
      setStatus('starting')

      try {
        const next = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...(deviceId
              ? { deviceId: { exact: deviceId } }
              : { facingMode: { ideal: 'environment' } }),
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        // Une demande plus récente a pris le relais : on libère celle-ci.
        if (request !== requestRef.current) {
          next.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = next
        const track = next.getVideoTracks()[0]
        const settings = track.getSettings()

        track.addEventListener('ended', () => {
          if (streamRef.current !== next) return
          releaseStream()
          setStream(null)
          setInfo(null)
          setStatus('idle')
          setError('La caméra a été déconnectée.')
        })

        setStream(next)
        setSelectedId(settings.deviceId ?? deviceId ?? '')
        setInfo({
          width: settings.width ?? 0,
          height: settings.height ?? 0,
          frameRate: Math.round(settings.frameRate ?? 0),
          facing: settings.facingMode ?? null,
        })
        setStatus('live')

        // Les noms des caméras ne sont exposés qu'après l'autorisation.
        await refreshDevices()
      } catch (err) {
        if (request !== requestRef.current) return
        setStatus('error')
        setError(describeError(err))
      }
    },
    [supported, releaseStream, refreshDevices],
  )

  const stop = useCallback(() => {
    requestRef.current++
    releaseStream()
    setStream(null)
    setInfo(null)
    setStatus('idle')
  }, [releaseStream])

  const select = useCallback(
    (deviceId: string) => {
      setSelectedId(deviceId)
      if (streamRef.current || status === 'starting') void start(deviceId)
    },
    [start, status],
  )

  // Liste initiale + branchement / débranchement d'une caméra.
  useEffect(() => {
    if (!supported) return
    const md = navigator.mediaDevices
    const onChange = () => void refreshDevices()
    void refreshDevices()
    md.addEventListener('devicechange', onChange)
    return () => md.removeEventListener('devicechange', onChange)
  }, [supported, refreshDevices])

  // Libère la caméra quand le composant disparaît.
  useEffect(() => releaseStream, [releaseStream])

  return { supported, devices, selectedId, stream, status, error, info, start, stop, select }
}
