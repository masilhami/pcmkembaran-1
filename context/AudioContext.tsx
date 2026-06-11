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

// Mengambil status radio terbaru dari backend Next.js
async function fetchCurrentRadioStatusFromBackend() {
  try {
    const res = await fetch("/api/radio-stream?type=metadata", { cache: "no-store" });
    if (!res.ok) {
      console.warn("Radio API backend offline atau sedang sibuk.");
      return { active: false };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.error("⚠️ Bahaya: Endpoint malah mengembalikan file audio, bukan JSON data! Content-Type:", contentType);
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
  const audioContextRef = useRef<any>(null); 
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

  // 🌟 SINKRONISASI JINGLE NYATA: Catat timestamp pemutaran agar konsisten 5-10 menit sekali
  const lastJingleTimeRef = useRef<number>(Date.now());

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
        if (audioRef.current) audioRef.current.volume = 1;
        isJinglePlayingRef.current = false;
      };

      audio.volume = 0.1; 
      jingleRef.current.currentTime = 0;

      jingleRef.current.play()
        .catch(playErr => {
          console.warn("Jingle blocked by browser autoplay:", playErr);
          if (audioRef.current) audioRef.current.volume = 1;
          isJinglePlayingRef.current = false;
        });

      jingleRef.current.onended = () => {
        if (audioRef.current) {
          audioRef.current.volume = 1;
        }
        isJinglePlayingRef.current = false;
      };
    } catch (err) {
      if (audioRef.current) audioRef.current.volume = 1;
      isJinglePlayingRef.current = false;
    }
  }, [JINGLE_FILE, metadata.title]);

  // Inisialisasi Audio Engine Web Audio API di-bypass sementara demi meloloskan CORS biner stream
  const initAudio = useCallback(() => {
    if (isInitialized.current || !audioRef.current) return;
    isInitialized.current = true;
  }, []);

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

        // 🌟 PERBAIKAN EMAS 1: Pisahkan query string agar penambahan detik tidak dianggap URL baru
        const cleanTargetUrl = audioUrl.split("?")[0];
        const cleanCurrentUrl = lastSyncedUrlRef.current.split("?")[0];

        const isLiveStreamPipe = audioUrl.includes("stream.php") || audioUrl.includes("pcmkembaran.com");

        // 🌟 PERBAIKAN EMAS 2: Hanya ganti src JIKA file inti siaran atau stream.php berganti mode mendasar
        if (cleanCurrentUrl !== cleanTargetUrl) {
          lastSyncedUrlRef.current = audioUrl;
          
          isAutoSwitchingRef.current = true; 
          audio.src = audioUrl;
          audio.load();

          // Hanya lakukan seeking manual frontend jika BUKAN live stream biner PHP
          if (!isLiveStreamPipe && elapsedSeconds && elapsedSeconds > 0 && audio.duration && audio.duration !== Infinity) {
            audio.currentTime = elapsedSeconds;
          }

          if (isPlayingRef.current && !userStoppedRef.current) {
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
          // 🌟 PERBAIKAN EMAS 3: Jika file/pipa intinya sama, biarkan audio mengalir lancar jaya!
          // Jangan panggil audio.load() agar stream biner tidak terputus secara periodik.
          lastSyncedUrlRef.current = audioUrl;
        }
      };

      if (currentType === "adzan" || currentType === "live_relay" || currentType.includes("relay") || data.audio_url) {
        setIsYouTubeLive(false);
        setYoutubeVideoId(null);
        setMetadata({
          title: data.title || "Radio Suara Berkemajuan",
          artist: data.artist || "Dakwah Berkemajuan Mencerahkan Kehidupan",
          art: data.thumbnail || "/bg-player.png",
          audio_url: data.audio_url,
          elapsed_seconds: data.elapsed_seconds 
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

  // AKSI UTAMA SAAT KLIK TOMBOL PLAY
  const startPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      userStoppedRef.current = false;
      isAutoSwitchingRef.current = true;
      setHasError(false);

      const targetUrl = metadata.audio_url;

      if (targetUrl && targetUrl.trim() !== "" && targetUrl !== "null") {
        if (!audio.src || audio.src === "" || audio.src === window.location.href || lastSyncedUrlRef.current !== targetUrl) {
          lastSyncedUrlRef.current = targetUrl;
          audio.src = targetUrl;
        }
        
        audio.load();

        const isLiveStreamPipe = targetUrl.includes("stream.php") || targetUrl.includes("pcmkembaran.com");

        if (!isLiveStreamPipe && metadata.elapsed_seconds && metadata.elapsed_seconds > 0 && audio.duration && audio.duration !== Infinity) {
          audio.currentTime = metadata.elapsed_seconds;
        }
      } else {
        const freshData = await fetchCurrentRadioStatusFromBackend();
        if (freshData && freshData.active && freshData.audio_url) {
          const fallbackUrl = freshData.audio_url;
          lastSyncedUrlRef.current = fallbackUrl;
          audio.src = fallbackUrl;
          audio.load();

          const isLiveStreamPipe = fallbackUrl.includes("stream.php") || fallbackUrl.includes("pcmkembaran.com");

          if (!isLiveStreamPipe && freshData.elapsed_seconds && freshData.freshData.elapsed_seconds > 0 && audio.duration && audio.duration !== Infinity) {
            audio.currentTime = freshData.elapsed_seconds;
          }
        }
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      setIsPlaying(true);
      
      // Sinkronkan ulang patokan waktu tunggu jingle sejak tombol play ditekan pertama kali
      lastJingleTimeRef.current = Date.now();

      setTimeout(() => {
        isAutoSwitchingRef.current = false;
      }, 400);

    } catch (e) {
      console.error("Playback gagal dieksekusi pada klik pertama:", e);
      setHasError(true);
      setIsPlaying(false);
      userStoppedRef.current = true;
      isAutoSwitchingRef.current = false;
    }
  }, [metadata.audio_url, metadata.elapsed_seconds]);

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

  // 🌟 PERBAIKAN SAKTI: Sistem Tracker Detik Jingle Akurat & Anti-Throttle Browser
  useEffect(() => {
    const checkAndTriggerJingle = () => {
      // Jika radio mati atau sedang setel YouTube, amankan timestamp agar tidak menumpuk
      if (!isPlayingRef.current || isYouTubePlayingRef.current) {
        lastJingleTimeRef.current = Date.now();
        return;
      }

      const sekarang = Date.now();
      const selisihWaktu = sekarang - lastJingleTimeRef.current;

      // Jalankan jika sudah masuk target interval (5 menit murni)
      if (selisihWaktu >= JINGLE_INTERVAL) {
        const currentTitle = (metadata.title || "").toLowerCase();
        const sedangAdzan = currentTitle.includes("adzan") || currentTitle.includes("panggilan");

        if (!isJinglePlayingRef.current && !sedangAdzan) {
          console.log("⏰ Mengumandangkan Jingle PCM tepat waktu.");
          lastJingleTimeRef.current = sekarang; 
          playJingle();
        } 
        else if (sedangAdzan) {
          // Jika pas 5 menit bertepatan dengan adzan, mundurkan tracker 1 menit 
          // agar jingle langsung berbunyi sesaat setelah adzan selesai berkumandang
          lastJingleTimeRef.current = sekarang - (JINGLE_INTERVAL - (60 * 1000));
        }
      }
    };

    // Jalankan pemantau super ringan tiap 1 detik (1000ms) agar kebal pembatasan background browser
    jingleIntervalRef.current = setInterval(checkAndTriggerJingle, 1000);
    
    return () => {
      if (jingleIntervalRef.current) clearInterval(jingleIntervalRef.current);
    };
  }, [playJingle, JINGLE_INTERVAL, metadata.title]);

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