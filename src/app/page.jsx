'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MusicPlayer from '@/components/MusicPlayer';
import PomodoroTimer from '@/components/PomodoroTimer';
import TodoList from '@/components/TodoList';
import { useIdle } from '@/hooks/useIdle';

const menuVariants = {
  hidden: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    filter: 'blur(5px)',
    transition: { 
      type: "spring", bounce: 0, duration: 0.2,
      staggerChildren: 0.05, staggerDirection: -1 
    }
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    transition: { 
      type: "spring", bounce: 0.35, duration: 0.5,
      delayChildren: 0.1, staggerChildren: 0.08 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: 15, filter: 'blur(3px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { type: "spring", bounce: 0.4 } }
};

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [openTools, setOpenTools] = useState({
    timer: true,
    todo: false,
    music: true
  });

  const toggleTool = (tool, forceState) => {
    setOpenTools(prev => ({
      ...prev,
      [tool]: forceState !== undefined ? forceState : !prev[tool]
    }));
  };

  const isIdle = useIdle(8000); 

  if (!isOpen) {
    return (
      <main style={{ 
        width: '100vw', height: '100vh', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--bg-tan)'
      }}>
        <motion.button 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="cartoon-button"
          onClick={() => setIsOpen(true)}
          style={{ fontSize: '1.4rem', padding: '1rem 3rem', zIndex: 10 }}
        >
          Open Velora Workspace
        </motion.button>
      </main>
    );
  }

  return (
    <main style={{ 
      width: '100vw', height: '100vh', overflow: 'hidden',
      backgroundColor: 'var(--bg-tan)'
    }}>

      <div 
        className={`fade-target ${isIdle ? 'is-idle' : ''}`}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        
        {/* Top Right Hamburger Menu Manager */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
          <motion.button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="cartoon-button" 
            animate={{
              backgroundColor: menuOpen ? 'var(--accent-color)' : 'var(--panel-white)',
              color: menuOpen ? '#fffdf9' : 'var(--text-brown)'
            }}
            transition={{ duration: 0.2 }}
            style={{ 
              padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? (
                   <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
                ) : (
                   <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
                )}
              </svg>
            </motion.div>
          </motion.button>
          
          <AnimatePresence>
            {menuOpen && (
              <motion.div 
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="cartoon-panel" 
                style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '1rem', 
                  width: '220px', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1.5rem',
                  originTopRight: true, overflow: 'hidden'
                }}
              >
                <motion.h3 variants={itemVariants} style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.6 }}>WORKSPACE TOOLS</motion.h3>
                <motion.button 
                  variants={itemVariants}
                  className="cartoon-button" 
                  onClick={() => toggleTool('timer')} 
                  style={{ backgroundColor: openTools.timer ? 'var(--accent-color)' : 'var(--panel-white)', color: openTools.timer ? '#fff' : 'var(--text-brown)', textAlign: 'left', padding: '0.8rem 1rem' }}
                >
                  {openTools.timer ? '✓ Pomodoro Timer' : '+ Pomodoro Timer'}
                </motion.button>
                <motion.button 
                  variants={itemVariants}
                  className="cartoon-button" 
                  onClick={() => toggleTool('music')} 
                  style={{ backgroundColor: openTools.music ? 'var(--accent-color)' : 'var(--panel-white)', color: openTools.music ? '#fff' : 'var(--text-brown)', textAlign: 'left', padding: '0.8rem 1rem' }}
                >
                  {openTools.music ? '✓ Music Player' : '+ Music Player'}
                </motion.button>
                <motion.button 
                  variants={itemVariants}
                  className="cartoon-button" 
                  onClick={() => toggleTool('todo')} 
                  style={{ backgroundColor: openTools.todo ? 'var(--accent-color)' : 'var(--panel-white)', color: openTools.todo ? '#fff' : 'var(--text-brown)', textAlign: 'left', padding: '0.8rem 1rem' }}
                >
                  {openTools.todo ? '✓ To-Do List' : '+ To-Do List'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace Dashboard Flex Container */}
        <div style={{ padding: '5rem 2rem', maxHeight: '100vh', overflowY: 'auto' }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start',
            maxWidth: '1200px', margin: '0 auto'
          }}>
            <AnimatePresence mode="popLayout">
              {openTools.timer && (
                <motion.div
                  key="timer"
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20, filter: 'blur(5px)' }}
                  transition={{ duration: 0.35, type: 'spring', bounce: 0.3 }}
                >
                  <PomodoroTimer onClose={() => toggleTool('timer', false)} />
                </motion.div>
              )}
              {openTools.todo && (
                <motion.div
                  key="todo"
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20, filter: 'blur(5px)' }}
                  transition={{ duration: 0.35, type: 'spring', bounce: 0.3 }}
                >
                  <TodoList onClose={() => toggleTool('todo', false)} />
                </motion.div>
              )}
              {openTools.music && (
                <motion.div
                  key="music"
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20, filter: 'blur(5px)' }}
                  transition={{ duration: 0.35, type: 'spring', bounce: 0.3 }}
                >
                  <MusicPlayer onClose={() => toggleTool('music', false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

    </main>
  );
}
