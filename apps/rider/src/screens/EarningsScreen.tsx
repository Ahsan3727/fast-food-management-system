import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import RiderBottomNav from '@/components/RiderBottomNav';

export default function EarningsScreen() {
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => api.get('/riders/dashboard').then(r => r.data),
  });

  const unsettledCash = dashboard?.unsettledCashPaisa ?? 0;
  const totalDeliveries = dashboard?.totalDeliveries ?? 0;
  // Estimated earnings: Rs. 150 per completed run
  const estimatedEarnings = totalDeliveries * 15000;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'none',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
          aria-label="Back"
        >
          <Icon name="left" size={20} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
          Earnings & Cash
        </h1>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {/* Unsettled Cash Ledger Card */}
        <div
          style={{
            background: unsettledCash > 0 ? 'var(--sunken)' : 'var(--surface)',
            border: `2px solid ${unsettledCash > 0 ? 'var(--warn)' : 'var(--border)'}`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: unsettledCash > 0 ? 'var(--warn)' : 'var(--subtle)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Icon name="cash" size={16} />
            <span>Unsettled Cash in Hand</span>
          </div>

          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: unsettledCash > 0 ? 'var(--warn)' : 'var(--text)',
              marginTop: 6,
              letterSpacing: '-0.02em',
            }}
          >
            {formatMoneyCompact(unsettledCash)}
          </div>

          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.4 }}>
            {unsettledCash > 0
              ? 'Collected from customer COD orders. Please deposit this cash with the restaurant manager at shift end.'
              : 'All cash from your deliveries has been cleared and settled with management.'}
          </p>
        </div>

        {/* Deliveries & Payout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)' }}>
              Completed Runs
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              {totalDeliveries}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Verified with OTP
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)' }}>
              Estimated Payout
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ok)', marginTop: 4 }}>
              {formatMoneyCompact(estimatedEarnings)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Rs. 150 / delivery
            </div>
          </div>
        </div>

        {/* Cash Settlement Policy Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="receipt" size={18} style={{ color: 'var(--action)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              COD Settlement Procedure
            </h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--subtle)', margin: 0, lineHeight: 1.5 }}>
            1. Every time you enter a customer's OTP, the cash collected is logged in your ledger.
            <br />
            2. When returning to the restaurant, hand the cash to the store manager.
            <br />
            3. The manager clicks "Settle Cash" in the Admin Portal, resetting your cash ledger to Rs. 0.
          </p>
        </div>
      </div>

      <RiderBottomNav active="earnings" />
    </div>
  );
}
