/**
 * ItemDetailSheet — the item dialog on top of MenuScreen.
 *
 * A native <dialog> opened with showModal(), which gives for free: focus moves
 * inside, Tab is trapped, the page behind is inert, Escape fires `cancel`, and
 * focus returns to whatever opened it. On phones it is a bottom sheet; from
 * 900px up it is a 440px centred dialog.
 *
 * Behaviour (unchanged): first size pre-selected, swipe-down on the handle
 * (60px), Escape, scrim tap or the close button dismiss, adding closes the
 * sheet and calls onAdded() so the cart bar can bump.
 *
 * Rules of hooks: the <dialog> is ALWAYS rendered (so hooks run in the same
 * order whether or not an item is open) and the content is a child component
 * keyed by item, so its state resets by itself when a different item opens.
 */

import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import toast from 'react-hot-toast';
import { MAX_LINE_QTY } from '@fastfood/shared-types';
import { useCartStore, lineKey } from '@/store/cart.store';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import { isNative } from '@/lib/platform';
import type { MenuItem } from './menu/menu.types';
import styles from './ItemDetailSheet.module.css';

// ── Haptic (same pattern as MenuScreen; intentional duplicate — 7 lines) ────
async function lightHaptic(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* ignore */ }
}

interface Props {
  item:     MenuItem | null;   // null = sheet is closed
  onClose:  () => void;
  onAdded:  () => void;        // called after successful cart add (for bump)
}

