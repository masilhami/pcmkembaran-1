"use client";

import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { useAudio } from "@/context/AudioContext"; 

export default function YouTubePlayer({ value }: any) {
  const { url, caption } = value;
  const { metadata } = useAudio();
  const playerRef = useRef<any>(null);
  const [initialStart, setInitialStart] = useState<number | null>(null);

  if (!url) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const id = (match && match[2].length === 11) ? match[2] : null;

  if (!id) return null;

  // 🎯 LANGKAH CERDAS 1: Kunci detik berjalan pertama kali saat data backend mendarat
  useEffect(() => {
    if (initialStart === null && metadata.elapsed_seconds && metadata.elapsed_seconds > 0) {
      console.log(`🚀 [Hydration] Mengunci detik lompatan awal: ${metadata.elapsed_seconds}`);
      setInitialStart(Number(metadata.elapsed_seconds));
    }
  }, [metadata.elapsed_seconds, initialStart]);

  // 🎯 LANGKAH CERDAS 2: Eksekusi paksa di callback onReady agar tidak tertebas buffering browser
  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    
    // Gunakan prioritas: data terkunci awal, atau state terkini
    const secondsToSeek = initialStart || Number(metadata.elapsed_seconds) || 0;
    
    if (secondsToSeek > 0) {
      console.log(`🎯 [YouTube Engine] Sistem Siap Seratus Persen! Memaksa lompat ke: ${secondsToSeek} detik`);
      event.target.seekTo(secondsToSeek, true);
      
      // Jika jemaah sudah mengklik tombol ON AIR utama sebelumnya, langsung mainkan videonya
      if ((window as any).__isRadioPlaying) {
        event.target.playVideo();
      }
    }
  };

  // 🔄 LANGKAH CERDAS 3: Sinkronisasi berkala (Jika jemaah diam di halaman web tanpa refresh)
  useEffect(() => {
    const handleYtSeek = (e: any) => {
      const targetSeconds = e.detail;
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        const currentTime = playerRef.current.getCurrentTime();
        // Beri toleransi 8 detik agar tidak terjadi stuttering/patah-patah saat polling berjalan
        if (Math.abs(currentTime - targetSeconds) > 8) {
          console.log(`🔄 [YouTube API] Menyelaraskan lini masa berkala ke detik: ${targetSeconds}`);
          playerRef.current.seekTo(targetSeconds, true);
        }
      }
    };

    window.addEventListener("yt-seek-to", handleYtSeek);
    return () => window.removeEventListener("yt-seek-to", handleYtSeek);
  }, []);

  // Konfigurasi pemutar terkontrol dengan parameter start dinamis
  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      // Jika data start sudah terkunci semenjak komponen lahir, langsung suapi ke parameter pemutar Google
      ...(initialStart && initialStart > 0 ? { start: initialStart } : {})
    },
  };

  return (
    <div className="youtube-player-container">
      <div className="video-wrapper shadow-2xl">
        <YouTube 
          videoId={id} 
          opts={opts} 
          onReady={onPlayerReady} 
          className="video-iframe"
        />
      </div>
      <p className="video-caption">
        {caption || "VIDEO DOKUMENTASI PCM KEMBARAN"}
      </p>

      <style jsx>{`
        .youtube-player-container { margin: 40px 0; }
        .video-wrapper {
          position: relative; padding-bottom: 56.25%; height: 0; 
          overflow: hidden; border-radius: 24px; border: 4px solid white;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); background: #000;
        }
        :global(.video-iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
        .video-caption {
          text-align: center; font-size: 10px; color: #94a3b8; 
          margin-top: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;
        }
      `}</style>
    </div>
  );
}