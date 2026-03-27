'use client';

import React, { useState, useEffect } from 'react';

const POMODORO_TIME = 25 * 60; // 25 Minutes

export default function PomodoroTimer({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft <= 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => { setIsTimerRunning(false); setTimeLeft(POMODORO_TIME); };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / POMODORO_TIME) * circumference;

  return (
    <div className="cartoon-panel" style={{
      position: 'relative',
      padding: '3.5rem 2.5rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
      width: '100%', maxWidth: '380px', color: 'var(--text-brown)'
    }}>
      
      {/* Remove Button */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '0.5rem'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      {/* Circular Pomodoro Map */}
      <div style={{ position: 'relative', width: '220px', height: '220px' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="110" cy="110" r={radius}
            fill="transparent"
            stroke="var(--border-color)"
            strokeWidth="12"
            opacity="0.3"
          />
          <circle
            cx="110" cy="110" r={radius}
            fill="transparent"
            stroke="var(--accent-color)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '0.05em' }}>
            {formatTime(timeLeft)}
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.6 }}>FOCUS</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          className="cartoon-button"
          onClick={toggleTimer}
          style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', backgroundColor: isTimerRunning ? 'var(--bg-tan)' : 'var(--accent-color)', color: isTimerRunning ? 'var(--text-brown)' : '#fffdf9' }}
        >
          {isTimerRunning ? 'Pause Session' : 'Start Focus'}
        </button>
        <button 
          className="cartoon-button"
          onClick={resetTimer}
          style={{ padding: '0.8rem 1rem' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
        </button>
      </div>

    </div>
  );
}
