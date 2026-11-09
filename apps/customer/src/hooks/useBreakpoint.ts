import { useEffect, useState } from 'react';

/** The laptop layout starts here (top nav, cart panel beside the menu). */
export const LAPTOP_QUERY = '(min-width: 900px)';

function read(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;
}

/** Live `matchMedia`. First render already has the right answer (no phone-then-laptop flash). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => read(query));

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export const useIsLaptop = () => useMediaQuery(LAPTOP_QUERY);
