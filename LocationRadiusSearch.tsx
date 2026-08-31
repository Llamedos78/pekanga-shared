'use client';

// pekanga-shared/LocationRadiusSearch.tsx
//
// Postcode + radius location filter for apprenticeship search. Identical
// logic in School and Advisor — both search the same apprenticeship_listings
// cache via the same apprenticeship-search Edge Function, which never calls
// the gov.uk API live (see apprenticeship-refresh/index.ts). The gov.uk API
// itself only accepts Lat/Lon/DistanceInMiles, not a postcode, so this
// component owns the postcode -> coordinates conversion (via postcodes.io,
// free/no-key) and hands the resolved point + radius to the caller, who
// passes it through to apprenticeship-search as lat/lon/radiusMiles.
//
// HEADLESS: only knows about postcode/radius input and geocoding. Result
// rendering (card styles differ between School's dark panel and Advisor's
// light dashboard) stays with each caller.

import React, { useEffect, useRef, useState } from 'react';
import { tokens } from './tokens.js';

const FONT = "'Sora', sans-serif";

export const RADIUS_OPTIONS = [5, 10, 15, 20, 50] as const;
export const DEFAULT_RADIUS_MILES: (typeof RADIUS_OPTIONS)[number] = 15;

export const NO_RESULTS_LOCATION_MESSAGE = 'No results — try widening your search radius.';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export type LocationRadiusStatus = 'idle' | 'checking' | 'found' | 'not_found' | 'error';

export interface LocationRadiusValue {
  postcode: string;
  radiusMiles: number;
  point: GeoPoint | null;
  status: LocationRadiusStatus;
}

/** postcodes.io lookup — free, no API key. Returns null on any bad/unknown postcode. */
export async function geocodePostcode(postcode: string): Promise<GeoPoint | null> {
  const trimmed = postcode.trim();
  if (!trimmed) return null;
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status !== 200 || typeof data?.result?.latitude !== 'number' || typeof data?.result?.longitude !== 'number') {
      return null;
    }
    return { lat: data.result.latitude, lon: data.result.longitude };
  } catch {
    return null;
  }
}

export interface LocationRadiusSearchProps {
  /** Prefilled postcode — School's registered postcode, or the Advisor client's postcode. */
  initialPostcode?: string;
  /** Fires ~400ms after the user stops typing/dragging, once geocoding (if any) settles. */
  onChange: (value: LocationRadiusValue) => void;
  /** Set false on a dark background (School's navy panel). */
  light?: boolean;
}

export default function LocationRadiusSearch({ initialPostcode = '', onChange, light = true }: LocationRadiusSearchProps) {
  const [postcode, setPostcode] = useState(initialPostcode);
  const [radiusMiles, setRadiusMiles] = useState<number>(DEFAULT_RADIUS_MILES);
  const [status, setStatus] = useState<LocationRadiusStatus>('idle');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = postcode.trim();
    if (!trimmed) {
      setStatus('idle');
      onChange({ postcode: trimmed, radiusMiles, point: null, status: 'idle' });
      return;
    }

    setStatus('checking');
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      const point = await geocodePostcode(trimmed);
      if (requestIdRef.current !== requestId) return; // superseded by a newer edit
      const nextStatus: LocationRadiusStatus = point ? 'found' : 'not_found';
      setStatus(nextStatus);
      onChange({ postcode: trimmed, radiusMiles, point, status: nextStatus });
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode, radiusMiles]);

  const ink = light ? tokens.navy : tokens.white;
  const inkMuted = light ? tokens.textMuted : 'rgba(255,255,255,0.65)';
  const inputBg = light ? tokens.white : 'rgba(255,255,255,0.08)';
  const border = light ? `1px solid ${tokens.border}` : '1px solid rgba(255,255,255,0.18)';
  const radiusIndex = Math.max(0, RADIUS_OPTIONS.indexOf(radiusMiles as (typeof RADIUS_OPTIONS)[number]));

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', fontFamily: FONT }}>
      <label style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: inkMuted }}>Postcode</span>
        <input
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="e.g. SW1A 1AA"
          style={{ padding: '9px 12px', borderRadius: 8, border, background: inputBg, color: ink, fontSize: 14, fontFamily: FONT }}
        />
        {status === 'not_found' && (
          <span style={{ fontSize: 11, color: tokens.red }}>Postcode not recognised — check and try again.</span>
        )}
      </label>
      <label style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: inkMuted }}>Radius: {radiusMiles} miles</span>
        <input
          type="range"
          min={0}
          max={RADIUS_OPTIONS.length - 1}
          step={1}
          value={radiusIndex}
          onChange={(e) => setRadiusMiles(RADIUS_OPTIONS[Number(e.target.value)])}
          style={{ width: '100%', accentColor: tokens.coral }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: inkMuted }}>
          {RADIUS_OPTIONS.map((r) => <span key={r}>{r}mi</span>)}
        </div>
      </label>
    </div>
  );
}
