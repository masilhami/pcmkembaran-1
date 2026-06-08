"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AudioContextType {
  isPlaying: boolean;
  hasError: boolean;
  metadata: { title: string; artist: string; art: string };
  listeners: number;
  togglePlay: () => void;
  toggleLivePlayback: () => void;
  toggleYouTubeAudio: () => void;
  registerYouTubeToggle: (handler: (() => void) | null) => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  isYouTubeLive: boolean;
  setIsYouTubeLive: React.Dispatch<React.SetStateAction<boolean>>;
  isYouTubePlaying: boolean;
  setIsYouTubePlaying: React.Dispatch<React.SetStateAction<boolean>>;
  youtubeVideoId: string | null;
  setYoutubeVideoId: React.Dispatch<React.SetStateAction<string | null>>;
  youtubeThumbnail: string;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Fungsi pembantu untuk mengubah string "HH:MM" menjadi menit total agar mudah dibandingkan
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Fungsi utama menentukan acara mana yang aktif saat ini berdasarkan jam sekarang
const getCurrentActiveSchedule = (schedules: any[]) => {
  if (!schedules || !Array.isArray(schedules)) return null;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes(); 

  for (const schedule of schedules) {
    const start = timeToMinutes(schedule.startTime);
    const end = timeToMinutes(schedule.endTime);

    if (currentMinutes >= start && currentMinutes < end) {
      return schedule;
    }
  }
  return null;
};

