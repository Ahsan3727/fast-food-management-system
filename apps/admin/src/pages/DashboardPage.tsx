import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders?limit=100').then(r => r.data?.orders ?? r.data ?? []),
    refetchInterval: 15_000,
  });

  const { data: menu = [] } = useQuery({
    queryKey: ['menu'],
    queryFn: () => api.get('/menu').then(r => r.data),
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['riders-all'],
    queryFn: () => api.get('/users?role=rider').then(r => r.data?.users ?? []),
  });

  // Compute stats from orders
  const today = new Date().toDateString();
  const todayOrders = (orders as any[]).filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.filter(o => o.status === 'DELIVERED').reduce((s: number, o: any) => s + o.totalPaisa, 0);
  const activeOrders = (orders as any[]).filter(o => !['DELIVERED', 'CANCELLED', 'REJECTED', 'DELIVERY_FAILED'].includes(o.status));
  const onlineRiders = (riders as any[]).filter((r: any) => r.isOnline);

  // Last 7 days revenue chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-PK', { weekday: 'short' });
    const dayOrders = (orders as any[]).filter(o =>
      new Date(o.createdAt).toDateString() === d.toDateString() && o.status === 'DELIVERED'
    );
    const revenue = dayOrders.reduce((s: number, o: any) => s + o.totalPaisa, 0);
    return { day: label, revenue: Math.round(revenue / 100) };
  });

  // Recent orders (last 8)
  const recent = [...(orders as any[])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Revenue</div>
          <div className="stat-value text-primary">{formatMoneyCompact(todayRevenue)}</div>
          <div className="stat-delta delta-up">From delivered orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Orders</div>
          <div className="stat-value">{activeOrders.length}</div>
          <div className="stat-delta" style={{ color: activeOrders.length > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
            {activeOrders.length > 0 ? `${activeOrders.length} need attention` : 'All clear'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Orders</div>
          <div className="stat-value">{todayOrders.length}</div>
          <div className="stat-delta text-muted">{todayOrders.filter(o => o.status === 'DELIVERED').length} delivered</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Online Riders</div>
          <div className="stat-value text-success">{onlineRiders.length}</div>
          <div className="stat-delta text-muted">of {riders.length} total</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Revenue chart */}
        <div className="card">
          <div className="card-title">Revenue — Last 7 Days (Rs.)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active orders live feed */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>🔴 Live Orders</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>View all →</button>
          </div>
          {activeOrders.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No active orders right now</p>
            : activeOrders.slice(0, 5).map((o: any) => (
              <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>#{o.orderNumber}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{o.items?.length} item(s)</span>
                </div>
                <span className={`badge badge-${o.status.toLowerCase().replace('_', '-')}`}>{o.status.replace('_', ' ')}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Recent orders table */}
      <div className="card mt-16">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Recent Orders</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>All orders →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o: any) => (
                <tr key={o._id}>
                  <td><span className="font-bold">#{o.orderNumber}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{o.customerName ?? 'Customer'}</td>
                  <td>{o.items?.length ?? '?'}</td>
                  <td className="font-bold">{formatMoneyCompact(o.totalPaisa)}</td>
                  <td><span className={`badge badge-${o.status.toLowerCase().replace('_', '-')}`}>{o.status.replace('_', ' ')}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(o.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
