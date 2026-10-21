import React from 'react';
import { OrderStatus, STATUS_META } from '@fastfood/shared-types';
import { Icon, IconName } from './Icon';

export interface StatusBadgeProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
  style,
}) => {
  const meta = STATUS_META[status as OrderStatus] || {
    label: status,
    tone: 'stone',
    icon: 'clipboard',
  };

  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <span
      className={`status-badge ${className}`}
      data-tone={meta.tone}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? 4 : 6,
        minHeight: isSm ? 20 : isLg ? 28 : 24,
        padding: isSm ? '1px 8px' : isLg ? '4px 12px' : '2px 10px',
        borderRadius: 999,
        fontSize: isSm ? 11 : isLg ? 13 : 12,
        fontWeight: 600,
        color: 'var(--b-fg)',
        backgroundColor: 'var(--b-bg)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <Icon name={meta.icon as IconName} size={isSm ? 12 : 14} />
      <span>{meta.label}</span>
    </span>
  );
};
