import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatMoneyCompact, timeAgo } from '@fastfood/utils';
import { STATUS_META, OrderStatus } from '@fastfood/shared-types';
import BottomNav from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/components/Icon';
import { SkeletonRow } from '@/components/Skeleton';
import { QK } from '@/api/queryKeys';
import { useAuthStore } from '@/store/auth.store';

export default function OrdersScreen() {
  const navigate = useNavigate();
  const [segment, setSegment] = useState<'active' | 'past'>('active');
  const { isAuthenticated } = useAuthStore();

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: QK.myOrders,
    queryFn: () => api.get('/orders/my').then(r => r.data),
    enabled: isAuthenticated,
    refetchInterval: 10_000,
  });

  const activeOrders = orders.filter(
    o => STATUS_META[o.status as OrderStatus]?.isActive
  );
  const pastOrders = orders.filter(
    o => !STATUS_META[o.status as OrderStatus]?.isActive
  );

  const displayedOrders = segment === 'active' ? activeOrders : pastOrders;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px', color: 'var(--text)' }}>
          My Orders
        </h1>

        {/* Segmented Control */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: 4,
            borderRadius: 12,
            background: 'var(--sunken)',
            marginBottom: 16,
            border: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => setSegment('active')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: segment === 'active' ? 'var(--surface)' : 'transparent',
              color: segment === 'active' ? 'var(--text)' : 'var(--muted)',
              fontWeight: segment === 'active' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: segment === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setSegment('past')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: segment === 'past' ? 'var(--surface)' : 'transparent',
              color: segment === 'past' ? 'var(--text)' : 'var(--muted)',
              fontWeight: segment === 'past' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: segment === 'past' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Past ({pastOrders.length})
          </button>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[1, 2, 3].map(n => <SkeletonRow key={n} />)}
          </div>
        ) : displayedOrders.length > 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {displayedOrders.map(order => {
              const isActive = STATUS_META[order.status as OrderStatus]?.isActive;
              return (
                <div
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderLeft: isActive ? '4px solid var(--action)' : '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 16,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                        #{order.orderNumber}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--subtle)', marginLeft: 8 }}>
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      margin: '0 0 10px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'No item details'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                      {formatMoneyCompact(order.totalPaisa)}
                    </span>

                    {isActive && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/orders/${order._id}/track`);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          background: 'var(--sunken)',
                          color: 'var(--action)',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        <Icon name="nav" size={14} />
                        Track
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--sunken)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--action)',
                marginBottom: 14,
              }}
            >
              <Icon name="receipt" size={32} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
              {segment === 'active' ? 'No active orders' : 'No past orders yet'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px', maxWidth: 240 }}>
              Hungry? Browse the menu and place your next order.
            </p>
            <button
              onClick={() => navigate('/menu')}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                background: 'var(--action)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Order Now
            </button>
          </div>
        )}
      </div>

      <BottomNav active="orders" />
    </div>
  );
}
