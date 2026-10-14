import { useEffect, useState } from "react";
import { getStreamingLinks } from "../lib/anilist";

/**
 * Busca los links de streaming del anime sorteado.
 * Por ahora solo imprime el resultado en consola (modo control).
 * Devuelve { data, loading, error } para usarlo más adelante en la vista.
 */
export function useStreamingLinks(malId) {
  const [state, setState] = useState({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!malId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    getStreamingLinks(malId, { signal: controller.signal })
      .then((data) => {
        console.groupCollapsed(`[AniList] links de streaming · MAL ${malId}`);
        console.log("AniList ID:", data.anilistId, "|", data.siteUrl);
        if (data.links.length) {
          console.table(data.links.map(({ site, url, language }) => ({ site, language, url })));
        } else {
          console.log("Sin links de streaming");
        }
        if (data.episodes.length) {
          console.log(`Episodios con link (${data.episodes.length}):`);
          console.table(data.episodes);
        }
        console.groupEnd();
        setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        console.error(`[AniList] error · MAL ${malId}`, error);
        setState({ data: null, loading: false, error });
      });

    return () => controller.abort();
  }, [malId]);

  return state;
}
