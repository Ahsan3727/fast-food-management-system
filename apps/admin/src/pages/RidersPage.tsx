import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/api/queryKeys';
import { unwrapList } from '@/api/unwrap';
import { useAdminStore } from '@/store/admin.store';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettleDialog } from '@/components/ui/SettleDialog';
import { SuspendDialog } from '@/components/ui/SuspendDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import toast from 'react-hot-toast';

export default function RidersPage() {
  const qc = useQueryClient();
  const { user } = useAdminStore();
  const isAdmin = user?.role === 'admin';

  const [settleTarget, setSettleTarget] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);

  const {
    data: rawRiders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.riders.all,
    queryFn: async () => {
      const res = await api.get('/users?role=rider');
      return unwrapList(res.data);
    },
    staleTime: 15_000,
  });

  const riders: any[] = useMemo(() => unwrapList(rawRiders), [rawRiders]);

  const settleMutation = useMutation({
    mutationFn: async ({ riderId, amountPaisa }: { riderId: string; amountPaisa: number }) => {
      return api.post(`/riders/${riderId}/settle`, { amountPaisa });
    },
    onSuccess: () => {
      toast.success('Rider cash settled successfully!');
      qc.invalidateQueries({ queryKey: queryKeys.riders.all });
      setSettleTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Settlement failed');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, isSuspended, reason }: { id: string; isSuspended: boolean; reason: string }) => {
      return api.patch(`/users/${id}`, { isSuspended, reason });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isSuspended ? 'Rider suspended' : 'Rider reactivated');
      qc.invalidateQueries({ queryKey: queryKeys.riders.all });
      setSuspendTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Action failed');
    },
  });

  const onlineRiders = useMemo(() => riders.filter((r) => r.isOnline), [riders]);
  const totalUnsettled = useMemo(
    () => riders.reduce((acc, r) => acc + (r.unsettledCashPaisa || 0), 0),
    [riders],
  );

  if (isError) {
    return (
      <div className="page">
        <PageHeader title="Fleet & Dispatch" subtitle="Monitor delivery presence and cash settlements" />
        <ErrorState
          title="Failed to load riders"
          message="Could not retrieve active fleet. Please check your connection."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Fleet & Dispatch"
        subtitle="Live delivery personnel status and cash collection reconciliation"
      />

      {/* KPI Strip */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Online Fleet</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {onlineRiders.length}
          </div>
          <div className="stat-delta delta-up">● Active and accepting jobs</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Fleet</div>
          <div className="stat-value">{riders.length}</div>
          <div className="stat-delta delta-up">Registered riders</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Unsettled Cash in Hand</div>
          <div
            className="stat-value"
            style={{ color: totalUnsettled > 0 ? 'var(--warning)' : 'var(--text)' }}
          >
            {formatMoneyCompact(totalUnsettled)}
          </div>
          <div className="stat-delta">Collected COD awaiting reconciliation</div>
        </div>
      </div>

      {riders.length === 0 ? (
        <EmptyState
          icon="bike"
          title="No riders registered"
          description="There are currently no delivery riders on this platform."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="table-wrap desktop-riders-table">
            <table>
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Contact</th>
                  <th>Presence</th>
                  <th>Deliveries</th>
                  <th>Cash in Hand</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {riders.map((r) => {
                  const hasCash = (r.unsettledCashPaisa || 0) > 0;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'var(--chip-bg)',
                              color: 'var(--action-bg)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {r.name?.charAt(0) || 'R'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{r.name}</div>
                            {r.isSuspended && (
                              <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>
                                Suspended
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {r.phone ? (
                          <a
                            href={`tel:${r.phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              color: 'var(--link)',
                              textDecoration: 'none',
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            <Icon name="phone" size={13} />
                            <span>{r.phone}</span>
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            color: r.isOnline ? 'var(--success)' : 'var(--text-muted)',
                          }}
                        >
                          <span
                            className={r.isOnline ? 'animate-pulse' : ''}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'currentColor',
                            }}
                          />
                          <span>{r.isOnline ? 'Online' : 'Offline'}</span>
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                          {r.completedDeliveriesCount || 0}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: hasCash ? 'var(--warning)' : 'var(--text-muted)',
                            fontVariantNumeric: 'tabular-nums',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {hasCash && <Icon name="cash" size={15} />}
                          <span>{formatMoneyCompact(r.unsettledCashPaisa || 0)}</span>
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            {hasCash && (
                              <button
                                type="button"
                                onClick={() => setSettleTarget(r)}
                                className="btn btn-primary btn-sm"
                              >
                                Settle…
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSuspendTarget(r)}
                              className={`btn btn-sm ${r.isSuspended ? 'btn-ghost' : 'btn-danger'}`}
                            >
                              {r.isSuspended ? 'Reactivate' : 'Suspend…'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-riders-cards" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
            {riders.map((r) => {
              const hasCash = (r.unsettledCashPaisa || 0) > 0;
              return (
                <div key={r._id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--chip-bg)',
                          color: 'var(--action-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {r.name?.charAt(0) || 'R'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: r.isOnline ? 'var(--success)' : 'var(--text-muted)' }}>
                          {r.isOnline ? '● Online' : '○ Offline'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: hasCash ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {formatMoneyCompact(r.unsettledCashPaisa || 0)}
                    </span>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      {hasCash && (
                        <button
                          type="button"
                          onClick={() => setSettleTarget(r)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          Settle Cash
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSuspendTarget(r)}
                        className={`btn btn-sm ${r.isSuspended ? 'btn-ghost' : 'btn-danger'}`}
                        style={{ flex: 1 }}
                      >
                        {r.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <style>{`
            @media (max-width: 767px) {
              .desktop-riders-table {
                display: none !important;
              }
              .mobile-riders-cards {
                display: flex !important;
              }
            }
          `}</style>
        </>
      )}

      {/* Settle Dialog with Confirmation */}
      <SettleDialog
        isOpen={settleTarget !== null}
        onClose={() => setSettleTarget(null)}
        onConfirm={(amountPaisa) => {
          if (settleTarget) {
            settleMutation.mutate({ riderId: settleTarget._id, amountPaisa });
          }
        }}
        riderName={settleTarget?.name || 'Rider'}
        unsettledPaisa={settleTarget?.unsettledCashPaisa || 0}
        loading={settleMutation.isPending}
      />

      {/* Suspend / Reactivate Dialog with Reason */}
      <SuspendDialog
        isOpen={suspendTarget !== null}
        onClose={() => setSuspendTarget(null)}
        onConfirm={(reason) => {
          if (suspendTarget) {
            suspendMutation.mutate({
              id: suspendTarget._id,
              isSuspended: !suspendTarget.isSuspended,
              reason,
            });
          }
        }}
        userName={suspendTarget?.name || 'Rider'}
        isCurrentlySuspended={Boolean(suspendTarget?.isSuspended)}
        loading={suspendMutation.isPending}
      />
    </div>
  );
}
