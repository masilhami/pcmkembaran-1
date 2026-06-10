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

// Fungsi utama: Menghubungi backend terpadu get-current-radio (Tanpa cache)
async function fetchCurrentRadioStatusFromBackend() {
  const res = await fetch("/api/get-current-radio", { cache: "no-store" });
  if (!res.ok) throw new Error("Radio API offline");
  return await res.json();
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
      console.error("Gagal memputar jingle:", err);
      if (audioRef.current && isPlayingRef.current) audioRef.current.volume = 1;
      isJinglePlayingRef.current = false;
    }
  }, [JINGLE_FILE]);

  // =================================================================
  // SINKRONISASI AKTIF: PEMBAGIAN TR TRANSMISI AUDIO SECARA AMAN
  // =================================================================
  const fetchMetadata = useCallback(async () => {
    try {
      const data = await fetchCurrentRadioStatusFromBackend(); 
      
      // Jika backend menyatakan siaran offline/gagal muat data dokumen
      if (!data || !data.active) {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);
        setMetadata({ 
          title: data?.title || "Siaran Sedang Offline", 
          artist: data?.artist || "Radio Suara Al Muttaqin", 
          art: "/bg-player.png" 
        });
        setListeners(0);
        lastSyncedUrlRef.current = ""; // Reset pengunci agar sinkron ulang saat online
        return;
      }

      // Normalisasi tipe data ke huruf kecil agar anti-mismatch string
      const currentType = String(data.type || "").toLowerCase();

      // KONDISI A: JALUR LIVE STREAMING YOUTUBE
      if (currentType === "youtube_live" || currentType.includes("youtube")) {
        resetMp3PlaybackCompletely();
        setYoutubeVideoId(data.youtube_video_id);
        setIsYouTubeLive(true);
        setMetadata({
          title: data.title || "Live Streaming YouTube",
          artist: data.artist || "Pondok Pesantren Al Muttaqin",
          art: data.thumbnail || "/bg-player.png",
        });
        setListeners(1);
        lastSyncedUrlRef.current = "";
        return;
      }

      // 🌟 KONDISI B: JALUR INTERUPSI ADZAN OTOMATIS (WILAYAH PURWOKERTO)
      // Dipisahkan murni dari Catch-Up Seek dan diamankan dari loop reloading .load()
      if (currentType === "adzan") {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);

        setMetadata({
          title: data.title || "Panggilan Adzan Sholat",
          artist: data.artist || "Radio Suara Al Muttaqin",
          art: "/bg-player.png",
        });

        const audio = audioRef.current;
        if (audio && data.audio_url) {
          if (lastSyncedUrlRef.current !== data.audio_url) {
            lastSyncedUrlRef.current = data.audio_url;
            audio.src = data.audio_url;
            audio.load();

            if (data.elapsed_seconds && data.elapsed_seconds > 2) {
              audio.currentTime = data.elapsed_seconds;
            }

            if (isPlayingRef.current) {
              audio.play().catch(err => console.warn("Autoplay block protection:", err));
            }
          } else {
            // Jika audio adzan sedang mengalir, terapkan toleransi 6 detik agar tidak loncat suara
            if (data.elapsed_seconds && Math.abs(audio.currentTime - data.elapsed_seconds) > 6) {
              audio.currentTime = data.elapsed_seconds;
            }
          }
        }
        setListeners(1);
        return;
      }
      
      // 🌟 KONDISI C: JALUR LIVE RELAY FM / STREAMING EKSTERNAL
      if (currentType === "live_relay" || currentType.includes("relay")) {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);

        setMetadata({
          title: data.title || "Relay Radio FM / Live Stream",
          artist: data.artist || "Radio Suara Al Muttaqin",
          art: data.thumbnail || "/bg-player.png",
        });

        const audio = audioRef.current;
        if (audio && data.audio_url) {
          if (lastSyncedUrlRef.current !== data.audio_url) {
            lastSyncedUrlRef.current = data.audio_url;
            audio.src = data.audio_url;
            audio.load();

            if (isPlayingRef.current) {
              audio.play().catch(err => console.warn("Autoplay block protection:", err));
            }
          }
        }
        setListeners(1);
        return;
      }
      
      // KONDISI D: JALUR PEMUTAR FILE MP3 (PLAYLIST, MAIN PRISMA, ATAU FILLER JEDA)
      if (data.audio_url) {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);
        
        setMetadata({
          title: data.title || "Radio Suara Al Muttaqin",
          artist: data.artist || "Menginspirasi Hati Menguatkan Iman",
          art: data.thumbnail || "/bg-player.png",
        });

        const audio = audioRef.current;
        if (audio && data.audio_url) {
          if (lastSyncedUrlRef.current !== data.audio_url) {
            lastSyncedUrlRef.current = data.audio_url;
            audio.src = data.audio_url;
            audio.load();
            
            if (data.elapsed_seconds && data.elapsed_seconds > 2) {
              audio.currentTime = data.elapsed_seconds;
            }

            if (isPlayingRef.current) {
              audio.play().catch(err => console.warn("Autoplay block protection:", err));
            }
          } else {
            // Terapkan sistem toleransi selisih 6 detik agar MP3 mengalir mulus tanpa patah-patah
            if (data.elapsed_seconds && Math.abs(audio.currentTime - data.elapsed_seconds) > 6) {
              audio.currentTime = data.elapsed_seconds;
            }
          }
        }
        
        setListeners(1);
        return;
      }

    } catch (error) {
      console.error("Gagal sinkronisasi data stream radio:", error);
      setMetadata({ title: "Hubungan Terputus...", artist: "Radio Suara Al Muttaqin", art: "/bg-player.png" });
      setListeners(0);
    }
  }, [resetMp3PlaybackCompletely]);

  useEffect(() => {
    fetchMetadata();
    const interval = setInterval(fetchMetadata, 15000); // Polling metadata fresh per 15 detik
    return () => clearInterval(interval);
  }, [fetchMetadata]);

  const initAudio = useCallback(() => {
    if (isInitialized.current || !audioRef.current) return;

    try {
      const WebAudioContext = typeof window !== "undefined" 
        ? (window.AudioContext || (window as any).webkitAudioContext) 
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