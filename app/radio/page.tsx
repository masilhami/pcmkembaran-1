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
    // PERBAIKAN: Mengubah warna dasar menjadi abu-abu dengan gradasi putih (dari atas ke bawah)
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-200 text-slate-100 selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* =========================================================================
          BACKGROUND DECOR: Efek dekorasi cahaya biru lama dihapus total,
          menyisakan ruang bersih agar fokus pada gradasi abu-abu putih bawaan main tag.
          ========================================================================= */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-transparent" />

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