const primary =
  'rounded-xl border-2 border-accent bg-accent px-8 py-3 text-lg font-bold text-on-accent hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
const ghost =
  'rounded-xl border-2 border-line px-4 py-3 font-medium text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-50'

// Botones: girar, y borrar el resultado actual del historial para girar de nuevo
export default function Actions({ current, spinning, canSpin, onSpin, onRedo }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <button type="button" onClick={onSpin} disabled={!canSpin} className={primary}>
        {spinning ? 'Girando…' : current ? 'Girar de nuevo' : 'Girar'}
      </button>
      {current && (
        <button type="button" onClick={onRedo} disabled={spinning} className={ghost}>
          Borrar y girar de nuevo
        </button>
      )}
    </div>
  )
}
