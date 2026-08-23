// pekanga-shared/apprenticeshipMatch.ts
//
// Career-specific apprenticeship matching for the "Getting in" section/tab.
// Neil's requirement: match to the specific career (an Electrician page
// shows Electrician apprenticeships), not the sector — same precision as
// the existing ONS/Adzuna salary-demand data, not a step down from it.
//
// Verified against apprenticeship-search/index.ts before building this:
// its `q` param does a real ilike substring match against vacancy title,
// course_title and employer_name (actual gov.uk listing text), not a
// coarse sector/route tag — so per-career free-text search is genuinely
// supported, not a fallback. `route` (IfATE category) exists as a
// separate, coarser filter and is deliberately not used here.
//
// HEADLESS: caller supplies its own Supabase URL/anon key (same as every
// other Edge Function call already made from both apps) — no env reading,
// no product knowledge.

export interface ApprenticeshipListing {
  vacancy_reference: string;
  title: string;
  short_description?: string | null;
  employer_name?: string | null;
  provider_name?: string | null;
  course_title?: string | null;
  course_level?: number | null;
  apprenticeship_level?: string | null;
  route?: string | null;
  wage_type?: string | null;
  wage_amount?: number | null;
  wage_unit?: string | null;
  wage_additional_info?: string | null;
  hours_per_week?: number | null;
  expected_duration?: string | null;
  posted_date?: string | null;
  closing_date?: string | null;
  is_national_vacancy?: boolean | null;
  address_line1?: string | null;
  postcode?: string | null;
  application_url?: string | null;
  vacancy_url?: string | null;
}

/**
 * Splits a compound career title ("Data Analyst / Data Scientist", "Royal
 * Air Force (RAF)") into individual search-worthy terms, since gov.uk
 * vacancy titles won't contain the full compound phrase verbatim. Capped
 * at 3 terms — most titles have one or two parts; this bounds the number
 * of network round-trips per card.
 */
export function getCareerSearchTerms(title: string): string[] {
  const parenMatch = title.match(/\(([^)]+)\)/);
  const paren = parenMatch ? parenMatch[1] : '';
  const main = title.replace(/\([^)]+\)/, '').trim();

  const splitter = /\s*\/\s*|\s+&\s+|\s+and\s+/i;
  const parts = [...main.split(splitter), ...paren.split(splitter)]
    .map((p) => p.trim())
    .filter((p) => p.length >= 3);

  const seen = new Set<string>();
  const terms: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      terms.push(p);
    }
  }
  return terms.slice(0, 3);
}

async function searchOnce(
  supabaseUrl: string,
  anonKey: string,
  q: string,
): Promise<ApprenticeshipListing[]> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/apprenticeship-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ q, limit: 10 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.listings) ? data.listings : [];
  } catch {
    return [];
  }
}

export interface MatchingApprenticeshipsResult {
  listings: ApprenticeshipListing[];
  searchTerms: string[];
}

/**
 * Fetches apprenticeship listings matching a specific career, merged and
 * deduped across the career's search terms, sorted newest-first, capped to
 * `limit` (default 4 — within Neil's 3-5 inline-display range; the caller
 * links "view all" to the standalone Apprenticeships search pre-filled with
 * `searchTerms[0]` rather than rendering every match here).
 */
export async function fetchMatchingApprenticeships(opts: {
  supabaseUrl: string;
  anonKey: string;
  careerTitle: string;
  limit?: number;
}): Promise<MatchingApprenticeshipsResult> {
  const { supabaseUrl, anonKey, careerTitle, limit = 4 } = opts;
  const searchTerms = getCareerSearchTerms(careerTitle);
  if (searchTerms.length === 0) return { listings: [], searchTerms };

  const results = await Promise.all(searchTerms.map((term) => searchOnce(supabaseUrl, anonKey, term)));

  const byRef = new Map<string, ApprenticeshipListing>();
  for (const list of results) {
    for (const listing of list) {
      if (!byRef.has(listing.vacancy_reference)) byRef.set(listing.vacancy_reference, listing);
    }
  }

  const merged = [...byRef.values()].sort((a, b) => {
    const da = a.posted_date ? new Date(a.posted_date).getTime() : 0;
    const db = b.posted_date ? new Date(b.posted_date).getTime() : 0;
    return db - da;
  });

  return { listings: merged.slice(0, limit), searchTerms };
}
