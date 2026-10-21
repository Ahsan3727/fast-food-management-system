import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';

export default function CartScreen() {
  const navigate = useNavigate();
  const { items, updateQuantity, clear, displayTotalPaisa } = useCartStore();

  const subtotalPaisa = displayTotalPaisa();
  // Free delivery over Rs. 1000 (100000 paisa), otherwise Rs. 100 (10000 paisa)
  const deliveryPaisa = subtotalPaisa >= 100000 ? 0 : 10000;
  const totalWithDelivery = subtotalPaisa + deliveryPaisa;
  const freeThresholdRemaining = Math.max(0, 100000 - subtotalPaisa);

  if (items.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--text)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--sunken)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--action)',
            marginBottom: 16,
          }}
        >
          <Icon name="bag" size={36} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Your cart is empty</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', maxWidth: 260 }}>
          Add something tasty from the menu and it will show up here.
        </p>
        <button
          onClick={() => navigate('/menu')}
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            background: 'var(--action)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Browse Menu
        </button>
      </div>
    );
  }

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
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
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
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Cart ({items.length})</h1>
        </div>

        <button
          onClick={() => {
            if (confirm('Clear all items from your cart?')) clear();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--subtle)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </header>

      {/* Main item list */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map(item => {
            const key = `${item.menuItemId}:${item.sizeLabel || ''}`;
            const lineTotal = item.unitPricePaisa * item.quantity;
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {/* Image/Emoji Tile */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: 'var(--sunken)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 26,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    item.emoji || '🍔'
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px', color: 'var(--text)' }}>
                    {item.name}
                  </h3>
                  {item.sizeLabel && (
                    <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
                      Size: {item.sizeLabel}
                    </p>
                  )}
                  {item.addOns.length > 0 && (
                    <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
                      + {item.addOns.join(', ')}
                    </p>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--action)', marginTop: 4 }}>
                    {formatMoneyCompact(lineTotal)}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 999,
                    background: 'var(--sunken)',
                    height: 38,
                    padding: '0 4px',
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.sizeLabel, -1)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'none',
                      color: item.quantity === 1 ? 'var(--bad)' : 'var(--text)',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                    title={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                    aria-label={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                  >
                    <Icon name={item.quantity === 1 ? 'trash' : 'minus'} size={14} />
                  </button>

                  <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.sizeLabel, 1)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'none',
                      color: 'var(--text)',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                    aria-label="Increase quantity"
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing breakdown card */}
        <div
          style={{
            marginTop: 20,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{formatMoneyCompact(subtotalPaisa)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
            <span>Delivery fee</span>
            <span style={{ fontWeight: 600, color: deliveryPaisa === 0 ? 'var(--ok)' : 'var(--text)' }}>
              {deliveryPaisa === 0 ? 'FREE' : formatMoneyCompact(deliveryPaisa)}
            </span>
          </div>

          {/* Free delivery progress */}
          {deliveryPaisa > 0 && (
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--sunken)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (subtotalPaisa / 100000) * 100)}%`,
                    background: 'var(--action)',
                    borderRadius: 3,
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '6px 0 0' }}>
                Add {formatMoneyCompact(freeThresholdRemaining)} more for free delivery
              </p>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 16,
              fontWeight: 800,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              marginTop: 8,
              color: 'var(--text)',
            }}
          >
            <span>Total (est.)</span>
            <span style={{ color: 'var(--action)' }}>{formatMoneyCompact(totalWithDelivery)}</span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--subtle)', margin: '8px 0 0', lineHeight: 1.4 }}>
            Final price and delivery confirmed at checkout.
          </p>
        </div>
      </div>

      {/* Footer Checkout button */}
      <div
        style={{
          padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <button
          onClick={() => navigate('/checkout')}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            background: 'var(--action)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <span>Proceed to Checkout · {formatMoneyCompact(totalWithDelivery)}</span>
          <Icon name="right" size={16} />
        </button>
      </div>
    </div>
  );
}
