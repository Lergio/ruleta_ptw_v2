// localStorage "seguro": si el navegador lo bloquea, la app no se rompe

export function getItem(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // sin almacenamiento disponible: se ignora
  }
}

export function getJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function setJSON(key, value) {
  setItem(key, JSON.stringify(value))
}
