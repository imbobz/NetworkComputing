import { useEffect, useRef, useState } from 'react'
import { useCamera } from './useCamera'
import './App.css'

function cameraLabel(device: MediaDeviceInfo, index: number): string {
  return device.label || `Caméra ${index + 1}`
}

export default function App() {
  const { supported, devices, selectedId, stream, status, error, info, start, stop, select } =
    useCamera()
  const videoRef = useRef<HTMLVideoElement>(null)
  // null = automatique (miroir pour une caméra frontale), sinon choix de l'utilisateur.
  const [mirrorChoice, setMirrorChoice] = useState<boolean | null>(null)
  const mirror = mirrorChoice ?? info?.facing === 'user'

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    if (stream) void video.play().catch(() => {})
  }, [stream])

  const live = status === 'live'
  const starting = status === 'starting'

  return (
    <main className="app">
      <header className="header">
        <h1>Caméra</h1>
        <span className={`badge badge--${status}`}>
          <i />
          {live ? 'En direct' : starting ? 'Démarrage…' : status === 'error' ? 'Erreur' : 'Arrêtée'}
        </span>
      </header>

      <section className="stage" aria-label="Aperçu de la caméra">
        <video
          ref={videoRef}
          className={mirror ? 'video video--mirror' : 'video'}
          autoPlay
          playsInline
          muted
        />

        {!live && (
          <div className="overlay">
            {starting ? (
              <span className="spinner" aria-label="Chargement" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
                  <path
                    d="M4 8a2 2 0 0 1 2-2h1.6l1-1.5A1 1 0 0 1 9.4 4h5.2a1 1 0 0 1 .8.5l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <p>Aucune image pour le moment</p>
              </>
            )}
          </div>
        )}

        {live && info && (
          <div className="chip">
            {info.width}×{info.height}
            {info.frameRate ? ` · ${info.frameRate} fps` : ''}
          </div>
        )}
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section className="controls">
        <label className="field">
          <span>Caméra</span>
          <select
            value={selectedId}
            onChange={(e) => select(e.target.value)}
            disabled={!supported || devices.length === 0}
          >
            {devices.length === 0 && <option value="">Autorise la caméra pour la lister</option>}
            {devices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {cameraLabel(d, i)}
              </option>
            ))}
          </select>
        </label>

        <div className="actions">
          {live || starting ? (
            <button className="btn btn--stop" onClick={stop}>
              Arrêter
            </button>
          ) : (
            <button
              className="btn btn--start"
              onClick={() => void start(selectedId || undefined)}
              disabled={!supported}
            >
              Démarrer la caméra
            </button>
          )}

          <label className="toggle">
            <input
              type="checkbox"
              checked={mirror}
              onChange={(e) => setMirrorChoice(e.target.checked)}
            />
            <span>Miroir</span>
          </label>
        </div>
      </section>

      {!supported && (
        <p className="hint">
          Caméra indisponible : ouvre la page en HTTPS (ou sur localhost) dans un navigateur récent.
        </p>
      )}
    </main>
  )
}
