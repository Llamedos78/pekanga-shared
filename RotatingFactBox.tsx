'use client';

// pekanga-shared/RotatingFactBox.tsx
//
// Renders the rotating fact from useRotatingCareerFacts inside a bounded,
// light-blue branded callout box, instead of the plain text that sat
// directly under a spinner. Wraps the hook itself (rather than taking a
// pre-computed `fact` string) so every caller gets identical box styling
// and citation handling for free -- previously each of the four call sites
// (PekangaSpinner in Advisor; Loading/GcseLoading/VisualGcseLoading in
// School) duplicated its own plain <p>/<div> rendering.
//
// Styling matches the light-blue callout pattern already used elsewhere in
// both products (var(--blue-light) fill + var(--border) outline -- see
// VisualReportResult.tsx/VisualDiscoveryResult.tsx/ClientNotesPanel.tsx),
// not a new pattern invented for this.
//
// The hook returns one pre-formatted string with the citation baked in as
// a trailing "(SOURCE_CODE)." -- there's no separate citation field to
// thread through. Splitting it back out here so the citation can render
// smaller/secondary, per the loading-facts brief, without changing the
// hook's return shape.

import { useRotatingCareerFacts, type UseRotatingCareerFactsOptions } from './useRotatingCareerFacts';

const CITATION_PATTERN = /^(.*)\s\(([^()]+)\)\.?$/;

function splitCitation(fact: string): { text: string; citation: string | null } {
  const match = fact.match(CITATION_PATTERN);
  return match ? { text: match[1], citation: match[2] } : { text: fact, citation: null };
}

export interface RotatingFactBoxProps extends UseRotatingCareerFactsOptions {
  /** GCSE/A-level subject(s) or a career title -- see useRotatingCareerFacts. Omit for a generic fallback fact. */
  subject?: string | string[];
}

export default function RotatingFactBox({ subject, ...options }: RotatingFactBoxProps) {
  const fact = useRotatingCareerFacts(subject, options);
  if (!fact) return null;

  const { text, citation } = splitCitation(fact);

  return (
    <div
      style={{
        background: 'var(--blue-light)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        maxWidth: 360,
        margin: '0 auto',
      }}
    >
      <p style={{ color: 'var(--navy)', fontSize: 13, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
        {text}
      </p>
      {citation && (
        <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, lineHeight: 1.4, margin: '4px 0 0' }}>
          {citation}
        </p>
      )}
    </div>
  );
}
