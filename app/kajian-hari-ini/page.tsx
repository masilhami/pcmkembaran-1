'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getKajianHariIni, getAllPosts } from '@/lib/sanity.query'
import { toPng } from 'html-to-image'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Calendar, Clock, MapPin, User, Share2, Info, ChevronRight, ArrowRight, Maximize2, X } from 'lucide-react'

export default function KajianHariIniPage() {
  const [kajianList, setKajianList] = useState<any[]>([])
  const [upcomingKajian, setUpcomingKajian] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{ url: string, tema: string } | null>(null)

  // 1. DATA WAKTU REAL-TIME
  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const now = new Date()
  const today = days[now.getDay()]
  
  const currentDate = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getWeekOfMonth = (date: Date) => {
    const day = date.getDate();
    return Math.ceil(day / 7).toString();
  };

  const currentWeekNum = getWeekOfMonth(now);

  useEffect(() => {
    async function fetchData() {
      try {
        const todayDay = days[now.getDay()];
        const todayDate = now.toISOString().split('T')[0];
        const currentWeek = getWeekOfMonth(now);

        const dataHariIni = await getKajianHariIni(todayDay, todayDate, currentWeek);
        setKajianList(dataHariIni);

        const allData = await getAllPosts();
        const filteredUpcoming = allData.filter((item: any) => 
          item.category === "Jadwal Kajian" && !dataHariIni.some(h => h._id === item._id)
        ).slice(0, 4);
        
        setUpcomingKajian(filteredUpcoming);
      } catch (error) {
        console.error("Gagal sinkronisasi radar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 2. FUNGSI SMART DOWNLOAD
  const handleDownload = async (imageUrl: string, tema: string, id?: string) => {
    // Jika ada ID, berarti men-download hasil generator (HTML-to-Image)
    if (id && !imageUrl) {
      const node = document.getElementById(id);
      if (!node) return;
      try {
        const dataUrl = await toPng(node, { quality: 1.0, pixelRatio: 3, cacheBust: true });
        const link = document.createElement('a');
        link.download = `FLYER-${tema.toUpperCase().replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) { console.error('Gagal generate:', err); }
      return;
    }

    // Jika ada URL, men-download file asli dari Sanity
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FLYER-RESMI-${tema.toUpperCase().replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { console.error('Gagal download:', err); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#004a8e] border-t-yellow-400 rounded-full animate-spin mx-auto"></div>
        <p className="font-black text-[#004a8e] animate-pulse tracking-widest uppercase text-xs">Mensinkronkan Radar Dakwah...</p>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER STATUS */}
        <header className="text-center mb-16 space-y-4">
          <div className="inline-flex flex-wrap justify-center items-center gap-3 px-6 py-2 bg-white shadow-sm border border-slate-200 rounded-full text-xs font-black tracking-widest uppercase text-slate-600">
            <div className="flex items-center gap-2 text-[#004a8e]">
               <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
               Live Update
            </div>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{currentDate}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span className="text-yellow-600">Pekan ke-{currentWeekNum}</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter">
            KAJIAN <span className="text-[#004a8e]">{today.toUpperCase()}</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-sm italic">
            PCM KEMBARAN — Mencerahkan Semesta
          </p>
        </header>

        {/* --- SECTION 1: KAJIAN HARI INI --- */}
        <section className="mb-24">
          {kajianList.length === 0 ? (
            <div className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-200 text-center shadow-inner">
              <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                Tidak ditemukan jadwal kajian rutin untuk hari ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-16">
              {kajianList.map((kajian) => (
                <div key={kajian._id} className="flex flex-col lg:flex-row items-center gap-12 bg-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden relative">
                  
                  <div className={`absolute top-10 right-[-35px] rotate-45 px-12 py-1 text-[10px] font-black text-white uppercase tracking-widest shadow-md z-20 ${kajian.tipe === 'insidental' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {kajian.tipe === 'insidental' ? 'Tabligh Akbar' : 'Kajian Rutin'}
                  </div>

                  {/* INTERACTIVE FLYER AREA */}
                  <div className="w-full max-w-[450px] shrink-0">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="relative group cursor-zoom-in rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-100 aspect-square"
                      onClick={() => setSelectedImage({ url: kajian.flyerImageUrl || '', tema: kajian.tema })}
                    >
                      {kajian.flyerImageUrl ? (
                        <img src={kajian.flyerImageUrl} alt={kajian.tema} className="w-full h-full object-cover" />
                      ) : (
                        <div id={`flyer-${kajian._id}`} className="w-full h-full bg-white flex flex-col p-10 border-4 border-[#004a8e]">
                          {/* Konten Generator Otomatis */}
                          <div className="flex items-center gap-3 mb-6">
                            <img src="/logo-md.png" className="w-10 h-10 object-contain" alt="L" />
                            <h2 className="text-xs font-black text-[#004a8e]">PCM KEMBARAN</h2>
                          </div>
                          <div className="flex-1 flex flex-col justify-center border-l-4 border-yellow-400 pl-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{today}, {currentDate}</p>
                            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-6 uppercase">{kajian.tema}</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Ustadz:</p>
                            <p className="text-base font-black text-slate-800 mb-4">{kajian.ustadz}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Lokasi:</p>
                            <p className="text-base font-black text-slate-800">{kajian.namaMasjid}</p>
                          </div>
                        </div>
                      )}
                      {/* Overlay Hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                          <Maximize2 size={24} />
                        </div>
                      </div>
                    </motion.div>

                    <button 
                      onClick={() => handleDownload(kajian.flyerImageUrl, kajian.tema, `flyer-${kajian._id}`)}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-[#004a8e] hover:text-white text-[#004a8e] font-black py-4 rounded-2xl border-2 border-[#004a8e] transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                    >
                      <Download size={18} /> Simpan Flyer ke Galeri
                    </button>
                  </div>

                  {/* PANEL KONTROL */}
                  <div className="flex-1 space-y-8 w-full z-10">
                    <div className="space-y-3 text-center lg:text-left">
                      <div className="inline-block px-4 py-1 rounded-full bg-blue-50 text-[#004a8e] text-[10px] font-black uppercase tracking-widest">Detail Informasi</div>
                      <h2 className="text-3xl md:text-5xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">"{kajian.tema}"</h2>
                      {kajian.keterangan && <p className="text-slate-500 font-bold italic text-sm border-l-4 border-yellow-400 pl-4">{kajian.keterangan}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#004a8e] rounded-xl flex items-center justify-center text-white shadow-lg"><User size={20} /></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Ustadz</p><p className="font-black text-slate-800">{kajian.ustadz}</p></div>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-[#004a8e] shadow-lg"><MapPin size={20} /></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Lokasi</p><p className="font-black text-slate-800 truncate">{kajian.namaMasjid}</p></div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Link href={`/jadwal-kajian/${kajian.slug}`} className="flex-1 flex items-center justify-center gap-3 bg-[#004a8e] text-white px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl">
                        Lihat Deskripsi Lengkap
                      </Link>
                      <a href={`https://wa.me/?text=Hadirilah *KAJIAN ${today.toUpperCase()}* 📢%0A%0A*Tema:* ${kajian.tema}%0A*Bersama:* ${kajian.ustadz}%0A*Jam:* ${kajian.waktu}%0A*Lokasi:* ${kajian.namaMasjid}%0A%0AInfo Lengkap: ${window.location.origin}/jadwal-kajian/${kajian.slug}`} target="_blank" className="flex items-center justify-center gap-3 bg-green-500 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase hover:bg-green-600 transition-all shadow-xl">
                        <Share2 size={20} /> Share WA
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- SECTION 2: JADWAL KAJIAN MASA DEPAN --- */}
        <section className="pt-12 border-t border-slate-200">
           <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Jadwal Kajian Lainnya</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Mari Persiapkan Diri Menuju Taman Surga</p>
              </div>
              <Link href="/rubrik/jadwal-kajian" className="hidden sm:flex items-center gap-2 text-[#004a8e] font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
                Lihat Semua <ChevronRight size={16} />
              </Link>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingKajian.length > 0 ? upcomingKajian.map((item) => (
                <Link 
                  href={`/jadwal-kajian/${item.slug}`} 
                  key={item._id}
                  className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-6"
                >
                   <div className="w-20 h-20 shrink-0 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-[#004a8e] group-hover:bg-[#004a8e] group-hover:text-white transition-colors">
                      <Calendar size={24} />
                      <span className="text-[10px] font-black uppercase mt-1">Kajian</span>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-800 leading-tight group-hover:text-[#004a8e] transition-colors mb-1 truncate">{item.title}</h3>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <span className="flex items-center gap-1"><Clock size={12} /> Info Detail</span>
                         <span className="text-yellow-600 font-black tracking-normal ml-auto">LIHAT <ArrowRight size={10} className="inline" /></span>
                      </div>
                   </div>
                </Link>
              )) : (
                <p className="text-slate-400 text-sm font-bold italic">Belum ada jadwal kajian masa depan lainnya yang tersedia.</p>
              )}
           </div>
        </section>

        {/* LIGHTBOX ZOOM MODAL */}
        <AnimatePresence>
          {selectedImage && selectedImage.url && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X size={40} /></button>
              <motion.img 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                src={selectedImage.url} alt="Zoom" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="mt-8 flex gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownload(selectedImage.url, selectedImage.tema); }}
                  className="bg-white text-[#004a8e] px-10 py-4 rounded-full font-black flex items-center gap-3 hover:bg-yellow-400 transition-colors shadow-2xl"
                >
                  <Download size={24} /> SIMPAN KE GALERI HP
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20 text-center border-t border-slate-200 pt-10">
           <p className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
             <Info size={14} /> Otomatis diperbarui setiap hari sesuai radar PCM Kembaran
           </p>
        </footer>
      </div>
    </main>
  )
}