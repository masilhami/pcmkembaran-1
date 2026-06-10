import { client } from "@/lib/sanity.client"; 
import { getAllPosts, getKhutbahPosts } from "@/lib/sanity.query";
import { Suspense } from "react"; // 🌟 1. Import Suspense murni bawaan React

// Import komponen dasar
import Headline from "@/components/Headline";
import TopNews from "@/components/TopNews";
import PopularSidebar from "@/components/PopularSidebar";
import RecommendationSection from "@/components/RecommendationSection";
import LatestPosts from "@/components/LatestPosts";
import KhutbahSidebar from "@/components/KhutbahSidebar";
import InfoDakwah from "@/components/InfoDakwah";
import BentoDashboard from "@/components/BentoDashboard"; 
import NotificationButton from "@/components/NotificationButton"; 
import LatestArticlesSidebar from "@/components/LatestArticlesSidebar"; // 🌟 2. Kembalikan import asli komponen asli

// ISR: Update data tiap 60 detik
export const revalidate = 60; 

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> 
}) {
  const resolvedSearchParams = await searchParams;

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

  const [allPosts, khutbahData, bentoData] = await Promise.all([
    getAllPosts(),
    getKhutbahPosts(),
    client.fetch(bentoQuery, {}, { cache: 'no-store' })
  ]);

  return (
    <div className="page-wrapper" style={{ margin: '0 auto', maxWidth: '1240px', padding: '0 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div className="hide-on-mobile" style={{ marginTop: '20px' }}>
        <TopNews />
      </div>

      <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', marginTop: '25px' }}>
        <div className="content-headline">
          <Headline />
        </div>
        <aside className="sidebar-popular hide-on-mobile">
          <PopularSidebar />
        </aside>
      </div>

      <section style={{ marginTop: '50px' }}>
        <BentoDashboard data={bentoData} />
      </section>

      {/* 4. RECOMMENDATION & SIDEBAR ARTIKEL */}
      <section className="hide-on-mobile" style={{ marginTop: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
          <div className="recommendation-area">
            <RecommendationSection allData={allPosts || []} />
          </div>
          
          {/* 🌟 3. EKSEKUSI UTAMA: Bungkus Async Server Component menggunakan Suspense + Fallback Skeleton */}
          <aside className="sidebar-articles">
            <Suspense fallback={<div style={{ backgroundColor: "rgb(0, 74, 142)", borderTopLeftRadius: "20px", minHeight: "400px", width: "340px" }} />}>
              <LatestArticlesSidebar />
            </Suspense>
          </aside>
        </div>
      </section>

      <div className="bottom-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', marginTop: '60px', paddingBottom: '80px' }}>
        <div className="content-latest">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
             <div style={{ width: '5px', height: '24px', background: '#ffc107', borderRadius: '10px' }}></div>
             <h2 style={{ fontSize: '24px', color: '#004a8e', fontWeight: '900', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
               Postingan <span style={{ color: '#0f172a' }}>Terbaru</span>
             </h2>
          </div>
          <LatestPosts searchParams={resolvedSearchParams} />
        </div>

        <div className="sidebar-dakwah" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <KhutbahSidebar articles={khutbahData || []} />
          <InfoDakwah />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000 }}>
        <NotificationButton />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) { 
          .main-grid { grid-template-columns: 1fr !important; }
          .hide-on-mobile { display: none !important; }
          .bottom-layout-grid { grid-template-columns: 1fr !important; gap: 50px !important; }
          .page-wrapper { padding: 0 15px !important; }
        }
        html { scroll-behavior: smooth; }
      `}} />
    </div>
  );
}