import { useEffect } from 'react';

// callbacks: { onSpace, onEscape }
export function useKeyboard(callbacks) {
  useEffect(() => {
    const handler = (e) => {
      // Don't fire shortcuts when typing in inputs/textareas
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        callbacks.onSpace?.();
      }
      if (e.code === 'Escape') {
        callbacks.onEscape?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callbacks]);
}
