// Run: npx tsx tests/mode-tabs.test.mts
// ModeTabs: the shared mode tab strip. Checks the accessibility rules (nav label, one aria-current,
// bold plus underline on the active tab, 44px targets, DOM order, no tabindex, nothing that reloads
// the page), button mode (in-page state) and link mode (the app supplies its own link component).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement, isValidElement, type AnchorHTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ModeTabs, { type ModeTabDef } from '../ModeTabs.tsx';

type Id = 'explore' | 'subjects' | 'career' | 'pathways';

const TABS: ModeTabDef<Id>[] = [
  { id: 'explore', label: 'Explore Careers', href: '/dashboard/visual-explore' },
  { id: 'subjects', label: 'Choose my subjects', href: '/dashboard/subjects' },
  { id: 'career', label: 'I have a career in mind', href: '/dashboard/role-research' },
  { id: 'pathways', label: 'Career Pathways', href: '/dashboard/career-path' },
];

// Stand-in for next/link: an anchor that passes every prop through.
function FakeLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return createElement('a', { href, ...rest }, children);
}

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`pass  ${name}`);
  } catch (err) {
    console.log(`FAIL  ${name}`);
    throw err;
  }
}

const button = (activeId: Id = 'subjects', tabs = TABS) =>
  renderToStaticMarkup(createElement(ModeTabs<Id>, { tabs, activeId, ariaLabel: 'Visual mode', onSelect: () => {} }));
const link = (activeId: Id = 'subjects') =>
  renderToStaticMarkup(createElement(ModeTabs<Id>, { tabs: TABS, activeId, ariaLabel: 'Visual mode', linkAs: FakeLink }));

const source = readFileSync(new URL('../ModeTabs.tsx', import.meta.url), 'utf8');
// Each tab's opening tag, in document order.
const tabTags = (html: string) => html.match(/<(?:button|a)\b[^>]*>/g) ?? [];

check('the nav carries the aria-label it was given', () => {
  assert.match(button(), /^<nav aria-label="Visual mode"/);
  assert.match(link(), /^<nav aria-label="Visual mode"/);
});

check('exactly one aria-current="page", on the active tab', () => {
  for (const html of [button('career'), link('career')]) {
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
    const current = tabTags(html).find((t) => t.includes('aria-current="page"'))!;
    assert.match(html, new RegExp(`${current.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*(?:<span[^>]*>[^<]*</span>)?I have a career in mind`));
  }
});

check('no aria-current when the active id matches no tab', () => {
  const html = renderToStaticMarkup(createElement(ModeTabs<string>, { tabs: TABS, activeId: 'nope', ariaLabel: 'Visual mode', onSelect: () => {} }));
  assert.equal((html.match(/aria-current/g) ?? []).length, 0);
});

check('active tab is bold with a 3px underline; the others are not, and keep a transparent 3px border so nothing moves', () => {
  for (const html of [button('explore'), link('explore')]) {
    const tags = tabTags(html);
    assert.equal(tags.length, 4);
    assert.match(tags[0], /font-weight:700/);
    assert.match(tags[0], /border-bottom:3px solid var\(--coral\)/);
    for (const t of tags.slice(1)) {
      assert.match(t, /font-weight:500/);
      assert.match(t, /border-bottom:3px solid transparent/);
    }
  }
});

check('every tab is at least 44px high and 44px wide', () => {
  for (const html of [button(), link()]) {
    for (const t of tabTags(html)) {
      assert.match(t, /min-height:44px/);
      assert.match(t, /min-width:44px/);
    }
  }
});

check('DOM order equals the order of the tabs array', () => {
  for (const html of [button('pathways'), link('pathways')]) {
    const positions = TABS.map((t) => html.indexOf(t.label));
    assert.ok(positions.every((p) => p > -1));
    assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  }
});

check('no tabindex of any kind in the markup or the source', () => {
  assert.doesNotMatch(button(), /tabindex/i);
  assert.doesNotMatch(link(), /tabindex/i);
  assert.doesNotMatch(source, /tabindex/i);
});

