import { PALETTE, MAX_SEGS } from './constants'

const FONT = '"Zen Kaku Gothic New", system-ui, "Segoe UI", Arial, sans-serif'
const TWO_PI = Math.PI * 2

export const mod = (x, m) => ((x % m) + m) % m

export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Curva de frenado del giro (k va de 0 a 1)
export const easeOut = (k) => 1 - Math.pow(1 - k, 4)

// Gajos que se muestran con la ruleta quieta
export function idleSegments(pool) {
  return shuffle(pool).slice(0, MAX_SEGS)
}

// Elige al ganador y calcula el giro completo:
// devuelve { winner, segs, from, to } (ángulos en radianes)
export function planSpin(pool, rotation) {
  const winner = pool[Math.floor(Math.random() * pool.length)]
  const n = Math.min(MAX_SEGS, pool.length)
  const segs = shuffle(pool.filter((x) => x !== winner)).slice(0, n - 1)
  const w = Math.floor(Math.random() * n)
  segs.splice(w, 0, winner)

  const a = TWO_PI / n
  const desired = -Math.PI / 2 - (w * a + a / 2) + (Math.random() - 0.5) * a * 0.7
  const turns = 5 + Math.floor(Math.random() * 3)
  const from = rotation
  const to = rotation + mod(desired - rotation, TWO_PI) + turns * TWO_PI
  return { winner, segs, from, to }
}

// Lee los colores del tema desde variables CSS (--rim, --hub, --lamp)
export function readTheme() {
  const cs = getComputedStyle(document.documentElement)
  const get = (name, fallback) => cs.getPropertyValue(name).trim() || fallback
  return {
    rim: get('--rim', '#1A1526'),
    hub: get('--hub', '#FFFFFF'),
    lamp: get('--lamp', '#FFC95C'),
  }
}

function fitLabel(ctx, name, type, maxW) {
  const suffix = '  ·  ' + type
  if (ctx.measureText(name + suffix).width <= maxW) return name + suffix
  let t = name
  while (t.length > 1 && ctx.measureText(t + '…' + suffix).width > maxW) t = t.slice(0, -1)
  return t.trimEnd() + '…' + suffix
}

// Dibuja la ruleta en un <canvas>. theme = { rim, hub, lamp }
export function drawWheel(canvas, { segs, rotation, theme }) {
  const size = canvas.clientWidth
  if (!size) return
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== Math.round(size * dpr)) {
    canvas.width = canvas.height = Math.round(size * dpr)
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)

  const c = size / 2
  const R = c - 8
  const r = R * 0.93

  ctx.beginPath()
  ctx.arc(c, c, R, 0, TWO_PI)
  ctx.fillStyle = theme.rim
  ctx.fill()

  const n = segs.length
  if (!n) {
    ctx.beginPath()
    ctx.arc(c, c, r, 0, TWO_PI)
    ctx.fillStyle = theme.hub
    ctx.fill()
    return
  }

  const a = TWO_PI / n
  ctx.font = `700 ${Math.max(11, R * 0.058)}px ${FONT}`
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const s = rotation + i * a
    let col = i % PALETTE.length
    if (i === n - 1 && n > 1 && col === 0) col = 2
    ctx.beginPath()
    ctx.moveTo(c, c)
    ctx.arc(c, c, r, s, s + a)
    ctx.closePath()
    ctx.fillStyle = PALETTE[col]
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = theme.rim
    ctx.stroke()

    ctx.save()
    ctx.translate(c, c)
    ctx.rotate(s + a / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#1A1526'
    ctx.fillText(fitLabel(ctx, segs[i].t, segs[i].y, r - 14 - R * 0.2), r - 14, 0)
    ctx.restore()
  }

  // lamparitas del borde
  const dots = Math.max(24, n * 2)
  for (let i = 0; i < dots; i++) {
    const ang = rotation + i * (TWO_PI / dots)
    ctx.beginPath()
    ctx.arc(
      c + (Math.cos(ang) * (R + r)) / 2,
      c + (Math.sin(ang) * (R + r)) / 2,
      Math.max(2, R * 0.011),
      0,
      TWO_PI,
    )
    ctx.fillStyle = theme.lamp
    ctx.fill()
  }

  // centro
  ctx.beginPath()
  ctx.arc(c, c, R * 0.13, 0, TWO_PI)
  ctx.fillStyle = theme.hub
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = theme.rim
  ctx.stroke()
}
