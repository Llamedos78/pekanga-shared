// pekanga-shared/tokens.js
// Same values as tokens.css, exported as plain JS for inline style={{}} usage
// (both School and Advisor use a mix of CSS custom properties and inline
// styles — this covers the latter without needing var(--x) support).

export const tokens = {
  navy: '#1E3A5F',
  navyDeep: '#0F2440',

  blue: '#1A5B8F',
  blueMid: '#2272B3',
  blueLight: '#E8F3FB',

  // Coral — CTA/accent only. Never body text, background fills, or
  // decorative use elsewhere in the UI.
  coral: '#E8614D',
  coralMid: '#F0705A',
  coralLight: '#FEF1EF',
  coralDeep: '#C04535', // darker fill for CTA buttons carrying white text

  sandGold: '#C9A96E',
  goldLight: '#FBF5E8',
  sandWhite: '#FAF8F4',

  white: '#FFFFFF',
  border: '#D8E4EE',
  text: '#1A2B3C',
  textMuted: '#526676', // darkened 2026-08-30, see tokens.css for why

  red: '#C0392B',
  redLight: '#FDECEA',
  amber: '#C9A96E',
  amberLight: '#FBF5E8',

  // Distinct from `amber`/`amberLight` above -- those fail 4.5:1 against
  // each other (2.06:1) at the sizes risk-tier badge text is actually
  // rendered at. Matches pekanga-school's --risk-amber/--risk-amber-light.
  riskAmber: '#A03D00',
  riskAmberLight: '#FFF3E0',
};

// Five-tier AI-risk-tier colour mapping. Deliberately avoids green (brand
// rule: no green anywhere in the UI) and purple (not a brand colour — found
// hardcoded ad hoc in both School and Advisor's risk-tier badges). Built
// entirely from tokens already above, ordered lowest-risk to highest, with
// "creates" (AI-native/emerging roles) using the deepest navy shade rather
// than introducing a sixth colour outside the palette.
export const riskTierColors = {
  resistant: { text: tokens.navy, bg: tokens.blueLight },
  transforms: { text: tokens.blueMid, bg: tokens.blueLight },
  // Was tokens.sandGold on tokens.goldLight (2.06:1, fails WCAG AA) --
  // see riskAmber/riskAmberLight above.
  displaces: { text: tokens.riskAmber, bg: tokens.riskAmberLight },
  replaces: { text: tokens.red, bg: tokens.redLight },
  creates: { text: tokens.navyDeep, bg: tokens.sandWhite },
};
