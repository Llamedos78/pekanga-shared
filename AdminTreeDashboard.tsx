'use client';

// pekanga-shared/AdminTreeDashboard.tsx
//
// The one dashboard shell behind Admin (School), Admin (Advisor), and the
// Superuser rollup. All three are the same shape: a title, some summary
// numbers, a search box, and a tree of nodes that each carry a few stats and
// a few things you can click.
//
// HEADLESS, in the Phase 3 sense: no auth, no data fetching, no knowledge of
// either product's backend. It takes tree data and action callbacks as props.
// School wires it to its service-role admin-auth Edge Function; Advisor wires
// it to PostgREST under RLS. Neither product's auth model leaks into the
// other through this file -- if you ever find yourself importing a Supabase
// client here, something has gone wrong.
//
// Shipped as raw .tsx. This package has no build step, so both consumers list
// it in next.config's transpilePackages and Next compiles it as first-party
// source. React is a peer dependency precisely so School (19) and Advisor (18)
// can each supply their own -- nothing here uses a version-specific API.

import React, { useMemo, useState } from 'react';
import { tokens } from './tokens.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TreeNodeAction {
  label: string;                      // 'View dashboard', 'Reassign', 'Remove'
  onClick: (node: TreeNode) => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

/** A secondary detail shown under a node's label: a code, a region, a badge. */
export interface TreeNodeMeta {
  label: string;
  /** 'code' renders monospace in a chip; 'badge' renders a coloured pill. */
  tone?: 'default' | 'code' | 'badge';
  /** Badge colours. Ignored unless tone === 'badge'. Defaults to blue-light. */
  color?: string;
  background?: string;
}

export interface TreeNode {
  id: string;
  label: string;
  type: string;                       // 'school' | 'advisor' | 'client' | 'org' — consumer-defined
  stats?: Record<string, number | string>;   // e.g. { Students: 42, 'Last active': '2026-08-20' }
  children?: TreeNode[];
  actions?: TreeNodeAction[];
  /** Extra detail line under the label (code, region, email, billing badge). */
  meta?: TreeNodeMeta[];
  /** Drives the status dot. Omit for no dot at all. */
  status?: 'active' | 'inactive';
  /** Tooltip on the status dot. */
  statusLabel?: string;
}

export interface AdminSummaryCard {
  label: string;
  value: string | number;
  sub?: string;
}

export interface AdminTreeDashboardProps {
  title: string;
  data: TreeNode[];

  /**
   * Provide this when the consumer owns filtering (server-side search, or a
   * filter that spans more than the visible labels). When provided, `data` is
   * rendered exactly as given and this is called on every keystroke. When
   * omitted, the component filters `data` itself on label and meta text.
   */
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  /** Noun for the result count next to the search box. Defaults to 'result'. */
  itemNoun?: string;
  /** Plural of itemNoun, when it isn't just itemNoun + 's'. */
  itemNounPlural?: string;

  summaryCards?: AdminSummaryCard[];
  loading?: boolean;
  emptyState?: React.ReactNode;

