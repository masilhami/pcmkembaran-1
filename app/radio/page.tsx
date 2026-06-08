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
    // PERBAIKAN MUTLAK: Gambar dipasang langsung di tag main menggunakan bg-fixed & beralih ke relative.
    // Ini mengunci background agar HANYA berada di area konten radio dan tidak menabrak header/footer web utama.
    <main 
      className="min-h-screen text-slate-100 selection:bg-cyan-500/30 relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%), radial-gradient(circle at center, transparent 20%, rgba(0, 0, 0, 0.6) 100%), url('/images/bg-pattern.png')",
      }}
    >
      
      {/* =========================================================================
          BACKGROUND DECOR LAMA DIHAPUS TOTAL AGAR TIDAK BOCOR KE LAYOUT LUAR
          ========================================================================= */}

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