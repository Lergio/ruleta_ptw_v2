import { PROXY_URL } from './constants'

// Cliente de la API v2 de MyAnimeList, siempre a través de tu proxy en Cloudflare.
//   GET /users/{usuario}/animelist
//   GET /anime/{id}   (solo para precuela y secuela)

const PAGE_SIZE = 1000
const STATUSES = ['plan_to_watch', 'on_hold']

const TYPE_LABELS = {
  tv: 'TV',
  movie: 'Movie',
  ova: 'OVA',
  ona: 'ONA',
  special: 'Special',
  tv_special: 'TV Special',
  music: 'Music',
  unknown: 'Unknown',
}

const RELATION_LABELS = {
  prequel: 'Precuela',
  sequel: 'Secuela',
}

export class MalError extends Error {
  constructor(kind, message, status) {
    super(message)
    this.name = 'MalError'
    this.kind = kind
    this.status = status
  }
}

function errorForStatus(status) {
  switch (status) {
    case 400:
      return new MalError('badrequest', 'Solicitud inválida.', status)
    case 401:
      return new MalError('auth', 'MyAnimeList rechazó el Client ID del proxy.', status)
    case 403:
      return new MalError('forbidden', 'La lista es privada o el proxy rechazó la solicitud.', status)
    case 404:
      return new MalError('notfound', 'No encontré a ese usuario en MyAnimeList.', status)
    default:
      return new MalError('http', `MyAnimeList respondió con error ${status}.`, status)
  }
}

async function request(path, params) {
  const url = new URL(PROXY_URL.replace(/\/+$/, '') + path)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  let res
  try {
    res = await fetch(url.toString())
  } catch {
    throw new MalError('network', 'No se pudo conectar con el proxy. Revisá tu conexión.')
  }
  if (!res.ok) throw errorForStatus(res.status)
  return res.json()
}

// Descarga todas las páginas de un estado de la lista
async function fetchStatus(username, status) {
  const items = []
  let offset = 0
  for (;;) {
    const page = await request(`/users/${encodeURIComponent(username)}/animelist`, {
      status,
      limit: PAGE_SIZE,
      offset,
      fields:
        'list_status,media_type,num_episodes,start_date,status,main_picture,genres,average_episode_duration',
      nsfw: 'true',
    })
    const data = Array.isArray(page.data) ? page.data : []
    items.push(...data)
    const hasNext = page.paging && page.paging.next
    if (!hasNext || data.length === 0) break
    offset += data.length
  }
  return items
}

// Convierte un item de MAL en el formato que usa la app:
// { id, t, y, e, w, s, yr, img, genres, durMin, u }
function toAnime(item) {
  const node = item.node || {}
  const ls = item.list_status || {}
  // "u" = todavía no se emitió: cuenta para el total pero no entra al sorteo
  const upcoming = node.status ? node.status === 'not_yet_aired' : !node.start_date
  const yearMatch = typeof node.start_date === 'string' && node.start_date.match(/^\d{4}/)
  const pic = node.main_picture || {}
  const genres = Array.isArray(node.genres) ? node.genres.map((g) => g && g.name).filter(Boolean) : []
  const durSec = node.average_episode_duration || 0
  return {
    id: node.id,
    t: node.title || '(sin título)',
    y: TYPE_LABELS[node.media_type] || TYPE_LABELS.unknown,
    e: node.num_episodes || 0,
    w: ls.num_episodes_watched || 0,
    s: ls.status,
    yr: yearMatch ? Number(yearMatch[0]) : null,
    img: pic.medium || pic.large || null,
    genres,
    durMin: durSec > 0 ? Math.round(durSec / 60) : null,
    u: upcoming,
  }
}

// Plan to watch + En espera de un usuario, sin duplicados y ordenados por título
export async function fetchWatchlist(username) {
  const results = await Promise.all(STATUSES.map((s) => fetchStatus(username, s)))
  const byId = new Map()
  results.flat().forEach((item) => {
    const a = toAnime(item)
    if (a.id != null && !byId.has(a.id)) byId.set(a.id, a)
  })
  return [...byId.values()].sort((x, y) => x.t.localeCompare(y.t))
}

// Precuela y secuela (si existen) de un anime puntual
export async function fetchRelatedAnime(id) {
  const data = await request(`/anime/${encodeURIComponent(id)}`, { fields: 'related_anime' })
  const rel = Array.isArray(data.related_anime) ? data.related_anime : []
  return rel
    .filter((r) => r.node && r.node.id != null && RELATION_LABELS[r.relation_type])
    .map((r) => ({
      id: r.node.id,
      t: r.node.title || '(sin título)',
      rel: r.relation_type,
      relLabel: RELATION_LABELS[r.relation_type],
    }))
}
