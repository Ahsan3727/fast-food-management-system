import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/api/queryKeys';
import { unwrapList } from '@/api/unwrap';
import { useAdminStore } from '@/store/admin.store';
import { formatDateTime } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { SuspendDialog } from '@/components/ui/SuspendDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const qc = useQueryClient();
  const { user } = useAdminStore();
  const isAdmin = user?.role === 'admin';

  const {
    data: rawCustomers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.customers.all(),
    queryFn: async () => {
      const res = await api.get('/users?role=customer');
      return unwrapList(res.data);
    },
    staleTime: 30_000,
  });

  const customers: any[] = useMemo(() => unwrapList(rawCustomers), [rawCustomers]);

  const suspendMutation = useMutation({
    mutationFn: async ({ id, isSuspended, reason }: { id: string; isSuspended: boolean; reason: string }) => {
      return api.patch(`/users/${id}`, { isSuspended, reason });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isSuspended ? 'Customer suspended' : 'Customer reactivated');
      qc.invalidateQueries({ queryKey: queryKeys.customers.all() });
      setSuspendTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Action failed');
    },
  });

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  if (isError) {
    return (
      <div className="page">
        <PageHeader title="Customer Directory" subtitle="Manage registered customers" />
        <ErrorState
          title="Failed to load customers"
          message="Could not retrieve registered customers directory. Please retry."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Customer Directory"
        subtitle={`Showing ${filtered.length} of ${customers.length} registered customers`}
        actions={
          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email…"
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

      {filtered.length === 0 ? (
        <EmptyState
          icon="users"
          title="No customers found"
          description={search ? `No customer found matching "${search}".` : 'No customers have registered yet.'}
          actionLabel={search ? 'Clear Search' : undefined}
          onAction={() => setSearch('')}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-wrap desktop-customers-table">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Saved Address</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id}>
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
                          {c.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
                          {c.email && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
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
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text)', maxWidth: 220 }}>
                      {c.address?.street || c.address?.formatted || c.address || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDateTime(c.createdAt)}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px',
                          borderRadius: 'var(--r-pill)',
                          fontSize: 11,
                          fontWeight: 700,
                          background: c.isSuspended ? 'var(--danger-bg)' : 'var(--success-bg)',
                          color: c.isSuspended ? 'var(--danger)' : 'var(--success)',
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'currentColor',
                          }}
                        />
                        <span>{c.isSuspended ? 'Suspended' : 'Active'}</span>
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSuspendTarget(c)}
                          className={`btn btn-sm ${c.isSuspended ? 'btn-ghost' : 'btn-danger'}`}
                        >
                          {c.isSuspended ? 'Reactivate' : 'Suspend…'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="mobile-customers-cards" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
            {filtered.map((c) => (
              <div key={c._id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                      {c.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone || c.email}</div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--r-pill)',
                      background: c.isSuspended ? 'var(--danger-bg)' : 'var(--success-bg)',
                      color: c.isSuspended ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {c.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </div>

                {isAdmin && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSuspendTarget(c)}
                      className={`btn btn-sm ${c.isSuspended ? 'btn-ghost' : 'btn-danger'}`}
                    >
                      {c.isSuspended ? 'Reactivate Customer' : 'Suspend Customer…'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <style>{`
            @media (max-width: 767px) {
              .desktop-customers-table {
                display: none !important;
              }
              .mobile-customers-cards {
                display: flex !important;
              }
            }
          `}</style>
        </>
      )}

      {/* Suspend Reason Dialog */}
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
        userName={suspendTarget?.name || 'Customer'}
        isCurrentlySuspended={Boolean(suspendTarget?.isSuspended)}
        loading={suspendMutation.isPending}
      />
    </div>
  );
}
