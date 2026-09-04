'use client';

// pekanga-shared/ReportTabs.tsx
//
// The fixed-header, single-topic tab bar first proven in School's
// VisualExploreScreen.tsx and since hand-copied, pixel-identical, into four
// more places: VisualReverseReport.tsx, VisualCareerCard.tsx (School),
// VisualGcseReport.tsx's GCSE_REPORT_TABS, and Advisor's
// VisualReportResult.tsx (whose own header comment already called this "the
// same tab mechanism already live in Advisor's VisualExploreScreen").
// Confirmed by direct comparison of all five: identical flex/border/padding/
// font values, differing only in whether wrapping is needed (GCSE's 5 tabs
// vs everyone else's 4) — same situation SectorPicker.tsx was extracted for
// ("the data was shared, the presentation wasn't"), just five copies deep
// instead of two. Extracted ahead of the JED single-topic report
// restructuring (2026-09) specifically so that work adds zero new
// hand-copies of this pattern.
//
// HEADLESS: no data fetching, no tab-switch side effects beyond calling
// back. A consumer that needs to reset extra state when the tab changes
// (VisualGcseReport clears `selectedTerritory`, VisualReportResult clears
// `selectedAlt`) does that inside its own onSelect callback — this
// component only owns the row of buttons and which one is highlighted.

export interface ReportTabDef<TabId extends string> {
  id: TabId;
  label: string;
}

export interface ReportTabsProps<TabId extends string> {
  tabs: ReportTabDef<TabId>[];
  activeTab: TabId;
  onSelect: (id: TabId) => void;
  /**
   * GCSE's report has 5 tabs (vs everyone else's 4) and needs to wrap onto a
   * second row on narrow screens rather than squeezing every label — this
   * mirrors that file's existing `flexWrap: 'wrap'` + `minWidth: 140`
   * treatment exactly. Defaults to false (fixed single row, `flex: 1` each)
   * for the common 3-4 tab case.
   */
  wrap?: boolean;
}

export default function ReportTabs<TabId extends string>({ tabs, activeTab, onSelect, wrap = false }: ReportTabsProps<TabId>) {
  return (
    <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', flexWrap: wrap ? 'wrap' : undefined }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          style={{
            flex: wrap ? '1 1 auto' : 1,
            minWidth: wrap ? 140 : undefined,
            padding: '14px 8px', border: 'none',
            borderBottom: activeTab === tab.id ? '3px solid var(--coral)' : '3px solid transparent',
            background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
            color: activeTab === tab.id ? 'var(--navy)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
