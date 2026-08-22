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

## AdminTreeDashboard

The shared shell behind Admin (School), Admin (Advisor), and the Superuser
rollup. Headless in the sense that matters here: **no auth and no data
fetching**. It takes tree data and action callbacks as props, so School can
wire it to its service-role `admin-auth` Edge Function and Advisor can wire it
to PostgREST under RLS without either product's auth model leaking into the
other.

```tsx
import AdminTreeDashboard from 'pekanga-shared/AdminTreeDashboard';
import type { TreeNode } from 'pekanga-shared/AdminTreeDashboard';

<AdminTreeDashboard
  title="Admin — School"
  data={nodes}
  summaryCards={[{ label: 'Schools', value: 12, sub: '9 active this month' }]}
  headerAction={<button onClick={openAddSchool}>+ Add school</button>}
  emptyState="No schools added yet."
/>
```

Search is filtered locally on node labels and meta text. Pass `onSearch` only
when the consumer owns filtering (server-side search) — when it's present the
component renders `data` exactly as given and does not filter again.

### Shipped as source, not a build

This package has no build step. `AdminTreeDashboard.tsx` is raw TypeScript JSX,
so every consumer must list the package in `next.config`'s `transpilePackages`:

```js
const nextConfig = { transpilePackages: ['pekanga-shared'] };
```

React is a peer dependency so School (React 19 / Next 16) and Advisor
(React 18 / Next 15) can each supply their own. Nothing in the component uses
a version-specific React API — keep it that way.
