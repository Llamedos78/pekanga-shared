// pekanga-shared/EasyRead.ts
//
// Easy Read text-transform logic for SEND Layer 2 (self-service Easy
// Read/symbol preference — see Neil's 2026-09-04 decision: staff-assigned
// PfA-evidencing toggle is a separate, later, DPA-gated piece, not this).
//
// Rules here are taken directly from Mencap's "Am I making myself clear?
// Mencap's guidelines for accessible writing" (first printed 2000, reprinted
// 2002 — https://www.elft.nhs.uk/sites/default/files/2022-03/Am%20I%20Making
// %20Myself%20Clear%20-%20Mencap's%20Guidelines%20for%20Accessible%20Writing.pdf),
// not an invented house style. Section references below ("Using plain
// English", "Using symbols, drawings and photos") are that document's own
// section headings, so the source of each rule can be checked directly.
//
// HEADLESS, same as apprenticeshipMatch.ts and every other module in this
// package: pure text in, structured data/text out. No state, no auth, no
// network call, no DB access.
//
// buildEasyReadPrompt used to live here. Moved out (2026-09-08) to
// pekanga-school/supabase/functions/_shared/easyReadPrompt.ts: Edge
// Functions run on Deno and import from supabase/functions/_shared/, not
// from a package pulled in as a git dependency, so it couldn't stay here
// and still be usable from a server-side Edge Function. It is deliberately
// NOT re-exported from this package — see that file's HARD REQUIREMENT
// comment for why (browser code must never compose the Easy Read system
// prompt itself). checkEasyReadCompliance and splitIntoSymbolUnits stay
// here: they run against already-rendered text and have legitimate
// client-side (and future server-side) callers.

// ── COMPLIANCE CHECK ────────────────────────────────────────────────────

// Still needed here even though buildEasyReadPrompt (its other consumer)
// moved out: checkEasyReadCompliance's own glossary param is the same
// shape, since a caller checking rewritten text and a caller building the
// rewrite prompt are working from the same term/definition list. Duplicated
// (not imported) into easyReadPrompt.ts rather than shared across the
// Deno/npm boundary that split exists to respect.
export interface EasyReadGlossaryEntry {
  /** The difficult word or phrase as it appears in the source text. */
  term: string;
  /** A short, plain-English definition — Mencap: "a 'dictionary' or 'list of useful words'". */
  definition: string;
}

export type EasyReadRule =
  | 'sentence-too-long'
  | 'multiple-ideas'
  | 'complex-punctuation'
  | 'possible-passive-voice'
  | 'number-as-word'
  | 'precise-large-number'
  | 'possible-jargon'
  | 'passage-too-long';

export interface EasyReadIssue {
  rule: EasyReadRule;
  /** Human-readable explanation, referencing the Mencap section the rule comes from. */
  detail: string;
  /** The offending sentence or token. */
  excerpt: string;
  /**
   * True when this rule is a heuristic whose output needs a human (or LLM)
   * pass to confirm before acting on it, rather than a rule that can be
   * trusted at face value. Currently only 'possible-passive-voice' sets
   * this — its regex (a be-verb + any "-ed" word) matches plain adjectives
   * ("is excited") and misses irregular participles ("was given"), so it
   * both over- and under-fires. Not set on other rules.
   */
  advisory?: boolean;
}

const NUMBER_WORDS = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty',
  'seventy', 'eighty', 'ninety', 'hundred', 'thousand',
];

// Diagnostic finding (2026-09-08, Visual Explore false-positive audit): a
// number-word inside a hyphenated compound is an idiom, not a numeral
// Mencap wants digitised — "one-to-one" (mentoring), "one-off" (fees),
// "twenty-four-seven" etc. \b matches on either side of a hyphen (it's a
// non-word character), so the un-patched regex flags these. This set lists
// the specific hyphenated compounds seen in this codebase's content so far;
// it is not a general hyphen-blindness fix (that would also silently
// swallow genuine cases like "two - three days").
const HYPHENATED_NUMBER_IDIOMS = ['one-to-one', 'one-off', 'twenty-four-seven'];