check('source has nothing that reloads the page or triggers beforeunload', () => {
  for (const banned of [/window\b/, /document\.location/, /\blocation\./, /\.reload\(/, /beforeunload/, /\.assign\(/, /\.replace\(/, /\.open\(/]) {
    assert.doesNotMatch(source, banned, `source must not match ${banned}`);
  }
});

check('the tabs have no focus-ring suppression', () => {
  assert.doesNotMatch(source, /outline\s*:\s*['"]?(none|0)/i);
});

check('button mode: buttons with type="button", no anchors', () => {
  const html = button();
  assert.equal((html.match(/<button type="button"/g) ?? []).length, 4);
  assert.doesNotMatch(html, /<a\b/);
});

check('link mode: the supplied link component renders each tab with its href, no buttons', () => {
  const html = link();
  for (const t of TABS) assert.match(html, new RegExp(`<a href="${t.href}"`));
  assert.doesNotMatch(html, /<button/);
});

check('link mode: a tab with no href falls back to a button rather than a dead link', () => {
  const tabs = [TABS[0], { id: 'subjects' as Id, label: 'Choose my subjects' }];
  const html = renderToStaticMarkup(createElement(ModeTabs<Id>, { tabs, activeId: 'explore', ariaLabel: 'Visual mode', linkAs: FakeLink }));
  assert.equal((html.match(/<a href=/g) ?? []).length, 1);
  assert.equal((html.match(/<button type="button"/g) ?? []).length, 1);
});

check('icon slot is aria-hidden and the label text is still present', () => {
  const tabs = [{ ...TABS[0], icon: createElement('svg', { 'data-test': 'icon' }) }, TABS[1]];
  const html = renderToStaticMarkup(createElement(ModeTabs<Id>, { tabs, activeId: 'explore', ariaLabel: 'Visual mode', onSelect: () => {} }));
  assert.match(html, /<span aria-hidden="true"[^>]*><svg data-test="icon"/);
  assert.match(html, /Explore Careers/);
});

// Walk the element tree the component returns (it has no hooks, so it can be called directly) to find onClick handlers.
function clickHandlers(node: ReactNode, out: Array<(e: unknown) => void> = []): Array<(e: unknown) => void> {
  if (Array.isArray(node)) node.forEach((n) => clickHandlers(n, out));
  else if (isValidElement(node)) {
    const props = (node as ReactElement<{ onClick?: (e: unknown) => void; children?: ReactNode }>).props;
    if (typeof props.onClick === 'function') out.push(props.onClick);
    clickHandlers(props.children, out);
  }
  return out;
}

check('clicking a tab calls onSelect with its id, in button mode and in link mode', () => {
  for (const linkAs of [undefined, FakeLink]) {
    const calls: string[] = [];
    const tree = (ModeTabs as unknown as (p: object) => ReactNode)({
      tabs: TABS, activeId: 'explore', ariaLabel: 'Visual mode', linkAs, onSelect: (id: string) => calls.push(id),
    });
    const handlers = clickHandlers(tree);
    assert.equal(handlers.length, 4);
    handlers.forEach((h) => h({ preventDefault() {} }));
    assert.deepEqual(calls, ['explore', 'subjects', 'career', 'pathways']);
  }
});

check('link mode never cancels the navigation (no preventDefault)', () => {
  const tree = (ModeTabs as unknown as (p: object) => ReactNode)({
    tabs: TABS, activeId: 'explore', ariaLabel: 'Visual mode', linkAs: FakeLink, onSelect: () => {},
  });
  let prevented = 0;
  clickHandlers(tree).forEach((h) => h({ preventDefault() { prevented++; } }));
  assert.equal(prevented, 0);
});

check('onSelect is optional', () => {
  const tree = (ModeTabs as unknown as (p: object) => ReactNode)({ tabs: TABS, activeId: 'explore', ariaLabel: 'Visual mode', linkAs: FakeLink });
  assert.doesNotThrow(() => clickHandlers(tree).forEach((h) => h({ preventDefault() {} })));
});

check('package.json exports and files list ModeTabs, and ReportTabs is still listed', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.exports['./ModeTabs'], './ModeTabs.tsx');
  assert.ok(pkg.files.includes('ModeTabs.tsx'));
  assert.equal(pkg.exports['./ReportTabs'], './ReportTabs.tsx');
  assert.ok(pkg.files.includes('ReportTabs.tsx'));
});

console.log(`\n${passed} passed`);
