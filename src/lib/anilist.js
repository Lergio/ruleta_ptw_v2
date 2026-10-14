// Cliente mínimo de AniList (GraphQL). JS puro, sin dependencias de React.
// Se consulta por idMal (el ID de MyAnimeList), así que no hay que buscar por título.

const ENDPOINT = "https://graphql.anilist.co";

const QUERY = `
query ($idMal: Int) {
  Media(idMal: $idMal, type: ANIME) {
    id
    siteUrl
    externalLinks {
      site
      url
      type
      language
      icon
      color
      isDisabled
    }
    streamingEpisodes {
      title
      url
      site
    }
  }
}`;

const CACHE_PREFIX = "anilist:streaming:";

function readCache(malId) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + malId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(malId, value) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + malId, JSON.stringify(value));
  } catch {
    // sessionStorage no disponible o lleno: se ignora
  }
}

function empty() {
  return { anilistId: null, siteUrl: null, links: [], episodes: [] };
}

/**
 * Devuelve los links de streaming de un anime a partir de su ID de MyAnimeList.
 * Resultado: { anilistId, siteUrl, links: [{ site, url, language, icon, color }], episodes: [{ title, url, site }] }
 * Si AniList no conoce el anime, devuelve la misma forma pero vacía.
 */
export async function getStreamingLinks(malId, { signal } = {}) {
  const id = Number(malId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`ID de MAL inválido: ${malId}`);
  }

  const cached = readCache(id);
  if (cached) return cached;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { idMal: id } }),
    signal,
  });

  // AniList responde 404 cuando no existe un Media con ese idMal
  if (res.status === 404) {
    const result = empty();
    writeCache(id, result);
    return result;
  }
  if (!res.ok) {
    throw new Error(`AniList respondió ${res.status}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const media = json.data?.Media;
  if (!media) {
    const result = empty();
    writeCache(id, result);
    return result;
  }

  const result = {
    anilistId: media.id,
    siteUrl: media.siteUrl,
    links: (media.externalLinks ?? [])
      .filter((l) => l.type === "STREAMING" && !l.isDisabled && l.url)
      .map(({ site, url, language, icon, color }) => ({ site, url, language, icon, color })),
    episodes: (media.streamingEpisodes ?? []).map(({ title, url, site }) => ({ title, url, site })),
  };

  writeCache(id, result);
  return result;
}
