import { client } from "@/lib/sanity.client";
import Link from "next/link";
import { Metadata } from "next";
import { MapPin, Clock, User, ArrowRight, Bell, Home, Users, CheckCircle2, Navigation, Info } from "lucide-react";

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
    // MENGGUNAKAN cache: 'no-store' agar perubahan di Sanity langsung muncul (Anti-Delay)
    return await client.fetch(query, {}, { cache: 'no-store' });
  } catch (error) {
    console.error("Gagal sinkronisasi data masjid:", error);
    return [];
  }
}

export const metadata: Metadata = {
  title: "Pusat Masjid & Dakwah | PCM Kembaran",
  description: "Daftar masjid dan pusat keumatan di bawah naungan Pimpinan Cabang Muhammadiyah Kembaran.",
};

export default async function MasjidPage() {
  const dataMasjid = await getMasidData();

  return (
    <main id="pcm-masjid-modern-v3">
      <div className="pcm-container">
        
        {/* HERO HEADER - KHIDMAT & WIBAWA */}
        <header className="pcm-hero-header">
          <div className="pcm-badge-top">Sektor Keumatan</div>
          <h1>MASJID & PUSAT PERADABAN</h1>
          <p>Membina pusat peribadatan dan persemaian ilmu di wilayah Kembaran.</p>
          <div className="pcm-glow-divider"></div>
        </header>

        {/* BANNER INFORMASI KAJIAN */}
        <div className="pcm-banner-update">
           <div className="info-content">
              <div className="info-icon-wrapper">
                 <Bell className="text-yellow-400" size={28} />
                 <div className="info-ping"></div>
              </div>
              <div className="info-text">
                 <h4>Jadwal Kajian Hari Ini</h4>
                 <p>Dapatkan flyer otomatis untuk keperluan syiar dan dakwah digital hari ini.</p>
              </div>
           </div>
           <Link href="/kajian-hari-ini" className="pcm-btn-update">
              Lihat Jadwal Terkini <ArrowRight size={18} />
           </Link>
        </div>

        {/* GRID MASJID */}
        {dataMasjid.length > 0 ? (
          <div className="pcm-masjid-grid">
            {dataMasjid.map((masjid: any) => {
              // Cek ketersediaan slug untuk memastikan link aktif
              const hasSlug = !!masjid.slug;
              
              return (
                <div key={masjid._id} className={`pcm-masjid-card group ${!hasSlug ? 'pending-data' : ''}`}>
                  
                  {/* FULL CARD LINK */}
                  <Link 
                    href={hasSlug ? `/masjid/${masjid.slug}` : '#'} 
                    className="pcm-card-main-link"
                  >
                    <div className="pcm-card-visual">
                      <img 
                        src={masjid.imageUrl || "/logo-md.png"} 
                        alt={masjid.name} 
                        className="pcm-main-img"
                        loading="lazy" 
                      />
                      <div className="pcm-visual-overlay">
                        {hasSlug ? (
                          <span className="view-profile-label">Lihat Profil Masjid <ArrowRight size={14} /></span>
                        ) : (
                          <span className="pending-badge">Slug Belum Diatur</span>
                        )}
                      </div>
                      {masjid.kapasitas && (
                        <div className="pcm-capacity-tag">
                          <Users size={12} /> {masjid.kapasitas} Jemaah
                        </div>
                      )}
                    </div>

                    <div className="pcm-card-body">
                      <h3 className="pcm-masjid-title">{masjid.name}</h3>
                      <p className="pcm-masjid-location">
                        <MapPin size={14} className="text-[#004a8e]" /> {masjid.address}
                      </p>

                      <div className="pcm-schedule-preview">
                        <h4 className="schedule-label">Jadwal Pengajian:</h4>
                        {masjid.jadwalKajian && masjid.jadwalKajian.length > 0 ? (
                          <div className="mini-list">
                            {masjid.jadwalKajian.slice(0, 2).map((kj: any) => (
                              <div key={kj._id} className="mini-item">
                                <span className="day">{kj.hari}</span>
                                <span className="topic truncate">{kj.tema || 'Kajian Umum'}</span>
                              </div>
                            ))}
                            {masjid.jadwalKajian.length > 2 && (
                              <span className="more-tag">+{masjid.jadwalKajian.length - 2} Jadwal Lainnya</span>
                            )}
                          </div>
                        ) : (
                          <p className="empty-schedule text-xs italic font-bold text-slate-300">Jadwal pengajian belum tersedia</p>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* NAVIGASI LANGSUNG KE MAPS */}
                  <div className="pcm-card-footer">
                    {masjid.locationUrl && (
                      <a href={masjid.locationUrl} target="_blank" className="pcm-btn-maps-mini">
                        <Navigation size={14} /> Petunjuk Lokasi
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pcm-empty-radar">
            <Home size={60} className="mx-auto mb-6 opacity-10" />
            <p className="font-bold text-slate-400">Menyinkronkan Data Masjid & Mushola...</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root { --p-blue: #004a8e; --p-gold: #ffc107; --p-slate: #1e293b; --p-soft: #f1f5f9; }
        #pcm-masjid-modern-v3 { background: #fcfdfe; font-family: 'Plus Jakarta Sans', sans-serif; padding: 60px 0 120px; color: var(--p-slate); }
        .pcm-container { max-width: 1240px; margin: 0 auto; padding: 0 24px; }

        /* HERO */
        .pcm-hero-header { text-align: center; margin-bottom: 60px; }
        .pcm-badge-top { display: inline-block; padding: 6px 16px; background: #f0f7ff; color: var(--p-blue); border-radius: 100px; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
        .pcm-hero-header h1 { font-size: clamp(32px, 5vw, 46px); font-weight: 900; color: #0f172a; tracking: -1.5px; margin-bottom: 15px; }
        .pcm-glow-divider { width: 60px; height: 5px; background: var(--p-gold); margin: 30px auto; border-radius: 10px; }

        /* UPDATE BANNER */
        .pcm-banner-update { background: var(--p-blue); border-radius: 30px; padding: 30px 40px; margin-bottom: 80px; display: flex; justify-content: space-between; align-items: center; gap: 20px; color: #fff; box-shadow: 0 25px 50px -12px rgba(0,74,142,0.2); }
        .info-content { display: flex; align-items: center; gap: 25px; }
        .info-icon-wrapper { position: relative; }
        .info-ping { position: absolute; inset: -5px; border: 2px solid var(--p-gold); border-radius: 50%; animation: pcm-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes pcm-ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .info-text h4 { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
        .info-text p { font-size: 14px; opacity: 0.7; }
        .pcm-btn-update { background: #fff; color: var(--p-blue); padding: 14px 28px; border-radius: 18px; font-weight: 800; font-size: 14px; text-decoration: none; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
        .pcm-btn-update:hover { background: var(--p-gold); transform: translateX(5px); }

        /* GRID & CARDS */
        .pcm-masjid-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 40px; }
        .pcm-masjid-card { background: #fff; border-radius: 35px; overflow: hidden; border: 1px solid #f1f5f9; display: flex; flex-direction: column; transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; }
        .pcm-masjid-card:hover { transform: translateY(-20px); box-shadow: 0 45px 90px -20px rgba(0,0,0,0.12); border-color: var(--p-blue); }
        .pcm-card-main-link { text-decoration: none; color: inherit; display: block; flex-grow: 1; }

        .pcm-card-visual { position: relative; width: 100%; padding-bottom: 65%; overflow: hidden; background: #f8fafc; }
        .pcm-main-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: 1s ease; }
        .pcm-masjid-card:hover .pcm-main-img { transform: scale(1.15); }
        .pcm-visual-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,74,142,0.8), transparent); opacity: 0; transition: 0.4s; display: flex; align-items: flex-end; padding: 25px; }
        .pcm-masjid-card:hover .pcm-visual-overlay { opacity: 1; }
        .view-profile-label { color: #fff; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 8px; }
        .pending-badge { background: #ef4444; color: #fff; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 5px; }
        .pcm-capacity-tag { position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); color: #fff; padding: 6px 14px; border-radius: 12px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 6px; }

        .pcm-card-body { padding: 35px; }
        .pcm-masjid-title { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 10px; line-height: 1.2; }
        .pcm-masjid-location { font-size: 13px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 30px; }

        .pcm-schedule-preview { background: #f8fafc; border-radius: 24px; padding: 20px; border: 1px solid #f1f5f9; }
        .schedule-label { font-size: 10px; font-weight: 900; color: var(--p-blue); text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; }
        .mini-list { display: flex; flex-direction: column; gap: 10px; }
        .mini-item { display: flex; align-items: center; gap: 12px; font-size: 13px; }
        .mini-item .day { font-weight: 900; color: var(--p-blue); background: #fff; padding: 3px 10px; border-radius: 8px; font-size: 11px; border: 1px solid #e2e8f0; min-width: 60px; text-align: center; }
        .mini-item .topic { font-weight: 700; color: #334155; flex: 1; }
        .more-tag { font-size: 11px; font-weight: 800; color: var(--p-gold); margin-top: 10px; display: block; font-style: italic; }

        .pcm-card-footer { padding: 0 35px 35px; }
        .pcm-btn-maps-mini { display: inline-flex; align-items: center; gap: 8px; color: var(--p-blue); font-weight: 800; font-size: 12px; text-transform: uppercase; text-decoration: none; padding: 10px 18px; border-radius: 12px; background: #f0f7ff; transition: 0.3s; }
        .pcm-btn-maps-mini:hover { background: var(--p-blue); color: #fff; }

        @media (max-width: 768px) { .pcm-banner-update { flex-direction: column; text-align: center; padding: 30px; } .pcm-masjid-grid { grid-template-columns: 1fr; } }
      `}} />
    </main>
  );
}