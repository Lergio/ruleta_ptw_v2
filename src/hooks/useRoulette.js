import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MODES } from '../lib/constants'
import { idleSegments, mod, planSpin } from '../lib/wheel'
import { getRelated } from '../lib/related'

const inMode = (a, mode) =>
  mode === 'todos' || (mode === 'espera' ? a.s === 'on_hold' : a.s === 'plan_to_watch')

// Toda la lógica de la ruleta: filtros, sorteo e historial.
// No dibuja nada: la ruleta (canvas) anima el giro y avisa con finishSpin().
//
// Orden de temporadas: si el anime que sale tiene una precuela (relation_type
// "prequel") que también está en tu lista, se descarta y se sortea otro. Se chequea
// solo el candidato al girar (1 pedido a MAL, con caché), no toda la lista.
export function useRoulette(animes) {
  const [mode, setMode] = useState('todos')
  const [disabledTypes, setDisabledTypes] = useState(() => new Set())
  const [segs, setSegs] = useState([])
  const [rotation, setRotation] = useState(() => Math.random() * Math.PI * 2)
  const [plan, setPlan] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [checking, setChecking] = useState(false) // revisando la precuela del candidato
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [shuffleTick, setShuffleTick] = useState(0)
  const [respectOrder, setRespectOrder] = useState(true)
  const [blockedIds, setBlockedIds] = useState(() => new Set())
  const runRef = useRef(0) // invalida chequeos en curso si cambia la lista

  // Cuando se carga otra lista, todo vuelve a empezar
  useEffect(() => {
    runRef.current += 1
    setMode('todos')
    setDisabledTypes(new Set())
    setBlockedIds(new Set())
    setCurrent(null)
    setHistory([])
    setPlan(null)
    setSpinning(false)
    setChecking(false)
    setRotation(Math.random() * Math.PI * 2)
    setShuffleTick((t) => t + 1)
  }, [animes])

  const animeIds = useMemo(() => new Set(animes.map((a) => a.id)), [animes])

  // Tipos disponibles, del más al menos frecuente
  const types = useMemo(() => {
    const counts = {}
    animes.forEach((a) => {
      counts[a.y] = (counts[a.y] || 0) + 1
    })
    return Object.keys(counts).sort((x, y) => counts[y] - counts[x])
  }, [animes])

  // Elegible = ya se emitió (a.u) y no está bloqueado por una precuela pendiente
  const eligible = useCallback(
    (a) => !a.u && !(respectOrder && blockedIds.has(a.id)),
    [respectOrder, blockedIds],
  )

  const pool = useMemo(
    () => animes.filter((a) => eligible(a) && !disabledTypes.has(a.y) && inMode(a, mode)),
    [animes, eligible, disabledTypes, mode],
  )

  const modeCounts = useMemo(() => {
    const out = {}
    MODES.forEach(({ key }) => {
      out[key] = animes.filter(
        (a) => eligible(a) && !disabledTypes.has(a.y) && inMode(a, key),
      ).length
    })
    return out
  }, [animes, eligible, disabledTypes])

  const typeCounts = useMemo(() => {
    const out = {}
    types.forEach((t) => {
      out[t] = animes.filter((a) => a.y === t && eligible(a) && inMode(a, mode)).length
    })
    return out
  }, [animes, types, eligible, mode])

  const upcomingCount = useMemo(() => animes.filter((a) => a.u).length, [animes])

  // Secuelas descartadas hasta ahora (se van descubriendo al girar)
  const blockedCount = useMemo(
    () => (respectOrder ? animes.filter((a) => !a.u && blockedIds.has(a.id)).length : 0),
    [animes, respectOrder, blockedIds],
  )

  // Gajos con la ruleta quieta: se mezclan al cambiar filtros o la lista
  useEffect(() => {
    if (spinning) return
    setSegs(idleSegments(pool))
  }, [animes, mode, disabledTypes, shuffleTick, blockedIds, respectOrder]) // eslint-disable-line react-hooks/exhaustive-deps

  const canSpin = !spinning && !checking && pool.length > 0

  const spin = useCallback(async () => {
    if (!canSpin) return
    const run = ++runRef.current
    setChecking(true)

    const found = []
    let candidates = pool
    try {
      while (candidates.length > 0) {
        const p = planSpin(candidates, rotation)

        let blocked = false
        if (respectOrder) {
          const related = await getRelated(p.winner.id)
          if (run !== runRef.current) return // se cargó otra lista mientras tanto
          blocked = related.some((r) => r.rel === 'prequel' && animeIds.has(r.id))
        }

        if (!blocked) {
          if (found.length) setBlockedIds((prev) => new Set([...prev, ...found]))
          setSegs(p.segs)
          setPlan(p) // la ruleta anima y llama a finishSpin()
          setChecking(false)
          setSpinning(true)
          return
        }
        found.push(p.winner.id)
        candidates = candidates.filter((a) => a.id !== p.winner.id)
      }

      // Ningún candidato válido (por ejemplo, datos de relaciones circulares)
      if (run === runRef.current) {
        if (found.length) setBlockedIds((prev) => new Set([...prev, ...found]))
        setChecking(false)
      }
    } catch {
      if (run === runRef.current) setChecking(false)
    }
  }, [canSpin, pool, rotation, respectOrder, animeIds])

  // La ruleta llama a esto cuando termina de girar
  const finishSpin = useCallback((p) => {
    setRotation(mod(p.to, Math.PI * 2))
    setCurrent(p.winner)
    setHistory((h) => [p.winner, ...h])
    setPlan(null)
    setSpinning(false)
  }, [])

  // Descarta el resultado actual del historial y vuelve a girar
  const redo = useCallback(() => {
    if (spinning || checking || !current) return
    setHistory((h) => {
      const i = h.indexOf(current)
      return i === -1 ? h : [...h.slice(0, i), ...h.slice(i + 1)]
    })
    spin()
  }, [spinning, checking, current, spin])

  const clearHistory = useCallback(() => setHistory([]), [])

  const changeMode = useCallback(
    (m) => {
      if (!spinning && !checking) setMode(m)
    },
    [spinning, checking],
  )

  const toggleType = useCallback(
    (t) => {
      if (spinning || checking) return
      setDisabledTypes((prev) => {
        const next = new Set(prev)
        if (next.has(t)) next.delete(t)
        else next.add(t)
        return next
      })
    },
    [spinning, checking],
  )

  const toggleRespectOrder = useCallback(() => {
    if (!spinning && !checking) setRespectOrder((v) => !v)
  }, [spinning, checking])

  return {
    // filtros
    mode,
    changeMode,
    types,
    disabledTypes,
    toggleType,
    modeCounts,
    typeCounts,
    respectOrder,
    toggleRespectOrder,
    // conteos
    pool,
    total: animes.length,
    upcomingCount,
    blockedCount,
    // ruleta
    segs,
    rotation,
    plan,
    spinning,
    checking,
    canSpin,
    spin,
    finishSpin,
    redo,
    // resultado e historial
    current,
    history,
    clearHistory,
  }
}
