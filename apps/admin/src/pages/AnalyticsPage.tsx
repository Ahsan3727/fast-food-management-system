import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/lib/api';
import { queryKeys } from '@/api/queryKeys';
import { unwrapList } from '@/api/unwrap';
import { formatMoneyCompact } from '@fastfood/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/Icon';

const CHART_PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [viewAsTable, setViewAsTable] = useState<Record<string, boolean>>({});

  const toggleTable = (chartId: string) => {
    setViewAsTable((prev) => ({ ...prev, [chartId]: !prev[chartId] }));
  };

  const {
    data: rawOrders,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: queryKeys.orders.list({ analyticsRange: rangeDays }),
    queryFn: async () => {
      const res = await api.get(`/orders?limit=100`);
      return unwrapList(res.data);
    },
    staleTime: 60_000,
  });

  const orders: any[] = useMemo(() => unwrapList(rawOrders), [rawOrders]);
  const delivered = useMemo(() => orders.filter((o) => o.status === 'DELIVERED'), [orders]);

  const totalRevenue = useMemo(
    () => delivered.reduce((s, o) => s + (o.totalPaisa || 0), 0),
    [delivered],
  );

  const avgOrderValue = useMemo(
    () => (delivered.length > 0 ? Math.round(totalRevenue / delivered.length) : 0),
    [delivered, totalRevenue],
  );

  // Revenue trend over selected days
  const revenueTrend = useMemo(() => {
    return Array.from({ length: rangeDays }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (rangeDays - 1 - i));
      const label = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
      const dayMatches = delivered.filter(
        (o) => new Date(o.createdAt).toDateString() === d.toDateString(),
      );
      const dayRevenue = dayMatches.reduce((sum, o) => sum + (o.totalPaisa || 0), 0);
      return {
        date: label,
        revenue: Math.round(dayRevenue / 100),
        orders: dayMatches.length,
      };
    });
  }, [delivered, rangeDays]);

  // Status breakdown
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({
      name: status.replace(/_/g, ' '),
      value: count,
    }));
  }, [orders]);

  // Hourly distribution (Peak order hours)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, '0')}:00`,
      orders: 0,
    }));
    orders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      if (hours[h]) hours[h].orders += 1;
    });
    return hours.filter((h) => h.orders > 0 || parseInt(h.hour) % 3 === 0);
  }, [orders]);

  // Top selling menu items
  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenuePaisa: number }> = {};
    delivered.forEach((o) => {
      o.items?.forEach((it: any) => {
        const key = it.menuItemId || it.nameSnapshot || it.name;
        if (!map[key]) {
          map[key] = { name: it.nameSnapshot || it.name, qty: 0, revenuePaisa: 0 };
        }
        map[key].qty += it.quantity || 1;
        map[key].revenuePaisa += it.lineTotalPaisa ?? (it.unitPricePaisa * (it.quantity || 1));
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [delivered]);

  const updatedMinutesAgo = Math.max(0, Math.floor((Date.now() - (dataUpdatedAt || Date.now())) / 60000));

  if (isError) {
    return (
      <div className="page">
        <PageHeader title="Performance Analytics" subtitle="Revenue trends & order statistics" />
        <ErrorState
          title="Failed to load analytics data"
          message="Could not load aggregate sales metrics. Please retry."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="page">
      {/* 1. Header with Range Control */}
      <PageHeader
        title="Performance Analytics"
        subtitle="Live sales metrics, peak order volumes, and menu popularity"
        updatedAt={updatedMinutesAgo === 0 ? 'just now' : `${updatedMinutesAgo}m ago`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Range Selector */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bg-sunken)',
                padding: 3,
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
              }}
            >
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--r-sm)',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    background: rangeDays === days ? 'var(--bg-surface)' : 'transparent',
                    color: rangeDays === days ? 'var(--text)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: rangeDays === days ? 'var(--shadow-1)' : 'none',
                  }}
                >
                  {days} Days
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              className="btn btn-ghost"
              style={{ height: 38, padding: '0 12px', gap: 6 }}
              aria-label="Refresh data"
            >
              <Icon name="refresh" size={15} />
              <span style={{ fontSize: 13 }}>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">{rangeDays}-Day Revenue</div>
          <div className="stat-value" style={{ color: 'var(--action-bg)' }}>
            {formatMoneyCompact(totalRevenue)}
          </div>
          <div className="stat-delta delta-up">Delivered orders (COD)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Delivered Orders</div>
          <div className="stat-value">{delivered.length}</div>
          <div className="stat-delta delta-up">of {orders.length} total orders placed</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Ticket Size</div>
          <div className="stat-value" style={{ color: 'var(--text)' }}>
            {formatMoneyCompact(avgOrderValue)}
          </div>
          <div className="stat-delta delta-up">Average revenue per basket</div>
        </div>
      </div>

      {/* 3. Revenue Trend Chart with Accessible Table View */}
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Revenue Trend ({rangeDays} Days)
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Daily gross sales in PKR for fulfilled orders
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleTable('revenue')}
            className="btn btn-ghost btn-sm"
          >
            {viewAsTable.revenue ? 'View Chart' : 'View as Table'}
          </button>
        </div>

        {viewAsTable.revenue ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue (PKR)</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {revenueTrend.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.date}</td>
                    <td>{row.revenue.toLocaleString('en-PK')}</td>
                    <td>{row.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="emberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#emberGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. Row: Peak Order Hours & Top Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Peak Order Hours Bar Chart */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Peak Order Hours</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Order frequency by time of day
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleTable('hours')}
              className="btn btn-ghost btn-sm"
            >
              {viewAsTable.hours ? 'View Chart' : 'View as Table'}
            </button>
          </div>

          {viewAsTable.hours ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hour</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {hourlyData.map((h, i) => (
                    <tr key={i}>
                      <td>{h.hour}</td>
                      <td>{h.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="hour" tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                  <Bar dataKey="orders" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Selling Items */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Top Selling Items</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Highest grossing items by order volume
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topItems.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No completed orders in this range
              </div>
            ) : (
              topItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--bg-sunken)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--chip-bg)',
                        color: 'var(--action-bg)',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                      {item.name}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--action-bg)' }}>
                      {formatMoneyCompact(item.revenuePaisa)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.qty} sold</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
