import { create } from 'zustand'

interface AudioStore {
  isStarted: boolean
  isMuted: boolean
  audioRef: React.RefObject<HTMLAudioElement> | null

  setAudioRef: (ref: React.RefObject<HTMLAudioElement>) => void
  startRadio: () => Promise<void>
  toggleMute: () => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  isStarted: false,
  isMuted: false,
  audioRef: null,

  setAudioRef: (ref) => set({ audioRef: ref }),

  startRadio: async () => {
    const audio = get().audioRef?.current
    if (!audio) return
    if (get().isStarted) return

    audio.src = audio.src || 'https://archive.org/download/AbdullahBasfarPerJuz/01.mp3'
    audio.muted = false
    try {
      await audio.play()
      set({ isStarted: true, isMuted: false })
    } catch (e) {
      console.warn('Radio start failed', e)
    }
  },

  toggleMute: () => {
    const audio = get().audioRef?.current
    if (!audio) return
    audio.muted = !audio.muted
    set({ isMuted: audio.muted })
  },
}))