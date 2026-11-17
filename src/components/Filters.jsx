import { MODES } from '../lib/constants'

function Chip({ pressed, count, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border-2 px-3 py-1 text-[.92rem] disabled:cursor-not-allowed ${
        pressed ? 'border-accent bg-surface font-bold text-ink' : 'border-line text-muted'
      }`}
    >
      {children}
      <span className="ml-1 font-normal opacity-70">{count}</span>
    </button>
  )
}

// Filtros por estado (todos / plan to watch / en espera), por tipo (TV, Movie…)
// y el interruptor para respetar el orden de las temporadas
export default function Filters({
  mode,
  modeCounts,
  onMode,
  types,
  disabledTypes,
  typeCounts,
  onToggleType,
  respectOrder,
  onToggleOrder,
  checking,
  disabled,
}) {
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-2 p-0 font-bold">Qué incluir</legend>
        <div className="flex flex-wrap gap-2">
          {MODES.map(({ key, label }) => (
            <Chip
              key={key}
              pressed={mode === key}
              count={modeCounts[key] ?? 0}
              disabled={disabled}
              onClick={() => onMode(key)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-2 p-0 font-bold">Tipos</legend>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <Chip
              key={t}
              pressed={!disabledTypes.has(t)}
              count={typeCounts[t] ?? 0}
              disabled={disabled}
              onClick={() => onToggleType(t)}
            >
              {t}
            </Chip>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2.5 text-[.93rem] has-[:disabled]:cursor-not-allowed">
        <input
          type="checkbox"
          checked={respectOrder}
          onChange={onToggleOrder}
          disabled={disabled}
          className="size-4 flex-none accent-accent"
        />
        <span>
          Respetar orden de las temporadas
          {checking && <span className="text-muted"> · revisando precuela…</span>}
        </span>
      </label>
    </div>
  )
}
