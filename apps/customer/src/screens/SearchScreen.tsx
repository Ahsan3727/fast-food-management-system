/**
 * SearchScreen — full-text menu search with in-place ItemDetailSheet.
 * Replaces the 59-line stub that navigated to ProductDetailScreen.
 */
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatMoneyCompact } from '@fastfood/utils';
import BottomNav from '@/components/BottomNav';
import { Icon } from '@/components/Icon';
import { SkeletonRow } from '@/components/Skeleton';
import { ItemDetailSheet } from './ItemDetailSheet';
import type { MenuItem } from './MenuScreen';
import styles from './SearchScreen.module.css';

// ── Recent searches persisted to localStorage ─────────────────────────────────
const RECENT_KEY = 'ff-recent-searches';
const MAX_RECENT = 6;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(q: string): void {
  const prev = getRecent();
  const next = [q, ...prev.filter(r => r !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}
function clearRecent(): void { localStorage.removeItem(RECENT_KEY); }

// ─────────────────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigate = useNavigate();
  const inputRef  = useRef<HTMLInputElement>(null);

  const [q,            setQ           ] = useState('');
  const [debounced,    setDebounced   ] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [recent,       setRecent      ] = useState<string[]>(getRecent);

  // Debounce: wait 300 ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Persist non-empty queries to recent list
  useEffect(() => {
    if (debounced.length >= 2) {
      saveRecent(debounced);
      setRecent(getRecent());
    }
  }, [debounced]);

  const { data: results = [], isFetching } = useQuery<MenuItem[]>({
    queryKey: ['search', debounced],
    queryFn:  () =>
      debounced.length >= 2
        ? api.get(`/menu/search?q=${encodeURIComponent(debounced)}`).then(r => r.data)
        : [],
    enabled:   debounced.length >= 2,
    staleTime: 30_000,
  });

  const showRecent  = q.trim().length === 0 && recent.length > 0;
  const showPrompt  = q.trim().length === 0 && recent.length === 0;
  const showEmpty   = !isFetching && debounced.length >= 2 && results.length === 0;
  const showResults = !isFetching && results.length > 0;

  return (
    <div className={styles.page}>

      {/* ── Search header ── */}
      <div className={styles.header}>
        <button
          className={styles.back}
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <Icon name="left" size={20} />
        </button>

        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Search food, categories..."
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
          aria-label="Search menu"
        />

        {q && (
          <button
            className={styles.clear}
            onClick={() => { setQ(''); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Loading */}
        {isFetching && (
          <div>
            {[1, 2, 3, 4, 5].map(n => <SkeletonRow key={n} />)}
          </div>
        )}

        {/* Recent searches */}
        {!isFetching && showRecent && (
          <div>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>Recent</span>
              <button
                className={styles.clearRecentBtn}
                onClick={() => { clearRecent(); setRecent([]); }}
              >
                Clear
              </button>
            </div>
            {recent.map(r => (
              <button
                key={r}
                className={styles.recentRow}
                onClick={() => setQ(r)}
              >
                <Icon name="clock" size={15} />
                <span>{r}</span>
              </button>
            ))}
          </div>
        )}

        {/* First-visit empty state */}
        {showPrompt && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <p className={styles.emptyTitle}>Search the menu</p>
            <p className={styles.emptyText}>
              Type at least 2 characters to find items
            </p>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div>
            <p className={styles.resultCount}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map(item => (
              <button
                key={item._id}
                className={styles.resultRow}
                onClick={() => setSelectedItem(item)}
              >
                <div className={styles.resultThumb}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className={styles.resultImg} />
                  ) : (
                    <span className={styles.resultEmoji} aria-hidden="true">
                      {item.emoji || '🍔'}
                    </span>
                  )}
                </div>

                <div className={styles.resultInfo}>
                  <p className={styles.resultName}>{item.name}</p>
                  {item.description && (
                    <p className={styles.resultDesc}>{item.description}</p>
                  )}
                  {!item.isAvailable && (
                    <p className={styles.soldOut}>Sold out</p>
                  )}
                </div>

                <span className={styles.resultPrice}>
                  {item.sizes?.length > 0 ? 'from ' : ''}
                  {formatMoneyCompact(item.basePrice)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {showEmpty && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>😕</span>
            <p className={styles.emptyTitle}>Nothing found</p>
            <p className={styles.emptyText}>
              No items match &ldquo;{debounced}&rdquo;
            </p>
          </div>
        )}
      </div>

      <BottomNav active="menu" />

      {/* In-place detail sheet — same as MenuScreen */}
      <ItemDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAdded={() => {}}
      />
    </div>
  );
}
