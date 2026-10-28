import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useLenis } from 'lenis/react';

/**
 * ScrollToTop component:
 * Automatically scrolls the viewport to the top
 * whenever the user navigates between routes.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, lenis]);

  return null;
}
