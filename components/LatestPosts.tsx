import { client } from "@/lib/sanity.client";
import { groq } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Eye, CalendarDays, ArrowRight } from "lucide-react";

/**
 * 1. FUNGSI FETCH DENGAN LOGIKA KALIBRASI WAKTU
 * Menambahkan 'coalesce' agar data yang tidak punya tanggal rilis (Jadwal Kajian)
 * tidak terbaca sebagai tahun 1970.
 */
async function getPaginatedPosts(page: number) {
  const limit = 5;
  const start = (page - 1) * limit;
  const end = start + limit;

  const query = groq`*[_type in ["post", "jadwalKajian"]] | order(coalesce(publishedAt, _createdAt) desc) [$start...$end] {
    _id,
    "title": coalesce(title, tema), 
    "slug": slug.current,
    "image": coalesce(flyerImage.asset->url, mainImage.asset->url),
    // FIX: Gunakan tanggal dibuat (_createdAt) jika tanggal publikasi kosong
    "publishedAt": coalesce(publishedAt, _createdAt),
    "category": coalesce(category, categories[0]->title, "Jadwal Kajian"),
    "views": coalesce(views, 0)
  }`;

  return client.fetch(query, { start, end: end + 1 }, { cache: 'no-store' });
}

/**
 * 2. KOMPONEN UTAMA
 */
export default async function LatestPosts({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> | any 
}) {
  // PROTOKOL ASYNC: Wajib di-await untuk Next.js 15+
  const sParams = await searchParams;
  const currentPage = Number(sParams?.page) || 1;
  
  const allFetchedPosts = await getPaginatedPosts(currentPage);
  
  // Pisahkan 5 data utama dan gunakan data ke-6 sebagai indikator halaman selanjutnya
  const posts = allFetchedPosts.slice(0, 5);
  const hasNextPage = allFetchedPosts.length > 5;

  return (
    <section className="latest-posts-wrapper">
      <div className="posts-stack-vertical">
        
        {posts.map((post: any) => {
          const categoryPath = post.category?.toLowerCase().replace(/\s+/g, '-') || "artikel";
          
          return (
            <Link 
              href={`/${categoryPath}/${post.slug}`} 
              key={post._id} 
              className="card-oblong-premium group"
            >
              {/* VISUAL KIRI (PROPORSI OBLONG) */}
              <div className="visual-frame">
                <Image 
                  src={post.image || "/logo-md.png"} 
                  alt={post.title} 
                  fill
                  sizes="240px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="cat-badge">{post.category}</div>
              </div>

              {/* KONTEN KANAN */}
              <div className="content-frame">
                <h3 className="post-title-text">{post.title}</h3>
                
                <div className="meta-info-row">
                  <div className="meta-unit">
                    <CalendarDays size={14} className="text-blue-500" />
                    <span suppressHydrationWarning>
                      {/* FIX DISPLAY: Tanggal sudah terkalibrasi dari query */}
                      {new Date(post.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="meta-divider"></div>
                  <div className="meta-unit gold">
                    <Eye size={14} />
                    <span>{post.views || 0} Kali Dibaca</span>
                  </div>
                </div>
              </div>
              
              <div className="entry-arrow">
                 <ArrowRight size={20} />
              </div>
            </Link>
          );
        })}

        {posts.length === 0 && (
           <div className="empty-state-notice">
              <p>Belum ada informasi tambahan pada halaman ini.</p>
              <Link href="/berita">Refresh Halaman</Link>
           </div>
        )}
      </div>

      {/* --- PAGINATION CONTROL (PILL STYLE) --- */}
      <div className="pagination-dashboard-center">
        <div className="pill-nav">
          {currentPage > 1 ? (
            <Link href={`?page=${currentPage - 1}`} className="btn-pill active">
              <ChevronLeft size={18} /> Prev
            </Link>
          ) : (
            <div className="btn-pill disabled"><ChevronLeft size={18} /> Prev</div>
          )}

          <div className="page-indicator-box">
             <span className="label">Halaman</span>
             <span className="current">{currentPage}</span>
          </div>

          {hasNextPage ? (
            <Link href={`?page=${currentPage + 1}`} className="btn-pill active">
              Next <ChevronRight size={18} />
            </Link>
          ) : (
            <div className="btn-pill disabled">Next <ChevronRight size={18} /></div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .latest-posts-wrapper { width: 100%; }
        
        .posts-stack-vertical { 
           display: flex; 
           flex-direction: column; 
           gap: 20px; 
           width: 100%;
        }
        
        .card-oblong-premium { 
          display: flex; 
          align-items: center; 
          gap: 25px; 
          background: #fff; 
          padding: 16px; 
          border-radius: 20px; 
          border: 1px solid #f1f5f9;
          text-decoration: none; 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .card-oblong-premium:hover { 
          transform: translateX(10px); 
          box-shadow: 0 20px 40px -12px rgba(0,74,142,0.12);
          border-color: #004a8e;
        }

        .visual-frame { 
          width: 180px; 
          height: 110px; 
          border-radius: 14px; 
          overflow: hidden; 
          flex-shrink: 0; 
          position: relative; 
          background: #f8fafc;
        }
        .cat-badge {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(0,74,142,0.9); color: #fff; font-size: 8px;
          font-weight: 900; text-align: center; padding: 4px; 
          text-transform: uppercase; letter-spacing: 1px;
        }

        .content-frame { flex: 1; min-width: 0; }
        .post-title-text { 
          font-size: 18px; 
          font-weight: 900; 
          color: #0f172a; 
          margin-bottom: 10px; 
          line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .meta-info-row { display: flex; align-items: center; gap: 15px; }
        .meta-unit { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #94a3b8; }
        .meta-unit.gold { color: #ffb300; }
        .meta-divider { width: 4px; height: 4px; background: #f1f5f9; border-radius: 50%; }

        .entry-arrow { color: #e2e8f0; margin-left: 10px; transition: 0.3s; flex-shrink: 0; }
        .card-oblong-premium:hover .entry-arrow { color: #004a8e; transform: translateX(5px); }

        /* PAGINATION DASHBOARD */
        .pagination-dashboard-center { margin-top: 50px; display: flex; justify-content: center; width: 100%; }
        .pill-nav { 
          display: flex; align-items: center; background: #fff; 
          padding: 8px; border-radius: 100px; border: 1px solid #f1f5f9;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .btn-pill { 
          display: flex; align-items: center; gap: 8px; padding: 10px 24px; 
          border-radius: 100px; font-size: 11px; font-weight: 900; 
          text-transform: uppercase; transition: 0.3s; text-decoration: none;
        }
        .btn-pill.active { background: #004a8e; color: #fff; }
        .btn-pill.active:hover { background: #0f172a; }
        .btn-pill.disabled { color: #cbd5e1; cursor: not-allowed; }

        .page-indicator-box { padding: 0 25px; text-align: center; border-left: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
        .page-indicator-box .label { display: block; font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
        .page-indicator-box .current { font-size: 16px; font-weight: 900; color: #004a8e; }

        .empty-state-notice { text-align: center; padding: 60px; color: #94a3b8; font-weight: 700; border: 2px dashed #f1f5f9; border-radius: 20px; }

        @media (max-width: 768px) {
          .card-oblong-premium { flex-direction: column; align-items: flex-start; padding: 20px; }
          .visual-frame { width: 100%; height: 160px; }
          .entry-arrow { display: none; }
          .post-title-text { font-size: 16px; }
        }
      `}} />
    </section>
  );
}