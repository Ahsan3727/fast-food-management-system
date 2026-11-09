import { useEffect } from 'react';
import type { ReactNode } from 'react';
import BottomNav, { type NavProps } from '@/components/BottomNav';
import TopNav from '@/components/TopNav';
import { useIsLaptop } from '@/hooks/useBreakpoint';

interface Props extends NavProps {
  /** Laptop only: content for the right side of the top bar. */
  search?: ReactNode;
}

/**
 * The one navigation component screens render. Phones get the BottomNav,
 * laptops (>= 900px) get the TopNav and the page makes room for it.
 */
export default function AppNav({ active, search }: Props) {
  const isLaptop = useIsLaptop();

  // The TopNav is fixed, so the page reserves its height (see globals.css).
  useEffect(() => {
    if (!isLaptop) return;
    document.documentElement.classList.add('has-topnav');
    return () => document.documentElement.classList.remove('has-topnav');
  }, [isLaptop]);

  return isLaptop
    ? <TopNav active={active}>{search}</TopNav>
    : <BottomNav active={active} />;
}
