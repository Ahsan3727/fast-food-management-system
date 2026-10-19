import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#f59e0b', '#a78bfa', '#ec4899'];

export default function AnalyticsPage() {
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders?limit=500').then(r => r.data?.orders ?? r.data ?? []),
  });

  const { data: menu = [] } = useQuery({
    queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data),
  });

  const all = orders as any[];

  // ── Revenue last 30 days ─────────────────────────────────
  const revenueData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const label = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    const day = all.filter(o => new Date(o.createdAt).toDateString() === d.toDateString() && o.status === 'DELIVERED');
    return { date: label, revenue: Math.round(day.reduce((s, o) => s + o.totalPaisa, 0) / 100), orders: day.length };
  });

  // ── Order status breakdown (pie) ─────────────────────────
  const statusCount: Record<string, number> = {};
  all.forEach(o => { statusCount[o.status] = (statusCount[o.status] ?? 0) + 1; });
  const statusData = Object.entries(statusCount).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  // ── Top selling items ────────────────────────────────────
  const itemCount: Record<string, { name: string; qty: number; revenue: number }> = {};
  all.filter(o => o.status === 'DELIVERED').forEach(o => {
    o.items?.forEach((it: any) => {
      if (!itemCount[it.menuItemId ?? it.name]) itemCount[it.menuItemId ?? it.name] = { name: it.name, qty: 0, revenue: 0 };
      itemCount[it.menuItemId ?? it.name].qty += it.quantity;
      itemCount[it.menuItemId ?? it.name].revenue += it.totalPaisa ?? 0;
    });
  });
  const topItems = Object.values(itemCount).sort((a, b) => b.qty - a.qty).slice(0, 8);

  // ── Hourly order heatmap ─────────────────────────────────
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const count = all.filter(o => new Date(o.createdAt).getHours() === h).length;
    return { hour: `${h}:00`, orders: count };
  });

  // ── Summary stats ────────────────────────────────────────
  const delivered = all.filter(o => o.status === 'DELIVERED');
  const totalRevenue = delivered.reduce((s, o) => s + o.totalPaisa, 0);
  const avgOrderValue = delivered.length > 0 ? totalRevenue / delivered.length : 0;

  return (
    <div>
      <h1 className="page-title">Analytics</h1>

      {/* KPI cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value text-primary">{formatMoneyCompact(totalRevenue)}</div>
          <div className="stat-delta text-muted">From {delivered.length} deliveries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Order Value</div>
          <div className="stat-value">{formatMoneyCompact(Math.round(avgOrderValue))}</div>
          <div className="stat-delta text-muted">Per delivered order</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{all.length}</div>
          <div className="stat-delta text-success">{delivered.length} delivered</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancellation Rate</div>
          <div className="stat-value text-danger">
            {all.length > 0 ? Math.round((all.filter(o => ['CANCELLED', 'REJECTED', 'DELIVERY_FAILED'].includes(o.status)).length / all.length) * 100) : 0}%
          </div>
          <div className="stat-delta text-muted">Cancelled + failed</div>
        </div>
      </div>

      {/* Revenue trend (30 days) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Revenue Trend — Last 30 Days (Rs.)</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} interval={4} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 13 }} />
            <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" name="Revenue (Rs.)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Order status pie */}
        <div className="card">
          <div className="card-title">Order Status Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly heatmap */}
        <div className="card">
          <div className="card-title">Orders by Hour of Day</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 9 }} interval={3} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
              <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top selling items */}
      <div className="card">
        <div className="card-title">Top Selling Items (by Quantity)</div>
        {topItems.length === 0
          ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No delivered orders yet</p>
          : <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Item</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{i + 1}</td>
                    <td className="font-bold">{item.name}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--info)' }}>{item.qty}</span></td>
                    <td className="text-primary font-bold">{formatMoneyCompact(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}
