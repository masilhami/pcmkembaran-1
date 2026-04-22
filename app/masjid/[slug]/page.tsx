import { client } from "@/lib/sanity.client";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, User, ArrowLeft, Calendar, Info, CheckCircle2, ArrowRight, Users, Check, Phone, ImageIcon, Tag } from "lucide-react";

// 1. FUNGSI AMBIL DATA (Query diperkuat dengan Tipe & Tanggal)
async function getSingleMasjid(slug: string) {
  const query = `*[_type == "masjid" && slug.current == $slug][0] {
    name,
    address,
    locationUrl,
    kapasitas,
    fasilitas,
    takmirContact,
    "imageUrl": image.asset->url,
    "jadwalKajian": *[_type == "jadwalKajian" && references(^._id)] | order(tipe asc, hari asc) {
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const masjid = await getSingleMasjid(slug);
  const ogImage = masjid?.imageUrl || "https://www.pcmkembaran.com/logo-md.png";

  return {
    title: `${masjid?.name || 'Profil Masjid'} | PCM Kembaran`,
    description: `Layanan dan jadwal kegiatan keumatan di ${masjid?.name}.`,
    openGraph: { images: [{ url: ogImage }] },
  };
}

export default async function MasjidDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const masjid = await getSingleMasjid(slug);

  if (!masjid) return <div className="py-20 text-center font-bold text-slate-400">DATA TIDAK DITEMUKAN.</div>;

  return (
    <main className="min-h-screen bg-[#fcfdfe] font-sans text-slate-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[350px] md:h-[500px] bg-slate-900 flex items-end pb-12">
        <Image src={masjid.imageUrl || "/logo-md.png"} alt={masjid.name} fill className="object-cover opacity-40" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/20"></div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
          <Link href="/masjid" className="inline-flex items-center gap-2 text-white/60 font-bold text-[10px] uppercase tracking-[0.2em] mb-4 hover:text-[#ffc107] transition-all">
            <ArrowLeft size={14} /> Kembali ke Daftar
          </Link>
          
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-6 bg-gradient-to-r from-[#ffc107] via-[#fff1b3] to-[#ff9800] bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            {masjid.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-[11px] font-bold shadow-xl">
                <MapPin className="text-[#ffc107]" size={14} /> {masjid.address}
             </div>
             {masjid.kapasitas && (
               <div className="bg-white text-[#004a8e] px-5 py-2 rounded-lg text-[11px] font-black flex items-center gap-2 shadow-xl uppercase tracking-widest">
                  <Users size={16} /> {masjid.kapasitas} Jemaah
               </div>
             )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        <div className="lg:col-span-2 space-y-20">
          
          {/* FASILITAS */}
          {masjid.fasilitas && (
            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000"><ImageIcon size={120} /></div>
               <h3 className="text-sm font-black text-[#004a8e] mb-10 tracking-[0.3em] uppercase flex items-center gap-3">
                  <div className="w-1 h-6 bg-[#ffc107] rounded-full"></div>
                  Sarana Peribadatan
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {masjid.fasilitas.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase tracking-tight">
                       <div className="w-6 h-6 bg-green-50 text-green-600 rounded-md flex items-center justify-center shrink-0 border border-green-100"><Check size={14} /></div>
                       {f}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* JADWAL PENGAJIAN (Logika Rutin vs Insidental) */}
          <div>
            <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
               <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4 tracking-tighter uppercase">
                 <Calendar size={32} className="text-[#004a8e]" /> Agenda Majelis Ilmu
               </h2>
               <div className="hidden md:block text-[9px] font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full uppercase tracking-[0.3em] border border-slate-100">
                  Data Terverifikasi
               </div>
            </div>
            
            <div className="space-y-10">
              {masjid.jadwalKajian && masjid.jadwalKajian.length > 0 ? (
                masjid.jadwalKajian.map((kj: any) => {
                  const isIncidental = kj.tipe === 'insidental';
                  
                  return (
                    <div key={kj._id} className="group bg-white rounded-xl border border-slate-200 hover:border-[#004a8e] hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row shadow-sm">
                      
                      {/* AREA THUMBNAIL */}
                      <div className="relative w-full md:w-[260px] aspect-square md:aspect-auto shrink-0 bg-slate-50 overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
                         <Image 
                           src={kj.flyerImageUrl || "/logo-md.png"} 
                           alt={kj.tema} 
                           fill 
                           className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${!kj.flyerImageUrl ? 'p-16 opacity-10 grayscale' : ''}`} 
                         />
                         {/* Badge Hari/Tanggal di atas Gambar */}
                         <div className="absolute top-4 left-4 flex flex-col gap-1 shadow-2xl">
                            <div className="bg-[#004a8e] text-white px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest">
                               {kj.hari}
                            </div>
                            {isIncidental && kj.tanggal && (
                               <div className="bg-[#ffc107] text-[#004a8e] px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                  {new Date(kj.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                               </div>
                            )}
                         </div>
                      </div>

                      {/* AREA KONTEN */}
                      <div className="p-8 md:p-10 flex-1 flex flex-col justify-center">
                         <div className="flex items-center gap-3 mb-4">
                            <div className={`h-1.5 w-1.5 rounded-full ${isIncidental ? 'bg-red-500 animate-pulse' : 'bg-[#ffc107]'}`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${isIncidental ? 'text-red-600' : 'text-slate-400'}`}>
                               {isIncidental ? 'Agenda Khusus / Insidental' : 'Agenda Rutin Pekanan'}
                            </span>
                         </div>
                         
                         <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-6 leading-tight group-hover:text-[#004a8e] transition-colors italic tracking-tight uppercase">
                           "{kj.tema || 'Kajian Umum'}"
                         </h3>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-50 pt-8">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-blue-50 text-[#004a8e] rounded-lg flex items-center justify-center shrink-0 shadow-sm"><User size={20} /></div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Ustadz / Narasumber</p>
                                  <p className="text-sm font-black text-slate-700 leading-none">{kj.ustadz}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-yellow-50 text-yellow-700 rounded-lg flex items-center justify-center shrink-0 shadow-sm"><Clock size={20} /></div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Waktu Pelaksanaan</p>
                                  <p className="text-sm font-black text-slate-700 leading-none">{kj.waktu}</p>
                               </div>
                            </div>
                         </div>

                         {kj.keterangan && (
                           <div className="mt-8 p-5 bg-slate-50 rounded-lg border-l-4 border-[#004a8e] relative">
                              <Info size={14} className="absolute top-4 right-4 opacity-10" />
                              <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                                 {kj.keterangan}
                              </p>
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-24 border-2 border-dashed border-slate-100 rounded-xl text-center bg-slate-50/30">
                  <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Data sedang dimutakhirkan oleh majelis tabligh</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-8">
          <div className="bg-[#004a8e] text-white p-10 rounded-xl shadow-2xl relative overflow-hidden border-b-[6px] border-[#ffc107]">
            <div className="absolute top-0 right-0 p-4 opacity-5"><MapPin size={100} /></div>
            <h3 className="text-xl font-black mb-6 tracking-widest uppercase italic">Akses Lokasi</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-10 font-medium">Temukan rute tercepat dan akurat untuk menghadiri majelis ilmu di {masjid.name}.</p>
            {masjid.locationUrl ? (
              <a href={masjid.locationUrl} target="_blank" className="block w-full bg-white text-[#004a8e] text-center py-4 rounded-lg font-black hover:bg-[#ffc107] transition-all uppercase text-[11px] tracking-[0.2em] shadow-lg active:scale-95">
                Buka Peta Navigasi
              </a>
            ) : (
              <p className="text-[10px] font-bold opacity-40 italic">Link peta belum tersedia.</p>
            )}
          </div>

          <div className="bg-white p-10 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 tracking-widest uppercase">Pelayanan Takmir</h3>
            <p className="text-slate-500 text-xs mb-10 leading-relaxed font-medium">Hubungi kami untuk konfirmasi kehadiran, infaq, atau informasi kegiatan sosial lainnya.</p>
            {masjid.takmirContact ? (
              <a href={`https://wa.me/${masjid.takmirContact.replace(/\D/g,'')}`} target="_blank" className="flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-lg font-black shadow-lg hover:brightness-110 transition-all text-[11px] uppercase tracking-widest">
                <Phone size={16} /> WhatsApp Takmir
              </a>
            ) : (
              <Link href="/kontak" className="flex items-center justify-center gap-2 text-[#004a8e] font-black text-[11px] uppercase tracking-widest border-2 border-[#004a8e] py-4 rounded-lg hover:bg-[#004a8e] hover:text-white transition-all">
                Sekretariat PCM <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

      </section>

      <footer className="py-20 text-center border-t border-slate-100 bg-white">
          <div className="flex items-center justify-center gap-4 text-slate-300 font-black text-[9px] uppercase tracking-[0.5em]">
             <CheckCircle2 size={14} className="text-green-500/40" /> Sistem Informasi Terintegrasi PCM Kembaran
          </div>
      </footer>
    </main>
  );
}