import { HISTORY_LIMIT } from '../lib/constants'

// Últimas tiradas, con opción de limpiar la lista
export default function History({ history, onClear }) {
  if (history.length === 0) return null

  return (
    <section>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <h3 className="font-bold">Tiradas anteriores</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-[.93rem] text-muted underline hover:text-ink"
        >
          Limpiar lista
        </button>
      </div>
      <ol className="flex list-none flex-col gap-1">
        {history.slice(0, HISTORY_LIMIT).map((a, i) => (
          <li
            key={`${a.id}-${i}`}
            className="flex justify-between gap-3 border-b border-line pb-1 text-[.93rem] text-muted"
          >
            <span className="break-words">{a.t}</span>
            <span className="whitespace-nowrap">{a.y}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
