import { useCallback, useEffect, useState } from 'react'
import { fetchWatchlist } from '../lib/mal'
import { getItem, setItem } from '../lib/storage'

const USER_KEY = 'ruleta-usuario'

// Carga la lista (plan to watch + en espera) de un usuario de MyAnimeList
export function useWatchlist() {
  const [initialUser] = useState(() => getItem(USER_KEY) || '')
  const [user, setUser] = useState('')
  const [animes, setAnimes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (name) => {
    const clean = name.trim()
    if (!clean) return
    setLoading(true)
    setError('')
    try {
      const list = await fetchWatchlist(clean)
      setUser(clean)
      setAnimes(list)
      setItem(USER_KEY, clean)
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Si ya usaste la app antes, carga tu usuario automáticamente
  useEffect(() => {
    if (initialUser) load(initialUser)
  }, [initialUser, load])

  return { initialUser, user, animes, loading, error, load }
}
