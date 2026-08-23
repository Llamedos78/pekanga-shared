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

import React from 'react';
import { tokens } from './tokens.js';
import { SECTORS, SECTOR_ICON } from './Sectors';

const FONT = "'Sora', sans-serif";

export interface SectorPickerProps {
  activeSector: string | null;
  onSelect: (sectorId: string) => void;
}

export default function SectorPicker({ activeSector, onSelect }: SectorPickerProps) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {SECTORS.map((sector) => {
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
  );
}
