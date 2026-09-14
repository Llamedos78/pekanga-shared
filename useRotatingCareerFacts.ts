'use client';

// pekanga-shared/useRotatingCareerFacts.ts
//
// Rotating short facts for a report-generation loading state (the
// 105-130s Easy Read / report Edge Function calls) -- replaces a bare
// spinner with real, already-trusted ONS/Adzuna figures instead of
// LLM-generated "fun facts". See the 2026-09-14 loading-facts brief.
//
// Unlike the rest of pekanga-shared's headless (props-only) modules, this
// one does its own fetching -- the brief's own definition is "a hook that
// fetches/selects facts", and there's no clean way to make report-loading
// screens pre-fetch LMI data before they know which careers a report will
// produce. It calls the same public `lmi-lookup` Edge Function every
// School/Advisor screen with live salary data already calls (see
// ForwardReport.tsx's patchLmiSalaries, Advisor's exploreSimilar.ts) --
// same env vars (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`),
// same fallback URL, same fuzzy title matching server-side.
//
// `subject` can be a GCSE/A-level subject name (or list), in which case a
// small curated SUBJECT_CAREER_HINTS map picks a few representative real
// career titles to pull live figures for -- those titles are never shown
// as "the careers you'll get", they're only anchors for choosing which
// live labour-market rows to surface. Or `subject` can be a career title
// directly (reverse-report / single-role assessment flows already know
// the career before generation starts). Pass undefined when the caller
// has no clean subject or career at all (e.g. Advisor's free-text
// "interests" discovery flow) -- the hook falls back to a small set of
// well-known career titles so it still shows real figures, just not
// personalised ones.

import { useEffect, useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvgisdcomwvtiziheswm.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const LMI_LOOKUP_URL = `${SUPABASE_URL}/functions/v1/lmi-lookup`;

const SUBJECT_CAREER_HINTS: Record<string, string[]> = {
  maths: ['Software Developer', 'Actuary', 'Accountant'],
  mathematics: ['Software Developer', 'Actuary', 'Accountant'],
  english: ['Journalist', 'Marketing Executive', 'Teacher'],
  'english language': ['Journalist', 'Marketing Executive', 'Teacher'],
  'english literature': ['Journalist', 'Editor', 'Teacher'],
  biology: ['Nurse', 'Biomedical Scientist', 'Veterinary Nurse'],
  chemistry: ['Pharmacist', 'Chemical Engineer', 'Forensic Scientist'],
  physics: ['Electrical Engineer', 'Aerospace Engineer', 'Data Analyst'],
  'computer science': ['Software Developer', 'Cyber Security Analyst', 'Data Analyst'],
  ict: ['Software Developer', 'IT Support Technician', 'Data Analyst'],
  art: ['Graphic Designer', 'Illustrator', 'Interior Designer'],
  'art and design': ['Graphic Designer', 'Illustrator', 'Interior Designer'],
  geography: ['Town Planner', 'Environmental Consultant', 'Surveyor'],
  history: ['Museum Curator', 'Solicitor', 'Teacher'],
  psychology: ['Psychologist', 'HR Officer', 'Social Worker'],
  business: ['Business Analyst', 'Marketing Executive', 'Accountant'],
  'business studies': ['Business Analyst', 'Marketing Executive', 'Accountant'],
  economics: ['Economist', 'Financial Analyst', 'Accountant'],
  'physical education': ['Physiotherapist', 'Personal Trainer', 'Sports Coach'],
  pe: ['Physiotherapist', 'Personal Trainer', 'Sports Coach'],
  music: ['Music Teacher', 'Sound Engineer', 'Music Therapist'],
  drama: ['Actor', 'Theatre Production Manager', 'Teacher'],
  'design and technology': ['Product Designer', 'Mechanical Engineer', 'Architect'],
  dt: ['Product Designer', 'Mechanical Engineer', 'Architect'],
  sociology: ['Social Worker', 'HR Officer', 'Youth Worker'],
  'food technology': ['Chef', 'Food Scientist', 'Nutritionist'],
  'health and social care': ['Nurse', 'Social Worker', 'Occupational Therapist'],
};

// Used when the caller has no clean subject/career at all (e.g. free-text
// "interests" discovery input) -- still real, live figures, just generic.
const FALLBACK_CAREERS = ['Nurse', 'Software Developer', 'Electrician', 'Teacher', 'Accountant'];

interface LmiResult {
  median_salary: number;
  lower_quartile: number | null;
  p90_salary: number | null;
  source: string;
  reference_year: number;
  region: string;
  vacancy_count?: number | null;
  demand_label?: string | null;
}

function pickCareerTitles(subject: string | string[] | undefined): string[] {
  if (!subject) return FALLBACK_CAREERS;
  const subjects = Array.isArray(subject) ? subject : [subject];
  const titles = new Set<string>();
  for (const s of subjects) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const hints = SUBJECT_CAREER_HINTS[trimmed.toLowerCase()];
    if (hints) hints.forEach((t) => titles.add(t));
    else titles.add(trimmed); // not a known subject -- treat as a career title itself
  }
  return titles.size > 0 ? Array.from(titles).slice(0, 5) : FALLBACK_CAREERS;
}

