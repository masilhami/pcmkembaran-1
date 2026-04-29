import { getSinglePost, getRelatedPosts } from "@/lib/sanity.query"; 
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import nextDynamic from 'next/dynamic'; 
import ViewCounter from "@/components/ViewCounter"; 
import ShareButtons from "@/components/ShareButtons";
import PortableTextContent from "@/components/PortableTextContent";

const CommentSection = nextDynamic(() => import("@/components/CommentSection"));

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ category: string, slug: string }> 
}): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getSinglePost(slug);
  if (!post) return { title: "Berita Tidak Ditemukan" };
  const url = `https://pcmkembaran.com/${category}/${slug}`;
  return {
    title: post.title,
    description: post.excerpt || "Baca informasi terbaru dari PCM Kembaran",
    openGraph: { title: post.title, description: post.excerpt, url: url, images: [{ url: post.image || "/opengraph-image.jpg" }], type: "article" },
  };
}

export default async function PostDetail({ 
  params 
}: { 
  params: Promise<{ category: string, slug: string }> 
}) {
  const { category, slug } = await params;
  const [post, relatedPosts] = await Promise.all([ 
    getSinglePost(slug), 
    getRelatedPosts(category, slug) 
  ]);

  if (!post) return <div className="py-20 text-center font-bold">Artikel tidak ditemukan.</div>;
  const shareUrl = `https://pcmkembaran.com/${category}/${slug}`;

  return (
    <main className="post-detail-main">
      <ViewCounter slug={slug} />
      
      {/* 1. BREADCRUMB - RESPONSIVE */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link> <span className="sep">/</span>
        <Link href={`/${category}`} className="breadcrumb-cat">{category}</Link>
        <span className="sep">/</span>
        <span className="breadcrumb-title">{post.title}</span>
      </nav>

      <div className="main-grid-layout">
        {/* ================= SISI KIRI: ARTIKEL ================= */}
        <article className="article-container">
          <header className="article-header">
            <h1 className="main-title">{post.title}</h1>
            <div className="meta-bar">
              <div className="author-box">
                <Image src="/logo-md.png" width={45} height={45} className="author-img" alt="Redaksi" />
                <div className="author-info">
                  <span className="author-name">Redaksi PCM Kembaran</span>
                  <div className="meta-sub">
                    <span suppressHydrationWarning>
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Terbit Baru Saja'}
                    </span>
                    <span className="dot-sep">•</span>
                    <span className="views-count">{post.views || 0} Kali Dibaca</span>
                  </div>
                </div>
              </div>
              <div className="share-box">
                <ShareButtons shareUrl={shareUrl} postTitle={post.title} />
              </div>
            </div>
          </header>

          {/* FEATURED IMAGE - ANTI MELEDAK */}
          {post.image && (
            <div className="featured-img-container">
              <Image src={post.image} alt={post.title} fill priority sizes="(max-width: 1200px) 100vw, 800px" style={{ objectFit: 'cover' }} />
            </div>
          )}

          <div className="article-content">
            {post.body && <PortableTextContent value={post.body} />}
          </div>

          {/* DOWNLOAD SECTION */}
          {category === 'unduhan' && post.downloadLink && (
            <section className="download-box-tactical">
              <div className="download-info">
                <p className="dl-label">SEKTOR DOKUMENTASI</p>
                <h3 className="dl-title">Unduh Berkas Tersedia</h3>
                {post.fileSize && <span className="dl-size">Info: {post.fileSize}</span>}
              </div>
              <a href={post.downloadLink} target="_blank" rel="noopener noreferrer" className="dl-button-modern">
                <span>📥 DOWNLOAD DOKUMENTASI</span>
              </a>
            </section>
          )}

          <div className="comment-section-wrapper">
            <CommentSection slug={slug} />
          </div>

          {/* RELATED POSTS - GRID SYSTEM */}
          {relatedPosts?.length > 0 && (
            <section className="related-section">
              <h3 className="section-title">Baca Juga</h3>
              <div className="related-grid">
                {relatedPosts.slice(0, 3).map((rel: any) => (
                  <Link href={`/${category}/${rel.slug}`} key={rel._id} className="related-card group">
                    <div className="related-thumb">
                      <Image src={rel.image || "/logo-md.png"} alt={rel.title} fill sizes="300px" className="group-hover:scale-105 transition-transform duration-500" style={{ objectFit: 'cover' }} />
                    </div>
                    <h4 className="related-post-title">{rel.title}</h4>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* ================= SISI KANAN: SIDEBAR ================= */}
        <aside className="sidebar">
          <div className="sticky-sidebar">
            {/* SOSIAL MEDIA */}
            <div className="sidebar-widget">
              <h3 className="widget-title gold">IKUTI KAMI</h3>
              <div className="social-flex">
                <a href="https://facebook.com/pcmkembaran" target="_blank" className="social-btn fb"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                <a href="https://instagram.com/pcmkembaran" target="_blank" className="social-btn ig"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
                <a href="https://www.youtube.com/@pcmkembaran" target="_blank" className="social-btn yt"><svg width="20" height="20" fill="#ffffff" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
                <a href="https://www.tiktok.com/@pcmkembaran" target="_blank" className="social-btn tt"><svg width="18" height="18" fill="#ffffff" viewBox="0 0 448 512"><path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z"/></svg></a>
                <a href="https://wa.me/6285741025663" target="_blank" className="social-btn wa"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>
              </div>
            </div>

            {/* TERPOPULER - EFEK GLOW RESTORED */}
            <div className="sidebar-widget">
              <h3 className="widget-title blue">TERPOPULER</h3>
              <div className="popular-wrapper">
                {relatedPosts?.slice(0, 5).map((pop: any, idx: number) => (
                  <Link href={`/${category}/${pop.slug}`} key={pop._id} className="pop-card group">
                    <div className="pop-number">0{idx + 1}</div>
                    <div className="pop-info">
                      <p className="pop-title-text">{pop.title}</p>
                      <span className="pop-date">
                        {pop.publishedAt ? new Date(pop.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru Saja'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root { --abah-blue: #004a8e; --abah-gold: #ffc107; --border: #e2e8f0; --text-dark: #0f172a; --text-slate: #64748b; }
        
        .post-detail-main { max-width: 1200px; margin: 40px auto; padding: 0 20px; font-family: 'Plus Jakarta Sans', sans-serif; }
        
        /* BREADCRUMB - RESPONSIVE FIX */
        .breadcrumb { font-size: 13px; color: var(--text-slate); margin-bottom: 30px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .breadcrumb-cat { color: var(--abah-blue); font-weight: 800; text-transform: uppercase; text-decoration: none; }
        .breadcrumb-title { color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }

        /* GRID SYSTEM */
        .main-grid-layout { display: grid; grid-template-columns: 1fr 340px; gap: 50px; align-items: flex-start; }

        /* CONTENT */
        .main-title { font-size: clamp(26px, 4vw, 44px); font-weight: 900; line-height: 1.2; color: var(--text-dark); margin-bottom: 25px; letter-spacing: -0.02em; }
        .meta-bar { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 20px 0; margin-bottom: 35px; flex-wrap: wrap; gap: 20px; }
        .author-box { display: flex; align-items: center; gap: 14px; }
        .author-img { border-radius: 50%; border: 2px solid var(--border); }
        .author-name { font-weight: 800; font-size: 15px; color: var(--text-dark); display: block; }
        .meta-sub { font-size: 12px; color: var(--text-slate); font-weight: 600; margin-top: 2px; }
        .dot-sep { margin: 0 8px; color: #cbd5e1; }
        .views-count { color: var(--abah-blue); font-weight: 800; }

        .featured-img-container { position: relative; width: 100%; aspect-ratio: 16/9; max-height: 550px; border-radius: 24px; overflow: hidden; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); background: #f1f5f9; }
        .article-content { font-size: 19px; line-height: 1.85; color: #334155; }
        .article-content p { margin-bottom: 1.8rem; }

        /* SIDEBAR & STICKY */
        .sidebar { height: 100%; min-width: 340px; }
        .sticky-sidebar { position: sticky; top: 100px; display: flex; flex-direction: column; gap: 35px; }
        .sidebar-widget { background: #fff; border-radius: 20px; border: 1px solid var(--border); padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .widget-title { font-size: 15px; font-weight: 900; margin-bottom: 20px; padding-left: 12px; letter-spacing: 1px; }
        .widget-title.gold { border-left: 5px solid var(--abah-gold); color: #854d0e; }
        .widget-title.blue { border-left: 5px solid var(--abah-blue); color: var(--abah-blue); }

        /* SOCIAL BUTTONS */
        .social-flex { display: flex; gap: 8px; flex-wrap: wrap; }
        .social-btn { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); color: #fff; }
        .social-btn:hover { transform: translateY(-4px); filter: brightness(1.1); box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
        .social-btn.fb { background: #1877f2; }
        .social-btn.ig { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
        .social-btn.yt { background: #ff0000; }
        .social-btn.tt { background: #000; }
        .social-btn.wa { background: #25d366; }

        /* TERPOPULER - EFEK GLOW RESTORED */
        .popular-wrapper { display: flex; flex-direction: column; gap: 20px; }
        .pop-card { display: flex; gap: 16px; text-decoration: none; align-items: flex-start; transition: 0.3s; }
        .pop-number { font-size: 32px; font-weight: 900; color: #f1f5f9; line-height: 1; transition: 0.3s; min-width: 45px; }
        .pop-title-text { font-size: 14px; font-weight: 700; line-height: 1.4; color: var(--text-dark); transition: 0.3s; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pop-date { font-size: 11px; color: var(--text-slate); font-weight: 600; }

        /* HOVER EFFECTS TERPOPULER */
        .pop-card:hover .pop-number { color: var(--abah-gold); text-shadow: 0 0 15px rgba(255, 193, 7, 0.3); }
        .pop-card:hover .pop-title-text { color: var(--abah-blue); transform: translateX(4px); }

        /* RELATED SECTION */
        .related-section { margin-top: 60px; padding-top: 40px; border-top: 4px solid var(--abah-blue); }
        .section-title { font-size: 26px; font-weight: 900; color: var(--text-dark); margin-bottom: 30px; }
        .related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
        .related-card { text-decoration: none; display: block; }
        .related-thumb { position: relative; aspect-ratio: 16/9; border-radius: 18px; overflow: hidden; margin-bottom: 12px; background: #f1f5f9; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .related-post-title { font-size: 15px; font-weight: 800; line-height: 1.4; color: var(--text-dark); transition: 0.3s; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .related-card:hover .related-post-title { color: var(--abah-blue); }

        /* DOWNLOAD BOX */
        .download-box-tactical { margin: 40px 0; padding: 30px; background: #f8fafc; border: 1px solid var(--border); border-left: 6px solid var(--abah-blue); border-radius: 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
        .dl-label { font-size: 10px; font-weight: 900; color: var(--abah-blue); letter-spacing: 2px; }
        .dl-title { font-size: 18px; font-weight: 800; color: var(--text-dark); margin: 5px 0; }
        .dl-size { font-size: 11px; font-weight: 700; color: var(--text-slate); }
        .dl-button-modern { background: var(--abah-blue); color: #fff; padding: 16px 28px; border-radius: 16px; font-weight: 900; font-size: 12px; text-decoration: none; transition: 0.3s; white-space: nowrap; box-shadow: 0 10px 20px rgba(0,74,142,0.15); }
        .dl-button-modern:hover { background: var(--abah-gold); color: var(--abah-blue); transform: translateY(-3px); }

        /* MOBILE RESPONSIVE */
        @media (max-width: 992px) { 
          .main-grid-layout { grid-template-columns: 1fr; gap: 40px; } 
          .sticky-sidebar { position: static; } 
          .sidebar { min-width: 0; } 
          .related-grid { grid-template-columns: 1fr; }
          .download-box-tactical { flex-direction: column; text-align: center; }
          .dl-button-modern { width: 100%; }
          .main-title { font-size: 28px; }
          .meta-bar { flex-direction: column; align-items: flex-start; }
          .share-box { width: 100%; border-top: 1px dashed var(--border); padding-top: 15px; }
          .breadcrumb-title { max-width: 150px; }
        }
      `}} />
    </main>
  );
}