import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import toast from 'react-hot-toast';

export default function RidersPage() {
  const qc = useQueryClient();

  const { data: rawRiders = [], isLoading } = useQuery({
    queryKey: ['riders-all'],
    queryFn: () => api.get('/users?role=rider').then(r => r.data?.users ?? []),
    refetchInterval: 15_000,
  });

  const settleMutation = useMutation({
    mutationFn: (riderId: string) => api.post(`/riders/${riderId}/settle`),
    onSuccess: () => {
      toast.success('Rider cash settled successfully!');
      qc.invalidateQueries({ queryKey: ['riders-all'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Settlement failed');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) =>
      api.patch(`/users/${id}`, { isSuspended: val }),
    onSuccess: (_, vars) => {
      toast.success(vars.val ? 'Rider suspended' : 'Rider activated');
      qc.invalidateQueries({ queryKey: ['riders-all'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Action failed');
    },
  });

  const riders: any[] = Array.isArray(rawRiders) ? rawRiders : [];
  const onlineCount = riders.filter(r => r.isOnline).length;
  const totalUnsettled = riders.reduce((acc, r) => acc + (r.unsettledCashPaisa || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Riders Fleet</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Monitor rider presence, performance, and cash collection settlement
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="card" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{onlineCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Online Now</div>
          </div>

          <div className="card" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{riders.length}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Total Fleet</div>
          </div>

          <div className="card" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: totalUnsettled > 0 ? 'var(--warning)' : 'var(--text)' }}>
              {formatMoneyCompact(totalUnsettled)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Unsettled Cash</div>
          </div>
        </div>
      </div>

      {/* Riders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rider
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Phone
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Live Status
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Deliveries
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cash in Hand
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    Loading fleet…
                  </td>
                </tr>
              ) : riders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    No riders registered yet.
                  </td>
                </tr>
              ) : (
                riders.map((r: any) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'var(--chip-bg)',
                            color: 'var(--chip-fg)',
                            fontWeight: 800,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {r.name?.[0]?.toUpperCase() || 'R'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                          {r.isSuspended && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                background: 'var(--danger-bg)',
                                color: 'var(--danger)',
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}
                            >
                              SUSPENDED
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      <a href={`tel:${r.phone}`} style={{ color: 'var(--link)', textDecoration: 'none' }}>
                        {r.phone}
                      </a>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '2px 10px',
                          borderRadius: 'var(--r-pill)',
                          background: r.isOnline ? 'var(--success-bg)' : 'var(--bg-sunken)',
                          color: r.isOnline ? 'var(--success)' : 'var(--text-muted)',
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'currentColor',
                            animation: r.isOnline ? 'pulse 2s infinite' : 'none',
                          }}
                        />
                        {r.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14 }}>
                      {r.totalDeliveries || 0}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          color: (r.unsettledCashPaisa || 0) > 0 ? 'var(--warning)' : 'var(--text-muted)',
                        }}
                      >
                        {formatMoneyCompact(r.unsettledCashPaisa || 0)}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {(r.unsettledCashPaisa || 0) > 0 && (
                          <button
                            onClick={() => settleMutation.mutate(r._id)}
                            disabled={settleMutation.isPending}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--r-sm)',
                              border: 'none',
                              background: 'var(--success)',
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Settle Cash
                          </button>
                        )}
                        <button
                          onClick={() => suspendMutation.mutate({ id: r._id, val: !r.isSuspended })}
                          disabled={suspendMutation.isPending}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--r-sm)',
                            border: '1px solid var(--border)',
                            background: r.isSuspended ? 'var(--success-bg)' : 'var(--danger-bg)',
                            color: r.isSuspended ? 'var(--success)' : 'var(--danger)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {r.isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
