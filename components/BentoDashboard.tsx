'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function BentoDashboard({ data }: { data: any }) {
  // 1. Definisikan data dengan fallback agar tidak crash jika data kosong
  const latestPost = data?.latestPost
  const installCount = data?.installCount || 0
  const leader = data?.leader
  const profile = data?.profile
  const rantingCount = data?.rantingCount || 0
  const masjidCount = data?.masjidCount || 0

  // 2. FIX SLUG: Pastikan mengambil .current jika slug berupa objek
  const postSlug = typeof latestPost?.slug === 'string' 
    ? latestPost.slug 
    : latestPost?.slug?.current || '';

  const category = latestPost?.category?.toLowerCase() || 'berita';
  const isDownload = category === 'unduhan';
  const downloadUrl = latestPost?.fileUrl || latestPost?.downloadLink || '#';

  // 3. FIX LINK: Buat URL yang bersih
  const buttonLink = isDownload ? downloadUrl : `/${category}/${postSlug}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto bento-container">
      
      {/* 1. KARTU UTAMA: POSTINGAN TERBARU (GANTI <a> JADI <Link>) */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="md:col-span-2 md:row-span-2 bg-[#004a8e] text-white p-8 rounded-3xl flex flex-col justify-between shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className={`badge ${isDownload ? 'bg-green-500' : 'bg-[#ffc107] text-[#004a8e]'}`}>
            {latestPost?.category ? `${latestPost.category.toUpperCase()} TERBARU` : 'KONTEN TERBARU'}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-6 mt-4">
            {latestPost?.title || 'Menanti Konten Terkini'}
          </h2>

          <p className="text-blue-100 font-semibold text-sm" suppressHydrationWarning>
            {latestPost?.publishedAt 
              ? new Date(latestPost.publishedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) 
              : 'Baru Saja'}
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          {/* GUNAKAN LINK AGAR LEBIH CEPAT DAN TIDAK RELOAD */}
          <Link 
            href={buttonLink}
            target={isDownload ? "_blank" : "_self"}
            className="relative z-10 mt-8 inline-flex items-center gap-3 bg-[#ffc107] text-[#004a8e] font-black px-8 py-4 rounded-2xl w-fit hover:bg-white transition-all shadow-lg text-sm uppercase tracking-wider"
          >
            {isDownload ? "Unduh File" : "Baca Selengkapnya"}
            <span className="text-lg">➔</span>
          </Link>
        </motion.div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
      </motion.div>

      {/* 2. KARTU STATISTIK: JAMAAH TERHUBUNG */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="md:col-span-2 bg-white border border-slate-100 p-8 rounded-3xl flex items-center justify-between shadow-sm"
      >
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
            Jamaah Terhubung
          </span>
          <h3 className="text-5xl md:text-6xl font-black text-[#004a8e]" suppressHydrationWarning>
            {installCount}
          </h3>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-bold text-green-700">Digital Dakwah Aktif</span>
          </div>
          <p className="text-xs font-extrabold text-slate-500">
            {rantingCount} Ranting | {masjidCount} Masjid
          </p>
        </div>
      </motion.div>

      {/* 3. KARTU PIMPINAN: KETUA PCM */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-[#ffc107] p-6 rounded-3xl flex flex-col justify-between shadow-md relative overflow-hidden min-h-[180px]"
      >
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black text-[#004a8e] uppercase block mb-1">Ketua PCM</span>
            <h4 className="text-lg font-black text-[#004a8e] leading-tight max-w-[120px]">
              {leader?.name || 'Ir. H. Sugiyatno, M.M.'}
            </h4>
          </div>
          {leader?.photoUrl && (
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#004a8e] shadow-sm relative shrink-0">
               <Image src={leader.photoUrl} alt={leader.name || 'Pimpinan'} fill sizes="64px" className="object-cover" />
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4">
          <div className="inline-block bg-[#004a8e] text-white px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-[10px] font-bold tracking-widest uppercase">NBM: {leader?.nbm || '1114297'}</span>
          </div>
        </div>
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white opacity-20 rounded-full"></div>
      </motion.div>

      {/* 4. KARTU KONTAK: SEKRETARIAT */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white border border-slate-100 p-6 rounded-3xl flex flex-col justify-center shadow-sm relative overflow-hidden"
      >
        <span className="text-[10px] font-black text-[#004a8e] uppercase block mb-3">Sekretariat</span>
        <p className="text-sm font-bold text-slate-600 leading-relaxed mb-4">
          {profile?.address || 'Dukuhwaluh, Kembaran, Banyumas, Jawa Tengah'}
        </p>
        <Link href="/ranting" className="text-xs font-black text-[#004a8e] flex items-center gap-2 hover:gap-4 transition-all uppercase tracking-wider">
          📍 Peta Dakwah <span>➔</span>
        </Link>
      </motion.div>

      <style jsx>{`
        .badge {
          display: inline-block;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 900;
          border-radius: 8px;
          letter-spacing: 0.5px;
        }
        @media (max-width: 768px) {
           .bento-container { gap: 12px; padding: 12px; }
        }
      `}</style>
    </div>
  )
}