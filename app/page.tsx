import { client } from "@/lib/sanity.client"; 
import { getAllPosts, getKhutbahPosts } from "@/lib/sanity.query";

// 1. IMPORT KOMPONEN UTAMA
import Headline from "@/components/Headline";
import TopNews from "@/components/TopNews";
import PopularSidebar from "@/components/PopularSidebar";
import RecommendationSection from "@/components/RecommendationSection";
import LatestPosts from "@/components/LatestPosts";
import KhutbahSidebar from "@/components/KhutbahSidebar";
import InfoDakwah from "@/components/InfoDakwah";
import LatestArticlesSidebar from "@/components/LatestArticlesSidebar";
import BentoDashboard from "@/components/BentoDashboard"; 
import NotificationButton from "@/components/NotificationButton"; 

// ISR: Update data tiap 60 detik
export const revalidate = 60; 

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> 
}) {
  // PROTOKOL KRITIKAL: Await searchParams untuk Next.js 15+
  const resolvedSearchParams = await searchParams;

  // Query data Bento (Statistik & Profil)
  const bentoQuery = `{
    "latestPost": *[_type == "post"] | order(publishedAt desc)[0] {
      title, category, publishedAt, slug,
      "fileUrl": fileSource.asset->url,
      downloadLink, fileSize
    },
    "installCount": count(*[_type == "installations"]),
    "leader": *[_type == "pimpinan" && category == "harian"] | order(order asc)[0] {
      name, nbm, position, "photoUrl": photo.asset->url
    },
    "profile": *[_type == "profile"][0],
    "rantingCount": count(*[_type == "ranting"]),
    "masjidCount": count(*[_type == "masjid"])
  }`;

  // Eksekusi data secara paralel (Speed Boost ⚡)
  const [allPosts, khutbahData, bentoData] = await Promise.all([
    getAllPosts(),
    getKhutbahPosts(),
    client.fetch(bentoQuery, {}, { cache: 'no-store' })
  ]);

  return (
    <div className="page-wrapper" style={{ margin: '0 auto', maxWidth: '1240px', padding: '0 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. HEADER / TOP NEWS */}
      <div className="hide-on-mobile" style={{ marginTop: '20px' }}>
        <TopNews />
      </div>

      {/* 2. MAIN SECTION: HEADLINE & POPULAR */}
      <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', marginTop: '25px' }}>
        <div className="content-headline">
          <Headline />
        </div>
        <aside className="sidebar-popular hide-on-mobile">
          <PopularSidebar />
        </aside>
      </div>

      {/* 3. DASHBOARD STATISTIK (BENTO STYLE) */}
      <section style={{ marginTop: '50px' }}>
        <BentoDashboard data={bentoData} />
      </section>

      {/* 4. RECOMMENDATION & SIDEBAR ARTIKEL */}
      <section className="hide-on-mobile" style={{ marginTop: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
          <div className="recommendation-area">
            <RecommendationSection allData={allPosts || []} />
          </div>
          <aside>
            <LatestArticlesSidebar />
          </aside>
        </div>
      </section>

      {/* 5. BOTTOM SECTION: LATEST POSTS & DAKWAH INFO */}
      <div className="bottom-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', marginTop: '60px', paddingBottom: '80px' }}>
        
        {/* KOLOM UTAMA: POSTINGAN TERBARU (DENGAN PAGINATION) */}
        <div className="content-latest">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
             <div style={{ width: '5px', height: '24px', background: '#ffc107', borderRadius: '10px' }}></div>
             <h2 style={{ fontSize: '24px', color: '#004a8e', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
               Postingan <span style={{ color: '#0f172a' }}>Terbaru</span>
             </h2>
          </div>
          
          {/* MENGIRIM PARAMS KE KOMPONEN ANAK UNTUK PAGINATION */}
          <LatestPosts searchParams={resolvedSearchParams} />
        </div>

        {/* KOLOM SIDEBAR: KHUTBAH & INFO DAKWAH */}
        <div className="sidebar-dakwah" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <KhutbahSidebar articles={khutbahData || []} />
          <InfoDakwah />
        </div>
      </div>

      {/* FLOATING ACTION BUTTON */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000 }}>
        <NotificationButton />
      </div>

      {/* RESPONSIVE TACTICAL OVERRIDE */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) { 
          .main-grid { grid-template-columns: 1fr !important; }
          .hide-on-mobile { display: none !important; }
          .bottom-layout-grid { grid-template-columns: 1fr !important; gap: 50px !important; }
          .page-wrapper { padding: 0 15px !important; }
        }
        
        /* Smooth Scroll for Pagination */
        html { scroll-behavior: smooth; }
      `}} />
    </div>
  );
}