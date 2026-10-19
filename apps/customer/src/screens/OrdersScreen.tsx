import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatMoneyCompact, timeAgo } from '@fastfood/utils';
import { OrderStatus } from '@fastfood/shared-types';
import BottomNav from '@/components/BottomNav';
import styles from './OrdersScreen.module.css';

const STATUS_LABEL: Record<string, string> = {
  PLACED: 'Order Placed', ACCEPTED: 'Accepted', PREPARING: 'Preparing',
  READY: 'Ready', RIDER_ASSIGNED: 'Rider Assigned', PICKED_UP: 'On the way',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REJECTED: 'Rejected',
  DELIVERY_FAILED: 'Delivery Failed',
};

const ACTIVE_STATUSES = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'RIDER_ASSIGNED', 'PICKED_UP'];

export default function OrdersScreen() {
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data),
    refetchInterval: 10_000, // Poll every 10s for active orders
  });

  const activeOrders = (orders as any[]).filter(o => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = (orders as any[]).filter(o => !ACTIVE_STATUSES.includes(o.status));

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1>My Orders</h1></div>

      {isLoading
        ? <div className={styles.list}>{[1,2,3].map(i => <div key={i} className={`skeleton ${styles.skeleton}`} />)}</div>
        : (orders as any[]).length === 0
          ? (
            <div className={styles.empty}>
              <span>📦</span>
              <p>No orders yet</p>
              <button className="btn-primary" style={{ maxWidth: 180 }} onClick={() => navigate('/menu')}>
                Order Now
              </button>
            </div>
          )
          : (
            <div className={styles.list}>
              {activeOrders.length > 0 && (
                <p className={styles.groupLabel}>🔴 Active Orders</p>
              )}
              {activeOrders.map((o: any) => (
                <OrderCard key={o._id} order={o} navigate={navigate} />
              ))}

              {pastOrders.length > 0 && (
                <p className={styles.groupLabel}>Past Orders</p>
              )}
              {pastOrders.map((o: any) => (
                <OrderCard key={o._id} order={o} navigate={navigate} />
              ))}
            </div>
          )
      }

      <BottomNav active="orders" />
    </div>
  );
}

function OrderCard({ order, navigate }: { order: any; navigate: (p: string) => void }) {
  const isActive = ACTIVE_STATUSES.includes(order.status);
  return (
    <div
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
      onClick={() => navigate(`/orders/${order._id}`)}
    >
      <div className={styles.cardTop}>
        <div>
          <p className={styles.orderNum}>#{order.orderNumber}</p>
          <p className={styles.orderTime}>{timeAgo(order.createdAt)}</p>
        </div>
        <span className={`status-badge status-${order.status.toLowerCase().replace('_', '-')}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <div className={styles.cardBottom}>
        <span className={styles.itemCount}>{order.items?.length ?? '?'} item(s)</span>
        <span className={styles.total}>{formatMoneyCompact(order.totalPaisa)}</span>
      </div>
      {isActive && (
        <button
          className={styles.trackBtn}
          onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order._id}/track`); }}
        >
          🗺️ Track Order
        </button>
      )}
    </div>
  );
}
