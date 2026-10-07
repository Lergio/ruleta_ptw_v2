# 🎡 ¿Qué anime empiezo?

Ruleta que elige por vos qué anime empezar (o retomar), armada con tu lista de **MyAnimeList** (Plan to Watch + On Hold).

👉 **Demo:** https://lergio.github.io/ruleta_ptw_v2/

## Funcionalidades

- Carga tu lista escribiendo tu usuario de MyAnimeList (sin login).
- Ruleta animada que sortea un anime y muestra portada, tipo, géneros, episodios, duración por capítulo, año, y precuela/secuela si existen.
- Los animes "en espera" indican cuánto viste y desde qué episodio retomar.
- Los que todavía no se emitieron cuentan en el total pero no participan del sorteo.
- Filtros por estado (todos / plan to watch / en espera) y por tipo (TV, Movie, OVA…).
- "Ya lo empecé" / "Ya lo retomé" saca el anime de la ruleta (se guarda en tu navegador).
- "Borrar y girar de nuevo" descarta el resultado y vuelve a sortear; historial de tiradas.
- Tema claro/oscuro automático y diseño responsivo.

## Stack

React + Vite + Tailwind CSS v4, publicado en GitHub Pages con GitHub Actions.

## Estructura

```
.github/workflows/deploy.yml   compila y publica en Pages
proxy-cloudflare/worker.js     proxy hacia la API de MyAnimeList
src/components/                interfaz (Wheel, ResultCard, Filters…)
src/hooks/                     lógica con estado (useWatchlist, useRoulette)
src/lib/                       JS puro (cliente de MAL, dibujo de la ruleta…)
```

## Cómo funciona

MyAnimeList no permite llamar a su API desde el navegador (no envía cabeceras CORS), así que las peticiones pasan por un **Cloudflare Worker** propio que agrega el Client ID, guardado como variable secreta del worker:

```
navegador → Cloudflare Worker → API de MyAnimeList
```

El worker solo acepta pedidos GET desde el dominio de la app, a las rutas `/users/{usuario}/animelist` y `/anime/{id}`.

## Configuración propia

1. Creá una app en [myanimelist.net/apiconfig](https://myanimelist.net/apiconfig) y anotá el Client ID.
2. Creá un Worker en Cloudflare con el contenido de `proxy-cloudflare/worker.js`, ajustá `ALLOWED_ORIGIN` a tu dominio y agregá la variable secreta `MAL_CLIENT_ID`.
3. Poné la URL del worker en `src/lib/constants.js` (`PROXY_URL`) y la ruta del repo en `vite.config.js` (`base`).
4. En *Settings → Pages* elegí **Source: GitHub Actions**. Cada push a `main` publica la app.

Para desarrollar en local: `npm install` y `npm run dev` (requiere agregar `http://localhost:5173` a los orígenes permitidos del worker).

## Privacidad

No hay servidor propio con datos: la lista se pide en el momento a MyAnimeList (vía el proxy) y solo se guarda en tu navegador tu usuario y qué animes marcaste como "ya empecé".
