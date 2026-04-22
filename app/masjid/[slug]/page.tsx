import { client } from "@/lib/sanity.client";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, User, ArrowLeft, Calendar, Info, CheckCircle2, ArrowRight, Users, Check, Phone } from "lucide-react";

async function getSingleMasjid(slug: string) {
  const query = `*[_type == "masjid" && slug.current == $slug][0] {
    name,
    address,
    locationUrl,
    kapasitas,
    fasilitas,
    takmirContact,
    "imageUrl": image.asset->url,
    "jadwalKajian": *[_type == "jadwalKajian" && references(^._id)] | order(hari asc) {
      _id,
      hari,
      ustadz,
      waktu,
      tema,
      keterangan
    }
  }`;
  return await client.fetch(query, { slug }, { cache: 'no-store' });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const masjid = await getSingleMasjid(slug);
  return {
    title: `${masjid?.name || 'Profil Masjid'} | PCM Kembaran`,
    description: `Informasi pelayanan dan jadwal pengajian di ${masjid?.name}.`,
  };
}

export default async function MasjidDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const masjid = await getSingleMasjid(slug);

  if (!masjid) return <div className="py-20 text-center font-bold text-slate-400">DATA MASJID TIDAK DITEMUKAN.</div>;

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* 1. HERO SECTION (High Visibility with Gradient Text) */}
      <section className="relative h-[350px] md:h-[500px] bg-slate-900 flex items-end pb-12">
        <Image 
          src={masjid.imageUrl || "/logo-md.png"} 
          alt={masjid.name} 
          fill 
          className="object-cover opacity-50" 
          priority 
        />
        {/* Overlay gradasi gelap agar teks kuning lebih menyala */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-black/40"></div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
          <Link href="/masjid" className="inline-flex items-center gap-2 text-white/70 font-bold text-xs uppercase tracking-widest mb-4 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Kembali ke Daftar
          </Link>
          
          {/* JUDUL DENGAN KUNING GRADASI */}
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-6 bg-gradient-to-r from-[#ffc107] via-[#ffdb4d] to-[#ffb300] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            {masjid.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm font-bold shadow-lg">
                <MapPin className="text-[#ffc107]" size={16} /> {masjid.address}
             </div>
             {masjid.kapasitas && (
               <div className="bg-white text-[#004a8e] px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 shadow-lg">
                  <Users size={16} /> {masjid.kapasitas} Jemaah
               </div>
             )}
          </div>
        </div>
      </section>

      {/* 2. CONTENT LAYOUT */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* SISI KIRI: JADWAL & FASILITAS */}
        <div className="lg:col-span-2 space-y-16">
          
          {/* FASILITAS (Radius Sharp 12px) */}
          {masjid.fasilitas && (
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 shadow-sm">
               <h3 className="text-lg font-black text-[#004a8e] mb-8 tracking-widest uppercase flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#ffc107] rounded-full"></div>
                  Fasilitas Pelayanan
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                  {masjid.fasilitas.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
                       <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                       {f}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* JADWAL (Radius Sharp 12px) */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight">
              <Calendar size={24} className="text-[#004a8e]" /> JADWAL PENGAJIAN
            </h2>
            
            <div className="space-y-4">
              {masjid.jadwalKajian && masjid.jadwalKajian.length > 0 ? (
                masjid.jadwalKajian.map((kj: any) => (
                  <div key={kj._id} className="group bg-white p-6 md:p-8 rounded-xl border border-slate-200 hover:border-[#004a8e] hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                       <div className="bg-[#004a8e] text-white px-6 py-3 rounded-lg text-center min-w-[120px] group-hover:bg-slate-900 transition-colors shadow-sm">
                          <span className="block text-[9px] font-black opacity-60 uppercase tracking-widest">HARI</span>
                          <span className="text-lg font-black uppercase">{kj.hari}</span>
                       </div>
                       
                       <div className="flex-1">
                          <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-[#004a8e] transition-colors leading-tight italic">
                            "{kj.tema || 'Kajian Umum'}"
                          </h3>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                             <span className="flex items-center gap-2"><User size={14} className="text-[#004a8e]" /> {kj.ustadz}</span>
                             <span className="flex items-center gap-2"><Clock size={14} className="text-[#ffc107]" /> {kj.waktu}</span>
                          </div>
                          {kj.keterangan && (
                            <p className="mt-4 text-slate-500 text-sm leading-relaxed border-l-2 border-slate-100 pl-4 italic">
                              {kj.keterangan}
                            </p>
                          )}
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-xl text-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Informasi Jadwal Belum Tersedia.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SISI KANAN: SIDEBAR */}
        <div className="space-y-6">
          {/* LOKASI */}
          <div className="bg-[#004a8e] text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
            <h3 className="text-lg font-black mb-4 tracking-widest uppercase">Navigasi</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-8 font-medium">
              Dapatkan petunjuk arah presisi menuju {masjid.name} melalui Google Maps.
            </p>
            {masjid.locationUrl ? (
              <a 
                href={masjid.locationUrl} 
                target="_blank" 
                className="block w-full bg-[#ffc107] text-[#004a8e] text-center py-4 rounded-lg font-black hover:bg-white transition-all uppercase text-xs tracking-widest shadow-md"
              >
                Buka Peta Lokasi
              </a>
            ) : (
              <p className="text-[10px] font-bold opacity-50 italic">Koordinat GPS belum diatur.</p>
            )}
          </div>

          {/* KONTAK */}
          <div className="bg-white p-8 rounded-xl border-2 border-slate-50 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-4 tracking-widest uppercase">Hubungi Takmir</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Hubungi pengurus untuk informasi pelayanan jamaah atau bantuan sosial.
            </p>
            {masjid.takmirContact ? (
              <a 
                href={`https://wa.me/${masjid.takmirContact.replace(/\D/g,'')}`} 
                target="_blank" 
                className="flex items-center justify-center gap-3 bg-green-600 text-white py-4 rounded-lg font-black shadow-md hover:bg-green-700 transition-colors text-sm uppercase tracking-wider"
              >
                <Phone size={18} /> WhatsApp Takmir
              </a>
            ) : (
              <Link 
                href="/kontak" 
                className="flex items-center justify-center gap-2 text-[#004a8e] font-black text-xs uppercase tracking-widest border-2 border-[#004a8e] py-4 rounded-lg hover:bg-[#004a8e] hover:text-white transition-all"
              >
                Hubungi Pusat <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

      </section>

      {/* FOOTER KHIDMAT */}
      <footer className="py-12 text-center border-t border-slate-100">
          <div className="flex items-center justify-center gap-3 text-slate-300 font-black text-[9px] uppercase tracking-[0.5em]">
             <CheckCircle2 size={14} className="text-green-500/50" /> Portal Pelayanan PCM Kembaran
          </div>
      </footer>
    </main>
  );
}