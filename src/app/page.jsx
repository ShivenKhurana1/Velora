'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MusicPlayer from '@/components/MusicPlayer';
import PomodoroTimer from '@/components/PomodoroTimer';
import TodoList from '@/components/TodoList';
import Clock from '@/components/Clock';
import Scratchpad from '@/components/Scratchpad';
import SessionHistory from '@/components/SessionHistory';
import { useIdle } from '@/hooks/useIdle';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useKeyboard } from '@/hooks/useKeyboard';

const BG_PALETTE = [
  { label: 'Sand',    value: '#f4ecdf' },
  { label: 'Chalk',  value: '#f0ece4' },
  { label: 'Sage',   value: '#e6ede8' },
  { label: 'Dusk',   value: '#e8e4ed' },
  { label: 'Stone',  value: '#e5e2dd' },
];

const menuVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95, filter: 'blur(5px)', transition: { type: 'spring', bounce: 0, duration: 0.2, staggerChildren: 0.05, staggerDirection: -1 } },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring', bounce: 0.35, duration: 0.5, delayChildren: 0.1, staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, x: 15, filter: 'blur(3px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { type: 'spring', bounce: 0.4 } }
};

function CornerClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  const h = time.getHours(), m = time.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return (
    <div style={{ position: 'absolute', bottom: '1.8rem', left: '2rem', zIndex: 100, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
      <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-brown)', lineHeight: 1, letterSpacing: '-0.02em', opacity: 0.8 }}>
        {String(h12).padStart(2,'0')}:{String(m).padStart(2,'0')}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-brown)', opacity: 0.4, letterSpacing: '0.08em' }}>
        {ampm} · {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

const TOOLS = [
  { key: 'timer',   label: 'Pomodoro Timer' },
  { key: 'music',   label: 'Music Player' },
  { key: 'todo',    label: 'To-Do List' },
  { key: 'clock',   label: 'Analog Clock' },
  { key: 'scratch', label: 'Scratchpad' },
  { key: 'history', label: 'Session Stats' },
];

const widgetAnimation = {
  initial: { opacity: 0, scale: 0.8, y: 30 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: -20, filter: 'blur(5px)' },
  transition: { duration: 0.35, type: 'spring', bounce: 0.3 }
};

// Studio link component
function StudioLink() {
  return (
    <a href="/studio" style={{ textDecoration: 'none' }}>
      <motion.div variants={itemVariants} style={{ marginTop: '0.75rem' }}>
        <button className="cartoon-button" style={{ width: '100%', textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fffdf9' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          Music Studio →
        </button>
      </motion.div>
    </a>
  );
}

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgColor, setBgColor] = useLocalStorage('velora-bg', BG_PALETTE[0].value);
  const [openTools, setOpenTools] = useLocalStorage('velora-open-tools', { timer: true, todo: false, music: true, clock: false, scratch: false, history: false });

  const menuRef = useRef(null);
  const musicPlayRef = useRef(null);

  const toggleTool = (tool, forceState) => setOpenTools(prev => ({ ...prev, [tool]: forceState !== undefined ? forceState : !prev[tool] }));

  // Click outside closes menu
  useClickOutside(menuRef, useCallback(() => setMenuOpen(false), []));

  // Keyboard shortcuts
  const keyboardCallbacks = useMemo(() => ({
    onSpace: () => musicPlayRef.current?.(),
    onEscape: () => setMenuOpen(false),
  }), []);

  useKeyboard(keyboardCallbacks);

  const isIdle = useIdle(8000);

  if (!isOpen) {
    return (
      <main style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor }}>
        <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: 'spring' }}
          className="cartoon-button" onClick={() => setIsOpen(true)} style={{ fontSize: '1.4rem', padding: '1rem 3rem' }}
        >Open Velora Workspace</motion.button>
      </main>
    );
  }

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: bgColor, transition: 'background-color 0.4s ease' }}>
      <div className={`fade-target ${isIdle ? 'is-idle' : ''}`} style={{ width: '100%', height: '100%', position: 'relative' }}>

        {/* Hamburger Menu */}
        <div ref={menuRef} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
          <motion.button onClick={() => setMenuOpen(!menuOpen)} className="cartoon-button"
            animate={{ backgroundColor: menuOpen ? 'var(--accent-color)' : 'var(--panel-white)', color: menuOpen ? '#fffdf9' : 'var(--text-brown)' }}
            transition={{ duration: 0.2 }}
            style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div variants={menuVariants} initial="hidden" animate="visible" exit="hidden"
                className="cartoon-panel"
                style={{ position: 'absolute', top: '100%', right: 0, marginTop: '1rem', width: '230px', display: 'flex', flexDirection: 'column', gap: '0.7rem', padding: '1.5rem', overflow: 'hidden' }}
              >
                <motion.h3 variants={itemVariants} style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', opacity: 0.5, letterSpacing: '0.08em' }}>WORKSPACE TOOLS</motion.h3>
                {TOOLS.map(({ key, label }) => (
                  <motion.button key={key} variants={itemVariants} className="cartoon-button" onClick={() => toggleTool(key)}
                    style={{ backgroundColor: openTools[key] ? 'var(--accent-color)' : 'var(--panel-white)', color: openTools[key] ? '#fff' : 'var(--text-brown)', textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.95rem' }}
                  >{openTools[key] ? `✓ ${label}` : `+ ${label}`}</motion.button>
                ))}

                <motion.div variants={itemVariants} style={{ borderTop: '2px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', opacity: 0.45, letterSpacing: '0.08em' }}>BACKGROUND</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {BG_PALETTE.map(bg => (
                      <button key={bg.value} onClick={() => setBgColor(bg.value)} title={bg.label}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: bg.value, border: bgColor === bg.value ? '3px solid var(--text-brown)' : '3px solid var(--border-color)', cursor: 'pointer', transition: 'border 0.2s' }}
                      />
                    ))}
                  </div>
                </motion.div>

                <StudioLink />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard shortcut hints */}
        <div style={{ position: 'absolute', top: '1.8rem', left: '2rem', zIndex: 50, display: 'flex', gap: '1rem', opacity: 0.25 }}>
          {[['Space', 'Play/Pause'], ['Esc', 'Close Menu']].map(([k, v]) => (
            <span key={k} style={{ fontSize: '0.75rem', fontWeight: 700 }}><kbd style={{ fontFamily: 'inherit', background: 'var(--text-brown)', color: 'var(--bg-tan)', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>{k}</kbd>{v}</span>
          ))}
        </div>

        {/* Widget Dashboard */}
        <div style={{ padding: '5rem 2rem', maxHeight: '100vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto' }}>
            <AnimatePresence mode="popLayout">
              {openTools.timer && (
                <motion.div key="timer" layout drag dragMomentum={false} dragElastic={0.1} style={{ cursor: 'grab' }}
                  {...widgetAnimation} whileDrag={{ cursor: 'grabbing', scale: 1.03, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50 }}>
                  <PomodoroTimer onClose={() => toggleTool('timer', false)} />
                </motion.div>
              )}
              {openTools.todo && (
                <motion.div key="todo" layout drag dragMomentum={false} dragElastic={0.1} style={{ cursor: 'grab' }}
                  {...widgetAnimation} whileDrag={{ cursor: 'grabbing', scale: 1.03, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50 }}>
                  <TodoList onClose={() => toggleTool('todo', false)} />
                </motion.div>
              )}
              {openTools.music && (
                <motion.div key="music" layout drag dragMomentum={false} dragElastic={0.1} style={{ cursor: 'grab' }}
                  {...widgetAnimation} whileDrag={{ cursor: 'grabbing', scale: 1.03, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50 }}>
                  <MusicPlayer onClose={() => toggleTool('music', false)} onSpacePress={(fn) => { musicPlayRef.current = fn; }} />
                </motion.div>
              )}
              {openTools.clock && (
                <motion.div key="clock" layout drag dragMomentum={false} dragElastic={0.1} style={{ cursor: 'grab' }}
                  {...widgetAnimation} whileDrag={{ cursor: 'grabbing', scale: 1.03, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50 }}>
                  <Clock onClose={() => toggleTool('clock', false)} />
                </motion.div>
              )}
              {openTools.scratch && (
                <motion.div key="scratch" layout drag dragMomentum={false} dragElastic={0.1} style={{ cursor: 'grab' }}
                  {...widgetAnimation} whileDrag={{ cursor: 'grabbing', scale: 1.03, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50 }}>
                  <Scratchpad onClose={() => toggleTool('scratch', false)} />
                </motion.div>
              )}
              {openTools.history && (
                <motion.div key="history" layout drag dragMomentum={false} dragElastic={0.1} style={{ cursor: 'grab' }}
                  {...widgetAnimation} whileDrag={{ cursor: 'grabbing', scale: 1.03, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50 }}>
                  <SessionHistory onClose={() => toggleTool('history', false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <CornerClock />
      </div>
    </main>
  );
}
