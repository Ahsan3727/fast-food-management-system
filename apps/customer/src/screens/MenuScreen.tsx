import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import BottomNav from '@/components/BottomNav';
import CartBar from '@/components/CartBar';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { Icon } from '@/components/Icon';

export default function MenuScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selectedCat = params.get('cat') ?? params.get('category') ?? '';
  const [searchQuery, setSearchQuery] = useState('');
  const { addItem, totalItems } = useCartStore();
  const cartCount = totalItems();

  const { data: cats = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  });

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ['menu', selectedCat],
    queryFn: () =>
      api.get(`/menu${selectedCat ? `?categoryId=${selectedCat}` : ''}`).then(r => r.data),
  });

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

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
      {/* Network Connectivity Banner */}
      <ConnectionBanner />

      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
              aria-label="Back"
            >
              <Icon name="left" size={18} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Menu
            </h1>
          </div>

          <button
            onClick={() => navigate('/cart')}
            style={{
              position: 'relative',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            aria-label="View Cart"
          >
            <Icon name="bag" size={20} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: 'var(--action)',
                  color: 'var(--action-fg)',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                  padding: '0 4px',
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            height: 48,
            padding: '0 14px',
            border: '1.5px solid var(--border-strong)',
            borderRadius: 12,
            background: 'var(--surface)',
            color: 'var(--subtle)',
            marginBottom: 12,
          }}
        >
          <Icon name="search" size={18} />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: 16,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--subtle)',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Category Pills (Sticky) */}
        <div
          style={{
            position: 'sticky',
            top: -16,
            background: 'var(--bg)',
            zIndex: 10,
            margin: '0 -16px 12px',
            padding: '8px 16px',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <button
            onClick={() => setParams({})}
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 14px',
              borderRadius: 'var(--radius-pill, 999px)',
              border: `1.5px solid ${!selectedCat ? 'var(--action-bg)' : 'var(--border-strong)'}`,
              background: !selectedCat ? 'var(--chip-bg)' : 'var(--surface)',
              color: !selectedCat ? 'var(--chip-fg)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {!selectedCat && <Icon name="check" size={14} />}
            All
          </button>

          {cats.map((c: any) => {
            const isSelected = selectedCat === c._id;
            return (
              <button
                key={c._id}
                onClick={() => setParams({ cat: c._id })}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-pill, 999px)',
                  border: `1.5px solid ${isSelected ? 'var(--action-bg)' : 'var(--border-strong)'}`,
                  background: isSelected ? 'var(--chip-bg)' : 'var(--surface)',
                  color: isSelected ? 'var(--chip-fg)' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isSelected ? <Icon name="check" size={14} /> : <span>{c.icon || '🍽️'}</span>}
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {isLoading ? (
            [1, 2, 3, 4, 5].map(n => (
              <div
                key={n}
                style={{
                  height: 72,
                  borderRadius: 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  marginBottom: 10,
                  opacity: 0.5,
                }}
              />
            ))
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item: any) => (
              <div
                key={item._id}
                onClick={() => navigate(`/menu/${item._id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  opacity: item.isAvailable ? 1 : 0.6,
                }}
              >
                {/* Tile */}
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 12,
                    background: 'var(--sunken)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 32,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    item.emoji || '🍔'
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        margin: 0,
                        color: 'var(--text)',
                      }}
                    >
                      {item.name}
                    </h3>
                    {!item.isAvailable && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 999,
                          background: 'var(--bad-bg)',
                          color: 'var(--bad)',
                        }}
                      >
                        Sold out
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--subtle)',
                        margin: '2px 0 4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </p>
                  )}

                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--action)' }}>
                    {formatMoneyCompact(item.basePrice)}
                  </span>
                </div>

                {/* Quick Add */}
                <button
                  disabled={!item.isAvailable}
                  onClick={e => {
                    e.stopPropagation();
                    addItem({
                      menuItemId: item._id,
                      name: item.name,
                      image: item.imageUrl,
                      emoji: item.emoji,
                      addOns: [],
                      unitPricePaisa: item.basePrice,
                      quantity: 1,
                    });
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: item.isAvailable ? 'var(--action)' : 'var(--sunken)',
                    color: item.isAvailable ? '#fff' : 'var(--subtle)',
                    border: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: item.isAvailable ? 'pointer' : 'not-allowed',
                    flexShrink: 0,
                  }}
                  title={item.isAvailable ? 'Quick Add' : 'Sold Out'}
                  aria-label={`Add ${item.name}`}
                >
                  <Icon name="plus" size={18} />
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--subtle)' }}>
              <p style={{ fontSize: 15 }}>No items found matching "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setParams({});
                }}
                style={{
                  marginTop: 8,
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--action)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Show all items
              </button>
            </div>
          )}
        </div>
      </div>

      <CartBar />
      <BottomNav active="menu" />
    </div>
  );
}