// Fungsi placeholder (Pastikan fungsi ini di-import dari folder service Sanity kamu)
async function fetchAllRadioSchedulesFromSanity() {
  const res = await fetch("/api/get-current-radio", { cache: "no-store" });
  if (!res.ok) throw new Error("Radio API offline");
  const data = await res.json();
  // Jika API kamu mengembalikan array schedule langsung, return data tersebut
  return data?.schedules || [];
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const youtubeToggleRef = useRef<(() => void) | null>(null);

  const isInitialized = useRef(false);
  const lastSyncedUrlRef = useRef("");
  const userStoppedRef = useRef(false);
  const isAutoSwitchingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const isYouTubePlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const [hasError, setHasError] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState({
    title: "Mencari Sinyal...",
    artist: "Radio Suara Al Muttaqin",
    art: "/bg-player.png",
  });

  const [isYouTubeLive, setIsYouTubeLive] = useState(false);
  const [isYouTubePlaying, setIsYouTubePlaying] = useState(false);

  const youtubeThumbnail = youtubeVideoId
    ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
    : "/bg-player.png";

  const jingleRef = useRef<HTMLAudioElement | null>(null);
  const jingleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isJinglePlayingRef = useRef(false);

  const JINGLE_INTERVAL = 5 * 60 * 1000; 
  const JINGLE_FILE = "/audio/jingle-pcm.mp3";

  const stopMp3Playback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (jingleRef.current) {
      jingleRef.current.pause();
      jingleRef.current.currentTime = 0;
    }
    isJinglePlayingRef.current = false;

    if (jingleIntervalRef.current) {
      clearInterval(jingleIntervalRef.current);
      jingleIntervalRef.current = null;
    }

    userStoppedRef.current = true;
    isAutoSwitchingRef.current = false;

    try {
      audio.volume = 0;
    } catch (e) {
      console.warn("Mute handling error:", e);
    }
    
    setIsPlaying(false);
  }, []);

  const resetMp3PlaybackCompletely = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (jingleRef.current) {
      jingleRef.current.pause();
      jingleRef.current.currentTime = 0;
    }
    isJinglePlayingRef.current = false;

    if (jingleIntervalRef.current) {
      clearInterval(jingleIntervalRef.current);
      jingleIntervalRef.current = null;
    }

    userStoppedRef.current = true;
    isAutoSwitchingRef.current = false;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    lastSyncedUrlRef.current = "";
    setIsPlaying(false);
  }, []);

  const registerYouTubeToggle = useCallback((handler: (() => void) | null) => {
    youtubeToggleRef.current = handler;
  }, []);

  const playJingle = useCallback(() => {
    try {
      if (!isPlayingRef.current || isYouTubePlayingRef.current || isJinglePlayingRef.current) {
        return;
      }

      const mainAudio = audioRef.current;
      if (!mainAudio) return;

      isJinglePlayingRef.current = true;

      if (!jingleRef.current) {
        jingleRef.current = new Audio(JINGLE_FILE);
        jingleRef.current.preload = "auto";
        jingleRef.current.crossOrigin = "anonymous";
        jingleRef.current.onerror = () => {
          console.error("Jingle gagal dimuat");
          if (audioRef.current && isPlayingRef.current) audioRef.current.volume = 1;
          isJinglePlayingRef.current = false;
        };
      }

      mainAudio.volume = 0.01; 
      jingleRef.current.currentTime = 0;

      const runJinglePlay = async () => {
        try {
          if (jingleRef.current) {
            await jingleRef.current.play();
          }
        } catch (playErr) {
          console.error("Jingle playback execution blocked:", playErr);
          if (audioRef.current && isPlayingRef.current) audioRef.current.volume = 1;
          isJinglePlayingRef.current = false;
        }
      };

      runJinglePlay();

      jingleRef.current.onended = () => {
        const mainAudioElement = audioRef.current;
        if (isPlayingRef.current && mainAudioElement) {
          mainAudioElement.volume = 1;
        }
        isJinglePlayingRef.current = false;
      };
    } catch (err) {
      console.error("Gagal memutar jingle:", err);
      if (audioRef.current && isPlayingRef.current) audioRef.current.volume = 1;
      isJinglePlayingRef.current = false;
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      // 1. Ambil seluruh data jadwal siaran dari Sanity
      const allSchedules = await fetchAllRadioSchedulesFromSanity(); 
      
      // 2. Cari acara apa yang harusnya aktif di JAM SEKARANG
      const activeSchedule = getCurrentActiveSchedule(allSchedules);

      // Jika tidak ada jadwal yang cocok, matikan pemutar (Offline)
      if (!activeSchedule) {
        setIsYouTubeLive(false);
        setMetadata({ title: "Siaran Sedang Offline", artist: "Radio Suara Al Muttaqin", art: "/bg-player.png" });
        setListeners(0);
        return;
      }

      // 3. KONDISI A: Jika jam sekarang adalah jadwalnya LIVE YOUTUBE
      if (activeSchedule.broadcastMode === "youtube_live") {
        resetMp3PlaybackCompletely();
        setYoutubeVideoId(activeSchedule.youtubeVideoId || null);
        setIsYouTubeLive(true);
        setMetadata({
          title: activeSchedule.eventName || "Live Streaming",
          artist: "PCM Kembaran",
          art: `https://img.youtube.com/vi/${activeSchedule.youtubeVideoId}/hqdefault.jpg`,
        });
        setListeners(1);
        return;
      }
      
      // 4. KONDISI B: Jika jam sekarang adalah jadwalnya PLAYLIST MP3
      if (activeSchedule.broadcastMode === "playlist_mp3" && activeSchedule.playlist?.length > 0) {
        setIsYouTubeLive(false);
        
        const currentTrack = activeSchedule.playlist[0]; 
        
        setMetadata({
          title: currentTrack.trackTitle || activeSchedule.eventName,
          artist: currentTrack.speaker || "PCM Kembaran",
          art: "/bg-player.png",
        });

        if (audioRef.current && audioRef.current.src !== currentTrack.audioFileUrl) {
          audioRef.current.src = currentTrack.audioFileUrl;
          audioRef.current.load();
          if (isPlayingRef.current) {
            audioRef.current.play().catch(err => console.error("Gagal putar otomatis:", err));
          }
        }
        setListeners(1);
        return;
      }

    } catch (error) {
      console.error("Gagal memuat jadwal otomatis:", error);
      setMetadata({ title: "Siaran Sedang Offline", artist: "Radio Suara Al Muttaqin", art: "/bg-player.png" });
      setListeners(0);
    }
  }, [resetMp3PlaybackCompletely]);

  useEffect(() => {
    fetchMetadata();
    const interval = setInterval(fetchMetadata, 15000);
    return () => clearInterval(interval);
  }, [fetchMetadata]);

  const initAudio = useCallback(() => {
    if (isInitialized.current || !audioRef.current) return;

    try {
      const WebAudioContext = typeof window !== "undefined" 
        ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof globalThis.AudioContext }).webkitAudioContext) 
        : null;

      if (!WebAudioContext) {
        console.warn("Web Audio API tidak didukung di browser ini.");
        return;
      }
      
      const audioCtx = new WebAudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      sourceRef.current = source;

      isInitialized.current = true;
    } catch (err) {
      console.error("Gagal inisialisasi Audio Engine:", err);
    }
  }, []);

  const startPlayback = useCallback(async () => {
    try {
      const audio = audioRef.current;
      if (audio && audio.src && audio.src !== "" && audio.src !== window.location.href) {
        audio.volume = 1;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        userStoppedRef.current = false;
        setIsPlaying(true);
        setHasError(false);
        return;
      }

      // Re-trigger pengecekan jadwal saat user menekan Play secara manual
      await fetchMetadata();
    } catch {
      setHasError(true);
      setIsPlaying(false);
    }
  }, [fetchMetadata]);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    if (!isInitialized.current) {
      initAudio();
    }

    if (isPlaying) {
      stopMp3Playback();
      return;
    }

    userStoppedRef.current = false;
    setHasError(false);
    await startPlayback();
  }, [initAudio, isPlaying, stopMp3Playback, startPlayback]);

  const toggleLivePlayback = useCallback(() => {
    if (isYouTubeLive && youtubeToggleRef.current) {
      youtubeToggleRef.current();
      return;
    }
    togglePlay();
  }, [isYouTubeLive, togglePlay]);

  const toggleYouTubeAudio = useCallback(() => {
    const nextState = !isYouTubePlayingRef.current;
    window.dispatchEvent(new CustomEvent("toggle-yt-player"));

    setIsYouTubePlaying(nextState);
    isYouTubePlayingRef.current = nextState;

    window.dispatchEvent(new CustomEvent("yt-status-change", { detail: nextState }));

    if (!jingleRef.current) {
      jingleRef.current = new Audio(JINGLE_FILE);
      jingleRef.current.preload = "auto";
      jingleRef.current.crossOrigin = "anonymous";
    }
    
    if (nextState) {
      jingleRef.current.load();
    }

    if (nextState && audioRef.current) {
      audioRef.current.volume = 0;
      setIsPlaying(false);
      isPlayingRef.current = false; 
    }
  }, [JINGLE_FILE]); 

  useEffect(() => {
    const syncStatusFromEvent = (e: any) => {
      setIsYouTubePlaying(e.detail);
      isYouTubePlayingRef.current = e.detail; 
    };
    window.addEventListener("yt-status-change", syncStatusFromEvent);
    return () => window.removeEventListener("yt-status-change", syncStatusFromEvent);
  }, []);

  useEffect(() => {
    if (isYouTubeLive) {
      resetMp3PlaybackCompletely();
    }
  }, [isYouTubeLive, resetMp3PlaybackCompletely]);

  useEffect(() => {
    if (jingleIntervalRef.current) {
      clearInterval(jingleIntervalRef.current);
      jingleIntervalRef.current = null;
    }

    const checkAndTriggerJingle = () => {
      const isUserListening = isPlayingRef.current || isYouTubePlayingRef.current;
      if (isUserListening) {
        playJingle();
      }
    };

    jingleIntervalRef.current = setInterval(checkAndTriggerJingle, JINGLE_INTERVAL);

    return () => {
      if (jingleIntervalRef.current) {
        clearInterval(jingleIntervalRef.current);
        jingleIntervalRef.current = null;
      }
    };
  }, [playJingle, JINGLE_INTERVAL]);

  useEffect(() => {
    return () => {
      if (jingleIntervalRef.current) clearInterval(jingleIntervalRef.current);
      if (jingleRef.current) jingleRef.current.pause();
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        hasError,
        metadata,
        listeners,
        togglePlay,
        toggleLivePlayback,
        toggleYouTubeAudio,
        registerYouTubeToggle,
        analyserRef,
        isYouTubeLive,
        setIsYouTubeLive,
        isYouTubePlaying,
        setIsYouTubePlaying,
        youtubeVideoId,
        setYoutubeVideoId,
        youtubeThumbnail,
      }}
    >
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="none"
        onPause={() => {
          if (!isAutoSwitchingRef.current && userStoppedRef.current && audioRef.current?.volume === 0) {
            // Biarkan state dikendalikan fungsi mute
          }
        }}
        onPlay={() => {
          if (audioRef.current && audioRef.current.volume > 0) {
            userStoppedRef.current = false;
            setIsPlaying(true);
            setHasError(false);
          }
        }}
        className="hidden"
      />
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio harus di dalam AudioProvider");
  return context;
};