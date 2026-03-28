'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Extended drum kit with parameters for each sound
const DRUM_SOUNDS = [
  { name: 'Kick 808', type: 'kick', freq: 60, decay: 0.6, pitchDecay: 0.4, color: '#e74c3c' },
  { name: 'Kick 909', type: 'kick', freq: 50, decay: 0.4, pitchDecay: 0.25, color: '#c0392b' },
  { name: 'Snare', type: 'snare', freq: 250, decay: 0.15, noiseAmount: 0.7, color: '#3498db' },
  { name: 'Clap', type: 'clap', freq: 400, decay: 0.12, noiseAmount: 0.9, color: '#2980b9' },
  { name: 'Rimshot', type: 'rim', freq: 1700, decay: 0.08, color: '#9b59b6' },
  { name: 'Closed HH', type: 'hat', freq: 8000, decay: 0.05, noiseAmount: 1, color: '#f1c40f' },
  { name: 'Open HH', type: 'hat', freq: 6000, decay: 0.2, noiseAmount: 1, color: '#f39c12' },
  { name: 'Crash', type: 'crash', freq: 5000, decay: 1.2, noiseAmount: 1, color: '#e67e22' },
  { name: 'Ride', type: 'ride', freq: 4000, decay: 0.8, noiseAmount: 0.8, color: '#d35400' },
  { name: 'Tom High', type: 'tom', freq: 200, decay: 0.25, color: '#1abc9c' },
  { name: 'Tom Mid', type: 'tom', freq: 150, decay: 0.3, color: '#16a085' },
  { name: 'Tom Low', type: 'tom', freq: 100, decay: 0.35, color: '#27ae60' },
  { name: 'Cowbell', type: 'cowbell', freq: 800, decay: 0.15, color: '#e91e63' },
  { name: 'Tambourine', type: 'tamb', freq: 3000, decay: 0.1, noiseAmount: 0.6, color: '#ad1457' },
  { name: 'Shaker', type: 'shaker', freq: 6000, decay: 0.08, noiseAmount: 1, color: '#ffeb3b' },
  { name: 'Snap', type: 'snap', freq: 2000, decay: 0.06, noiseAmount: 0.5, color: '#00bcd4' },
];

// 1-octave scale (C4 to B4) - reduced for performance
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [4];
const ALL_NOTES = OCTAVES.flatMap(oct => NOTES.map(note => `${note}${oct}`));

// Generate frequencies for all notes
const getNoteFrequency = (note) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = parseInt(note.slice(-1));
  const noteName = note.slice(0, -1);
  const semitone = noteNames.indexOf(noteName);
  const a4 = 440;
  const a4Index = 9;
  const a4Octave = 4;
  const semitonesFromA4 = (octave - a4Octave) * 12 + (semitone - a4Index);
  return a4 * Math.pow(2, semitonesFromA4 / 12);
};

const NOTE_FREQUENCIES = Object.fromEntries(ALL_NOTES.map(n => [n, getNoteFrequency(n)]));

const STEPS = 32;
const PATTERNS = ['A1', 'A2', 'B1', 'B2'];

// Note duration types
const NOTE_DURATIONS = {
  '16n': 1,
  '8n': 2,
  '4n': 4,
  '2n': 8,
};

