export interface PekangaTokens {
  navy: string;
  navyDeep: string;
  blue: string;
  blueMid: string;
  blueLight: string;
  /** CTA/accent only — never body text, background fills, or decorative use. */
  coral: string;
  coralMid: string;
  coralLight: string;
  /** Darker coral fill for CTA buttons carrying white text. */
  coralDeep: string;
  sandGold: string;
  goldLight: string;
  sandWhite: string;
  white: string;
  border: string;
  text: string;
  textMuted: string;
  red: string;
  redLight: string;
  amber: string;
  amberLight: string;
  /** Distinct from amber/amberLight -- those fail 4.5:1 against each other. */
  riskAmber: string;
  riskAmberLight: string;
}

export const tokens: PekangaTokens;

export type RiskTier = 'resistant' | 'transforms' | 'displaces' | 'replaces' | 'creates';

export const riskTierColors: Record<RiskTier, { text: string; bg: string }>;
