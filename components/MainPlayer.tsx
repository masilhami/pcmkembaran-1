'use client'

import { Play, Square } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAudio } from '../context/AudioContext'

export default function MainPlayer() {
  const { isPlaying, metadata, toggleLivePlayback, isYouTubeLive } = useAudio()
  const isOnAir = isPlaying

  return (
    <div className="relative w-full max-w-5xl mx-auto p-4 md:p-6">
      {/* Glow Background - Dikecilkan untuk mobile agar tidak overflow */}
      <div className="absolute -left-10 top-10 h-48 w-48 md:h-72 md:w-72 rounded-full bg-cyan-500/20 blur-[100px] z-0" />
      <div className="absolute -right-10 bottom-10 h-48 w-48 md:h-72 md:w-72 rounded-full bg-blue-500/20 blur-[100px] z-0" />

      {/* Player Panel */}
      <div className="relative z-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black shadow-2xl p-6 md:p-8 flex flex-col items-center md:flex-row md:items-center gap-6 md:gap-8">

        {/* Logo - Ukuran adaptif */}
        <div className="relative flex-shrink-0">
          {isOnAir && (
            <div className="absolute inset-0 rounded-full bg-cyan-400/50 blur-2xl md:blur-3xl animate-pulse" />
          )}

          <motion.div
            animate={isOnAir ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="h-32 w-32 md:h-44 md:w-44 rounded-full border border-cyan-400/50 p-1 shadow-[0_0_30px_rgba(6,255,255,0.5)] md:shadow-[0_0_50px_rgba(6,255,255,0.7)] flex items-center justify-center bg-black"
          >
            <img
              src="/logo-md-putih.png"
              alt="Muhammadiyah"
              className="h-20 w-20 md:h-28 md:w-28 object-contain"
            />
          </motion.div>
        </div>

        {/* Track Info - Text alignment center untuk mobile */}
        <div className="flex-1 w-full text-center md:text-left">
          <h1 className="text-2xl md:text-5xl font-bold text-white leading-tight">
            PCM KEMBARAN
          </h1>

          <p className="mt-2 text-slate-400 text-sm md:text-lg truncate">
            {metadata.title}
          </p>

          <p className="text-xs md:text-sm text-slate-500 truncate">
            {metadata.artist}
          </p>

          {/* ON AIR Indicator */}
          {isOnAir && (
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mt-3 md:mt-4 inline-block px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest text-red-500 bg-black/50 rounded-lg"
            >
              {isYouTubeLive ? 'LIVE YOUTUBE' : 'ON AIR'}
            </motion.div>
          )}

          <div className="mt-3 md:mt-4 block md:inline-flex items-center gap-2 text-[10px] md:text-xs text-cyan-300 uppercase tracking-[0.2em] md:tracking-[0.25em]">
            PCM Kembaran • Muhammadiyah Islamic Broadcast
          </div>
        </div>

        {/* Play/Stop Button */}
        <div className="flex-shrink-0 mt-2 md:mt-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleLivePlayback}
            className={`h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center
              shadow-[0_0_20px_rgba(6,182,212,0.4)] md:shadow-[0_0_30px_rgba(6,182,212,0.6)]
              transition-all duration-300
              ${isOnAir ? 'bg-red-500' : 'bg-cyan-500'}
            `}
          >
            {isOnAir ? (
              <Square size={24} className="text-white" fill="white" />
            ) : (
              <Play size={24} className="text-white" fill="white" />
            )}
          </motion.button>
        </div>

      </div>
    </div>
  )
}