import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useAuthStore } from '@/store/auth.store';
import { SocketEvents } from '@fastfood/shared-types';
import api, { SOCKET_URL } from '@/lib/api';
import L from 'leaflet';
import styles from './TrackOrderScreen.module.css';

// Custom rider marker
const riderIcon = L.divIcon({
  html: '<div style="font-size:32px;line-height:1">🏍️</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: '',
});

const homeIcon = L.divIcon({
  html: '<div style="font-size:28px;line-height:1">🏠</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  className: '',
});

export default function TrackOrderScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: 15_000,
  });

  const { data: otp } = useQuery({
    queryKey: ['order-otp', id],
    queryFn: () => api.get(`/orders/${id}/otp`).then(r => r.data),
    enabled: !!id && order?.status === 'PICKED_UP',
  });

  // Socket.IO for live rider location
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

    socket.on(SocketEvents.RIDER_LOCATION_UPDATE, (data: { lat: number; lng: number }) => {
      setRiderPos({ lat: data.lat, lng: data.lng });
    });

    return () => { socket.disconnect(); };
  }, [accessToken, id]);

  const deliveryLat = order?.deliveryAddress?.lat ?? 31.5204;
  const deliveryLng = order?.deliveryAddress?.lng ?? 74.3587;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(`/orders/${id}`)}>←</button>
        <div>
          <h1>Track Order #{order?.orderNumber}</h1>
          <p className={styles.status}>
            {order?.status === 'PICKED_UP' ? '🏍️ Rider on the way!' :
             order?.status === 'RIDER_ASSIGNED' ? '🔔 Rider heading to restaurant' :
             order?.status === 'DELIVERED' ? '🎉 Delivered!' : order?.status}
          </p>
        </div>
      </div>

      {/* Live map */}
      <div className={styles.mapWrap}>
        <MapContainer
          center={[deliveryLat, deliveryLng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          <Marker position={[deliveryLat, deliveryLng]} icon={homeIcon}>
            <Popup>Your delivery address</Popup>
          </Marker>
          {riderPos && (
            <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon}>
              <Popup>Rider is here</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* OTP — shown when rider is on the way */}
      {otp && (
        <div className={styles.otpCard}>
          <p className={styles.otpLabel}>Show this code to the rider at delivery</p>
          <p className={styles.otpCode}>{otp}</p>
          <p className={styles.otpHint}>Do not share with anyone else</p>
        </div>
      )}

      {!riderPos && order?.status === 'RIDER_ASSIGNED' && (
        <div className={styles.waitingCard}>
          <p>🏍️ Rider accepted your order! Live tracking starts when they pick up.</p>
        </div>
      )}
    </div>
  );
}
