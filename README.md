# Velora

A personal workspace and music production environment built with Next.js and React.




## Main Workspace Features

### Workspace Tools

- **Pomodoro Timer**: Focus timer with customizable work and break intervals, session tracking, and visual progress indicator
- **Music Player**: YouTube-integrated player with playlist support and keyboard controls (Space to play/pause)
- **To-Do List**: Task management with add, complete, and delete functionality
- **Analog Clock**: Resizable analog clock with digital time display and date
- **Scratchpad**: Quick text notes with persistent storage
- **Session Stats**: Productivity analytics showing focus sessions and completed tasks

### Workspace Controls

- Hamburger menu to toggle tools on/off
- Draggable widgets that can be repositioned anywhere on the canvas
- Keyboard shortcuts: Space for play/pause, Escape to close menu
- Idle detection that fades UI when inactive
- Five background color options (Sand, Chalk, Sage, Dusk, Stone)


## Music Studio Features

### Drum Machine

- 16-step sequencer with 10 drum sounds (Kick, Snare, Clap, Closed Hat, Open Hat, Tom, Cowbell, Rim, Shaker, Crash)
- Multiple drum tracks with independent patterns
- Three velocity levels: full, half, and off
- Click to toggle steps
- Click and drag for multi-step selection
- Right-click any drum sound to audition
- Individual track mute, solo, and volume controls
- Right-click track tabs for context menu (mute, rename, change color, delete)

### Synthesizer

- Multi-track instrument sequencer
- Per-track synthesizer settings:
  - Waveform selection (sine, square, sawtooth, triangle, fatsawtooth)
  - ADSR envelope (attack, decay, sustain, release)
  - Filter with cutoff, resonance, and type (lowpass, highpass, bandpass)
  - Polyphony mode for chords
- 10 instrument presets (Classic Bass, 80s Lead, Acid Bass, Pluck, FM Bell, Brass, Pad, Guitar, Strings, Leads)
- Custom color coding for each track
- Right-click track tabs for context menu (mute, rename, change color, change instrument, delete)

### Pattern System

- Four patterns available: A1, A2, B1, B2
- Pattern chaining for song sequencing
- Automatic pattern cycling during playback
- Copy and paste patterns between slots
- Clear pattern function

### Track Management

- Extend track length (+16 steps, maximum 128 steps)
- Reduce track length (-16 steps, minimum 32 steps)
- Scrollable sequencer for long patterns
- Undo and redo actions

### Mixer

- Master volume control
- Drum bus with individual sound controls
- Melody bus for instrument tracks
- Per-track volume, mute, and solo
- Reverb effect with adjustable amount
- Delay effect with adjustable mix

### Transport Controls

- Play/Stop button
- Reset to beginning
- BPM control (40 to 240 BPM)
- Tap tempo button
- Swing control (0% to 75%)

### Audio Export

- Record button to capture audio output
- Export recorded audio as WAV file

### Project Management

- Save projects to browser localStorage
- Load saved projects
- Delete saved projects
- Project name editing
- Automatic timestamp tracking


## Themes

- Light theme with warm earthy colors
- Dark theme with blue and red accents
- Smooth animated transitions between themes
- Corner clock displays current time in both themes


## Keyboard Shortcuts

- Space: Play/Pause music (main page) or sequencer (studio)
- Escape: Close menu


