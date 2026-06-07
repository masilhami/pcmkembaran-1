import { getNewsPosts } from "@/lib/sanity.query";
import Link from "next/link";
import Image from "next/image";

export default async function TopNews() {
  const allNews = await getNewsPosts() || [];
  
  const topBarNews = allNews.length > 8 
    ? allNews.slice(3, 8) 
    : allNews.slice(0, 5); 

  if (topBarNews.length === 0) return null;

  return (
    <div 
      className="hide-on-mobile" 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '15px', 
        padding: '20px 0',
        borderBottom: '1px solid #eee' 
      }}
    >
      {topBarNews.map((item: any) => (
        <Link 
          href={`/${item.category?.toLowerCase() || 'berita'}/${item.slug}`} 
          key={item._id} 
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}>
            <div style={{ 
              width: '100%', 
              aspectRatio: '16/9', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              marginBottom: '8px',
              backgroundColor: '#f0f0f0',
              position: 'relative',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <Image 
                src={item.image || "/logo-md.png"} 
                alt={item.title || "News Image"} 
                fill
                sizes="(max-width: 1200px) 20vw, 240px"
                style={{ objectFit: 'cover' }} 
              />
              <div style={{ 
                position: 'absolute', top: '5px', left: '5px', 
                backgroundColor: '#004a8e', color: '#fff', 
                fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                textTransform: 'uppercase', fontWeight: 'bold',
                zIndex: 1
              }}>
                {item.category || "Berita"}
              </div>
            </div>

            <h4 style={{ 
              fontSize: '12px', fontWeight: '800', color: '#004a8e',
              lineHeight: '1.4', margin: '0 0 5px 0', height: '34px',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {item.title}
            </h4>

            {/* PERBAIKAN: Hapus suppressHydrationWarning, 
                Gunakan fallback statis untuk menghindari mismatch */}
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#999' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span style={{ fontWeight: '700', color: '#ffc107' }}>
                {/* Pastikan ini selalu string atau number yang konsisten */}
                {typeof item.views === 'number' ? item.views : 0}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}