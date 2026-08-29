'use client';

// pekanga-shared/CareerCard.tsx
//
// The Explore Careers list-view card: icon + title, one-line description, a
// demand pill (with an Adzuna link when there's a live listing count), an
// entry/mid/top salary row, and a "View full details" footer. Ported from
// School's ExploreCard pattern (src/components/ExploreScreen.tsx), which
// duplicated CareerCard.tsx's own card markup for the static-data Explore
// Careers shape — this file replaces both card copies with one.
//
// Scope is deliberately just the card, not the detail view. School's detail
// modal has AI chat / "explore similar" / reverse-risk hooks that don't
// exist on Advisor yet, so the detail view stays per-product for now.
//
// HEADLESS, same as AdminTreeDashboard.tsx: no data fetching, no backend
// knowledge, no auth. Salary/demand figures come in as props already
// resolved (live LMI merge or static fallback — the caller decides which).
// Local FONT constant rather than var(--font-body) — deliberately sidesteps
// the missing --font-heading/--font-body tokens bug this same build fixes
// at the token level, so this component isn't silently broken if that fix
// is ever reverted.

import React from 'react';
import { tokens } from './tokens.js';

const FONT = "'Sora', sans-serif";

export interface CareerCardSalary {
  entry: string;
  mid: string;
  /** p90 "top earner" figure in whole pounds, e.g. 100000 for "£100,000+". */
  topEarner?: number | null;
  /** e.g. "ONS ASHE 2025" or "Estimated · based on ONS ASHE data for similar roles". */
  sourceLabel: string;
  /** Adds a small "regional" chip next to the source line. */
  isRegional?: boolean;
}

export interface CareerCardDemand {
  /** e.g. "High demand", "Moderate demand", "Low demand". */
  label: string;
  /** Live Adzuna vacancy count. Omit when only a label is known (no count yet). */
  vacancyCount?: number;
}

export interface CareerCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Live entry/mid/top bands. Omit to fall back to `staticSalary`. */
  salary?: CareerCardSalary;
  /** Single pre-baked salary string, shown when `salary` isn't available yet. */
  staticSalary?: string;
  demand?: CareerCardDemand;
  onOpenDetails: () => void;
}

function TrendIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function DemandPill({ demand, careerTitle }: { demand: CareerCardDemand; careerTitle: string }) {
  const isHigh = demand.label.toLowerCase().includes('high');
  if (demand.vacancyCount) {
    return (
      <a
        href={`https://www.adzuna.co.uk/search?q=${encodeURIComponent(careerTitle)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ textDecoration: 'none', display: 'inline-block' }}
      >
        <span
          style={{
            fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
            background: isHigh ? tokens.coralDeep : tokens.blueMid, color: tokens.white,
            display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONT,
          }}
        >
          <TrendIcon />
          {demand.label} · {demand.vacancyCount.toLocaleString()} live listings →
        </span>
      </a>
    );
  }
  return (
    <span
      style={{
        fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
        background: tokens.blueLight, color: tokens.blueMid, display: 'inline-block', fontFamily: FONT,
      }}
    >
      {demand.label}
    </span>
  );
}

function SalaryRow({ salary }: { salary: CareerCardSalary }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: tokens.textMuted, fontFamily: FONT }}>Entry</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: tokens.navy, whiteSpace: 'nowrap', fontFamily: FONT }}>{salary.entry}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: tokens.textMuted, fontFamily: FONT }}>Mid</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: tokens.navy, whiteSpace: 'nowrap', fontFamily: FONT }}>{salary.mid}</span>
        </div>
        {salary.topEarner ? (
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: tokens.textMuted, fontFamily: FONT }}>Top</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: tokens.navy, whiteSpace: 'nowrap', fontFamily: FONT }}>£{salary.topEarner.toLocaleString('en-GB')}+</span>
          </div>
        ) : null}
      </div>
      <div style={{ fontSize: 10, color: tokens.textMuted, marginTop: 3, fontFamily: FONT }}>
        {salary.topEarner ? (
          <span title="Top earners (p90): what someone in the top 10% of earners in this job typically makes, based on ONS data.">
            Top earners (ONS p90, top 10% of earners) ·{' '}
          </span>
        ) : null}
        Source: {salary.sourceLabel}
        {salary.isRegional ? <span style={{ marginLeft: 4, color: tokens.blueMid, fontWeight: 600 }}>regional</span> : null}
      </div>
    </div>
  );
}

export default function CareerCard({ icon, title, description, salary, staticSalary, demand, onOpenDetails }: CareerCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails();
        }
      }}
      style={{
        background: tokens.white, border: `1.5px solid ${tokens.border}`,
        borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', fontFamily: FONT,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px rgba(30,58,95,0.13)`;
        (e.currentTarget as HTMLDivElement).style.borderColor = tokens.blueMid;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        (e.currentTarget as HTMLDivElement).style.borderColor = tokens.border;
      }}
    >
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 2, width: 20, height: 20 }}>{icon}</span>
          <div style={{ fontSize: 15, fontWeight: 700, color: tokens.navy, lineHeight: 1.3, flex: 1 }}>{title}</div>
        </div>

        <p style={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.6, margin: '0 0 12px', flex: 1 }}>{description}</p>

        {demand ? (
          <div style={{ marginBottom: 10 }}>
            <DemandPill demand={demand} careerTitle={title} />
          </div>
        ) : null}

        {salary ? (
          <SalaryRow salary={salary} />
        ) : staticSalary ? (
          <div style={{ marginBottom: 10, fontSize: 13, color: tokens.navy, fontWeight: 600 }}>{staticSalary}</div>
        ) : null}

        <div
          style={{
            borderTop: `1px solid ${tokens.border}`, paddingTop: 10,
            fontSize: 11, color: tokens.blueMid, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span>View full details</span>
          <span style={{ fontSize: 13 }}>→</span>
        </div>
      </div>
    </div>
  );
}
