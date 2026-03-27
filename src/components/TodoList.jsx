'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';

function playTick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

const DEFAULT_TODOS = [{ id: 1, text: 'Open Velora and focus', done: false }];

export default function TodoList({ onClose }) {
  const [todos, setTodos] = useLocalStorage('velora-todos', DEFAULT_TODOS);
  const [inputValue, setInputValue] = useState('');
  const [minimized, setMinimized] = useState(false);
  const done = useMemo(() => todos.filter(t => t.done).length, [todos]);

  const toggleTodo = (id) => { playTick(); setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t)); };
  const addTodo = (e) => { e.preventDefault(); if (!inputValue.trim()) return; setTodos([...todos, { id: Date.now(), text: inputValue.trim(), done: false }]); setInputValue(''); };
  const removeTodo = (id) => { playTick(); setTodos(todos.filter(t => t.id !== id)); };

  return (
    <div className="cartoon-panel" style={{ position: 'relative', padding: minimized ? '0 1.5rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '380px', minWidth: minimized ? '240px' : 'unset', minHeight: minimized ? '64px' : 'unset', justifyContent: minimized ? 'center' : 'flex-start', color: 'var(--text-brown)', transition: 'padding 0.3s, min-height 0.3s' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '4px' }}>
        <button onClick={() => setMinimized(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: '0.4rem', fontSize: '1.1rem', lineHeight: 1 }}>—</button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: '0.4rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style={{ fontWeight: 700, fontSize: '1rem', opacity: 0.7, marginTop: '0.25rem' }}>
        To-Do {minimized && <span style={{ opacity: 0.5, fontWeight: 600 }}>— {done}/{todos.length}</span>}
      </div>

      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div key="body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginTop: '-1rem' }}>
              {todos.length > 0 && <p style={{ fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>{done}/{todos.length} complete</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minHeight: '120px', maxHeight: '280px', overflowY: 'auto' }}>
              {todos.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.9rem', marginTop: '2rem' }}>All caught up!</p>}
              {todos.map(todo => (
                <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.4rem 0' }}>
                  <button onClick={() => toggleTodo(todo.id)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '3px solid var(--border-color)', backgroundColor: todo.done ? 'var(--accent-color)' : 'var(--panel-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
                    {todo.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fffdf9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                  <span style={{ fontSize: '1rem', fontWeight: 600, flex: 1, textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.4 : 1, transition: 'opacity 0.2s' }}>{todo.text}</span>
                  <button onClick={() => removeTodo(todo.id)} style={{ background: 'none', border: 'none', opacity: 0.3, cursor: 'pointer', padding: '0.2rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="New task..."
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '3px solid var(--border-color)', backgroundColor: 'var(--panel-white)', outline: 'none', fontFamily: 'inherit', fontWeight: 600, color: 'var(--text-brown)' }}
              />
              <button type="submit" className="cartoon-button" style={{ padding: '0 1rem', backgroundColor: 'var(--accent-color)', color: '#fffdf9' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
