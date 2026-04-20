import { client } from "@/lib/sanity.client"; 
import { getAllPosts, getKhutbahPosts } from "@/lib/sanity.query";
import dynamic from "next/dynamic"; // Gunakan nama standar 'dynamic'

// Komponen standar (Server Components) - Import Normal lebih cepat & SEO Friendly
import Headline from "@/components/Headline";
import TopNews from "@/components/TopNews";
import PopularSidebar from "@/components/PopularSidebar";
import RecommendationSection from "@/components/RecommendationSection";
import LatestPosts from "@/components/LatestPosts";
import KhutbahSidebar from "@/components/KhutbahSidebar";
import InfoDakwah from "@/components/InfoDakwah";
import LatestArticlesSidebar from "@/components/LatestArticlesSidebar";
import BentoDashboard from "@/components/BentoDashboard"; 

// Hanya gunakan dynamic untuk Client Components yang butuh 'window' atau 'document'
const NotificationButton = dynamic(() => import("@/components/NotificationButton"), { ssr: false });
const MissionaryMap = dynamic(() => import("@/components/MapWrapper"), { ssr: false }); // Jika ada peta

export const revalidate = 60; // Update data tiap 60 detik (ISR)

export default async function Home() {
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

  // Eksekusi semua data sekaligus (Tactical Maneuver)
  const [allPosts, khutbahData, bentoData] = await Promise.all([
    getAllPosts(),
    getKhutbahPosts(),
    client.fetch(bentoQuery)
  ]);

  return (
    <div className="page-wrapper" style={{ margin: '0 auto', maxWidth: '1200px', padding: '0 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div className="hide-on-mobile"><TopNews /></div>

      <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', marginTop: '25px' }}>
        <div className="content-headline"><Headline /></div>
        <div className="sidebar-popular hide-on-mobile"><PopularSidebar /></div>
      </div>

      <section style={{ marginTop: '45px' }}>
        <BentoDashboard data={bentoData} />
      </section>

      <section className="hide-on-mobile" style={{ marginTop: '50px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
          <div><RecommendationSection allData={allPosts || []} /></div>
          <aside><LatestArticlesSidebar /></aside>
        </div>
      </section>

      <div className="bottom-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', marginTop: '50px', paddingBottom: '60px' }}>
        <div className="content-latest">
          <h2 style={{ fontSize: '22px', color: '#004a8e', fontWeight: '900', marginBottom: '25px' }}>
            POSTINGAN <span style={{ color: '#ffc107' }}>TERBARU</span>
          </h2>
          <LatestPosts />
        </div>
        <div className="sidebar-dakwah" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <KhutbahSidebar articles={khutbahData || []} />
          <InfoDakwah />
        </div>
      </div>

      {/* Tombol Notifikasi (Client Side Only) */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000 }}>
        <NotificationButton />
      </div>

      {/* Responsive Tactical CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 992px) { 
          .hide-on-mobile { display: none !important; } 
          .main-grid, .bottom-layout-grid { grid-template-columns: 1fr !important; gap: 30px !important; } 
        }
      `}} />
    </div>
  );
}