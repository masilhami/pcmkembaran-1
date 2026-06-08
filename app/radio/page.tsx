'use client' // Tambahkan ini agar aman untuk client-side handling

import MainPlayer from '@/components/MainPlayer';
import BottomPlayer from '@/components/BottomPlayer';
import dynamic from 'next/dynamic';

// 1. Matikan SSR untuk MainPlayer karena ia memuat YouTube iframe
const MainPlayerNoSSR = dynamic(() => import('@/components/MainPlayer'), {
  ssr: false, 
  loading: () => <div className="h-64 flex items-center justify-center text-slate-400">Memuat Player...</div>
});

export default function RadioPage() {
  return (
    // PERBAIKAN: Menggunakan background berpola biru gelap islami yang elegan
    <main className="min-h-screen text-slate-100 selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* =========================================================================
          BACKGROUND PATTERN & VIGNETTE EFFECT
          ========================================================================= */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          // Masukkan file gambar pola ornamen biru Anda ke folder public (misal: /images/bg-pattern.png)
          backgroundImage: "url('/images/bg-pattern.png')", 
        }}
      >
        {/* Lapisan overlay gelap/vignette lembut agar teks dan player tetap sangat kontras dan terbaca */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-black/20 to-black/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* CONTAINER KONTEN UTAMA */}
      <div className="container mx-auto px-6 py-12 relative z-10">
        
        {/* HEADER: Struktur teks dan warna dipertahankan 100% utuh */}
        <header className="text-center mb-16 space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.3)]">
            Radio Berkemajuan
          </h1>
          <p className="text-cyan-300/80 font-semibold tracking-wide uppercase text-sm">
            PCM Kembaran • Live Broadcast
          </p>
        </header>

        {/* MAIN PLAYER SECTION */}
        <section className="flex flex-col items-center">
          {/* Gunakan komponen yang sudah dimatikan SSR-nya */}
          <MainPlayerNoSSR />
        </section>

        {/* FOOTER QUOTE: Struktur teks dan warna dipertahankan 100% utuh */}
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