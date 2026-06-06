'use client'

import { createContext, useContext, useRef, useEffect } from 'react'
import { useAudioStore } from '@/store/useAudioStore'

interface Track {
  id: number
  title: string
  artist: string
  src: string
}

type AudioContextType = {
  playlist: Track[]
  currentTrackIndex: number
  audioRef: React.RefObject<HTMLAudioElement>
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const setAudioRef = useAudioStore((s) => s.setAudioRef)

  // Sambungkan ref ke store
  setAudioRef(audioRef)

  const playlist: Track[] = [
  { id: 0, title: "Murottal Al-Qur’an – Juz 1", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/01.mp3" },
  { id: 1, title: "Murottal Al-Qur’an – Juz 2", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/02.mp3" },
  { id: 2, title: "Murottal Al-Qur’an – Juz 3", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/03.mp3" },
  { id: 3, title: "Murottal Al-Qur’an – Juz 4", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/04.mp3" },
  { id: 4, title: "Murottal Al-Qur’an – Juz 5", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/05.mp3" },
  { id: 5, title: "Murottal Al-Qur’an – Juz 6", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/06.mp3" },
  { id: 6, title: "Murottal Al-Qur’an – Juz 7", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/07.mp3" },
  { id: 7, title: "Murottal Al-Qur’an – Juz 8", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/08.mp3" },
  { id: 8, title: "Murottal Al-Qur’an – Juz 9", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/09.mp3" },
  { id: 9, title: "Murottal Al-Qur’an – Juz 10", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/10.mp3" },
  { id: 10, title: "Murottal Al-Qur’an – Juz 11", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/11.mp3" },
  { id: 11, title: "Murottal Al-Qur’an – Juz 12", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/12.mp3" },
  { id: 12, title: "Murottal Al-Qur’an – Juz 13", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/13.mp3" },
  { id: 13, title: "Murottal Al-Qur’an – Juz 14", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/14.mp3" },
  { id: 14, title: "Murottal Al-Qur’an – Juz 15", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/15.mp3" },
  { id: 15, title: "Murottal Al-Qur’an – Juz 16", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/16.mp3" },
  { id: 16, title: "Murottal Al-Qur’an – Juz 17", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/17.mp3" },
  { id: 17, title: "Murottal Al-Qur’an – Juz 18", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/18.mp3" },
  { id: 18, title: "Murottal Al-Qur’an – Juz 19", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/19.mp3" },
  { id: 19, title: "Murottal Al-Qur’an – Juz 20", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/20.mp3" },
  { id: 20, title: "Murottal Al-Qur’an – Juz 21", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/21.mp3" },
  { id: 21, title: "Murottal Al-Qur’an – Juz 22", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/22.mp3" },
  { id: 22, title: "Murottal Al-Qur’an – Juz 23", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/23.mp3" },
  { id: 23, title: "Murottal Al-Qur’an – Juz 24", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/24.mp3" },
  { id: 24, title: "Murottal Al-Qur’an – Juz 25", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/25.mp3" },
  { id: 25, title: "Murottal Al-Qur’an – Juz 26", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/26.mp3" },
  { id: 26, title: "Murottal Al-Qur’an – Juz 27", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/27.mp3" },
  { id: 27, title: "Murottal Al-Qur’an – Juz 28", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/28.mp3" },
  { id: 28, title: "Murottal Al-Qur’an – Juz 29", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/29.mp3" },
  { id: 29, title: "Murottal Al-Qur’an – Juz 30", artist: "Syaikh Abdullah Basfar", src: "https://archive.org/download/AbdullahBasfarPerJuz/30.mp3" },
]

  const currentTrackIndex = 0

  // 🔥 LOOPING 24 JAM: otomatis play berikutnya
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      let nextIndex = currentTrackIndex + 1
      if (nextIndex >= playlist.length) nextIndex = 0
      audio.src = playlist[nextIndex].src
      audio.play().catch((err) => console.warn('Auto-play next track failed', err))
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [audioRef, currentTrackIndex, playlist])

  return (
    <AudioContext.Provider value={{ playlist, currentTrackIndex, audioRef }}>
      {children}
      <audio ref={audioRef} preload="auto" />
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be inside AudioProvider')
  return ctx
}