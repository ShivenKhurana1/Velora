'use client';

import React, { useState } from 'react';

export default function TodoList({ onClose }) {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Clear inbox architecture', done: false },
    { id: 2, text: 'Deploy Velora update', done: true }
  ]);
  const [inputValue, setInputValue] = useState('');

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setTodos([...todos, { id: Date.now(), text: inputValue.trim(), done: false }]);
    setInputValue('');
  };

  const removeTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="cartoon-panel" style={{
      position: 'relative',
      padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
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

      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>To-Do List</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minHeight: '150px', maxHeight: '300px', overflowY: 'auto' }}>
        {todos.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.9rem', marginTop: '2rem' }}>All caught up!</p>}
        {todos.map(todo => (
          <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0' }}>
            <button 
              onClick={() => toggleTodo(todo.id)}
              style={{
                width: '24px', height: '24px', borderRadius: '6px',
                border: '3px solid var(--border-color)',
                backgroundColor: todo.done ? 'var(--accent-color)' : 'var(--panel-white)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0
              }}
            >
              {todo.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fffdf9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </button>
            <span style={{ fontSize: '1rem', fontWeight: 600, flex: 1, textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.5 : 1 }}>
              {todo.text}
            </span>
            <button onClick={() => removeTodo(todo.id)} style={{ background: 'none', border: 'none', opacity: 0.3, cursor: 'pointer' }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        <input 
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="New task..."
          style={{
            flex: 1, padding: '0.8rem', borderRadius: '12px',
            border: '3px solid var(--border-color)',
            backgroundColor: 'var(--panel-white)', outline: 'none',
            fontFamily: 'inherit', fontWeight: 600, color: 'var(--text-brown)'
          }}
        />
        <button type="submit" className="cartoon-button" style={{ padding: '0 1rem', backgroundColor: 'var(--accent-color)', color: '#fffdf9' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </form>

    </div>
  );
}
