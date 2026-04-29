import { client } from "@/lib/sanity.client";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, User, ArrowLeft, CalendarDays, Info, CheckCircle2, ArrowRight, Users, Check, Phone, ImageIcon, Calendar, HeartHandshake, Wallet, Landmark } from "lucide-react";

// 1. FUNGSI AMBIL DATA
async function getSingleMasjid(slug: string) {
  const query = `*[_type == "masjid" && slug.current == $slug][0] {
    name,
    address,
    locationUrl,
    kapasitas,
    fasilitas,
    takmirContact,
    "imageUrl": image.asset->url,
    "jadwalKajian": *[_type == "jadwalKajian" && references(^._id)] | order(tipe desc, tanggal desc, hari asc) {
      _id,
      tipe,
      hari,
      tanggal,
      ustadz,
      waktu,
      tema,
      keterangan,
      "flyerImageUrl": flyerImage.asset->url
    }
  }`;
  return await client.fetch(query, { slug }, { cache: 'no-store' });
}

// 2. DINAMIS METADATA
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const masjid = await getSingleMasjid(slug);
  return {
    title: masjid?.name || 'Profil Masjid', 
    openGraph: {
      title: masjid?.name,
      images: [{ url: masjid?.imageUrl || "/logo-md.png" }],
    },
  };
}

