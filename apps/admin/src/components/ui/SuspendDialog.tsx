import { useState } from 'react';
import { Icon } from '@/components/Icon';

interface SuspendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  userName: string;
  isCurrentlySuspended: boolean;
  loading?: boolean;
}

export function SuspendDialog({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isCurrentlySuspended,
  loading = false,
}: SuspendDialogProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const actionText = isCurrentlySuspended ? 'Reactivate' : 'Suspend';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-overlay)',
        zIndex: 'var(--z-dialog)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          width: '100%',
          maxWidth: 400,
          boxShadow: 'var(--shadow-3)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--r-md)',
              background: isCurrentlySuspended ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: isCurrentlySuspended ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name={isCurrentlySuspended ? 'check' : 'ban'} size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              {actionText} User
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{userName}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="input-group">
            <label className="label" htmlFor="suspend-reason">
              Reason for {actionText}
            </label>
            <textarea
              id="suspend-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Provide context for why this account is being ${actionText.toLowerCase()}ed...`}
              className="input"
              style={{ resize: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className={`btn ${isCurrentlySuspended ? 'btn-primary' : 'btn-danger'}`}
              style={{ flex: 1.2, fontWeight: 700 }}
            >
              {loading ? 'Processing…' : `Confirm ${actionText}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
