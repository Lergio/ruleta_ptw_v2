import { useEffect, useState } from 'react'
import { useWatchlist } from './hooks/useWatchlist'
import { useRoulette } from './hooks/useRoulette'
import { fetchRelatedAnime } from './lib/mal'

// Página de PRUEBA de la Fase 2: se reemplaza en la Fase 3 por la interfaz real.
export default function App() {
  const { initialUser, user, animes, loading, error, load } = useWatchlist()
  const r = useRoulette(animes, user)
  const [name, setName] = useState(initialUser)
  const [related, setRelated] = useState([])

  // Simula el final del giro (en la Fase 3 lo hace el componente Wheel)
  useEffect(() => {
    if (!r.plan) return
    const t = setTimeout(() => r.finishSpin(r.plan), 800)
    return () => clearTimeout(t)
  }, [r.plan]) // eslint-disable-line react-hooks/exhaustive-deps

  // Trae precuela y secuela del resultado
  useEffect(() => {
    setRelated([])
    if (!r.current) return
    let cancelled = false
    fetchRelatedAnime(r.current.id)
      .then((list) => {
        if (!cancelled) setRelated(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [r.current])

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Prueba de la Fase 2</h1>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded bg-slate-800 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="usuario de MyAnimeList"
        />
        <button
          className="rounded bg-amber-400 px-4 font-bold text-slate-900 disabled:opacity-50"
          disabled={loading}
          onClick={() => load(name)}
        >
          {loading ? 'Cargando…' : 'Cargar'}
        </button>
      </div>
      {error && <p className="text-red-400">{error}</p>}

      <p>
        Total: {r.total} · En la ruleta: {r.pool.length} · Sin emitir: {r.upcomingCount} · Gajos:{' '}
        {r.segs.length}
      </p>

      <button
        className="rounded bg-amber-400 px-4 py-2 font-bold text-slate-900 disabled:opacity-50"
        disabled={!r.canSpin}
        onClick={r.spin}
      >
        {r.spinning ? 'Girando…' : 'Girar'}
      </button>

      {r.current && !r.spinning && (
        <div className="space-y-1 rounded bg-slate-800 p-4">
          <p className="text-xl font-bold">{r.current.t}</p>
          <p>
            {r.current.y} · {r.current.yr ?? 'sin año'} ·{' '}
            {r.current.durMin ? `${r.current.durMin} min/cap` : 'sin duración'}
          </p>
          <p>{r.current.genres.join(', ')}</p>
          {related.map((x) => (
            <p key={x.id}>
              {x.relLabel}: {x.t}
            </p>
          ))}
        </div>
      )}
    </main>
  )
}
