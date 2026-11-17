import { fetchRelatedAnime } from './mal'

// Caché compartida de precuela/secuela por anime (la usan ResultCard y la ruleta).
// Si el pedido falla no se guarda el error: el próximo intento vuelve a consultar.
const cache = new Map()

export function getRelated(id) {
  if (!cache.has(id)) {
    const p = fetchRelatedAnime(id).catch(() => {
      cache.delete(id)
      return []
    })
    cache.set(id, p)
  }
  return cache.get(id)
}
