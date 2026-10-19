import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import styles from './Auth.module.css';

interface SignupForm {
  name: string;
  phone: string;
  email?: string;
  password: string;
  confirm: string;
}

export default function SignupScreen() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupForm>();

  const onSubmit = async ({ name, phone, email, password }: SignupForm) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, phone, email, password });
      setTokens(data.accessToken, data.refreshToken);
      const me = await api.get('/users/me');
      setUser(me.data.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.logo}>🍔</div>
        <h1 className={styles.brand}>FastFood</h1>
        <p className={styles.tagline}>Create your account</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>Get started</h2>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="Ahsan Ali"
              {...register('name', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })} />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input className="input" placeholder="+923001234567"
              {...register('phone', { required: 'Required', minLength: { value: 10, message: 'Invalid phone' } })} />
            {errors.phone && <p className="error-text">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Email (optional)</label>
            <input className="input" placeholder="you@email.com"
              {...register('email')} />
          </div>

          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Min 8 characters"
              {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input type="password" className="input" placeholder="Repeat password"
              {...register('confirm', {
                required: 'Required',
                validate: (v) => v === watch('password') || 'Passwords do not match',
              })} />
            {errors.confirm && <p className="error-text">{errors.confirm.message}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