function factsFromResult(title: string, lmi: LmiResult): string[] {
  const facts: string[] = [];
  const fmt = (n: number) => `£${n.toLocaleString('en-GB')}`;

  if (lmi.lower_quartile) {
    facts.push(`${title}s typically start on around ${fmt(lmi.lower_quartile)} a year (${lmi.source}).`);
  } else if (lmi.median_salary) {
    facts.push(`The typical salary for a ${title} is around ${fmt(lmi.median_salary)} a year (${lmi.source}).`);
  }
  if (lmi.p90_salary) {
    facts.push(`Top earners in this field can make ${fmt(lmi.p90_salary)}+ a year (${lmi.source}).`);
  }
  if (lmi.vacancy_count && lmi.demand_label) {
    facts.push(`${lmi.demand_label} demand for ${title}s right now — ${lmi.vacancy_count.toLocaleString()} live vacancies.`);
  }
  return facts;
}

export interface UseRotatingCareerFactsOptions {
  /** How often to advance to the next fact. Default 8000ms. */
  intervalMs?: number;
  /** Cap on how many facts to collect. Default 5. */
  maxFacts?: number;
}

/**
 * Returns the currently-displayed fact string, or null while facts are
 * loading / unavailable (fetch failed, no data matched -- callers should
 * render nothing extra in that case rather than an error, this is
 * decoration on top of an existing spinner, not a required element).
 */
export function useRotatingCareerFacts(
  subject: string | string[] | undefined,
  options?: UseRotatingCareerFactsOptions
): string | null {
  const intervalMs = options?.intervalMs ?? 8000;
  const maxFacts = options?.maxFacts ?? 5;

  const [facts, setFacts] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const subjectKey = Array.isArray(subject) ? subject.join('|') : (subject ?? '');

  useEffect(() => {
    let cancelled = false;
    setFacts([]);
    setIndex(0);

    async function load() {
      const titles = pickCareerTitles(subject);
      try {
        const res = await fetch(LMI_LOOKUP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ careers: titles, region: 'National' }),
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const results = (data?.results ?? {}) as Record<string, LmiResult>;

        const built: string[] = [];
        for (const title of titles) {
          const lmi = results[title];
          if (!lmi) continue;
          built.push(...factsFromResult(title, lmi));
        }
        if (!cancelled && built.length > 0) setFacts(built.slice(0, maxFacts));
      } catch {
        // Best-effort -- caller renders nothing extra when this stays null.
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectKey]);

  useEffect(() => {
    if (facts.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % facts.length), intervalMs);
    return () => clearInterval(timer);
  }, [facts.length, intervalMs]);

  return facts[index] ?? null;
}
