export default function SourceCitations({ sources, isDemo }) {
  if (sources.length === 0) {
    if (isDemo) return null;
    return (
      <p className="sources sources--empty">
        No sources were returned with this answer, so it cannot be verified.
        Please confirm with the relevant university office.
      </p>
    );
  }

  return (
    <aside className="sources" aria-label="Sources for this answer">
      <h4 className="sources__heading">Sources</h4>
      <ol className="sources__list">
        {sources.map((s, i) => (
          <li key={i} className="source">
            <span className="source__title">
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
              ) : (
                s.title
              )}
            </span>
            {s.isSample && <span className="badge badge--small">Sample</span>}
            {s.page != null && <span className="source__meta"> · Page {s.page}</span>}
            {s.snippet && <p className="source__snippet">{s.snippet}</p>}
          </li>
        ))}
      </ol>
    </aside>
  );
}