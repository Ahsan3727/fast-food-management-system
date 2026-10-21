import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';

const CHART_PALETTE = ['#F97316', '#60A5FA', '#4ADE80', '#FBBF24', '#A78BFA', '#F472B6'];

export default function AnalyticsPage() {
  const { data: rawOrders = [] } = useQuery({
    queryKey: ['orders-analytics-raw'],
    queryFn: () => api.get('/orders?limit=300').then(r => r.data?.orders ?? r.data ?? []),
    staleTime: 60_000,
  });

  const { data: serverAnalytics } = useQuery({
    queryKey: ['orders-analytics-server'],
    queryFn: () => api.get('/orders/analytics?days=30').then(r => r.data),
    staleTime: 60_000,
  });

  const all: any[] = Array.isArray(rawOrders) ? rawOrders : [];
  const delivered = all.filter(o => o.status === 'DELIVERED');
  const totalRevenue = delivered.reduce((s, o) => s + (o.totalPaisa || 0), 0);
  const avgOrderValue = delivered.length > 0 ? Math.round(totalRevenue / delivered.length) : 0;

  // ── 30-Day Revenue Trend ─────────────────────────────────
  const revenueTrend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const label = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    const dayMatches = delivered.filter(
      o => new Date(o.createdAt).toDateString() === d.toDateString(),
    );
    const dayRevenue = dayMatches.reduce((sum, o) => sum + (o.totalPaisa || 0), 0);
    return {
      date: label,
      revenue: Math.round(dayRevenue / 100),
      orders: dayMatches.length,
    };
  });

  // ── Order Status Breakdown (Pie) ─────────────────────────
  const statusMap: Record<string, number> = {};
  all.forEach(o => {
    statusMap[o.status] = (statusMap[o.status] || 0) + 1;
  });
  const pieData = Object.entries(statusMap).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
  }));

  // ── Top Selling Items (With lineTotalPaisa fix N1) ───────
  const itemMap: Record<string, { name: string; qty: number; revenuePaisa: number }> = {};
  delivered.forEach(o => {
    o.items?.forEach((it: any) => {
      const key = it.menuItemId || it.nameSnapshot || it.name;
      if (!itemMap[key]) {
        itemMap[key] = {
          name: it.nameSnapshot || it.name || 'Menu Item',
          qty: 0,
          revenuePaisa: 0,
        };
      }
      const lineTotal = it.lineTotalPaisa ?? it.totalPaisa ?? (it.unitPricePaisa ? it.unitPricePaisa * it.quantity : 0);
      itemMap[key].qty += it.quantity || 1;
      itemMap[key].revenuePaisa += lineTotal;
    });
  });
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 7);

  // ── Hourly Distribution ──────────────────────────────────
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const count = all.filter(o => new Date(o.createdAt).getHours() === h).length;
    return { hour: `${h}:00`, orders: count };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Business Analytics</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Live insights into revenue trends, peak order hours, and popular menu items
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>30-Day Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--action-bg)', margin: '4px 0' }}>
            {formatMoneyCompact(totalRevenue)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Delivered orders only</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Delivered Orders</div>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>{delivered.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>out of {all.length} total orders</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Average Ticket Size</div>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>
            {formatMoneyCompact(avgOrderValue)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Average per delivered basket</div>
        </div>
      </div>

      {/* Row 1: Revenue Trend Chart */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Revenue History — Last 30 Days (PKR)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueTrend} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="emberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C2410C" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#C2410C" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
            <Area type="monotone" dataKey="revenue" stroke="#C2410C" strokeWidth={2.5} fill="url(#emberGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Top Items & Status Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Top Selling Items Table */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Top Selling Menu Items</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topItems.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-subtle)' }}>No completed orders yet</div>
            ) : (
              topItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--bg-sunken)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-subtle)', width: 16 }}>{idx + 1}</span>
                    <b style={{ fontSize: 14 }}>{item.name}</b>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{formatMoneyCompact(item.revenuePaisa)}</div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.qty} sold</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Hourly Orders Bar Chart */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Orders by Hour of Day (Rush Hours)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourlyData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
            <XAxis dataKey="hour" tick={{ fill: 'var(--text-subtle)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-subtle)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
            <Bar dataKey="orders" fill="var(--action-bg)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
