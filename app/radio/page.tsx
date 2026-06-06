// app/radio/page.tsx
'use client'

import MainPlayer from '@/components/MainPlayer'
import BottomPlayer from '@/components/BottomPlayer'
import { AudioProvider } from '@/context/AudioContext'

export default function RadioPage() {
  return (
    <AudioProvider>
      <div className="flex flex-col items-center min-h-screen justify-center bg-slate-950 p-6">
        <MainPlayer />
        <BottomPlayer />
      </div>
    </AudioProvider>
  )
}