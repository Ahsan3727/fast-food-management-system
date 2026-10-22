import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/api/queryKeys';
import { unwrapList } from '@/api/unwrap';
import { useOrderTransition } from '@/hooks/useOrderTransition';
import { OrderStatus } from '@fastfood/shared-types';
import { formatMoneyCompact } from '@fastfood/utils';
import { OrderTicket } from '@/components/OrderTicket';
import { OrderDrawer } from '@/components/OrderDrawer';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/Icon';

type KanbanTab = 'new' | 'kitchen' | 'ready' | 'transit';

export default function DashboardPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<KanbanTab>('new');

  // Unified transition mutation
  const transitionMutation = useOrderTransition();

  // Orders for Board
  const {
    data: rawOrders,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: queryKeys.orders.list({ board: true }),
    queryFn: async () => {
      const res = await api.get('/orders?limit=100');
      return unwrapList(res.data);
    },
    staleTime: 10_000,
  });

  // Riders Query for fleet KPI
  const { data: rawRiders } = useQuery({
    queryKey: queryKeys.riders.all,
    queryFn: async () => {
      const res = await api.get('/users?role=rider');
      return unwrapList(res.data);
    },
    staleTime: 30_000,
  });

  const orders: any[] = useMemo(() => unwrapList(rawOrders), [rawOrders]);
  const riders: any[] = useMemo(() => unwrapList(rawRiders), [rawRiders]);
  const onlineRiders = useMemo(() => riders.filter((r) => r.isOnline), [riders]);

  // Read selected order dynamically from orders array
  const selectedOrder = useMemo(
    () => orders.find((o) => o._id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  // Compute Dashboard Metrics
  const todayStr = useMemo(() => new Date().toDateString(), []);
  const todayOrders = useMemo(
    () => orders.filter((o) => new Date(o.createdAt).toDateString() === todayStr),
    [orders, todayStr],
  );

  const todayRevenue = useMemo(
    () =>
      todayOrders
        .filter((o) => o.status === OrderStatus.DELIVERED)
        .reduce((sum, o) => sum + (o.totalPaisa || 0), 0),
    [todayOrders],
  );

  // Filter orders by search
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const term = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.customerPhone?.toLowerCase().includes(term),
    );
  }, [orders, search]);

  // Group into 4 Kanban Columns per spec §6.2
  const placedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === OrderStatus.PLACED),
    [filteredOrders],
  );
  const kitchenOrders = useMemo(
    () =>
      filteredOrders.filter((o) =>
        [OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(o.status),
      ),
    [filteredOrders],
  );
  const readyOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === OrderStatus.READY),
    [filteredOrders],
  );
  const transitOrders = useMemo(
    () =>
      filteredOrders.filter((o) =>
        [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP].includes(o.status),
      ),
    [filteredOrders],
  );

  const handleAction = async (orderId: string, status: OrderStatus, note?: string) => {
    await transitionMutation.mutateAsync({ orderId, status, note });
  };

  if (ordersError) {
    return (
      <div className="page">
        <PageHeader title="Live Operations Board" subtitle="Real-time kitchen and fleet dispatch" />
        <ErrorState
          title="Failed to load live board"
          message="Could not retrieve current orders. Please check your connection."
          onRetry={() => refetchOrders()}
        />
      </div>
    );
  }

  return (
    <div className="page">
      {/* 1. Header with Freshness */}
      <PageHeader
        title="Live Operations Board"
        subtitle="Real-time kitchen management and active fleet dispatch"
        updatedAt="just now"
        actions={
          <div style={{ position: 'relative', width: 240 }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer…"
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

      {/* 2. KPI Strip (4 StatCards) */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Revenue</div>
          <div className="stat-value" style={{ color: 'var(--action-bg)' }}>
            {formatMoneyCompact(todayRevenue)}
          </div>
          <div className="stat-delta delta-up">Delivered COD orders</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Needs Action</div>
          <div
            className="stat-value"
            style={{ color: placedOrders.length > 0 ? 'var(--danger)' : 'var(--text)' }}
          >
            {placedOrders.length}
          </div>
          <div
            className="stat-delta"
            style={{ color: placedOrders.length > 0 ? 'var(--danger)' : 'var(--success)' }}
          >
            {placedOrders.length > 0 ? 'New orders awaiting accept' : 'All orders accepted'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Kitchen In-Progress</div>
          <div className="stat-value">{kitchenOrders.length}</div>
          <div className="stat-delta delta-up">Accepted & preparing</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Online Fleet</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {onlineRiders.length}
          </div>
          <div className="stat-delta delta-up">of {riders.length} registered riders</div>
        </div>
      </div>

      {/* 3. Mobile Kanban Tabs (< 768px) */}
      <div
        className="mobile-only-tabs"
        style={{
          display: 'none',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileTab('new')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: mobileTab === 'new' ? 'var(--chip-bg)' : 'var(--bg-sunken)',
            color: mobileTab === 'new' ? 'var(--chip-fg)' : 'var(--text)',
            border: '1px solid',
            borderColor: mobileTab === 'new' ? 'var(--action-bg)' : 'var(--border)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          New ({placedOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('kitchen')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: mobileTab === 'kitchen' ? 'var(--chip-bg)' : 'var(--bg-sunken)',
            color: mobileTab === 'kitchen' ? 'var(--chip-fg)' : 'var(--text)',
            border: '1px solid',
            borderColor: mobileTab === 'kitchen' ? 'var(--action-bg)' : 'var(--border)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Kitchen ({kitchenOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('ready')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: mobileTab === 'ready' ? 'var(--chip-bg)' : 'var(--bg-sunken)',
            color: mobileTab === 'ready' ? 'var(--chip-fg)' : 'var(--text)',
            border: '1px solid',
            borderColor: mobileTab === 'ready' ? 'var(--action-bg)' : 'var(--border)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Ready ({readyOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('transit')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: mobileTab === 'transit' ? 'var(--chip-bg)' : 'var(--bg-sunken)',
            color: mobileTab === 'transit' ? 'var(--chip-fg)' : 'var(--text)',
            border: '1px solid',
            borderColor: mobileTab === 'transit' ? 'var(--action-bg)' : 'var(--border)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Transit ({transitOrders.length})
        </button>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .mobile-only-tabs {
            display: flex !important;
          }
          .kanban-grid {
            display: block !important;
          }
          .kanban-col {
            display: none !important;
          }
          .kanban-col.mobile-active {
            display: flex !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .kanban-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      {/* 4. Kanban Board Grid */}
      <div
        className="kanban-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
          alignItems: 'start',
        }}
      >
        {/* Column 1: New (PLACED) */}
        <section
          className={`kanban-col ${mobileTab === 'new' ? 'mobile-active' : ''}`}
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            minHeight: 480,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                New Orders
              </h2>
              {placedOrders.some((o) => (Date.now() - new Date(o.createdAt).getTime()) / 60000 >= 20) && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--danger-solid)',
                  }}
                  title="Contains order waiting over 20m"
                />
              )}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--r-pill)',
                background: placedOrders.length > 0 ? 'var(--danger-bg)' : 'var(--bg-surface)',
                color: placedOrders.length > 0 ? 'var(--danger)' : 'var(--text-muted)',
              }}
            >
              {placedOrders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {placedOrders.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No pending orders
              </div>
            ) : (
              placedOrders.map((order) => (
                <OrderTicket
                  key={order._id}
                  order={order}
                  onOpen={(o) => setSelectedOrderId(o._id)}
                  nextStatus={OrderStatus.ACCEPTED}
                  nextLabel="Accept"
                  onAction={(id, status) => handleAction(id, status)}
                  loading={transitionMutation.isPending}
                />
              ))
            )}
          </div>
        </section>

        {/* Column 2: Kitchen (ACCEPTED / PREPARING) */}
        <section
          className={`kanban-col ${mobileTab === 'kitchen' ? 'mobile-active' : ''}`}
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            minHeight: 480,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Kitchen Cooking
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
              }}
            >
              {kitchenOrders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kitchenOrders.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Kitchen is clear
              </div>
            ) : (
              kitchenOrders.map((order) => (
                <OrderTicket
                  key={order._id}
                  order={order}
                  onOpen={(o) => setSelectedOrderId(o._id)}
                  nextStatus={order.status === OrderStatus.ACCEPTED ? OrderStatus.PREPARING : OrderStatus.READY}
                  nextLabel={order.status === OrderStatus.ACCEPTED ? 'Start Cooking' : 'Mark Ready'}
                  onAction={(id, status) => handleAction(id, status)}
                  loading={transitionMutation.isPending}
                />
              ))
            )}
          </div>
        </section>

        {/* Column 3: Ready for Rider */}
        <section
          className={`kanban-col ${mobileTab === 'ready' ? 'mobile-active' : ''}`}
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            minHeight: 480,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Ready for Pickup
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
              }}
            >
              {readyOrders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {readyOrders.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No orders waiting for pickup
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderTicket
                  key={order._id}
                  order={order}
                  onOpen={(o) => setSelectedOrderId(o._id)}
                  loading={transitionMutation.isPending}
                />
              ))
            )}
          </div>
        </section>

        {/* Column 4: On the way (TRANSIT) */}
        <section
          className={`kanban-col ${mobileTab === 'transit' ? 'mobile-active' : ''}`}
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            minHeight: 480,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              On The Way
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
              }}
            >
              {transitOrders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transitOrders.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No orders in delivery transit
              </div>
            ) : (
              transitOrders.map((order) => (
                <OrderTicket
                  key={order._id}
                  order={order}
                  onOpen={(o) => setSelectedOrderId(o._id)}
                  loading={transitionMutation.isPending}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Dynamic Order Detail Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onTransition={handleAction}
      />
    </div>
  );
}
