import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useRiderAuthStore } from '@/store/auth.store';
import { SocketEvents } from '@fastfood/shared-types';
import { formatMoneyCompact } from '@fastfood/utils';
import api, { SOCKET_URL } from '@/lib/api';
import { Icon } from '@/components/Icon';
import RiderBottomNav from '@/components/RiderBottomNav';
import toast from 'react-hot-toast';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { rider, accessToken } = useRiderAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [timer, setTimer] = useState(30);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => api.get('/riders/dashboard').then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: activeOrder } = useQuery({
    queryKey: ['rider-active-order'],
    queryFn: () => api.get('/orders/rider/active').then(r => r.data),
    refetchInterval: 8000,
  });

  // Navigate to active job immediately if assigned
  useEffect(() => {
    if (activeOrder?._id) {
      navigate(`/order/${activeOrder._id}`);
    }
  }, [activeOrder, navigate]);

  // Toggle online status
  const toggleOnline = async () => {
    const newStatus = !isOnline;
    try {
      await api.post('/riders/status', { isOnline: newStatus });
      setIsOnline(newStatus);
      if (newStatus) {
        toast.success('Online · Ready for delivery jobs', { icon: '🟢' });
      } else {
        toast('Offline · Paused receiving orders', { icon: '⏸️' });
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Socket.IO for live delivery requests
  useEffect(() => {
    if (!accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on(SocketEvents.DELIVERY_REQUEST, (data: any) => {
      setPendingRequest(data);
      setTimer(30);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setPendingRequest(null);
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      toast('New delivery job nearby!', {
        icon: '🛵',
        style: {
          background: 'var(--action)',
          color: '#fff',
          fontWeight: 700,
        },
      });
    });

    socket.on(SocketEvents.DELIVERY_REQUEST_CANCELLED, () => {
      setPendingRequest(null);
      if (timerRef.current) clearInterval(timerRef.current);
      toast('Delivery job was reassigned or cancelled');
    });

    return () => {
      socket.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [accessToken]);

  const acceptOrder = async () => {
    if (!pendingRequest) return;
    try {
      await api.post(`/orders/${pendingRequest.orderId}/accept`);
      if (timerRef.current) clearInterval(timerRef.current);
      const acceptedId = pendingRequest.orderId;
      setPendingRequest(null);
      queryClient.invalidateQueries({ queryKey: ['rider-active-order'] });
      navigate(`/order/${acceptedId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not accept order');
      setPendingRequest(null);
    }
  };

  const declineRequest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPendingRequest(null);
  };

  const unsettledCash = dashboard?.unsettledCashPaisa ?? 0;
  const totalDeliveries = dashboard?.totalDeliveries ?? 0;
  const firstName = rider?.name?.split(' ')[0] || 'Rider';

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
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Hi, {firstName}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '2px 0 0' }}>
            FastFood Dispatch Fleet
          </p>
        </div>

        {/* Presence indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: isOnline ? 'var(--ok-bg)' : 'var(--sunken)',
            color: isOnline ? 'var(--ok)' : 'var(--subtle)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isOnline ? 'var(--ok)' : 'var(--subtle)',
              boxShadow: isOnline ? '0 0 6px var(--ok)' : 'none',
            }}
          />
          <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {/* Large 68x40 Sunlight Online Switch Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderRadius: 16,
            background: 'var(--surface)',
            border: `2px solid ${isOnline ? 'var(--ok)' : 'var(--border)'}`,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>
              {isOnline ? 'Ready for Deliveries' : 'You are Offline'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtle)' }}>
              {isOnline
                ? 'System is routing incoming customer orders to you'
                : 'Toggle switch to go online and receive jobs'}
            </div>
          </div>

          {/* 68x40 High-contrast Outdoor Switch */}
          <button
            type="button"
            onClick={toggleOnline}
            style={{
              width: 68,
              height: 40,
              borderRadius: 20,
              background: isOnline ? 'var(--action)' : 'var(--sunken)',
              border: `2px solid ${isOnline ? 'var(--action)' : 'var(--strong)'}`,
              position: 'relative',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
              transition: 'background 0.2s ease',
            }}
            aria-label="Toggle Online Duty Status"
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: isOnline ? 31 : 3,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                transition: 'left 0.2s cubic-bezier(0.2,0,0,1)',
              }}
            />
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.04em' }}>
              Completed Jobs
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              {totalDeliveries}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Total deliveries</div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.04em' }}>
              Cash in Hand
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: unsettledCash > 0 ? 'var(--warn)' : 'var(--text)',
                marginTop: 4,
              }}
            >
              {formatMoneyCompact(unsettledCash)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {unsettledCash > 0 ? 'Unsettled COD cash' : 'All cash settled'}
            </div>
          </div>
        </div>

        {/* Radar Animation / Empty State */}
        {isOnline ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
            {/* Animated Radar Pulse */}
            <div
              style={{
                position: 'relative',
                width: 100,
                height: 100,
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid var(--action)',
                  opacity: 0.3,
                  animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 14,
                  borderRadius: '50%',
                  border: '2px solid var(--action)',
                  opacity: 0.5,
                  animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite 0.6s',
                }}
              />
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--action)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 4px 14px rgba(194,65,12,0.4)',
                }}
              >
                <Icon name="bike" size={26} />
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
              Looking for orders...
            </h3>
            <p style={{ fontSize: 13, color: 'var(--subtle)', margin: 0, maxWidth: 260 }}>
              Stay on this screen. Nearby delivery orders will pop up here with sound.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--sunken)',
                color: 'var(--subtle)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 14,
              }}
            >
              <Icon name="ban" size={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
              You are offline
            </h3>
            <p style={{ fontSize: 13, color: 'var(--subtle)', margin: '0 0 16px', maxWidth: 260 }}>
              Turn your switch ON above when you are on your bike and ready for runs.
            </p>
            <button
              onClick={toggleOnline}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                background: 'var(--action)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Go Online Now
            </button>
          </div>
        )}
      </div>

      {/* Incoming Job 30s Sheet Modal */}
      {pendingRequest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
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
            {/* Header + 30s Timer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--action)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Incoming Order
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 0', color: 'var(--text)' }}>
                  Order #{pendingRequest.orderNumber}
                </h2>
              </div>

              {/* Timer Badge */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--bad-bg)',
                  border: '2px solid var(--bad)',
                  color: 'var(--bad)',
                  fontWeight: 800,
                  fontSize: 16,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {timer}s
              </div>
            </div>

            {/* Job Details Card */}
            <div
              style={{
                background: 'var(--sunken)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 16,
                display: 'grid',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
                  Pickup Restaurant
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                  {pendingRequest.restaurantAddress || 'FastFood Kitchen, Main Boulevard'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
                  Delivery Drop Area
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                  {pendingRequest.dropArea || 'Customer Delivery Address'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
                    Cash to Collect
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                    {formatMoneyCompact(pendingRequest.totalPaisa || 0)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
                    Rider Payout
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ok)', marginTop: 2 }}>
                    {formatMoneyCompact(pendingRequest.estimatedEarningPaisa || 15000)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={declineRequest}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Decline
              </button>

              <button
                type="button"
                onClick={acceptOrder}
                style={{
                  flex: 2,
                  height: 52,
                  borderRadius: 14,
                  border: 'none',
                  background: 'var(--action)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(194,65,12,0.4)',
                }}
              >
                Accept Order
              </button>
            </div>
          </div>
        </div>
      )}

      <RiderBottomNav active="jobs" />
    </div>
  );
}
