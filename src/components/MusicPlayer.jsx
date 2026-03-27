'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Next.js SSR crashes when react-youtube tries to access 'window' natively.
// We must dynamically import it strictly on the client side.
const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

const SunIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

export default function MusicPlayer({ onClose }) {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(50);
  const [ytPlayer, setYtPlayer] = useState(null);
  const [progress, setProgress] = useState(0); 

  useEffect(() => {
    if (!ytPlayer) return;
    try {
      // getPlayerState is a reliable way to check if the iframe internal proxy is actually ready
      const state = typeof ytPlayer.getPlayerState === 'function' ? ytPlayer.getPlayerState() : -1;
      
      if (isMusicPlaying) {
        ytPlayer.playVideo();
      } else if (state === 1 || state === 3) { 
        // Only call pause if successfully playing (1) or buffering (3)
        // This prevents the 'reading src of null' error that occurs when pausing an uninitialized player
        ytPlayer.pauseVideo();
      }
    } catch (e) {
      console.warn('YouTube Player command ignored:', e);
    }
  }, [isMusicPlaying, ytPlayer]);

  useEffect(() => {
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      try {
        ytPlayer.setVolume(musicVolume);
      } catch (e) {
        console.warn('YouTube Volume command ignored:', e);
      }
    }
  }, [musicVolume, ytPlayer]);

  useEffect(() => {
    let interval;
    if (isMusicPlaying) {
      interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isMusicPlaying]);

  const onYtReady = (event) => {
    setYtPlayer(event.target);
    event.target.setVolume(musicVolume);
  };

  return (
    <div className="cartoon-panel" style={{
      position: 'relative',
      padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem',
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

      {/* Invisible YouTube Player iframe */}
      <div style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}>
        <YouTube 
          videoId="jfKfPfyJRdk" 
          opts={{ playerVars: { autoplay: 0, controls: 0 } }} 
          onReady={onYtReady} 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        
        <div style={{
          width: '140px', height: '140px',
          backgroundColor: 'var(--accent-color)',
          borderRadius: '24px',
          color: '#fffdf9',
          boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.3), 4px 4px 0px var(--shadow-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '0.5rem'
        }}>
          <SunIcon />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Lofi Girl Stream</h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.6, margin: 0, marginTop: '0.2rem' }}>YouTube Music</p>
        </div>

        <div style={{ width: '100%', padding: '0 1rem', marginTop: '0.5rem' }}>
          <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'var(--accent-color)', width: `${progress}%`, borderRadius: '3px', transition: 'width 0.1s linear' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '1rem' }}>
          <button className="cartoon-button" style={{ padding: '0.6rem 1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
          </button>
          <button 
            className="cartoon-button"
            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
            style={{ padding: '0.8rem 1.5rem', backgroundColor: 'var(--accent-color)', color: '#fffdf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isMusicPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            )}
          </button>
          <button className="cartoon-button" style={{ padding: '0.6rem 1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0 1rem', marginTop: '1rem' }}>
        <span style={{ opacity: 0.6 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg></span>
        <input 
          type="range"
          min="0" max="100"
          value={musicVolume}
          onChange={(e) => setMusicVolume(parseInt(e.target.value, 10))}
          className="cartoon-slider"
          style={{
            flex: 1, WebkitAppearance: 'none', height: '8px', background: 'var(--border-color)', outline: 'none', borderRadius: '4px', cursor: 'none'
          }}
        />
      </div>

    </div>
  );
}
