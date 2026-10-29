/**
 * OrderDetailScreen — full order view with status tracker, item list,
 * pricing breakdown, reorder, and a proper cancel modal (no prompt()).
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact, formatDateTime } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import styles from './OrderDetailScreen.module.css';

const STATUS_STEPS = [
  { key: 'PLACED',        label: 'Order Placed',   icon: '📋' },
  { key: 'ACCEPTED',      label: 'Accepted',        icon: '✅' },
  { key: 'PREPARING',     label: 'Preparing',       icon: '👨‍🍳' },
  { key: 'READY',         label: 'Ready',           icon: '🔔' },
  { key: 'RIDER_ASSIGNED',label: 'Rider Assigned',  icon: '🏍️' },
  { key: 'PICKED_UP',     label: 'Picked Up',       icon: '📦' },
  { key: 'DELIVERED',     label: 'Delivered',       icon: '🎉' },
];

const CANCEL_REASONS = [
  'Changed my mind',
  'Order taking too long',
  'Ordered by mistake',
  'Found a better deal elsewhere',
];

export default function OrderDetailScreen() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [showCancel,   setShowCancel  ] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelling,   setCancelling  ] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: 8_000,
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    );
  }
  if (!order) {
    return <div className={styles.loading}>Order not found</div>;
  }

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
  const isCancelled    = ['CANCELLED', 'REJECTED', 'DELIVERY_FAILED'].includes(order.status);
  const isActive       = !isCancelled && order.status !== 'DELIVERED';

  // Pricing: prefer API fields, fall back to summing item lines
  const itemsTotal: number =
    order.subtotalPaisa ??
    (order.items?.reduce((s: number, i: any) => s + (i.lineTotalPaisa || 0), 0) ?? 0);
  const deliveryFee: number =
    order.deliveryFeePaisa ?? (itemsTotal >= 100_000 ? 0 : 10_000);

  const { data: currentMenuItems } = useQuery<any[]>({
    queryKey: ['menu'],
    queryFn:  () => api.get('/menu').then(r => r.data),
    staleTime: 60_000,
  });

  // ── Reorder ──────────────────────────────────────────────────────────────
  const handleReorder = async () => {
    let itemsList = currentMenuItems;
    if (!itemsList || itemsList.length === 0) {
      try {
        const res = await api.get('/menu');
        itemsList = res.data;
      } catch {
        toast.error('Could not refresh menu items. Please try again.');
        return;
      }
    }

    const menuMap = new Map((itemsList || []).map((m: any) => [m._id, m]));
    let addedCount = 0;
    let skippedCount = 0;

    for (const item of (order.items || [])) {
      const current = menuMap.get(item.menuItemId);
      if (!current || !current.isAvailable) {
        skippedCount++;
        toast.error(`"${item.name}" is currently unavailable and was skipped`);
        continue;
      }

      // Re-calculate current unit price from active menu
      let unitPrice = current.basePrice;
      if (item.sizeLabel) {
        const matchingSize = current.sizes?.find((s: any) => s.label === item.sizeLabel);
        if (matchingSize) {
          unitPrice = matchingSize.price;
        }
      }
      for (const addOnLabel of (item.addOns || [])) {
        const matchingAddon = current.addOns?.find((a: any) => a.label === addOnLabel);
        if (matchingAddon) {
          unitPrice += matchingAddon.price;
        }
      }

      addItem({
        menuItemId:     current._id,
        name:           current.name,
        image:          current.image ?? undefined,
        sizeLabel:      item.sizeLabel ?? undefined,
        addOns:         item.addOns || [],
        unitPricePaisa: unitPrice,
        quantity:       item.quantity || 1,
      });
      addedCount++;
    }

    if (addedCount > 0) {
      toast.success(
        skippedCount > 0
          ? `${addedCount} items added to cart (${skippedCount} unavailable)`
          : 'Items added to cart!'
      );
      navigate('/cart');
    } else {
      toast.error('None of the items from this order are currently available');
    }
  };

  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled');
      setShowCancel(false);
      navigate('/orders');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={styles.page}>
      <ConnectionBanner />

      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.back}
          onClick={() => navigate('/orders')}
          aria-label="Back to orders"
        >
          ←
        </button>
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <p className={styles.time}>{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Status tracker */}
      {!isCancelled && (
        <div className={styles.tracker}>
          {STATUS_STEPS.map((step, idx) => {
            const done   = idx <= currentStepIdx;
            const active = idx === currentStepIdx;
            return (
              <div key={step.key} className={styles.step}>
                <div
                  className={[
                    styles.stepDot,
                    done   ? styles.stepDone   : '',
                    active ? styles.stepActive : '',
                  ].join(' ')}
                >
                  {done ? step.icon : ''}
                </div>
                <p className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>
                  {step.label}
                </p>
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={`${styles.stepLine} ${
                      done && idx < currentStepIdx ? styles.stepLineDone : ''
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {isCancelled && (
        <div className={styles.cancelledBanner}>
          ❌ Order {order.status.toLowerCase().replace(/_/g, ' ')}
          {order.cancellationReason && <p>{order.cancellationReason}</p>}
        </div>
      )}

      {/* Items */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Items</p>

        {order.items?.map((item: any, i: number) => (
          <div key={i} className={styles.itemRow}>
            <div className={styles.itemThumb}>
              {item.image ? (
                <img src={item.image} alt={item.name} className={styles.itemImg} />
              ) : (
                <span>{item.emoji || '🍔'}</span>
              )}
            </div>
            <div className={styles.itemInfo}>
              <p className={styles.itemName}>{item.name} × {item.quantity}</p>
              {item.sizeLabel && (
                <p className={styles.itemMeta}>{item.sizeLabel}</p>
              )}
              {item.addOns?.length > 0 && (
                <p className={styles.itemMeta}>+ {item.addOns.join(', ')}</p>
              )}
            </div>
            <span className={styles.itemPrice}>
              {formatMoneyCompact(item.lineTotalPaisa)}
            </span>
          </div>
        ))}

        {/* Pricing breakdown */}
        <div className={styles.feeRow}>
          <span className={styles.feeLabel}>Subtotal</span>
          <span className={styles.feeAmt}>{formatMoneyCompact(itemsTotal)}</span>
        </div>
        <div className={styles.feeRow}>
          <span className={styles.feeLabel}>Delivery fee</span>
          <span className={`${styles.feeAmt} ${deliveryFee === 0 ? styles.feeFree : ''}`}>
            {deliveryFee === 0 ? 'FREE' : formatMoneyCompact(deliveryFee)}
          </span>
        </div>
        <div className={styles.totalRow}>
          <span>Total</span>
          <span>{formatMoneyCompact(order.totalPaisa)}</span>
        </div>
      </div>

      {/* Delivery address */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Delivery Address</p>
        <p className={styles.address}>{order.deliveryAddress?.addressLine}</p>
        {order.deliveryAddress?.landmark && (
          <p className={styles.landmark}>📍 {order.deliveryAddress.landmark}</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {isActive && (
          <button
            className={styles.trackBtn}
            onClick={() => navigate(`/orders/${id}/track`)}
          >
            <Icon name="nav" size={18} /> Track Order
          </button>
        )}
        <button className={styles.reorderBtn} onClick={handleReorder}>
          🔁 Reorder
        </button>
        {order.status === 'PLACED' ? (
          <button
            className={styles.cancelBtn}
            onClick={() => setShowCancel(true)}
          >
            Cancel Order
          </button>
        ) : (
          isActive && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0' }}>
              Order is being prepared. To request cancellation, please contact the restaurant directly.
            </p>
          )
        )}
      </div>

      {/* ── Cancel modal ── */}
      {showCancel && (
        <>
          <div
            className={styles.scrim}
            onClick={() => setShowCancel(false)}
            aria-hidden="true"
          />
          <div className={styles.modal} role="dialog" aria-modal="true">
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>Cancel Order?</h3>
            <p className={styles.modalSub}>Select a reason</p>

            <div className={styles.reasonList}>
              {CANCEL_REASONS.map(r => (
                <button
                  key={r}
                  className={`${styles.reasonBtn} ${cancelReason === r ? styles.reasonActive : ''}`}
                  onClick={() => setCancelReason(r)}
                >
                  <span className={styles.reasonDot} />
                  {r}
                </button>
              ))}
            </div>

            <button
              className={styles.confirmBtn}
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
            </button>
            <button
              className={styles.keepBtn}
              onClick={() => setShowCancel(false)}
            >
              Keep my order
            </button>
          </div>
        </>
      )}
    </div>
  );
}
