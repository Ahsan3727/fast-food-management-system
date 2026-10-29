import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useAuthStore } from '@/store/auth.store';
import { SocketEvents, STATUS_META, OrderStatus } from '@fastfood/shared-types';
import api, { SOCKET_URL } from '@/lib/api';
import { Icon, IconName } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import toast from 'react-hot-toast';
import L from 'leaflet';

const storeIcon = L.divIcon({
  html: '<div style="width:34px;height:34px;border-radius:50%;background:#9a3412;color:#fff;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.3);font-size:16px">🏪</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  className: '',
});

const riderIcon = L.divIcon({
  html: '<div style="width:34px;height:34px;border-radius:50%;background:#7e22ce;color:#fff;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.3);font-size:16px">🏍️</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  className: '',
});

const homeIcon = L.divIcon({
  html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 4px;background:#1d4ed8;color:#fff;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.3);transform:rotate(-45deg)"><span style="transform:rotate(45deg);font-size:16px">🏠</span></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  className: '',
});

const TRACKER_STEPS: { label: string; icon: IconName; stepNumber: number }[] = [
  { label: 'Placed', icon: 'clipboard', stepNumber: 1 },
  { label: 'Accepted', icon: 'check', stepNumber: 2 },
  { label: 'Preparing', icon: 'chef', stepNumber: 3 },
  { label: 'On the way', icon: 'bike', stepNumber: 4 },
  { label: 'Delivered', icon: 'home', stepNumber: 5 },
];

