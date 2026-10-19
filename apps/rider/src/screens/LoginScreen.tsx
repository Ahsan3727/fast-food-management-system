import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useRiderAuthStore } from '@/store/auth.store';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { setTokens, setRider } = useRiderAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ identifier: string; password: string }>();

  const onSubmit = async (values: { identifier: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      setTokens(data.accessToken, data.refreshToken);
      const me = await api.get('/users/me');
      if (me.data.user.role !== 'rider') {
        toast.error('Not a rider account');
        return;
      }
      setRider(me.data.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.logo}>🏍️</span>
        <h1>Rider Portal</h1>
        <p>FastFood Delivery Partner</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div>
            <label className={styles.label}>Phone or Email</label>
            <input className="input" placeholder="+923001234567" {...register('identifier', { required: true })} />
            {errors.identifier && <p className={styles.error}>Required</p>}
          </div>
          <div>
            <label className={styles.label}>Password</label>
            <input type="password" className="input" placeholder="••••••••" {...register('password', { required: true })} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
