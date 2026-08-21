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
  textMuted: '#6B7E94',

  red: '#C0392B',
  redLight: '#FDECEA',
  amber: '#C9A96E',
  amberLight: '#FBF5E8',
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
  displaces: { text: tokens.sandGold, bg: tokens.goldLight },
  replaces: { text: tokens.red, bg: tokens.redLight },
  creates: { text: tokens.navyDeep, bg: tokens.sandWhite },
};