  /** Rendered to the right of the search box, e.g. an "+ Add school" button. */
  headerAction?: React.ReactNode;
  /** Rendered in a muted panel under the tree, e.g. a data-protection note. */
  footnote?: React.ReactNode;
  /** Depth to auto-expand to on first render. 0 = all collapsed. */
  defaultExpandedDepth?: number;
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

const FONT = "'Sora', sans-serif";
const SERIF = "'DM Serif Display', serif";

function actionStyle(variant: TreeNodeAction['variant']): React.CSSProperties {
  const base: React.CSSProperties = {
    border: 'none',
    borderRadius: 7,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: FONT,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };
  if (variant === 'primary') return { ...base, background: tokens.coral, color: tokens.white };
  if (variant === 'danger') {
    return { ...base, background: 'none', border: `1px solid ${tokens.redLight}`, color: tokens.red, fontWeight: 600 };
  }
  return { ...base, background: tokens.blueLight, color: tokens.blueMid };
}

const labelCapStyle: React.CSSProperties = {
  fontSize: 10,
  color: tokens.textMuted,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

// ---------------------------------------------------------------------------
// Local search
// ---------------------------------------------------------------------------

function nodeMatches(node: TreeNode, q: string): boolean {
  if (node.label.toLowerCase().includes(q)) return true;
  if (node.meta?.some((m) => m.label.toLowerCase().includes(q))) return true;
  return false;
}

/**
 * Keeps any node that matches, or that has a descendant which matches.
 *
 * A node that matches on its own keeps ALL of its children, not just the
 * matching ones — searching for a school by name should show you that school
 * and everyone under it, not that school with an empty list.
 */
function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    if (nodeMatches(node, q)) {
      out.push(node);
      continue;
    }
    const kids = node.children ? filterTree(node.children, q) : undefined;
    if (kids && kids.length > 0) {
      out.push({ ...node, children: kids });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// One row
// ---------------------------------------------------------------------------

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = !!node.children && node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const statEntries = Object.entries(node.stats ?? {});

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 22 }}>
      <div
        className="ptd-row"
        style={{
          background: tokens.white,
          border: `1px solid ${tokens.border}`,
          borderRadius: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 10,
        }}
      >
        {/* Expander, or a spacer so labels stay aligned across sibling rows */}
        {hasChildren ? (
          <button
            onClick={() => onToggle(node.id)}
            aria-expanded={isOpen}
            aria-label={isOpen ? `Collapse ${node.label}` : `Expand ${node.label}`}
            style={{
              width: 22,
              height: 22,
              flexShrink: 0,
              border: `1px solid ${tokens.border}`,
              borderRadius: 5,
              background: tokens.sandWhite,
              color: tokens.navy,
              cursor: 'pointer',
              fontSize: 11,
              lineHeight: 1,
              fontFamily: FONT,
            }}
          >
            {isOpen ? '−' : '+'}
          </button>
        ) : (
          <span style={{ width: 22, flexShrink: 0 }} />
        )}

