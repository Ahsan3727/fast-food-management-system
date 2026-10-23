import type { CSSProperties } from 'react';

interface SkeletonProps {
  h: number | string;
  w?: number | string;
  r?: string;
  style?: CSSProperties;
}

/**
 * Skeleton shimmer block (WP5).
 * Uses the .skeleton class from globals.css for the shimmer effect.
 * All colour is token-driven (no raw hex here).
 */
export function Skeleton({ h, w, r = 'var(--r-sm)', style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{ height: h, width: w ?? '100%', borderRadius: r, ...style }}
    />
  );
}

/** Full-width text line skeleton */
export function SkeletonText({ w = '80%', size = 14 }: { w?: string; size?: number }) {
  return <Skeleton h={size} w={w} r="var(--r-xs)" />;
}

/** Standard menu card skeleton for the 2-column grid */
export function SkeletonCard() {
  return (
    <div
      style={{
        padding: 10,
        background: 'var(--bg-surface)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Skeleton h={120} r="var(--r-md)" />
      <SkeletonText w="75%" size={14} />
      <SkeletonText w="45%" size={12} />
    </div>
  );
}

/** Horizontal list-row skeleton (orders, search results) */
export function SkeletonRow() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Skeleton h={48} w={48} r="var(--r-md)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonText w="60%" size={14} />
        <SkeletonText w="40%" size={12} />
      </div>
      <SkeletonText w="48px" size={14} />
    </div>
  );
}
