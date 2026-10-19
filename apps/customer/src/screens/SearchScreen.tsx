import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';
import BottomNav from '@/components/BottomNav';
import styles from './SearchScreen.module.css';

export default function SearchScreen() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', q],
    queryFn: () => q.trim().length >= 2 ? api.get(`/menu/search?q=${encodeURIComponent(q)}`).then(r => r.data) : [],
    enabled: q.trim().length >= 2,
    staleTime: 0,
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        <input
          className={styles.input}
          placeholder="Search food…"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
        />
        {q && <button className={styles.clear} onClick={() => setQ('')}>✕</button>}
      </div>

      {q.trim().length < 2 && (
        <div className={styles.hint}>Type at least 2 characters to search</div>
      )}

      {isFetching && <div className={styles.hint}>Searching…</div>}

      <div className={styles.results}>
        {(results as any[]).map((item: any) => (
          <div key={item._id} className={styles.row} onClick={() => navigate(`/menu/${item._id}`)}>
            <span className={styles.emoji}>{item.emoji ?? '🍔'}</span>
            <div>
              <p className={styles.name}>{item.name}</p>
              <p className={styles.price}>{formatMoneyCompact(item.basePrice)}</p>
            </div>
          </div>
        ))}
        {!isFetching && q.trim().length >= 2 && (results as any[]).length === 0 && (
          <div className={styles.hint}>No results for "{q}"</div>
        )}
      </div>

      <BottomNav active="menu" />
    </div>
  );
}
