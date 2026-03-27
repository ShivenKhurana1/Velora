'use client';

import React from 'react';

export default function Cinemagraph({ isDaylight }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: -10,
      overflow: 'hidden',
      background: isDaylight 
        ? 'linear-gradient(to bottom, #7fc1e3 0%, #e0f2f1 100%)' // Bright blue sky
        : 'linear-gradient(to bottom, #dbe9f4 0%, #f4ecdf 100%)', // Calm sunset/tan sky
      transition: 'background 4s ease-in-out'
    }}>
      
      {/* Static Soft Sun */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '25%',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: isDaylight ? '#fffec2' : '#fcedc7',
        boxShadow: isDaylight 
          ? '0 0 60px 20px rgba(255, 254, 194, 0.6)' 
          : '0 0 40px 10px rgba(252, 237, 199, 0.5)',
        transition: 'all 5s ease-in-out'
      }} />

      {/* Static Clouds */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', opacity: 0.9, transform: 'scale(1.2)' }}>
        <svg viewBox="0 0 100 50" width="160" height="80" fill="#ffffff">
          <path d="M20 35 Q10 35 10 25 Q10 15 25 15 Q30 5 45 5 Q60 5 65 15 Q80 15 80 25 Q80 35 70 35 Z" />
        </svg>
      </div>
      
      <div style={{ position: 'absolute', top: '25%', right: '20%', opacity: 0.7, transform: 'scale(0.85)' }}>
        <svg viewBox="0 0 100 50" width="140" height="70" fill="#ffffff">
          <path d="M20 35 Q10 35 10 25 Q10 15 25 15 Q30 5 45 5 Q60 5 65 15 Q80 15 80 25 Q80 35 70 35 Z" />
        </svg>
      </div>

      <div style={{ position: 'absolute', top: '5%', left: '45%', opacity: 0.6, transform: 'scale(0.6)' }}>
        <svg viewBox="0 0 100 50" width="100" height="50" fill="#ffffff">
          <path d="M20 35 Q10 35 10 25 Q10 15 25 15 Q30 5 45 5 Q60 5 65 15 Q80 15 80 25 Q80 35 70 35 Z" />
        </svg>
      </div>

      {/* 
        Layered Ocean Waves 
        These are the ONLY moving elements, fulfilling the "actual art background with only one element moving" requirement.
      */}
      {/* Back Wave */}
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '-10%',
        width: '120vw',
        height: '40vh',
        backgroundColor: '#9bc4c1',
        borderRadius: '50% 50% 0 0',
        animation: 'waveSway 8s infinite alternate ease-in-out'
      }} />
      
      {/* Middle Wave */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-15%',
        width: '130vw',
        height: '35vh',
        backgroundColor: '#86b4b4',
        borderRadius: '50% 50% 0 0',
        animation: 'waveSway 6s infinite alternate-reverse ease-in-out'
      }} />

      {/* Front Wave */}
      <div style={{
        position: 'absolute',
        bottom: '5%',
        left: '-5%',
        width: '110vw',
        height: '30vh',
        backgroundColor: '#72a3a5',
        borderRadius: '50% 50% 0 0',
        animation: 'waveSway 7s infinite alternate ease-in-out'
      }} />

      {/* Static Sandy Beach Foreground */}
      <div style={{
        position: 'absolute',
        bottom: '-25%',
        left: '-10%',
        width: '120vw',
        height: '40vh',
        backgroundColor: '#e6dabb',
        borderRadius: '50% 50% 0 0',
        boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.02)'
      }} />

      <style jsx>{`
        @keyframes waveSway {
          0% { transform: translateX(0) scaleY(1); }
          100% { transform: translateX(3vw) scaleY(1.05); }
        }
      `}</style>
    </div>
  );
}