export default async function MasjidDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const masjid = await getSingleMasjid(slug);

  if (!masjid) return <div className="py-20 text-center font-black">DATA TIDAK DITEMUKAN.</div>;

  return (
    <main className="min-h-screen bg-[#fcfdfe] font-sans text-slate-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[300px] md:h-[400px] bg-slate-900 flex items-end pb-12">
        <Image src={masjid.imageUrl || "/logo-md.png"} alt={masjid.name} fill className="object-cover opacity-30" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/10"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 text-center md:text-left">
          <Link href="/masjid" className="inline-flex items-center gap-2 text-white/50 font-black text-[9px] uppercase tracking-[0.3em] mb-4 hover:text-[#ffc107] transition-all">
            <ArrowLeft size={14} /> Kembali ke Daftar
          </Link>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-6 bg-gradient-to-r from-[#ffc107] via-[#fff1b3] to-[#ff9800] bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            {masjid.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
             <div className="flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-[10px] font-bold shadow-xl uppercase tracking-widest">
                <MapPin className="text-[#ffc107]" size={14} /> {masjid.address}
             </div>
             {masjid.kapasitas && (
               <div className="bg-white text-[#004a8e] px-5 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 shadow-xl uppercase tracking-widest">
                  <Users size={16} /> Kapasitas: {masjid.kapasitas}
               </div>
             )}
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT GRID */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        <div className="lg:col-span-8 space-y-16">
          
          {/* FASILITAS SECTION */}
          {masjid.fasilitas && (
            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
               <h3 className="text-[10px] font-black text-[#004a8e] mb-10 tracking-[0.4em] uppercase flex items-center gap-3 text-center md:text-left">
                  <div className="w-1.5 h-6 bg-[#ffc107] rounded-full"></div>
                  Fasilitas & Sarana Masjid
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {masjid.fasilitas.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-slate-500 font-bold text-[11px] uppercase tracking-tight">
                       <div className="w-6 h-6 bg-green-50 text-green-600 rounded-md flex items-center justify-center shrink-0 border border-green-100 shadow-sm"><Check size={14} /></div>
                       {f}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* JADWAL PENGAJIAN (New Oblong / Lonjong Layout) */}
          <div id="jadwal-kajian">
            <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tighter uppercase flex items-center gap-4">
               <CalendarDays size={32} className="text-[#004a8e]" /> Agenda Majelis Ilmu
            </h2>
            
            <div className="space-y-10">
              {masjid.jadwalKajian?.map((kj: any) => {
                const isIncidental = kj.tipe === 'insidental';
                const formattedDate = kj.tanggal 
                  ? new Date(kj.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : null;
                
                return (
                  <div key={kj._id} className="bg-white rounded-[2rem] border border-slate-100 flex flex-col md:flex-row p-4 md:p-6 gap-6 md:gap-12 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden">
                    
                    {/* SISI KIRI: IMAGE & USTADZ (Sesuai Referensi) */}
                    <div className="w-full md:w-[200px] flex flex-col gap-4 shrink-0">
                       <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden shadow-lg border-2 border-slate-50">
                          <Image 
                            src={kj.flyerImageUrl || "/logo-md.png"} 
                            alt={kj.tema} 
                            fill 
                            className={`object-cover transition-transform duration-1000 group-hover:scale-110 ${!kj.flyerImageUrl ? 'p-12 opacity-10 grayscale' : ''}`} 
                          />
                       </div>
                       {/* NAMA USTADZ DI BAWAH GAMBAR */}
                       <div className="text-center md:text-left px-2">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Narasumber</p>
                          <p className="text-sm font-black text-slate-800 leading-tight italic uppercase">{kj.ustadz || "Dlm Konfirmasi"}</p>
                       </div>
                    </div>

                    {/* SISI KANAN: HEADER, TEMA, & INFO SEJAJAR */}
                    <div className="flex-1 py-2 flex flex-col">
                       
                       {/* BARIS ATAS: LABEL, HARI, TANGGAL, WAKTU (SEJAJAR) */}
                       <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-6 border-b border-slate-50 pb-6">
                          <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                             <div className={`w-2 h-2 rounded-full ${isIncidental ? 'bg-red-500 animate-pulse' : 'bg-[#ffc107]'}`}></div>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${isIncidental ? 'text-red-600' : 'text-slate-400'}`}>
                                {isIncidental ? 'Khusus' : 'Rutin'}
                             </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-[#004a8e]" />
                             <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{kj.hari || 'Ahad'}</span>
                          </div>

                          <div className={`flex items-center gap-2 ${!formattedDate ? 'hidden' : ''}`}>
                             <CalendarDays size={14} className="text-yellow-600" />
                             <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{formattedDate}</span>
                          </div>

                          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg border border-green-100 ml-auto md:ml-0">
                             <Clock size={14} className="text-green-600" />
                             <span className="text-[11px] font-black text-green-700 uppercase tracking-widest">{kj.waktu}</span>
                          </div>
                       </div>
                       
                       {/* TEMA (MEMANJANG) */}
                       <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-8 leading-tight italic tracking-tighter group-hover:text-[#004a8e] transition-colors uppercase">
                         "{kj.tema || 'Kajian Umum'}"
                       </h3>

                       {/* DESKRIPSI (MENEMPATI RUANG YANG TERSISA) */}
                       {kj.keterangan ? (
                         <div className="mt-auto px-6 py-4 bg-[#f8fafc] rounded-2xl border border-slate-100 shadow-inner">
                            <p className="text-xs text-slate-400 leading-relaxed font-medium italic italic">
                               {kj.keterangan}
                            </p>
                         </div>
                       ) : (
                         <div className="mt-auto p-4 border border-dashed border-slate-100 rounded-2xl">
                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center italic">Mari Hadir & Syiarkan Majelis Ilmu</p>
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR (KONSOLIDASI INFAQ) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* NAVIGASI */}
          <div className="bg-[#004a8e] text-white p-10 rounded-2xl shadow-2xl relative overflow-hidden border-b-[6px] border-[#ffc107]">
            <h3 className="text-xl font-black mb-6 tracking-widest uppercase italic">Navigasi Lokasi</h3>
            {masjid.locationUrl && (
              <a href={masjid.locationUrl} target="_blank" className="block w-full bg-white text-[#004a8e] text-center py-5 rounded-xl font-black hover:bg-[#ffc107] transition-all uppercase text-[11px] tracking-[0.2em] shadow-lg active:scale-95">
                Buka Peta Petunjuk
              </a>
            )}
          </div>

          {/* UNIT INFAQ TERPADU (WhatsApp Takmir Included) */}
          <div className="bg-[#fffbeb] border-2 border-[#fef3c7] p-10 rounded-[2rem] shadow-sm text-center">
             <div className="w-16 h-16 bg-[#ffc107] text-[#854d0e] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"><HeartHandshake size={32} /></div>
             <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight uppercase">Infaq & Dukungan</h3>
             <p className="text-slate-600 text-[11px] leading-relaxed mb-10 font-medium italic">
                Dukung operasional dakwah dan pemeliharaan {masjid.name}. Untuk konfirmasi donasi & informasi lebih lanjut, silakan hubungi pengurus takmir melalui WhatsApp:
             </p>
             
             {masjid.takmirContact ? (
               <a 
                 href={`https://wa.me/${masjid.takmirContact.replace(/\D/g,'')}`} 
                 target="_blank" 
                 className="flex items-center justify-center gap-3 bg-[#25D366] text-white py-5 rounded-2xl font-black shadow-lg hover:brightness-110 transition-all text-[11px] uppercase tracking-widest w-full"
               >
                 <Phone size={18} /> WhatsApp Takmir
               </a>
             ) : (
               <Link href="/kontak" className="flex items-center justify-center gap-2 bg-[#004a8e] text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest w-full hover:bg-slate-900 shadow-xl transition-all">
                  Pusat Informasi <ArrowRight size={16} />
               </Link>
             )}
             <div className="mt-8 flex items-center justify-center gap-2 text-slate-300 font-bold text-[9px] uppercase tracking-widest opacity-60">
                <Wallet size={12} /> ZISWAF PCM Kembaran
             </div>
          </div>

        </div>

      </section>

      <footer className="py-24 text-center border-t border-slate-100 bg-white">
          <div className="flex items-center justify-center gap-4 text-slate-300 font-black text-[9px] uppercase tracking-[0.5em]">
             <CheckCircle2 size={14} className="text-green-500/40" /> Portal Terintegrasi PCM Kembaran
          </div>
      </footer>
    </main>
  );
}