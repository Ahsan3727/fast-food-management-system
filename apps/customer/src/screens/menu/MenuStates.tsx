import type { CSSProperties } from 'react';
import type { MenuState } from './menu.utils';
import styles from '../MenuScreen.module.css';

/** Placeholder rows while the menu loads. The parent sets aria-busy on the board area. */
export function MenuSkeleton() {
  return (
    <div className={styles.board} aria-hidden="true">
      {[0, 1].map(col => (
        <div key={col} className={styles.boardCol}>
          {[0, 1].map(card => (
            <div key={card} className={`${styles.catBlock} ${styles.skelCard}`} style={{ '--n': 3 } as CSSProperties}>
              <div className={styles.catHeader}><span className={`skeleton ${styles.skelHead}`} /></div>
              <div className={styles.rows}>
                {[0, 1, 2].map(r => (
                  <div key={r} className={`${styles.row} ${styles.skelRow}`}>
                    <span className={styles.skelText}>
                      <span className={`skeleton ${styles.skelLine}`} />
                      <span className={`skeleton ${styles.skelLine} ${styles.skelShort}`} />
                    </span>
                    <span className={`skeleton ${styles.skelBtn}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const MESSAGES = {
  empty:   { emoji: '🍽️', title: 'The menu is empty right now.', hint: 'Please check back soon.',                       role: 'status' },
  offline: { emoji: '📡', title: "You're offline",               hint: 'The menu will load as soon as you reconnect.', role: 'status' },
  error:   { emoji: '⚠️', title: "Couldn't load the menu",       hint: 'Check your connection and try again.',          role: 'alert'  },
} as const;

/** Full-area message for the states where there is no menu to draw. */
export function MenuStateView({ state, onRetry }: { state: Exclude<MenuState, 'loading' | 'ready'>; onRetry: () => void }) {
  const msg = MESSAGES[state];
  return (
    <div className={styles.stateBox} role={msg.role}>
      <span className={styles.stateEmoji} aria-hidden="true">{msg.emoji}</span>
      <p className={styles.stateTitle}>{msg.title}</p>
      <p className={styles.stateHint}>{msg.hint}</p>
      {state === 'error' && (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

/** A search matched nothing anywhere: say so, instead of dimming every row. */
export function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className={styles.stateBox} role="status">
      <span className={styles.stateEmoji} aria-hidden="true">🔎</span>
      <p className={styles.stateTitle}>Nothing matches that</p>
      <p className={styles.stateHint}>Try a different word, or clear the search.</p>
      <button type="button" className={styles.retryBtn} onClick={onClear}>Clear search</button>
    </div>
  );
}
