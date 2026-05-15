"use client";
import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation"; 
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAuthAction = async () => {
    if (user) {
      await supabase.auth.signOut();
      router.refresh();
    } else {
      window.open("https://pcmkembaran.com/studio", "_blank");
    }
  };

  const categoryMenus = [
    { name: "Berita", slug: "berita" },
    { name: "Artikel", slug: "artikel" },
    { name: "Liputan Dakwah", slug: "liputan-dakwah" },
    { name: "Pendidikan", slug: "pendidikan" },
    { name: "Video", slug: "video" },
    { name: "Tokoh & Inspirasi", slug: "tokoh-inspirasi" },
    { name: "Teknologi", slug: "teknologi" },
    { name: "Kesehatan", slug: "kesehatan" },
    { name: "Unduhan", slug: "unduhan" },
  ];

  const lapis4Menus = [
    { name: "Profile", slug: "profile" },
    { name: "Struktur Pimpinan", slug: "pimpinan" },
    { name: "Ranting", slug: "ranting" },
    { name: "Data Masjid", slug: "masjid" },
    { name: "Data AUM", slug: "aum" },
    { name: "Download", slug: "download" },
    { name: "Gallery", slug: "galeri" },
    { name: "Kontak", slug: "kontak" },
    { name: "Kajian Hari Ini", slug: "kajian-hari-ini" },
  ];

  const orgMenus = [
    { name: "Profil Cabang", slug: "profile" },
    { name: "Majelis & Lembaga", slug: "lembaga" },
    { name: "Data Ranting (PRM)", slug: "ranting" },
    { name: "Daftar Masjid", slug: "masjid" },
    { name: "Kajian Hari Ini", slug: "kajian-hari-ini" },
    { name: "Galeri Kegiatan", slug: "galeri" },
    { name: "Kontak", slug: "kontak" },
  ];

  return (
    <header className="header-container" style={{ width: '100%', position: 'relative' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-link-item { color: #ffffff !important; text-decoration: none; transition: all 0.3s ease; }
        .nav-link-item:hover { background-color: var(--abah-gold) !important; color: #000000 !important; }
        .nav-menu-list::-webkit-scrollbar, .lapis4-list::-webkit-scrollbar { display: none; }
        .nav-menu-list, .lapis4-list { -ms-overflow-style: none; scrollbar-width: none; }
        .lapis4-link { color: #444 !important; text-decoration: none; font-weight: 700; font-size: 11px; padding: 10px 15px; display: flex; align-items: center; white-space: nowrap; transition: 0.2s; }
        .lapis4-link:hover { color: var(--abah-blue) !important; }
        
        @keyframes pulse-red {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .signal-indicator {
          width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;
          margin-right: 8px; display: inline-block; animation: pulse-red 2s infinite;
        }

        /* 🛡️ BANNER ULTRA-SLIM & GLOW */
        .header-banner-right { 
          display: flex; 
          justify-content: flex-end;
          width: 100%;
          height: 110px; /* Diperkecil agar header ramping */
          transition: 0.3s; 
          flex: 1;
        }

        .header-banner-right img {
          transition: all 0.4s ease;
        }

        .header-banner-right:hover img {
          filter: brightness(1.25) drop-shadow(0 0 15px rgba(255, 255, 255, 0.6));
          transform: scale(1.03);
        }
        
        .logo-section-left {
          flex: 0 0 auto; 
          margin-right: 30px;
        }

        /* 📏 TAGLINE TIGHTENING */
        .tagline-text {
          font-size: 13.8px; 
          color: #666; font-weight: 700; text-transform: uppercase;
          display: block; text-align: justify; text-align-last: justify; 
          width: 100%; margin-top: 2px; /* Lebih mepet ke atas */
        }

        @media (max-width: 992px) { 
          .top-center-search { display: none !important; } 
          .header-banner-right { display: none !important; }
          .logo-text-box h1 { font-size: 24px !important; line-height: 1 !important; }
          .tagline-text { font-size: 9px !important; margin-top: 1px !important; }
          .logo-section-left { margin-right: 0; width: 100%; }
        }
        
        .auth-btn {
          border: none; cursor: pointer; padding: 6px 15px; border-radius: 20px;
          font-size: 11px; font-weight: 800; text-transform: uppercase; transition: 0.3s;
        }
      `}} />

      {/* LAPIS 1: TOPBAR */}
      <div className="top-bar" style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '6px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <div className="hamburger-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', zIndex: 1100 }}>
              <span style={{ width: '25px', height: '3px', backgroundColor: 'var(--abah-blue)', borderRadius: '2px', transition: '0.3s', transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
              <span style={{ width: '25px', height: '3px', backgroundColor: 'var(--abah-blue)', borderRadius: '2px', opacity: isMenuOpen ? 0 : 1 }}></span>
              <span style={{ width: '25px', height: '3px', backgroundColor: 'var(--abah-blue)', borderRadius: '2px', transition: '0.3s', transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
            </div>
          </div>

          <div className="top-center-search" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '30px', padding: '2px 2px 2px 15px', backgroundColor: '#fff', width: '100%', maxWidth: '380px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari naskah khutbah atau berita..." style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: '#444' }} />
              <button type="submit" style={{ backgroundColor: 'var(--abah-blue)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              </button>
            </form>
          </div>

          <div className="top-right-group" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Link href="https://sociabuzz.com/pcmkembaran/tribe" style={{ backgroundColor: 'var(--abah-blue)', color: '#ffffff', padding: '6px 15px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textDecoration: 'none', textTransform: 'uppercase' }}>DONASI</Link>
            <button 
              onClick={handleAuthAction}
              className="auth-btn"
              style={{ 
                backgroundColor: user ? '#ff4d4f' : 'var(--abah-gold)', 
                color: user ? '#fff' : '#000' 
              }}
            >
              {user ? 'KELUAR' : 'MASUK'}
            </button>
          </div>
        </div>
      </div>

      {/* SIDE DRAWER */}
      <div style={{ position: 'fixed', top: 0, left: isMenuOpen ? 0 : '-100%', width: '280px', height: '100vh', backgroundColor: '#fff', zIndex: 2000, transition: '0.4s ease', boxShadow: '5px 0 15px rgba(0,0,0,0.1)', padding: '30px 20px', overflowY: 'auto' }}>
        <h3 style={{ color: 'var(--abah-blue)', fontSize: '18px', fontWeight: '900', borderBottom: '2px solid var(--abah-gold)', paddingBottom: '10px', marginBottom: '20px' }}>NAVIGASI</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orgMenus.map((m) => (
            <li key={m.slug} style={{ marginBottom: '15px' }}>
              <Link href={`/${m.slug}`} onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#444', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                {m.slug === "kajian-hari-ini" && <span className="signal-indicator"></span>}
                {m.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1900 }}></div>}

      {/* LAPIS 2: LOGO & PHOTO BANNER - SYNC WIDTH 1200px & PADDING SLIM */}
      <div className="logo-section" style={{ backgroundColor: '#fff', padding: '2px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
          
          <div className="logo-section-left">
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '15px' }}>
              <Image src="/logo-md.png" alt="Logo" width={55} height={55} style={{ borderRadius: '50%' }} priority />
              <div className="logo-text-box" style={{ display: 'flex', flexDirection: 'column', width: 'fit-content' }}>
                <h1 style={{ color: 'var(--abah-blue)', margin: 0, fontSize: '42px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-1.5px', lineHeight: 0.9 }}>
                  PCM <span style={{ color: 'var(--abah-gold)' }}>KEMBARAN</span>
                </h1>
                <span className="tagline-text">
                  Dakwah Berkemajuan, Mencerahkan Kehidupan
                </span>
              </div>
            </Link>
          </div>

          <div className="header-banner-right">
             <Image 
               src="/images/pcm.png" 
               alt="Pimpinan PCM Kembaran" 
               width={1200} 
               height={110} 
               style={{ width: '100%', height: '100%', objectFit: 'contain' }}
               priority
             />
          </div>

        </div>
      </div>

      {/* LAPIS 3 & 4: NAVIGATION */}
      <div className="sticky-nav-group" style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <nav className="main-nav" style={{ backgroundColor: 'var(--abah-blue)', borderBottom: '2px solid var(--abah-gold)' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <ul className="nav-menu-list" style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, overflowX: 'auto' }}>
              <li style={{ backgroundColor: 'var(--abah-gold)' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', height: '48px', padding: '0 20px', color: '#000', fontWeight: '800', textDecoration: 'none' }}>HOME</Link>
              </li>
              {categoryMenus.map((m) => (
                <li key={m.slug}>
                  <Link href={`/${m.slug}`} className="nav-link-item" style={{ display: 'flex', alignItems: 'center', height: '48px', padding: '0 20px', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{m.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <nav className="secondary-nav" style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <ul className="lapis4-list" style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, overflowX: 'auto' }}>
              {lapis4Menus.map((m, index) => (
                <li key={m.slug} style={{ display: 'flex', alignItems: 'center' }}>
                  <Link href={`/${m.slug}`} className="lapis4-link">
                    {m.slug === "kajian-hari-ini" && <span className="signal-indicator"></span>}
                    {m.name.toUpperCase()}
                  </Link>
                  {index < lapis4Menus.length - 1 && <span style={{ color: '#ccc', fontSize: '10px' }}>|</span>}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}