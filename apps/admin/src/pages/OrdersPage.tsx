import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/api/queryKeys';
import { unwrapList } from '@/api/unwrap';
import { useOrderTransition } from '@/hooks/useOrderTransition';
import { OrderStatus } from '@fastfood/shared-types';
import { formatMoneyCompact, formatDateTime } from '@fastfood/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderDrawer } from '@/components/OrderDrawer';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/Icon';

const ALL_STATUSES: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'All Orders' },
  { key: OrderStatus.PLACED, label: 'Placed' },
  { key: OrderStatus.ACCEPTED, label: 'Accepted' },
  { key: OrderStatus.PREPARING, label: 'Preparing' },
  { key: OrderStatus.READY, label: 'Ready' },
  { key: OrderStatus.RIDER_ASSIGNED, label: 'Rider Assigned' },
  { key: OrderStatus.PICKED_UP, label: 'Picked Up' },
  { key: OrderStatus.DELIVERED, label: 'Delivered' },
  { key: OrderStatus.DELIVERY_FAILED, label: 'Delivery Failed' },
  { key: OrderStatus.CANCELLED, label: 'Cancelled' },
  { key: OrderStatus.REJECTED, label: 'Rejected' },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const transitionMutation = useOrderTransition();

  const {
    data: rawOrders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.orders.list({ view: 'audit' }),
    queryFn: async () => {
      const res = await api.get('/orders?limit=100');
      return unwrapList(res.data);
    },
    staleTime: 15_000,
  });

  const orders: any[] = useMemo(() => unwrapList(rawOrders), [rawOrders]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o._id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => filter === 'ALL' || o.status === filter)
      .filter((o) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
          o.orderNumber?.toLowerCase().includes(term) ||
          o.customerName?.toLowerCase().includes(term) ||
          o.customerPhone?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, filter, search]);

  const handleAction = async (orderId: string, status: OrderStatus, note?: string) => {
    await transitionMutation.mutateAsync({ orderId, status, note });
  };

  if (isError) {
    return (
      <div className="page">
        <PageHeader title="Order Directory" subtitle="Audit and inspect orders" />
        <ErrorState
          title="Failed to load orders"
          message="Could not retrieve order list. Please retry."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Order Directory"
        subtitle={`Showing ${filteredOrders.length} of ${orders.length} total orders (Latest 100)`}
        updatedAt="live"
        actions={
          <div style={{ position: 'relative', width: 260 }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, phone…"
              className="input"
              style={{ paddingLeft: 34, height: 38 }}
            />
            <Icon
              name="search"
              size={16}
              style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-subtle)' }}
            />
          </div>
        }
      />

      {/* Filter Chips Bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 6,
          scrollbarWidth: 'thin',
        }}
      >
        {ALL_STATUSES.map(({ key, label }) => {
          const isSelected = filter === key;
          const count =
            key === 'ALL' ? orders.length : orders.filter((o) => o.status === key).length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--r-pill)',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                borderColor: isSelected ? 'var(--action-bg)' : 'var(--border)',
                background: isSelected ? 'var(--chip-bg)' : 'var(--bg-surface)',
                color: isSelected ? 'var(--chip-fg)' : 'var(--text)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--dur-fast)',
              }}
            >
              <span>{label}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 'var(--r-pill)',
                  background: isSelected ? 'var(--action-bg)' : 'var(--bg-sunken)',
                  color: isSelected ? 'var(--action-fg)' : 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Data View */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="No orders found"
          description={search ? `No orders matched search "${search}".` : `No orders in status "${filter}".`}
          actionLabel={search || filter !== 'ALL' ? 'Clear Filters' : undefined}
          onAction={() => {
            setSearch('');
            setFilter('ALL');
          }}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="table-wrap desktop-orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrderId(order._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName || 'Walk-in'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.customerPhone || '—'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {order.items?.length || 0} items
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--action-bg)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoneyCompact(order.totalPaisa)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderId(order._id);
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="mobile-orders-cards" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrderId(order._id)}
                className="card"
                style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: 16, fontWeight: 800 }}>#{order.orderNumber}</b>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{order.customerName || 'Walk-in'}</span> • {order.items?.length || 0} items
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{formatDateTime(order.createdAt)}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--action-bg)' }}>{formatMoneyCompact(order.totalPaisa)}</span>
                </div>
              </div>
            ))}
          </div>

          <style>{`
            @media (max-width: 767px) {
              .desktop-orders-table {
                display: none !important;
              }
              .mobile-orders-cards {
                display: flex !important;
              }
            }
          `}</style>
        </>
      )}

      {/* Inspect Order Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onTransition={handleAction}
      />
    </div>
  );
}
