import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatMoneyCompact, formatDateTime } from '@fastfood/utils';
import toast from 'react-hot-toast';

const STATUSES = ['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'RIDER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'REJECTED'];

const TRANSITIONS: Record<string, string[]> = {
  PLACED:    ['ACCEPTED', 'REJECTED'],
  ACCEPTED:  ['PREPARING'],
  PREPARING: ['READY'],
  READY:     ['RIDER_ASSIGNED'],
};

export default function OrdersPage() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders?limit=200').then(r => r.data?.orders ?? r.data ?? []),
    refetchInterval: 10_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  const orders = (data as any[])
    .filter(o => filter === 'ALL' || o.status === filter)
    .filter(o => !search || o.orderNumber?.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Orders</h1>
        <input className="input" style={{ width: 220 }} placeholder="Search by order #…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === s ? 'var(--primary)' : 'var(--surface)', color: filter === s ? 'white' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            {s === 'ALL' ? `All (${(data as any[]).length})` : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Placed</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
                : sorted.length === 0
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No orders found</td></tr>
                  : sorted.map((o: any) => (
                    <tr key={o._id}>
                      <td><span className="font-bold text-primary">#{o.orderNumber}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{o.customerId?.name ?? o.customerName ?? '—'}</td>
                      <td style={{ fontSize: 13 }}>
                        {o.items?.slice(0, 2).map((it: any, i: number) => (
                          <div key={i}>{it.name} ×{it.quantity}</div>
                        ))}
                        {o.items?.length > 2 && <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>+{o.items.length - 2} more</div>}
                      </td>
                      <td className="font-bold">{formatMoneyCompact(o.totalPaisa)}</td>
                      <td style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{o.payment?.method ?? 'COD'}</td>
                      <td><span className={`badge badge-${o.status.toLowerCase().replace(/_/g, '-')}`}>{o.status.replace(/_/g, ' ')}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(o.createdAt)}</td>
                      <td>
                        <div className="flex-gap">
                          {(TRANSITIONS[o.status] ?? []).map(next => (
                            <button key={next} className={`btn btn-sm ${next === 'REJECTED' || next === 'CANCELLED' ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => updateStatus.mutate({ id: o._id, status: next })}
                              disabled={updateStatus.isPending}>
                              {next === 'ACCEPTED' ? '✅ Accept' :
                               next === 'REJECTED' ? '❌ Reject' :
                               next === 'PREPARING' ? '👨‍🍳 Prepare' :
                               next === 'READY' ? '📦 Ready' :
                               next === 'RIDER_ASSIGNED' ? '🏍️ Assign' : next.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
