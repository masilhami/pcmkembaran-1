"use client";

import { useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { useAudio } from "@/context/AudioContext"; // Pastikan path context sesuai

export default function YouTubePlayer({ value }: any) {
  const { url, caption } = value;
  const { metadata } = useAudio();
  const playerRef = useRef<any>(null);

  if (!url) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const id = (match && match[2].length === 11) ? match[2] : null;

  if (!id) return null;

  // 🎯 LANGKAH SAKRAL 1: Lompat instan saat video benar-benar siap (Mengatasi Masalah Refresh)
  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    
    // Ambil detik berjalan langsung dari context pusat
    const currentElapsed = Number(metadata.elapsed_seconds) || 0;
    
    if (currentElapsed > 0) {
      console.log(`🎯 [YouTube Engine] Video Siap! Memaksa lompat awal ke detik: ${currentElapsed}`);
      event.target.seekTo(currentElapsed, true);
      event.target.playVideo(); // Paksa putar setelah melompat
    }
  };

  // 🔄 LANGKAH SAKRAL 2: Kejar perubahan state metadata saat pertama kali dimuat (Fix Masalah Refresh)
  useEffect(() => {
    const currentElapsed = Number(metadata.elapsed_seconds) || 0;
    
    if (playerRef.current && typeof playerRef.current.seekTo === "function" && currentElapsed > 0) {
      const currentTime = playerRef.current.getCurrentTime();
      // Melompat jika player masih tertahan di awal siaran (detik 0)
      if (currentTime < 2 || Math.abs(currentTime - currentElapsed) > 5) {
        console.log(`🎯 [YouTube Engine] State terisi! Memaksa lompat ke detik berjalan: ${currentElapsed}`);
        playerRef.current.seekTo(currentElapsed, true);
      }
    }
  }, [metadata.elapsed_seconds]);

  // 🔄 LANGKAH SAKRAL 3: Jaga sinkronisasi berkala (Jika jemaah diam di halaman web)
  useEffect(() => {
    const handleYtSeek = (e: any) => {
      const targetSeconds = e.detail;
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        const currentTime = playerRef.current.getCurrentTime();
        // Beri toleransi 5 detik agar tidak melompat-lompat terus setiap polling
        if (Math.abs(currentTime - targetSeconds) > 5) {
          console.log(`🔄 [YouTube Engine] Sinkronisasi Lini Masa: Lompat ke ${targetSeconds}`);
          playerRef.current.seekTo(targetSeconds, true);
        }
      }
    };

    window.addEventListener("yt-seek-to", handleYtSeek);
    return () => window.removeEventListener("yt-seek-to", handleYtSeek);
  }, []);

  // Konfigurasi pemutar react-youtube
  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
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