export default function StudioPage() {
  // Playback state
  const [bpm, setBpm] = useState(128);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [swing, setSwing] = useState(0);
  
  // Pattern management
  const [activePattern, setActivePattern] = useState('A1');
  const [patterns, setPatterns] = useState(() => {
    const initial = {};
    PATTERNS.forEach(p => {
      initial[p] = {
        drumPattern: DRUM_SOUNDS.map(() => Array(STEPS).fill(0)),
        melodyPattern: ALL_NOTES.map(() => Array(STEPS).fill(null)),
      };
    });
    return initial;
  });
  const [chain, setChain] = useState(['A1']);
  const [chainIndex, setChainIndex] = useState(0);
  
  // UI state
  const [activeTab, setActiveTab] = useState('drums');
  const [showMixer, setShowMixer] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  
  // Synthesizer settings
  const [synthSettings, setSynthSettings] = useState({
    waveform: 'sawtooth',
    attack: 0.01,
    decay: 0.2,
    sustain: 0.3,
    release: 0.5,
    filterCutoff: 2000,
    filterResonance: 5,
    filterType: 'lowpass',
    polyphony: true,
  });
  
  // Effects
  const [effects, setEffects] = useState({
    reverb: { enabled: true, amount: 0.2, decay: 1.5 },
    delay: { enabled: false, amount: 0.15, time: 0.375, feedback: 0.4 },
    compressor: { enabled: true, threshold: -12, ratio: 4 },
  });
  
  // Mixer
  const [mixer, setMixer] = useState({
    master: 0.8,
    drums: 1,
    melody: 0.7,
  });
  
  // Drum mixer
  const [drumMixer, setDrumMixer] = useState(
    DRUM_SOUNDS.map(() => ({ volume: 1, pan: 0, mute: false, solo: false }))
  );
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  // Visualizer
  const [analyserData, setAnalyserData] = useState(new Uint8Array(128));
  
  // Refs
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);
  const analyserRef = useRef(null);
  const recorderRef = useRef(null);
  const masterGainRef = useRef(null);
  const drumBusRef = useRef(null);
  const melodyBusRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const delayNodeRef = useRef(null);
  const lastTapTimeRef = useRef(0);
  
  // Get current patterns
  const currentDrumPattern = patterns[activePattern].drumPattern;
  const currentMelodyPattern = patterns[activePattern].melodyPattern;
  
  // Initialize audio context and nodes
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      
      // Resume context (browsers suspend until user interaction)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Create master chain
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = mixer.master;
      
      // Create buses
      drumBusRef.current = ctx.createGain();
      drumBusRef.current.gain.value = mixer.drums;
      
      melodyBusRef.current = ctx.createGain();
      melodyBusRef.current.gain.value = mixer.melody;
      
      // Create effects
      const createReverb = () => {
        const convolver = ctx.createConvolver();
        const rate = ctx.sampleRate;
        const length = rate * effects.reverb.decay;
        const decay = effects.reverb.decay;
        const impulse = ctx.createBuffer(2, length, rate);
        
        for (let c = 0; c < 2; c++) {
          const channel = impulse.getChannelData(c);
          for (let i = 0; i < length; i++) {
            channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
          }
        }
        
        convolver.buffer = impulse;
        return convolver;
      };
      
      reverbNodeRef.current = createReverb();
      
      // Delay
      const delay = ctx.createDelay(2);
      delay.delayTime.value = effects.delay.time;
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = effects.delay.feedback;
      const delayWet = ctx.createGain();
      delayWet.gain.value = effects.delay.amount;
      
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(delayWet);
      
      delayNodeRef.current = { delay, delayWet };
      
      // Compressor
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = effects.compressor.threshold;
      compressor.ratio.value = effects.compressor.ratio;
      compressor.knee.value = 5;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.1;
      
      // Analyser - smaller FFT for better performance
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.7;
      
      // Create a dedicated gain node for the analyser to ensure it receives signal
      const analyserGain = ctx.createGain();
      analyserGain.gain.value = 1;
      
      // Connect chain
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = effects.reverb.amount;
      
      drumBusRef.current.connect(reverbGain);
      melodyBusRef.current.connect(reverbGain);
      reverbGain.connect(reverbNodeRef.current);
      
      drumBusRef.current.connect(delay);
      melodyBusRef.current.connect(delay);
      
      // Connect buses to analyser through a gain node
      drumBusRef.current.connect(analyserGain);
      melodyBusRef.current.connect(analyserGain);
      analyserGain.connect(analyserRef.current);
      
      drumBusRef.current.connect(compressor);
      melodyBusRef.current.connect(compressor);
      reverbNodeRef.current.connect(compressor);
      delayWet.connect(compressor);
      
      compressor.connect(masterGainRef.current);
      masterGainRef.current.connect(ctx.destination);
      
      // Setup recorder
      const dest = ctx.createMediaStreamDestination();
      masterGainRef.current.connect(dest);
      recorderRef.current = new MediaRecorder(dest.stream);
      
      recorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks(prev => [...prev, e.data]);
        }
      };
    }
  }, [mixer, effects]);
  
  // Play drum sound with advanced synthesis
  const playDrumSound = useCallback((soundIndex, velocity = 1) => {
    if (!audioContextRef.current) return;
    
    const sound = DRUM_SOUNDS[soundIndex];
    const mixer = drumMixer[soundIndex];
    if (mixer.mute) return;
    
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;
    const vol = mixer.volume * velocity * (mixer.solo ? 1.2 : 1);
    
    const panner = ctx.createStereoPanner();
    panner.pan.value = mixer.pan;
    
    switch (sound.type) {
      case 'kick': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(sound.freq * 2, t);
        osc.frequency.exponentialRampToValueAtTime(sound.freq, t + sound.pitchDecay);
        
        gain.gain.setValueAtTime(vol * 0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + sound.decay);
        
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(drumBusRef.current);
        
        osc.start(t);
        osc.stop(t + sound.decay);
        break;
      }
      
      case 'snare':
      case 'clap': {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(sound.freq, t);
        oscGain.gain.setValueAtTime(vol * 0.3, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + sound.decay);
        
        osc.connect(oscGain);
        oscGain.connect(panner);
        
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * sound.decay, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = sound.freq;
        noiseFilter.Q.value = 1;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(vol * sound.noiseAmount, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + sound.decay);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(panner);
        
        if (sound.type === 'clap') {
          noiseGain.gain.cancelScheduledValues(t);
          noiseGain.gain.setValueAtTime(0, t);
          noiseGain.gain.setValueAtTime(vol * sound.noiseAmount * 0.7, t + 0.01);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          noiseGain.gain.setValueAtTime(vol * sound.noiseAmount, t + 0.03);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, t + sound.decay);
        }
        
        osc.start(t);
        osc.stop(t + sound.decay);
        noise.start(t);
        noise.stop(t + sound.decay);
        
        panner.connect(drumBusRef.current);
        break;
      }
      
      case 'hat':
      case 'crash':
      case 'ride':
      case 'shaker':
      case 'tamb': {
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * sound.decay, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * (sound.type === 'shaker' ? 0.5 : 1);
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = sound.freq > 5000 ? 'highpass' : 'bandpass';
        filter.frequency.value = sound.freq;
        filter.Q.value = sound.type === 'ride' ? 2 : 0.5;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * (sound.noiseAmount || 0.8), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + sound.decay);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(drumBusRef.current);
        
        noise.start(t);
        noise.stop(t + sound.decay);
        break;
      }
      
      case 'tom': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(sound.freq, t);
        osc.frequency.exponentialRampToValueAtTime(sound.freq * 0.5, t + sound.decay);
        
        gain.gain.setValueAtTime(vol * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + sound.decay);
        
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(drumBusRef.current);
        
        osc.start(t);
        osc.stop(t + sound.decay);
        break;
      }
      
      case 'cowbell': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.frequency.setValueAtTime(sound.freq, t);
        osc2.frequency.setValueAtTime(sound.freq * 1.5, t);
        
        gain.gain.setValueAtTime(vol * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + sound.decay);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(panner);
        panner.connect(drumBusRef.current);
        
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + sound.decay);
        osc2.stop(t + sound.decay);
        break;
      }
      
      case 'rim':
      case 'snap': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(sound.freq, t);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = sound.freq * 0.5;
        
        gain.gain.setValueAtTime(vol * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + sound.decay);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(drumBusRef.current);
        
        osc.start(t);
        osc.stop(t + sound.decay);
        break;
      }
    }
  }, [drumMixer]);
  
  // Play synth note with full ADSR
  const playSynthNote = useCallback((note, duration = '16n', velocity = 1) => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;
    const freq = NOTE_FREQUENCIES[note];
    const dur = NOTE_DURATIONS[duration] * (60 / bpm) / 4;
    const vol = velocity * mixer.melody;
    
    const { attack, decay, sustain, release, filterCutoff, filterResonance, filterType, waveform } = synthSettings;
    
    const oscCount = waveform === 'fatsawtooth' ? 3 : 1;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterCutoff, t);
    filter.Q.value = filterResonance;
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(vol * sustain, 0.001), t + attack + decay);
    // Ensure release starts after sustain and doesn't conflict
    const releaseStart = Math.max(t + attack + decay + 0.01, t + dur - release);
    gain.gain.linearRampToValueAtTime(Math.max(vol * sustain, 0.001), releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur + release);
    
    for (let i = 0; i < oscCount; i++) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      if (waveform === 'fatsawtooth') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * (1 + (i - 1) * 0.005), t);
        oscGain.gain.value = 1 / oscCount;
      } else {
        osc.type = waveform;
        osc.frequency.setValueAtTime(freq, t);
        oscGain.gain.value = 1;
      }
      
      osc.connect(oscGain);
      oscGain.connect(filter);
      
      osc.start(t);
      osc.stop(t + dur + 0.1);
    }
    
    filter.connect(gain);
    gain.connect(melodyBusRef.current);
  }, [synthSettings, mixer.melody, bpm]);
  
  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const stepTime = (60 / bpm) * 1000 / 4;
      
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          let nextStep = (prev + 1) % STEPS;
          
          if (nextStep === 0) {
            const nextIndex = (chainIndex + 1) % chain.length;
            setChainIndex(nextIndex);
            setActivePattern(chain[nextIndex]);
          }
          
          const pattern = patterns[activePattern];
          
          pattern.drumPattern.forEach((row, soundIndex) => {
            const velocity = row[nextStep];
            if (velocity > 0) {
              playDrumSound(soundIndex, velocity);
            }
          });
          
          pattern.melodyPattern.forEach((row, noteIndex) => {
            const noteData = row[nextStep];
            if (noteData) {
              playSynthNote(ALL_NOTES[noteIndex], noteData.duration, 0.7);
            }
          });
          
          return nextStep;
        });
      }, stepTime);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, patterns, activePattern, chain, chainIndex, playDrumSound, playSynthNote]);
  
  // Visualizer loop - throttled for performance
  useEffect(() => {
    let animationId;
    let lastUpdate = 0;
    const throttleMs = 33; // ~30fps for smoother animation
    
    const updateVisualizer = (timestamp) => {
      if (timestamp - lastUpdate > throttleMs) {
        if (analyserRef.current && visualizerRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAnalyserData(dataArray.slice(0, 48));
          
          // Update bars directly for performance
          const bars = visualizerRef.current.querySelectorAll('.viz-bar');
          const hasData = dataArray.some(v => v > 10);
          
          bars.forEach((bar, i) => {
            const val = dataArray[i] || 0;
            const height = hasData ? Math.max(4, (val / 255) * 80) : 4;
            bar.style.height = `${height}px`;
            // Color changes based on intensity
            if (val > 150) {
              bar.style.backgroundColor = '#e74c3c'; // Red for high
              bar.style.boxShadow = '0 0 8px rgba(231,76,60,0.6)';
            } else if (val > 80) {
              bar.style.backgroundColor = '#ffd166'; // Yellow for medium
              bar.style.boxShadow = '0 0 6px rgba(255,209,102,0.4)';
            } else {
              bar.style.backgroundColor = '#8fb8a2'; // Green for low
              bar.style.boxShadow = 'none';
            }
          });
        }
        lastUpdate = timestamp;
      }
      animationId = requestAnimationFrame(updateVisualizer);
    };
    
    animationId = requestAnimationFrame(updateVisualizer);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'add' or 'remove' or 'toggle'
  const dragStartValueRef = useRef(null);
  const [dragDuration, setDragDuration] = useState('16n');

  // Toggle drum step with velocity levels
  const toggleDrumStep = (soundIndex, stepIndex) => {
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      const current = newPatterns[activePattern].drumPattern[soundIndex][stepIndex];
      const next = current === 0 ? 1 : current === 1 ? 0.5 : 0;
      newPatterns[activePattern].drumPattern[soundIndex][stepIndex] = next;
      return newPatterns;
    });
  };

  // Set drum step to specific value (for drag selection)
  const setDrumStep = (soundIndex, stepIndex, value) => {
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      newPatterns[activePattern].drumPattern[soundIndex][stepIndex] = value;
      return newPatterns;
    });
  };

  // Toggle melody step with duration
  const toggleMelodyStep = (noteIndex, stepIndex, duration = '16n') => {
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      const current = newPatterns[activePattern].melodyPattern[noteIndex][stepIndex];

      if (synthSettings.polyphony) {
        newPatterns[activePattern].melodyPattern[noteIndex][stepIndex] = current ? null : { duration };
      } else {
        for (let i = 0; i < ALL_NOTES.length; i++) {
          newPatterns[activePattern].melodyPattern[i][stepIndex] = null;
        }
        newPatterns[activePattern].melodyPattern[noteIndex][stepIndex] = current ? null : { duration };
      }

      return newPatterns;
    });
  };

  // Set melody step to specific value (for drag selection)
  const setMelodyStep = (noteIndex, stepIndex, value, duration = '16n') => {
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      if (synthSettings.polyphony) {
        newPatterns[activePattern].melodyPattern[noteIndex][stepIndex] = value ? { duration } : null;
      } else {
        for (let i = 0; i < ALL_NOTES.length; i++) {
          newPatterns[activePattern].melodyPattern[i][stepIndex] = null;
        }
        newPatterns[activePattern].melodyPattern[noteIndex][stepIndex] = value ? { duration } : null;
      }
      return newPatterns;
    });
  };
  
  // Clear pattern
  const clearPattern = () => {
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      if (activeTab === 'drums') {
        newPatterns[activePattern].drumPattern = DRUM_SOUNDS.map(() => Array(STEPS).fill(0));
      } else {
        newPatterns[activePattern].melodyPattern = ALL_NOTES.map(() => Array(STEPS).fill(null));
      }
      return newPatterns;
    });
  };
  
  // Randomize pattern
  const randomizePattern = () => {
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      if (activeTab === 'drums') {
        newPatterns[activePattern].drumPattern = DRUM_SOUNDS.map((_, i) => 
          Array(STEPS).fill(0).map(() => Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : 0.5) : 0)
        );
      } else {
        newPatterns[activePattern].melodyPattern = ALL_NOTES.map(() => 
          Array(STEPS).fill(null).map(() => Math.random() > 0.95 ? { duration: ['16n', '8n', '4n'][Math.floor(Math.random() * 3)] } : null)
        );
      }
      return newPatterns;
    });
  };
  
  // Export/Import
  const exportPattern = () => {
    const data = {
      bpm,
      swing,
      patterns,
      chain,
      synthSettings,
      effects,
      mixer,
      drumMixer,
      createdAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velora-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const importPattern = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.bpm) setBpm(data.bpm);
        if (data.swing !== undefined) setSwing(data.swing);
        if (data.patterns) setPatterns(data.patterns);
        if (data.chain) setChain(data.chain);
        if (data.synthSettings) setSynthSettings(data.synthSettings);
        if (data.effects) setEffects(data.effects);
        if (data.mixer) setMixer(data.mixer);
        if (data.drumMixer) setDrumMixer(data.drumMixer);
      } catch (err) {
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
  };
  
  // Export to WAV
  const exportToWav = async () => {
    if (recordedChunks.length === 0) {
      alert('Record something first!');
      return;
    }
    
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velora-recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    setRecordedChunks([]);
  };
  
  // Tap tempo
  const tapTempo = () => {
    const now = Date.now();
    const diff = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;
    
    if (diff > 100 && diff < 2000) {
      const newBpm = Math.round(60000 / diff);
      setBpm(Math.min(Math.max(newBpm, 60), 200));
    }
  };
  
  // Copy/paste pattern
  const [clipboard, setClipboard] = useState(null);
  
  const copyPattern = () => {
    setClipboard(JSON.parse(JSON.stringify(patterns[activePattern])));
  };
  
  const pastePattern = () => {
    if (!clipboard) return;
    setPatterns(prev => ({
      ...prev,
      [activePattern]: JSON.parse(JSON.stringify(clipboard))
    }));
  };

  // Undo/Redo - simplified to just track pattern changes
  const [patternHistory, setPatternHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPatterns(JSON.parse(JSON.stringify(patternHistory[newIndex])));
    }
  };

  const redo = () => {
    if (historyIndex < patternHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPatterns(JSON.parse(JSON.stringify(patternHistory[newIndex])));
    }
  };

  // Save pattern to history when it changes
  useEffect(() => {
    if (historyIndex === -1) {
      setPatternHistory([JSON.parse(JSON.stringify(patterns))]);
      setHistoryIndex(0);
    } else {
      const newHistory = patternHistory.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(patterns)));
      if (newHistory.length > 20) newHistory.shift();
      setPatternHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [activePattern]); // Only save history when switching patterns
  
  // Render visualizer - use CSS transitions instead of framer-motion for performance
  const visualizerRef = useRef(null);
  
  useEffect(() => {
    if (!visualizerRef.current) return;
    
    const bars = visualizerRef.current.querySelectorAll('.viz-bar');
    const hasData = analyserData.some(v => v > 0);
    
    bars.forEach((bar, i) => {
      const val = analyserData[i] || 0;
      const height = hasData ? (val / 255) * 60 : 4;
      const color = hasData ? `hsl(${150 + val / 4}, 70%, 50%)` : '#d1c1af';
      bar.style.height = `${height}px`;
      bar.style.backgroundColor = color;
    });
  }, [analyserData]);
  
  const renderVisualizer = () => {
    return (
      <div ref={visualizerRef} style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'center', 
        gap: '2px', 
        height: '80px', 
        padding: '0.5rem'
      }}>
        {Array.from({ length: 48 }, (_, i) => (
          <div
            key={i}
            className="viz-bar"
            style={{
              width: '6px',
              height: '4px',
              backgroundColor: '#8fb8a2',
              borderRadius: '3px',
              transition: 'height 0.05s ease-out'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="studio-page" style={{ minHeight: '100vh', backgroundColor: '#f4ecdf', padding: '2rem', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, color: '#5a4f43', fontSize: '2.5rem', fontWeight: 800 }}>Music Studio Pro</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#5a4f43', opacity: 0.6 }}>Advanced beat production environment</p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setShowMixer(!showMixer)} 
              className="cartoon-button"
              style={{ backgroundColor: showMixer ? '#8fb8a2' : '#fffdf9' }}
            >
              Mixer
            </button>
            <button 
              onClick={() => setShowEffects(!showEffects)} 
              className="cartoon-button"
              style={{ backgroundColor: showEffects ? '#8fb8a2' : '#fffdf9' }}
            >
              Effects
            </button>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button className="cartoon-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
              </button>
            </Link>
          </div>
        </div>

        {/* Visualizer */}
        <div className="cartoon-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
          {renderVisualizer()}
        </div>

        {/* Transport & Main Controls */}
        <div className="cartoon-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={async () => { await initAudioContext(); setIsPlaying(!isPlaying); }}
                className="cartoon-button"
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: isPlaying ? '#e74c3c' : '#8fb8a2',
                  color: '#fff',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isPlaying ? (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>Stop</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>Play</>
                )}
              </button>
              
              <button
                onClick={() => setCurrentStep(0)}
                className="cartoon-button"
                style={{ padding: '1rem', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#5a4f43', fontWeight: 600 }}>BPM</span>
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: '3px solid #d1c1af', fontFamily: 'inherit' }}
              />
              <button onClick={tapTempo} className="cartoon-button" style={{ fontSize: '0.8rem' }}>
                Tap
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#5a4f43', fontWeight: 600 }}>Swing</span>
              <input
                type="range"
                min="0"
                max="75"
                value={swing * 100}
                onChange={(e) => setSwing(parseInt(e.target.value) / 100)}
                style={{ width: '80px' }}
              />
              <span style={{ color: '#5a4f43', fontSize: '0.85rem', minWidth: '35px' }}>{Math.round(swing * 100)}%</span>
            </div>

            <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
              {PATTERNS.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePattern(p)}
                  className="cartoon-button"
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8rem',
                    backgroundColor: activePattern === p ? '#8fb8a2' : '#fffdf9',
                    color: activePattern === p ? '#fff' : '#5a4f43'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Effects Panel */}
        <AnimatePresence>
          {showEffects && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="cartoon-panel"
              style={{ padding: '1.5rem', marginBottom: '1rem', overflow: 'hidden' }}
            >
              <h3 style={{ margin: '0 0 1rem 0', color: '#5a4f43' }}>Master Effects</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="checkbox" checked={effects.reverb.enabled} onChange={(e) => setEffects({...effects, reverb: {...effects.reverb, enabled: e.target.checked}})} />
                    <span style={{ color: '#5a4f43', fontWeight: 600 }}>Reverb</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#5a4f43' }}>Amount: {Math.round(effects.reverb.amount * 100)}%</span>
                    <input type="range" min="0" max="100" value={effects.reverb.amount * 100} onChange={(e) => setEffects({...effects, reverb: {...effects.reverb, amount: parseInt(e.target.value) / 100}})} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="checkbox" checked={effects.delay.enabled} onChange={(e) => setEffects({...effects, delay: {...effects.delay, enabled: e.target.checked}})} />
                    <span style={{ color: '#5a4f43', fontWeight: 600 }}>Delay</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#5a4f43' }}>Mix: {Math.round(effects.delay.amount * 100)}%</span>
                    <input type="range" min="0" max="100" value={effects.delay.amount * 100} onChange={(e) => setEffects({...effects, delay: {...effects.delay, amount: parseInt(e.target.value) / 100}})} />
                  </div>
                </div>

                <div>
                  <span style={{ color: '#5a4f43', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Master Volume</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem' }}>{Math.round(mixer.master * 100)}%</span>
                    <input type="range" min="0" max="150" value={mixer.master * 100} onChange={(e) => setMixer({...mixer, master: parseInt(e.target.value) / 100})} style={{ flex: 1 }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mixer Panel */}
        <AnimatePresence>
          {showMixer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="cartoon-panel"
              style={{ padding: '1.5rem', marginBottom: '1rem', overflow: 'hidden' }}
            >
              <h3 style={{ margin: '0 0 1rem 0', color: '#5a4f43' }}>Drum Mixer</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                {DRUM_SOUNDS.map((sound, i) => (
                  <div key={sound.name} style={{ padding: '0.75rem', backgroundColor: '#fffdf9', borderRadius: '12px', border: '3px solid #d1c1af' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: sound.color, marginBottom: '0.5rem', textAlign: 'center' }}>
                      {sound.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <button
                        onClick={() => setDrumMixer(prev => prev.map((m, j) => i === j ? {...m, mute: !m.mute} : m))}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.65rem',
                          border: '2px solid #d1c1af',
                          borderRadius: '4px',
                          backgroundColor: drumMixer[i].mute ? '#e74c3c' : '#fffdf9',
                          color: drumMixer[i].mute ? '#fff' : '#5a4f43',
                          cursor: 'pointer'
                        }}
                      >M</button>
                      <button
                        onClick={() => setDrumMixer(prev => prev.map((m, j) => i === j ? {...m, solo: !m.solo} : m))}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.65rem',
                          border: '2px solid #d1c1af',
                          borderRadius: '4px',
                          backgroundColor: drumMixer[i].solo ? '#ffd166' : '#fffdf9',
                          color: '#5a4f43',
                          cursor: 'pointer'
                        }}
                      >S</button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={drumMixer[i].volume * 100}
                      onChange={(e) => setDrumMixer(prev => prev.map((m, j) => i === j ? {...m, volume: parseInt(e.target.value) / 100} : m))}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('drums')}
            className="cartoon-button"
            style={{
              backgroundColor: activeTab === 'drums' ? '#8fb8a2' : '#fffdf9',
              color: activeTab === 'drums' ? '#fff' : '#5a4f43'
            }}
          >
            Drum Machine
          </button>
          <button
            onClick={() => setActiveTab('melody')}
            className="cartoon-button"
            style={{
              backgroundColor: activeTab === 'melody' ? '#8fb8a2' : '#fffdf9',
              color: activeTab === 'melody' ? '#fff' : '#5a4f43'
            }}
          >
            Synthesizer
          </button>
          
          {activeTab === 'melody' && (
            <>
              <select
                value={synthSettings.waveform}
                onChange={(e) => setSynthSettings({...synthSettings, waveform: e.target.value})}
                style={{
                  padding: '0.5rem',
                  borderRadius: '12px',
                  border: '3px solid #d1c1af',
                  fontFamily: 'inherit',
                  backgroundColor: '#fffdf9',
                  color: '#5a4f43'
                }}
              >
                <option value="sine">Sine</option>
                <option value="square">Square</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="triangle">Triangle</option>
                <option value="fatsawtooth">Fat Saw</option>
              </select>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#5a4f43', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={synthSettings.polyphony}
                  onChange={(e) => setSynthSettings({...synthSettings, polyphony: e.target.checked})}
                />
                Poly
              </label>
            </>
          )}
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button onClick={undo} className="cartoon-button" style={{ fontSize: '0.8rem' }}>Undo</button>
            <button onClick={redo} className="cartoon-button" style={{ fontSize: '0.8rem' }}>Redo</button>
            <button onClick={copyPattern} className="cartoon-button" style={{ fontSize: '0.8rem' }}>Copy</button>
            <button onClick={pastePattern} className="cartoon-button" style={{ fontSize: '0.8rem' }}>Paste</button>
            <button onClick={clearPattern} className="cartoon-button" style={{ fontSize: '0.8rem' }}>Clear</button>
            <button onClick={randomizePattern} className="cartoon-button" style={{ fontSize: '0.8rem' }}>Random</button>
          </div>
        </div>

        {/* Sequencer Grid */}
        <div className="cartoon-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          {activeTab === 'drums' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 'max-content' }}>
              {/* Step indicators */}
              <div style={{ display: 'flex', paddingLeft: '120px' }}>
                {Array.from({ length: STEPS }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '32px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#5a4f43',
                      opacity: i % 4 === 0 ? 0.8 : 0.3,
                      backgroundColor: i === currentStep && isPlaying ? '#8fb8a2' : 'transparent',
                      borderRadius: '4px',
                      margin: '0 2px'
                    }}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Drum rows with velocity */}
              {DRUM_SOUNDS.map((sound, soundIndex) => (
                <div key={sound.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '110px', fontWeight: 700, color: sound.color, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: sound.color }} />
                    {sound.name}
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    {currentDrumPattern[soundIndex].map((velocity, stepIndex) => {
                      const isOn = velocity > 0;
                      return (
                        <button
                          key={stepIndex}
                          onMouseDown={() => {
                            dragStartValueRef.current = isOn;
                            setIsDragging(true);
                            setDragMode(isOn ? 'remove' : 'add');
                            toggleDrumStep(soundIndex, stepIndex);
                          }}
                          onMouseEnter={() => {
                            if (isDragging) {
                              if (dragMode === 'add') {
                                setDrumStep(soundIndex, stepIndex, 1);
                              } else if (dragMode === 'remove') {
                                setDrumStep(soundIndex, stepIndex, 0);
                              }
                            }
                          }}
                          onContextMenu={(e) => { e.preventDefault(); playDrumSound(soundIndex, 1); }}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '2px solid #d1c1af',
                            borderRadius: '6px',
                            backgroundColor: velocity === 0 ? '#fffdf9' : velocity === 1 ? sound.color : `${sound.color}80`,
                            opacity: stepIndex === currentStep && isPlaying ? 0.8 : 1,
                            cursor: isDragging ? 'crosshair' : 'pointer',
                            margin: '0 2px',
                            transition: 'all 0.1s ease, transform 0.05s ease',
                            boxShadow: velocity > 0 ? `0 0 4px ${sound.color}` : 'none',
                            userSelect: 'none'
                          }}
                          title={`${sound.name} - Step ${stepIndex + 1} - ${velocity === 1 ? 'Full' : velocity === 0.5 ? 'Half' : 'Off'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 'max-content' }}>
              {/* Step indicators */}
              <div style={{ display: 'flex', paddingLeft: '50px' }}>
                {Array.from({ length: STEPS }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '32px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#5a4f43',
                      opacity: i % 4 === 0 ? 0.8 : 0.3,
                      backgroundColor: i === currentStep && isPlaying ? '#ffd166' : 'transparent',
                      borderRadius: '4px',
                      margin: '0 2px'
                    }}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Piano roll - reversed so low notes at bottom */}
              {[...ALL_NOTES].reverse().map((note, noteIndex) => {
                const actualIndex = ALL_NOTES.length - 1 - noteIndex;
                const isBlack = note.includes('#');
                
                return (
                  <div key={note} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '42px', 
                      fontWeight: 600, 
                      color: isBlack ? '#fffdf9' : '#5a4f43', 
                      fontSize: '0.7rem',
                      backgroundColor: isBlack ? '#5a4f43' : '#e8e4ed',
                      padding: '0.25rem',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      {note}
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                    >
                      {currentMelodyPattern[actualIndex].map((noteData, stepIndex) => {
                        const isOn = !!noteData;
                        return (
                          <button
                            key={stepIndex}
                            onMouseDown={() => {
                              dragStartValueRef.current = isOn;
                              setIsDragging(true);
                              setDragMode(isOn ? 'remove' : 'add');
                              toggleMelodyStep(actualIndex, stepIndex);
                            }}
                            onMouseEnter={() => {
                              if (isDragging) {
                                if (dragMode === 'add') {
                                  setMelodyStep(actualIndex, stepIndex, true, '16n');
                                } else if (dragMode === 'remove') {
                                  setMelodyStep(actualIndex, stepIndex, false);
                                }
                              }
                            }}
                            onDoubleClick={() => toggleMelodyStep(actualIndex, stepIndex, '8n')}
                            style={{
                              width: '32px',
                              height: '24px',
                              border: '2px solid #d1c1af',
                              borderRadius: '4px',
                              backgroundColor: noteData ? '#ffd166' : stepIndex === currentStep && isPlaying ? '#e8e4ed' : isBlack ? '#d1c1af20' : '#fffdf9',
                              opacity: stepIndex === currentStep && isPlaying ? 0.8 : 1,
                              cursor: isDragging ? 'crosshair' : 'pointer',
                              margin: '0 2px',
                              transition: 'all 0.1s ease, transform 0.05s ease',
                              boxShadow: noteData ? '0 0 4px #ffd166' : 'none',
                              transform: noteData?.duration === '8n' ? 'scaleX(2.1)' : noteData?.duration === '4n' ? 'scaleX(4.1)' : undefined,
                              zIndex: noteData?.duration ? 10 : undefined,
                              marginRight: noteData?.duration === '8n' ? '34px' : noteData?.duration === '4n' ? '100px' : undefined,
                              userSelect: 'none'
                            }}
                            title={`${note} - Step ${stepIndex + 1}${noteData ? ` - ${noteData.duration}` : ''}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pattern Chain & Synth Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div className="cartoon-panel" style={{ padding: '1rem', flex: 1, minWidth: '200px' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#5a4f43', fontSize: '0.9rem' }}>Pattern Chain</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {chain.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setChainIndex(i)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: i === chainIndex ? '#8fb8a2' : '#fffdf9',
                    color: i === chainIndex ? '#fff' : '#5a4f43',
                    borderRadius: '8px',
                    border: '3px solid #d1c1af',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <select
                onChange={(e) => e.target.value && setChain([...chain, e.target.value])}
                style={{ padding: '0.4rem', borderRadius: '8px', border: '3px solid #d1c1af', fontFamily: 'inherit', fontSize: '0.8rem' }}
              >
                <option value="">Add pattern...</option>
                {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => setChain(chain.slice(0, -1))} className="cartoon-button" style={{ fontSize: '0.8rem' }}>
                Remove
              </button>
              <button onClick={() => setChain(['A1'])} className="cartoon-button" style={{ fontSize: '0.8rem' }}>
                Reset
              </button>
            </div>
          </div>

          {activeTab === 'melody' && (
            <div className="cartoon-panel" style={{ padding: '1rem', flex: 2, minWidth: '300px' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#5a4f43', fontSize: '0.9rem' }}>Synthesizer Parameters</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#5a4f43' }}>Attack</span>
                  <input type="range" min="1" max="100" value={synthSettings.attack * 100} onChange={(e) => setSynthSettings({...synthSettings, attack: parseInt(e.target.value) / 100})} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#5a4f43' }}>Decay</span>
                  <input type="range" min="5" max="200" value={synthSettings.decay * 100} onChange={(e) => setSynthSettings({...synthSettings, decay: parseInt(e.target.value) / 100})} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#5a4f43' }}>Sustain</span>
                  <input type="range" min="0" max="100" value={synthSettings.sustain * 100} onChange={(e) => setSynthSettings({...synthSettings, sustain: parseInt(e.target.value) / 100})} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#5a4f43' }}>Release</span>
                  <input type="range" min="5" max="100" value={synthSettings.release * 100} onChange={(e) => setSynthSettings({...synthSettings, release: parseInt(e.target.value) / 100})} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#5a4f43' }}>Filter Cutoff</span>
                  <input type="range" min="100" max="10000" value={synthSettings.filterCutoff} onChange={(e) => setSynthSettings({...synthSettings, filterCutoff: parseInt(e.target.value)})} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#5a4f43' }}>Resonance</span>
                  <input type="range" min="1" max="20" value={synthSettings.filterResonance} onChange={(e) => setSynthSettings({...synthSettings, filterResonance: parseInt(e.target.value)})} style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          <div className="cartoon-panel" style={{ padding: '1rem', minWidth: '200px' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#5a4f43', fontSize: '0.9rem' }}>Project</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={exportPattern} className="cartoon-button" style={{ fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Project
              </button>
              <label className="cartoon-button" style={{ fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
                Load Project
                <input type="file" accept=".json" onChange={importPattern} style={{ display: 'none' }} />
              </label>
              <button 
                onClick={() => {
                  if (isRecording) {
                    recorderRef.current?.stop();
                    setIsRecording(false);
                  } else {
                    initAudioContext();
                    setRecordedChunks([]);
                    recorderRef.current?.start();
                    setIsRecording(true);
                  }
                }} 
                className="cartoon-button" 
                style={{ fontSize: '0.85rem', width: '100%', backgroundColor: isRecording ? '#e74c3c' : '#fffdf9' }}
              >
                {isRecording ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>Stop Recording</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem' }}><circle cx="12" cy="12" r="10"/></svg>Record</>
                )}
              </button>
              <button onClick={exportToWav} className="cartoon-button" style={{ fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={recordedChunks.length === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export Audio
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fffdf9', borderRadius: '16px', border: '3px solid #d1c1af' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#5a4f43', fontSize: '1rem' }}>Quick Reference</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: '#5a4f43', opacity: 0.8 }}>
            <div>
              <strong>Drum Machine:</strong><br/>
              • Click once = Full velocity<br/>
              • Click again = Half velocity<br/>
              • Click third time = Off<br/>
              • Right-click to audition sound<br/>
              • Click and drag to select multiple
            </div>
            <div>
              <strong>Synthesizer:</strong><br/>
              • Single click = 16th note<br/>
              • Double click = 8th note<br/>
              • Poly mode for chords<br/>
              • ADSR controls envelope shape<br/>
              • Click and drag to paint notes
            </div>
            <div>
              <strong>Pattern Chain:</strong><br/>
              • Create sequences across patterns A1, A2, B1, B2<br/>
              • Playback cycles through chain automatically<br/>
              • Build full songs with pattern variations
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
