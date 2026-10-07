import { useState } from 'react'

// Input del usuario de MyAnimeList + botón para cargar la lista
export default function UserForm({ initialUser, loading, error, message, onLoad }) {
  const [name, setName] = useState(initialUser)

  const submit = (e) => {
    e.preventDefault()
    onLoad(name)
  }

  return (
    <form onSubmit={submit} className="max-w-lg">
      <label htmlFor="username" className="mb-1.5 block font-bold">
        Usuario de MyAnimeList
      </label>
      <div className="flex gap-2.5">
        <input
          id="username"
          name="username"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="tu_usuario"
          autoComplete="username"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          required
          disabled={loading}
          className="min-w-0 flex-1 rounded-xl border-2 border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="whitespace-nowrap rounded-xl border-2 border-accent bg-accent px-5 py-2.5 font-bold text-on-accent hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Cargando…' : 'Cargar lista'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      {!error && message && <p className="mt-2 text-sm text-muted">{message}</p>}
    </form>
  )
}
