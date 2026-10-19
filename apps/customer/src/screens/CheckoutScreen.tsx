import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { formatMoneyCompact } from '@fastfood/utils';
import { v4 as uuidv4 } from 'uuid';
import styles from './CheckoutScreen.module.css';

interface CheckoutForm {
  addressLine: string;
  landmark?: string;
  lat: string;
  lng: string;
}

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: {
      lat: '31.5204',
      lng: '74.3587',
    },
  });

  const onSubmit = async (values: CheckoutForm) => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = uuidv4();

      const { data: order } = await api.post(
        '/orders',
        {
          items: items.map(i => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            sizeLabel: i.sizeLabel,
            addOns: i.addOns,
          })),
          deliveryAddress: {
            lat: parseFloat(values.lat),
            lng: parseFloat(values.lng),
            addressLine: values.addressLine,
            landmark: values.landmark,
          },
          payment: { method: 'cod' },
        },
        { headers: { 'idempotency-key': idempotencyKey } },
      );

      clear(); // Clear cart only after successful order
      toast.success(`Order #${order.orderNumber} placed!`);
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart', { replace: true });
    return null;
  }

  const displayTotal = items.reduce((s, i) => s + i.unitPricePaisa * i.quantity, 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        <h1>Checkout</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Order summary */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Order Summary</p>
          {items.map(item => (
            <div key={`${item.menuItemId}:${item.sizeLabel}`} className={styles.summaryRow}>
              <span>{item.name} × {item.quantity}</span>
              <span>{formatMoneyCompact(item.unitPricePaisa * item.quantity)}</span>
            </div>
          ))}
          <div className={styles.summaryTotal}>
            <span>Total (est.)</span>
            <span>{formatMoneyCompact(displayTotal)}</span>
          </div>
          <p className={styles.priceNote}>Server will validate exact price</p>
        </div>

        {/* Delivery address */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Delivery Address</p>

          <div className={styles.fieldGroup}>
            <label className="label">Address</label>
            <textarea
              className={`input ${styles.textarea}`}
              placeholder="House #, Street, Area, City"
              rows={3}
              {...register('addressLine', { required: 'Address is required', minLength: { value: 10, message: 'Please enter a full address' } })}
            />
            {errors.addressLine && <p className="error-text">{errors.addressLine.message}</p>}
          </div>

          <div className={styles.fieldGroup}>
            <label className="label">Landmark (optional)</label>
            <input className="input" placeholder="Near mosque, school, etc." {...register('landmark')} />
          </div>

          <div className={styles.coordRow}>
            <div className={styles.coordField}>
              <label className="label">Latitude</label>
              <input className="input" type="number" step="any" {...register('lat', { required: true })} />
            </div>
            <div className={styles.coordField}>
              <label className="label">Longitude</label>
              <input className="input" type="number" step="any" {...register('lng', { required: true })} />
            </div>
          </div>
          <p className={styles.coordHint}>📍 Coordinates auto-filled — or enter your location</p>
        </div>

        {/* Payment */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Payment</p>
          <div className={styles.paymentOption}>
            <span className={styles.paymentIcon}>💵</span>
            <div>
              <p className={styles.paymentName}>Cash on Delivery</p>
              <p className={styles.paymentDesc}>Pay when your order arrives</p>
            </div>
            <span className={styles.paymentCheck}>✓</span>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ margin: '0 16px 32px' }}>
          {loading ? 'Placing order…' : `Place Order · ${formatMoneyCompact(displayTotal)}`}
        </button>
      </form>
    </div>
  );
}
