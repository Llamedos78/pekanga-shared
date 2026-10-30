'use client';

// pekanga-shared/ModeTabs.tsx
//
// The strip of mode tabs at the top of Visual Explore (Explore Careers,
// Choose my subjects, I have a career in mind, Career Pathways, ...). One
// component so Advisor and School show the same strip.
//
// HEADLESS: no routing, no data fetching, no storage. The product decides
// what a tab does:
//   - School keeps its modes in page state: pass `onSelect`, no `linkAs`.
//     Each tab is a <button type="button">.
//   - Advisor has one page per mode: pass `linkAs` (next/link) and an `href`
//     on each tab. Each tab is that link component, so the move is a
//     client-side navigation. This file cannot import next/link itself, as
//     React is this package's only peer dependency.
// `onSelect` is called on every click in both modes, before any navigation,
// and never cancels it. Advisor uses it to turn Visual mode on.
//
// Accessibility rules, each covered by tests/mode-tabs.test.mts:
//   - the nav has an aria-label (required);
//   - the active tab has aria-current="page";
//   - the active tab is bold with a 3px underline, so colour is never the
//     only cue; inactive tabs keep a 3px transparent border so nothing moves;
//   - every tab is at least 44px by 44px;
//   - tabs render in array order, so DOM order equals visual order;
//   - no explicit focus order is set, so the browser's default order applies;
//   - the default focus ring is left alone.
// The optional `icon` is decoration only: it is aria-hidden and the label
// text always stays. Pair it with a symbol or picture, never instead of text.
//
// Narrow screens: the strip scrolls sideways and every label stays on one
// line, as in School's VisualHub.

import type { AnchorHTMLAttributes, ComponentType, CSSProperties, ReactNode } from 'react';

export interface ModeTabDef<Id extends string> {
  id: Id;
  label: string;
  /** Needed in link mode. A tab with no href renders as a button instead. */
  href?: string;
  /** Decoration only. Rendered aria-hidden, before the label. */
  icon?: ReactNode;
}

export type ModeTabsLinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>;

export interface ModeTabsProps<Id extends string> {
  tabs: ModeTabDef<Id>[];
  activeId: Id;
  /** Names the nav for screen readers, for example "Visual mode". */
  ariaLabel: string;
  onSelect?: (id: Id) => void;
  /** Link mode: the product's own link component, for example next/link. */
  linkAs?: ModeTabsLinkComponent;
}

const NAV_STYLE: CSSProperties = {
  display: 'flex',
  gap: 8,
  borderBottom: '1.5px solid var(--border)',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

function tabStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    minHeight: 44,
    minWidth: 44,
    padding: '12px 20px',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    border: 'none',
    borderBottom: active ? '3px solid var(--coral)' : '3px solid transparent',
    background: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    color: active ? 'var(--navy)' : 'var(--text-muted)',
    fontFamily: 'var(--font-body)',
  };
}

export default function ModeTabs<Id extends string>({ tabs, activeId, ariaLabel, onSelect, linkAs: LinkAs }: ModeTabsProps<Id>) {
  return (
    <nav aria-label={ariaLabel} style={NAV_STYLE}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const content = (
          <>
            {tab.icon ? <span aria-hidden="true" style={{ display: 'inline-flex', marginRight: 8 }}>{tab.icon}</span> : null}
            {tab.label}
          </>
        );
        const common = {
          style: tabStyle(active),
          'aria-current': active ? ('page' as const) : undefined,
          onClick: () => onSelect?.(tab.id),
        };
        if (LinkAs && tab.href) {
          return <LinkAs key={tab.id} href={tab.href} {...common}>{content}</LinkAs>;
        }
        return <button key={tab.id} type="button" {...common}>{content}</button>;
      })}
    </nav>
  );
}
