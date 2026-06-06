'use client'

import { Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAudio } from '../context/AudioContext'
import { useAudioStore } from '@/store/useAudioStore'

export default function BottomPlayer() {
  const { playlist, currentTrackIndex } = useAudio()
  const { isMuted, toggleMute } = useAudioStore()

  const track = playlist[currentTrackIndex]
  if (!track) return null

  return (
    <div className="fixed bottom-5 left-0 w-full flex justify-center px-4 z-50">
      
      {/* MAIN CARD */}
      <div className="
        w-full max-w-sm
        flex items-center gap-4
        px-4 py-3
        rounded-2xl
        bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90
        backdrop-blur-2xl
        border border-white/10
        shadow-[0_10px_40px_rgba(0,0,0,0.6)]
        relative overflow-hidden
      ">

        {/* subtle glow line */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.25),transparent_60%)]" />

        {/* TEXT SECTION */}
        <div className="flex-1 min-w-0 relative">
          
          <div className="text-[10px] tracking-[0.3em] text-cyan-400 uppercase font-semibold">
            Now Playing
          </div>

          <div className="text-white text-sm font-semibold truncate">
            {track.title}
          </div>

          <div className="text-[11px] text-slate-400 truncate">
            {track.artist}
          </div>

          {/* status indicator */}
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isMuted ? 'bg-slate-500' : 'bg-red-500 animate-pulse'
              }`}
            />
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              {isMuted ? 'Paused' : 'On Air'}
            </span>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleMute}
          className={`
            relative h-12 w-12 rounded-full
            flex items-center justify-center
            transition-all duration-300
            shadow-[0_0_25px_rgba(34,211,238,0.25)]
            ${
              isMuted
                ? 'bg-slate-700 hover:bg-slate-600'
                : 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
            }
          `}
        >
          <Play className="text-white" size={18} />

          {/* glow ring when ON AIR */}
          {!isMuted && (
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400/30" />
          )}
        </motion.button>

      </div>
    </div>
  )
}