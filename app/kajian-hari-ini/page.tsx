'use client'

import { useState, useEffect } from 'react'
import { getKajianHariIni } from '@/lib/sanity.query'
import { toPng } from 'html-to-image'
import { Download, Calendar, Clock, MapPin, User, Share2, Info } from 'lucide-react'

export default function KajianHariIniPage() {
  const [kajianList, setKajianList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 1. DATA WAKTU REAL-TIME
  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const now = new Date()
  const today = days[now.getDay()]
  
  // Format Tanggal Indonesia
  const currentDate = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Fungsi Kalkulator Pekan (Pekan 1 - 5)
  const getWeekOfMonth = (date: Date) => {
    const day = date.getDate();
    return Math.ceil(day / 7).toString();
  };

  const currentWeekNum = getWeekOfMonth(now);

  useEffect(() => {
    async function fetchData() {
      try {
        const todayDay = days[now.getDay()];
        const todayDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const currentWeek = getWeekOfMonth(now);

        // MEMANGGIL DENGAN 3 PARAMETER (Hari, Tanggal, Pekan)
        const data = await getKajianHariIni(todayDay, todayDate, currentWeek);
        setKajianList(data);
      } catch (error) {
        console.error("Gagal sinkronisasi radar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 2. FUNGSI DOWNLOAD FLYER HD
  const downloadFlyer = async (id: string, tema: string) => {
    const node = document.getElementById(id);
    if (!node) return;

    try {
      const dataUrl = await toPng(node, { 
        quality: 1.0, 
        pixelRatio: 3, 
        cacheBust: true 
      });
      const link = document.createElement('a');
      link.download = `FLYER-${tema.toUpperCase().replace(/\s+/g, '-')}-${currentDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Malfungsi generate gambar:', err);
    }
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

        {kajianList.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-200 text-center shadow-inner">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
              Tidak ditemukan jadwal kajian untuk {today} Pekan ke-{currentWeekNum}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-16">
            {kajianList.map((kajian) => (
              <div key={kajian._id} className="flex flex-col lg:flex-row items-center gap-12 bg-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden relative">
                
                {/* Badge Tipe Kajian */}
                <div className={`absolute top-10 right-[-35px] rotate-45 px-12 py-1 text-[10px] font-black text-white uppercase tracking-widest shadow-md z-20 ${kajian.tipe === 'insidental' ? 'bg-red-600' : 'bg-green-600'}`}>
                  {kajian.tipe === 'insidental' ? 'Tabligh Akbar' : 'Kajian Rutin'}
                </div>

                {/* 🎨 FLYER GENERATOR AREA (1:1 Ratio) */}
                <div 
                  id={`flyer-${kajian._id}`}
                  className="w-[450px] h-[450px] shrink-0 bg-white relative overflow-hidden flex flex-col p-10 border-[12px] border-[#004a8e]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {/* Ornamen Geometris */}
                  <div className="absolute top-[-30px] left-[-30px] w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-[-20px] right-[-20px] w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>

                  {/* Logo & Identity */}
                  <div className="flex items-center gap-3 mb-8 relative z-10">
                    <img src="/logo-md.png" className="w-14 h-14 object-contain" alt="Logo" />
                    <div>
                      <h2 className="text-lg font-black text-[#004a8e] leading-none tracking-tighter">PCM KEMBARAN</h2>
                      <p className="text-[9px] font-bold text-yellow-600 tracking-widest uppercase">Majelis Tabligh & Dakwah Khusus</p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="relative z-10 flex-1 flex flex-col justify-center border-l-4 border-yellow-400 pl-8">
                    <div className="mb-3 flex items-center gap-2">
                       <span className="px-2.5 py-1 bg-[#004a8e] text-white text-[10px] font-black rounded-lg uppercase tracking-wider">{today}</span>
                       <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{currentDate}</span>
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-800 leading-[1] mb-8 uppercase italic tracking-tighter">
                      {kajian.tema || "Kajian Islam Rutin"}
                    </h2>
                    
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#004a8e] rounded-2xl flex items-center justify-center text-white shadow-lg">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Bersama Ustadz:</p>
                          <p className="text-lg font-black text-slate-800 tracking-tight leading-tight">{kajian.ustadz}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center text-[#004a8e] shadow-lg">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Waktu Pelaksanaan:</p>
                          <p className="text-lg font-black text-slate-800 tracking-tight leading-tight">{kajian.waktu}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Banner */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-[#004a8e] text-white flex items-center gap-5">
                     <div className="shrink-0 p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
                        <MapPin size={32} className="text-yellow-400" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Lokasi Kajian:</p>
                        <p className="text-xl font-black truncate uppercase tracking-tighter leading-none">{kajian.namaMasjid}</p>
                     </div>
                  </div>
                </div>

                {/* 📄 PANEL KONTROL */}
                <div className="flex-1 space-y-8 w-full z-10">
                  <div className="space-y-3">
                    <div className="inline-block px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      Detail Informasi
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight">"{kajian.tema}"</h2>
                    {kajian.keterangan && <p className="text-slate-500 font-bold italic text-sm border-l-2 border-slate-200 pl-4">{kajian.keterangan}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 group hover:bg-[#004a8e] transition-colors duration-300">
                       <User className="text-[#004a8e] group-hover:text-white mb-3" size={32} />
                       <p className="text-[10px] font-black text-blue-400 group-hover:text-blue-200 uppercase mb-1">Pemateri</p>
                       <p className="font-black text-slate-800 group-hover:text-white leading-tight">{kajian.ustadz}</p>
                    </div>
                    <div className="p-6 bg-yellow-50 rounded-[2rem] border border-yellow-100 group hover:bg-yellow-400 transition-colors duration-300">
                       <MapPin className="text-yellow-600 group-hover:text-[#004a8e] mb-3" size={32} />
                       <p className="text-[10px] font-black text-yellow-600 group-hover:text-yellow-800 uppercase mb-1">Lokasi</p>
                       <p className="font-black text-slate-800 group-hover:text-[#004a8e] leading-tight">{kajian.namaMasjid}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      onClick={() => downloadFlyer(`flyer-${kajian._id}`, kajian.tema)}
                      className="flex-1 flex items-center justify-center gap-3 bg-[#004a8e] text-white px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95"
                    >
                      <Download size={20} /> Download Flyer HD
                    </button>
                    <a 
                      href={`https://wa.me/?text=Hadirilah *KAJIAN ${today.toUpperCase()}* 📢%0A%0A*Tema:* ${kajian.tema}%0A*Bersama:* ${kajian.ustadz}%0A*Jam:* ${kajian.waktu}%0A*Lokasi:* ${kajian.namaMasjid}%0A%0ADownload flyer resmi di: ${window.location.href}`}
                      target="_blank"
                      className="flex items-center justify-center gap-3 bg-green-500 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl"
                    >
                      <Share2 size={20} /> Share Ke Group
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* INFO FOOTER */}
        <footer className="mt-20 text-center border-t border-slate-200 pt-10">
           <p className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
             <Info size={14} /> Otomatis diperbarui setiap hari sesuai jadwal PCM Kembaran
           </p>
        </footer>

      </div>
    </main>
  )
}