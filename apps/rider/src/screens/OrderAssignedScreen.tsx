import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useRiderAuthStore } from '@/store/auth.store';
import { SocketEvents } from '@fastfood/shared-types';
import { formatMoneyCompact } from '@fastfood/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import L from 'leaflet';
import styles from './OrderAssignedScreen.module.css';

const restaurantIcon = L.divIcon({ html: '<span style="font-size:28px">🏪</span>', iconSize: [28, 28], iconAnchor: [14, 28], className: '' });
const dropIcon = L.divIcon({ html: '<span style="font-size:28px">🏠</span>', iconSize: [28, 28], iconAnchor: [14, 28], className: '' });

const RESTAURANT_LAT = parseFloat(import.meta.env.VITE_RESTAURANT_LAT ?? '31.5204');
const RESTAURANT_LNG = parseFloat(import.meta.env.VITE_RESTAURANT_LNG ?? '74.3587');

export default function OrderAssignedScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useRiderAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [cashCollected, setCashCollected] = useState('');

  const { data: order, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: 10_000,
  });

  // Emit location every 5s while on this screen
  useEffect(() => {
    if (!accessToken || !id) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000', {
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
        (pos) => {
          const now = Date.now();
          if (now - lastEmit < 4000) return; // 4s rate limit
          lastEmit = now;
          socket.emit(SocketEvents.RIDER_LOCATION_EMIT, {
            orderId: id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.warn('Geolocation:', err),
        { enableHighAccuracy: true, maximumAge: 3000 },
      );
    }

    return () => {
      socket.disconnect();
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [accessToken, id]);

  const markPickedUp = async () => {
    try {
      await api.patch(`/orders/${id}/status`, { status: 'PICKED_UP' });
      toast.success('Marked as picked up!');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed');
    }
  };

  const markDelivered = async () => {
    if (!otpInput.trim()) { toast.error('Enter the OTP'); return; }
    const cash = parseFloat(cashCollected) * 100; // convert Rs → paisa
    if (isNaN(cash)) { toast.error('Enter cash collected amount'); return; }

    setDelivering(true);
    try {
      await api.post(`/orders/${id}/deliver`, { otp: otpInput, cashCollectedPaisa: Math.round(cash) });
      toast.success('🎉 Delivered!');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Delivery failed');
    } finally {
      setDelivering(false);
    }
  };

  const markFailed = async () => {
    try {
      await api.patch(`/orders/${id}/status`, { status: 'DELIVERY_FAILED', note: 'Customer unavailable' });
      navigate('/', { replace: true });
    } catch { toast.error('Failed'); }
  };

  if (!order) return <div className={styles.loading}>Loading…</div>;

  const dropLat = order.deliveryAddress?.lat ?? RESTAURANT_LAT;
  const dropLng = order.deliveryAddress?.lng ?? RESTAURANT_LNG;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/')}>←</button>
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <p className={styles.status}>{order.status.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Map */}
      <div className={styles.mapWrap}>
        <MapContainer center={[RESTAURANT_LAT, RESTAURANT_LNG]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[RESTAURANT_LAT, RESTAURANT_LNG]} icon={restaurantIcon}>
            <Popup>Pickup: Restaurant</Popup>
          </Marker>
          <Marker position={[dropLat, dropLng]} icon={dropIcon}>
            <Popup>Drop: Customer</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Order info */}
      <div className={styles.card}>
        <div className={styles.infoRow}>
          <span>🏠 Drop Address</span>
          <span className={styles.address}>{order.deliveryAddress?.addressLine}</span>
        </div>
        <div className={styles.infoRow}>
          <span>💰 Amount</span>
          <span className={styles.amount}>{formatMoneyCompact(order.totalPaisa)}</span>
        </div>

        {/* Items */}
        <div className={styles.items}>
          {order.items?.map((item: any, i: number) => (
            <span key={i} className={styles.itemChip}>{item.name} ×{item.quantity}</span>
          ))}
        </div>
      </div>

      {/* Action buttons based on status */}
      <div className={styles.actions}>
        {order.status === 'RIDER_ASSIGNED' && (
          <button className="btn-primary" onClick={markPickedUp}>
            📦 Mark as Picked Up
          </button>
        )}

        {order.status === 'PICKED_UP' && (
          <div className={styles.deliverSection}>
            <p className={styles.deliverLabel}>Enter customer OTP to confirm delivery</p>
            <input
              className="input"
              placeholder="6-digit OTP"
              maxLength={6}
              value={otpInput}
              onChange={e => setOtpInput(e.target.value)}
              style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center' }}
            />
            <input
              className="input"
              placeholder="Cash collected (Rs.)"
              type="number"
              value={cashCollected}
              onChange={e => setCashCollected(e.target.value)}
            />
            <button className="btn-success" onClick={markDelivered} disabled={delivering}>
              {delivering ? 'Confirming…' : '✅ Confirm Delivery'}
            </button>
            <button className="btn-danger" onClick={markFailed} style={{ marginTop: 8 }}>
              ❌ Delivery Failed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
