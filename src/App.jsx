import { useWatchlist } from './hooks/useWatchlist'
import { useRoulette } from './hooks/useRoulette'
import UserForm from './components/UserForm'
import Wheel from './components/Wheel'
import ResultCard from './components/ResultCard'
import Actions from './components/Actions'
import Filters from './components/Filters'
import History from './components/History'

export default function App() {
  const { initialUser, user, animes, loading, error, load } = useWatchlist()
  const r = useRoulette(animes, user)

  const message = animes.length
    ? `${animes.length} animes cargados de ${user} (plan to watch + en espera).`
    : ''

  let placeholder = 'Todavía no cargaste ninguna lista.'
  if (loading) placeholder = 'Cargando tu lista…'
  else if (r.total > 0) {
    placeholder =
      r.pool.length === 0
        ? 'No quedan animes con estos filtros. Activá otro tipo o restaurá la lista.'
        : 'Todavía no giraste. Tocá Girar y la ruleta elige por vos.'
  } else if (user) {
    placeholder = 'Este usuario no tiene animes en plan to watch ni en espera.'
  }

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

        <section className="flex min-w-0 flex-col gap-5">
          <ResultCard current={r.current} spinning={r.spinning} placeholder={placeholder} />

          <Actions
            current={r.current}
            spinning={r.spinning}
            canSpin={r.canSpin}
            isStarted={r.isStarted}
            onSpin={r.spin}
            onRedo={r.redo}
            onToggleStarted={r.toggleStarted}
          />

          {r.total > 0 && (
            <Filters
              mode={r.mode}
              modeCounts={r.modeCounts}
              onMode={r.changeMode}
              types={r.types}
              disabledTypes={r.disabledTypes}
              typeCounts={r.typeCounts}
              onToggleType={r.toggleType}
              disabled={r.spinning}
            />
          )}

          <History history={r.history} onClear={r.clearHistory} />

          {r.startedCount > 0 && (
            <button
              type="button"
              onClick={r.restoreStarted}
              disabled={r.spinning}
              className="self-start text-left text-[.93rem] text-muted underline hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restaurar los {r.startedCount} que ya saqué
            </button>
          )}
        </section>
      </main>
    </div>
  )
}
