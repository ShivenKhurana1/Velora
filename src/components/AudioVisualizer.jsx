'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function AudioVisualizer({ isPlaying, genre = 'lofi' }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [bars, setBars] = useState([]);

  // Genre-based color schemes
  const genreColors = {
    lofi: { primary: '#8B7355', secondary: '#A0826D', accent: '#CD853F' },
    jazz: { primary: '#4A5568', secondary: '#718096', accent: '#E53E3E' },
    electronic: { primary: '#805AD5', secondary: '#9F7AEA', accent: '#B794F4' },
    classical: { primary: '#2D3748', secondary: '#4A5568', accent: '#718096' },
    focus: { primary: '#2B6CB0', secondary: '#3182CE', accent: '#63B3ED' }
  };

  const currentColors = genreColors[genre] || genreColors.lofi;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const barCount = 20;
    const barWidth = canvas.width / barCount - 2;

    // Initialize bars with random heights
    const initialBars = Array.from({ length: barCount }, () => ({
      height: Math.random() * 0.3 + 0.1,
      targetHeight: Math.random() * 0.3 + 0.1,
      velocity: 0
    }));
    setBars(initialBars);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        // Update bar heights with smooth animation
        initialBars.forEach((bar, i) => {
          // Random target height for organic movement
          if (Math.random() < 0.1) {
            bar.targetHeight = Math.random() * 0.8 + 0.2;
          }
          
          // Smooth transition to target height
          bar.velocity += (bar.targetHeight - bar.height) * 0.1;
          bar.velocity *= 0.8; // Damping
          bar.height += bar.velocity;
          
          // Draw bar
          const x = i * (barWidth + 2);
          const barHeight = bar.height * canvas.height * 0.8;
          const y = canvas.height - barHeight;

          // Create gradient for each bar
          const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
          gradient.addColorStop(0, currentColors.primary);
          gradient.addColorStop(0.5, currentColors.secondary);
          gradient.addColorStop(1, currentColors.accent);

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
        });
      } else {
        // Static bars when not playing
        initialBars.forEach((bar, i) => {
          const x = i * (barWidth + 2);
          const barHeight = 0.1 * canvas.height;
          const y = canvas.height - barHeight;

          ctx.fillStyle = `${currentColors.primary}33`;
          ctx.fillRect(x, y, barWidth, barHeight);
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentColors]);

  return (
    <motion.div 
      className="audio-visualizer"
      style={{ 
        width: '100%', 
        height: '40px', 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: 'var(--border-color)',
        opacity: isPlaying ? 1 : 0.4,
        transition: 'opacity 0.3s ease'
      }}
      animate={{ opacity: isPlaying ? 1 : 0.4 }}
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={40}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
      />
    </motion.div>
  );
}
