import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  updatedAt?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, updatedAt, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-2)',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--text)',
            margin: 0,
            letterSpacing: '-0.3px',
          }}
        >
          {title}
        </h1>
        {(subtitle || updatedAt) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 4,
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            {subtitle && <span>{subtitle}</span>}
            {subtitle && updatedAt && <span style={{ opacity: 0.5 }}>•</span>}
            {updatedAt && (
              <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                Updated {updatedAt}
              </span>
            )}
          </div>
        )}
      </div>

      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>}
    </div>
  );
}