export function ItemDetailSheet({ item, onClose, onAdded }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Open / close the native dialog to match `item`. Layout effect: no frame where
  // the content is gone but the dialog is still on screen.
  useLayoutEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (item && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');           // very old WebView: shown, just not modal
    } else if (!item && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [item]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      // Escape: let React state close it (otherwise the browser closes it and
      // `item` still says open).
      onCancel={e => { e.preventDefault(); onClose(); }}
      // Click on the scrim (the dialog element itself, outside the sheet)
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {item && <SheetContent key={item._id} item={item} titleId={titleId} onClose={onClose} onAdded={onAdded} />}
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ContentProps {
  item: MenuItem;
  titleId: string;
  onClose: () => void;
  onAdded: () => void;
}

function SheetContent({ item, titleId, onClose, onAdded }: ContentProps) {
  const { addItem, items: cartItems } = useCartStore();

  const sizes  = item.sizes  ?? [];
  const addOns = item.addOns ?? [];

  const [selectedSize,   setSelectedSize  ] = useState<string | undefined>(sizes[0]?.label); // first size pre-selected
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [qty,            setQty           ] = useState(1);
  const [imgFailed,      setImgFailed     ] = useState(false);
  const touchStartY = useRef(0);

  // ── Pricing ─────────────────────────────────────────────────────────────
  const sizePrice = selectedSize
    ? (sizes.find(s => s.label === selectedSize)?.price ?? item.basePrice)
    : item.basePrice;
  const addOnTotal = selectedAddOns.reduce(
    (sum, label) => sum + (addOns.find(a => a.label === label)?.price ?? 0), 0);
  const unitPrice = sizePrice + addOnTotal;

  // ── Quantity: at most MAX_LINE_QTY of this exact line in the cart ───────
  // (the cart caps it anyway, but a stepper that lets you pick 20 more of
  // something you already have 18 of, and then quietly gives 2, is a trap)
  const key = lineKey({ menuItemId: item._id, sizeLabel: selectedSize, addOns: selectedAddOns });
  const alreadyInCart = cartItems.find(i => lineKey(i) === key)?.quantity ?? 0;
  const room = Math.max(0, MAX_LINE_QTY - alreadyInCart);
  const shownQty = room === 0 ? 0 : Math.min(qty, room);

  const toggleAddOn = (label: string) =>
    setSelectedAddOns(prev => prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]);

  const handleAdd = async () => {
    if (!item.isAvailable || shownQty < 1) return;
    await lightHaptic();
    addItem({
      menuItemId:     item._id,
      name:           item.name,
      image:          item.image,
      emoji:          item.emoji,
      sizeLabel:      selectedSize,
      addOns:         selectedAddOns,
      unitPricePaisa: unitPrice,
      quantity:       shownQty,
    });
    toast.success(`${item.name} added to cart`, {
      style: { background: 'var(--action-bg)', color: 'var(--action-fg)', borderRadius: 10, fontWeight: 600 },
    });
    onAdded();   // trigger CartBar bump in MenuScreen
    onClose();
  };

  // ── Swipe-down to dismiss (on the handle) ───────────────────────────────
  const onDragTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const onDragTouchEnd   = (e: TouchEvent) => {
    if (e.changedTouches[0].clientY - touchStartY.current > 60) onClose();
  };

  const showImg = !!item.image && !imgFailed;
  const ctaLabel = !item.isAvailable ? 'Sold out'
    : room === 0 ? `Limit of ${MAX_LINE_QTY} reached`
    : `Add to cart · ${formatMoneyCompact(unitPrice * shownQty)}`;

  return (
    <div className={styles.sheet}>
      {/* First in the DOM so it is where focus lands when the dialog opens */}
      <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
        <Icon name="close" size={18} />
      </button>

      <div className={styles.dragHandle} onTouchStart={onDragTouchStart} onTouchEnd={onDragTouchEnd} aria-hidden="true">
        <div className={styles.dragPill} />
      </div>

      <div className={styles.body}>
        <div className={styles.hero}>
          {showImg
            ? <img src={item.image} alt="" className={styles.heroImg} onError={() => setImgFailed(true)} />
            : <span className={styles.heroEmoji} aria-hidden="true">{item.emoji || '🍔'}</span>}
        </div>

        <div className={styles.titleRow}>
          <h2 id={titleId} className={styles.itemTitle}>{item.name}</h2>
          {!item.isAvailable && <span className={styles.soldOutBadge}>Sold out</span>}
        </div>

        {item.description && <p className={styles.description}>{item.description}</p>}

        {/* Size: one choice -> a radio group */}
        {sizes.length > 0 && (
          <fieldset className={styles.section}>
            <div className={styles.sectionHead}>
              <legend className={styles.sectionLabel}>Size</legend>
              <span className={styles.sectionHint}>Choose one</span>
            </div>
            <div className={styles.sizeGrid}>
              {sizes.map(s => {
                const active = selectedSize === s.label;
                return (
                  <label key={s.label} className={`${styles.sizeCard} ${active ? styles.sizeCardActive : ''}`}>
                    <input
                      type="radio"
                      name={`size-${item._id}`}
                      className={styles.nativeInput}
                      checked={active}
                      onChange={() => setSelectedSize(s.label)}
                    />
                    <span className={styles.radioDot} aria-hidden="true" />
                    <span className={styles.sizeText}>
                      <span className={styles.sizeLabel}>{s.label}</span>
                      <span className={styles.sizePrice}>{formatMoneyCompact(s.price)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Add-ons: any number -> checkboxes */}
        {addOns.length > 0 && (
          <fieldset className={styles.section}>
            <div className={styles.sectionHead}>
              <legend className={styles.sectionLabel}>Add-ons</legend>
              <span className={styles.sectionHint}>Optional</span>
            </div>
            <div className={styles.addOnList}>
              {addOns.map(ao => {
                const checked = selectedAddOns.includes(ao.label);
                return (
                  <label key={ao.label} className={styles.addOnRow}>
                    <input
                      type="checkbox"
                      className={styles.nativeInput}
                      checked={checked}
                      onChange={() => toggleAddOn(ao.label)}
                    />
                    <span className={`${styles.checkBox} ${checked ? styles.checkBoxOn : ''}`} aria-hidden="true">
                      {checked && <Icon name="check" size={14} />}
                    </span>
                    <span className={styles.addOnLabel}>{ao.label}</span>
                    <span className={styles.addOnPrice}>+{formatMoneyCompact(ao.price)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>

      {/* Sticky footer: stepper + one wide button */}
      <div className={styles.footer}>
        <div className={styles.stepper} role="group" aria-label="Quantity">
          <button type="button" className={styles.stepperBtn} aria-label="Decrease quantity"
            disabled={shownQty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}>
            <Icon name="minus" size={16} />
          </button>
          <span className={styles.stepperCount} aria-live="polite">{shownQty}</span>
          <button type="button" className={styles.stepperBtn} aria-label="Increase quantity"
            disabled={shownQty >= room} onClick={() => setQty(q => Math.min(room, q + 1))}>
            <Icon name="plus" size={16} />
          </button>
        </div>

        <button type="button" className={styles.addToCartBtn}
          disabled={!item.isAvailable || shownQty < 1} onClick={handleAdd}>
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
