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
// Visual hierarchy (2026-09-15): chunking alone produced a wall of
// equally-weighted sections -- nine identical blocks with no signal on what
// matters most. Chunk 0 (whatever the rewrite put first) is treated as the
// lead fact and rendered as a standalone callout, always visible. The rest
// are an accordion: heading-only by default, expand on click. There's no
// backend "priority" flag to say which chunk is actually most important --
// "chunk 0 is the lead" is a deliberate simplification agreed with Neil
// rather than a content-aware ranking; revisit if the chunking prompt ever
// gains a way to mark significance.
//
// HEADLESS: pure rendering from props, no data fetching. `chunks` absent or
// empty falls back to the plain paragraph -- callers pass whatever
// rewriteEasyReadStructured() returned (or undefined, for a field that was
// never migrated to the structured path) without needing to branch
// themselves.

import { useState } from 'react';

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

// Cheap keyword -> icon mapping so each section gets a visual anchor without
// needing the backend to tag a category. Order matters -- first match wins.
// A heading that matches nothing gets DEFAULT_ICON, which is fine: the icon
// is decoration, not information.
const ICON_KEYWORDS: [RegExp, string][] = [
  [/salary|pay|earn|wage|money|cost/i, '\u{1F4B7}'], // 💷
  [/grade|exam|result|gcse|a-level|score|predicted/i, '\u{1F393}'], // 🎓
  [/subject|study|course|curriculum/i, '\u{1F4DA}'], // 📚
  [/skill|strength|talent/i, '\u{1F6E0}\u{FE0F}'], // 🛠️
  [/career|job|role|work|profession|industry/i, '\u{1F4BC}'], // 💼
  [/university|college|education|training|apprentice/i, '\u{1F3EB}'], // 🏫
  [/require|need|qualif/i, '✅'], // ✅
  [/step|next|plan|timeline|path/i, '\u{1F9ED}'], // 🧭
  [/challenge|risk|watch|caution|reality/i, '⚠️'], // ⚠️
  [/support|help|advice/i, '\u{1F91D}'], // 🤝
];
const DEFAULT_ICON = '\u{1F4CC}'; // 📌

function iconFor(heading: string): string {
  for (const [pattern, icon] of ICON_KEYWORDS) {
    if (pattern.test(heading)) return icon;
  }
  return DEFAULT_ICON;
}

export default function EasyReadPassage({ text, chunks, textStyle, headingColor }: EasyReadPassageProps) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  if (chunks && chunks.length > 0) {
    const accent = headingColor ?? (typeof textStyle.color === 'string' ? textStyle.color : '#8899AA');

    const toggle = (i: number) => {
      setOpenIndices((prev) => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i);
        else next.add(i);
        return next;
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chunks.map((chunk, i) => {
          const icon = iconFor(chunk.heading);

          if (i === 0) {
            return (
              <div
                key={i}
                style={{
                  border: `2px solid ${accent}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: accent,
                    margin: '0 0 8px',
                  }}
                >
                  <span aria-hidden="true">{icon}</span>
                  {chunk.heading}
                </p>
                <p style={{ ...textStyle, margin: 0, fontWeight: 600 }}>{chunk.text}</p>
              </div>
            );
          }

          const isOpen = openIndices.has(i);
          return (
            <div key={i} style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12 }}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <span aria-hidden="true">{icon}</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: accent,
                  }}
                >
                  {chunk.heading}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    color: accent,
                    fontSize: 12,
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                >
                  {'▶'}
                </span>
              </button>
              {isOpen && <p style={{ ...textStyle, margin: '6px 0 0' }}>{chunk.text}</p>}
            </div>
          );
        })}
      </div>
    );
  }
  return <p style={{ ...textStyle, margin: 0 }}>{text}</p>;
}
