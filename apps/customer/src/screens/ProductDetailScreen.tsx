import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import toast from 'react-hot-toast';

export default function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const { data: item, isLoading } = useQuery({
    queryKey: ['menu-item', id],
    queryFn: () => api.get(`/menu/${id}`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'var(--bg)',
          color: 'var(--subtle)',
        }}
      >
        Loading details...
      </div>
    );
  }

  if (!item) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg)',
          color: 'var(--text)',
          gap: 12,
        }}
      >
        <p>Item not found</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: 'var(--action-bg)',
            color: 'var(--action-fg)',
            border: 'none',
            fontWeight: 600,
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const sizes = item.sizes && item.sizes.length > 0 ? item.sizes : [];
  const addOns = item.addOns && item.addOns.length > 0 ? item.addOns : [];

  const sizePrice = selectedSize
    ? sizes.find((s: any) => s.label === selectedSize)?.price ?? item.basePrice
    : item.basePrice;

  const addOnTotal = selectedAddOns.reduce((sum: number, label: string) => {
    const ao = addOns.find((a: any) => a.label === label);
    return sum + (ao?.price ?? 0);
  }, 0);

  const unitPrice = sizePrice + addOnTotal;

  const toggleAddOn = (label: string) => {
    setSelectedAddOns(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

  const handleAdd = () => {
    addItem({
      menuItemId: item._id,
      name: item.name,
      image: item.imageUrl,
      emoji: item.emoji,
      sizeLabel: selectedSize,
      addOns: selectedAddOns,
      unitPricePaisa: unitPrice,
      quantity: qty,
    });
    toast.success(`${item.name} added to cart`, {
      style: {
        background: 'var(--action)',
        color: '#fff',
        borderRadius: 10,
        fontWeight: 600,
      },
    });
    navigate(-1);
  };

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

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero banner */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/10',
            maxHeight: 280,
            background: 'var(--sunken)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 80,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            aria-label="Back"
          >
            <Icon name="left" size={20} />
          </button>

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

        {/* Content */}
        <div style={{ padding: '20px 16px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: 'var(--text)' }}>
            {item.name}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
            {item.description || 'Deliciously freshly prepared fast food.'}
          </p>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: 'var(--text)' }}>
                Select Size
              </h2>
              <div style={{ display: 'grid', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedSize(undefined)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 56,
                    padding: '0 16px',
                    borderRadius: 12,
                    border: '1px solid',
                    borderColor: !selectedSize ? 'var(--action)' : 'var(--border)',
                    background: !selectedSize ? 'var(--sunken)' : 'var(--surface)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: !selectedSize ? 'var(--action)' : 'var(--subtle)',
                        background: !selectedSize ? 'var(--action)' : 'transparent',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fff',
                      }}
                    >
                      {!selectedSize && <Icon name="check" size={12} />}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Regular (Base)</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--action)' }}>
                    {formatMoneyCompact(item.basePrice)}
                  </span>
                </button>

                {sizes.map((s: any) => {
                  const isSelected = selectedSize === s.label;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setSelectedSize(s.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: 56,
                        padding: '0 16px',
                        borderRadius: 12,
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--action)' : 'var(--border)',
                        background: isSelected ? 'var(--sunken)' : 'var(--surface)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: isSelected ? 'var(--action)' : 'var(--subtle)',
                            background: isSelected ? 'var(--action)' : 'transparent',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#fff',
                          }}
                        >
                          {isSelected && <Icon name="check" size={12} />}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--action)' }}>
                        {formatMoneyCompact(s.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {addOns.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: 'var(--text)' }}>
                Add-ons
              </h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {addOns.map((ao: any) => {
                  const isSelected = selectedAddOns.includes(ao.label);
                  return (
                    <button
                      key={ao.label}
                      type="button"
                      onClick={() => toggleAddOn(ao.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: 56,
                        padding: '0 16px',
                        borderRadius: 12,
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--action)' : 'var(--border)',
                        background: isSelected ? 'var(--sunken)' : 'var(--surface)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: '2px solid',
                            borderColor: isSelected ? 'var(--action)' : 'var(--subtle)',
                            background: isSelected ? 'var(--action)' : 'transparent',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#fff',
                          }}
                        >
                          {isSelected && <Icon name="check" size={12} />}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{ao.label}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--muted)' }}>
                        +{formatMoneyCompact(ao.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen notes */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
              Notes for the kitchen <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--subtle)' }}>(optional)</span>
            </h2>
            <textarea
              maxLength={200}
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Extra spicy, no onions, sauce on the side..."
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 14,
                resize: 'none',
                outline: 'none',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
              {notes.length}/200
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          zIndex: 20,
        }}
      >
        {/* Quantity Stepper */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid var(--border)',
            borderRadius: 999,
            background: 'var(--sunken)',
            height: 48,
            padding: '0 4px',
          }}
        >
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: 'none',
              background: 'none',
              color: 'var(--text)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
            aria-label="Decrease quantity"
          >
            <Icon name="minus" size={16} />
          </button>
          <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>
            {qty}
          </span>
          <button
            onClick={() => setQty(q => Math.min(50, q + 1))}
            style={{
              width: 38,
              height: 38,
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
            <Icon name="plus" size={16} />
          </button>
        </div>

        {/* Add Button */}
        <button
          disabled={!item.isAvailable}
          onClick={handleAdd}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 12,
            border: 'none',
            background: item.isAvailable ? 'var(--action-bg)' : 'var(--sunken)',
            color: item.isAvailable ? 'var(--action-fg)' : 'var(--subtle)',
            fontSize: 15,
            fontWeight: 700,
            cursor: item.isAvailable ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
        >
          {item.isAvailable
            ? `Add · ${formatMoneyCompact(unitPrice * qty)}`
            : 'Sold Out'}
        </button>
      </div>
    </div>
  );
}
