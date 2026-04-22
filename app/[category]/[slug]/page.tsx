import { getSinglePost, getRelatedPosts } from "@/lib/sanity.query"; 
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import nextDynamic from 'next/dynamic'; 
import ViewCounter from "@/components/ViewCounter"; 
import ShareButtons from "@/components/ShareButtons";
import PortableTextContent from "@/components/PortableTextContent";
import { User, MapPin, Clock, Calendar, Info, ArrowLeft } from "lucide-react";

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
    description: post.keterangan || post.excerpt || "Baca informasi terbaru dari PCM Kembaran",
    openGraph: { title: post.title, description: post.keterangan || post.excerpt, url: url, images: [{ url: post.image || "/opengraph-image.jpg" }], type: "article" },
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

  // Cek apakah ini kategori Jadwal Kajian
  const isJadwalKajian = category === 'jadwal-kajian' || post.category === 'Jadwal Kajian';

  return (
    <main className="post-detail-main">
      <ViewCounter slug={slug} />
      
      <nav className="breadcrumb">
        <Link href="/">Home</Link> <ChevronRightSmall />
        <Link href={`/${category}`} className="breadcrumb-cat">{category.replace('-', ' ')}</Link>
        <ChevronRightSmall />
        <span className="breadcrumb-title">{post.title}</span>
      </nav>

      <div className="main-grid-layout">
        {/* ================= SISI KIRI: KONTEN UTAMA ================= */}
        <article className="article-container">
          <header className="article-header">
            <h1 className="main-title">{post.title}</h1>
            <div className="meta-bar">
              <div className="author-box">
                <Image src="/logo-md.png" width={45} height={45} className="author-img" alt="Redaksi" />
                <div className="author-info">
                  <span className="name">Redaksi PCM Kembaran</span>
                  <div className="meta-sub">
                    <span suppressHydrationWarning>
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Terbit Baru Saja'}
                    </span>
                    <span className="sep">•</span>
                    <span className="views">{post.views || 0} Kali Dibaca</span>
                  </div>
                </div>
              </div>
              <ShareButtons shareUrl={shareUrl} postTitle={post.title} />
            </div>
          </header>

          {/* GAMBAR UTAMA / FLYER */}
          {post.image && (
            <div className="featured-img-container">
              <Image src={post.image} alt={post.title} fill priority sizes="(max-width: 1200px) 100vw, 800px" style={{ objectFit: 'contain', background: '#f8fafc' }} />
            </div>
          )}

          {/* ================= SEKTOR INFO KAJIAN (DINAMIS) ================= */}
          {isJadwalKajian && (
            <section className="kajian-info-box">
              <div className="kajian-grid">
                <div className="kajian-item">
                  <div className="kajian-icon blue"><User size={20} /></div>
                  <div className="kajian-text">
                    <label>PEMATERI</label>
                    <p>{post.ustadz || "Belum ditentukan"}</p>
                  </div>
                </div>
                <div className="kajian-item">
                  <div className="kajian-icon gold"><Clock size={20} /></div>
                  <div className="kajian-text">
                    <label>WAKTU</label>
                    <p>{post.waktu || "Konfirmasi Panitia"}</p>
                  </div>
                </div>
                <div className="kajian-item">
                  <div className="kajian-icon green"><MapPin size={20} /></div>
                  <div className="kajian-text">
                    <label>LOKASI</label>
                    <p>{post.namaMasjid || "Area Kembaran"}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="article-content">
            {/* Tampilkan Body (PortableText) jika ada, jika tidak tampilkan Keterangan (Text Biasa) */}
            {post.body ? (
              <PortableTextContent value={post.body} />
            ) : (
              <div className="keterangan-wrapper">
                <h3 className="keterangan-label"><Info size={18} /> Deskripsi Kegiatan</h3>
                <p className="keterangan-text">{post.keterangan || "Mari hadiri dan syiarkan dakwah Islam bersama PCM Kembaran."}</p>
              </div>
            )}
          </div>

          {/* SEKTOR DOWNLOAD */}
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

          <div className="action-footer">
             <Link href="/jadwal-kajian" className="back-btn">
               <ArrowLeft size={16} /> Kembali ke Jadwal
             </Link>
          </div>

          <CommentSection slug={slug} />

          {/* POSTINGAN TERKAIT */}
          {relatedPosts?.length > 0 && (
            <section className="related-section">
              <h3 className="section-title">Postingan Terkait</h3>
              <div className="related-grid">
                {relatedPosts.slice(0, 3).map((rel: any) => (
                  <Link href={`/${category}/${rel.slug}`} key={rel._id} className="related-card">
                    <div className="related-thumb">
                      <Image src={rel.image || "/logo-md.png"} alt={rel.title} fill sizes="300px" style={{ objectFit: 'cover' }} />
                    </div>
                    <h4>{rel.title}</h4>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* ================= SISI KANAN: SIDEBAR ================= */}
        <aside className="sidebar">
          <div className="sticky-sidebar">
            <div className="sidebar-widget">
              <h3 className="widget-title gold">IKUTI KAMI</h3>
              <div className="social-flex">
                 {/* ... (SVG Social Buttons Sama Seperti Sebelumnya) ... */}
              </div>
            </div>

            <div className="sidebar-widget">
              <h3 className="widget-title blue">TERPOPULER</h3>
              <div className="popular-wrapper">
                {relatedPosts?.slice(0, 5).map((pop: any, idx: number) => (
                  <Link href={`/${category}/${pop.slug}`} key={pop._id} className="pop-card">
                    <div className="pop-number">0{idx + 1}</div>
                    <div className="pop-info">
                      <p className="pop-title-text">{pop.title}</p>
                      <span className="pop-date">{pop.publishedAt ? new Date(pop.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Baru'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root { --abah-blue: #004a8e; --abah-gold: #ffc107; --text-main: #1e293b; --border: #e2e8f0; }
        .post-detail-main { max-width: 1200px; margin: 40px auto; padding: 0 20px; font-family: 'Plus Jakarta Sans', sans-serif; }
        .breadcrumb { font-size: 13px; color: #64748b; margin-bottom: 30px; display: flex; align-items: center; gap: 8px; font-weight: 600; }
        .breadcrumb-cat { color: var(--abah-blue); font-weight: 800; text-transform: uppercase; text-decoration: none; }
        .breadcrumb-title { color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }
        
        .main-grid-layout { display: grid; grid-template-columns: 1fr 340px; gap: 50px; align-items: flex-start; }
        .article-container { min-width: 0; }
        .main-title { font-size: clamp(26px, 4vw, 42px); font-weight: 900; line-height: 1.2; color: #0f172a; margin-bottom: 25px; text-transform: uppercase; letter-spacing: -1px; }
        
        .meta-bar { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 20px 0; margin-bottom: 35px; }
        .author-box { display: flex; align-items: center; gap: 14px; }
        .author-img { border-radius: 50%; border: 2px solid var(--border); }
        .name { font-weight: 800; font-size: 15px; color: #1e293b; }
        .meta-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
        .views { color: var(--abah-blue); font-weight: 700; }

        .featured-img-container { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }

        /* KAJIAN INFO BOX CSS */
        .kajian-info-box { background: #f8fafc; border-radius: 24px; padding: 30px; margin-bottom: 40px; border: 1px solid var(--border); }
        .kajian-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .kajian-item { display: flex; align-items: center; gap: 15px; }
        .kajian-icon { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
        .kajian-icon.blue { background: var(--abah-blue); }
        .kajian-icon.gold { background: var(--abah-gold); color: #854d0e; }
        .kajian-icon.green { background: #10b981; }
        .kajian-text label { font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 1px; display: block; }
        .kajian-text p { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; line-height: 1.2; }

        .article-content { font-size: 19px; line-height: 1.85; color: #334155; }
        .keterangan-wrapper { background: #fff; padding: 30px; border-radius: 20px; border-left: 5px solid var(--abah-blue); box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
        .keterangan-label { font-size: 16px; font-weight: 900; color: var(--abah-blue); margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .keterangan-text { font-style: italic; color: #475569; font-weight: 500; }

        .back-btn { display: inline-flex; align-items: center; gap: 8px; margin-top: 40px; padding: 12px 24px; border-radius: 12px; background: #f1f5f9; color: #475569; text-decoration: none; font-weight: 800; font-size: 13px; transition: 0.3s; }
        .back-btn:hover { background: var(--abah-blue); color: #fff; }

        .sidebar { height: 100%; min-width: 340px; }
        .sticky-sidebar { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 35px; }
        .sidebar-widget { background: #fff; border-radius: 20px; border: 1px solid var(--border); padding: 25px; }
        .widget-title { font-size: 15px; font-weight: 900; margin-bottom: 20px; padding-left: 12px; }
        .widget-title.gold { border-left: 5px solid var(--abah-gold); color: #854d0e; }
        .widget-title.blue { border-left: 5px solid var(--abah-blue); color: var(--abah-blue); }

        @media (max-width: 992px) { 
          .main-grid-layout { grid-template-columns: 1fr; }
          .sidebar { min-width: 0; }
          .kajian-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </main>
  );
}

// Helper component
function ChevronRightSmall() {
  return <span style={{ color: '#cbd5e1' }}>/</span>;
}