'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

const YT_PRESETS = [
  { label: 'Lofi Girl',    id: 'jfKfPfyJRdk' },
  { label: 'Jazz Cafe',    id: 'HuFYqnbVbzY' },
  { label: 'Deep Focus',   id: 'WPni755-Krg' },
  { label: 'Study Beats',  id: 'lTRiuFIWV54' },
];

const SPOTIFY_PRESETS = [
  { label: 'Lofi Beats',      id: '37i9dQZF1DWWQRwui0ExPn' },
  { label: 'Deep Focus',      id: '37i9dQZF1DWZeKCadgRdKQ' },
  { label: 'Jazz Vibes',      id: '37i9dQZF1DX0SM0LYsmbMT' },
  { label: 'Peaceful Piano',  id: '37i9dQZF1DX4sWSpwq3LiO' },
];

const SunIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

export default function MusicPlayer({ onClose, onSpacePress }) {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useLocalStorage('velora-music-volume', 50);
  const [videoId, setVideoId] = useLocalStorage('velora-video-id', YT_PRESETS[0].id);
  const [spotifyId, setSpotifyId] = useLocalStorage('velora-spotify-id', SPOTIFY_PRESETS[0].id);
  const [source, setSource] = useLocalStorage('velora-music-source', 'youtube');
  const [ytPlayer, setYtPlayer] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [ytAccessToken, setYtAccessToken] = useLocalStorage('velora-yt-access-token', null);
  const [ytUserPlaylists, setYtUserPlaylists] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [queue, setQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Fetch video details when videoId changes
  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!videoId || videoId.length !== 11) {
        setVideoTitle('');
        setVideoThumbnail('');
        return;
      }
      
      // Check if this is a preset - use preset data if available
      const preset = YT_PRESETS.find(p => p.id === videoId);
      if (preset) {
        // For presets, fetch the actual thumbnail from YouTube
        setVideoTitle(preset.label);
        setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        return;
      }
      
      // For non-presets, try to fetch from API
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        // Fallback to oEmbed which doesn't need API key
        try {
          const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (response.ok) {
            const data = await response.json();
            setVideoTitle(data.title);
            setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
          } else {
            setVideoTitle('Now Playing');
            setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
          }
        } catch (err) {
          setVideoTitle('Now Playing');
          setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        }
        return;
      }
      
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
        );
        const data = await response.json();
        if (data.items?.[0]?.snippet) {
          setVideoTitle(data.items[0].snippet.title);
          setVideoThumbnail(data.items[0].snippet.thumbnails?.medium?.url || 
                           data.items[0].snippet.thumbnails?.default?.url || 
                           `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        } else {
          // API returned no items - use fallback
          setVideoTitle('Now Playing');
          setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        }
      } catch (err) {
        console.error('Failed to fetch video details:', err);
        setVideoTitle('Now Playing');
        setVideoThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      }
    };
    fetchVideoDetails();
  }, [videoId]);

  // Expose play/pause to space key from parent
  useEffect(() => { onSpacePress?.(() => setIsMusicPlaying(p => !p)); }, []); // eslint-disable-line

  // Parse OAuth tokens from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('yt_access_token')) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get('yt_access_token');
      const refreshToken = params.get('yt_refresh_token');
      const expires = params.get('yt_expires');
      if (accessToken) {
        setYtAccessToken({ accessToken, refreshToken, expires });
        window.history.replaceState(null, null, ' ');
      }
    }
  }, []);

  // Fetch user's YouTube playlists when connected
  useEffect(() => {
    if (!ytAccessToken?.accessToken || source !== 'youtube') return;
    
    setIsLoadingPlaylists(true);
    fetch(`/api/youtube/playlists?access_token=${ytAccessToken.accessToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.playlists) setYtUserPlaylists(data.playlists);
      })
      .catch(console.error)
      .finally(() => setIsLoadingPlaylists(false));
  }, [ytAccessToken, source]);

  const handleConnectYouTube = () => {
    window.location.href = '/api/auth/youtube/callback';
  };

  const handleDisconnectYouTube = () => {
    setYtAccessToken(null);
    setYtUserPlaylists([]);
  };

  const playPlaylist = async (playlistId) => {
    // Fetch all playlist items for queue (no cap)
    try {
      let allItems = [];
      let nextPageToken = null;
      
      do {
        const url = nextPageToken 
          ? `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}`
          : `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`;
          
        const response = await fetch(url, {
          headers: ytAccessToken?.accessToken ? {
            'Authorization': `Bearer ${ytAccessToken.accessToken}`
          } : {}
        });
        
        const data = await response.json();
        if (data.items?.length > 0) {
          const playlistItems = data.items.map(item => ({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
          }));
          allItems = [...allItems, ...playlistItems];
        }
        nextPageToken = data.nextPageToken;
      } while (nextPageToken);
      
      if (allItems.length > 0) {
        setQueue(allItems);
        setCurrentQueueIndex(0);
        setVideoId(allItems[0].videoId);
        setIsMusicPlaying(false);
        setYtPlayer(null);
        setShowSettings(false);
        setShowQueue(true); // Auto-show queue when playlist is loaded
      }
    } catch (err) {
      console.error('Failed to load playlist:', err);
    }
  };

  const playQueueItem = (index) => {
    if (index >= 0 && index < queue.length) {
      const wasPlaying = isMusicPlaying;
      setCurrentQueueIndex(index);
      setVideoId(queue[index].videoId);
      setYtPlayer(null);
      // Keep the same playing state
      setTimeout(() => {
        if (wasPlaying) {
          setIsMusicPlaying(true);
        }
      }, 100);
    }
  };

  const playNext = () => {
    if (currentQueueIndex < queue.length - 1) {
      const wasPlaying = isMusicPlaying;
      setCurrentQueueIndex(currentQueueIndex + 1);
      setVideoId(queue[currentQueueIndex + 1].videoId);
      setYtPlayer(null);
      // Keep the same playing state
      setTimeout(() => {
        if (wasPlaying) {
          setIsMusicPlaying(true);
        }
      }, 100);
    }
  };

  const playPrevious = () => {
    if (currentQueueIndex > 0) {
      const wasPlaying = isMusicPlaying;
      setCurrentQueueIndex(currentQueueIndex - 1);
      setVideoId(queue[currentQueueIndex - 1].videoId);
      setYtPlayer(null);
      // Keep the same playing state
      setTimeout(() => {
        if (wasPlaying) {
          setIsMusicPlaying(true);
        }
      }, 100);
    }
  };

  const shuffleQueue = () => {
    if (queue.length <= 1) return;
    
    const newQueue = [...queue];
    const currentIndex = currentQueueIndex;
    const currentTrack = newQueue[currentIndex];
    
    // Remove current track from array
    newQueue.splice(currentIndex, 1);
    
    // Shuffle remaining tracks
    for (let i = newQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
    }
    
    // Put current track back at the beginning
    newQueue.unshift(currentTrack);
    
    setQueue(newQueue);
    setCurrentQueueIndex(0);
    setIsShuffled(true);
  };

  const unshuffleQueue = () => {
    // This would require storing the original queue order
    // For now, we'll just toggle the shuffle state off
    setIsShuffled(false);
  };

  const seekForward = () => {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && typeof ytPlayer.seekTo === 'function') {
      try {
        const currentTime = ytPlayer.getCurrentTime();
        ytPlayer.seekTo(currentTime + 10, true);
      } catch(e) {}
    }
  };

  const seekBackward = () => {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && typeof ytPlayer.seekTo === 'function') {
      try {
        const currentTime = ytPlayer.getCurrentTime();
        ytPlayer.seekTo(Math.max(0, currentTime - 10), true);
      } catch(e) {}
    }
  };

  useEffect(() => {
    if (source !== 'youtube' || !ytPlayer) return;
    try {
      const state = typeof ytPlayer.getPlayerState === 'function' ? ytPlayer.getPlayerState() : -1;
      if (isMusicPlaying) { ytPlayer.playVideo(); }
      else if (state === 1 || state === 3) { ytPlayer.pauseVideo(); }
    } catch(e) {}
  }, [isMusicPlaying, ytPlayer, source]);

  useEffect(() => {
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      try { ytPlayer.setVolume(musicVolume); } catch(e) {}
    }
  }, [musicVolume, ytPlayer]);

  useEffect(() => {
    let interval;
    if (isMusicPlaying && source === 'youtube') interval = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 0.1), 100);
    return () => clearInterval(interval);
  }, [isMusicPlaying, source]);

  const onYtReady = (e) => { setYtPlayer(e.target); try { e.target.setVolume(musicVolume); } catch(e2) {} };

  const applyCustomId = (e) => {
    e.preventDefault();
    const id = customInput.trim();
    if (id) {
      const match = id.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      const videoId = match ? match[1] : id;
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        setVideoId(videoId);
        setIsMusicPlaying(false);
        setYtPlayer(null);
        setShowSettings(false);
        setQueue([]);
        setCurrentQueueIndex(0);
        setCustomInput('');
      }
    }
  };

  const currentYt = YT_PRESETS.find(p => p.id === videoId);

  return (
    <div className="cartoon-panel" style={{ position: 'relative', padding: minimized ? '0 1.5rem' : '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '650px', minWidth: minimized ? '240px' : 'unset', minHeight: minimized ? '64px' : '500px', justifyContent: minimized ? 'center' : 'flex-start', color: 'var(--text-brown)', transition: 'padding 0.3s, min-height 0.3s' }}>

      {/* Controls row */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
        <button onClick={() => setShowSettings(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.35, padding: '0.4rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '4px' }}>
        <button onClick={() => setMinimized(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: '0.4rem', fontSize: '1.1rem', lineHeight: 1 }}>—</button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: '0.4rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Hidden YouTube iframe */}
      {source === 'youtube' && (
        <div style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}>
          <YouTube key={videoId} videoId={videoId} opts={{ playerVars: { autoplay: 0, controls: 0 } }} onReady={onYtReady} />
        </div>
      )}

      {/* Title row always visible */}
      <div style={{ fontWeight: 700, fontSize: '1rem', opacity: 0.7, marginTop: '0.25rem', textAlign: 'center' }}>
        {minimized ? (source === 'spotify' ? 'Spotify' : currentYt?.label || 'Music') : 'Music Player'}
      </div>

      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div key="body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {showSettings ? (
              <>
                {/* Source Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--border-color)', borderRadius: '12px', padding: '4px' }}>
                  {['youtube', 'spotify'].map(s => (
                    <button key={s} onClick={() => setSource(s)}
                      style={{ flex: 1, padding: '0.4rem', borderRadius: '9px', border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                        backgroundColor: source === s ? 'var(--accent-color)' : 'transparent',
                        color: source === s ? '#fff' : 'var(--text-brown)', opacity: source === s ? 1 : 0.6 }}
                    >{s === 'youtube' ? 'YouTube' : 'Spotify'}</button>
                  ))}
                </div>

                {source === 'youtube' ? (
                  <>
                    {/* YouTube Connect Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>YouTube Account</span>
                      {ytAccessToken ? (
                        <button onClick={handleDisconnectYouTube} className="cartoon-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--border-color)', color: 'var(--text-brown)' }}>
                          Disconnect
                        </button>
                      ) : (
                        <button onClick={handleConnectYouTube} className="cartoon-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: '#FF0000', color: '#fff' }}>
                          Connect YouTube
                        </button>
                      )}
                    </div>

                    {/* User's Playlists */}
                    {ytAccessToken && (
                      <>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', opacity: 0.7, marginBottom: '-0.5rem' }}>Your Playlists</div>
                        {isLoadingPlaylists ? (
                          <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.5 }}>Loading...</div>
                        ) : ytUserPlaylists.length > 0 ? (
                          ytUserPlaylists.map(p => (
                            <button key={p.id} className="cartoon-button" onClick={() => playPlaylist(p.id)}
                              style={{ textAlign: 'left', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: (videoTitle && p.label && videoTitle.includes(p.label.slice(0, 20))) ? 'var(--accent-color)' : 'var(--panel-white)', color: (videoTitle && p.label && videoTitle.includes(p.label.slice(0, 20))) ? '#fff' : 'var(--text-brown)' }}
                            >
                              {p.thumbnail && (
                                <img src={p.thumbnail} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                              )}
                              <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{p.itemCount} videos</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.5, fontSize: '0.85rem' }}>No playlists found</div>
                        )}
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
                      </>
                    )}

                    {/* Preset Stations */}
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', opacity: 0.7, marginBottom: '-0.5rem' }}>Preset Stations</div>
                    {YT_PRESETS.map(p => (
                      <button key={p.id} className="cartoon-button" onClick={() => { setVideoId(p.id); setIsMusicPlaying(false); setYtPlayer(null); setShowSettings(false); setQueue([]); setCurrentQueueIndex(0); }}
                        style={{ textAlign: 'left', padding: '0.7rem 1rem', backgroundColor: videoId === p.id ? 'var(--accent-color)' : 'var(--panel-white)', color: videoId === p.id ? '#fff' : 'var(--text-brown)' }}
                      >{videoId === p.id ? `✓ ${p.label}` : p.label}</button>
                    ))}
                    <form onSubmit={applyCustomId} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="Paste YouTube URL or ID"
                        style={{ flex: 1, padding: '0.7rem', borderRadius: '12px', border: '3px solid var(--border-color)', backgroundColor: 'var(--panel-white)', outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--text-brown)' }}
                      />
                      <button type="submit" className="cartoon-button" style={{ padding: '0 1rem', backgroundColor: 'var(--accent-color)', color: '#fff' }}>Go</button>
                    </form>
                    
                    {/* Queue Status */}
                    {queue.length > 0 && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.5rem', 
                        backgroundColor: 'var(--accent-color)', 
                        color: '#fff', 
                        borderRadius: '8px', 
                        fontSize: '0.8rem', 
                        textAlign: 'center',
                        cursor: 'pointer'
                      }} onClick={() => setShowQueue(!showQueue)}>
                        📋 Queue: {queue.length} tracks {showQueue ? '(Hide)' : '(Show)'}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {SPOTIFY_PRESETS.map(p => (
                      <button key={p.id} className="cartoon-button" onClick={() => { setSpotifyId(p.id); setShowSettings(false); setQueue([]); setCurrentQueueIndex(0); }}
                        style={{ textAlign: 'left', padding: '0.7rem 1rem', backgroundColor: spotifyId === p.id ? '#1DB954' : 'var(--panel-white)', color: spotifyId === p.id ? '#fff' : 'var(--text-brown)' }}
                      >{spotifyId === p.id ? `✓ ${p.label}` : p.label}</button>
                    ))}
                  </>
                )}
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', opacity: 0.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-brown)' }}>Back</button>
              </>
            ) : source === 'spotify' ? (
              /* Spotify Embedded Player */
              <iframe
                src={`https://open.spotify.com/embed/playlist/${spotifyId}?utm_source=generator&theme=0`}
                width="100%" height="152" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy" style={{ borderRadius: '16px' }}
              />
            ) : (
              /* YouTube Player UI */
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  {/* Album Art */}
                  <div style={{ 
                    width: '140px', 
                    height: '140px', 
                    borderRadius: '20px', 
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '4px 4px 0px var(--shadow-color), inset 0 0 0 4px rgba(255,255,255,0.3)'
                  }}>
                    {videoThumbnail ? (
                      <>
                        <img 
                          src={videoThumbnail} 
                          alt={videoTitle} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            filter: isMusicPlaying ? 'none' : 'grayscale(0.3)'
                          }} 
                        />
                        {/* Cartoon overlay */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          border: '4px solid var(--border-color)',
                          borderRadius: '20px',
                          pointerEvents: 'none'
                        }} />
                        {/* Play indicator overlay */}
                        {!isMusicPlaying && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: 'var(--accent-color)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#fffdf9'
                      }}>
                        <SunIcon />
                      </div>
                    )}
                  </div>
                  {/* Track Info */}
                  <div style={{ textAlign: 'center', maxWidth: '100%' }}>
                    <h2 style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '300px'
                    }} title={videoTitle || currentYt?.label || 'Custom Stream'}>
                      {videoTitle || currentYt?.label || 'Custom Stream'}
                    </h2>
                    <p style={{ fontSize: '0.85rem', opacity: 0.5, margin: '0.2rem 0 0' }}>YouTube Music</p>
                  </div>
                  <div style={{ width: '100%', padding: '0 0.5rem' }}>
                    <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'var(--accent-color)', width: `${progress}%`, borderRadius: '3px', transition: 'width 0.1s linear' }}/>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                    <button className="cartoon-button" onClick={seekBackward}
                      style={{ padding: '0.6rem', backgroundColor: 'var(--panel-white)', color: 'var(--text-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Back 10 seconds"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 19 11 5"/><polygon points="19 19 19 5"/><polygon points="1 12 7 6 7 18"/>
                      </svg>
                    </button>
                    
                    <button className="cartoon-button" onClick={playPrevious}
                      style={{ padding: '0.6rem', backgroundColor: 'var(--panel-white)', color: 'var(--text-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Previous track"
                      disabled={currentQueueIndex === 0}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
                      </svg>
                    </button>
                    
                    <button className="cartoon-button" onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                      style={{ padding: '0.8rem 1.2rem', backgroundColor: 'var(--accent-color)', color: '#fffdf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isMusicPlaying
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                    </button>
                    
                    <button className="cartoon-button" onClick={playNext}
                      style={{ padding: '0.6rem', backgroundColor: 'var(--panel-white)', color: 'var(--text-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Next track"
                      disabled={currentQueueIndex === queue.length - 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
                      </svg>
                    </button>
                    
                    <button className="cartoon-button" onClick={seekForward}
                      style={{ padding: '0.6rem', backgroundColor: 'var(--panel-white)', color: 'var(--text-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Forward 10 seconds"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 19 13 5"/><polygon points="5 19 5 5"/><polygon points="23 12 17 6 17 18"/>
                      </svg>
                    </button>
                    
                    {/* Shuffle Button */}
                    {queue.length > 1 && (
                      <button className="cartoon-button" onClick={isShuffled ? unshuffleQueue : shuffleQueue}
                        style={{ padding: '0.6rem', backgroundColor: isShuffled ? 'var(--accent-color)' : 'var(--panel-white)', color: isShuffled ? '#fff' : 'var(--text-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={isShuffled ? "Unshuffle" : "Shuffle queue"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>
                        </svg>
                      </button>
                    )}
                    
                    {/* Queue Button */}
                    {queue.length > 0 && (
                      <button className="cartoon-button" onClick={() => setShowQueue(!showQueue)}
                        style={{ padding: '0.6rem', backgroundColor: showQueue ? 'var(--accent-color)' : 'var(--panel-white)', color: showQueue ? '#fff' : 'var(--text-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                        title="Toggle queue"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {queue.length > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            backgroundColor: 'var(--accent-color)',
                            color: '#fff',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            padding: '2px 4px',
                            borderRadius: '8px',
                            minWidth: '14px',
                            textAlign: 'center'
                          }}>
                            {queue.length}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 0.5rem' }}>
                  <span style={{ opacity: 0.4 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg></span>
                  <input type="range" min="0" max="100" value={musicVolume} onChange={e => setMusicVolume(parseInt(e.target.value))} className="cartoon-slider"
                    style={{ flex: 1, WebkitAppearance: 'none', height: '8px', background: 'var(--border-color)', outline: 'none', borderRadius: '4px', cursor: 'pointer' }}/>
                  <span style={{ opacity: 0.6 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg></span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Panel */}
      <AnimatePresence>
        {showQueue && queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              borderTop: '2px solid var(--border-color)', 
              padding: '1rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 600, opacity: 0.7 }}>
              Queue ({queue.length} tracks)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {queue.map((item, index) => (
                <div
                  key={`${item.videoId}-${index}`}
                  onClick={() => playQueueItem(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: index === currentQueueIndex ? 'var(--accent-color)' : 'var(--panel-white)',
                    color: index === currentQueueIndex ? '#fff' : 'var(--text-brown)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', opacity: 0.5, minWidth: '20px' }}>
                    {index + 1}
                  </span>
                  {item.thumbnail && (
                    <img 
                      src={item.thumbnail} 
                      alt="" 
                      style={{ 
                        width: '40px', 
                        height: '30px', 
                        borderRadius: '4px', 
                        objectFit: 'cover' 
                      }} 
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.title}
                    </div>
                    {index === currentQueueIndex && (
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Now Playing</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(index);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: 0.5,
                      padding: '0.25rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
