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
  return await client.fetch(query, { slug });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const masjid = await getSingleMasjid(slug);
  return {
    title: `${masjid?.name || 'Profil Masjid'} | PCM Kembaran`,
    description: `Detail fasilitas dan jadwal pengajian di ${masjid?.name}. Wilayah PCM Kembaran.`,
  };
}

export default async function MasjidDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const masjid = await getSingleMasjid(slug);

  if (!masjid) return <div className="py-20 text-center font-black">MASJID TIDAK TERDETEKSI.</div>;

  return (
    <main className="min-h-screen bg-white font-sans">
      {/* HERO SECTION */}
      <section className="relative h-[400px] md:h-[550px] bg-slate-900 overflow-hidden">
        <Image src={masjid.imageUrl || "/logo-md.png"} alt={masjid.name} fill className="object-cover opacity-50" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto">
          <Link href="/masjid" className="inline-flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest mb-6 hover:text-[#004a8e] transition-colors">
            <ArrowLeft size={16} /> Kembali ke Daftar
          </Link>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">{masjid.name}</h1>
          <div className="flex flex-wrap items-center gap-6 mt-6">
             <p className="text-slate-600 flex items-center gap-2 font-bold text-sm md:text-base">
               <MapPin className="text-[#004a8e]" size={20} /> {masjid.address}
             </p>
             {masjid.kapasitas && (
               <div className="bg-[#004a8e] text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg">
                  <Users size={16} /> Kapasitas: {masjid.kapasitas} Jemaah
               </div>
             )}
          </div>
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="max-w-7xl mx-auto px-6 md:px-16 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        {/* KIRI: JADWAL & FASILITAS */}
        <div className="lg:col-span-2 space-y-16">
          
          {/* FASILITAS */}
          {masjid.fasilitas && (
            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
               <h3 className="text-xl font-black text-[#004a8e] mb-8 tracking-tight uppercase flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-green-500" /> Fasilitas Utama
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {masjid.fasilitas.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                       <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0"><Check size={14} /></div>
                       {f}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* JADWAL */}
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tighter">
              <Calendar size={32} className="text-yellow-500" /> JADWAL PENGAJIAN
            </h2>
            
            <div className="grid gap-8">
              {masjid.jadwalKajian && masjid.jadwalKajian.length > 0 ? (
                masjid.jadwalKajian.map((kj: any) => (
                  <div key={kj._id} className="group relative bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 hover:border-[#004a8e] transition-all duration-500 shadow-sm hover:shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                       <div className="bg-slate-900 text-white px-8 py-5 rounded-3xl text-center min-w-[140px] shadow-xl group-hover:bg-[#004a8e] transition-colors">
                          <span className="block text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">HARI</span>
                          <span className="text-2xl font-black">{kj.hari}</span>
                       </div>
                       <div className="flex-1">
                          <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-[#004a8e] transition-colors tracking-tight italic">"{kj.tema || 'Kajian Umum'}"</h3>
                          <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
                             <span className="flex items-center gap-2"><User size={18} className="text-[#004a8e]" /> {kj.ustadz}</span>
                             <span className="flex items-center gap-2"><Clock size={18} className="text-yellow-600" /> {kj.waktu}</span>
                          </div>
                          {kj.keterangan && <p className="mt-6 text-slate-500 italic leading-relaxed border-l-4 border-slate-100 pl-6">{kj.keterangan}</p>}
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 border-4 border-dashed border-slate-100 rounded-[3rem] text-center">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada jadwal yang dipublikasikan.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KANAN: SIDEBAR */}
        <div className="space-y-8">
          {/* MAPS CARD */}
          <div className="bg-[#004a8e] text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
            <h3 className="text-2xl font-black mb-6 tracking-tighter uppercase">Navigasi</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-10 font-medium">
              Gunakan Google Maps untuk mendapatkan rute terbaik menuju {masjid.name}.
            </p>
            {masjid.locationUrl ? (
              <a href={masjid.locationUrl} target="_blank" className="block w-full bg-white text-[#004a8e] text-center py-5 rounded-2xl font-black hover:bg-yellow-400 transition-all shadow-xl active:scale-95 uppercase text-xs tracking-widest">
                Buka Peta Lokasi
              </a>
            ) : (
              <p className="text-xs font-black opacity-40 italic">Link peta belum tersedia.</p>
            )}
          </div>

          {/* KONTAK CARD */}
          <div className="bg-yellow-50 p-10 rounded-[3.5rem] border border-yellow-100">
            <h3 className="text-xl font-black text-yellow-800 mb-6 tracking-tight uppercase">Hubungi Takmir</h3>
            <p className="text-yellow-700/70 text-sm mb-8 leading-relaxed font-bold">Butuh informasi lebih lanjut atau ingin berdonasi untuk masjid ini?</p>
            {masjid.takmirContact ? (
              <a href={`https://wa.me/${masjid.takmirContact.replace(/\D/g,'')}`} target="_blank" className="flex items-center justify-center gap-3 bg-green-500 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-green-600 transition-colors">
                <Phone size={18} /> Chat WhatsApp
              </a>
            ) : (
              <Link href="/kontak" className="inline-flex items-center gap-2 text-yellow-800 font-black text-sm uppercase tracking-widest hover:gap-4 transition-all">
                Hubungi Kami <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>

      </section>

      <footer className="py-16 text-center border-t border-slate-50 bg-slate-50/30">
          <div className="flex items-center justify-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">
             <CheckCircle2 size={16} className="text-green-500" /> Autentikasi PCM Kembaran
          </div>
      </footer>
    </main>
  );
}