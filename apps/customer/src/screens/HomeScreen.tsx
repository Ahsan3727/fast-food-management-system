import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import BottomNav from '@/components/BottomNav';
import CartBar from '@/components/CartBar';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/components/Icon';
import { SkeletonCard } from '@/components/Skeleton';
import { formatMoneyCompact } from '@fastfood/utils';
import { STATUS_META, OrderStatus } from '@fastfood/shared-types';
import { QK } from '@/api/queryKeys';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem, totalItems } = useCartStore();

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: QK.categories,
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  });

  const { data: menuItems = [], isLoading } = useQuery<any[]>({
    queryKey: QK.menu(),
    queryFn: () => api.get('/menu').then(r => r.data),
  });

  const { data: myOrders = [] } = useQuery<any[]>({
    queryKey: QK.myOrders,
    queryFn: () => api.get('/orders/my').then(r => r.data),
    staleTime: 10_000,
  });

  const activeOrder = myOrders.find(
    o => STATUS_META[o.status as OrderStatus]?.isActive
  );

  const cartCount = totalItems();
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

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
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Hi, {firstName}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
              What are you craving today?
            </p>
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
                  color: '#fff',
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

        {/* Search bar button */}
        <button
          onClick={() => navigate('/menu')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            height: 46,
            padding: '0 14px',
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--surface)',
            color: 'var(--subtle)',
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          <Icon name="search" size={18} />
          <span>Search burgers, pizza, drinks...</span>
        </button>

        {/* Live Active Order Strip */}
        {activeOrder && (
          <button
            onClick={() => navigate(`/orders/${activeOrder._id}/track`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              width: '100%',
              padding: '12px 16px',
              borderRadius: 14,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--action)',
              marginBottom: 16,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                  Order #{activeOrder.orderNumber}
                </span>
                <StatusBadge status={activeOrder.status} size="sm" />
              </div>
              <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {activeOrder.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'In progress'}
              </p>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--action)',
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              Track <Icon name="right" size={14} />
            </span>
          </button>
        )}

        {/* Categories Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Categories</h2>
            <button
              onClick={() => navigate('/menu')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--action)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              See all
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none',
            }}
          >
            {categories.map((cat: any) => (
              <button
                key={cat._id}
                onClick={() => navigate(`/menu?cat=${cat._id}`)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 999,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>{cat.icon || '🍽️'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Favourites Section */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Menu Favourites
            </h2>
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[1, 2, 3, 4].map(n => <SkeletonCard key={n} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {menuItems.slice(0, 10).map((item: any) => (
                <article
                  key={item._id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <button
                    onClick={() => navigate(`/menu/${item._id}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '4/3',
                        borderRadius: 10,
                        background: 'var(--sunken)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 40,
                        overflow: 'hidden',
                        marginBottom: 8,
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
                      {!item.isAvailable && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 999,
                            background: 'var(--stone-900)',
                            color: 'var(--stone-0)',
                          }}
                        >
                          Sold out
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text)',
                        margin: '0 0 4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.name}
                    </h3>
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 6,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--action)' }}>
                      {formatMoneyCompact(item.basePrice)}
                    </span>

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
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: item.isAvailable ? 'var(--action-bg)' : 'var(--bg-sunken)',
                        color: item.isAvailable ? 'var(--action-fg)' : 'var(--text-subtle)',
                        border: 'none',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: item.isAvailable ? 'pointer' : 'not-allowed',
                      }}
                      title={item.isAvailable ? 'Add to cart' : 'Sold out'}
                      aria-label={`Add ${item.name}`}
                    >
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <CartBar />
      <BottomNav active="home" />
    </div>
  );
}
