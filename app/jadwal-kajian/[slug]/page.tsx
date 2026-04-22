import { getSinglePost } from "@/lib/sanity.query"; 
import { Metadata } from "next";
import Link from "next/link";
import { User, MapPin, Clock, Info, ArrowLeft, CheckCircle2, CalendarDays, Tag, AlertCircle } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import InteractiveFlyer from "./InteractiveFlyer"; 

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getSinglePost(slug);
  if (!post) return { title: "Jadwal Tidak Ditemukan" };
  return {
    title: `Kajian: ${post.title}`, 
    description: post.keterangan || `Hadirilah kajian bersama ${post.ustadz}`,
    openGraph: { images: [post.image || "/logo-md.png"] }
  };
}

export default async function JadwalKajianDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getSinglePost(slug);

  if (!post) return (
    <div className="py-20 text-center space-y-4">
      <AlertCircle size={48} className="mx-auto text-slate-200" />
      <p className="font-black text-slate-400 uppercase tracking-widest">Data Tidak Terdeteksi.</p>
    </div>
  );
  
  const shareUrl = `https://pcmkembaran.com/jadwal-kajian/${slug}`;
  const isIncidental = post.tipe === 'insidental';

  // Logika Format Tanggal Indonesia
  const formattedDate = post.tanggal 
    ? new Date(post.tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  return (
    <main className="jadwal-detail-container">
      <div className="max-w-6xl mx-auto px-4 py-10">
        
        <Link href="/kajian-hari-ini" className="back-link group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          Kembali ke Radar Kajian
        </Link>

        <div className="jadwal-grid-layout">
          
          {/* SISI KIRI: FLYER INTERAKTIF */}
          <div className="flyer-section">
            <InteractiveFlyer imageUrl={post.image || "/logo-md.png"} tema={post.title} />
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
               <p className="text-[10px] font-black text-[#004a8e] uppercase tracking-[0.2em] mb-4 text-center">Sebarkan Informasi Ini</p>
               <ShareButtons shareUrl={shareUrl} postTitle={post.title} />
            </div>
          </div>

          {/* SISI KANAN: KONTEN DETAIL */}
          <div className="content-section">
            <div className="flex flex-wrap items-center gap-3 mb-6">
               <div className="category-tag">DOKUMEN JADWAL</div>
               {/* DINAMIS BADGE: Warna Merah untuk Insidental, Hijau untuk Rutin */}
               <div className={`status-tag ${isIncidental ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  <Tag size={12} />
                  {isIncidental ? 'Agenda Khusus / Insidental' : 'Agenda Rutin Pekanan'}
               </div>
            </div>

            <h1 className="jadwal-title">{post.title}</h1>
            
            <div className="info-card-grid">
              {/* 📅 DINAMIS: HARI & TANGGAL */}
              <div className="info-item">
                <div className="icon-box gold"><CalendarDays size={22} /></div>
                <div>
                  <label>{isIncidental ? 'TANGGAL PELAKSANAAN' : 'HARI PELAKSANAAN'}</label>
                  <p className="capitalize">
                    {isIncidental 
                      ? `${post.hari || 'Ahad'}, ${formattedDate || 'Tanggal segera hadir'}` 
                      : `Setiap Hari ${post.hari || 'Konfirmasi'}`}
                  </p>
                  {post.pekan && post.pekan.length > 0 && (
                    <span className="block text-[10px] font-black text-yellow-600 mt-1 uppercase tracking-tighter">
                      (Khusus Pekan ke-{post.pekan.join(', ')})
                    </span>
                  )}
                </div>
              </div>

              <div className="info-item">
                <div className="icon-box blue"><User size={22} /></div>
                <div>
                  <label>PEMATERI / USTADZ</label>
                  <p>{post.ustadz || "Dalam Konfirmasi"}</p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon-box blue-soft"><Clock size={22} /></div>
                <div>
                  <label>WAKTU / JAM</label>
                  <p>{post.waktu || "Ba'da Maghrib"}</p>
                </div>
              </div>

              <div className="info-item">
                <div className="icon-box green"><MapPin size={22} /></div>
                <div>
                  <label>LOKASI MASJID</label>
                  <p>{post.namaMasjid || "Area Kembaran"}</p>
                </div>
              </div>
            </div>

            <div className="description-box">
              <h3 className="desc-header">
                <div className="p-1.5 bg-[#004a8e] rounded-lg text-white"><Info size={16} /></div>
                Deskripsi Tambahan
              </h3>
              <p className="desc-text italic">
                {post.keterangan || "Mari ajak keluarga dan tetangga untuk menuntut ilmu bersama."}
              </p>
            </div>

            <div className="invitation-footer">
               <CheckCircle2 className="text-green-500" size={20} /> 
               <span className="font-bold">Terbuka Untuk Umum (Ikhwan & Akhwat)</span>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root { --p-blue: #004a8e; --p-gold: #ffc107; }
        .jadwal-detail-container { background: #fcfdfe; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; }
        .back-link { display: inline-flex; align-items: center; gap: 10px; color: #94a3b8; font-weight: 800; text-decoration: none; margin-bottom: 40px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; transition: 0.3s; }
        .back-link:hover { color: var(--p-blue); }
        
        .jadwal-grid-layout { display: grid; grid-template-columns: 460px 1fr; gap: 70px; align-items: start; }
        
        .category-tag { display: inline-block; padding: 6px 14px; background: #e0f2fe; color: var(--p-blue); border-radius: 8px; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
        .status-tag { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; }

        .jadwal-title { font-size: clamp(28px, 4vw, 44px); font-weight: 900; color: #0f172a; line-height: 1.1; margin: 20px 0 40px; text-transform: uppercase; letter-spacing: -1.5px; }
        
        .info-card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 40px; }
        .info-item { display: flex; align-items: center; gap: 16px; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 4px 10px rgba(0,0,0,0.02); transition: 0.3s; }
        .info-item:hover { border-color: var(--p-blue); transform: translateY(-2px); }

        .icon-box { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
        .icon-box.blue { background: var(--p-blue); }
        .icon-box.blue-soft { background: #3b82f6; }
        .icon-box.gold { background: var(--p-gold); color: #854d0e; }
        .icon-box.green { background: #10b981; }
        
        .info-item label { display: block; font-size: 9px; font-weight: 900; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px; }
        .info-item p { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; line-height: 1.3; }
        
        .description-box { background: #fff; padding: 30px; border-radius: 12px; border: 1px solid #f1f5f9; position: relative; overflow: hidden; }
        .description-box::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--p-blue); }
        .desc-header { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 15px; text-transform: uppercase; }
        .desc-text { color: #475569; line-height: 1.8; font-size: 15px; font-weight: 500; }
        
        .invitation-footer { margin-top: 35px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 800; color: #64748b; }

        @media (max-width: 992px) {
          .jadwal-grid-layout { grid-template-columns: 1fr; gap: 50px; }
          .info-card-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </main>
  );
}