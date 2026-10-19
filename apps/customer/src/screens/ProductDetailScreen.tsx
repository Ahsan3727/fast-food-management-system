import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import toast from 'react-hot-toast';
import styles from './ProductDetailScreen.module.css';

export default function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const { data: item, isLoading } = useQuery({
    queryKey: ['menu-item', id],
    queryFn: () => api.get(`/menu/${id}`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className={styles.loading}><span className="skeleton" style={{ width: 200, height: 20, display: 'block' }} /></div>;
  if (!item) return <div className={styles.loading}>Item not found</div>;

  const sizePrice = selectedSize
    ? (item.sizes ?? []).find((s: any) => s.label === selectedSize)?.price ?? item.basePrice
    : item.basePrice;

  const addOnTotal = selectedAddOns.reduce((sum: number, label: string) => {
    const ao = (item.addOns ?? []).find((a: any) => a.label === label);
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
      image: item.image,
      emoji: item.emoji,
      sizeLabel: selectedSize,
      addOns: selectedAddOns,
      unitPricePaisa: unitPrice,
      quantity: qty,
    });
    toast.success(`${item.name} added to cart 🛒`);
    navigate(-1);
  };

  return (
    <div className={styles.page}>
      {/* Image / Emoji Hero */}
      <div className={styles.hero} style={{ background: item.color ?? '#fed7aa' }}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        {item.image
          ? <img src={item.image} alt={item.name} className={styles.heroImg} />
          : <span className={styles.heroEmoji}>{item.emoji ?? '🍔'}</span>
        }
      </div>

      <div className={styles.content}>
        <h1 className={styles.name}>{item.name}</h1>
        {item.description && <p className={styles.desc}>{item.description}</p>}

        {/* Sizes */}
        {(item.sizes ?? []).length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Size</p>
            <div className={styles.optionRow}>
              <button
                className={`${styles.option} ${!selectedSize ? styles.optionActive : ''}`}
                onClick={() => setSelectedSize(undefined)}
              >
                Regular<br />
                <span className={styles.optionPrice}>{formatMoneyCompact(item.basePrice)}</span>
              </button>
              {(item.sizes as any[]).map((s: any) => (
                <button
                  key={s.label}
                  className={`${styles.option} ${selectedSize === s.label ? styles.optionActive : ''}`}
                  onClick={() => setSelectedSize(s.label)}
                >
                  {s.label}<br />
                  <span className={styles.optionPrice}>{formatMoneyCompact(s.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {(item.addOns ?? []).length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Add-ons</p>
            <div className={styles.optionRow}>
              {(item.addOns as any[]).map((ao: any) => (
                <button
                  key={ao.label}
                  className={`${styles.option} ${selectedAddOns.includes(ao.label) ? styles.optionActive : ''}`}
                  onClick={() => toggleAddOn(ao.label)}
                >
                  {ao.label}<br />
                  <span className={styles.optionPrice}>+{formatMoneyCompact(ao.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Qty */}
        <div className={styles.qtyRow}>
          <p className={styles.sectionLabel}>Quantity</p>
          <div className={styles.qtyControls}>
            <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className={styles.qtyVal}>{qty}</span>
            <button className={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
          </div>
        </div>

        {/* Add to cart */}
        <button className={styles.addBtn} onClick={handleAdd}>
          Add to Cart · {formatMoneyCompact(unitPrice * qty)}
        </button>
      </div>
    </div>
  );
}
