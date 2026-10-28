/**
 * ItemDetailSheet — slide-up bottom sheet rendered on top of MenuScreen.
 *
 * Opens when the customer taps any item row on the menu.
 * No navigation: the menu stays mounted behind the scrim.
 *
 * Behaviour:
 *  - Sizes pre-selected to first option (confirmed by user 2026-10-29)
 *  - Swipe-down on drag-handle to dismiss
 *  - ESC key to dismiss
 *  - Add to cart → closes sheet, calls onAdded() for CartBar bump
 */

import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import { isNative } from '@/lib/platform';
import type { MenuItem } from './MenuScreen';
import styles from './ItemDetailSheet.module.css';

// ── Haptic (same pattern as MenuScreen; intentional duplicate — 7 lines) ────
async function lightHaptic(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  item:     MenuItem | null;   // null = sheet is closed
  onClose:  () => void;
  onAdded:  () => void;        // called after successful cart add (for bump)
}

export function ItemDetailSheet({ item, onClose, onAdded }: Props) {
  const { addItem } = useCartStore();

  const [selectedSize,   setSelectedSize  ] = useState<string | undefined>(undefined);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [qty,            setQty           ] = useState(1);

  // Reset selections whenever a DIFFERENT item is opened
  useEffect(() => {
    if (!item) return;
    setSelectedSize(item.sizes?.[0]?.label);   // pre-select first size (user preference)
    setSelectedAddOns([]);
    setQty(1);
  }, [item?._id]);                             // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss on Escape key
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, onClose]);

  // Nothing to render when sheet is closed
  if (!item) return null;

  // ── Pricing ─────────────────────────────────────────────────────────────
  const sizes  = item.sizes  ?? [];
  const addOns = item.addOns ?? [];

  const sizePrice = selectedSize
    ? (sizes.find(s => s.label === selectedSize)?.price ?? item.basePrice)
    : item.basePrice;

  const addOnTotal = selectedAddOns.reduce((sum, label) => {
    const ao = addOns.find(a => a.label === label);
    return sum + (ao?.price ?? 0);
  }, 0);

  const unitPrice = sizePrice + addOnTotal;

  // ── Handlers ────────────────────────────────────────────────────────────
  const toggleAddOn = (label: string) =>
    setSelectedAddOns(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label],
    );

  const handleAdd = async () => {
    if (!item.isAvailable) return;
    await lightHaptic();
    addItem({
      menuItemId:     item._id,
      name:           item.name,
      image:          item.image,
      emoji:          item.emoji,
      sizeLabel:      selectedSize,
      addOns:         selectedAddOns,
      unitPricePaisa: unitPrice,
      quantity:       qty,
    });
    toast.success(`${item.name} added to cart`, {
      style: {
        background: 'var(--action-bg)',
        color:      'var(--action-fg)',
        borderRadius: 10,
        fontWeight: 600,
      },
    });
    onAdded();   // trigger CartBar bump in MenuScreen
    onClose();
  };

  // ── Swipe-down to dismiss ────────────────────────────────────────────────
  const touchStartY = useRef(0);
  const onDragTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onDragTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - touchStartY.current > 60) onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Scrim — click outside to close */}
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        className={styles.sheet}
      >
        {/* Drag handle */}
        <div
          className={styles.dragHandle}
          onTouchStart={onDragTouchStart}
          onTouchEnd={onDragTouchEnd}
          aria-hidden="true"
        >
          <div className={styles.dragPill} />
        </div>

        {/* ── Scrollable body ── */}
        <div className={styles.body}>

          {/* Hero image / emoji */}
          <div className={styles.hero}>
            {item.image ? (
              <img src={item.image} alt={item.name} className={styles.heroImg} />
            ) : (
              <span className={styles.heroEmoji} aria-hidden="true">
                {item.emoji || '🍔'}
              </span>
            )}
          </div>

          {/* Name + sold-out badge */}
          <div className={styles.titleRow}>
            <h2 className={styles.itemTitle}>{item.name}</h2>
            {!item.isAvailable && (
              <span className={styles.soldOutBadge}>Sold out</span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}

          {/* ── Sizes ── */}
          {sizes.length > 0 && (
            <section className={styles.section} aria-label="Select size">
              <h3 className={styles.sectionLabel}>Size</h3>
              <div className={styles.sizeGrid}>
                {sizes.map(s => {
                  const active = selectedSize === s.label;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      className={`${styles.sizeBtn} ${active ? styles.sizeBtnActive : ''}`}
                      onClick={() => setSelectedSize(s.label)}
                      aria-pressed={active}
                    >
                      <span className={styles.sizeBtnLabel}>{s.label}</span>
                      <span className={styles.sizeBtnPrice}>
                        {formatMoneyCompact(s.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Add-ons ── */}
          {addOns.length > 0 && (
            <section className={styles.section} aria-label="Add-ons">
              <h3 className={styles.sectionLabel}>Add-ons</h3>
              <div className={styles.addOnList}>
                {addOns.map(ao => {
                  const checked = selectedAddOns.includes(ao.label);
                  return (
                    <button
                      key={ao.label}
                      type="button"
                      className={`${styles.addOnBtn} ${checked ? styles.addOnBtnActive : ''}`}
                      onClick={() => toggleAddOn(ao.label)}
                      aria-pressed={checked}
                    >
                      <span className={styles.addOnCheck} aria-hidden="true">
                        {checked && <Icon name="check" size={11} />}
                      </span>
                      <span className={styles.addOnLabel}>{ao.label}</span>
                      <span className={styles.addOnPrice}>
                        +{formatMoneyCompact(ao.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

        </div>{/* end .body */}

        {/* ── Sticky footer: stepper + add button ── */}
        <div className={styles.footer}>

          {/* Quantity stepper */}
          <div className={styles.stepper} role="group" aria-label="Quantity">
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setQty(q => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              <Icon name="minus" size={16} />
            </button>
            <span className={styles.stepperCount} aria-live="polite">{qty}</span>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setQty(q => Math.min(50, q + 1))}
              aria-label="Increase quantity"
            >
              <Icon name="plus" size={16} />
            </button>
          </div>

          {/* Add to cart */}
          <button
            type="button"
            className={styles.addToCartBtn}
            disabled={!item.isAvailable}
            onClick={handleAdd}
          >
            {item.isAvailable
              ? `Add to cart · ${formatMoneyCompact(unitPrice * qty)}`
              : 'Sold Out'}
          </button>

        </div>
      </div>
    </>
  );
}
