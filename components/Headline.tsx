import { getNewsPosts } from "@/lib/sanity.query";
import Link from "next/link";
import Image from "next/image";

/**
 * Headline Component - PCM Kembaran Version
 * Fokus: Typography Impact & LCP Optimization
 */
export default async function Headline() {
  const allNews = await getNewsPosts();
  const mainNews = allNews?.[0];
  const relatedNews = allNews?.slice(1, 3);

  if (!mainNews) return null;

  return (
    <section className="headline-wrapper" style={{ 
      position: 'relative', 
      width: '100%', 
      borderRadius: '16px', 
      overflow: 'hidden', 
      boxShadow: '0 20px 40px rgba(0,74,142,0.15)',
      backgroundColor: '#004a8e',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* 1. BACKGROUND IMAGE (LCP) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image 
          src={mainNews.image || "/logo-md.png"} 
          alt={mainNews.title} 
          fill
          priority 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          style={{ objectFit: 'cover' }}
        />
      </div>
        
      {/* 2. OVERLAY CONTENT */}
      <div className="headline-overlay" style={{ 
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'linear-gradient(to top, rgba(0,74,142,1) 0%, rgba(0,74,142,0.75) 50%, transparent 100%)',
        color: '#fff'
      }}>
          
        {/* KONTEN UTAMA */}
        <div style={{ marginBottom: '25px' }}>
          <span style={{
            background: '#ffc107',
            color: '#004a8e',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '15px',
            display: 'inline-block'
          }}>
            Berita Utama
          </span>

          <Link 
            href={`/${mainNews.category?.toLowerCase() || 'berita'}/${mainNews.slug}`} 
            style={{ textDecoration: 'none', color: '#fff' }}
          >
            {/* Judul Utama yang sudah dibesarkan */}
            <h2 className="headline-title" style={{ 
              fontWeight: '900', 
              margin: '10px 0 15px 0', 
              lineHeight: '1.05', 
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              letterSpacing: '-1.5px'
            }}>
              {mainNews.title}
            </h2>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
            <span style={{ color: '#ffc107' }}>PCM KEMBARAN</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span suppressHydrationWarning>
              {new Date(mainNews.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* AREA BERITA TERKAIT */}
        {relatedNews?.length > 0 && (
          <div className="headline-related" style={{ 
            marginTop: '25px', 
            paddingTop: '25px', 
            borderTop: '1px solid rgba(255,255,255,0.2)', 
            display: 'grid', 
            gap: '40px' 
          }}>
            {relatedNews.map((related: any) => (
              <Link 
                key={related._id} 
                href={`/${related.category?.toLowerCase() || 'berita'}/${related.slug}`} 
                style={{ textDecoration: 'none', color: '#fff' }}
              >
                <div className="related-hover">
                  <span style={{ 
                    color: '#ffc107', 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    display: 'block', 
                    marginBottom: '4px', 
                    textTransform: 'uppercase'
                  }}>
                    {related.category}
                  </span>
                  <p style={{ 
                    fontSize: '15px', 
                    margin: 0, 
                    fontWeight: '700', 
                    lineHeight: '1.4', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}>
                    {related.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .headline-wrapper { height: 520px; }
        .headline-overlay { padding: 80px 40px 40px 40px; }
        .headline-title { fontSize: 48px; transition: color 0.3s; }
        .headline-title:hover { color: #ffc107 !important; }
        .headline-related { grid-template-columns: 1fr 1fr; }
        .related-hover { transition: 0.3s; }
        .related-hover:hover { transform: translateX(5px); color: #ffc107; }

        @media (max-width: 768px) {
          .headline-wrapper { height: auto !important; min-height: 500px; }
          .headline-overlay { padding: 60px 20px 30px 20px !important; }
          .headline-title { fontSize: 32px !important; }
          .headline-related { 
            grid-template-columns: 1fr !important; 
            gap: 20px !important;
            padding-top: 20px !important;
          }
          .related-hover p { fontSize: 14px !important; }
        }
      `}} />
    </section>
  );
}