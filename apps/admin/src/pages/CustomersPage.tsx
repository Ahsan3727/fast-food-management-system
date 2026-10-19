import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/users?role=customer').then(r => r.data?.users ?? []),
  });

  const suspend = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) => api.patch(`/users/${id}`, { isSuspended: val }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['customers'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  const customers = (data as any[]).filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Customers</h1>
        <input className="input" style={{ width: 260 }} placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
        {customers.length} customer{customers.length !== 1 ? 's' : ''} found
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Customer</th><th>Phone</th><th>Email</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
                : customers.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No customers found</td></tr>
                  : customers.map((c: any) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                            {c.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="font-bold">{c.name}</div>
                            {c.isSuspended && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', padding: '1px 6px', borderRadius: 4 }}>SUSPENDED</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.phone ?? '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.email ?? '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(c.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span className={`badge ${c.isSuspended ? 'badge-cancelled' : 'badge-delivered'}`}>
                          {c.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${c.isSuspended ? 'btn-success' : 'btn-danger'}`}
                          onClick={() => { if (confirm(`${c.isSuspended ? 'Restore' : 'Suspend'} ${c.name}?`)) suspend.mutate({ id: c._id, val: !c.isSuspended }); }}
                          disabled={suspend.isPending}>
                          {c.isSuspended ? '✅ Restore' : '🚫 Suspend'}
                        </button>
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
