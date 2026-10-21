import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { OrderStatus } from '@fastfood/shared-types';
import { formatMoneyCompact, formatDateTime } from '@fastfood/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderDrawer } from '@/components/OrderDrawer';
import { Icon } from '@/components/Icon';
import toast from 'react-hot-toast';

const STATUSES = ['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'RIDER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'REJECTED'];

export default function OrdersPage() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const qc = useQueryClient();

  const { data: rawOrders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders?limit=200').then(r => r.data?.orders ?? r.data ?? []),
    refetchInterval: 10_000,
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      api.patch(`/orders/${id}/status`, { status, note }),
    onSuccess: (_, vars) => {
      toast.success(`Order status updated to ${vars.status}`);
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (selectedOrder?._id === vars.id) {
        setSelectedOrder((prev: any) => (prev ? { ...prev, status: vars.status } : null));
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    },
  });

  const orders: any[] = Array.isArray(rawOrders) ? rawOrders : [];

  const filtered = orders
    .filter(o => filter === 'ALL' || o.status === filter)
    .filter(o => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.customerPhone?.toLowerCase().includes(term)
      );
    });

  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>All Orders</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Showing {sorted.length} of {orders.length} orders
          </p>
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, phone..."
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

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {STATUSES.map(s => {
          const isSelected = filter === s;
          const count = s === 'ALL' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                flex: 'none',
                minHeight: 34,
                padding: '0 14px',
                borderRadius: 'var(--r-pill)',
                border: isSelected ? '1px solid transparent' : '1px solid var(--border-strong)',
                background: isSelected ? 'var(--action-bg)' : 'var(--bg-surface)',
                color: isSelected ? 'var(--action-fg)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{s === 'ALL' ? 'All Orders' : s.replace(/_/g, ' ')}</span>
              <span style={{ opacity: 0.8, fontSize: 11 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Order #
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Customer
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Items
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Placed At
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    Loading orders…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    No orders found matching criteria.
                  </td>
                </tr>
              ) : (
                sorted.map((o: any) => (
                  <tr
                    key={o._id}
                    onClick={() => setSelectedOrder(o)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background var(--dur-fast)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunken)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 800 }}>
                      <span style={{ color: 'var(--action-bg)' }}>#{o.orderNumber}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{o.customerName || 'Customer'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{o.customerPhone || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>
                      <div>
                        {o.items?.slice(0, 2).map((it: any, idx: number) => (
                          <div key={idx}>
                            {it.quantity}× {it.nameSnapshot || it.name}
                          </div>
                        ))}
                        {o.items?.length > 2 && (
                          <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>
                            +{o.items.length - 2} more items
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, fontSize: 14 }}>
                      {formatMoneyCompact(o.totalPaisa)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedOrder(o);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Slide-Over Drawer */}
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
