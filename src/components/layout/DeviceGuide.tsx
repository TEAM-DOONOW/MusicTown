import { useEffect, type ReactNode } from 'react';
import './device-guide.css';

/** Tracks the visible viewport so mobile dialogs stay above the on-screen keyboard. */
export function DeviceGuide({ children }: { children: ReactNode }) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const style = document.documentElement.style;
      style.setProperty('--visible-height', `${viewport?.height ?? innerHeight}px`);
      style.setProperty('--visible-top', `${viewport?.offsetTop ?? 0}px`);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
    };
  }, []);
  return <div className="device-content">{children}</div>;
}
