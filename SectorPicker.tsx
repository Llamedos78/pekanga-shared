'use client';

// pekanga-shared/SectorPicker.tsx
//
// The rounded icon-pill sector selector from School's Visual Explore
// (VisualExploreScreen.tsx) — padding 14px 18px, radius 14px, navy fill +
// inverted icon when active. Extracted because Advisor's Visual Explore had
// drifted onto a completely different treatment (a thin underlined tab bar,
// no icons at all) despite both screens sharing the same 20-sector data via
// pekanga-shared/Sectors already — the data was shared, the presentation
// wasn't, which is exactly the kind of split this package exists to close.
//
// Deliberately scoped to the Visual variant's styling only. School's plain
// (non-visual) ExploreScreen.tsx uses a smaller, denser tab treatment for
// its own sector row — a real, established difference between the two
// screens, not drift, so this component isn't a fit there.
//
// HEADLESS: no data fetching. Renders pekanga-shared/Sectors' SECTORS list
// directly (that data is already shared platform-wide, no reason to make
// every consumer pass it back in as a prop) — takes only the active
// selection and a callback.

import React, { useEffect, useId, useState } from 'react';
import { tokens } from './tokens.js';
import { SECTORS, SECTOR_ICON } from './Sectors';

const FONT = "'Sora', sans-serif";

// Mobile-only collapse: ~20 chips is a long scroll on a 375px screen before
// any career content appears (see the 2026-09-11 Visual Explore density
// audit, run live on both School and Advisor -- same shared component, same
// finding on both). Desktop had no issue and stays exactly as it was.
//
// One "show all" control rather than a per-chip expand: SECTORS is a flat,
// ungrouped list (no natural per-category nesting to expand into), so a
// single toggle over the whole list is the simpler, more honest affordance
// -- documented here since the brief left the choice open.
//
// isMobile starts false and is only set from matchMedia inside an effect
// (never read during the initial render), so server-rendered markup always
// matches desktop's "everything visible" state -- nothing is ever hidden
// from a user before JS has run. Collapsed chips are genuinely not
// rendered (not just visually clipped), so they're skipped by both Tab
// order and screen readers, not just hidden from sighted mouse/touch users.
const COLLAPSED_COUNT = 6;
const MOBILE_QUERY = '(max-width: 480px)';

export interface SectorPickerProps {
  activeSector: string | null;
  onSelect: (sectorId: string) => void;
}

export default function SectorPicker({ activeSector, onSelect }: SectorPickerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const collapsed = isMobile && !expanded;
  const visibleSectors = collapsed ? SECTORS.slice(0, COLLAPSED_COUNT) : SECTORS;

  return (
    <div>
      <div id={listId} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {visibleSectors.map((sector) => {
          const isActive = activeSector === sector.id;
          return (
            <button
              key={sector.id}
              onClick={() => onSelect(sector.id)}
              style={{
                padding: '14px 18px', borderRadius: 14,
                border: `1.5px solid ${tokens.border}`,
                background: isActive ? tokens.navy : tokens.white,
                color: isActive ? tokens.white : tokens.navy,
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                fontFamily: FONT, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', filter: isActive ? 'brightness(0) invert(1)' : 'none' }}>
                {SECTOR_ICON[sector.id]}
              </span>
              {sector.label}
            </button>
          );
        })}
      </div>
      {isMobile && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={listId}
          style={{
            marginTop: 10, padding: '10px 16px', borderRadius: 10, width: '100%',
            border: `1.5px solid ${tokens.border}`, background: tokens.white,
            color: tokens.navy, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: FONT,
          }}
        >
          {expanded ? 'Show fewer categories' : `Show all ${SECTORS.length} categories`}
        </button>
      )}
    </div>
  );
}
