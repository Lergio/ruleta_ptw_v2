// URL pública de tu Cloudflare Worker (el proxy hacia la API de MyAnimeList)
export const PROXY_URL = 'https://mal-proxy.chiito53452.workers.dev'

// Cantidad máxima de gajos que se dibujan en la ruleta
export const MAX_SEGS = 12

// Duración del giro, en milisegundos
export const SPIN_MS = 5200

// Cuántas tiradas se muestran en el historial
export const HISTORY_LIMIT = 10

// Colores de los gajos
export const PALETTE = ['#8C9BFF', '#4FD1C1', '#FF8F85', '#FFC95C', '#C3A9F5']

// Filtros por estado de la lista
export const MODES = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendientes', label: 'Plan to watch' },
  { key: 'espera', label: 'En espera' },
]
