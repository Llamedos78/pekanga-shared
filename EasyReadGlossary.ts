// pekanga-shared/EasyReadGlossary.ts
//
// Seed glossary for checkEasyReadCompliance and for the Easy Read rewrite
// prompt's glossary option. Holds only the two genuine jargon hits from the
// Visual Explore false-positive audit (2026-09-08). AI, PDF, UK, ONS and ASHE
// are not here: they are on the default allowlist in EasyRead.ts instead.

import type { EasyReadGlossaryEntry } from './EasyRead';

export const EASY_READ_GLOSSARY_SEED: EasyReadGlossaryEntry[] = [
  {
    term: 'SEO',
    definition: 'SEO means making a website easier to find when people search for it online.',
  },
  {
    term: 'HESA',
    definition: 'HESA is the UK body that collects official numbers about universities and their students.',
  },
];
