'use client'

import { Play, Square } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAudio } from '../context/AudioContext'
import { useEffect, useRef } from 'react'

export default function MainPlayer() {
  const { 
    isPlaying, 
    metadata, 
    toggleLivePlayback, 
    isYouTubeLive, 
    youtubeVideoId, 
    setIsYouTubeLive,
    toggleYouTubeAudio,
    isYouTubePlaying,
    registerYouTubeToggle,
  } = useAudio()

  const playerContainerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const isOnAir = isPlaying || isYouTubePlaying

  // ===================== YouTube Live handling =====================
  useEffect(() => {
    if (!youtubeVideoId) setIsYouTubeLive(false)
  }, [youtubeVideoId, setIsYouTubeLive])

  useEffect(() => {
    if (isYouTubeLive) {
      registerYouTubeToggle(toggleYouTubeAudio)
    }
    return () => {
      registerYouTubeToggle(null)
    }
  }, [isYouTubeLive, toggleYouTubeAudio, registerYouTubeToggle])

  // ===================== MP3 Player handling =======================
  // Update audio src hanya jika berubah
  useEffect(() => {
    if (!isYouTubeLive && metadata.audio_url && audioRef.current) {
      if (audioRef.current.src !== metadata.audio_url) {
        audioRef.current.src = metadata.audio_url
        audioRef.current
          .play()
          .catch((err) => console.warn('Audio play error:', err))
      }
    }
  }, [metadata.audio_url, isYouTubeLive])

  // Update currentTime dengan aman
  useEffect(() => {
    if (!isYouTubeLive && audioRef.current && metadata.elapsed_seconds != null) {
      const audioEl = audioRef.current
      const safeTime = Math.min(metadata.elapsed_seconds, audioEl.duration || metadata.elapsed_seconds)
      audioEl.currentTime = safeTime
    }
  }, [metadata.elapsed_seconds, isYouTubeLive])

  return (
    <div className="relative w-full max-w-5xl mx-auto p-4 md:p-6">

      {/* ===================== YouTube Live iframe ===================== */}
      {isYouTubeLive && youtubeVideoId && (
        <div ref={playerContainerRef} className="fixed bottom-0 right-0 w-[1px] h-[1px] z-50 overflow-hidden opacity-0">
          <iframe
            id="global-youtube-player"
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0&enablejsapi=1&playsinline=1`}
            allow="autoplay; encrypted-media; gyroscope; accelerometer; cross-origin-isolated"
            className="w-full h-full"
            title="Live Player"
          />
        </div>
      )}

      {/* ===================== MP3 Audio Element ===================== */}
      {!isYouTubeLive && (
        <audio
          ref={audioRef}
          autoPlay
          controls={false}
          className="hidden"
        />
      )}

      {/* ===================== Glow Background ===================== */}
      <div className="absolute -left-10 top-10 h-48 w-48 md:h-72 md:w-72 rounded-full bg-cyan-500/20 blur-[100px] z-0" />
      <div className="absolute -right-10 bottom-10 h-48 w-48 md:h-72 md:w-72 rounded-full bg-blue-500/20 blur-[100px] z-0" />

      {/* ===================== Player Panel ===================== */}
      <div className="relative z-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        
        {/* Logo */}
        <div className="relative flex-shrink-0">
          {isOnAir && <div className="absolute inset-0 rounded-full bg-cyan-400/50 blur-3xl animate-pulse" />}
          <motion.div
            animate={isOnAir ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="h-32 w-32 md:h-44 md:w-44 rounded-full border border-cyan-400/50 p-1 shadow-[0_0_50px_rgba(6,255,255,0.7)] flex items-center justify-center bg-black"
          >
            <img src="/logo-md-putih.png" alt="Muhammadiyah" className="h-20 w-20 md:h-28 md:w-28 object-contain" />
          </motion.div>
        </div>

        {/* Metadata */}
        <div className="flex-1 w-full text-center md:text-left">
          <h1 className="text-2xl md:text-5xl font-bold text-white leading-tight">LIVE 24 JAM</h1>
          <p className="mt-2 text-slate-400 text-sm md:text-lg truncate">{metadata.title}</p>
          <p className="text-xs md:text-sm text-slate-500 truncate">{metadata.artist}</p>
          
          {isOnAir && (
            <motion.div 
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mt-3 md:mt-4 inline-block px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest text-red-500 bg-black/50 rounded-lg"
            >
              ON AIR
            </motion.div>
          )}
          
          <div className="mt-3 md:mt-4 block md:inline-flex items-center gap-2 text-[10px] md:text-xs text-cyan-300 uppercase tracking-[0.2em] md:tracking-[0.25em]">
            PCM Kembaran • Muhammadiyah Islamic Broadcast
          </div>
        </div>

        {/* Play/Stop Button */}
        <div className="flex-shrink-0 mt-2 md:mt-0">
          <motion.button
            key={isOnAir ? "stop" : "play"}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLivePlayback}
            className={`h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center transition-all duration-300 ${isOnAir ? 'bg-red-500' : 'bg-cyan-500'}`}
          >
            {isOnAir ? <Square size={24} className="text-white" fill="white" /> : <Play size={24} className="text-white" fill="white" />}
          </motion.button>
        </div>

      </div>
    </div>
  )
}