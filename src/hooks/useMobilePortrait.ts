import { useEffect, useState } from 'react';

/** True on a phone or tablet held upright. */
export function isMobilePortrait() {
  const mobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Keyboard resizing changes viewport orientation, but not physical device orientation.
  const portrait = screen.orientation?.type
    ? screen.orientation.type.startsWith('portrait')
    : typeof window.orientation === 'number'
      ? window.orientation % 180 === 0
      : matchMedia('(orientation: portrait)').matches;
  return mobile && portrait;
}

export function useMobilePortrait() {
  const [portrait, setPortrait] = useState(isMobilePortrait);
  useEffect(() => {
    const orientation = matchMedia('(orientation: portrait)');
    const update = () => setPortrait(isMobilePortrait());
    orientation.addEventListener('change', update);
    screen.orientation?.addEventListener('change', update);
    window.addEventListener('orientationchange', update);
    window.addEventListener('resize', update);
    return () => {
      orientation.removeEventListener('change', update);
      screen.orientation?.removeEventListener('change', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return portrait;
}
