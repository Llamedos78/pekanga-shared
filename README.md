# pekanga-shared

Shared brand tokens for Pekanga products (School, Advisor, and later College).
Not published to the public npm registry — install directly from GitHub:

```bash
npm install github:Llamedos78/pekanga-shared
```

## Usage

CSS custom properties (import once, e.g. in `globals.css`):

```css
@import "pekanga-shared/tokens.css";
```

Then reference tokens as `var(--navy)`, `var(--coral)`, etc. — same names
already used in School's `globals.css`, so no renaming needed there.

Plain JS values, for inline `style={{}}` usage:

```ts
import { tokens, riskTierColors } from "pekanga-shared";

<div style={{ background: tokens.sandWhite, color: tokens.navy }} />
```

## Brand rules

- Coral (`--coral` / `--coral-mid` / `--coral-deep`) is CTA/accent only.
  Never body text, background fills, panels, pills, or decorative use.
- No green anywhere in the UI.
- No em-dashes in any copy.
- `riskTierColors` is the canonical five-tier AI-risk colour mapping —
  deliberately avoids green and purple, built entirely from the tokens above.
