// Componente listo pero todavía NO montado en la vista general.
// Cuando los links de consola sean correctos, se agrega dentro de ResultCard.

export default function StreamingLinks({ links = [], fallbackUrl }) {
  if (!links.length) {
    return fallbackUrl ? (
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm underline"
      >
        Ver en AniList
      </a>
    ) : (
      <p className="text-sm opacity-70">No encontramos dónde verlo.</p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: link.color || "#475569" }}
          >
            {link.icon && (
              <img src={link.icon} alt="" width="20" height="20" loading="lazy" />
            )}
            {link.site}
            {link.language ? ` (${link.language})` : ""}
          </a>
        </li>
      ))}
    </ul>
  );
}
