import { create } from 'zustand'

interface AudioStore {
  isStarted: boolean
  isPlaying: boolean
  isMuted: boolean
  audioRef: React.RefObject<HTMLAudioElement> | null

  setAudioRef: (ref: React.RefObject<HTMLAudioElement>) => void
  togglePlay: () => Promise<void>
  toggleMute: () => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  isStarted: false,
  isPlaying: false,
  isMuted: false,
  audioRef: null,

  setAudioRef: (ref) => set({ audioRef: ref }),

  togglePlay: async () => {
    const audio = get().audioRef?.current
    if (!audio) return

    if (audio.paused) {
      // pastikan src ada
      if (!audio.src) {
        audio.src =
          'https://archive.org/download/AbdullahBasfarPerJuz/01.mp3'
      }
      try {
        await audio.play()
        set({ isPlaying: true, isStarted: true, isMuted: false })
      } catch (err) {
        console.warn('Audio play failed', err)
      }
    } else {
      audio.pause()
      set({ isPlaying: false })
    }
  },

  toggleMute: () => {
    const audio = get().audioRef?.current
    if (!audio) return

    audio.muted = !audio.muted
    set({ isMuted: audio.muted })
  },
}))