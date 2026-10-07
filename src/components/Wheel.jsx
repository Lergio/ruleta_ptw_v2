import { useCallback, useEffect, useRef } from 'react'
import { SPIN_MS } from '../lib/constants'
import { drawWheel, easeOut, readTheme } from '../lib/wheel'

// Ruleta dibujada en un <canvas>.
// - Quieta: muestra "segs" en el ángulo "rotation".
// - Cuando recibe un "plan" de giro, lo anima y avisa con onFinish(plan) al terminar.
export default function Wheel({ segs, rotation, plan, onFinish }) {
  const canvasRef = useRef(null)
  const segsRef = useRef(segs)
  const rotRef = useRef(rotation)
  const animatingRef = useRef(false)
  const onFinishRef = useRef(onFinish)

  segsRef.current = segs
  onFinishRef.current = onFinish

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawWheel(canvas, { segs: segsRef.current, rotation: rotRef.current, theme: readTheme() })
  }, [])

  // Ruleta quieta: dibuja cuando cambian los gajos o el ángulo
  useEffect(() => {
    if (animatingRef.current) return
    rotRef.current = rotation
    paint()
  }, [segs, rotation, paint])

  // Giro animado
  useEffect(() => {
    if (!plan) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      rotRef.current = plan.to
      paint()
      onFinishRef.current(plan)
      return
    }
    animatingRef.current = true
    const t0 = performance.now()
    let raf
    const frame = (now) => {
      const k = Math.max(0, Math.min(1, (now - t0) / SPIN_MS))
      rotRef.current = plan.from + (plan.to - plan.from) * easeOut(k)
      paint()
      if (k < 1) {
        raf = requestAnimationFrame(frame)
      } else {
        animatingRef.current = false
        onFinishRef.current(plan)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      animatingRef.current = false
    }
  }, [plan, paint])

  // Repinta si cambia el tamaño, el tema claro/oscuro o cuando carga la tipografía
  useEffect(() => {
    const canvas = canvasRef.current
    const observer = new ResizeObserver(() => paint())
    observer.observe(canvas)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', paint)
    if (document.fonts) document.fonts.ready.then(paint)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', paint)
    }
  }, [paint])

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px]">
      <svg
        aria-hidden="true"
        viewBox="0 0 30 30"
        className="absolute -top-1 left-1/2 z-10 w-[30px] -translate-x-1/2 drop-shadow-md"
      >
        <path d="M2 2H28L15 28Z" fill="var(--accent)" stroke="var(--rim)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Ruleta con animes pendientes"
        className="block h-full w-full"
      />
    </div>
  )
}
