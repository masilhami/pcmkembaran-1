'use client'

import { useEffect } from 'react'
import { useAudio } from '../context/AudioContext'

export default function YouTubeManager() {
  const { youtubeVideoId, isYouTubePlaying, setIsYouTubePlaying } = useAudio()

  useEffect(() => {
    const handleToggle = () => {
      // Mencari elemen iframe global di dalam DOM
      const iframe = document.getElementById('global-youtube-player') as HTMLIFrameElement | null
      if (!iframe?.contentWindow) return

      // Menggunakan status terpusat dari context untuk menentukan aksi berikutnya
      if (isYouTubePlaying) {
        // Jika sedang berputar, lakukan Mute dan Pause
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute' }), '*')
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*')
        
        // Perbarui status global ke false
        window.dispatchEvent(new CustomEvent('yt-status-change', { detail: false }))
      } else {
        // Jika sedang berhenti, lakukan Unmute, Play, dan maksimalkan Volume
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*')
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*')
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*')
        
        // Perbarui status global ke true
        window.dispatchEvent(new CustomEvent('yt-status-change', { detail: true }))
      }
    }

    window.addEventListener('toggle-yt-player', handleToggle)
    return () => window.removeEventListener('toggle-yt-player', handleToggle)
  }, [isYouTubePlaying]) // Dependensi ditambahkan agar membaca status pemutaran terbaru

  // JANGAN hilangkan ID global-youtube-player agar pencarian elemen di halaman lain tidak menghasilkan null
  if (!youtubeVideoId) {
    return <div id="global-youtube-player" className="hidden" />
  }

  return (
    <div className="fixed -top-[9999px] left-0 pointer-events-none">
      <iframe
        id="global-youtube-player"
        src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&enablejsapi=1&playsinline=1`}
        allow="autoplay; encrypted-media"
        className="w-[1px] h-[1px] opacity-0"
        title="Live Player"
      />
    </div>
  )
}