'use client' // Tambahkan ini agar aman untuk client-side handling

import MainPlayer from '@/components/MainPlayer';
import BottomPlayer from '@/components/BottomPlayer';
import dynamic from 'next/dynamic';

// 1. Matikan SSR untuk MainPlayer karena ia memuat YouTube iframe
const MainPlayerNoSSR = dynamic(() => import('@/components/MainPlayer'), {
  ssr: false, 
  loading: () => <div className="h-64 flex items-center justify-center text-slate-100/60">Memuat Player...</div>
});

export default function RadioPage() {
  return (
    // PERBAIKAN: bg-blue-900 memberikan warna dasar biru yang lebih hidup dan terang
    <main className="min-h-screen bg-blue-900 text-slate-100 selection:bg-cyan-400/40 relative overflow-hidden">
      
      {/* =========================================================================
          BACKGROUND DECOR: Efek cahaya biru terang (Glow Radial & Linear Layer)
          ========================================================================= */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Lapisan gradien vertikal lembut untuk mencerahkan warna dasar */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/30 via-transparent to-blue-950/50" />
        
        {/* Pancaran cahaya cyan terang di sudut kiri atas */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-400/40 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Pusat cahaya biru elektrik terang di bagian tengah atas */}
        <div className="absolute top-[10%] left-[30%] w-[40%] h-[40%] rounded-full bg-blue-400/30 blur-[160px]" />
        
        {/* Pancaran cahaya safir terang di sudut kanan bawah */}
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/40 blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      {/* CONTAINER KONTEN UTAMA */}
      <div className="container mx-auto px-6 py-12 relative z-10">
        
        <header className="text-center mb-16 space-y-2">
          {/* Mengubah gradien teks agar kontras di atas warna biru terang baru */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.3)]">
            Radio Berkemajuan
          </h1>
          <p className="text-cyan-300/80 font-semibold tracking-wide uppercase text-sm">
            PCM Kembaran • Live Broadcast
          </p>
        </header>

        <section className="flex flex-col items-center">
          {/* Gunakan komponen yang sudah dimatikan SSR-nya */}
          <MainPlayerNoSSR />
        </section>

        <section className="mt-20 max-w-2xl mx-auto text-center border-t border-white/10 pt-10">
          <p className="text-cyan-200/60 text-sm italic">
            "Mencerahkan, Menggerakkan, dan Memajukan Umat"
          </p>
        </section>

        <BottomPlayer />
      </div>
    </main>
  );
}