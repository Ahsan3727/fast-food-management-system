import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { OrderStatus } from '@fastfood/shared-types';
import { formatMoneyCompact } from '@fastfood/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderDrawer } from '@/components/OrderDrawer';
import { Icon } from '@/components/Icon';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  // Orders Query
  const { data: rawOrders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders?limit=100').then(r => r.data?.orders ?? r.data ?? []),
    refetchInterval: 10_000,
  });

  // Riders Query
  const { data: riders = [] } = useQuery({
    queryKey: ['riders-all'],
    queryFn: () => api.get('/users?role=rider').then(r => r.data?.users ?? []),
    refetchInterval: 15_000,
  });

  // Status transition mutation
  const transitionMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      api.patch(`/orders/${id}/status`, { status, note }),
    onSuccess: (_, vars) => {
      toast.success(`Order status updated to ${vars.status}`);
      qc.invalidateQueries({ queryKey: ['orders'] });
      // Keep selected order updated in drawer if open
      if (selectedOrder?._id === vars.id) {
        setSelectedOrder((prev: any) => (prev ? { ...prev, status: vars.status } : null));
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    },
  });

  const orders: any[] = Array.isArray(rawOrders) ? rawOrders : [];
  const onlineRiders = (riders as any[]).filter(r => r.isOnline);

  // Compute Dashboard Metrics
  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
  const todayRevenue = todayOrders
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + (o.totalPaisa || 0), 0);
  const activeOrders = orders.filter(
    o => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.DELIVERY_FAILED].includes(o.status),
  );

  // Filter orders by search
  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(term) ||
      o.customerName?.toLowerCase().includes(term) ||
      o.customerPhone?.toLowerCase().includes(term)
    );
  });

  // Group into Kanban Columns
  const placedOrders = filteredOrders.filter(o => o.status === OrderStatus.PLACED);
  const kitchenOrders = filteredOrders.filter(o => [OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(o.status));
  const readyOrders = filteredOrders.filter(o => o.status === OrderStatus.READY);
  const transitOrders = filteredOrders.filter(o =>
    [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP].includes(o.status),
  );

  // Helper for order age in minutes
  const getOrderAgeMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const renderKanbanCard = (order: any, nextStatus?: OrderStatus, nextLabel?: string) => {
    const ageMins = getOrderAgeMinutes(order.createdAt);
    const ageColor = ageMins > 20 ? 'var(--danger)' : ageMins > 10 ? 'var(--warning)' : 'var(--text-muted)';

    return (
      <div
        key={order._id}
        onClick={() => setSelectedOrder(order)}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: 16,
          boxShadow: 'var(--shadow-1)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          transition: 'transform var(--dur-press), box-shadow var(--dur-fast)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ fontSize: 16, fontWeight: 800 }}>#{order.orderNumber}</b>
          <span style={{ fontSize: 12, fontWeight: 700, color: ageColor, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={13} />
            {ageMins}m ago
          </span>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
            {order.customerName || 'Customer'}
          </div>
          <div>
            {order.items?.length || 0} items · {formatMoneyCompact(order.totalPaisa)}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <StatusBadge status={order.status} />
          {nextStatus && nextLabel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                transitionMutation.mutate({ id: order._id, status: nextStatus });
              }}
              style={{
                minHeight: 32,
                padding: '0 12px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--action-bg)',
                color: 'var(--action-fg)',
                border: 'none',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Today's Revenue</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--action-bg)', margin: '4px 0' }}>
            {formatMoneyCompact(todayRevenue)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>From delivered COD orders</div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Active Orders</div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0' }}>{activeOrders.length}</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: activeOrders.length > 0 ? 'var(--warning)' : 'var(--success)',
            }}
          >
            {activeOrders.length > 0 ? `${activeOrders.length} in kitchen / dispatch` : 'All caught up'}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Today's Completed</div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0' }}>
            {todayOrders.filter(o => o.status === OrderStatus.DELIVERED).length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>of {todayOrders.length} total placed</div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Online Riders</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)', margin: '4px 0' }}>
            {onlineRiders.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>of {riders.length} registered riders</div>
        </div>
      </div>

      {/* Control bar: search + live pulse */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Live Order Board</h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--success)',
              background: 'var(--success-bg)',
              padding: '2px 10px',
              borderRadius: 'var(--r-pill)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', animation: 'pulse 2s infinite' }} />
            Realtime
          </span>
        </div>

        <div style={{ position: 'relative', minWidth: 260 }}>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, customer..."
            style={{
              width: '100%',
              minHeight: 40,
              padding: '0 14px 0 36px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-surface)',
              color: 'var(--text)',
              fontSize: 14,
            }}
          />
          <Icon name="search" size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-subtle)' }} />
        </div>
      </div>

      {/* 4-Column Live Kanban Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))',
          gap: 16,
          alignItems: 'start',
          overflowX: 'auto',
          paddingBottom: 16,
        }}
      >
        {/* Column 1: New Orders */}
        <div
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--r-lg)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 400,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              1. New Orders
            </b>
            <span
              style={{
                background: 'var(--chip-bg)',
                color: 'var(--chip-fg)',
                borderRadius: 'var(--r-pill)',
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {placedOrders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {placedOrders.length > 0 ? (
              placedOrders.map(o => renderKanbanCard(o, OrderStatus.ACCEPTED, 'Accept'))
            ) : (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                No new orders
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Kitchen (Accepted & Preparing) */}
        <div
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--r-lg)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 400,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              2. Kitchen
            </b>
            <span
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text)',
                borderRadius: 'var(--r-pill)',
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {kitchenOrders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kitchenOrders.length > 0 ? (
              kitchenOrders.map(o =>
                renderKanbanCard(
                  o,
                  o.status === OrderStatus.ACCEPTED ? OrderStatus.PREPARING : OrderStatus.READY,
                  o.status === OrderStatus.ACCEPTED ? 'Start Cooking' : 'Ready for Rider',
                ),
              )
            ) : (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                Kitchen idle
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Finding Rider */}
        <div
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--r-lg)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 400,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              3. Finding Rider
            </b>
            <span
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text)',
                borderRadius: 'var(--r-pill)',
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {readyOrders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {readyOrders.length > 0 ? (
              readyOrders.map(o => renderKanbanCard(o))
            ) : (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                No orders waiting for riders
              </div>
            )}
          </div>
        </div>

        {/* Column 4: On the Way */}
        <div
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--r-lg)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 400,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              4. In Delivery
            </b>
            <span
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text)',
                borderRadius: 'var(--r-pill)',
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {transitOrders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transitOrders.length > 0 ? (
              transitOrders.map(o => renderKanbanCard(o))
            ) : (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                No orders currently in transit
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Order Detail Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onTransition={async (orderId, status, note) => {
          await transitionMutation.mutateAsync({ id: orderId, status, note });
        }}
      />
    </div>
  );
}
