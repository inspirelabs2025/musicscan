import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
  image?: string;
}

interface AudioState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: AudioTrack[];
  currentIndex: number;
  isLoading: boolean;
}

type AudioAction =
  | { type: 'SET_TRACK'; payload: AudioTrack }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_QUEUE'; payload: AudioTrack[] }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREV_TRACK' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AudioState = {
  currentTrack: null,
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: [],
  currentIndex: -1,
  isLoading: false,
};

const audioReducer = (state: AudioState, action: AudioAction): AudioState => {
  switch (action.type) {
    case 'SET_TRACK':
      return {
        ...state,
        currentTrack: action.payload,
        currentTime: 0,
        duration: 0,
      };
    case 'PLAY':
      return { ...state, isPlaying: true, isPaused: false };
    case 'PAUSE':
      return { ...state, isPlaying: false, isPaused: true };
    case 'STOP':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
      };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'NEXT_TRACK':
      const nextIndex = state.currentIndex + 1;
      if (nextIndex < state.queue.length) {
        return {
          ...state,
          currentIndex: nextIndex,
          currentTrack: state.queue[nextIndex],
          currentTime: 0,
        };
      }
      return state;
    case 'PREV_TRACK':
      const prevIndex = state.currentIndex - 1;
      if (prevIndex >= 0) {
        return {
          ...state,
          currentIndex: prevIndex,
          currentTrack: state.queue[prevIndex],
          currentTime: 0,
        };
      }
      return state;
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface AudioContextValue extends AudioState {
  playTrack: (track: AudioTrack) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  setQueue: (tracks: AudioTrack[], startIndex?: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      dispatch({ type: 'SET_TIME', payload: audio.currentTime });
    };

    const handleDurationChange = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration });
    };

    const handleEnded = () => {
      dispatch({ type: 'STOP' });
      // Auto-play next track if available
      if (state.currentIndex < state.queue.length - 1) {
        dispatch({ type: 'NEXT_TRACK' });
      }
    };

    const handleLoadStart = () => {
      dispatch({ type: 'SET_LOADING', payload: true });
    };

    const handleCanPlay = () => {
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [state.currentIndex, state.queue.length]);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && state.currentTrack) {
      audioRef.current.src = state.currentTrack.url;
      audioRef.current.volume = state.volume;
    }
  }, [state.currentTrack, state.volume]);

  const playTrack = useCallback((track: AudioTrack) => {
    dispatch({ type: 'SET_TRACK', payload: track });
    dispatch({ type: 'PLAY' });
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && state.currentTrack) {
      audioRef.current.play();
      dispatch({ type: 'PLAY' });
    }
  }, [state.currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      dispatch({ type: 'PAUSE' });
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      dispatch({ type: 'STOP' });
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      dispatch({ type: 'SET_TIME', payload: time });
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      dispatch({ type: 'SET_VOLUME', payload: volume });
    }
  }, []);

  const setQueue = useCallback((tracks: AudioTrack[], startIndex = 0) => {
    dispatch({ type: 'SET_QUEUE', payload: tracks });
    if (tracks.length > 0 && startIndex < tracks.length) {
      dispatch({ type: 'SET_TRACK', payload: tracks[startIndex] });
    }
  }, []);

  const nextTrack = useCallback(() => {
    dispatch({ type: 'NEXT_TRACK' });
  }, []);

  const prevTrack = useCallback(() => {
    dispatch({ type: 'PREV_TRACK' });
  }, []);

  const value: AudioContextValue = {
    ...state,
    playTrack,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    setQueue,
    nextTrack,
    prevTrack,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};