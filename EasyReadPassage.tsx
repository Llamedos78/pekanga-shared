'use client';

// pekanga-shared/EasyReadPassage.tsx
//
// Renders one Easy Read passage that may have come back from
// rewriteEasyReadStructured() as labelled sub-sections (`chunks`) instead of
// a flat paragraph -- see easy-read-report/index.ts's Part B header comment
// (2026-09-13) for why: a passage built from a "2-3 dense sentences"
// upstream prompt reliably explodes past the passage-too-long compliance
// ceiling once rewritten sentence-by-sentence, and no amount of "try to be
// shorter" retrying fixes that without cutting real content. Splitting into
// headed chunks is the actual fix; this component is the one place that
// rendering decision lives, so every migrated consumer (VisualSubjectsResult,
// VisualReportResult, VisualDiscoveryResult, and School's Visual report
// components) renders it identically rather than five hand-copies.
//
// HEADLESS: pure rendering from props, no data fetching, no state. `chunks`
// absent or empty falls back to the plain paragraph -- callers pass
// whatever `rewriteEasyReadStructured()` returned (or undefined, for a
// field that was never migrated to the structured path) without needing to
// branch themselves.

export interface EasyReadChunk {
  heading: string;
  text: string;
}

export interface EasyReadPassageProps {
  text: string;
  chunks?: EasyReadChunk[];
  /** Applied to each paragraph (flat or per-chunk). Its `color` is reused,
   * dimmed, for chunk headings -- callers don't pass a separate heading colour. */
  textStyle: React.CSSProperties;
}

export default function EasyReadPassage({ text, chunks, textStyle }: EasyReadPassageProps) {
  if (chunks && chunks.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chunks.map((chunk, i) => (
          <div key={i}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: textStyle.color, opacity: 0.75, margin: '0 0 3px' }}>
              {chunk.heading}
            </p>
            <p style={{ ...textStyle, margin: 0 }}>{chunk.text}</p>
          </div>
        ))}
      </div>
    );
  }
  return <p style={{ ...textStyle, margin: 0 }}>{text}</p>;
}
