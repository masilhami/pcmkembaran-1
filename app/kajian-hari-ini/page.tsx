'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getKajianHariIni, getAllPosts } from '@/lib/sanity.query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, Calendar, Clock, MapPin, User, Share2, Info, 
  ChevronRight, ArrowRight, Maximize2, X, CalendarDays, 
  Landmark, CheckCircle2 
} from 'lucide-react'

export default function KajianHariIniPage() {
  const [kajianList, setKajianList] = useState<any[]>([])
  const [upcomingKajian, setUpcomingKajian] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<{ url: string, tema: string } | null>(null)

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

  const handleDownload = async (imageUrl: string, tema: string) => {
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
    <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#004a8e] border-t-[#ffc107] rounded-full animate-spin mx-auto"></div>
        <p className="font-black text-[#004a8e] animate-pulse tracking-widest uppercase text-[10px]">Sinkronisasi Radar Dakwah...</p>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#fcfdfe] font-sans text-slate-900 pb-24">
      
      <header className="bg-white border-b border-slate-100 py-16 md:py-24 mb-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-[#004a8e] mb-8">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
            Radar Kajian: {currentDate} <span className="opacity-20">|</span> Pekan ke-{currentWeekNum}
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">
            KAJIAN <span className="text-[#004a8e]">{today}</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">
            Portal Dakwah Digital PCM Kembaran
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        
        <section className="mb-32">
          {kajianList.length === 0 ? (
            <div className="bg-white p-20 rounded-[2rem] border-2 border-dashed border-slate-100 text-center shadow-inner">
              <Landmark className="w-16 h-16 text-slate-100 mx-auto mb-6" />
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">
                Tidak ada jadwal rutin terdeteksi untuk hari ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              {kajianList.map((kajian) => {
                const isIncidental = kajian.tipe === 'insidental';
                return (
                  <div key={kajian._id} className="group bg-white rounded-[2.5rem] border border-slate-100 flex flex-col lg:flex-row p-6 md:p-8 gap-8 md:gap-12 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                    
                    <div className="w-full lg:w-[220px] flex flex-col gap-5 shrink-0">
                       <motion.div 
                         whileHover={{ scale: 1.03 }}
                         className="relative aspect-square w-full rounded-[1.8rem] overflow-hidden shadow-xl border-4 border-white cursor-zoom-in bg-slate-50"
                         onClick={() => setSelectedImage({ url: kajian.flyerImageUrl || '', tema: kajian.tema })}
                       >
                          <img 
                            src={kajian.flyerImageUrl || "/logo-md.png"} 
                            alt={kajian.tema} 
                            className={`w-full h-full object-cover ${!kajian.flyerImageUrl ? 'p-12 opacity-10 grayscale' : ''}`} 
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Maximize2 size={24} className="text-white" />
                          </div>
                       </motion.div>
                       <div className="text-center lg:text-left px-2">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Narasumber</p>
                          <p className="text-sm font-black text-slate-800 leading-tight italic uppercase">{kajian.ustadz}</p>
                       </div>
                       <button onClick={() => handleDownload(kajian.flyerImageUrl, kajian.tema)} className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#004a8e] hover:text-white text-slate-400 py-3 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">
                         <Download size={14} /> Download Flyer
                       </button>
                    </div>

                    <div className="flex-1 py-2 flex flex-col">
                       <div className="flex flex-wrap items-center gap-6 mb-8 border-b border-slate-50 pb-6">
                          <div className="flex items-center gap-2 pr-6 border-r border-slate-100">
                             <div className={`w-2 h-2 rounded-full ${isIncidental ? 'bg-red-500 animate-pulse' : 'bg-[#ffc107]'}`}></div>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${isIncidental ? 'text-red-600' : 'text-slate-400'}`}>
                                {isIncidental ? 'Agenda Khusus' : 'Agenda Rutin'}
                             </span>
                          </div>
                          <div className="flex items-center gap-3">
                             <Calendar size={16} className="text-[#004a8e]" />
                             <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{today}, {currentDate}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-green-50 px-4 py-1.5 rounded-lg border border-green-100 ml-auto md:ml-0">
                             <Clock size={16} className="text-green-600" />
                             <span className="text-[11px] font-black text-green-700 uppercase tracking-widest">{kajian.waktu}</span>
                          </div>
                       </div>
                       
                       <h3 className="text-3xl md:text-5xl font-black text-slate-800 mb-10 leading-tight italic tracking-tighter group-hover:text-[#004a8e] transition-colors uppercase">
                         "{kajian.tema}"
                       </h3>

                       <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 bg-yellow-50 text-yellow-700 rounded-xl flex items-center justify-center shrink-0 border border-yellow-100 shadow-sm"><MapPin size={20} /></div>
                             <div>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Lokasi Pelaksanaan</p>
                                <p className="text-sm font-black text-slate-700">{kajian.namaMasjid}</p>
                             </div>
                          </div>
                          <div className="flex gap-3">
                             <Link href={`/jadwal-kajian/${kajian.slug}`} className="flex-1 flex items-center justify-center gap-2 bg-[#004a8e] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl">
                                Detail <ArrowRight size={14} />
                             </Link>
                             <a href={`https://wa.me/?text=Mari hadir di *KAJIAN ${today.toUpperCase()}*%0A%0A*Tema:* ${kajian.tema}%0A*Lokasi:* ${kajian.namaMasjid}%0A%0AInfo Selengkapnya: https://pcmkembaran.com/jadwal-kajian/${kajian.slug}`} target="_blank" className="w-14 flex items-center justify-center bg-[#25D366] text-white rounded-xl shadow-lg hover:brightness-110 transition-all">
                                <Share2 size={20} />
                             </a>
                          </div>
                       </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="pt-16 border-t border-slate-100">
           <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Persiapan Majelis Berikutnya</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Mari Persiapkan diri menuju taman surga</p>
              </div>
              <Link href="/rubrik/jadwal-kajian" className="flex items-center gap-2 text-[#004a8e] font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                Lihat Semua <ChevronRight size={14} />
              </Link>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingKajian.map((item) => (
                <Link href={`/jadwal-kajian/${item.slug}`} key={item._id} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-6">
                   <div className="w-16 h-16 shrink-0 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-[#004a8e] group-hover:bg-[#004a8e] group-hover:text-white transition-all">
                      <CalendarDays size={24} />
                   </div>
                   <div className="min-w-0">
                      {/* FIX: BARIS 205 - STRING SUDAH TERTUTUP SEMPURNA */}
                      <h3 className="font-black text-slate-800 group-hover:text-[#004a8e] transition-colors truncate uppercase text-sm tracking-tight">{item.title}</h3>
                      <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                         <span className="flex items-center gap-1"><Info size={10} /> Lihat Info</span>
                      </div>
                   </div>
                </Link>
              ))}
           </div>
        </section>

        <AnimatePresence>
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
              onClick={() => setSelectedImage(null)}
            >
              <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X size={40} /></button>
              <motion.img 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                src={selectedImage.url} alt="Zoom" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border-4 border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
              <button onClick={(e) => { e.stopPropagation(); handleDownload(selectedImage.url, selectedImage.tema); }} className="mt-8 bg-white text-[#004a8e] px-12 py-4 rounded-full font-black flex items-center gap-3 hover:bg-[#ffc107] transition-all shadow-2xl uppercase text-xs tracking-widest">
                <Download size={20} /> Simpan ke Galeri HP
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-32 text-center border-t border-slate-100 pt-12">
           <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3">
             <CheckCircle2 size={14} className="text-green-500/40" /> Sistem Radar Otomatis PCM Kembaran
           </p>
        </footer>
      </div>
    </main>
  )
}