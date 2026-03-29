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

// Default instrument track presets
const DEFAULT_INSTRUMENTS = [
  { id: 'guitar', name: 'Guitar', color: '#e67e22', waveform: 'sawtooth', attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.4, filterCutoff: 2500, filterResonance: 3, filterType: 'lowpass', polyphony: true },
  { id: 'bass', name: 'Bass', color: '#8e44ad', waveform: 'sawtooth', attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3, filterCutoff: 1200, filterResonance: 4, filterType: 'lowpass', polyphony: false },
  { id: 'lead', name: 'Lead', color: '#3498db', waveform: 'square', attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.3, filterCutoff: 4000, filterResonance: 6, filterType: 'lowpass', polyphony: true },
  { id: 'pad', name: 'Pad', color: '#2ecc71', waveform: 'sine', attack: 0.1, decay: 0.4, sustain: 0.7, release: 0.8, filterCutoff: 1500, filterResonance: 2, filterType: 'lowpass', polyphony: true },
];

const INSTRUMENT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e91e63', '#00bcd4', '#ff5722', '#3f51b5'];

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

// Default and max steps
const DEFAULT_STEPS = 32;
const MAX_STEPS = 128;
const STEP_INCREMENT = 16;
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
  
  // Track length state (dynamic steps)
  const [trackLength, setTrackLength] = useState(DEFAULT_STEPS);
  const [activePattern, setActivePattern] = useState('A1');
  const [patterns, setPatterns] = useState(() => {
    const initial = {};
    PATTERNS.forEach(p => {
      initial[p] = {
        drumPattern: DRUM_SOUNDS.map(() => Array(DEFAULT_STEPS).fill(0)),
        melodyPattern: ALL_NOTES.map(() => Array(DEFAULT_STEPS).fill(null)),
        // Per-track patterns for custom instrument tracks
        trackPatterns: {},
        // Per-drum-track patterns for multiple drum sets
        drumTrackPatterns: {
          0: DRUM_SOUNDS.map(() => Array(DEFAULT_STEPS).fill(0))
        },
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
  
  // Custom instrument tracks (DAW-style multi-track)
  const [customTracks, setCustomTracks] = useState(() => {
    // Initialize with first default instrument
    return [JSON.parse(JSON.stringify(DEFAULT_INSTRUMENTS[0]))];
  });
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [showAddTrackMenu, setShowAddTrackMenu] = useState(false);
  
  // Drum tracks (multiple drum sets)
  const [drumTracks, setDrumTracks] = useState(() => [{
    id: 'drum-1',
    name: 'Drum Kit 1',
    color: '#e74c3c',
    mute: false,
    solo: false,
    volume: 1,
  }]);
  const [activeDrumTrackIndex, setActiveDrumTrackIndex] = useState(0);
  const [showAddDrumTrackMenu, setShowAddDrumTrackMenu] = useState(false);
  
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
  
  // Project name and background color
  const [projectName, setProjectName] = useState('Untitled Project');
  const [backgroundColor, setBackgroundColor] = useState('#f4ecdf');
  const [savedProjects, setSavedProjects] = useState([]);
  const [showProjectManager, setShowProjectManager] = useState(false);
  
  // Waveform dropdown state
  const [showWaveformDropdown, setShowWaveformDropdown] = useState(false);
  const waveformOptions = ['sine', 'square', 'sawtooth', 'triangle', 'fatsawtooth'];
  const waveformRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (waveformRef.current && !waveformRef.current.contains(e.target)) {
        setShowWaveformDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  // Theme colors
  const theme = isDarkTheme ? {
    bg: '#1a1a2e',
    panel: '#16213e',
    panelBg: '#0f3460',
    text: '#e94560',
    textMuted: '#a0a0a0',
    border: '#1e3a5f',
    accent: '#0f3460',
    buttonBg: '#16213e',
    buttonActive: '#0f3460',
    inputBg: '#0f3460',
    stepOff: '#16213e',
    stepOn: '#e94560',
    stepHalf: '#5a7aa0'
  } : {
    bg: backgroundColor,
    panel: '#fffdf9',
    panelBg: '#f4ecdf',
    text: '#5a4f43',
    textMuted: '#8b7355',
    border: '#d1c1af',
    accent: '#8fb8a2',
    buttonBg: '#fffdf9',
    buttonActive: '#8fb8a2',
    inputBg: '#fffdf9',
    stepOff: '#e8e0d5',
    stepOn: '#8fb8a2',
    stepHalf: '#ffd166'
  };
  
  // Load saved projects, background color, and theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('velora-studio-projects');
    if (saved) {
      setSavedProjects(JSON.parse(saved));
    }
    const savedBg = localStorage.getItem('velora-background-color');
    if (savedBg) {
      setBackgroundColor(savedBg);
    }
    const savedTheme = localStorage.getItem('velora-dark-theme');
    if (savedTheme) {
      setIsDarkTheme(JSON.parse(savedTheme));
    }
  }, []);
  
  // Save theme preference
  useEffect(() => {
    localStorage.setItem('velora-dark-theme', JSON.stringify(isDarkTheme));
  }, [isDarkTheme]);
  
  // Save project to localStorage
  const saveProjectToStorage = () => {
    const projectData = {
      id: Date.now().toString(),
      name: projectName,
      bpm,
      swing,
      patterns,
      chain,
      synthSettings,
      customTracks,
      effects,
      mixer,
      drumMixer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const existing = savedProjects.find(p => p.name === projectName);
    let updated;
    if (existing) {
      updated = savedProjects.map(p => 
        p.name === projectName ? { ...projectData, id: p.id } : p
      );
    } else {
      updated = [...savedProjects, projectData];
    }
    
    setSavedProjects(updated);
    localStorage.setItem('velora-studio-projects', JSON.stringify(updated));
    alert(`Project "${projectName}" saved!`);
  };
  
  // Load project from localStorage
  const loadProjectFromStorage = (project) => {
    setProjectName(project.name);
    setBpm(project.bpm);
    setSwing(project.swing);
    setPatterns(project.patterns);
    setChain(project.chain);
    setSynthSettings(project.synthSettings);
    if (project.customTracks) setCustomTracks(project.customTracks);
    setEffects(project.effects);
    setMixer(project.mixer);
    setDrumMixer(project.drumMixer);
    setShowProjectManager(false);
  };
  
  // Delete project from localStorage
  const deleteProject = (id) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('velora-studio-projects', JSON.stringify(updated));
  };
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
  
  // Get current pattern for the active track - must be defined before use
  const getActiveTrackPattern = useCallback(() => {
    const trackPattern = patterns[activePattern]?.trackPatterns?.[activeTrackIndex];
    if (trackPattern) return trackPattern;
    return ALL_NOTES.map(() => Array(trackLength).fill(null));
  }, [patterns, activePattern, activeTrackIndex, trackLength]);
  
  // Get current drum pattern for the active drum track
  const getActiveDrumPattern = useCallback(() => {
    const drumTrackPattern = patterns[activePattern]?.drumTrackPatterns?.[activeDrumTrackIndex];
    if (drumTrackPattern) return drumTrackPattern;
    return DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
  }, [patterns, activePattern, activeDrumTrackIndex, trackLength]);
  
  // Get current patterns
  const currentDrumPattern = getActiveDrumPattern();
  const currentMelodyPattern = getActiveTrackPattern();
  
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
  
  // Play note for a specific custom track
  const playTrackNote = useCallback((trackIndex, note, duration = '16n', velocity = 1) => {
    if (!audioContextRef.current || !customTracks[trackIndex]) return;
    
    const track = customTracks[trackIndex];
    const ctx = audioContextRef.current;
    const t = ctx.currentTime;
    const freq = NOTE_FREQUENCIES[note];
    const dur = NOTE_DURATIONS[duration] * (60 / bpm) / 4;
    const vol = velocity * (track.volume || 0.8);
    
    const { attack, decay, sustain, release, filterCutoff, filterResonance, filterType, waveform, polyphony } = track;
    
    const oscCount = waveform === 'fatsawtooth' ? 3 : 1;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = filterType || 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, t);
    filter.Q.value = filterResonance;
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(vol * sustain, 0.001), t + attack + decay);
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
        osc.type = waveform || 'sawtooth';
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
  }, [customTracks, bpm]);
  
  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const stepTime = (60 / bpm) * 1000 / 4;
      
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          let nextStep = (prev + 1) % trackLength;
          
          if (nextStep === 0) {
            const nextIndex = (chainIndex + 1) % chain.length;
            setChainIndex(nextIndex);
            setActivePattern(chain[nextIndex]);
          }
          
          const pattern = patterns[activePattern];
          
          // Play all drum tracks
          drumTracks.forEach((drumTrack, drumTrackIndex) => {
            if (drumTrack.mute) return; // Skip muted drum tracks
            const drumTrackPattern = pattern.drumTrackPatterns?.[drumTrackIndex] || DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
            drumTrackPattern.forEach((row, soundIndex) => {
              const velocity = row[nextStep];
              if (velocity > 0) {
                playDrumSound(soundIndex, velocity);
              }
            });
          });
          
          // Legacy drum pattern (for backwards compatibility)
          pattern.drumPattern.forEach((row, soundIndex) => {
            const velocity = row[nextStep];
            if (velocity > 0) {
              playDrumSound(soundIndex, velocity);
            }
          });
          
          // Play all custom instrument tracks
          customTracks.forEach((track, trackIndex) => {
            if (track.mute) return; // Skip muted tracks
            const trackPattern = pattern.trackPatterns?.[trackIndex] || ALL_NOTES.map(() => Array(trackLength).fill(null));
            trackPattern.forEach((row, noteIndex) => {
              const noteData = row[nextStep];
              if (noteData) {
                playTrackNote(trackIndex, ALL_NOTES[noteIndex], noteData.duration, 0.7);
              }
            });
          });
          
          // Legacy melody pattern (for backwards compatibility)
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
  }, [isPlaying, bpm, patterns, activePattern, chain, chainIndex, playDrumSound, playSynthNote, customTracks, drumTracks]);
  
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
  
  // Close add track menu when clicking outside
  const addTrackMenuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addTrackMenuRef.current && !addTrackMenuRef.current.contains(e.target)) {
        setShowAddTrackMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'add' or 'remove' or 'toggle'
  const dragStartValueRef = useRef(null);
  const [dragDuration, setDragDuration] = useState('16n');
  
  // Corner Clock Component
function CornerClock({ textColor }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  const h = time.getHours(), m = time.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return (
    <>
      <span style={{ fontSize: '2.8rem', fontWeight: 800, color: textColor, lineHeight: 1, letterSpacing: '-0.02em', opacity: 0.8, transition: 'color 0.5s ease' }}>
        {String(h12).padStart(2,'0')}:{String(m).padStart(2,'0')}
      </span>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: textColor, opacity: 0.4, letterSpacing: '0.08em', transition: 'color 0.5s ease' }}>
        {ampm} · {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </>
  );
}
  const [trackContextMenu, setTrackContextMenu] = useState({ visible: false, trackIndex: null, x: 0, y: 0 });
  const trackContextMenuRef = useRef(null);
  const [editingTrackName, setEditingTrackName] = useState(null);
  const [tempTrackName, setTempTrackName] = useState('');
  
  // Drum track context menu state
  const [drumTrackContextMenu, setDrumTrackContextMenu] = useState({ visible: false, drumTrackIndex: null, x: 0, y: 0 });
  const drumTrackContextMenuRef = useRef(null);
  const [editingDrumTrackName, setEditingDrumTrackName] = useState(null);
  const [tempDrumTrackName, setTempDrumTrackName] = useState('');
  
  // Available track colors
  const TRACK_COLORS = [
    '#e74c3c', // Red
    '#e67e22', // Orange
    '#f1c40f', // Yellow
    '#27ae60', // Green
    '#3498db', // Blue
    '#9b59b6', // Purple
    '#1abc9c', // Teal
    '#34495e', // Dark Blue
    '#e91e63', // Pink
    '#795548', // Brown
    '#607d8b', // Blue Grey
    '#ff5722', // Deep Orange
  ];

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (trackContextMenuRef.current && !trackContextMenuRef.current.contains(e.target)) {
        setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
      }
      if (drumTrackContextMenuRef.current && !drumTrackContextMenuRef.current.contains(e.target)) {
        setDrumTrackContextMenu({ visible: false, drumTrackIndex: null, x: 0, y: 0 });
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Handle track right-click
  const handleTrackRightClick = (e, trackIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setTrackContextMenu({
      visible: true,
      trackIndex,
      x: e.pageX,
      y: e.pageY
    });
  };
  
  // Handle drum track right-click
  const handleDrumTrackRightClick = (e, drumTrackIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDrumTrackContextMenu({
      visible: true,
      drumTrackIndex,
      x: e.pageX,
      y: e.pageY
    });
  };
  
  // Handle track rename
  const startRenameTrack = (trackIndex) => {
    const track = customTracks[trackIndex];
    setEditingTrackName(trackIndex);
    setTempTrackName(track.name);
    setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
  };
  
  // Handle drum track rename
  const startRenameDrumTrack = (drumTrackIndex) => {
    const drumTrack = drumTracks[drumTrackIndex];
    setEditingDrumTrackName(drumTrackIndex);
    setTempDrumTrackName(drumTrack.name);
    setDrumTrackContextMenu({ visible: false, drumTrackIndex: null, x: 0, y: 0 });
  };
  
  const confirmRenameDrumTrack = () => {
    if (editingDrumTrackName !== null && tempDrumTrackName.trim()) {
      updateDrumTrack(editingDrumTrackName, { name: tempDrumTrackName.trim() });
    }
    setEditingDrumTrackName(null);
    setTempDrumTrackName('');
  };
  
  const cancelRenameDrumTrack = () => {
    setEditingDrumTrackName(null);
    setTempDrumTrackName('');
  };
  
  const confirmRenameTrack = () => {
    if (editingTrackName !== null && tempTrackName.trim()) {
      updateTrack(editingTrackName, { name: tempTrackName.trim() });
    }
    setEditingTrackName(null);
    setTempTrackName('');
  };
  
  const cancelRenameTrack = () => {
    setEditingTrackName(null);
    setTempTrackName('');
  };
  
  // Handle track color change
  const changeTrackColor = (trackIndex, color) => {
    updateTrack(trackIndex, { color });
    // Menu stays open - only closes when clicking outside
  };
  
  // Handle drum track color change
  const changeDrumTrackColor = (drumTrackIndex, color) => {
    updateDrumTrack(drumTrackIndex, { color });
    // Menu stays open - only closes when clicking outside
  };
  
  // Handle track mute toggle from context menu
  const toggleTrackMute = (trackIndex) => {
    const track = customTracks[trackIndex];
    updateTrack(trackIndex, { mute: !track.mute });
    setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
  };
  
  // Handle drum track mute toggle from context menu
  const toggleDrumTrackMuteFromMenu = (drumTrackIndex) => {
    const drumTrack = drumTracks[drumTrackIndex];
    updateDrumTrack(drumTrackIndex, { mute: !drumTrack.mute });
    setDrumTrackContextMenu({ visible: false, drumTrackIndex: null, x: 0, y: 0 });
  };
  
  // Handle track delete from context menu
  const deleteTrackFromMenu = (trackIndex) => {
    removeTrack(trackIndex);
    setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
  };
  
  // Handle drum track delete from context menu
  const deleteDrumTrackFromMenu = (drumTrackIndex) => {
    removeDrumTrack(drumTrackIndex);
    setDrumTrackContextMenu({ visible: false, drumTrackIndex: null, x: 0, y: 0 });
  };
  // Toggle drum step for active drum track
  const toggleDrumStep = (soundIndex, stepIndex) => {
    const drumTrackIndex = activeDrumTrackIndex;
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      // Initialize drumTrackPatterns if needed
      if (!newPatterns[activePattern].drumTrackPatterns) {
        newPatterns[activePattern].drumTrackPatterns = {};
      }
      if (!newPatterns[activePattern].drumTrackPatterns[drumTrackIndex]) {
        newPatterns[activePattern].drumTrackPatterns[drumTrackIndex] = DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
      }
      const current = newPatterns[activePattern].drumTrackPatterns[drumTrackIndex][soundIndex][stepIndex];
      const next = current === 0 ? 1 : current === 1 ? 0.5 : 0;
      newPatterns[activePattern].drumTrackPatterns[drumTrackIndex][soundIndex][stepIndex] = next;
      
      // Also update legacy drumPattern for backwards compatibility
      newPatterns[activePattern].drumPattern[soundIndex][stepIndex] = next;
      return newPatterns;
    });
  };

  // Set drum step to specific value (for drag selection) for active drum track
  const setDrumStep = (soundIndex, stepIndex, value) => {
    const drumTrackIndex = activeDrumTrackIndex;
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      // Initialize drumTrackPatterns if needed
      if (!newPatterns[activePattern].drumTrackPatterns) {
        newPatterns[activePattern].drumTrackPatterns = {};
      }
      if (!newPatterns[activePattern].drumTrackPatterns[drumTrackIndex]) {
        newPatterns[activePattern].drumTrackPatterns[drumTrackIndex] = DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
      }
      newPatterns[activePattern].drumTrackPatterns[drumTrackIndex][soundIndex][stepIndex] = value;
      
      // Also update legacy drumPattern for backwards compatibility
      newPatterns[activePattern].drumPattern[soundIndex][stepIndex] = value;
      return newPatterns;
    });
  };

  // Toggle melody step with duration - now uses active track's pattern
  const toggleMelodyStep = (noteIndex, stepIndex, duration = '16n') => {
    const trackIndex = activeTrackIndex;
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      if (!newPatterns[activePattern].trackPatterns[trackIndex]) {
        newPatterns[activePattern].trackPatterns[trackIndex] = ALL_NOTES.map(() => Array(trackLength).fill(null));
      }
      const trackPattern = newPatterns[activePattern].trackPatterns[trackIndex];
      const current = trackPattern[noteIndex][stepIndex];
      const track = customTracks[trackIndex];
      const isPoly = track?.polyphony !== false;

      if (isPoly) {
        trackPattern[noteIndex][stepIndex] = current ? null : { duration };
      } else {
        for (let i = 0; i < ALL_NOTES.length; i++) {
          trackPattern[i][stepIndex] = null;
        }
        trackPattern[noteIndex][stepIndex] = current ? null : { duration };
      }

      return newPatterns;
    });
  };

  // Set melody step to specific value (for drag selection) - now uses active track's pattern
  const setMelodyStep = (noteIndex, stepIndex, value, duration = '16n') => {
    const trackIndex = activeTrackIndex;
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      if (!newPatterns[activePattern].trackPatterns[trackIndex]) {
        newPatterns[activePattern].trackPatterns[trackIndex] = ALL_NOTES.map(() => Array(trackLength).fill(null));
      }
      const trackPattern = newPatterns[activePattern].trackPatterns[trackIndex];
      const track = customTracks[trackIndex];
      const isPoly = track?.polyphony !== false;
      
      if (isPoly) {
        trackPattern[noteIndex][stepIndex] = value ? { duration } : null;
      } else {
        for (let i = 0; i < ALL_NOTES.length; i++) {
          trackPattern[i][stepIndex] = null;
        }
        trackPattern[noteIndex][stepIndex] = value ? { duration } : null;
      }
      return newPatterns;
    });
  };
  
  // Extend track length
  const extendTrack = () => {
    if (trackLength >= MAX_STEPS) return;
    const newLength = Math.min(trackLength + STEP_INCREMENT, MAX_STEPS);
    setTrackLength(newLength);
    
    // Extend all patterns
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      PATTERNS.forEach(p => {
        // Extend drum patterns
        newPatterns[p].drumPattern = newPatterns[p].drumPattern.map(row => {
          const extended = [...row];
          while (extended.length < newLength) extended.push(0);
          return extended;
        });
        // Extend melody patterns
        newPatterns[p].melodyPattern = newPatterns[p].melodyPattern.map(row => {
          const extended = [...row];
          while (extended.length < newLength) extended.push(null);
          return extended;
        });
        // Extend track patterns
        Object.keys(newPatterns[p].trackPatterns).forEach(trackIndex => {
          newPatterns[p].trackPatterns[trackIndex] = newPatterns[p].trackPatterns[trackIndex].map(row => {
            const extended = [...row];
            while (extended.length < newLength) extended.push(null);
            return extended;
          });
        });
        // Extend drum track patterns
        if (newPatterns[p].drumTrackPatterns) {
          Object.keys(newPatterns[p].drumTrackPatterns).forEach(drumTrackIndex => {
            newPatterns[p].drumTrackPatterns[drumTrackIndex] = newPatterns[p].drumTrackPatterns[drumTrackIndex].map(row => {
              const extended = [...row];
              while (extended.length < newLength) extended.push(0);
              return extended;
            });
          });
        }
      });
      return newPatterns;
    });
  };
  
  // Reduce track length
  const reduceTrack = () => {
    if (trackLength <= DEFAULT_STEPS) return;
    const newLength = Math.max(trackLength - STEP_INCREMENT, DEFAULT_STEPS);
    setTrackLength(newLength);
    
    // Truncate all patterns
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      PATTERNS.forEach(p => {
        // Truncate drum patterns
        newPatterns[p].drumPattern = newPatterns[p].drumPattern.map(row => row.slice(0, newLength));
        // Truncate melody patterns
        newPatterns[p].melodyPattern = newPatterns[p].melodyPattern.map(row => row.slice(0, newLength));
        // Truncate track patterns
        Object.keys(newPatterns[p].trackPatterns).forEach(trackIndex => {
          newPatterns[p].trackPatterns[trackIndex] = newPatterns[p].trackPatterns[trackIndex].map(row => row.slice(0, newLength));
        });
        // Truncate drum track patterns
        if (newPatterns[p].drumTrackPatterns) {
          Object.keys(newPatterns[p].drumTrackPatterns).forEach(drumTrackIndex => {
            newPatterns[p].drumTrackPatterns[drumTrackIndex] = newPatterns[p].drumTrackPatterns[drumTrackIndex].map(row => row.slice(0, newLength));
          });
        }
      });
      return newPatterns;
    });
    
    // Reset current step if beyond new length
    if (currentStep >= newLength) {
      setCurrentStep(0);
    }
  };
  const clearPattern = () => {
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      if (activeTab === 'drums') {
        // Clear active drum track's pattern
        const drumTrackIndex = activeDrumTrackIndex;
        if (!newPatterns[activePattern].drumTrackPatterns[drumTrackIndex]) {
          newPatterns[activePattern].drumTrackPatterns[drumTrackIndex] = DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
        }
        newPatterns[activePattern].drumTrackPatterns[drumTrackIndex] = DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
        // Also clear legacy drumPattern
        newPatterns[activePattern].drumPattern = DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
      } else {
        // Clear active track's pattern
        newPatterns[activePattern].trackPatterns[activeTrackIndex] = ALL_NOTES.map(() => Array(trackLength).fill(null));
        newPatterns[activePattern].melodyPattern = ALL_NOTES.map(() => Array(trackLength).fill(null));
      }
      return newPatterns;
    });
  };
  
  // Randomize pattern
  const randomizePattern = () => {
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      if (activeTab === 'drums') {
        // Randomize active drum track's pattern
        const drumTrackIndex = activeDrumTrackIndex;
        if (!newPatterns[activePattern].drumTrackPatterns[drumTrackIndex]) {
          newPatterns[activePattern].drumTrackPatterns[drumTrackIndex] = DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
        }
        newPatterns[activePattern].drumTrackPatterns[drumTrackIndex] = DRUM_SOUNDS.map((_, i) => 
          Array(trackLength).fill(0).map(() => Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : 0.5) : 0)
        );
        // Also update legacy drumPattern
        newPatterns[activePattern].drumPattern = DRUM_SOUNDS.map((_, i) => 
          Array(trackLength).fill(0).map(() => Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : 0.5) : 0)
        );
      } else {
        // Randomize active track's pattern
        if (!newPatterns[activePattern].trackPatterns[activeTrackIndex]) {
          newPatterns[activePattern].trackPatterns[activeTrackIndex] = ALL_NOTES.map(() => Array(trackLength).fill(null));
        }
        newPatterns[activePattern].trackPatterns[activeTrackIndex] = ALL_NOTES.map(() => 
          Array(trackLength).fill(null).map(() => Math.random() > 0.95 ? { duration: ['16n', '8n', '4n'][Math.floor(Math.random() * 3)] } : null)
        );
        newPatterns[activePattern].melodyPattern = ALL_NOTES.map(() => 
          Array(trackLength).fill(null).map(() => Math.random() > 0.95 ? { duration: ['16n', '8n', '4n'][Math.floor(Math.random() * 3)] } : null)
        );
      }
      return newPatterns;
    });
  };
  
  // Add a new drum track
  const addDrumTrack = () => {
    const newDrumTrack = {
      id: `drum-${Date.now()}`,
      name: `Drum Kit ${drumTracks.length + 1}`,
      color: TRACK_COLORS[drumTracks.length % TRACK_COLORS.length],
      mute: false,
      solo: false,
      volume: 1,
    };
    setDrumTracks(prev => [...prev, newDrumTrack]);
    // Initialize drum track patterns for all patterns
    setPatterns(prev => {
      const newPatterns = JSON.parse(JSON.stringify(prev));
      PATTERNS.forEach(p => {
        if (!newPatterns[p].drumTrackPatterns) {
          newPatterns[p].drumTrackPatterns = {};
        }
        newPatterns[p].drumTrackPatterns[drumTracks.length] = DRUM_SOUNDS.map(() => Array(trackLength).fill(0));
      });
      return newPatterns;
    });
    setActiveDrumTrackIndex(drumTracks.length);
    setShowAddDrumTrackMenu(false);
  };
  
  // Remove a drum track
  const removeDrumTrack = (drumTrackIndex) => {
    if (drumTracks.length <= 1) {
      alert('You must have at least one drum track!');
      return;
    }
    setDrumTracks(prev => prev.filter((_, i) => i !== drumTrackIndex));
    if (activeDrumTrackIndex >= drumTrackIndex && activeDrumTrackIndex > 0) {
      setActiveDrumTrackIndex(prev => prev - 1);
    }
  };
  
  // Update drum track settings
  const updateDrumTrack = (drumTrackIndex, updates) => {
    setDrumTracks(prev => prev.map((track, i) => 
      i === drumTrackIndex ? { ...track, ...updates } : track
    ));
  };
  
  // Handle drum track mute toggle
  const toggleDrumTrackMute = (drumTrackIndex) => {
    const drumTrack = drumTracks[drumTrackIndex];
    updateDrumTrack(drumTrackIndex, { mute: !drumTrack.mute });
  };
  
  // Change instrument preset without deleting notes
  const changeTrackPreset = (trackIndex, presetIndex) => {
    const preset = DEFAULT_INSTRUMENTS[presetIndex];
    if (!preset) return;
    
    // Update track with preset sound settings and name
    updateTrack(trackIndex, {
      name: preset.name,
      waveform: preset.waveform,
      attack: preset.attack,
      decay: preset.decay,
      sustain: preset.sustain,
      release: preset.release,
      filterCutoff: preset.filterCutoff,
      filterResonance: preset.filterResonance,
      filterType: preset.filterType,
      polyphony: preset.polyphony,
    });
    
    // Close the context menu after changing preset
    setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
  };
  
  // Add a new instrument track
  const addTrack = (presetIndex) => {
    const preset = DEFAULT_INSTRUMENTS[presetIndex] || DEFAULT_INSTRUMENTS[0];
    const newTrack = {
      ...JSON.parse(JSON.stringify(preset)),
      id: `track-${Date.now()}`,
      volume: 0.8,
      mute: false,
      solo: false,
    };
    setCustomTracks(prev => [...prev, newTrack]);
    setActiveTrackIndex(customTracks.length); // Switch to new track
    setShowAddTrackMenu(false);
  };
  
  // Add a duplicate of an existing track
  const duplicateTrack = (trackIndex) => {
    const trackToClone = customTracks[trackIndex];
    const newTrack = {
      ...JSON.parse(JSON.stringify(trackToClone)),
      id: `track-${Date.now()}`,
      name: `${trackToClone.name} Copy`,
      volume: 0.8,
      mute: false,
      solo: false,
    };
    setCustomTracks(prev => [...prev, newTrack]);
    setActiveTrackIndex(customTracks.length);
  };
  
  // Remove an instrument track
  const removeTrack = (trackIndex) => {
    if (customTracks.length <= 1) {
      alert('You must have at least one track!');
      return;
    }
    setCustomTracks(prev => prev.filter((_, i) => i !== trackIndex));
    if (activeTrackIndex >= trackIndex && activeTrackIndex > 0) {
      setActiveTrackIndex(prev => prev - 1);
    }
  };
  
  // Update track settings
  const updateTrack = (trackIndex, updates) => {
    setCustomTracks(prev => prev.map((track, i) => 
      i === trackIndex ? { ...track, ...updates } : track
    ));
  };
  
  // Export/Import
  const exportPattern = () => {
    const data = {
      bpm,
      swing,
      patterns,
      chain,
      synthSettings,
      customTracks,
      drumTracks,
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
        if (data.customTracks) setCustomTracks(data.customTracks);
        if (data.drumTracks) setDrumTracks(data.drumTracks);
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
    <main className="studio-page" style={{ 
      minHeight: '100vh', 
      backgroundColor: theme.bg, 
      padding: '2rem', 
      fontFamily: 'Nunito, sans-serif', 
      color: theme.text,
      transition: 'background-color 0.5s ease, color 0.5s ease',
      '--slider-track-bg': isDarkTheme ? '#1e3a5f' : '#fffdf9',
      '--slider-track-border': isDarkTheme ? '#0f3460' : '#d1c1af',
      '--slider-thumb-bg': isDarkTheme ? '#e94560' : '#8fb8a2',
      '--slider-thumb-border': isDarkTheme ? '#1e3a5f' : '#d1c1af',
      '--slider-thumb-shadow': isDarkTheme ? '#0f3460' : '#d1c1af',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, color: theme.text, fontSize: '2.5rem', fontWeight: 800 }}>Music Studio Pro</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: theme.textMuted, opacity: 0.8 }}>Advanced beat production environment</p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setIsDarkTheme(!isDarkTheme)} 
              className="cartoon-button"
              style={{ backgroundColor: theme.buttonBg, color: theme.text }}
              title={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDarkTheme ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <button 
              onClick={() => setShowMixer(!showMixer)} 
              className="cartoon-button"
              style={{ backgroundColor: showMixer ? theme.buttonActive : theme.buttonBg, color: theme.text }}
            >
              Mixer
            </button>
            <button 
              onClick={() => setShowEffects(!showEffects)} 
              className="cartoon-button"
              style={{ backgroundColor: showEffects ? theme.buttonActive : theme.buttonBg, color: theme.text }}
            >
              Effects
            </button>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button className="cartoon-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: theme.buttonBg, color: theme.text }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
              </button>
            </Link>
          </div>
        </div>

        <div className="cartoon-panel" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: theme.panel, borderColor: theme.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <span style={{ color: theme.text, fontWeight: 600 }}>Project:</span>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: '8px', 
                  border: `3px solid ${theme.border}`, 
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '0.95rem',
                  flex: 1,
                  maxWidth: '300px'
                }}
                placeholder="Enter project name..."
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={saveProjectToStorage} className="cartoon-button" style={{ backgroundColor: theme.buttonBg, color: theme.text }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.25rem' }}>
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                </svg>
                Save
              </button>
              <button onClick={() => setShowProjectManager(!showProjectManager)} className="cartoon-button" style={{ backgroundColor: theme.buttonBg, color: theme.text }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.25rem' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                My Projects ({savedProjects.length})
              </button>
            </div>
          </div>
          
          {showProjectManager && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: theme.panelBg, borderRadius: '12px', border: `3px solid ${theme.border}` }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: theme.text }}>Saved Projects</h4>
              {savedProjects.length === 0 ? (
                <p style={{ color: theme.textMuted, opacity: 0.6 }}>No saved projects yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {savedProjects.slice().reverse().map((project) => (
                    <div key={project.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: theme.panel,
                      borderRadius: '8px',
                      border: `2px solid ${theme.border}`
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: theme.text }}>{project.name}</span>
                        <span style={{ fontSize: '0.75rem', color: theme.textMuted, opacity: 0.6 }}>
                          Last updated: {new Date(project.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => loadProjectFromStorage(project)}
                          className="cartoon-button"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', backgroundColor: theme.buttonBg, color: theme.text }}
                        >
                          Load
                        </button>
                        <button 
                          onClick={() => deleteProject(project.id)}
                          className="cartoon-button"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', backgroundColor: '#e74c3c', color: '#fff' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visualizer */}
        <div className="cartoon-panel" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: theme.panel, borderColor: theme.border }}>
          {renderVisualizer()}
        </div>

        {/* Transport & Main Controls */}
        <div className="cartoon-panel" style={{ padding: '1.5rem', marginBottom: '1rem', backgroundColor: theme.panel, borderColor: theme.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={async () => { await initAudioContext(); setIsPlaying(!isPlaying); }}
                className="cartoon-button"
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: isPlaying ? '#e74c3c' : theme.accent,
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
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', backgroundColor: theme.buttonBg, color: theme.text }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: theme.text, fontWeight: 600 }}>BPM</span>
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: `3px solid ${theme.border}`, fontFamily: 'inherit', backgroundColor: theme.inputBg, color: theme.text }}
              />
              <button onClick={tapTempo} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>
                Tap
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: theme.text, fontWeight: 600 }}>Swing</span>
              <input
                type="range"
                min="0"
                max="75"
                value={swing * 100}
                onChange={(e) => setSwing(parseInt(e.target.value) / 100)}
                style={{ width: '80px' }}
              />
              <span style={{ color: theme.text, fontSize: '0.85rem', minWidth: '35px' }}>{Math.round(swing * 100)}%</span>
            </div>

            <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto', alignItems: 'center' }}>
              <span style={{ color: theme.text, fontSize: '0.8rem', marginRight: '0.5rem' }}>Length: {trackLength}</span>
              <button
                onClick={extendTrack}
                disabled={trackLength >= MAX_STEPS}
                className="cartoon-button"
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  backgroundColor: trackLength >= MAX_STEPS ? theme.stepOff : theme.buttonBg,
                  color: theme.text,
                  opacity: trackLength >= MAX_STEPS ? 0.5 : 1
                }}
                title="Extend track (+16 steps)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button
                onClick={reduceTrack}
                disabled={trackLength <= DEFAULT_STEPS}
                className="cartoon-button"
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  backgroundColor: trackLength <= DEFAULT_STEPS ? theme.stepOff : theme.buttonBg,
                  color: theme.text,
                  opacity: trackLength <= DEFAULT_STEPS ? 0.5 : 1
                }}
                title="Reduce track (-16 steps)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              {PATTERNS.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePattern(p)}
                  className="cartoon-button"
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8rem',
                    backgroundColor: activePattern === p ? theme.accent : theme.buttonBg,
                    color: activePattern === p ? '#fff' : theme.text
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
              style={{ padding: '1.5rem', marginBottom: '1rem', overflow: 'hidden', backgroundColor: theme.panel, borderColor: theme.border }}
            >
              <h3 style={{ margin: '0 0 1rem 0', color: theme.text }}>Master Effects</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="checkbox" checked={effects.reverb.enabled} onChange={(e) => setEffects({...effects, reverb: {...effects.reverb, enabled: e.target.checked}})} />
                    <span style={{ color: theme.text, fontWeight: 600 }}>Reverb</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: theme.text }}>Amount: {Math.round(effects.reverb.amount * 100)}%</span>
                    <input type="range" min="0" max="100" value={effects.reverb.amount * 100} onChange={(e) => setEffects({...effects, reverb: {...effects.reverb, amount: parseInt(e.target.value) / 100}})} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input type="checkbox" checked={effects.delay.enabled} onChange={(e) => setEffects({...effects, delay: {...effects.delay, enabled: e.target.checked}})} />
                    <span style={{ color: theme.text, fontWeight: 600 }}>Delay</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: theme.text }}>Mix: {Math.round(effects.delay.amount * 100)}%</span>
                    <input type="range" min="0" max="100" value={effects.delay.amount * 100} onChange={(e) => setEffects({...effects, delay: {...effects.delay, amount: parseInt(e.target.value) / 100}})} />
                  </div>
                </div>

                <div>
                  <span style={{ color: theme.text, fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Master Volume</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: theme.text }}>{Math.round(mixer.master * 100)}%</span>
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
              style={{ padding: '1.5rem', marginBottom: '1rem', overflow: 'hidden', backgroundColor: theme.panel, borderColor: theme.border }}
            >
              <h3 style={{ margin: '0 0 1rem 0', color: theme.text }}>Drum Tracks</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {drumTracks.map((drumTrack, i) => (
                  <div key={drumTrack.id} style={{ padding: '0.75rem', backgroundColor: theme.panelBg, borderRadius: '12px', border: `3px solid ${drumTrack.color}` }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: drumTrack.color, marginBottom: '0.5rem', textAlign: 'center' }}>
                      {drumTrack.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <button
                        onClick={() => updateDrumTrack(i, { mute: !drumTrack.mute })}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.65rem',
                          border: `2px solid ${theme.border}`,
                          borderRadius: '4px',
                          backgroundColor: drumTrack.mute ? '#e74c3c' : theme.buttonBg,
                          color: drumTrack.mute ? '#fff' : theme.text,
                          cursor: 'pointer'
                        }}
                      >M</button>
                      <button
                        onClick={() => updateDrumTrack(i, { solo: !drumTrack.solo })}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.65rem',
                          border: `2px solid ${theme.border}`,
                          borderRadius: '4px',
                          backgroundColor: drumTrack.solo ? '#ffd166' : theme.buttonBg,
                          color: theme.text,
                          cursor: 'pointer'
                        }}
                      >S</button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={(drumTrack.volume || 1) * 100}
                      onChange={(e) => updateDrumTrack(i, { volume: parseInt(e.target.value) / 100 })}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>
              
              <h3 style={{ margin: '0 0 1rem 0', color: theme.text }}>Drum Mixer</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {DRUM_SOUNDS.map((sound, i) => (
                  <div key={sound.name} style={{ padding: '0.75rem', backgroundColor: theme.panelBg, borderRadius: '12px', border: `3px solid ${theme.border}` }}>
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
                          border: `2px solid ${theme.border}`,
                          borderRadius: '4px',
                          backgroundColor: drumMixer[i].mute ? '#e74c3c' : theme.buttonBg,
                          color: drumMixer[i].mute ? '#fff' : theme.text,
                          cursor: 'pointer'
                        }}
                      >M</button>
                      <button
                        onClick={() => setDrumMixer(prev => prev.map((m, j) => i === j ? {...m, solo: !m.solo} : m))}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.65rem',
                          border: `2px solid ${theme.border}`,
                          borderRadius: '4px',
                          backgroundColor: drumMixer[i].solo ? '#ffd166' : theme.buttonBg,
                          color: theme.text,
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
              
              <h3 style={{ margin: '0 0 1rem 0', color: theme.text }}>Instrument Tracks</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                {customTracks.map((track, i) => (
                  <div key={track.id} style={{ padding: '0.75rem', backgroundColor: theme.panelBg, borderRadius: '12px', border: `3px solid ${track.color}` }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: track.color, marginBottom: '0.5rem', textAlign: 'center' }}>
                      {track.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <button
                        onClick={() => updateTrack(i, { mute: !track.mute })}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.65rem',
                          border: `2px solid ${theme.border}`,
                          borderRadius: '4px',
                          backgroundColor: track.mute ? '#e74c3c' : theme.buttonBg,
                          color: track.mute ? '#fff' : theme.text,
                          cursor: 'pointer'
                        }}
                      >M</button>
                      <button
                        onClick={() => updateTrack(i, { solo: !track.solo })}
                        style={{
                          flex: 1,
                          padding: '0.25rem',
                          fontSize: '0.65rem',
                          border: `2px solid ${theme.border}`,
                          borderRadius: '4px',
                          backgroundColor: track.solo ? '#ffd166' : theme.buttonBg,
                          color: theme.text,
                          cursor: 'pointer'
                        }}
                      >S</button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={(track.volume || 0.8) * 100}
                      onChange={(e) => updateTrack(i, { volume: parseInt(e.target.value) / 100 })}
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
              backgroundColor: activeTab === 'drums' ? theme.accent : theme.buttonBg,
              color: activeTab === 'drums' ? '#fff' : theme.text
            }}
          >
            Drum Machine
          </button>
          <button
            onClick={() => setActiveTab('melody')}
            className="cartoon-button"
            style={{
              backgroundColor: activeTab === 'melody' ? theme.accent : theme.buttonBg,
              color: activeTab === 'melody' ? '#fff' : theme.text
            }}
          >
            Synthesizer ({customTracks.length} tracks)
          </button>
          
          {activeTab === 'drums' && (
            <>
              {/* Drum Track tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
                {drumTracks.map((drumTrack, i) => (
                  <button
                    key={drumTrack.id}
                    onClick={() => setActiveDrumTrackIndex(i)}
                    onContextMenu={(e) => handleDrumTrackRightClick(e, i)}
                    className="cartoon-button"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      backgroundColor: activeDrumTrackIndex === i ? drumTrack.color : theme.buttonBg,
                      color: activeDrumTrackIndex === i ? '#fff' : theme.text,
                      border: `2px solid ${drumTrack.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: activeDrumTrackIndex === i ? '#fff' : drumTrack.color 
                    }} />
                    {editingDrumTrackName === i ? (
                      <input
                        type="text"
                        value={tempDrumTrackName}
                        onChange={(e) => setTempDrumTrackName(e.target.value)}
                        onBlur={confirmRenameDrumTrack}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRenameDrumTrack();
                          if (e.key === 'Escape') cancelRenameDrumTrack();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          width: '80px',
                          fontSize: '0.75rem',
                          padding: '0.1rem 0.25rem',
                          border: '1px solid #fff',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          color: '#333',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <span style={{ textDecoration: drumTrack.mute ? 'line-through' : 'none', opacity: drumTrack.mute ? 0.5 : 1 }}>
                        {drumTrack.name}
                      </span>
                    )}
                    {drumTrack.mute && <span style={{ fontSize: '0.6rem', marginLeft: '2px' }}>🔇</span>}
                    {drumTracks.length > 1 && (
                      <span 
                        onClick={(e) => { e.stopPropagation(); removeDrumTrack(i); }}
                        style={{ 
                          marginLeft: '0.25rem', 
                          cursor: 'pointer',
                          opacity: 0.7,
                          fontSize: '0.7rem'
                        }}
                        title="Remove drum track"
                      >×</span>
                    )}
                  </button>
                ))}
                
                {/* Add Drum Track button */}
                <button
                  onClick={addDrumTrack}
                  className="cartoon-button"
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    backgroundColor: theme.buttonBg,
                    color: theme.text,
                    border: `2px dashed ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                  title="Add new drum track"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Drum Kit
                </button>
              </div>
            </>
          )}
          
          {activeTab === 'melody' && (
            <>
              {/* Track tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
                {customTracks.map((track, i) => (
                  <button
                    key={track.id}
                    onClick={() => setActiveTrackIndex(i)}
                    onContextMenu={(e) => handleTrackRightClick(e, i)}
                    className="cartoon-button"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      backgroundColor: activeTrackIndex === i ? track.color : theme.buttonBg,
                      color: activeTrackIndex === i ? '#fff' : theme.text,
                      border: `2px solid ${track.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: activeTrackIndex === i ? '#fff' : track.color 
                    }} />
                    {editingTrackName === i ? (
                      <input
                        type="text"
                        value={tempTrackName}
                        onChange={(e) => setTempTrackName(e.target.value)}
                        onBlur={confirmRenameTrack}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRenameTrack();
                          if (e.key === 'Escape') cancelRenameTrack();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          width: '80px',
                          fontSize: '0.75rem',
                          padding: '0.1rem 0.25rem',
                          border: '1px solid #fff',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          color: '#333',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <span style={{ textDecoration: track.mute ? 'line-through' : 'none', opacity: track.mute ? 0.5 : 1 }}>
                        {track.name}
                      </span>
                    )}
                    {track.mute && <span style={{ fontSize: '0.6rem', marginLeft: '2px' }}>🔇</span>}
                    {customTracks.length > 1 && (
                      <span 
                        onClick={(e) => { e.stopPropagation(); removeTrack(i); }}
                        style={{ 
                          marginLeft: '0.25rem', 
                          cursor: 'pointer',
                          opacity: 0.7,
                          fontSize: '0.7rem'
                        }}
                        title="Remove track"
                      >×</span>
                    )}
                  </button>
                ))}
                
                {/* Add Track button with dropdown */}
                <div ref={addTrackMenuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowAddTrackMenu(!showAddTrackMenu)}
                    className="cartoon-button"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      backgroundColor: theme.buttonBg,
                      color: theme.text,
                      border: `2px dashed ${theme.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                    title="Add new instrument track"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Track
                  </button>
                  
                  {showAddTrackMenu && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      backgroundColor: theme.panel,
                      border: `2px solid ${theme.border}`,
                      borderRadius: '12px',
                      zIndex: 1000,
                      minWidth: '180px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      padding: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: theme.textMuted, padding: '0.25rem 0.5rem', marginBottom: '0.25rem' }}>
                        Choose instrument:
                      </div>
                      {DEFAULT_INSTRUMENTS.map((preset, i) => (
                        <button
                          key={preset.id}
                          onClick={() => addTrack(i)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: 'none',
                            backgroundColor: theme.panelBg,
                            color: theme.text,
                            borderRadius: '8px',
                            marginBottom: '0.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonActive}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.panelBg}
                        >
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: preset.color }} />
                          {preset.name}
                        </button>
                      ))}
                      <div style={{ borderTop: `1px solid ${theme.border}`, margin: '0.5rem 0' }} />
                      <button
                        onClick={() => duplicateTrack(activeTrackIndex)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: 'none',
                          backgroundColor: theme.panelBg,
                          color: theme.text,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonActive}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.panelBg}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Duplicate Current
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button onClick={undo} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>Undo</button>
            <button onClick={redo} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>Redo</button>
            <button onClick={copyPattern} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>Copy</button>
            <button onClick={pastePattern} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>Paste</button>
            <button onClick={clearPattern} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>Clear</button>
            <button onClick={randomizePattern} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>Random</button>
          </div>
        </div>

        {/* Track Context Menu */}
        {trackContextMenu.visible && trackContextMenu.trackIndex !== null && (
          <div
            ref={trackContextMenuRef}
            style={{
              position: 'absolute',
              top: trackContextMenu.y,
              left: trackContextMenu.x,
              backgroundColor: theme.panel,
              border: `2px solid ${theme.border}`,
              borderRadius: '12px',
              zIndex: 10000,
              minWidth: '160px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              padding: '0.5rem'
            }}
          >
            {(() => {
              const track = customTracks[trackContextMenu.trackIndex];
              return (
                <>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: theme.textMuted, 
                    padding: '0.25rem 0.5rem', 
                    marginBottom: '0.5rem',
                    borderBottom: `1px solid ${theme.border}`
                  }}>
                    {track?.name}
                  </div>
                  
                  {/* Mute option */}
                  <button
                    onClick={() => toggleTrackMute(trackContextMenu.trackIndex)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      backgroundColor: track?.mute ? 'rgba(231, 76, 60, 0.2)' : theme.panelBg,
                      color: track?.mute ? '#e74c3c' : theme.text,
                      borderRadius: '8px',
                      marginBottom: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: track?.mute ? '600' : '400'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = track?.mute ? 'rgba(231, 76, 60, 0.3)' : theme.buttonActive}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = track?.mute ? 'rgba(231, 76, 60, 0.2)' : theme.panelBg}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {track?.mute ? (
                        <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                      ) : (
                        <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>
                      )}
                    </svg>
                    {track?.mute ? 'Unmute' : 'Mute'}
                  </button>
                  
                  {/* Rename option */}
                  <button
                    onClick={() => startRenameTrack(trackContextMenu.trackIndex)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      backgroundColor: theme.panelBg,
                      color: theme.text,
                      borderRadius: '8px',
                      marginBottom: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonActive}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.panelBg}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Rename
                  </button>
                  
                  {/* Color picker */}
                  <div style={{ 
                    padding: '0.5rem', 
                    borderTop: `1px solid ${theme.border}`,
                    marginTop: '0.25rem'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: theme.textMuted, marginBottom: '0.5rem' }}>
                      Change Color
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      {TRACK_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => changeTrackColor(trackContextMenu.trackIndex, color)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: color,
                            border: track?.color === color ? '2px solid #fff' : 'none',
                            cursor: 'pointer',
                            boxShadow: track?.color === color ? `0 0 0 2px ${theme.border}` : 'none'
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Change Instrument Type */}
                  <div style={{ 
                    padding: '0.5rem', 
                    borderTop: `1px solid ${theme.border}`,
                    marginTop: '0.25rem'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: theme.textMuted, marginBottom: '0.5rem' }}>
                      Change Instrument Type
                    </div>
                    {DEFAULT_INSTRUMENTS.map((preset, presetIndex) => {
                      const trackIndex = trackContextMenu.trackIndex;
                      return (
                        <button
                          key={preset.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            changeTrackPreset(trackIndex, presetIndex);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.5rem',
                            border: 'none',
                            backgroundColor: theme.panelBg,
                            color: theme.text,
                            borderRadius: '6px',
                            marginBottom: '0.15rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonActive}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.panelBg}
                        >
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: preset.color }} />
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Delete option */}
                  {customTracks.length > 1 && (
                    <>
                      <div style={{ borderTop: `1px solid ${theme.border}`, margin: '0.5rem 0' }} />
                      <button
                        onClick={() => deleteTrackFromMenu(trackContextMenu.trackIndex)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: 'none',
                          backgroundColor: theme.panelBg,
                          color: '#e74c3c',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.panelBg}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Delete Track
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Drum Track Context Menu */}
        {drumTrackContextMenu.visible && drumTrackContextMenu.drumTrackIndex !== null && (
          <div
            ref={drumTrackContextMenuRef}
            style={{
              position: 'absolute',
              top: drumTrackContextMenu.y,
              left: drumTrackContextMenu.x,
              backgroundColor: theme.panel,
              border: `2px solid ${theme.border}`,
              borderRadius: '12px',
              zIndex: 10000,
              minWidth: '160px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              padding: '0.5rem'
            }}
          >
            {(() => {
              const drumTrack = drumTracks[drumTrackContextMenu.drumTrackIndex];
              return (
                <>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: theme.textMuted, 
                    padding: '0.25rem 0.5rem', 
                    marginBottom: '0.5rem',
                    borderBottom: `1px solid ${theme.border}`
                  }}>
                    {drumTrack?.name}
                  </div>
                  
                  {/* Mute option */}
                  <button
                    onClick={() => toggleDrumTrackMuteFromMenu(drumTrackContextMenu.drumTrackIndex)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      backgroundColor: drumTrack?.mute ? 'rgba(231, 76, 60, 0.2)' : theme.panelBg,
                      color: drumTrack?.mute ? '#e74c3c' : theme.text,
                      borderRadius: '8px',
                      marginBottom: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: drumTrack?.mute ? '600' : '400'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = drumTrack?.mute ? 'rgba(231, 76, 60, 0.3)' : theme.buttonActive}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = drumTrack?.mute ? 'rgba(231, 76, 60, 0.2)' : theme.panelBg}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {drumTrack?.mute ? (
                        <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                      ) : (
                        <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>
                      )}
                    </svg>
                    {drumTrack?.mute ? 'Unmute' : 'Mute'}
                  </button>
                  
                  {/* Rename option */}
                  <button
                    onClick={() => startRenameDrumTrack(drumTrackContextMenu.drumTrackIndex)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      backgroundColor: theme.panelBg,
                      color: theme.text,
                      borderRadius: '8px',
                      marginBottom: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.buttonActive}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.panelBg}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Rename
                  </button>
                  
                  {/* Color picker */}
                  <div style={{ 
                    padding: '0.5rem', 
                    borderTop: `1px solid ${theme.border}`,
                    marginTop: '0.25rem'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: theme.textMuted, marginBottom: '0.5rem' }}>
                      Change Color
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      {TRACK_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => changeDrumTrackColor(drumTrackContextMenu.drumTrackIndex, color)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: color,
                            border: drumTrack?.color === color ? '2px solid #fff' : 'none',
                            cursor: 'pointer',
                            boxShadow: drumTrack?.color === color ? `0 0 0 2px ${theme.border}` : 'none'
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Delete option */}
                  {drumTracks.length > 1 && (
                    <>
                      <div style={{ borderTop: `1px solid ${theme.border}`, margin: '0.5rem 0' }} />
                      <button
                        onClick={() => deleteDrumTrackFromMenu(drumTrackContextMenu.drumTrackIndex)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: 'none',
                          backgroundColor: theme.panelBg,
                          color: '#e74c3c',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.panelBg}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Delete Drum Track
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Sequencer Grid */}
        <div className="cartoon-panel" style={{ padding: '1.5rem', overflowX: 'auto', backgroundColor: theme.panel, borderColor: theme.border }}>
          {activeTab === 'drums' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 'max-content' }}>
              {/* Step indicators */}
              <div style={{ display: 'flex', paddingLeft: '120px' }}>
                {Array.from({ length: trackLength }, (_, i) => (
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
                      color: theme.text,
                      opacity: i % 4 === 0 ? 0.8 : 0.3,
                      backgroundColor: i === currentStep && isPlaying ? theme.accent : 'transparent',
                      borderRadius: '4px',
                      margin: '0 2px'
                    }}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Drum rows with velocity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
              {DRUM_SOUNDS.map((sound, soundIndex) => (
                <div key={sound.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '110px', fontWeight: 700, color: sound.color, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: sound.color }} />
                    {sound.name}
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
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
                            border: `2px solid ${theme.border}`,
                            borderRadius: '6px',
                            backgroundColor: velocity === 0 ? theme.panelBg : velocity === 1 ? sound.color : `${sound.color}80`,
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
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 'max-content' }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {/* Step indicators */}
              <div style={{ display: 'flex', paddingLeft: '50px' }}>
                {Array.from({ length: trackLength }, (_, i) => (
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
                      color: theme.text,
                      opacity: i % 4 === 0 ? 0.8 : 0.3,
                      backgroundColor: i === currentStep && isPlaying ? theme.stepHalf : 'transparent',
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
                      color: isBlack ? theme.panelBg : theme.text, 
                      fontSize: '0.7rem',
                      backgroundColor: isBlack ? theme.text : theme.stepOff,
                      padding: '0.25rem',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      {note}
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {currentMelodyPattern[actualIndex].map((noteData, stepIndex) => {
                        const isOn = !!noteData;
                        const activeTrackColor = customTracks[activeTrackIndex]?.color || theme.stepHalf;
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
                              border: `2px solid ${theme.border}`,
                              borderRadius: '4px',
                              backgroundColor: noteData ? activeTrackColor : stepIndex === currentStep && isPlaying ? theme.stepOff : isBlack ? `${theme.border}40` : theme.panelBg,
                              opacity: stepIndex === currentStep && isPlaying ? 0.8 : 1,
                              cursor: isDragging ? 'crosshair' : 'pointer',
                              margin: '0 2px',
                              transition: 'all 0.1s ease, transform 0.05s ease',
                              boxShadow: noteData ? `0 0 4px ${activeTrackColor}` : 'none',
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
          <div className="cartoon-panel" style={{ padding: '1rem', flex: 1, minWidth: '200px', backgroundColor: theme.panel, borderColor: theme.border }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: theme.text, fontSize: '0.9rem' }}>Pattern Chain</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {chain.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setChainIndex(i)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: i === chainIndex ? theme.accent : theme.buttonBg,
                    color: i === chainIndex ? '#fff' : theme.text,
                    borderRadius: '8px',
                    border: `3px solid ${theme.border}`,
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
                style={{ padding: '0.4rem', borderRadius: '8px', border: `3px solid ${theme.border}`, fontFamily: 'inherit', fontSize: '0.8rem', backgroundColor: theme.inputBg, color: theme.text }}
              >
                <option value="">Add pattern...</option>
                {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => setChain(chain.slice(0, -1))} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>
                Remove
              </button>
              <button onClick={() => setChain(['A1'])} className="cartoon-button" style={{ fontSize: '0.8rem', backgroundColor: theme.buttonBg, color: theme.text }}>
                Reset
              </button>
            </div>
          </div>

          {activeTab === 'melody' && (
            <div className="cartoon-panel" style={{ padding: '1rem', flex: 2, minWidth: '300px', backgroundColor: theme.panel, borderColor: theme.border }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: theme.text, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: customTracks[activeTrackIndex]?.color || theme.accent }} />
                {customTracks[activeTrackIndex]?.name || 'Track'} Settings
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: theme.text }}>Waveform</span>
                  <select 
                    value={customTracks[activeTrackIndex]?.waveform || 'sawtooth'}
                    onChange={(e) => updateTrack(activeTrackIndex, { waveform: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '0.3rem', 
                      borderRadius: '6px', 
                      border: `2px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      fontSize: '0.8rem'
                    }}
                  >
                    {waveformOptions.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: theme.text }}>Attack</span>
                  <input type="range" min="1" max="100" value={(customTracks[activeTrackIndex]?.attack || 0.01) * 100} onChange={(e) => updateTrack(activeTrackIndex, { attack: parseInt(e.target.value) / 100 })} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: theme.text }}>Decay</span>
                  <input type="range" min="5" max="200" value={(customTracks[activeTrackIndex]?.decay || 0.2) * 100} onChange={(e) => updateTrack(activeTrackIndex, { decay: parseInt(e.target.value) / 100 })} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: theme.text }}>Sustain</span>
                  <input type="range" min="0" max="100" value={(customTracks[activeTrackIndex]?.sustain || 0.3) * 100} onChange={(e) => updateTrack(activeTrackIndex, { sustain: parseInt(e.target.value) / 100 })} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: theme.text }}>Release</span>
                  <input type="range" min="5" max="100" value={(customTracks[activeTrackIndex]?.release || 0.5) * 100} onChange={(e) => updateTrack(activeTrackIndex, { release: parseInt(e.target.value) / 100 })} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: theme.text }}>Filter Cutoff</span>
                  <input type="range" min="100" max="10000" value={customTracks[activeTrackIndex]?.filterCutoff || 2000} onChange={(e) => updateTrack(activeTrackIndex, { filterCutoff: parseInt(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: theme.text }}>Resonance</span>
                  <input type="range" min="1" max="20" value={customTracks[activeTrackIndex]?.filterResonance || 5} onChange={(e) => updateTrack(activeTrackIndex, { filterResonance: parseInt(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: theme.text }}>Volume</span>
                  <input type="range" min="0" max="150" value={(customTracks[activeTrackIndex]?.volume || 0.8) * 100} onChange={(e) => updateTrack(activeTrackIndex, { volume: parseInt(e.target.value) / 100 })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: theme.text, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={customTracks[activeTrackIndex]?.polyphony !== false}
                      onChange={(e) => updateTrack(activeTrackIndex, { polyphony: e.target.checked })}
                    />
                    Polyphony
                  </label>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: theme.text, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={customTracks[activeTrackIndex]?.mute || false}
                      onChange={(e) => updateTrack(activeTrackIndex, { mute: e.target.checked })}
                    />
                    Mute
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="cartoon-panel" style={{ padding: '1rem', minWidth: '200px', backgroundColor: theme.panel, borderColor: theme.border }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: theme.text, fontSize: '0.9rem' }}>Project</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={exportPattern} className="cartoon-button" style={{ fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: theme.buttonBg, color: theme.text }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Project
              </button>
              <label className="cartoon-button" style={{ fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: theme.buttonBg, color: theme.text }}>
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
                style={{ fontSize: '0.85rem', width: '100%', backgroundColor: isRecording ? '#e74c3c' : theme.buttonBg, color: isRecording ? '#fff' : theme.text }}
              >
                {isRecording ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>Stop Recording</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem' }}><circle cx="12" cy="12" r="10"/></svg>Record</>
                )}
              </button>
              <button onClick={exportToWav} className="cartoon-button" style={{ fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: theme.buttonBg, color: theme.text }} disabled={recordedChunks.length === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export Audio
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: theme.panel, borderRadius: '16px', border: `3px solid ${theme.border}` }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: theme.text, fontSize: '1rem' }}>Quick Reference</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: theme.text, opacity: 0.8 }}>
            <div>
              <strong>Drum Machine:</strong><br/>
              • Click once = Full velocity<br/>
              • Click again = Half velocity<br/>
              • Click third time = Off<br/>
              • Right-click to audition sound<br/>
              • Click and drag to select multiple
            </div>
            <div>
              <strong>Synthesizer & Multi-Track:</strong><br/>
              • Add multiple instrument tracks (Guitar, Bass, Lead, etc.)<br/>
              • Each track has its own pattern and sound settings<br/>
              • Click track tabs to switch between instruments<br/>
              • <b>Right-click a track</b> to mute, rename, or change color<br/>
              • Single click = 16th note, Double click = 8th note<br/>
              • Poly mode for chords, per-track ADSR & filter
            </div>
            <div>
              <strong>Track Length:</strong><br/>
              • Click + to extend track (+16 steps, max 128)<br/>
              • Click - to reduce track (-16 steps, min 32)<br/>
              • Sequencer becomes scrollable for longer patterns<br/>
              • All patterns are extended together
            </div>
            <div>
              <strong>Pattern Chain:</strong><br/>
              • Create sequences across patterns A1, A2, B1, B2<br/>
              • Playback cycles through chain automatically<br/>
              • Build full songs with pattern variations
            </div>
          </div>
        </div>

        {/* Corner Clock */}
        <div style={{ position: 'fixed', bottom: '1.8rem', left: '2rem', zIndex: 100, fontFamily: 'inherit', display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
          <CornerClock textColor={theme.text} />
        </div>
      </div>
    </main>
  );
}
