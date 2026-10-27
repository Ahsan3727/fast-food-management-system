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
import { StatusBadge } from '@/components/StatusBadge';

type KanbanTab = 'new' | 'kitchen' | 'ready' | 'transit';
type ViewMode = 'board' | 'table';

function getOrderAgeMinutes(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

export default function DashboardPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<KanbanTab>('new');
  const [viewMode, setViewMode] = useState<ViewMode>('board');

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
      {/* 1. Header with Freshness & View Switcher */}
      <PageHeader
        title="Live Operations Board"
        subtitle="Real-time kitchen management and active fleet dispatch"
        updatedAt="just now"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {/* View Mode Segmented Switch (§4.7) */}
            <div
              role="radiogroup"
              aria-label="View layout switcher"
              style={{
                display: 'inline-flex',
                background: 'var(--bg-sunken)',
                borderRadius: 'var(--r-md)',
                padding: 2,
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'board'}
                onClick={() => setViewMode('board')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: viewMode === 'board' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'board' ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: viewMode === 'board' ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: viewMode === 'board' ? 'var(--shadow-1)' : 'none',
                  transition: 'all var(--dur-fast)',
                }}
              >
                <Icon name="grid" size={14} />
                <span>Board</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: viewMode === 'table' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: viewMode === 'table' ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: viewMode === 'table' ? 'var(--shadow-1)' : 'none',
                  transition: 'all var(--dur-fast)',
                }}
              >
                <Icon name="list" size={14} />
                <span>Table</span>
              </button>
            </div>

            {/* Order Search */}
            <div style={{ position: 'relative', width: 220 }}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders…"
                className="input"
                style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
              />
              <Icon
                name="search"
                size={14}
                style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-subtle)' }}
              />
            </div>
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

      {viewMode === 'table' ? (
        <div
          className="card"
          style={{
            padding: 0,
            overflowX: 'auto',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-sunken)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-subtle)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  height: 40,
                }}
              >
                <th style={{ padding: '8px 16px' }}>Order #</th>
                <th style={{ padding: '8px 16px' }}>Customer</th>
                <th style={{ padding: '8px 16px' }}>Items</th>
                <th style={{ padding: '8px 16px' }}>Age</th>
                <th style={{ padding: '8px 16px' }}>Total</th>
                <th style={{ padding: '8px 16px' }}>Status</th>
                <th style={{ padding: '8px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      padding: '48px 16px',
                      color: 'var(--text-muted)',
                      fontSize: 14,
                    }}
                  >
                    No orders matching search
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const ageMins = getOrderAgeMinutes(order.createdAt);
                  const isRed = ageMins >= 20;
                  const isAmber = ageMins >= 10 && ageMins < 20;
                  const ageColor = isRed
                    ? 'var(--danger)'
                    : isAmber
                    ? 'var(--warning)'
                    : 'var(--text-muted)';

                  const items = order.items ?? [];
                  const itemsSummary =
                    items.length > 0
                      ? `${items.slice(0, 2).map((it: any) => `${it.quantity}× ${it.nameSnapshot || it.name}`).join(', ')}${
                          items.length > 2 ? ` +${items.length - 2} more` : ''
                        }`
                      : 'Standard order';

                  let nextStatus: OrderStatus | undefined;
                  let nextLabel: string | undefined;
                  if (order.status === OrderStatus.PLACED) {
                    nextStatus = OrderStatus.ACCEPTED;
                    nextLabel = 'Accept';
                  } else if (order.status === OrderStatus.ACCEPTED) {
                    nextStatus = OrderStatus.PREPARING;
                    nextLabel = 'Start Cooking';
                  } else if (order.status === OrderStatus.PREPARING) {
                    nextStatus = OrderStatus.READY;
                    nextLabel = 'Mark Ready';
                  }

                  return (
                    <tr
                      key={order._id}
                      onClick={() => setSelectedOrderId(order._id)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background var(--dur-fast)',
                        height: 48,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-sunken)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '10px 16px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                        #{order.orderNumber}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {order.customerName || 'Walk-in Customer'}
                        </div>
                        {order.customerPhone && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {order.customerPhone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', maxWidth: 260 }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {itemsSummary}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 700,
                            fontSize: 12,
                            color: ageColor,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <Icon name="clock" size={13} />
                          <span>{ageMins}m</span>
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                        {formatMoneyCompact(order.totalPaisa)}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        {nextStatus && nextLabel ? (
                          <button
                            type="button"
                            disabled={transitionMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(order._id, nextStatus!);
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ fontWeight: 700, minHeight: 30, padding: '0 12px' }}
                          >
                            {nextLabel}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(order._id);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ minHeight: 30, padding: '0 10px', fontSize: 12 }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
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
              gridTemplateColumns: 'repeat(4, minmax(230px, 1fr))',
              gap: 'var(--space-4)',
              alignItems: 'start',
              overflowX: 'auto',
              paddingBottom: 'var(--space-2)',
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
        </>
      )}

      {/* Dynamic Order Detail Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onTransition={handleAction}
      />
    </div>
  );
}
