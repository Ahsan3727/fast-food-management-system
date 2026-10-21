import { useNavigate } from 'react-router-dom';
import { Icon, IconName } from './Icon';

interface Props {
  active: 'jobs' | 'earnings' | 'profile';
  hasActiveJob?: boolean;
}

interface TabItem {
  key: Props['active'];
  label: string;
  icon: IconName;
  path: string;
}

const TABS: TabItem[] = [
  { key: 'jobs', label: 'Jobs', icon: 'bike', path: '/' },
  { key: 'earnings', label: 'Earnings', icon: 'cash', path: '/earnings' },
  { key: 'profile', label: 'Profile', icon: 'user', path: '/profile' },
];

export default function RiderBottomNav({ active, hasActiveJob }: Props) {
  const navigate = useNavigate();

  return (
    <nav
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: 60,
      }}
    >
      {TABS.map(tab => {
        const isCurrent = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              height: '100%',
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontWeight: isCurrent ? 700 : 500,
              color: isCurrent ? 'var(--action)' : 'var(--subtle)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isCurrent && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: 3,
                  borderRadius: '0 0 3px 3px',
                  background: 'var(--action)',
                }}
              />
            )}

            <div style={{ position: 'relative' }}>
              <Icon
                name={tab.icon}
                size={22}
                style={{ color: isCurrent ? 'var(--action)' : 'var(--subtle)' }}
              />
              {tab.key === 'jobs' && hasActiveJob && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--action)',
                    border: '2px solid var(--surface)',
                  }}
                />
              )}
            </div>

            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