        {node.status && (
          <span
            title={node.statusLabel ?? (node.status === 'active' ? 'Active' : 'No recent activity')}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              flexShrink: 0,
              // Brand rule: no green anywhere. Active reads as navy-on-white,
              // inactive as the plain border grey.
              background: node.status === 'active' ? tokens.navy : tokens.border,
            }}
          />
        )}

        <div className="ptd-name" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: tokens.navy, fontSize: 15, marginBottom: 3 }}>{node.label}</div>
          {node.meta && node.meta.length > 0 && (
            <div style={{ fontSize: 12, color: tokens.textMuted, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {node.meta.map((m, i) => {
                if (m.tone === 'code') {
                  return (
                    <code
                      key={i}
                      style={{ background: tokens.sandWhite, padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}
                    >
                      {m.label}
                    </code>
                  );
                }
                if (m.tone === 'badge') {
                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: m.color ?? tokens.blueMid,
                        background: m.background ?? tokens.blueLight,
                        padding: '1px 7px',
                        borderRadius: 20,
                      }}
                    >
                      {m.label}
                    </span>
                  );
                }
                return <span key={i}>{m.label}</span>;
              })}
            </div>
          )}
        </div>

        {statEntries.length > 0 && (
          <div className="ptd-stats" style={{ display: 'flex', gap: 24, flexShrink: 0, textAlign: 'center' }}>
            {statEntries.map(([k, v]) => (
              <div key={k}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    fontFamily: SERIF,
                    color: v === 0 ? tokens.border : tokens.navy,
                  }}
                >
                  {v}
                </div>
                <div style={labelCapStyle}>{k}</div>
              </div>
            ))}
          </div>
        )}

        {node.actions && node.actions.length > 0 && (
          <div className="ptd-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {node.actions.map((a) => (
              <button key={a.label} onClick={() => a.onClick(node)} style={actionStyle(a.variant)}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasChildren && isOpen && (
        <div
          style={{
            borderLeft: `1px solid ${tokens.border}`,
            marginLeft: 10,
            paddingLeft: 0,
            marginBottom: 10,
          }}
        >
          {node.children!.map((child) => (
            <TreeRow key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function AdminTreeDashboard({
  title,
  data,
  onSearch,
  searchPlaceholder = 'Search...',
  itemNoun = 'result',
  itemNounPlural,
  summaryCards,
  loading,
  emptyState,
  headerAction,
  footnote,
  defaultExpandedDepth = 1,
}: AdminTreeDashboardProps) {
  const [query, setQuery] = useState('');

  // Ids to auto-expand, recomputed whenever the tree identity changes. Held as
  // state (not derived) so a user's manual collapse survives re-render.
  const autoExpanded = useMemo(() => {
    const ids = new Set<string>();
    const walk = (nodes: TreeNode[], depth: number) => {
      if (depth >= defaultExpandedDepth) return;
      for (const n of nodes) {
        if (n.children?.length) {
          ids.add(n.id);
          walk(n.children, depth + 1);
        }
      }
    };
    walk(data, 0);
    return ids;
  }, [data, defaultExpandedDepth]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [manuallyExpanded, setManuallyExpanded] = useState<Set<string>>(new Set());

  const expanded = useMemo(() => {
    const s = new Set(autoExpanded);
    manuallyExpanded.forEach((id) => s.add(id));
    collapsed.forEach((id) => s.delete(id));
    return s;
  }, [autoExpanded, manuallyExpanded, collapsed]);

  function toggle(id: string) {
    if (expanded.has(id)) {
      setCollapsed((prev) => new Set(prev).add(id));
      setManuallyExpanded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setManuallyExpanded((prev) => new Set(prev).add(id));
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function handleSearch(value: string) {
    setQuery(value);
    // When the consumer owns filtering it also owns the query -- don't also
    // filter locally, or the two filters compound.
    if (onSearch) onSearch(value);
  }

  const visible = useMemo(() => {
    if (onSearch || !query.trim()) return data;
    return filterTree(data, query.trim().toLowerCase());
  }, [data, query, onSearch]);

  const visibleCount = visible.length;

  return (
    <div style={{ fontFamily: FONT }}>
      {/* TreeRow lays expander + status dot + name on one flex line, then
          fixed-width stats and actions groups (flexShrink: 0) on the same
          line. Below ~640px those fixed groups alone exceed the row's
          width, so the flexible name column (flex: 1, minWidth: 0) was
          collapsing to a literal 0px box and its text rendered on top of
          the stats/actions instead of wrapping. !important is required
          because the row/name/stats/actions divs set `flex`/`display`
          inline above -- inline styles beat a plain class selector at any
          specificity, media query or not, so overriding them from here
          needs !important regardless of breakpoint. */}
      <style>{`
        @media (max-width: 640px) {
          .ptd-row { flex-wrap: wrap; }
          .ptd-name { flex: 1 1 160px !important; min-width: 160px !important; }
          .ptd-stats { flex-basis: 100% !important; justify-content: flex-start !important; margin-top: 8px !important; }
          .ptd-actions { flex-basis: 100% !important; margin-top: 8px !important; }
        }
      `}</style>
      <h1 style={{ fontFamily: SERIF, fontSize: 26, color: tokens.navy, margin: '0 0 20px', fontWeight: 400 }}>{title}</h1>

      {summaryCards && summaryCards.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          {summaryCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: tokens.white,
                border: `1px solid ${tokens.border}`,
                borderRadius: 10,
                padding: '18px 22px',
                flex: '1 1 160px',
              }}
            >
              <div style={{ ...labelCapStyle, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', marginBottom: 8 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: tokens.navy, lineHeight: 1, fontFamily: SERIF }}>
                {card.value}
              </div>
              {card.sub && <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 6 }}>{card.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '9px 14px',
            border: `1.5px solid ${tokens.border}`,
            borderRadius: 6,
            fontFamily: FONT,
            fontSize: 13,
            color: tokens.navy,
            outline: 'none',
            background: tokens.white,
          }}
        />
        <span style={{ fontSize: 12, color: tokens.textMuted, whiteSpace: 'nowrap' }}>
          {visibleCount} {visibleCount === 1 ? itemNoun : itemNounPlural ?? `${itemNoun}s`}
        </span>
        {headerAction}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: tokens.textMuted }}>Loading...</div>
      ) : visible.length === 0 ? (
        <div
          style={{
            background: tokens.white,
            border: `1px solid ${tokens.border}`,
            borderRadius: 10,
            padding: '40px 20px',
            textAlign: 'center',
            color: tokens.textMuted,
            fontSize: 14,
          }}
        >
          {query.trim() && data.length > 0 ? 'Nothing matches your search.' : (emptyState ?? 'Nothing to show yet.')}
        </div>
      ) : (
        <div>
          {visible.map((node) => (
            <TreeRow key={node.id} node={node} depth={0} expanded={expanded} onToggle={toggle} />
          ))}
        </div>
      )}

      {footnote && (
        <div
          style={{
            marginTop: 32,
            padding: '14px 20px',
            background: tokens.white,
            border: `1px solid ${tokens.border}`,
            borderRadius: 8,
            fontSize: 11,
            color: tokens.textMuted,
            lineHeight: 1.7,
          }}
        >
          {footnote}
        </div>
      )}
    </div>
  );
}
