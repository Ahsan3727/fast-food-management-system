import React from 'react';
import { OrderStatus } from '@fastfood/shared-types';
import { formatMoneyCompact } from '@fastfood/utils';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';

interface OrderTicketProps {
  order: any;
  onOpen: (order: any) => void;
  nextStatus?: OrderStatus;
  nextLabel?: string;
  onAction?: (orderId: string, status: OrderStatus) => void;
  loading?: boolean;
}

export function OrderTicket({
  order,
  onOpen,
  nextStatus,
  nextLabel,
  onAction,
  loading = false,
}: OrderTicketProps) {
  const getOrderAgeMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const ageMins = getOrderAgeMinutes(order.createdAt);
  const isRed = ageMins >= 20;
  const isAmber = ageMins >= 10 && ageMins < 20;
  const ageColor = isRed ? 'var(--danger)' : isAmber ? 'var(--warning)' : 'var(--text-muted)';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(order);
    }
  };

  const items = order.items ?? [];
  const itemsSummary =
    items.length > 0
      ? `${items.slice(0, 2).map((it: any) => `${it.quantity}× ${it.nameSnapshot || it.name}`).join(', ')}${
          items.length > 2 ? ` +${items.length - 2} more` : ''
        }`
      : 'Standard order';

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`Order #${order.orderNumber}, ${order.customerName || 'Customer'}, ${formatMoneyCompact(order.totalPaisa)}`}
      onKeyDown={handleKeyDown}
      onClick={() => onOpen(order)}
      className="card animate-fade-in"
      style={{
        padding: 'var(--space-4)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        outline: 'none',
        transition: 'transform var(--dur-press), box-shadow var(--dur-fast), border-color var(--dur-fast)',
        borderLeft: isRed ? '3px solid var(--danger)' : isAmber ? '3px solid var(--warning)' : '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
          #{order.orderNumber}
        </b>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: ageColor,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <Icon name="clock" size={13} />
          <span>{ageMins}m</span>
        </span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
          {order.customerName || 'Walk-in Customer'}
        </div>
        <div style={{ marginTop: 2, fontSize: 12, lineHeight: 1.3, color: 'var(--text-subtle)' }}>
          {itemsSummary}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge status={order.status} />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
            {formatMoneyCompact(order.totalPaisa)}
          </span>
        </div>

        {nextStatus && nextLabel && onAction && (
          <button
            type="button"
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              onAction(order._id, nextStatus);
            }}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700, minHeight: 34, padding: '0 12px' }}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </article>
  );
}
