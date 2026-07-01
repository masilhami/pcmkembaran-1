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
  metadata: { 
    title: string; 
    artist: string; 
    art: string; 
    audio_url?: string | null;         
    elapsed_seconds?: number | null;    
  };
  listeners: number;
  volume: number;          
  setVolume: (vol: number) => void; 
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

const AudioContextInstance = createContext<AudioContextType | null>(null);

// OBJEK FALLBACK STANDAR JIKA BACKEND ATAU CMS OFFLINE
const FALLBACK_RADIO_DATA = {
  active: true,
  type: "playlist_mp3",
  title: "Radio Suara Berkemajuan",
  artist: "Dakwah Berkemajuan Mencerahkan Kehidupan",
  audio_url: "https://sdit.my.id/radio/stream.php", 
  thumbnail: "/bg-player.png",
  elapsed_seconds: 0
};

async function fetchCurrentRadioStatusFromBackend() {
  try {
    const origin = typeof window !== "undefined" && window.location.origin 
      ? window.location.origin 
      : "https://pcmkembaran.com"; 
    
    const targetUrl = `${origin.replace(/\/$/, "")}/api/get-current-radio`;

    const res = await fetch(targetUrl, { 
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    const contentType = res.headers.get("content-type");
    
    if (!res.ok || (contentType && contentType.includes("text/html"))) {
      console.warn("[Radio PCM API] Endpoint mengembalikan HTML/Eror. Mengalihkan ke data fallback lokal.");
      return FALLBACK_RADIO_DATA;
    }

    return await res.json();
  } catch (error) {
    console.error("[Radio PCM API] Gagal total mengambil status backend, alihkan ke fallback:", error);
    return FALLBACK_RADIO_DATA;
  }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<globalThis.AudioContext | null>(null);
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

  const [volume, _setVolume] = useState(0.8);
  const volumeRef = useRef(0.8);

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
    audio_url: null as string | null,        
    elapsed_seconds: null as number | null,  
  });

  const [isYouTubeLive, setIsYouTubeLive] = useState(false);
  const [isYouTubePlaying, setIsYouTubePlaying] = useState(false);

  const youtubeThumbnail = youtubeVideoId
    ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
    : "/bg-player.png";

  const jingleRef = useRef<HTMLAudioElement | null>(null);
  const jingleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isJinglePlayingRef = useRef(false);
  const lastJingleTimeRef = useRef<number>(Date.now());

  const JINGLE_INTERVAL = 5 * 60 * 1000; 
  const JINGLE_FILE = "https://archive.org/download/jingle-pcm/jingle-pcm.mp3";

  // =================================================================
  // ⚙️ ENGINE CORE INITIALIZER (WEB AUDIO API NODE PROTECTION)
  // =================================================================
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
      console.error("Gagal inisialisasi Audio Canvas Engine:", err);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const cleanVol = Math.max(0, Math.min(1, vol));
    _setVolume(cleanVol);
    volumeRef.current = cleanVol;
    if (audioRef.current && !isJinglePlayingRef.current) {
      audioRef.current.volume = cleanVol;
    }
  }, []);

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
      const audio = audioRef.current;
      if (!audio) return;

      const currentTitle = (metadata.title || "").toLowerCase();

      if (currentTitle.includes("adzan") || currentTitle.includes("panggilan")) {
        isJinglePlayingRef.current = false;
        return;
      }

      if (userStoppedRef.current || isYouTubePlayingRef.current || isJinglePlayingRef.current) {
        return;
      }

      if (!audio.src || audio.src === "" || audio.src === window.location.href) {
        return;
      }

      isJinglePlayingRef.current = true;

      if (!jingleRef.current) {
        jingleRef.current = new Audio(JINGLE_FILE);
        jingleRef.current.preload = "auto";
        jingleRef.current.crossOrigin = "anonymous";
      }

      jingleRef.current.onerror = () => {
        if (audioRef.current) audioRef.current.volume = volumeRef.current;
        isJinglePlayingRef.current = false;
      };

      audio.volume = 0.1; 
      jingleRef.current.currentTime = 0;

      jingleRef.current.play()
        .catch(playErr => {
          console.warn("Jingle blocked by browser autoplay:", playErr);
          if (audioRef.current) audioRef.current.volume = volumeRef.current;
          isJinglePlayingRef.current = false;
        });

      jingleRef.current.onended = () => {
        if (audioRef.current) {
          audioRef.current.volume = volumeRef.current;
        }
        isJinglePlayingRef.current = false;
      };
    } catch (err) {
      if (audioRef.current) audioRef.current.volume = volumeRef.current;
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
          art: "/bg-player.png",
          audio_url: null,
          elapsed_seconds: null
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
          audio_url: data.audio_url || null,
          elapsed_seconds: 0
        });
        setListeners(1);
        lastSyncedUrlRef.current = "";
        return;
      }

      const handleAudioSourceSync = (audioUrl: string, elapsedSeconds?: number) => {
        const audio = audioRef.current;
        if (!audio || !audioUrl || audioUrl.trim() === "" || audioUrl === "null") return;

        const cleanTargetUrl = audioUrl.split("?")[0];
        const cleanCurrentUrl = lastSyncedUrlRef.current.split("?")[0];

        const isLiveStreamPipe = audioUrl.includes("stream.php") || audioUrl.includes("pcmkembaran.com");

        if (cleanCurrentUrl !== cleanTargetUrl) {
          lastSyncedUrlRef.current = audioUrl;
          
          isAutoSwitchingRef.current = true; 
          audio.src = audioUrl;
          audio.load();

          if (!isLiveStreamPipe && elapsedSeconds && elapsedSeconds > 0) {
            if (audio.readyState >= 1) {
              if (audio.duration && audio.duration !== Infinity) {
                audio.currentTime = elapsedSeconds;
              }
            } else {
              const onMetadataLoaded = () => {
                if (audio.duration && audio.duration !== Infinity) {
                  audio.currentTime = elapsedSeconds;
                }
                audio.removeEventListener("loadedmetadata", onMetadataLoaded);
              };
              audio.addEventListener("loadedmetadata", onMetadataLoaded);
            }
          }

          if (isPlayingRef.current && !userStoppedRef.current) {
            if (!isInitialized.current) initAudio();
            audio.volume = volumeRef.current;
            audio.play()
              .then(() => { 
                isAutoSwitchingRef.current = false; 
              })
              .catch(err => {
                console.warn("Autoplay ditolak saat sinkronisasi lagu baru:", err);
                isAutoSwitchingRef.current = false;
                setIsPlaying(false);
              });
          } else {
            isAutoSwitchingRef.current = false;
          }
        } else {
          if (!isLiveStreamPipe && elapsedSeconds && audio.readyState >= 1 && Math.abs(audio.currentTime - elapsedSeconds) > 5) {
            audio.currentTime = elapsedSeconds;
          }
          lastSyncedUrlRef.current = audioUrl;
        }
      };

      if (currentType === "adzan" || currentType === "playlist_mp3" || currentType === "live_relay" || currentType.includes("relay") || data.audio_url) {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);
        
        setMetadata({
          title: data.title || "Radio Suara Berkemajuan",
          artist: data.artist || "Dakwah Berkemajuan Mencerahkan Kehidupan",
          art: data.thumbnail || "/bg-player.png",
          audio_url: data.audio_url,
          elapsed_seconds: data.elapsed_seconds || 0 
        });
        handleAudioSourceSync(data.audio_url, data.elapsed_seconds);
        setListeners(1);
        return;
      }

    } catch (error) {
      console.error("Gagal sinkronisasi data stream radio:", error);
    }
  }, [resetMp3PlaybackCompletely, initAudio]);

  useEffect(() => {
    fetchMetadata();
    const interval = setInterval(fetchMetadata, 15000); 
    return () => clearInterval(interval);
  }, [fetchMetadata]);

  // 🎯 PERBAIKAN MUTLAK CORE PLAYBACK (TIME INJECTION SYNC)
  const startPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      userStoppedRef.current = false;
      isAutoSwitchingRef.current = true;
      setHasError(false);

      if (!isInitialized.current) initAudio();

      // 1. Selalu gedor status termutakhir dari backend sesaat sebelum memicu penekanan tombol PLAY
      const freshData = await fetchCurrentRadioStatusFromBackend();
      
      let targetUrl = metadata.audio_url;
      let currentElapsed = metadata.elapsed_seconds;

      if (freshData && freshData.active && freshData.audio_url) {
        targetUrl = freshData.audio_url;
        currentElapsed = freshData.elapsed_seconds;
        
        // Selaraskan state metadata agar sinkron dengan respons backend yang paling baru
        setMetadata({
          title: freshData.title || "Radio Suara Berkemajuan",
          artist: freshData.artist || "PCM Kembaran",
          art: freshData.thumbnail || "/bg-player.png",
          audio_url: freshData.audio_url,
          elapsed_seconds: freshData.elapsed_seconds
        });
      }

      if (targetUrl && targetUrl.trim() !== "" && targetUrl !== "null") {
        // Beri trik cache buster query string agar browser menganggap ini stream biner baru, bukan file statis berulang
        const separator = targetUrl.includes('?') ? '&' : '?';
        const cacheBusterUrl = `${targetUrl}${separator}cb=${Date.now()}`;
        
        lastSyncedUrlRef.current = targetUrl;
        audio.src = cacheBusterUrl;
        audio.load();

        const isLiveStreamPipe = targetUrl.includes("stream.php") || targetUrl.includes("pcmkembaran.com");

        // 2. Jika merupakan playlist mp3 statis, paksa timeline untuk melompat langsung ke virtual timeline radio!
        if (!isLiveStreamPipe && currentElapsed && currentElapsed > 0) {
          if (audio.readyState >= 1) {
            if (audio.duration && audio.duration !== Infinity) {
              audio.currentTime = Math.min(currentElapsed, audio.duration - 1);
            } else {
              audio.currentTime = currentElapsed;
            }
          } else {
            const onMetadataLoaded = () => {
              if (audio.duration && audio.duration !== Infinity) {
                audio.currentTime = Math.min(currentElapsed!, audio.duration - 1);
              } else {
                audio.currentTime = currentElapsed!;
              }
              audio.removeEventListener("loadedmetadata", onMetadataLoaded);
            };
            audio.addEventListener("loadedmetadata", onMetadataLoaded);
          }
        }
      }

      audio.volume = volumeRef.current;
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      setIsPlaying(true);
      lastJingleTimeRef.current = Date.now();

      setTimeout(() => {
        isAutoSwitchingRef.current = false;
      }, 400);

    } catch (e) {
      console.error("Playback gagal dieksekusi:", e);
      setHasError(true);
      setIsPlaying(false);
      userStoppedRef.current = true;
      isAutoSwitchingRef.current = false;
    }
  }, [metadata.audio_url, metadata.elapsed_seconds, initAudio]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      stopMp3Playback();
    } else {
      await startPlayback();
    }
  }, [isPlaying, stopMp3Playback, startPlayback]);

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
      if (!isPlayingRef.current || isYouTubePlayingRef.current) {
        lastJingleTimeRef.current = Date.now();
        return;
      }

      const sekarang = Date.now();
      const selisihWaktu = sekarang - lastJingleTimeRef.current;

      if (selisihWaktu >= JINGLE_INTERVAL) {
        setMetadata((prev) => {
          const currentTitle = (prev.title || "").toLowerCase();
          const sedangAdzan = currentTitle.includes("adzan") || currentTitle.includes("panggilan");

          if (!isJinglePlayingRef.current && !sedangAdzan) {
            console.log("⏰ Mengumandangkan Jingle PCM tepat waktu.");
            lastJingleTimeRef.current = sekarang; 
            playJingle();
          } else if (sedangAdzan) {
            lastJingleTimeRef.current = scams - (JINGLE_INTERVAL - (60 * 1000));
          }
          return prev;
        });
      }
    };

    jingleIntervalRef.current = setInterval(checkAndTriggerJingle, 1000);
    
    return () => {
      if (jingleIntervalRef.current) clearInterval(jingleIntervalRef.current);
    };
  }, [playJingle, JINGLE_INTERVAL]);

  return (
    <AudioContextInstance.Provider
      value={{
        isPlaying,
        hasError,
        metadata,
        listeners,
        volume,        
        setVolume,     
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
        preload="none"
        crossOrigin="anonymous" 
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
    </AudioContextInstance.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContextInstance);
  if (!context) throw new Error("useAudio harus di dalam AudioProvider");
  return context;
};