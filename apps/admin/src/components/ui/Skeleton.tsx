export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--r-sm)',
  className = '',
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-sunken)',
        border: '1px solid var(--border)',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="page" style={{ padding: 'var(--space-2)' }}>
      {/* Title & subtitle shimmer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <Skeleton width="220px" height="32px" borderRadius="var(--r-md)" />
        <Skeleton width="340px" height="18px" />
      </div>

      {/* KPI shimmer */}
      <div className="stat-grid">
        <Skeleton height="96px" borderRadius="var(--r-md)" />
        <Skeleton height="96px" borderRadius="var(--r-md)" />
        <Skeleton height="96px" borderRadius="var(--r-md)" />
        <Skeleton height="96px" borderRadius="var(--r-md)" />
      </div>

      {/* Main card shimmer */}
      <Skeleton height="380px" borderRadius="var(--r-lg)" />
    </div>
  );
}
