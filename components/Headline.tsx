import { getNewsPosts } from "@/lib/sanity.query";
import Link from "next/link";
import Image from "next/image";

/**
 * Headline Component - PCM Kembaran (Blue Identity Edition)
 * Kalibrasi: Gradasi Biru PCM, Mobile friendly, teks di dasar (bottom).
 */
export default async function Headline() {
  const allNews = await getNewsPosts();
  const mainNews = allNews?.[0];
  const relatedNews = allNews?.slice(1, 3);

  if (!mainNews) return null;

  return (
    <section className="headline-wrapper">
      
      {/* 1. BACKGROUND IMAGE */}
      <div className="headline-bg">
        <Image 
          src={mainNews.image || "/logo-md.png"} 
          alt={mainNews.title} 
          fill
          priority 
          sizes="(max-width: 1200px) 100vw, 1200px"
          style={{ objectFit: 'cover' }}
        />
        {/* 🛡️ GRADASI BIRU PCM PROTECTOR */}
        <div className="blue-shroud"></div>
      </div>
        
      {/* 2. CONTENT AREA */}
      <div className="headline-content">
          
        {/* KONTEN BERITA UTAMA */}
        <div className="main-content-block">
          <span className="category-badge-emerald">
            {mainNews.category || "Berita"}
          </span>

          <Link 
            href={`/${mainNews.category?.toLowerCase() || 'berita'}/${mainNews.slug}`} 
            className="main-title-link"
          >
            <h2 className="headline-elegant-title">
              {mainNews.title}
            </h2>
          </Link>

          <div className="meta-info">
            <span className="meta-author">Media PCM Kembaran</span>
            <span className="meta-dot">•</span>
            <span suppressHydrationWarning className="meta-date">
              {new Date(mainNews.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 3. RELATED NEWS (COMPACT LIST) */}
        {relatedNews?.length > 0 && (
          <div className="related-footer-grid">
            {relatedNews.map((related: any) => (
              <Link 
                key={related._id} 
                href={`/${related.category?.toLowerCase() || 'berita'}/${related.slug}`} 
                className="related-mini-card"
              >
                <div className="mini-thumb">
                  <Image 
                    src={related.image || "/logo-md.png"} 
                    alt={related.title} 
                    fill
                    sizes="120px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p className="mini-title-text">{related.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .headline-wrapper {
          position: relative;
          width: 100%;
          height: 500px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          background: #004a8e; /* Fallback Biru PCM */
        }

        .headline-bg { position: absolute; inset: 0; z-index: 0; }
        
        /* 🛡️ BLUE SHROUD: Menggunakan warna #004a8e (Biru PCM) */
        .blue-shroud { 
          position: absolute; inset: 0; 
          background: linear-gradient(to top, 
            rgba(0, 74, 142, 1) 0%, 
            rgba(0, 74, 142, 0.8) 35%, 
            transparent 75%
          );
        }

        .headline-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end; /* Paksa teks di dasar */
          padding: 40px 45px;
          color: #fff;
        }

        .category-badge-emerald {
          background: #10b981;
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          margin-bottom: 12px;
        }

        .main-title-link { text-decoration: none; color: inherit; }
        .headline-elegant-title {
          font-size: clamp(22px, 3.5vw, 36px);
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 10px;
          letter-spacing: -0.8px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
          max-width: 85%;
        }
        .headline-elegant-title:hover { color: #ffc107; }

        .meta-info {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 25px;
          opacity: 0.9;
        }
        .meta-author { color: #fbbf24; }

        .related-footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.2);
        }

        .related-mini-card {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #fff;
        }

        .mini-thumb {
          position: relative;
          width: 80px;
          height: 50px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .mini-title-text {
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* 📱 MOBILE OPTIMIZATION (BLUE EDITION) */
        @media (max-width: 768px) {
          .headline-wrapper { 
            height: 420px !important; 
            border-radius: 20px;
          }
          
          .blue-shroud {
             /* Gradien Biru PCM di mobile */
             background: linear-gradient(to top, 
               rgba(0, 74, 142, 1) 0%, 
               rgba(0, 74, 142, 0.9) 45%, 
               transparent 85%
             );
          }

          .headline-content { 
            padding: 20px 16px; 
            justify-content: flex-end; 
          }

          .headline-elegant-title { 
            font-size: 19px; 
            margin-bottom: 6px;
            max-width: 100%;
          }

          .meta-info { margin-bottom: 12px; font-size: 11px; }

          .related-footer-grid { 
            grid-template-columns: 1fr; 
            gap: 8px; 
            padding-top: 10px;
          }

          .mini-thumb { width: 55px; height: 35px; }
          .mini-title-text { font-size: 12px; -webkit-line-clamp: 1; }
        }
      `}} />
    </section>
  );
}