// Diagnostic finding (2026-09-08, Visual Explore false-positive audit): with
// an empty glossary, 15 of 16 possible-jargon flags in a 20-string hand-
// reviewed sample were false positives. Breakdown: "AI" (12 hits) is the
// product's own core, already-explained term (see RiskModal.tsx); "UK" (2
// hits) is universally understood, especially in a UK-schools product;
// "ONS" and "ASHE" both self-define inline in the same string
// ("Office for National Statistics (ONS)", "Annual Survey of Hours and
// Earnings (ASHE)") — the checker has no way to see that. "PDF" wasn't in
// the 20-string sample but was flagged in the separate rule-7 census
// ("Save as PDF") and is equally near-universally known. This is not a
// general-purpose stoplist; it only covers terms confirmed to
// false-positive against this codebase's actual copy. A caller with a
// domain-specific glossary should still pass it — this list is merged
// with, not a replacement for, the `glossary` parameter.
//
// GCSE and UCAS added 2026-09-09: live-tested via easy-read-report against
// real progression-route source text, both flagged as jargon on every
// pass even when spelled out inline by the model ("General Certificate of
// Secondary Education, or GCSE") — the checker has no way to credit an
// inline expansion the way it credits a glossary entry. Both terms are
// near-universally understood in a UK-schools careers product, same
// rationale as the original five.
//
// Batch added 2026-09-13: consolidated from the careers-content expansion
// project (100 → ~215 careers, sourced from National Careers Service
// profiles). Same failure mode as GCSE/UCAS above — each is a real
// qualification body, professional body, broadcaster or organisation name
// that gets spelled out inline by the model but still flags, because the
// checker can't credit an inline expansion. Grouped by domain rather than
// per-batch: NATO, PE, CISI, TV, BBC, ITV, BECTU, NHS, DNA, BASIS, HND,
// CSCS, MCS, BFI, ACCA, ICAEW, AIA, ICAS, CIPFA, IT, CAD, CCNSG, TSLI, MRI.
const DEFAULT_JARGON_ALLOWLIST = [
  'AI', 'PDF', 'UK', 'ONS', 'ASHE', 'GCSE', 'UCAS',
  'NATO', 'PE', 'CISI', 'TV', 'BBC', 'ITV', 'BECTU', 'NHS', 'DNA', 'BASIS',
  'HND', 'CSCS', 'MCS', 'BFI', 'ACCA', 'ICAEW', 'AIA', 'ICAS', 'CIPFA', 'IT',
  'CAD', 'CCNSG', 'TSLI', 'MRI',
];

// Common passive-voice shape: a form of "to be" followed by a past
// participle ("was created", "is required", "were given"). A heuristic, not
// a grammar parser — flags candidates for a human/LLM pass to confirm, per
// "Use active and personal language".
const PASSIVE_RE = /\b(is|are|was|were|been|being|be)\s+\w+ed\b/i;

// Diagnostic finding (2026-09-13, Visual Explore dense-card investigation):
// a passage can pass every per-sentence rule above and still read as a
// dense paragraph if it chains enough individually-short, individually-
// compliant sentences together. Two live careers confirmed as the "good"
// reference length for a single Easy Read field: Cloud/DevOps Engineer (4
// sentences) and Cybersecurity Analyst (5 sentences) — both card blurbs
// that read as a short, scannable passage on screen. This threshold is a
// hard fail, not advisory, since unlike possible-passive-voice there's no
// ambiguity in a sentence count.
const MAX_PASSAGE_SENTENCES = 5;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function countWords(sentence: string): number {
  return sentence.split(/\s+/).filter(Boolean).length;
}

/**
 * Deterministic, no-LLM check of a candidate Easy Read passage against
 * Mencap's rules — cheap enough to run on every LLM rewrite output before
 * it's shown to a student, or on hand-written Easy Read copy. Flags
 * candidates for review; it does not rewrite anything itself.
 */
