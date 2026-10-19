import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import styles from './Auth.module.css';

interface LoginForm {
  identifier: string;
  password: string;
}

export default function LoginScreen() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      setTokens(data.accessToken, data.refreshToken);
      const me = await api.get('/users/me');
      setUser(me.data.user);
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
        <div className={styles.logo}>🍔</div>
        <h1 className={styles.brand}>FastFood</h1>
        <p className={styles.tagline}>Fresh, fast, and delivered</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>Welcome back</h2>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div>
            <label className="label">Phone or Email</label>
            <input
              className="input"
              placeholder="+92300xxxxxxx or you@email.com"
              {...register('identifier', { required: 'Required' })}
            />
            {errors.identifier && <p className="error-text">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
            />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
