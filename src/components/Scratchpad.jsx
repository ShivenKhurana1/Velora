'use client';

import { useState, useEffect, useRef } from 'react';

const AUTOSAVE_KEY = 'velora-scratchpad';

export default function Scratchpad({ onClose }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTOSAVE_KEY);
    if (stored) setText(stored);
  }, []);

  const handleChange = (val) => {
    setText(val);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, val);
      setSaved(true);
    }, 800);
  };

  return (
    <div className="cartoon-panel" style={{ position: 'relative', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '360px', color: 'var(--text-brown)' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '0.5rem' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Scratchpad</h2>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.4 }}>{saved ? 'Saved' : 'Saving...'}</span>
      </div>

      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        placeholder="Jot down anything..."
        style={{
          width: '100%', height: '220px', resize: 'none',
          border: '3px solid var(--border-color)', borderRadius: '14px',
          backgroundColor: 'var(--panel-white)', padding: '1rem',
          fontFamily: "'Courier New', monospace", fontSize: '0.9rem',
          lineHeight: 1.7, color: 'var(--text-brown)', outline: 'none',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}