export function checkEasyReadCompliance(text: string, glossary: EasyReadGlossaryEntry[] = []): EasyReadIssue[] {
  const issues: EasyReadIssue[] = [];
  const knownTerms = new Set([
    ...glossary.map((g) => g.term.toLowerCase()),
    ...DEFAULT_JARGON_ALLOWLIST.map((t) => t.toLowerCase()),
  ]);

  const sentences = splitSentences(text);
  if (sentences.length > MAX_PASSAGE_SENTENCES) {
    issues.push({
      rule: 'passage-too-long',
      detail: `Passage is ${sentences.length} sentences. Even when each sentence is individually compliant, chaining more than ${MAX_PASSAGE_SENTENCES} together reads as a dense paragraph rather than a short, scannable passage.`,
      excerpt: text,
    });
  }

  for (const sentence of sentences) {
    const wordCount = countWords(sentence);

    if (wordCount > 18) {
      issues.push({
        rule: 'sentence-too-long',
        detail: `Sentence is ${wordCount} words. Mencap's guideline is roughly 10-16 words, one idea per sentence ("Keep sentences short").`,
        excerpt: sentence,
      });
    }

    // Thousands separators (£30,000) aren't clause-joining commas -- strip
    // them before counting, or every salary figure trips this rule.
    const commaCount = (sentence.replace(/(\d),(\d{3})/g, '$1$2').match(/,/g) ?? []).length;
    const hasAnd = /\band\b/i.test(sentence);
    if (commaCount >= 2 || (commaCount >= 1 && hasAnd)) {
      issues.push({
        rule: 'multiple-ideas',
        detail: `Sentence likely joins more than one idea with commas or "and". Mencap: "See if any sentences using commas or joined with 'and' could be broken in two."`,
        excerpt: sentence,
      });
    }

    if (/[;:]/.test(sentence) || / - /.test(sentence)) {
      issues.push({
        rule: 'complex-punctuation',
        detail: `Contains a semicolon, colon, or dash used as punctuation. Mencap: "Avoid semicolons, colons, hyphens ... or sentences broken up with too many commas."`,
        excerpt: sentence,
      });
    }

    if (PASSIVE_RE.test(sentence)) {
      issues.push({
        rule: 'possible-passive-voice',
        detail: `Possibly passive voice. Mencap: "Use active and personal language."`,
        excerpt: sentence,
        advisory: true,
      });
    }

    for (const word of NUMBER_WORDS) {
      const re = new RegExp(`\\b${word}\\b`, 'i');
      if (re.test(sentence) && !HYPHENATED_NUMBER_IDIOMS.some((idiom) => new RegExp(`\\b${idiom}\\b`, 'i').test(sentence) && idiom.includes(word))) {
        issues.push({
          rule: 'number-as-word',
          detail: `Uses "${word}" as a word. Mencap: "Always use the number and not the word even for small numbers."`,
          excerpt: sentence,
        });
      }
    }

    const percentMatch = sentence.match(/\d+(\.\d+)?\s*%/);
    const bigNumberMatch = sentence.match(/\b\d{4,}\b/);
    if (percentMatch || bigNumberMatch) {
      issues.push({
        rule: 'precise-large-number',
        detail: `Uses a percentage or a large precise number. Mencap: "Try not to use percentages or large numbers. You could say 'a few' instead of 7% and 'many' instead of 1,552."`,
        excerpt: percentMatch?.[0] ?? bigNumberMatch?.[0] ?? sentence,
      });
    }

    // All-caps tokens of 2+ letters, not a single-letter initial, not
    // preceded by a defined glossary entry — likely an unexplained
    // abbreviation (e.g. "UCAS", "GCSE"). Mencap: "Don't use jargon,
    // unnecessary technical detail or abbreviations."
    const acronyms = sentence.match(/\b[A-Z]{2,}\b/g) ?? [];
    for (const acronym of acronyms) {
      if (!knownTerms.has(acronym.toLowerCase())) {
        issues.push({
          rule: 'possible-jargon',
          detail: `"${acronym}" looks like an unexplained abbreviation. Mencap: spell things out, or include a 'dictionary' entry for words that can't be avoided.`,
          excerpt: sentence,
        });
      }
    }
  }

  return issues;
}

// ── SYMBOL-PAIRING UNITS (Widgit integration point) ─────────────────────

export interface EasyReadUnit {
  /** One self-contained idea, meant to sit next to a single symbol/image. */
  text: string;
  /**
   * A rough keyword guess for which word in the unit a symbol lookup should
   * key off — the single longest non-stopword token. This is a placeholder
   * heuristic for the Widgit integration (separate work), not a real
   * concept-extraction step: Widgit's own symbol dictionary/lookup should
   * ultimately decide what gets illustrated, per "Choose the image which
   * best explains your text" and "Don't rely heavily on symbols unless you
   * know your readers are confident symbol users."
   */
  symbolCandidate: string | null;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'to', 'of', 'in', 'on', 'for', 'with', 'at', 'by', 'from',
  'you', 'we', 'your', 'our', 'this', 'that', 'it', 'as', 'if', 'not', 'can',
  'will', 'do', 'does', 'did', 'has', 'have', 'had',
]);

/**
 * Splits Easy Read text (ideally already one-idea-per-sentence, per
 * buildEasyReadPrompt's output contract — now in
 * pekanga-school/supabase/functions/_shared/easyReadPrompt.ts) into
 * discrete units suited to one-symbol-per-unit pairing, matching Mencap's
 * "Link together words and pictures" guidance: place one image alongside
 * each main idea, not one image per word ("Don't use too many symbols").
 */
export function splitIntoSymbolUnits(text: string): EasyReadUnit[] {
  return splitSentences(text).map((sentence) => {
    const words = sentence
      .replace(/[^\w\s'-]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    const candidate = words
      .filter((w) => !STOPWORDS.has(w.toLowerCase()))
      .sort((a, b) => b.length - a.length)[0];

    return { text: sentence, symbolCandidate: candidate ?? null };
  });
}
