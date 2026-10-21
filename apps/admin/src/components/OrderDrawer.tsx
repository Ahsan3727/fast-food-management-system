import React, { useState } from 'react';
import { OrderStatus } from '@fastfood/shared-types';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import { formatMoneyCompact } from '@fastfood/utils';

interface OrderDrawerProps {
  order: any | null;
  onClose: () => void;
  onTransition: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({ order, onClose, onTransition }) => {
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Kitchen too busy');

  if (!order) return null;

  const handleAction = async (status: OrderStatus, note?: string) => {
    setLoading(true);
    try {
      await onTransition(order._id, status, note);
      if (status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED) {
        setShowCancelModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const deliveryFee = order.totalPaisa >= 100000 ? 0 : 10000;
  const subtotalPaisa = order.items?.reduce((sum: number, it: any) => sum + (it.lineTotalPaisa ?? it.totalPaisa ?? it.unitPricePaisa * it.quantity), 0) ?? order.totalPaisa;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg-overlay, rgba(0,0,0,0.6))',
          zIndex: 40,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 100%)',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-3)',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.24s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>#{order.orderNumber}</h2>
              <StatusBadge status={order.status} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-sunken)',
              color: 'var(--text-muted)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer info card */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-sunken)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--chip-bg)',
                  color: 'var(--chip-fg)',
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {order.customerName?.[0] || 'C'}
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 15 }}>{order.customerName || 'Customer'}</b>
                {order.customerPhone && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    <a href={`tel:${order.customerPhone}`} style={{ color: 'var(--link)', textDecoration: 'none' }}>
                      {order.customerPhone}
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12 }}>
              <Icon name="pin" size={16} style={{ marginTop: 2, color: 'var(--action-bg)' }} />
              <div>
                <b style={{ color: 'var(--text)' }}>Delivery Address:</b>
                <p>{order.deliveryAddress?.addressLine || 'Address not specified'}</p>
                {order.deliveryAddress?.landmark && (
                  <p style={{ color: 'var(--text-subtle)', fontStyle: 'italic', marginTop: 2 }}>
                    Landmark: {order.deliveryAddress.landmark}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items breakdown */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
              Order Items ({order.items?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {order.items?.map((it: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--bg-sunken)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <b style={{ fontSize: 14 }}>
                      {it.quantity}× {it.nameSnapshot || it.name || 'Menu Item'}
                    </b>
                    {it.sizeLabel && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                        Size: {it.sizeLabel}
                      </span>
                    )}
                    {it.addOns?.length > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-subtle)', display: 'block' }}>
                        + {it.addOns.join(', ')}
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {formatMoneyCompact(it.lineTotalPaisa ?? it.totalPaisa ?? it.unitPricePaisa * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & pricing summary */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span>{formatMoneyCompact(subtotalPaisa)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Delivery Fee</span>
              <span>{deliveryFee > 0 ? formatMoneyCompact(deliveryFee) : 'Free'}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 10,
                marginTop: 4,
                borderTop: '1px solid var(--border)',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              <span>Total COD</span>
              <span style={{ color: 'var(--action-bg)' }}>{formatMoneyCompact(order.totalPaisa)}</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {order.status === OrderStatus.PLACED && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                disabled={loading}
                onClick={() => handleAction(OrderStatus.ACCEPTED)}
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--action-bg)',
                  color: 'var(--action-fg)',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Accept Order
              </button>
              <button
                disabled={loading}
                onClick={() => handleAction(OrderStatus.REJECTED, 'Kitchen unable to fulfill')}
                style={{
                  minHeight: 46,
                  padding: '0 16px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reject
              </button>
            </div>
          )}

          {order.status === OrderStatus.ACCEPTED && (
            <button
              disabled={loading}
              onClick={() => handleAction(OrderStatus.PREPARING)}
              style={{
                width: '100%',
                minHeight: 46,
                borderRadius: 'var(--r-md)',
                background: 'var(--action-bg)',
                color: 'var(--action-fg)',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Start Cooking (Preparing)
            </button>
          )}

          {order.status === OrderStatus.PREPARING && (
            <button
              disabled={loading}
              onClick={() => handleAction(OrderStatus.READY)}
              style={{
                width: '100%',
                minHeight: 46,
                borderRadius: 'var(--r-md)',
                background: 'var(--success)',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Mark Ready for Rider
            </button>
          )}

          {order.status === OrderStatus.READY && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                background: 'rgba(15, 118, 110, 0.1)',
                color: 'var(--tone-teal-fg, #0F766E)',
                fontWeight: 600,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Dispatched to online riders · Waiting for rider claim...
            </div>
          )}

          {['PLACED', 'ACCEPTED', 'PREPARING'].includes(order.status) && (
            <button
              disabled={loading}
              onClick={() => setShowCancelModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 0',
              }}
            >
              Cancel Order...
            </button>
          )}
        </div>
      </aside>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-overlay, rgba(0,0,0,0.6))',
          }}
        >
          <div
            style={{
              width: '90%',
              maxWidth: 420,
              background: 'var(--bg-surface)',
              borderRadius: 'var(--r-lg)',
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-3)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Cancel Order #{order.orderNumber}?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              The customer will be notified immediately. Please select a reason:
            </p>

            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-sunken)',
                color: 'var(--text)',
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              <option value="Kitchen too busy / Out of stock">Kitchen too busy / Out of stock</option>
              <option value="Customer requested cancellation">Customer requested cancellation</option>
              <option value="Delivery address out of service area">Delivery address out of service area</option>
              <option value="Other store reason">Other store reason</option>
            </select>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sunken)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Keep Order
              </button>
              <button
                disabled={loading}
                onClick={() => handleAction(OrderStatus.CANCELLED, cancelReason)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  background: 'var(--danger-solid)',
                  color: 'var(--on-danger)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {loading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
