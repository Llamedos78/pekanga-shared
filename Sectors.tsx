// pekanga-shared/Sectors.tsx
//
// The 20-sector Explore Careers taxonomy (approved by Neil, replacing the
// old 11-sector, priority-ordered list both products had independently
// re-implemented — the icon set in particular was hand-copied verbatim
// between School's ExploreScreen.tsx and Advisor's VisualExploreScreen.tsx,
// which is exactly the drift this package exists to stop). Alphabetised for
// display, per the original parity spec.
//
// Pure static reference data — no fetching, no product knowledge. Career
// rows carry a `category` field whose value is one of these ids.

import React from 'react';

export interface Sector {
  id: string;
  label: string;
}

// Alphabetised by label.
export const SECTORS: Sector[] = [
  { id: 'art-design', label: 'Art & Design' },
  { id: 'business-finance', label: 'Business & Finance' },
  { id: 'childcare-education', label: 'Childcare & Education' },
  { id: 'construction-trades', label: 'Construction & Trades' },
  { id: 'creative-media-marketing', label: 'Creative, Media & Marketing' },
  { id: 'energy-recycling', label: 'Energy & Recycling' },
  { id: 'engineering-manufacturing', label: 'Engineering & Manufacturing' },
  { id: 'hair-beauty-wellbeing', label: 'Hair, Beauty & Wellbeing' },
  { id: 'healthcare-emergency', label: 'Healthcare & Emergency Services' },
  { id: 'hospitality-tourism', label: 'Hospitality & Tourism' },
  { id: 'land-based', label: 'Land-Based, Animal Care & Environment' },
  { id: 'legal', label: 'Legal' },
  { id: 'performing-arts', label: 'Performing Arts' },
  { id: 'public-services', label: 'Public Services' },
  { id: 'retail', label: 'Retail' },
  { id: 'science', label: 'Science' },
  { id: 'sport-leisure', label: 'Sport & Leisure' },
  { id: 'technology-digital', label: 'Technology & Digital (IT)' },
  { id: 'transport-logistics', label: 'Transport & Logistics' },
  { id: 'uniformed-services', label: 'Uniformed Services' },
];

// Tonal SVG icons per sector — navy/blue palette, no emoji. Ten carried
// forward unchanged from the old 11-category set (same visual language);
// ten new for this taxonomy pass.
export const SECTOR_ICON: Record<string, React.ReactNode> = {
  'technology-digital': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="11" rx="2" stroke="#2272B3" strokeWidth="1.5"/><path d="M7 17h6M10 14v3" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'construction-trades': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17h14M5 17V9l5-6 5 6v8" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="8" y="12" width="4" height="5" rx=".5" fill="#EAF2FB" stroke="#2272B3" strokeWidth="1.5"/></svg>,
  'healthcare-emergency': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3C6.7 3 4 5.7 4 9c0 4.5 6 8 6 8s6-3.5 6-8c0-3.3-2.7-6-6-6z" stroke="#2272B3" strokeWidth="1.5"/><path d="M10 7v4M8 9h4" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'uniformed-services': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2 4h4l-3.3 2.4 1.3 4L10 10l-4 2.4 1.3-4L4 6h4z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 13v5" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'business-finance': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="7" width="14" height="10" rx="1.5" stroke="#2272B3" strokeWidth="1.5"/><path d="M7 7V5a3 3 0 016 0v2" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/><path d="M3 11h14" stroke="#2272B3" strokeWidth="1.5"/></svg>,
  'creative-media-marketing': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="#2272B3" strokeWidth="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'hospitality-tourism': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 8h12v2a6 6 0 01-12 0V8z" stroke="#2272B3" strokeWidth="1.5"/><path d="M10 14v3M7 17h6M10 8V4" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'engineering-manufacturing': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="#2272B3" strokeWidth="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/><path d="M5.6 5.6l1.1 1.1M13.3 13.3l1.1 1.1M5.6 14.4l1.1-1.1M13.3 6.7l1.1-1.1" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'transport-logistics': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="7" width="14" height="8" rx="1.5" stroke="#2272B3" strokeWidth="1.5"/><path d="M16 11h2v2h-2M5 15v2M13 15v2" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 11h14" stroke="#2272B3" strokeWidth="1.5"/></svg>,
  'childcare-education': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3l8 4-8 4-8-4 8-4z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/><path d="M4 11v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,

  'land-based': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 16c0-7 4-11 11-11 0 7-4 11-11 11z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/><path d="M4 16c2-4 5-7 9-9" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'art-design': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3a7 7 0 100 14c1 0 1.5-.6 1.5-1.4 0-.5-.3-.9-.3-1.4 0-.8.6-1.2 1.4-1.2H14a4 4 0 004-4c0-3.3-3.6-6-8-6z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="7" cy="9" r="1" fill="#2272B3"/><circle cx="10" cy="6.5" r="1" fill="#2272B3"/><circle cx="13" cy="8" r="1" fill="#2272B3"/></svg>,
  'legal': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M6 17h8" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 5l-5 2M10 5l5 2" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 7l2.5 5L8 7M12 7l2.5 5L17 7" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  'public-services': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 8l7-4 7 4" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 8v7M8 8v7M12 8v7M16 8v7" stroke="#2272B3" strokeWidth="1.5"/><path d="M2 17h16" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'energy-recycling': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M11 2L4 12h5l-1 6 8-11h-5l1-5z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  'hair-beauty-wellbeing': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="5" r="2" stroke="#2272B3" strokeWidth="1.5"/><circle cx="5" cy="15" r="2" stroke="#2272B3" strokeWidth="1.5"/><path d="M6.5 6.5L17 15M6.5 13.5L17 5" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'performing-arts': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 4.6L17 8l-4 3.2 1 5-4-2.8-4 2.8 1-5-4-3.2 5.2-1.4z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  'retail': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7h10l-1 10H6L5 7z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 7V5a3 3 0 016 0v2" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'sport-leisure': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 3h8v4a4 4 0 01-8 0V3z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 4H3v1a3 3 0 003 3M14 4h3v1a3 3 0 01-3 3" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 11v3M7 17h6M8.5 14h3l.5 3h-4l.5-3z" stroke="#2272B3" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  'science': <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 3h4M8.5 3v5L4 15a1.5 1.5 0 001.3 2.2h9.4A1.5 1.5 0 0016 15l-4.5-7V3" stroke="#2272B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13h8" stroke="#2272B3" strokeWidth="1.5"/></svg>,
};
