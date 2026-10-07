import { useWatchlist } from './hooks/useWatchlist'
import { useRoulette } from './hooks/useRoulette'
import UserForm from './components/UserForm'
import Wheel from './components/Wheel'

export default function App() {
  const { initialUser, user, animes, loading, error, load } = useWatchlist()
  const r = useRoulette(animes, user)

  const message = animes.length
    ? `${animes.length} animes cargados de ${user} (plan to watch + en espera).`
    : ''

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-7">
      <header className="mb-5">
        <h1 className="mb-1.5 font-display text-[clamp(1.9rem,4.5vw,3rem)] leading-[1.1] tracking-tight">
          ¿Qué anime empiezo?
        </h1>
        <p className="text-muted">
          {r.total
            ? `${r.pool.length} de ${r.total} animes en la ruleta`
            : 'Cargá tu lista de MyAnimeList para armar la ruleta.'}
        </p>
        {r.upcomingCount > 0 && (
          <p className="text-sm text-muted">
            {r.upcomingCount}{' '}
            {r.upcomingCount === 1 ? 'todavía no se emitió' : 'todavía no se emitieron'} y no
            participan del sorteo.
          </p>
        )}
      </header>

      <UserForm
        initialUser={initialUser}
        loading={loading}
        error={error}
        message={message}
        onLoad={load}
      />

      <main className="mt-7 grid gap-9 md:grid-cols-[1.05fr_1fr] md:items-start">
        <Wheel segs={r.segs} rotation={r.rotation} plan={r.plan} onFinish={r.finishSpin} />

        {/* Panel temporal: en la 3B se reemplaza por los componentes definitivos */}
        <section className="flex min-w-0 flex-col gap-5">
          <div className="min-h-[190px] rounded-2xl border-2 border-line bg-surface p-5">
            {r.spinning ? (
              <p className="text-muted">Girando…</p>
            ) : r.current ? (
              <>
                <h2 className="font-display text-2xl leading-tight">{r.current.t}</h2>
                <p className="mt-2 text-muted">{r.current.y}</p>
              </>
            ) : (
              <p className="text-muted">Todavía no giraste. Tocá Girar y la ruleta elige por vos.</p>
            )}
          </div>
          <button
            onClick={r.spin}
            disabled={!r.canSpin}
            className="self-start rounded-xl border-2 border-accent bg-accent px-8 py-3 text-lg font-bold text-on-accent hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {r.spinning ? 'Girando…' : r.current ? 'Girar de nuevo' : 'Girar'}
          </button>
        </section>
      </main>
    </div>
  )
}
