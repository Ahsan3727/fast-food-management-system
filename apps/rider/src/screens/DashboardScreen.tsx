import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useRiderAuthStore } from '@/store/auth.store';
import { SocketEvents } from '@fastfood/shared-types';
import { formatMoneyCompact } from '@fastfood/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import styles from './DashboardScreen.module.css';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { rider, accessToken, logout } = useRiderAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [timer, setTimer] = useState(30);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => api.get('/riders/dashboard').then(r => r.data),
  });

  const { data: activeOrder } = useQuery({
    queryKey: ['rider-active-order'],
    queryFn: () => api.get('/orders/rider/active').then(r => r.data),
    refetchInterval: 10_000,
  });

  // Go to active order if one exists
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
      toast.success(newStatus ? '✅ You are now online' : '⏸️ You are offline');
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Socket.IO for delivery requests
  useEffect(() => {
    if (!accessToken) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on(SocketEvents.DELIVERY_REQUEST, (data: any) => {
      setPendingRequest(data);
      setTimer(30);

      // Auto-decline after 30s
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

      toast('🛵 New delivery request!');
    });

    socket.on(SocketEvents.DELIVERY_REQUEST_CANCELLED, () => {
      setPendingRequest(null);
      clearInterval(timerRef.current!);
      toast('Order was cancelled');
    });

    return () => {
      socket.disconnect();
      clearInterval(timerRef.current!);
    };
  }, [accessToken]);

  const acceptOrder = async () => {
    if (!pendingRequest) return;
    try {
      await api.post(`/orders/${pendingRequest.orderId}/accept`);
      clearInterval(timerRef.current!);
      setPendingRequest(null);
      queryClient.invalidateQueries({ queryKey: ['rider-active-order'] });
      navigate(`/order/${pendingRequest.orderId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not accept order');
      setPendingRequest(null);
    }
  };

  const declineRequest = () => {
    clearInterval(timerRef.current!);
    setPendingRequest(null);
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } finally { logout(); }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>Hi, {rider?.name?.split(' ')[0]} 🏍️</p>
          <p className={styles.sub}>Rider Dashboard</p>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
      </div>

      {/* Online toggle */}
      <div className={styles.onlineCard}>
        <div className={styles.onlineInfo}>
          <div className={`${styles.statusDot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
          <div>
            <p className={styles.statusLabel}>{isOnline ? 'Online' : 'Offline'}</p>
            <p className={styles.statusSub}>{isOnline ? 'Accepting orders' : 'Tap to go online'}</p>
          </div>
        </div>
        <button
          className={`${styles.toggleBtn} ${isOnline ? styles.toggleOff : styles.toggleOn}`}
          onClick={toggleOnline}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <p className={styles.statVal}>{dashboard?.totalDeliveries ?? 0}</p>
          <p className={styles.statLabel}>Total Deliveries</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statVal}>{formatMoneyCompact(dashboard?.unsettledCashPaisa ?? 0)}</p>
          <p className={styles.statLabel}>Unsettled Cash</p>
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navList}>
        <button className={styles.navItem} onClick={() => navigate('/earnings')}>
          💰 Earnings History <span>›</span>
        </button>
        <button className={styles.navItem} onClick={() => navigate('/profile')}>
          👤 Profile <span>›</span>
        </button>
      </div>

      {/* Delivery request modal */}
      {pendingRequest && (
        <div className={styles.requestOverlay}>
          <div className={styles.requestCard}>
            <div className={styles.requestTimer}>{timer}s</div>
            <h2 className={styles.requestTitle}>New Delivery Request!</h2>
            <p className={styles.requestOrderNum}>Order #{pendingRequest.orderNumber}</p>

            <div className={styles.requestDetail}>
              <p className={styles.requestLabel}>Pickup</p>
              <p>{pendingRequest.restaurantAddress}</p>
            </div>
            <div className={styles.requestDetail}>
              <p className={styles.requestLabel}>Drop area</p>
              <p>{pendingRequest.dropArea}</p>
            </div>
            <div className={styles.requestDetail}>
              <p className={styles.requestLabel}>Estimated earning</p>
              <p className={styles.requestEarning}>{formatMoneyCompact(pendingRequest.estimatedEarningPaisa)}</p>
            </div>

            <div className={styles.requestActions}>
              <button className="btn-danger" style={{ flex: 1 }} onClick={declineRequest}>Decline</button>
              <button className="btn-success" style={{ flex: 1 }} onClick={acceptOrder}>Accept</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
