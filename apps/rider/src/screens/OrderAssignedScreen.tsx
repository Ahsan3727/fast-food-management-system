import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useRiderAuthStore } from '@/store/auth.store';
import { SocketEvents, OrderStatus } from '@fastfood/shared-types';
import { formatMoneyCompact } from '@fastfood/utils';
import api, { SOCKET_URL } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { SlideToConfirm } from '@/components/SlideToConfirm';
import { DeliveryOtpInput } from '@/components/DeliveryOtpInput';
import toast from 'react-hot-toast';
import L from 'leaflet';

const restaurantIcon = L.divIcon({
  html: '<div style="width:34px;height:34px;border-radius:50%;background:#c2410c;color:#fff;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.3);font-size:16px">🏪</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  className: '',
});

const dropIcon = L.divIcon({
  html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 4px;background:#1d4ed8;color:#fff;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.3);transform:rotate(-45deg)"><span style="transform:rotate(45deg);font-size:16px">🏠</span></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  className: '',
});

const RESTAURANT_LAT = 31.5204;
const RESTAURANT_LNG = 74.3587;

const FAILED_REASONS = [
  'Customer unreachable / Phone switched off',
  'Incorrect / Incomplete delivery address',
  'Customer refused to accept order',
  'Customer refused to pay cash on delivery',
  'Customer cancelled at doorstep',
  'Other delivery issue',
];

