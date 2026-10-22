import { Icon } from '@/components/Icon';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected network error occurred while connecting to the server.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--danger-bg)',
        margin: 'var(--space-4) 0',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--danger-bg)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-3)',
        }}
      >
        <Icon name="alert" size={26} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 380, lineHeight: 1.4 }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-ghost"
          style={{ marginTop: 'var(--space-4)', gap: 6 }}
        >
          <Icon name="refresh" size={16} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
