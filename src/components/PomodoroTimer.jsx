'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const MODES = [
  { key: 'focus',  label: 'Focus',       duration: 25 * 60, color: 'var(--accent-color)' },
  { key: 'short',  label: 'Short Break', duration: 5 * 60,  color: '#7bb59a' },
  { key: 'long',   label: 'Long Break',  duration: 15 * 60, color: '#7a9cbf' },
];

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.25;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.start(t); osc.stop(t + 1.2);
    });
  } catch(e) {}
}

function fireNotification(title, body) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body });
    });
  }
}

export default function PomodoroTimer({ onClose }) {
  const [modeIndex, setModeIndex] = useState(0);
  const mode = MODES[modeIndex];
  const [timeLeft, setTimeLeft] = useState(mode.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [pomos, setPomos] = useLocalStorage('velora-pomos', 0);

  useEffect(() => {
    setIsRunning(false);
    setTimeLeft(MODES[modeIndex].duration);
  }, [modeIndex]);

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 0) {
      setIsRunning(false);
      playChime();
      if (modeIndex === 0) {
        const next = pomos + 1;
        setPomos(next);
        fireNotification('Focus session complete!', `Great work! You've completed ${next} session${next > 1 ? 's' : ''} today.`);
      } else {
        fireNotification('Break over!', 'Time to get back to focus.');
      }
      if (autoNext) setModeIndex(prev => prev === 0 ? 1 : 0);
      return;
    }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, timeLeft, autoNext, modeIndex, pomos, setPomos]);

  const toggle = () => setIsRunning(r => !r);
  const reset = () => { setIsRunning(false); setTimeLeft(MODES[modeIndex].duration); };

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (timeLeft / MODES[modeIndex].duration) * circumference;

  return (
    <div className="cartoon-panel" style={{ position: 'relative', padding: minimized ? '0 1.5rem' : '2.5rem 2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '380px', minWidth: minimized ? '260px' : 'unset', minHeight: minimized ? '64px' : 'unset', justifyContent: minimized ? 'center' : 'flex-start', color: 'var(--text-brown)', transition: 'padding 0.3s, min-height 0.3s' }}>
      {/* Header controls */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '4px' }}>
        <button onClick={() => setMinimized(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: '0.4rem', fontSize: '1.1rem', lineHeight: 1 }}>—</button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: '0.4rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Title always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', opacity: 0.7 }}>Pomodoro</span>
        {minimized && <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{formatTime(timeLeft)}</span>}
        <span style={{ fontSize: '0.8rem', opacity: 0.45, fontWeight: 600 }}>{pomos > 0 ? `× ${pomos}` : ''}</span>
      </div>

      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div
            key="body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}
          >
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--border-color)', borderRadius: '12px', padding: '4px' }}>
              {MODES.map((m, i) => (
                <button key={m.key} onClick={() => setModeIndex(i)}
                  style={{ padding: '0.4rem 0.9rem', borderRadius: '9px', border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: modeIndex === i ? mode.color : 'transparent',
                    color: modeIndex === i ? '#fff' : 'var(--text-brown)', opacity: modeIndex === i ? 1 : 0.6
                  }}
                >{m.label}</button>
              ))}
            </div>

            {/* SVG Circle */}
            <div style={{ position: 'relative', width: '220px', height: '220px' }}>
              <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="110" cy="110" r="90" fill="transparent" stroke="var(--border-color)" strokeWidth="12" opacity="0.3"/>
                <circle cx="110" cy="110" r="90" fill="transparent" stroke={mode.color} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '0.05em' }}>{formatTime(timeLeft)}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.6 }}>{mode.label.toUpperCase()}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="cartoon-button" onClick={toggle}
                style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', backgroundColor: isRunning ? 'var(--bg-tan)' : mode.color, color: isRunning ? 'var(--text-brown)' : '#fffdf9' }}
              >{isRunning ? 'Pause' : 'Start'}</button>
              <button className="cartoon-button" onClick={reset} style={{ padding: '0.8rem 1rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
              </button>
            </div>

            {/* Auto-next toggle */}
            <button onClick={() => setAutoNext(a => !a)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', opacity: 0.7, color: 'var(--text-brown)' }}>
              <div style={{ width: '32px', height: '18px', borderRadius: '9px', backgroundColor: autoNext ? mode.color : 'var(--border-color)', position: 'relative', transition: 'background-color 0.2s' }}>
                <div style={{ position: 'absolute', top: '2px', left: autoNext ? '16px' : '2px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
              </div>
              Auto-next session
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