export default function OrderAssignedScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useRiderAuthStore();
  const socketRef = useRef<Socket | null>(null);

  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cashCollected, setCashCollected] = useState('');
  const [pickingUp, setPickingUp] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedReason, setFailedReason] = useState(FAILED_REASONS[0]);

  const { data: order, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: 10000,
  });

  // Pre-fill cash collected with order total if not edited
  useEffect(() => {
    if (order?.totalPaisa && !cashCollected) {
      setCashCollected(String((order.totalPaisa / 100).toFixed(0)));
    }
  }, [order?.totalPaisa]); // eslint-disable-line

  // Emit rider live GPS coordinates every 4s
  useEffect(() => {
    if (!accessToken || !id) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:order', { orderId: id });
    });

    let watchId: number | null = null;
    let lastEmit = 0;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          const now = Date.now();
          if (now - lastEmit < 4000) return;
          lastEmit = now;
          socket.emit(SocketEvents.RIDER_LOCATION_EMIT, {
            orderId: id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        err => console.warn('Geolocation:', err),
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }

    return () => {
      socket.disconnect();
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [accessToken, id]);

  const markPickedUp = async () => {
    setPickingUp(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: OrderStatus.PICKED_UP });
      toast.success('Picked up! Heading to customer doorstep', { icon: '🛵' });
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setPickingUp(false);
    }
  };

  const markDelivered = async () => {
    if (otpInput.trim().length !== 6) {
      setOtpError('Please enter the customer 6-digit delivery OTP code');
      toast.error('Please enter the customer 6-digit OTP');
      return;
    }
    const cash = parseFloat(cashCollected) * 100;
    if (isNaN(cash) || cash < 0) {
      toast.error('Please enter valid cash collected amount');
      return;
    }

    setDelivering(true);
    try {
      await api.post(`/orders/${id}/deliver`, {
        otp: otpInput.trim(),
        cashCollectedPaisa: Math.round(cash),
      });
      toast.success('Order Delivered & Cash Collected!', {
        icon: '🎉',
        style: { background: 'var(--ok)', color: '#fff', fontWeight: 700 },
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid OTP code. Please verify with customer.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setDelivering(false);
    }
  };

  const submitFailedDelivery = async () => {
    try {
      await api.patch(`/orders/${id}/status`, {
        status: OrderStatus.DELIVERY_FAILED,
        reason: failedReason,
      });
      toast.error('Order marked as delivery failed');
      setShowFailedModal(false);
      navigate('/', { replace: true });
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (!order) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg)',
          color: 'var(--subtle)',
        }}
      >
        Loading assignment details...
      </div>
    );
  }

  const dropLat = order.deliveryAddress?.lat ?? RESTAURANT_LAT;
  const dropLng = order.deliveryAddress?.lng ?? RESTAURANT_LNG;
  const isPickedUp = order.status === OrderStatus.PICKED_UP;

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

      {/* Header */}
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
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Order #{order.orderNumber}
            </h1>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 2 }}>
              {isPickedUp ? 'Phase 2: Delivering to Customer' : 'Phase 1: Head to Restaurant'}
            </div>
          </div>
        </div>

        <StatusBadge status={order.status} />
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {/* Leaflet Map Preview */}
        <div
          style={{
            position: 'relative',
            height: 200,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            marginBottom: 16,
          }}
        >
          <MapContainer
            center={[RESTAURANT_LAT, RESTAURANT_LNG]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            <Marker position={[RESTAURANT_LAT, RESTAURANT_LNG]} icon={restaurantIcon}>
              <Popup>Pickup: FastFood Kitchen</Popup>
            </Marker>
            <Marker position={[dropLat, dropLng]} icon={dropIcon}>
              <Popup>Drop: Customer</Popup>
            </Marker>
          </MapContainer>

          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 1000,
              background: 'rgba(28,25,23,0.85)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#4ade80',
              }}
            />
            {isPickedUp ? 'Heading to Customer Drop' : 'Heading to Kitchen Pickup'}
          </div>
        </div>

        {/* Phase 1: Restaurant Pickup Information */}
        {!isPickedUp && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--action)', letterSpacing: '0.04em' }}>
              Pickup Location
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: '4px 0 2px', color: 'var(--text)' }}>
              FastFood Kitchen
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
              Main Boulevard, Gulberg, Lahore
            </p>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtle)', marginBottom: 6 }}>
                Items to Pick Up ({order.items?.length || 0}):
              </div>
              {order.items?.map((item: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: 'var(--text)',
                    padding: '4px 0',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {item.quantity}x {item.name}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>
                    {item.sizeLabel ? `(${item.sizeLabel})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 2: Customer Delivery Information & COD Banner */}
        {isPickedUp && (
          <>
            {/* COD Cash Banner */}
            <div
              style={{
                background: 'var(--action)',
                color: '#fff',
                borderRadius: 16,
                padding: 18,
                marginBottom: 16,
                boxShadow: '0 4px 16px rgba(194,65,12,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Icon name="cash" size={18} />
                <span>Cash to Collect</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em' }}>
                {formatMoneyCompact(order.totalPaisa)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                Collect exact cash from customer before handing over the food package.
              </div>
            </div>

            {/* Customer Address Details */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.04em' }}>
                    Customer Destination
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '4px 0 2px', color: 'var(--text)' }}>
                    {order.customer?.name || 'Customer'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                    {order.deliveryAddress?.addressLine}
                  </p>
                  {order.deliveryAddress?.landmark && (
                    <p style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 2 }}>
                      Landmark: {order.deliveryAddress.landmark}
                    </p>
                  )}
                </div>

                {order.customer?.phone && (
                  <a
                    href={`tel:${order.customer.phone}`}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'var(--sunken)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'none',
                    }}
                  >
                    <Icon name="phone" size={14} /> Call
                  </a>
                )}
              </div>
            </div>

            {/* Doorstep OTP Verification & Cash Input */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 18,
                marginBottom: 16,
              }}
            >
              <DeliveryOtpInput
                value={otpInput}
                onChange={val => {
                  setOtpInput(val);
                  if (otpError) setOtpError(null);
                }}
                error={otpError}
                disabled={delivering}
              />

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <label
                  htmlFor="cash-collected-input"
                  style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}
                >
                  Cash Amount Collected (Rs.)
                </label>
                <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '0 0 8px' }}>
                  Expected COD cash: {formatMoneyCompact(order.totalPaisa)}
                </p>
                <input
                  id="cash-collected-input"
                  type="number"
                  value={cashCollected}
                  onChange={e => setCashCollected(e.target.value)}
                  disabled={delivering}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 10,
                    border: '1.5px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 16,
                    fontWeight: 700,
                    padding: '0 14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div
        style={{
          padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        {!isPickedUp ? (
          <SlideToConfirm
            label="Slide to Confirm Pickup"
            onConfirm={markPickedUp}
            loading={pickingUp}
            variant="action"
          />
        ) : (
          <>
            <SlideToConfirm
              label="Slide to Complete Delivery"
              onConfirm={markDelivered}
              loading={delivering}
              disabled={delivering || otpInput.trim().length !== 6}
              variant="success"
            />

            <button
              type="button"
              onClick={() => setShowFailedModal(true)}
              disabled={delivering}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: 'none',
                color: 'var(--bad)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 2,
              }}
            >
              Report Delivery Issue / Failed...
            </button>
          </>
        )}
      </div>

      {/* Reason-Gated Delivery Failed Modal */}
      {showFailedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fail-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-overlay, rgba(0,0,0,0.7))',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--raised)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              boxShadow: '0 -12px 32px rgba(0,0,0,0.3)',
            }}
          >
            <h2 id="fail-dialog-title" style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: 'var(--text)' }}>
              Report Delivery Issue
            </h2>
            <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '0 0 16px' }}>
              Select the exact reason why this order could not be handed over.
            </p>

            <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
              {FAILED_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setFailedReason(r)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1px solid ${failedReason === r ? 'var(--bad)' : 'var(--border)'}`,
                    background: failedReason === r ? 'var(--bad-bg)' : 'transparent',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontWeight: failedReason === r ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowFailedModal(false)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back to Order
              </button>
              <button
                onClick={submitFailedDelivery}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--bad)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Confirm Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
