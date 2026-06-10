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

async function fetchCurrentRadioStatusFromBackend() {
  try {
    const res = await fetch("/api/get-current-radio", { cache: "no-store" });
    if (!res.ok) {
      console.warn("Radio API backend offline atau sedang sibuk.");
      return { active: false };
    }
    return await res.json();
  } catch (err) {
    console.error("Koneksi internet tersendat, gagal sinkronisasi radio:", err);
    return { active: false };
  }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const youtubeToggleRef = useRef<(() => void) | null>(null);

  const isInitialized = useRef(false);
  const lastSyncedUrlRef = useRef("");
  const userStoppedRef = useRef(true); 
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
    artist: "Radio Suara Berkemajuan",
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
    
    if (jingleRef.current) {
      jingleRef.current.pause();
      jingleRef.current.currentTime = 0;
    }
    isJinglePlayingRef.current = false;

    userStoppedRef.current = true;
    isAutoSwitchingRef.current = false;

    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
  }, []);

  const resetMp3PlaybackCompletely = useCallback(() => {
    const audio = audioRef.current;

    if (jingleRef.current) {
      jingleRef.current.pause();
      jingleRef.current.currentTime = 0;
    }
    isJinglePlayingRef.current = false;

    userStoppedRef.current = true;
    isAutoSwitchingRef.current = false;

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    lastSyncedUrlRef.current = "";
    setIsPlaying(false);
  }, []);

  const registerYouTubeToggle = useCallback((handler: (() => void) | null) => {
    youtubeToggleRef.current = handler;
  }, []);

  const playJingle = useCallback(() => {
    try {
      const currentTitle = (metadata.title || "").toLowerCase();

      if (currentTitle.includes("adzan") || currentTitle.includes("panggilan")) {
        isJinglePlayingRef.current = false;
        return;
      }

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
      }

      jingleRef.current.onerror = () => {
        if (audioRef.current && isPlayingRef.current) audioRef.current.volume = 1;
        isJinglePlayingRef.current = false;
      };

      mainAudio.volume = 0.1; 
      jingleRef.current.currentTime = 0;

      jingleRef.current.play()
        .catch(playErr => {
          console.warn("Jingle blocked by browser policy:", playErr);
          if (audioRef.current && isPlayingRef.current) audioRef.current.volume = 1;
          isJinglePlayingRef.current = false;
        });

      jingleRef.current.onended = () => {
        if (isPlayingRef.current && audioRef.current) {
          audioRef.current.volume = 1;
        }
        isJinglePlayingRef.current = false;
      };
    } catch (err) {
      if (audioRef.current && isPlayingRef.current) audioRef.current.volume = 1;
      isJinglePlayingRef.current = false;
    }
  }, [JINGLE_FILE, metadata.title]);

  const fetchMetadata = useCallback(async () => {
    try {
      const data = await fetchCurrentRadioStatusFromBackend(); 
      
      if (!data || !data.active) {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);
        setMetadata({ 
          title: data?.title || "Siaran Sedang Offline", 
          artist: data?.artist || "Radio Suara Berkemajuan",
          art: "/bg-player.png" 
        });
        setListeners(0);
        lastSyncedUrlRef.current = ""; 
        return;
      }

      const currentType = String(data.type || "").toLowerCase();

      if (currentType === "youtube_live" || currentType.includes("youtube")) {
        resetMp3PlaybackCompletely();
        setYoutubeVideoId(data.youtube_video_id);
        setIsYouTubeLive(true);
        setMetadata({
          title: data.title || "Live Streaming YouTube",
          artist: data.artist || "PCM Kembaran",
          art: data.thumbnail || "/bg-player.png",
        });
        setListeners(1);
        lastSyncedUrlRef.current = "";
        return;
      }

      const handleAudioSourceSync = (audioUrl: string, elapsedSeconds?: number) => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        if (lastSyncedUrlRef.current !== audioUrl) {
          lastSyncedUrlRef.current = audioUrl;
          isAutoSwitchingRef.current = true;
          audio.src = audioUrl;
          audio.load();

          if (elapsedSeconds && elapsedSeconds > 2) {
            audio.currentTime = elapsedSeconds;
          }

          if (isPlayingRef.current && !userStoppedRef.current) {
            audio.play()
              .then(() => { 
                isAutoSwitchingRef.current = false; 
              })
              .catch(err => {
                console.warn("Autoplay ditolak browser saat sinkronisasi berkala:", err);
                isAutoSwitchingRef.current = false;
                // FIX: Jika gagal play otomatis karena aturan browser, sinkronkan UI menjadi pause!
                setIsPlaying(false);
              });
          } else {
            isAutoSwitchingRef.current = false;
          }
        } else {
          if (elapsedSeconds && Math.abs(audio.currentTime - elapsedSeconds) > 6) {
            audio.currentTime = elapsedSeconds;
          }
        }
      };

      if (currentType === "adzan") {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);
        setMetadata({
          title: data.title || "Panggilan Adzan Sholat",
          artist: data.artist || "Radio Suara Berkemajuan",
          art: "/bg-player.png",
        });
        handleAudioSourceSync(data.audio_url, data.elapsed_seconds);
        setListeners(1);
        return;
      }
      
      if (currentType === "live_relay" || currentType.includes("relay")) {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);
        setMetadata({
          title: data.title || "Relay Radio FM / Live Stream",
          artist: data.artist || "Radio Suara Berkemajuan",
          art: data.thumbnail || "/bg-player.png",
        });
        handleAudioSourceSync(data.audio_url, data.elapsed_seconds);
        setListeners(1);
        return;
      }
      
      if (data.audio_url) {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);
        setMetadata({
          title: data.title || "Radio Suara Berkemajuan",
          artist: data.artist || "Dakwah Berkemajuan Mencerahkan Kehidupan",
          art: data.thumbnail || "/bg-player.png",
        });
        handleAudioSourceSync(data.audio_url, data.elapsed_seconds);
        setListeners(1);
        return;
      }

    } catch (error) {
      console.error("Gagal sinkronisasi data stream radio:", error);
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
        ? (window.AudioContext || (window as any).webkitAudioContext) 
        : null;

      if (!WebAudioContext) return;
      
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
      
      // FIX: Paksa Web Audio Context jalan kembali di dalam scope interaksi user
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      if (audio && audio.src && audio.src !== "" && audio.src !== window.location.href) {
        audio.volume = 1;
        userStoppedRef.current = false;
        setIsPlaying(true);
        setHasError(false);
        await audio.play();
        return;
      }
      userStoppedRef.current = false;
      await fetchMetadata();
    } catch (e) {
      console.error("Playback gagal:", e);
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
    } else {
      await startPlayback();
    }
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

    if (nextState && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false; 
    }
  }, []); 

  useEffect(() => {
    const syncStatusFromEvent = (e: any) => {
      setIsYouTubePlaying(e.detail);
      isYouTubePlayingRef.current = e.detail; 
      if (e.detail) {
        setIsPlaying(false);
      }
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
    const checkAndTriggerJingle = () => {
      if (isPlayingRef.current && !isYouTubePlayingRef.current) {
        playJingle();
      }
    };
    jingleIntervalRef.current = setInterval(checkAndTriggerJingle, JINGLE_INTERVAL);
    return () => {
      if (jingleIntervalRef.current) clearInterval(jingleIntervalRef.current);
    };
  }, [playJingle, JINGLE_INTERVAL]);

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
          if (!isAutoSwitchingRef.current && userStoppedRef.current) {
            setIsPlaying(false);
          }
        }}
        onPlay={() => {
          if (!isAutoSwitchingRef.current) {
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