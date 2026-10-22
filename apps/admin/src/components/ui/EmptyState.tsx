import { Icon, IconName } from '@/components/Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'package',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--r-lg)',
        border: '1px dashed var(--border)',
        margin: 'var(--space-4) 0',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--bg-sunken)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-3)',
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360, lineHeight: 1.4 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-primary"
          style={{ marginTop: 'var(--space-4)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
