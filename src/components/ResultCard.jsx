import { useEffect, useState } from 'react'
import { fetchRelatedAnime } from '../lib/mal'

// Caché: si un anime vuelve a salir, no se repite el pedido de precuela/secuela
const relatedCache = new Map()
function getRelated(id) {
  if (!relatedCache.has(id)) {
    relatedCache.set(id, fetchRelatedAnime(id).catch(() => []))
  }
  return relatedCache.get(id)
}

function useRelated(id) {
  const [related, setRelated] = useState([])
  useEffect(() => {
    setRelated([])
    if (id == null) return
    let cancelled = false
    getRelated(id).then((list) => {
      if (!cancelled) setRelated(list)
    })
    return () => {
      cancelled = true
    }
  }, [id])
  return related
}

function holdText(a) {
  if (a.w <= 0) return 'En espera: no tenés episodios vistos registrados.'
  if (a.e > 0) {
    return `En espera: viste ${a.w} de ${a.e}. Retomá desde el episodio ${Math.min(a.w + 1, a.e)}.`
  }
  return `En espera: viste ${a.w} episodios. Retomá desde el episodio ${a.w + 1}.`
}

// Portada fuera de la tarjeta, con proporción de póster (2:3).
// Angosto: 130px centrada arriba. Ancho (>= 520px de columna): crece con el espacio, hasta 260px.
// Si la imagen no carga, desaparece sin dejar un ícono roto.
function Cover({ src }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="aspect-[2/3] w-[130px] flex-none rounded-2xl border-2 border-line bg-surface object-cover @min-[520px]:w-[var(--cover-w)] @min-[520px]:self-start"
    />
  )
}

const malUrl = (id) => `https://myanimelist.net/anime/${encodeURIComponent(id)}`

// Muestra el anime sorteado (o un mensaje mientras no hay resultado)
export default function ResultCard({ current, spinning, placeholder }) {
  const showResult = Boolean(current) && !spinning
  const related = useRelated(showResult ? current.id : null)

  let bits = []
  if (showResult) {
    bits = [
      current.e > 0
        ? `${current.e} ${current.e === 1 ? 'episodio' : 'episodios'}`
        : 'Episodios sin definir',
      current.durMin ? `${current.durMin} min/cap` : null,
      current.yr ? String(current.yr) : null,
    ].filter(Boolean)
  }

  const longTitle = showResult && current.t.length > 45

  return (
    <div className="@container">
      <div
        style={{ '--cover-w': 'clamp(150px, 34cqw, 260px)' }}
        className="flex flex-col items-center gap-4 @min-[520px]:flex-row @min-[520px]:items-stretch"
      >
        {showResult && current.img && <Cover key={current.id} src={current.img} />}

        <section
          aria-live="polite"
          className="flex min-h-[190px] w-full min-w-0 flex-1 flex-col justify-center rounded-2xl border-2 border-line bg-surface p-5 @min-[520px]:min-h-[calc(var(--cover-w)*1.5)]"
        >
          {showResult ? (
            <div key={current.id} className="flex flex-col gap-3.5 motion-safe:animate-reveal">
              <h2
                className={`break-words font-display leading-tight ${
                  longTitle
                    ? 'text-[clamp(1.2rem,2.4vw,1.6rem)]'
                    : 'text-[clamp(1.4rem,3.4vw,2.1rem)]'
                }`}
              >
                {current.t}
              </h2>

              {current.genres.length > 0 && (
                <p className="-mt-2 text-[.93rem] text-muted">{current.genres.join(', ')}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="rounded-full bg-accent px-3 py-0.5 text-[.95rem] font-bold text-on-accent">
                  {current.y}
                </span>
                {bits.map((bit, i) => (
                  <span key={bit} className="text-muted">
                    {i > 0 && (
                      <span aria-hidden="true" className="mr-2.5 opacity-60">
                        ·
                      </span>
                    )}
                    {bit}
                  </span>
                ))}
              </div>

              {current.s === 'on_hold' && (
                <p className="rounded-r-lg border-l-4 border-accent bg-page px-3 py-2.5">
                  {holdText(current)}
                </p>
              )}

              <a
                href={malUrl(current.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[.93rem] text-muted underline hover:text-ink"
              >
                Ver en MyAnimeList
              </a>

              {related.length > 0 && (
                <div>
                  <h3 className="mb-1.5 text-[.9rem] font-bold uppercase tracking-wide text-muted">
                    Relacionados
                  </h3>
                  <ul className="flex list-none flex-col gap-1">
                    {related.map((x) => (
                      <li key={`${x.rel}-${x.id}`} className="break-words text-[.93rem]">
                        <span className="text-muted">{x.relLabel}: </span>
                        <a
                          href={malUrl(x.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink underline hover:text-accent"
                        >
                          {x.t}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">{spinning ? 'Girando…' : placeholder}</p>
          )}
        </section>
      </div>
    </div>
  )
}
