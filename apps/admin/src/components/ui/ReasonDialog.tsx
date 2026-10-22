import { useState } from 'react';
import { Icon } from '@/components/Icon';

interface ReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderNumber?: string;
  actionType: 'reject' | 'cancel';
  loading?: boolean;
}

const COMMON_REASONS = [
  'Out of stock',
  'Kitchen too busy',
  'Customer request',
  'Delivery address out of range',
  'Closing for the day',
  'Other',
];

export function ReasonDialog({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  actionType,
  loading = false,
}: ReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen) return null;

  const title = actionType === 'reject' ? `Reject Order #${orderNumber || ''}` : `Cancel Order #${orderNumber || ''}`;
  const effectiveReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
  const canSubmit = Boolean(effectiveReason.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    onConfirm(effectiveReason);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-dialog-title"
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
          maxWidth: 440,
          boxShadow: 'var(--shadow-3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: 'var(--space-5)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--r-md)',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="ban" size={20} />
            </div>
            <h2 id="reason-dialog-title" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Please select a reason. This will be recorded on the order timeline and communicated to the customer.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COMMON_REASONS.map((r) => {
              const isSelected = selectedReason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedReason(r)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--action-bg)' : 'var(--border)',
                    background: isSelected ? 'var(--chip-bg)' : 'var(--bg-sunken)',
                    color: isSelected ? 'var(--chip-fg)' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast)',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>

          {selectedReason === 'Other' && (
            <div className="input-group">
              <label htmlFor="custom-reason" className="label">
                Specify Reason
              </label>
              <textarea
                id="custom-reason"
                className="input"
                rows={3}
                placeholder="State the reason for cancellation..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
                style={{ resize: 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{ flex: 1 }}
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ flex: 1.4, fontWeight: 700 }}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Processing…' : title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
