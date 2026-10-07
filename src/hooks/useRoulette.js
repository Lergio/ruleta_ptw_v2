import { useCallback, useEffect, useMemo, useState } from 'react'
import { MODES } from '../lib/constants'
import { idleSegments, mod, planSpin } from '../lib/wheel'

const inMode = (a, mode) =>
  mode === 'todos' || (mode === 'espera' ? a.s === 'on_hold' : a.s === 'plan_to_watch')

// Toda la lógica de la ruleta: filtros, sorteo e historial.
// No dibuja nada: la ruleta (canvas) anima el giro y avisa con finishSpin().
export function useRoulette(animes) {
  const [mode, setMode] = useState('todos')
  const [disabledTypes, setDisabledTypes] = useState(() => new Set())
  const [segs, setSegs] = useState([])
  const [rotation, setRotation] = useState(() => Math.random() * Math.PI * 2)
  const [plan, setPlan] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [shuffleTick, setShuffleTick] = useState(0)

  // Cuando se carga otra lista, todo vuelve a empezar
  useEffect(() => {
    setMode('todos')
    setDisabledTypes(new Set())
    setCurrent(null)
    setHistory([])
    setPlan(null)
    setSpinning(false)
    setRotation(Math.random() * Math.PI * 2)
    setShuffleTick((t) => t + 1)
  }, [animes])

  // Tipos disponibles, del más al menos frecuente
  const types = useMemo(() => {
    const counts = {}
    animes.forEach((a) => {
      counts[a.y] = (counts[a.y] || 0) + 1
    })
    return Object.keys(counts).sort((x, y) => counts[y] - counts[x])
  }, [animes])

  // Los que todavía no se emitieron (a.u) cuentan en el total pero nunca se sortean
  const pool = useMemo(
    () => animes.filter((a) => !a.u && !disabledTypes.has(a.y) && inMode(a, mode)),
    [animes, disabledTypes, mode],
  )

  const modeCounts = useMemo(() => {
    const out = {}
    MODES.forEach(({ key }) => {
      out[key] = animes.filter(
        (a) => !a.u && !disabledTypes.has(a.y) && inMode(a, key),
      ).length
    })
    return out
  }, [animes, disabledTypes])

  const typeCounts = useMemo(() => {
    const out = {}
    types.forEach((t) => {
      out[t] = animes.filter((a) => a.y === t && !a.u && inMode(a, mode)).length
    })
    return out
  }, [animes, types, mode])

  const upcomingCount = useMemo(() => animes.filter((a) => a.u).length, [animes])

  // Gajos con la ruleta quieta: se mezclan al cambiar filtros o la lista
  useEffect(() => {
    if (spinning) return
    setSegs(idleSegments(pool))
  }, [animes, mode, disabledTypes, shuffleTick]) // eslint-disable-line react-hooks/exhaustive-deps

  const canSpin = !spinning && pool.length > 0

  const spin = useCallback(() => {
    if (!canSpin) return
    const p = planSpin(pool, rotation)
    setSegs(p.segs)
    setPlan(p)
    setSpinning(true)
  }, [canSpin, pool, rotation])

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
    if (spinning || !current) return
    setHistory((h) => {
      const i = h.indexOf(current)
      return i === -1 ? h : [...h.slice(0, i), ...h.slice(i + 1)]
    })
    spin()
  }, [spinning, current, spin])

  const clearHistory = useCallback(() => setHistory([]), [])

  const changeMode = useCallback(
    (m) => {
      if (!spinning) setMode(m)
    },
    [spinning],
  )

  const toggleType = useCallback(
    (t) => {
      if (spinning) return
      setDisabledTypes((prev) => {
        const next = new Set(prev)
        if (next.has(t)) next.delete(t)
        else next.add(t)
        return next
      })
    },
    [spinning],
  )

  return {
    // filtros
    mode,
    changeMode,
    types,
    disabledTypes,
    toggleType,
    modeCounts,
    typeCounts,
    // conteos
    pool,
    total: animes.length,
    upcomingCount,
    // ruleta
    segs,
    rotation,
    plan,
    spinning,
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
