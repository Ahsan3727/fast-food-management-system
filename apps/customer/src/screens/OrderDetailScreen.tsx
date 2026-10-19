import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatMoneyCompact, formatDateTime } from '@fastfood/utils';
import styles from './OrderDetailScreen.module.css';

const STATUS_STEPS = [
  { key: 'PLACED', label: 'Order Placed', icon: '📋' },
  { key: 'ACCEPTED', label: 'Accepted', icon: '✅' },
  { key: 'PREPARING', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'READY', label: 'Ready', icon: '🔔' },
  { key: 'RIDER_ASSIGNED', label: 'Rider Assigned', icon: '🏍️' },
  { key: 'PICKED_UP', label: 'Picked Up', icon: '📦' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' },
];

export default function OrderDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: 8_000,
  });

  if (isLoading) return <div className={styles.loading}><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div>;
  if (!order) return <div className={styles.loading}>Order not found</div>;

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
  const isCancelled = ['CANCELLED', 'REJECTED', 'DELIVERY_FAILED'].includes(order.status);
  const isActive = !isCancelled && order.status !== 'DELIVERED';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/orders')}>←</button>
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <p className={styles.time}>{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Status tracker */}
      {!isCancelled && (
        <div className={styles.tracker}>
          {STATUS_STEPS.map((step, idx) => {
            const done = idx <= currentStepIdx;
            const active = idx === currentStepIdx;
            return (
              <div key={step.key} className={styles.step}>
                <div className={`${styles.stepDot} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}>
                  {done ? step.icon : ''}
                </div>
                <p className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>{step.label}</p>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={`${styles.stepLine} ${done && idx < currentStepIdx ? styles.stepLineDone : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {isCancelled && (
        <div className={styles.cancelledBanner}>
          ❌ Order {order.status.toLowerCase().replace('_', ' ')}
          {order.cancellationReason && <p>{order.cancellationReason}</p>}
        </div>
      )}

      {/* Items */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Items</p>
        {order.items?.map((item: any, i: number) => (
          <div key={i} className={styles.itemRow}>
            <span className={styles.itemEmoji}>{item.image ? '🍽️' : '🍔'}</span>
            <div className={styles.itemInfo}>
              <p className={styles.itemName}>{item.name} × {item.quantity}</p>
              {item.sizeLabel && <p className={styles.itemMeta}>{item.sizeLabel}</p>}
            </div>
            <span className={styles.itemPrice}>{formatMoneyCompact(item.lineTotalPaisa)}</span>
          </div>
        ))}
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

      {/* Action buttons */}
      <div className={styles.actions}>
        {isActive && (
          <button className={styles.trackBtn} onClick={() => navigate(`/orders/${id}/track`)}>
            🗺️ Track Order
          </button>
        )}
        {order.status === 'PLACED' && (
          <button
            className={styles.cancelBtn}
            onClick={async () => {
              const reason = prompt('Reason for cancellation?');
              if (!reason) return;
              await api.post(`/orders/${id}/cancel`, { reason });
              navigate('/orders');
            }}
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}
