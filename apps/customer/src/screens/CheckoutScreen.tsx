import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { formatMoneyCompact } from '@fastfood/utils';
import { Icon } from '@/components/Icon';
import { v4 as uuidv4 } from 'uuid';

interface CheckoutForm {
  customerName: string;
  customerPhone: string;
  addressLine: string;
  landmark?: string;
  lat: number;
  lng: number;
}

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { items, clear, displayTotalPaisa } = useCartStore();
  const { customerName, customerPhone, defaultAddress, setCustomerProfile, setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState<{ x: number; y: number }>({ x: 34, y: 58 });
  const [locConfirmed, setLocConfirmed] = useState(true);

  const subtotalPaisa = displayTotalPaisa();
  const deliveryPaisa = subtotalPaisa >= 100000 ? 0 : 10000;
  const totalWithDelivery = subtotalPaisa + deliveryPaisa;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      addressLine: defaultAddress || '',
      landmark: '',
      lat: 31.5204,
      lng: 74.3587,
    },
  });

  const addressValue = watch('addressLine');

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast('Detecting location...', { icon: '📍' });
    navigator.geolocation.getCurrentPosition(
      pos => {
        setValue('lat', pos.coords.latitude);
        setValue('lng', pos.coords.longitude);
        setPin({ x: 42, y: 64 });
        setLocConfirmed(true);
        if (!addressValue) {
          setValue('addressLine', 'Current GPS Location, Lahore');
        }
        toast.success('Location updated');
      },
      () => {
        toast.error('Could not retrieve GPS location');
      },
      { timeout: 10000 }
    );
  };

  const handleFillSaved = (addr: string) => {
    setValue('addressLine', addr);
    setLocConfirmed(true);
  };

  const onSubmit = async (values: CheckoutForm) => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      // 1. Save customer details in local store (auto-persists in browser)
      setCustomerProfile({
        name: values.customerName.trim(),
        phone: values.customerPhone.trim(),
        defaultAddress: values.addressLine.trim(),
      });

      // 2. Ensure customer session is active for the current phone
      const token = useAuthStore.getState().accessToken;
      const currentUser = useAuthStore.getState().user;
      if (!token || currentUser?.phone !== values.customerPhone.trim()) {
        const { data: session } = await api.post('/auth/customer-session', {
          name: values.customerName.trim(),
          phone: values.customerPhone.trim(),
        });
        setTokens(session.accessToken, session.refreshToken);
        if (session.user) setUser(session.user);
      }

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
            lat: Number(values.lat) || 31.5204,
            lng: Number(values.lng) || 74.3587,
            addressLine: values.addressLine,
            landmark: values.landmark || undefined,
          },
          payment: { method: 'cod' },
        },
        { headers: { 'idempotency-key': idempotencyKey } }
      );

      clear();
      toast.success(`Order #${order.orderNumber} placed!`);
      navigate(`/orders/${order._id}/track`, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

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
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Checkout</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {/* Contact Information */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: 'var(--text)' }}>
              Contact Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {/* Customer Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ali Khan"
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: `1px solid ${errors.customerName ? 'var(--bad)' : 'var(--border)'}`,
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                  {...register('customerName', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
                {errors.customerName && (
                  <p style={{ fontSize: 12, color: 'var(--bad)', margin: '4px 0 0' }}>
                    {errors.customerName.message}
                  </p>
                )}
              </div>

              {/* Customer Phone */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 03001234567"
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: `1px solid ${errors.customerPhone ? 'var(--bad)' : 'var(--border)'}`,
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                  {...register('customerPhone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^(\+92|0)?3\d{9}$/,
                      message: 'Enter a valid 11-digit mobile number (e.g. 03001234567)',
                    },
                  })}
                />
                {errors.customerPhone && (
                  <p style={{ fontSize: 12, color: 'var(--bad)', margin: '4px 0 0' }}>
                    {errors.customerPhone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Deliver To Section */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: 'var(--text)' }}>
              Deliver to
            </h2>

            {/* Map Preview Graphic */}
            <div
              style={{
                position: 'relative',
                height: 180,
                borderRadius: 14,
                overflow: 'hidden',
                background: 'var(--sunken)',
                border: '1px solid var(--border)',
                marginBottom: 10,
              }}
            >
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                viewBox="0 0 300 200"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 60H300M0 140H300M80 0V200M210 0V200M0 190 300 20"
                  stroke="var(--border)"
                  strokeWidth="8"
                  fill="none"
                />
              </svg>

              {/* Restaurant Pin */}
              <div
                style={{
                  position: 'absolute',
                  left: '78%',
                  top: '26%',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--action)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
                title="Restaurant"
              >
                <Icon name="store" size={16} />
              </div>

              {/* Customer Home Pin */}
              <div
                style={{
                  position: 'absolute',
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#1d4ed8',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
                title="Delivery Location"
              >
                <Icon name="pin" size={18} />
              </div>

              <span
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 6,
                  fontSize: 11,
                  background: 'rgba(0,0,0,0.4)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  color: '#fff',
                }}
              >
                Interactive Pin
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleUseMyLocation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Icon name="locate" size={16} />
                Use my location
              </button>
            </div>

            {/* Address Input */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                Street Address *
              </label>
              <textarea
                rows={2}
                placeholder="House / Flat #, Street, Area name..."
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${errors.addressLine ? 'var(--bad)' : 'var(--border)'}`,
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'none',
                }}
                {...register('addressLine', {
                  required: 'Delivery address is required',
                  minLength: {
                    value: 10,
                    message: 'Please enter a full address (at least 10 characters)',
                  },
                })}
              />
              {errors.addressLine && (
                <p style={{ fontSize: 12, color: 'var(--bad)', margin: '4px 0 0' }}>
                  {errors.addressLine.message}
                </p>
              )}
            </div>

            {/* Landmark Input */}
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                Landmark <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--subtle)' }}>(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Near mosque, park, or market..."
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                }}
                {...register('landmark')}
              />
            </div>

            {/* Saved Address Chips */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => handleFillSaved('House 14, Street 6, Gulberg III, Lahore')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Icon name="home" size={14} /> Home
              </button>
              <button
                type="button"
                onClick={() => handleFillSaved('Office 3B, MM Alam Road, Gulberg, Lahore')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Icon name="store" size={14} /> Work
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: 'var(--text)' }}>
              Payment Method
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 12,
                border: '2px solid var(--action)',
                background: 'var(--sunken)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--action)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name="cash" size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    Cash on Delivery (COD)
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtle)' }}>
                    Pay {formatMoneyCompact(totalWithDelivery)} in cash upon delivery
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--action)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name="check" size={12} />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>
              Order Breakdown
            </h3>

            {items.map(item => (
              <div
                key={`${item.menuItemId}:${item.sizeLabel || ''}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--muted)',
                  marginBottom: 6,
                }}
              >
                <span>
                  {item.quantity}x {item.name}
                  {item.sizeLabel ? ` (${item.sizeLabel})` : ''}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {formatMoneyCompact(item.unitPricePaisa * item.quantity)}
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <span>Delivery Fee</span>
              <span style={{ fontWeight: 600, color: deliveryPaisa === 0 ? 'var(--ok)' : 'var(--text)' }}>
                {deliveryPaisa === 0 ? 'FREE' : formatMoneyCompact(deliveryPaisa)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
              <span>Total to Pay</span>
              <span style={{ color: 'var(--action)' }}>{formatMoneyCompact(totalWithDelivery)}</span>
            </div>
          </div>
        </div>

        {/* Sticky Foot */}
        <div
          style={{
            padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Placing order...' : `Place Order · ${formatMoneyCompact(totalWithDelivery)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
