import { client } from "@/lib/sanity.client";
import Link from "next/link";
import { Metadata } from "next";
import { MapPin, Clock, User, ArrowRight, Bell, Home, Users, CheckCircle2 } from "lucide-react";

async function getMasidData() {
  const query = `*[_type == "masjid"] | order(order asc) {
    _id,
    name,
    "slug": slug.current,
    address,
    locationUrl,
    kapasitas,
    fasilitas,
    "imageUrl": image.asset->url,
    "jadwalKajian": *[_type == "jadwalKajian" && references(^._id)] | order(hari asc) {
      _id,
      hari,
      ustadz,
      waktu,
      tema
    }
  }`;
  try {
    return await client.fetch(query, {}, { next: { revalidate: 3600 } });
  } catch (error) {
    console.error("Gagal sinkronisasi data masjid:", error);
    return [];
  }
}

export const metadata: Metadata = {
  title: "Pusat Masjid & Dakwah | PCM Kembaran",
  description: "Daftar pusat peradaban dan jadwal pengajian di wilayah Pimpinan Cabang Muhammadiyah Kembaran.",
};

export default async function MasjidPage() {
  const dataMasjid = await getMasidData();

  return (
    <main id="pcm-masjid-modern">
      <div className="pcm-container">
        
        {/* HERO HEADER */}
        <header className="pcm-hero-header">
          <div className="pcm-badge-header">Sektor Keumatan</div>
          <h1>PUSAT MASJID & DAKWAH</h1>
          <p>Mengelola pusat peradaban dan persemaian ilmu di wilayah Kembaran.</p>
          <div className="pcm-glow-divider"></div>
        </header>

        {/* BANNER STRATEGIS */}
        <div className="pcm-banner-kajian animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="banner-content">
              <div className="banner-icon">
                 <Bell className="text-yellow-400 animate-pulse" size={28} />
              </div>
              <div className="banner-text">
                 <h4>Radar Kajian Hari Ini</h4>
                 <p>Lihat dan download flyer jadwal kajian otomatis yang sedang berlangsung hari ini.</p>
              </div>
           </div>
           <Link href="/kajian-hari-ini" className="pcm-btn-glass">
              Buka Radar <ArrowRight size={18} />
           </Link>
        </div>

        {/* GRID MASJID */}
        {dataMasjid.length > 0 ? (
          <div className="pcm-masjid-grid">
            {dataMasjid.map((masjid: any) => (
              <Link 
                href={masjid.slug ? `/masjid/${masjid.slug}` : '#'} 
                key={masjid._id} 
                className="pcm-masjid-card group"
              >
                {/* FRAME GAMBAR */}
                <div className="pcm-img-frame">
                  <img 
                    src={masjid.imageUrl || "/logo-md.png"} 
                    alt={masjid.name} 
                    className="pcm-masjid-img"
                    loading="lazy" 
                  />
                  <div className="pcm-img-overlay">
                    <span className="pcm-btn-view">Lihat Profil <ArrowRight size={14} /></span>
                  </div>
                  {masjid.kapasitas && (
                    <div className="pcm-cap-badge">
                      <Users size={12} /> {masjid.kapasitas} Jemaah
                    </div>
                  )}
                </div>

                <div className="pcm-card-body">
                  <h3 className="pcm-masjid-name group-hover:text-[#004a8e] transition-colors">{masjid.name}</h3>
                  <p className="pcm-masjid-addr">
                    <MapPin size={14} className="inline mr-1 text-[#004a8e]" /> {masjid.address}
                  </p>

                  <div className="pcm-schedule-box">
                    <h4 className="box-label">Jadwal Pengajian:</h4>
                    {masjid.jadwalKajian && masjid.jadwalKajian.length > 0 ? (
                      <div className="mini-schedule-list">
                        {masjid.jadwalKajian.slice(0, 2).map((kj: any) => (
                          <div key={kj._id} className="mini-item">
                            <span className="day">{kj.hari}</span>
                            <span className="tema truncate">{kj.tema || 'Kajian Umum'}</span>
                          </div>
                        ))}
                        {masjid.jadwalKajian.length > 2 && (
                          <p className="more-count">+{masjid.jadwalKajian.length - 2} jadwal lainnya</p>
                        )}
                      </div>
                    ) : (
                      <p className="no-kj">Belum ada jadwal terinput.</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pcm-empty-radar">
            <Home size={48} className="mx-auto mb-4 opacity-20" />
            <p>Target radar masjid sedang disinkronkan oleh tim IT...</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root { --p-blue: #004a8e; --p-gold: #ffc107; --p-bg: #fcfdfe; }
        #pcm-masjid-modern { background: var(--p-bg); font-family: 'Plus Jakarta Sans', sans-serif; padding: 60px 0 120px; }
        .pcm-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        .pcm-hero-header { text-align: center; margin-bottom: 60px; }
        .pcm-badge-header { display: inline-block; padding: 6px 16px; background: #e0f2fe; color: var(--p-blue); border-radius: 100px; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; }
        .pcm-hero-header h1 { font-size: clamp(30px, 5vw, 44px); font-weight: 900; color: #0f172a; tracking: -1.5px; margin-bottom: 15px; }
        .pcm-glow-divider { width: 60px; height: 5px; background: var(--p-gold); margin: 30px auto; border-radius: 10px; box-shadow: 0 0 20px rgba(255,193,7,0.4); }

        .pcm-banner-kajian { background: var(--p-blue); border-radius: 30px; padding: 25px 40px; margin-bottom: 70px; display: flex; justify-content: space-between; align-items: center; gap: 20px; color: #fff; box-shadow: 0 25px 50px -12px rgba(0,74,142,0.25); }
        .banner-content { display: flex; align-items: center; gap: 20px; }
        .banner-text h4 { font-size: 18px; font-weight: 800; margin-bottom: 2px; }
        .banner-text p { font-size: 13px; color: #bfdbfe; font-weight: 500; }
        .pcm-btn-glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: 800; font-size: 13px; text-decoration: none; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
        .pcm-btn-glass:hover { background: #fff; color: var(--p-blue); }

        .pcm-masjid-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 35px; }
        .pcm-masjid-card { background: #fff; border-radius: 30px; overflow: hidden; border: 1px solid #f1f5f9; text-decoration: none; color: inherit; transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); display: flex; flex-direction: column; }
        .pcm-masjid-card:hover { transform: translateY(-15px); box-shadow: 0 40px 80px -15px rgba(0,0,0,0.1); border-color: var(--p-blue); }

        .pcm-img-frame { position: relative; width: 100%; padding-bottom: 65%; overflow: hidden; background: #f8fafc; }
        .pcm-masjid-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: 0.8s ease; }
        .pcm-masjid-card:hover .pcm-masjid-img { transform: scale(1.1); }
        .pcm-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,74,142,0.6), transparent); opacity: 0; transition: 0.4s; display: flex; align-items: flex-end; padding: 20px; }
        .pcm-masjid-card:hover .pcm-img-overlay { opacity: 1; }
        .pcm-btn-view { color: #fff; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }
        .pcm-cap-badge { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); color: #fff; padding: 5px 12px; border-radius: 10px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 5px; }

        .pcm-card-body { padding: 30px; flex-grow: 1; }
        .pcm-masjid-name { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 8px; line-height: 1.2; }
        .pcm-masjid-addr { font-size: 12px; color: #64748b; font-weight: 600; line-height: 1.5; margin-bottom: 25px; height: 3em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

        .pcm-schedule-box { background: #f8fafc; border-radius: 20px; padding: 18px; border: 1px solid #f1f5f9; }
        .box-label { font-size: 10px; font-weight: 900; color: var(--p-blue); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }
        .mini-schedule-list { display: flex; flex-direction: column; gap: 8px; }
        .mini-item { display: flex; align-items: center; gap: 10px; font-size: 12px; }
        .mini-item .day { font-weight: 900; color: var(--p-blue); background: #fff; padding: 2px 8px; border-radius: 6px; font-size: 10px; border: 1px solid #e2e8f0; }
        .mini-item .tema { font-weight: 700; color: #334155; flex: 1; }
        .more-count { font-size: 10px; font-weight: 800; color: #94a3b8; margin-top: 5px; font-style: italic; }
        .no-kj { font-size: 11px; font-weight: 600; color: #cbd5e1; }

        @media (max-width: 768px) { .pcm-banner-kajian { flex-direction: column; text-align: center; padding: 30px; } .pcm-masjid-grid { grid-template-columns: 1fr; } }
      `}} />
    </main>
  );
}