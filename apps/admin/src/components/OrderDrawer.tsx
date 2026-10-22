import React, { useState, useEffect } from 'react';
import { OrderStatus } from '@fastfood/shared-types';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import { formatMoneyCompact } from '@fastfood/utils';
import { useAdminStore } from '@/store/admin.store';
import { ReasonDialog } from '@/components/ui/ReasonDialog';

interface OrderDrawerProps {
  order: any | null;
  onClose: () => void;
  onTransition: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({ order, onClose, onTransition }) => {
  const { user } = useAdminStore();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [reasonAction, setReasonAction] = useState<'reject' | 'cancel' | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const handleAction = async (status: OrderStatus, note?: string) => {
    setLoading(true);
    try {
      await onTransition(order._id, status, note);
      setReasonAction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReason = async (reason: string) => {
    if (reasonAction === 'reject') {
      await handleAction(OrderStatus.REJECTED, reason);
    } else if (reasonAction === 'cancel') {
      await handleAction(OrderStatus.CANCELLED, reason);
    }
  };

  const items = order.items ?? [];
  const subtotalPaisa =
    order.subtotalPaisa ??
    items.reduce((s: number, it: any) => s + (it.lineTotalPaisa ?? it.totalPaisa ?? it.unitPricePaisa * it.quantity), 0);
  const deliveryFeePaisa = order.deliveryFeePaisa ?? (order.totalPaisa ? Math.max(0, order.totalPaisa - subtotalPaisa) : 0);
  const totalPaisa = order.totalPaisa ?? subtotalPaisa + deliveryFeePaisa;

  const addressText =
    order.address?.street ||
    order.address?.formatted ||
    order.address?.address ||
    (typeof order.address === 'string' ? order.address : 'Standard Delivery');

  return (
    <>
      {/* Scrim Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg-overlay)',
          zIndex: 'var(--z-scrim)',
          animation: 'fadeIn var(--dur-fast) ease',
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 100%)',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-3)',
          zIndex: 'var(--z-overlay)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn var(--dur-base) var(--ease-enter)',
        }}
      >
        {/* 1. Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-5) var(--space-6)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 id="order-drawer-title" style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                #{order.orderNumber}
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0 0' }}>
              Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="btn btn-ghost"
            style={{ width: 36, height: 36, padding: 0 }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* 2. Scrollable Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Customer Section */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Customer Details</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                  {order.customerName || 'Walk-in Customer'}
                </div>
                {order.customerPhone && (
                  <a
                    href={`tel:${order.customerPhone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: 'var(--link)',
                      textDecoration: 'none',
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    <Icon name="phone" size={14} />
                    <span>{order.customerPhone}</span>
                  </a>
                )}
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--bg-sunken)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                }}
              >
                COD
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="card-title" style={{ marginBottom: 8 }}>Delivery Location</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="pin" size={18} style={{ color: 'var(--action-bg)', marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                  {addressText}
                </div>
                {order.address?.landmark && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Landmark: {order.address.landmark}
                  </div>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: 'var(--link)',
                    marginTop: 8,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>Open in Google Maps</span>
                  <Icon name="arrow-up-right" size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div className="card-title" style={{ marginBottom: 12 }}>
              Ordered Items ({items.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((it: any, idx: number) => {
                const lineTotal = it.lineTotalPaisa ?? (it.unitPricePaisa * it.quantity);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                      paddingBottom: idx < items.length - 1 ? 10 : 0,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: 'var(--action-bg)',
                            fontSize: 13,
                            minWidth: 20,
                          }}
                        >
                          {it.quantity}×
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                          {it.nameSnapshot || it.name}
                        </span>
                      </div>
                      {it.sizeLabel && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 28 }}>
                          Size: {it.sizeLabel}
                        </div>
                      )}
                      {it.addOns && it.addOns.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginLeft: 28, marginTop: 2 }}>
                          + {it.addOns.map((a: any) => a.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: 'var(--text)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatMoneyCompact(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>{formatMoneyCompact(subtotalPaisa)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>Delivery Fee</span>
                <span>{deliveryFeePaisa === 0 ? 'FREE' : formatMoneyCompact(deliveryFeePaisa)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--action-bg)' }}>{formatMoneyCompact(totalPaisa)}</span>
              </div>
            </div>
          </div>

          {/* Timeline / History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Status Timeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.statusHistory.map((h: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--action-bg)', marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {String(h.status).replace(/_/g, ' ')}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {new Date(h.timestamp || h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {h.note && ` — "${h.note}"`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Sticky Action Bar */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* PLACED state actions */}
          {order.status === OrderStatus.PLACED && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction(OrderStatus.ACCEPTED)}
                className="btn btn-primary btn-lg"
                style={{ flex: 1, fontWeight: 700 }}
              >
                Accept Order
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setReasonAction('reject')}
                className="btn btn-danger btn-lg"
                style={{ padding: '0 20px', fontWeight: 700 }}
              >
                Reject…
              </button>
            </div>
          )}

          {/* ACCEPTED state action */}
          {order.status === OrderStatus.ACCEPTED && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction(OrderStatus.PREPARING)}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontWeight: 700 }}
            >
              Start Cooking (Preparing)
            </button>
          )}

          {/* PREPARING state action */}
          {order.status === OrderStatus.PREPARING && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction(OrderStatus.READY)}
              className="btn btn-success btn-lg"
              style={{ width: '100%', fontWeight: 700 }}
            >
              Mark Ready for Pickup
            </button>
          )}

          {/* READY state display */}
          {order.status === OrderStatus.READY && (
            <div
              data-tone="teal"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--b-bg)',
                color: 'var(--b-fg)',
                fontWeight: 600,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Finding rider · Waiting for fleet claim…
            </div>
          )}

          {/* Admin-only Cancel option for orders already accepted/cooking */}
          {isAdmin && ['ACCEPTED', 'PREPARING'].includes(order.status) && (
            <button
              type="button"
              disabled={loading}
              onClick={() => setReasonAction('cancel')}
              className="btn btn-ghost"
              style={{ width: '100%', color: 'var(--danger)', fontSize: 13 }}
            >
              Cancel Order (Admin only)…
            </button>
          )}
        </div>
      </aside>

      {/* Standardized Reason Dialog for Reject / Cancel */}
      <ReasonDialog
        isOpen={reasonAction !== null}
        onClose={() => setReasonAction(null)}
        onConfirm={handleConfirmReason}
        orderNumber={order.orderNumber}
        actionType={reasonAction || 'reject'}
        loading={loading}
      />
    </>
  );
};
