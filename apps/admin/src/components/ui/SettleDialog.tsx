import { useState } from 'react';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';

interface SettleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amountPaisa: number) => void;
  riderName: string;
  unsettledPaisa: number;
  loading?: boolean;
}

export function SettleDialog({
  isOpen,
  onClose,
  onConfirm,
  riderName,
  unsettledPaisa,
  loading = false,
}: SettleDialogProps) {
  const [amountRupees, setAmountRupees] = useState<string>(
    String(Math.round(unsettledPaisa / 100)),
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(amountRupees);
    if (isNaN(rupees) || rupees <= 0) return;
    onConfirm(Math.round(rupees * 100));
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
              background: 'var(--chip-bg)',
              color: 'var(--action-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="cash" size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Settle Cash Collection
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{riderName}</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-sunken)',
            padding: '12px 16px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unsettled Cash in Hand:</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--warning)', fontVariantNumeric: 'tabular-nums' }}>
            {formatMoneyCompact(unsettledPaisa)}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="input-group">
            <label className="label" htmlFor="settle-amount">
              Settlement Amount (PKR)
            </label>
            <input
              id="settle-amount"
              type="number"
              step="1"
              min="1"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="input"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1.2, fontWeight: 700 }}
            >
              {loading ? 'Processing…' : 'Confirm Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
