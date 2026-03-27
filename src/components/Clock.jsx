'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Clock({ onClose }) {
  const [time, setTime] = useState(new Date());
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = time.getHours(), minutes = time.getMinutes(), seconds = time.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (h12 % 12) * 30 + minutes * 0.5;
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="cartoon-panel" style={{ position: 'relative', padding: minimized ? '0 1.5rem' : '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '300px', minWidth: minimized ? '220px' : 'unset', minHeight: minimized ? '64px' : 'unset', justifyContent: minimized ? 'center' : 'flex-start', color: 'var(--text-brown)', transition: 'padding 0.3s, min-height 0.3s' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '4px' }}>
        <button onClick={() => setMinimized(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: '0.4rem', fontSize: '1.1rem', lineHeight: 1 }}>—</button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: '0.4rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style={{ fontWeight: 800, fontSize: '1rem', opacity: 0.7, marginTop: '0.25rem' }}>
        {minimized ? `${String(h12).padStart(2,'0')}:${String(minutes).padStart(2,'0')} ${ampm}` : 'Analog Clock'}
      </div>

      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div key="body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="84" fill="var(--panel-white)" stroke="var(--border-color)" strokeWidth="6"/>
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                return <line key={i} x1={90 + 70 * Math.cos(angle)} y1={90 + 70 * Math.sin(angle)} x2={90 + 80 * Math.cos(angle)} y2={90 + 80 * Math.sin(angle)} stroke="var(--border-color)" strokeWidth="3" strokeLinecap="round"/>;
              })}
              <line x1="90" y1="90" x2={90 + 45 * Math.cos((hourDeg-90)*Math.PI/180)} y2={90 + 45 * Math.sin((hourDeg-90)*Math.PI/180)} stroke="var(--text-brown)" strokeWidth="5" strokeLinecap="round"/>
              <line x1="90" y1="90" x2={90 + 62 * Math.cos((minDeg-90)*Math.PI/180)} y2={90 + 62 * Math.sin((minDeg-90)*Math.PI/180)} stroke="var(--text-brown)" strokeWidth="3.5" strokeLinecap="round"/>
              <line x1="90" y1="90" x2={90 + 68 * Math.cos((secDeg-90)*Math.PI/180)} y2={90 + 68 * Math.sin((secDeg-90)*Math.PI/180)} stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="90" cy="90" r="5" fill="var(--accent-color)"/>
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                {String(h12).padStart(2,'0')}:{String(minutes).padStart(2,'0')}
                <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.6, marginLeft: '0.4rem' }}>{ampm}</span>
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 600, marginTop: '0.2rem' }}>{dateStr}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
