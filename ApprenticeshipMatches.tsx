'use client';

// pekanga-shared/ApprenticeshipMatches.tsx
//
// The "Getting in" live-apprenticeship section/tab, for a specific career.
// Neil's requirement: match to the career, not the sector (an Electrician
// page shows Electrician apprenticeships) — apprenticeshipMatch.ts already
// does that matching; this is just the rendering, which was about to be
// written a third and fourth time (School's ApprenticeshipsPanel.tsx and
// Advisor's apprenticeships/page.tsx already have near-identical
// formatWage/formatLocation/formatClosingDate helpers and card layout).
//
// Capped to a small inline set (Neil: 3-5) with a "view all" link through
// to the standalone Apprenticeships search, rather than listing every
// match. Renders nothing while loading and nothing when there are zero
// matches, rather than an empty section header — this is a supplementary
// panel on a career detail view, not the main content.
//
// HEADLESS: caller supplies supabaseUrl/anonKey (same as every other Edge
// Function call already made from both apps) and the "view all" href
// (each product's Apprenticeships surface is shaped differently — Advisor
// has a URL-addressable search page, School's is an in-app-state panel
// with no keyword field, so callers pass whatever's actually correct for
// them rather than this component guessing a URL).

import React, { useEffect, useState } from 'react';
import { tokens } from './tokens.js';
import { fetchMatchingApprenticeships, type ApprenticeshipListing } from './apprenticeshipMatch';

const FONT = "'Sora', sans-serif";

function formatWage(l: ApprenticeshipListing): string {
  if (l.wage_type === 'CompetitiveSalary') return 'Competitive salary';
  if (l.wage_amount == null) return 'Wage not specified';
  const unit = l.wage_unit === 'Weekly' ? '/week' : l.wage_unit === 'Monthly' ? '/month' : l.wage_unit === 'Annually' ? '/year' : '';
  return `£${l.wage_amount.toLocaleString('en-GB')}${unit}`;
}

function formatLocation(l: ApprenticeshipListing): string {
  if (l.is_national_vacancy) return 'Nationwide';
  return l.address_line1 || l.postcode || 'Location not specified';
}

function formatClosingDate(closingDate: string | null | undefined): string | null {
  if (!closingDate) return null;
  const d = new Date(closingDate);
  return `Closes ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export interface ApprenticeshipMatchesProps {
  careerTitle: string;
  supabaseUrl: string;
  anonKey: string;
  /** Where "view all" goes — a search page with the term pre-filled, or a static landing page. */
  viewAllHref: string;
  limit?: number;
  /** Set false on a dark background (e.g. School's navy detail-modal header strip). */
  light?: boolean;
}

export default function ApprenticeshipMatches({ careerTitle, supabaseUrl, anonKey, viewAllHref, limit = 4, light = true }: ApprenticeshipMatchesProps) {
  const [listings, setListings] = useState<ApprenticeshipListing[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setListings(null);
    fetchMatchingApprenticeships({ supabaseUrl, anonKey, careerTitle, limit }).then((r) => {
      if (!cancelled) setListings(r.listings);
    });
    return () => { cancelled = true; };
  }, [careerTitle, supabaseUrl, anonKey, limit]);

  if (listings === null || listings.length === 0) return null;

  const ink = light ? tokens.navy : tokens.white;
  const inkMuted = light ? tokens.textMuted : 'rgba(255,255,255,0.65)';
  const cardBg = light ? tokens.sandWhite : 'rgba(255,255,255,0.08)';
  const border = light ? `1px solid ${tokens.border}` : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: FONT }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: inkMuted }}>
        Live apprenticeship openings
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {listings.map((l) => (
          <a
            key={l.vacancy_reference}
            href={l.application_url || l.vacancy_url || viewAllHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', background: cardBg, border, borderRadius: 10, padding: '12px 14px', textDecoration: 'none' }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: ink, marginBottom: 2 }}>{l.title}</div>
            {l.employer_name ? <div style={{ fontSize: 12, color: inkMuted, marginBottom: 6 }}>{l.employer_name}</div> : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {l.apprenticeship_level ? (
                <span style={{ fontSize: 10, fontWeight: 600, color: tokens.coralDeep, background: tokens.coralLight, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>
                  {l.apprenticeship_level}
                </span>
              ) : null}
              <span style={{ fontSize: 10, fontWeight: 600, color: inkMuted, background: light ? tokens.border : 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                {formatLocation(l)}
              </span>
            </div>
            <div style={{ fontSize: 12, color: ink, fontWeight: 600 }}>{formatWage(l)}</div>
            {formatClosingDate(l.closing_date) ? (
              <div style={{ fontSize: 11, color: inkMuted, marginTop: 2 }}>{formatClosingDate(l.closing_date)}</div>
            ) : null}
          </a>
        ))}
      </div>
      <a href={viewAllHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: tokens.blueMid, alignSelf: 'flex-start' }}>
        View all apprenticeship listings →
      </a>
    </div>
  );
}
