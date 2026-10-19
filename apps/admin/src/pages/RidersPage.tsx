import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';
import toast from 'react-hot-toast';

export default function RidersPage() {
  const qc = useQueryClient();

  const { data: riders = [], isLoading } = useQuery({
    queryKey: ['riders-all'],
    queryFn: () => api.get('/users?role=rider').then(r => r.data?.users ?? []),
    refetchInterval: 15_000,
  });

  const settle = useMutation({
    mutationFn: (riderId: string) => api.post(`/riders/${riderId}/settle`),
    onSuccess: () => { toast.success('Cash settled!'); qc.invalidateQueries({ queryKey: ['riders-all'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Settlement failed'),
  });

  const suspend = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) => api.patch(`/users/${id}`, { isSuspended: val }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['riders-all'] }); },
  });

  const onlineCount = (riders as any[]).filter((r: any) => r.isOnline).length;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Riders</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="card" style={{ padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{onlineCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Online</div>
          </div>
          <div className="card" style={{ padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{(riders as any[]).length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Rider</th><th>Phone</th><th>Status</th><th>Deliveries</th><th>Unsettled Cash</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
                : (riders as any[]).length === 0
                  ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No riders found</td></tr>
                  : (riders as any[]).map(r => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                            {r.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold">{r.name}</div>
                            {r.isSuspended && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', padding: '1px 6px', borderRadius: 4 }}>SUSPENDED</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.phone}</td>
                      <td>
                        <span className={`badge ${r.isOnline ? 'badge-online' : 'badge-offline'}`}>
                          {r.isOnline ? '● Online' : '○ Offline'}
                        </span>
                      </td>
                      <td className="font-bold">{r.totalDeliveries ?? 0}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: (r.unsettledCashPaisa ?? 0) > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                          {formatMoneyCompact(r.unsettledCashPaisa ?? 0)}
                        </span>
                      </td>
                      <td>
                        <div className="flex-gap">
                          {(r.unsettledCashPaisa ?? 0) > 0 && (
                            <button className="btn btn-success btn-sm" onClick={() => settle.mutate(r._id)} disabled={settle.isPending}>
                              💰 Settle
                            </button>
                          )}
                          <button
                            className={`btn btn-sm ${r.isSuspended ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => suspend.mutate({ id: r._id, val: !r.isSuspended })}>
                            {r.isSuspended ? '✅ Restore' : '🚫 Suspend'}
                          </button>
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
