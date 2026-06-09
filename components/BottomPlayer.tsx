'use client'

import { Play, Square } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAudio } from '../context/AudioContext'
import { useEffect, useState } from 'react'

export default function BottomPlayer() {
  const {
    isPlaying,
    metadata,
    toggleLivePlayback,
    isYouTubeLive,
    toggleYouTubeAudio,
    isYouTubePlaying,
  } = useAudio()

  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Menentukan status aktif gabungan (Radio MP3 aktif ATAU YouTube sedang berputar)
  const isOnAir = isPlaying || isYouTubePlaying

  if (!mounted) {
    return (
      <div className="fixed bottom-5 left-0 w-full flex justify-center px-4 z-50">
        <div className="w-full max-w-sm h-[72px] rounded-2xl bg-slate-900/80 border border-white/10" />
      </div>
    )
  }

  // =========================================================================
  // 🔴 TAMPILAN 1: MINIMALIS BULAT MERAH (HANYA MUNCUL KETIKA LIVE / ON AIR)
  // =========================================================================
  if (isOnAir) {
    return (
      <div className="fixed bottom-5 right-5 z-[9999] pointer-events-none">
        <motion.button
          key="stop-btn"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          whileTap={{ scale: 0.92 }}
          pointer-events-auto
          onClick={() => {
            if (isYouTubeLive) {
              toggleYouTubeAudio()
            } else {
              toggleLivePlayback()
            }
          }}
          className="
            pointer-events-auto
            relative h-16 w-16 rounded-full 
            flex items-center justify-center 
            bg-gradient-to-br from-red-500 to-red-600
            shadow-[0_0_30px_rgba(239,68,68,0.5)]
            border border-red-400/20
            transition-all duration-300
          "
        >
          {/* Ikon Stop Kotak Putih */}
          <Square size={20} className="text-white" fill="white" />
          
          {/* Efek Denyut Sinyal Mengalir (Ping Animation Bawaan Tailwind) */}
          <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30 pointer-events-none" />
          
          {/* Tulisan kecil ON AIR melayang di atas tombol biar makin informatif */}
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-[9px] font-bold tracking-widest text-white px-1.5 py-0.5 rounded shadow-md uppercase">
            LIVE
          </span>
        </motion.button>
      </div>
    )
  }

  // =========================================================================
  // 🎵 TAMPILAN 2: CARD LEBAR PENUH ORIGINAL (MUNCUL KETIKA OFFLINE / PAUSED)
  // =========================================================================
  return (
    <div className="fixed bottom-5 left-0 w-full flex justify-center px-4 z-[9999] pointer-events-none">
      <div className="
        pointer-events-auto
        w-full max-w-sm
        flex items-center gap-4
        px-4 py-3
        rounded-2xl
        bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90
        backdrop-blur-2xl
        border border-white/10
        shadow-[0_10px_40px_rgba(0,0,0,0.6)]
        relative overflow-visible
      ">
        {/* subtle glow line */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.25),transparent_60%)]" />
        
        {/* TEXT SECTION */}
        <div className="flex-1 min-w-0 relative">
          <div className="text-[10px] tracking-[0.3em] text-cyan-400 uppercase font-semibold">
            Now Playing
          </div>
          <div className="text-white text-sm font-semibold truncate">
            {metadata.title || "Radio Streaming"}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {metadata.artist || "PCM Kembaran"}
          </div>

          {/* status indicator */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              Paused
            </span>
          </div>
        </div>

        {/* ACTION BUTTON PLAY */}
        <motion.button
          key="play-btn"
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (isYouTubeLive) {
              toggleYouTubeAudio()
            } else {
              toggleLivePlayback()
            }
          }}
          className="
            relative h-12 w-12 rounded-full 
            flex items-center justify-center 
            transition-all duration-300 
            bg-slate-700 hover:bg-slate-600
          "
        >
          <Play size={18} className="text-white ml-1" fill="white" />
        </motion.button>
      </div>
    </div>
  )
}