export default function TrackOrderScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: isSocketConnected ? 30000 : 10000,
  });

  const { data: otpData } = useQuery({
    queryKey: ['order-otp', id],
    queryFn: () => api.get(`/orders/${id}/otp`).then(r => r.data),
    enabled:
      !!id &&
      (order?.status === OrderStatus.PICKED_UP ||
        order?.status === OrderStatus.RIDER_ASSIGNED ||
        order?.status === OrderStatus.PREPARING),
  });

  const cancelOrderMutation = useMutation({
    mutationFn: () =>
      api.post(`/orders/${id}/cancel`, {
        reason: cancelReason,
      }),
    onSuccess: () => {
      toast.success('Order cancelled');
      qc.invalidateQueries({ queryKey: ['order', id] });
      setShowCancelModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Could not cancel order'),
  });

  // Socket.IO for live order tracking & rider location
  useEffect(() => {
    if (!accessToken || !id) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit('join:order', { orderId: id });
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on(SocketEvents.ORDER_STATUS, () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
    });

    socket.on(SocketEvents.RIDER_LOCATION_UPDATE, (data: { lat: number; lng: number }) => {
      setRiderPos({ lat: data.lat, lng: data.lng });
    });

    return () => {
      setIsSocketConnected(false);
      socket.disconnect();
    };
  }, [accessToken, id, qc]);

  const deliveryLat = order?.deliveryAddress?.lat ?? 31.5204;
  const deliveryLng = order?.deliveryAddress?.lng ?? 74.3587;
  const currentStep = order?.status ? STATUS_META[order.status as OrderStatus]?.step || 1 : 1;
  const statusMeta = order?.status ? STATUS_META[order.status as OrderStatus] : null;

  const otpCode = typeof otpData === 'string' ? otpData : otpData?.otp || order?.deliveryOtp;

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

      {/* Top Header */}
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
            onClick={() => navigate('/orders')}
            style={{
              width: 40,
              height: 40,
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
              Order #{order?.orderNumber || '...'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--ok)',
                  boxShadow: '0 0 6px var(--ok)',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--subtle)' }}>
                {statusMeta?.label || 'Live Tracking'}
              </span>
            </div>
          </div>
        </div>

        {order?.status && <StatusBadge status={order.status} />}
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {/* Map View */}
        <div
          style={{
            position: 'relative',
            height: 220,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            marginBottom: 16,
          }}
        >
          <MapContainer
            center={[deliveryLat, deliveryLng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            <Marker position={[31.5204, 74.3587]} icon={storeIcon}>
              <Popup>FastFood Kitchen</Popup>
            </Marker>
            <Marker position={[deliveryLat, deliveryLng]} icon={homeIcon}>
              <Popup>Your delivery address</Popup>
            </Marker>
            {riderPos && (
              <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon}>
                <Popup>Rider is here</Popup>
              </Marker>
            )}
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
            {riderPos ? 'Live Rider GPS Connected' : 'Waiting for live rider GPS'}
          </div>
        </div>

        {/* Delivery OTP Card (Shown when preparing, rider assigned, or picked up) */}
        {otpCode &&
          (order?.status === OrderStatus.PICKED_UP ||
            order?.status === OrderStatus.RIDER_ASSIGNED ||
            order?.status === OrderStatus.PREPARING) && (
            <div
              style={{
                textAlign: 'center',
                border: '2px dashed var(--action)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                background: 'var(--surface)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--action)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Doorstep Delivery Code
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: '0.4em',
                  paddingLeft: '0.4em',
                  fontFamily: 'monospace',
                  color: 'var(--text)',
                  margin: '8px 0',
                }}
              >
                {otpCode}
              </div>
              <p style={{ fontSize: 12, color: 'var(--subtle)', margin: 0 }}>
                Show this code to the rider at delivery. Don't share it with anyone else.
              </p>
            </div>
          )}

        {/* 5-Step Progress Tracker */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 20 }}>
            {/* Background connecting line */}
            <div
              style={{
                position: 'absolute',
                top: 17,
                left: '10%',
                right: '10%',
                height: 3,
                background: 'var(--border)',
                zIndex: 1,
              }}
            />

            {TRACKER_STEPS.map(step => {
              const isCompleted = step.stepNumber <= currentStep;
              const isCurrent = step.stepNumber === currentStep;

              return (
                <div
                  key={step.label}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--action-bg)' : 'var(--surface)',
                      border: `2px solid ${isCompleted ? 'var(--action)' : 'var(--border)'}`,
                      color: isCompleted ? 'var(--action-fg)' : 'var(--subtle)',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: isCurrent ? '0 0 0 5px rgba(194,65,12,0.25)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon name={step.icon} size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--text)' : 'var(--subtle)',
                      textAlign: 'center',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'var(--sunken)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
              {statusMeta?.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.4 }}>
              {statusMeta?.customerDescription}
            </div>
          </div>
        </div>

        {/* Rider Info Card (If rider assigned) */}
        {order?.rider && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--sunken)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  color: 'var(--action)',
                }}
              >
                {order.rider.name?.[0] || 'R'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  {order.rider.name || 'Assigned Rider'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--subtle)' }}>
                  {order.rider.vehicleInfo || 'FastFood Delivery Partner'}
                </div>
              </div>
            </div>

            {order.rider.phone && (
              <a
                href={`tel:${order.rider.phone}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'var(--sunken)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                }}
              >
                <Icon name="phone" size={14} /> Call
              </a>
            )}
          </div>
        )}

        {/* Cancellation Option (When PLACED) */}
        {order?.status === OrderStatus.PLACED && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--bad)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel order...
            </button>
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
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
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              boxShadow: '0 -8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>
              Why do you want to cancel?
            </h3>
            <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
              {['Changed my mind', 'Ordered by mistake', 'Taking too long', 'Other'].map(r => (
                <button
                  key={r}
                  onClick={() => setCancelReason(r)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1px solid ${cancelReason === r ? 'var(--action)' : 'var(--border)'}`,
                    background: cancelReason === r ? 'var(--sunken)' : 'transparent',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: cancelReason === r ? 700 : 500,
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
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Keep Order
              </button>
              <button
                onClick={() => cancelOrderMutation.mutate()}
                disabled={cancelOrderMutation.isPending}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--bad)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {cancelOrderMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
