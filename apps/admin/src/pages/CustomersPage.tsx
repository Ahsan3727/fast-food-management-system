import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateTime } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: rawCustomers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/users?role=customer').then(r => r.data?.users ?? []),
    refetchInterval: 30_000,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) =>
      api.patch(`/users/${id}`, { isSuspended: val }),
    onSuccess: (_, vars) => {
      toast.success(vars.val ? 'Customer suspended' : 'Customer activated');
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Action failed');
    },
  });

  const customers: any[] = Array.isArray(rawCustomers) ? rawCustomers : [];

  const filtered = customers.filter(c => {
    if (!search) return true;
    const term = search.toLowerCase();
    return c.name?.toLowerCase().includes(term) || c.phone?.includes(term) || c.email?.toLowerCase().includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Registered Customers</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Manage customer accounts, addresses, and access permissions
          </p>
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
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

      {/* Customers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Customer
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Phone
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Saved Address
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Joined Date
                </th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Account Status
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
                    Loading customers…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c: any) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
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
                          {c.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                          {c.email && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.email}</div>}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} style={{ color: 'var(--link)', textDecoration: 'none' }}>
                          {c.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 220 }}>
                      <span className="truncate" style={{ display: 'block' }}>
                        {c.savedAddress?.addressLine || 'None saved'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDateTime(c.createdAt)}
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
                          background: c.isSuspended ? 'var(--danger-bg)' : 'var(--success-bg)',
                          color: c.isSuspended ? 'var(--danger)' : 'var(--success)',
                        }}
                      >
                        {c.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => suspendMutation.mutate({ id: c._id, val: !c.isSuspended })}
                        disabled={suspendMutation.isPending}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border)',
                          background: c.isSuspended ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: c.isSuspended ? 'var(--success)' : 'var(--danger)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {c.isSuspended ? 'Activate' : 'Suspend'}
                      </button>
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
