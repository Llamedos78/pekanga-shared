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
// ═══════════════════════════════════════════════════════════════════════
// HARD REQUIREMENT — NOT OPTIONAL, NOT A STYLE PREFERENCE. Read before
// wiring this into any screen. A PR that wires buildEasyReadPrompt's output
// into a live call path MUST NOT MERGE without this condition met:
//
//   buildEasyReadPrompt's output must never travel from the browser to
//   claude-proxy as a raw client-composed `systemPrompt`.
//
// It must instead go through its own dedicated server-side Edge Function —
// same shape as career-tagging-report: the browser sends structured inputs
// (source text + glossary) only, and the server builds the actual prompt
// sent to the model.
//
// Why this is a hard gate, not a preference: pekanga-school/src/lib/api.ts
// (lines ~143-146) documents that claude-proxy used to accept an arbitrary
// client-supplied systemPrompt string, that this was identified as a
// prompt-injection exposure in the Phase 0 architecture audit, and that it
// was deliberately closed off for career-tagging-report for exactly that
// reason. Chat.tsx/callPekanAPI still use the old client-composed-prompt
// path for free-form chat — that is a known, accepted exception for chat,
// NOT a precedent to copy here. Easy Read has no such exception: reusing
// that path for Easy Read reopens the same exposure the audit closed.
//
// Wiring-PR checklist (all must be true before merge):
//   [ ] Source text + glossary are sent to the server as structured fields,
//       never as an assembled prompt string.
//   [ ] The system prompt (built from buildEasyReadPrompt's logic) is
//       constructed server-side, inside the new Edge Function — not in
//       browser code, not passed through as a `systemPrompt` param.
//   [ ] The new Edge Function is a distinct endpoint from claude-proxy's
//       generic systemPrompt-accepting path (career-tagging-report is the
//       reference implementation to follow).
// ═══════════════════════════════════════════════════════════════════════

// ── PLAIN ENGLISH PROMPT ────────────────────────────────────────────────

export interface EasyReadGlossaryEntry {
  /** The difficult word or phrase as it appears in the source text. */
  term: string;
  /** A short, plain-English definition — Mencap: "a 'dictionary' or 'list of useful words'". */
  definition: string;
}

export interface EasyReadPromptOptions {
  /**
   * Terms the source text is expected to use that can't be simplified away
   * (a qualification name, a named framework) — each gets an inline
   * definition instead of being silently reworded, per "Using plain
   * English": "If you need to use difficult words, include a 'dictionary'
   * or 'list of useful words' to explain them."
   */
  glossary?: EasyReadGlossaryEntry[];
  /** e.g. "This is for a 16-18 year old college student." Mencap: "Remember that you are writing for adults" — the rewrite must stay age-appropriate, not childish. */
  audienceNote?: string;
}

/**
 * Builds the system prompt an LLM-backed rewrite endpoint should use to turn
 * arbitrary source text (a report section, a career detail blurb, a chat
 * reply) into Easy Read, following Mencap's guidelines. Returns a prompt
 * string only — this function makes no network call itself (see the
 * HEADLESS note above).
 */
export function buildEasyReadPrompt(sourceText: string, options: EasyReadPromptOptions = {}): string {
  const { glossary = [], audienceNote } = options;

  const glossaryBlock = glossary.length
    ? `\n\nThese words cannot be simplified away. Keep them, but define each one the first time it appears, in brackets, in plain English:\n${glossary
        .map((g) => `- "${g.term}": ${g.definition}`)
        .join('\n')}`
    : '';

  const audienceBlock = audienceNote ? `\n\nAudience: ${audienceNote}` : '';

  return `You are rewriting text into Easy Read, following Mencap's published guidelines ("Am I making myself clear? Mencap's guidelines for accessible writing"). Apply these rules exactly:

1. Plain English is the minimum standard. Cut unnecessary detail. Present the important information in a logical sequence, one step at a time.
2. Write as you would speak. Do not use jargon, unnecessary technical detail, or abbreviations — spell things out (e.g. "for example", not "e.g."; "do not", not "don't").
3. Keep sentences short: one main idea per sentence, roughly 10-16 words. If a sentence uses a comma or "and" to join two ideas, split it into two sentences.
4. Use simple punctuation only: full stops between ideas. Avoid semicolons, colons, and hyphens used as punctuation. Avoid sentences broken up with several commas.
5. Use active, personal language. Talk directly to the reader using "you" and "we" rather than passive constructions.
6. Be consistent: once you pick a word for something, keep using that exact word for it throughout, even if it feels repetitive. Do not swap in a synonym for variety.
7. Always use the digit, not the word, for numbers — even small ones ("3", not "three"). Avoid percentages and large exact numbers; prefer "a few" or "many" over a precise figure when the exact number is not essential.
8. Write for an adult reader. The result must not read as childish or patronising — a mainstream reader should also find it clear, not simplistic.
9. Any word that cannot be avoided and might be unfamiliar should be explained inline in plain English the first time it is used.
10. Each sentence should express one complete, self-contained idea, because each will later be paired one-to-one with a single symbol or image (Mencap: "Some people like to use an image for each main idea or paragraph") — do not write a sentence that depends on the sentence before it to make sense on its own.

Output only the rewritten text: one idea per line, no headings, no markdown, no commentary.${glossaryBlock}${audienceBlock}

Text to rewrite:
"""
${sourceText}
"""`;
}

// ── COMPLIANCE CHECK ────────────────────────────────────────────────────

export type EasyReadRule =
  | 'sentence-too-long'
  | 'multiple-ideas'
  | 'complex-punctuation'
  | 'possible-passive-voice'
  | 'number-as-word'
  | 'precise-large-number'
  | 'possible-jargon';

export interface EasyReadIssue {
  rule: EasyReadRule;
  /** Human-readable explanation, referencing the Mencap section the rule comes from. */
  detail: string;
  /** The offending sentence or token. */
  excerpt: string;
}

const NUMBER_WORDS = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty',
  'seventy', 'eighty', 'ninety', 'hundred', 'thousand',
];

// Common passive-voice shape: a form of "to be" followed by a past
// participle ("was created", "is required", "were given"). A heuristic, not
// a grammar parser — flags candidates for a human/LLM pass to confirm, per
// "Use active and personal language".
const PASSIVE_RE = /\b(is|are|was|were|been|being|be)\s+\w+ed\b/i;

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
  const knownTerms = new Set(glossary.map((g) => g.term.toLowerCase()));

  for (const sentence of splitSentences(text)) {
    const wordCount = countWords(sentence);

    if (wordCount > 18) {
      issues.push({
        rule: 'sentence-too-long',
        detail: `Sentence is ${wordCount} words. Mencap's guideline is roughly 10-16 words, one idea per sentence ("Keep sentences short").`,
        excerpt: sentence,
      });
    }

    const commaCount = (sentence.match(/,/g) ?? []).length;
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
      });
    }

    for (const word of NUMBER_WORDS) {
      const re = new RegExp(`\\b${word}\\b`, 'i');
      if (re.test(sentence)) {
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
 * buildEasyReadPrompt's output contract) into discrete units suited to
 * one-symbol-per-unit pairing, matching Mencap's "Link together words and
 * pictures" guidance: place one image alongside each main idea, not one
 * image per word ("Don't use too many symbols").
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
