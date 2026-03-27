'use client';

import React, { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function SessionHistory({ onClose }) {
  const [pomos] = useLocalStorage('velora-pomos', 0);
  const [todos] = useLocalStorage('velora-todos', []);
  const done = useMemo(() => todos.filter(t => t.done).length, [todos]);

  return (
    <div className="cartoon-panel" style={{ position: 'relative', padding: '2.5rem', width: '100%', maxWidth: '300px', color: 'var(--text-brown)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '0.5rem' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>Today's Session</h2>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', backgroundColor: 'var(--panel-white)', borderRadius: '16px', padding: '1.2rem 1.5rem', border: '3px solid var(--border-color)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{pomos}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.5 }}>FOCUS SESSIONS</div>
        </div>
        <div style={{ textAlign: 'center', backgroundColor: 'var(--panel-white)', borderRadius: '16px', padding: '1.2rem 1.5rem', border: '3px solid var(--border-color)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{done}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.5 }}>TASKS DONE</div>
        </div>
      </div>

      {pomos > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.from({ length: Math.min(pomos, 20) }).map((_, i) => (
            <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', opacity: 0.7 + (i % 3) * 0.1 }} />
          ))}
          {pomos > 20 && <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>+{pomos - 20}</span>}
        </div>
      )}

      <button className="cartoon-button" onClick={() => { localStorage.removeItem('velora-pomos'); window.location.reload(); }}
        style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        Reset Stats
      </button>
    </div>
  );
}
