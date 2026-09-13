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
  /** Applied to each paragraph (flat or per-chunk). */
  textStyle: React.CSSProperties;
  /**
   * Accent colour for each chunk's heading label and its left divider bar.
   * Live feedback (2026-09-13): the original design reused textStyle.color
   * at reduced opacity for headings, which read as barely-differentiated
   * from the body text -- especially on a dark background, where a dimmed
   * white heading and white body text are both just "white, slightly
   * faded." Callers should pass a real accent (the same colour an adjacent
   * "Why this fits"-style label already uses, if there is one) rather than
   * relying on the textStyle-derived default, which only exists as a
   * fallback for a caller that hasn't been given one yet.
   */
  headingColor?: string;
}

export default function EasyReadPassage({ text, chunks, textStyle, headingColor }: EasyReadPassageProps) {
  if (chunks && chunks.length > 0) {
    const accent = headingColor ?? (typeof textStyle.color === 'string' ? textStyle.color : '#8899AA');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {chunks.map((chunk, i) => (
          <div key={i} style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: accent, margin: '0 0 6px' }}>
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
