"use client";
import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation"; 
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); // Kontrol search responsive mobile
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
      setIsMobileSearchOpen(false); // Otomatis tutup laci jika via mobile
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
    { name: "Jadwal Radio", slug: "jadwal-radio" }, 
    { name: "Galeri Kegiatan", slug: "galeri" },
    { name: "Kontak", slug: "kontak" },
  ];

  return (
    <header className="w-full relative bg-white">
      
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-link-item { color: #ffffff !important; text-decoration: none; transition: all 0.3s ease; }
        .nav-link-item:hover { background-color: var(--abah-gold) !important; color: #000000 !important; }
        .nav-menu-list::-webkit-scrollbar, .lapis4-list::-webkit-scrollbar { display: none; }
        .nav-menu-list, .lapis4-list { -ms-overflow-style: none; scrollbar-width: none; }
        .lapis4-link { color: #444 !important; text-decoration: none; font-weight: 700; font-size: 11px; padding: 10px 12px; display: flex; align-items: center; white-space: nowrap; transition: 0.2s; }
        .lapis4-link:hover { color: var(--abah-blue) !important; }
        
        @keyframes pulse-red {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .signal-indicator {
          width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;
          margin-right: 6px; display: inline-block; animation: pulse-red 2s infinite;
        }

        .dropdown-parent { position: relative; display: flex; align-items: center; }
        .dropdown-box { 
          position: absolute; top: 100%; left: 0; background-color: #ffffff; 
          min-width: 160px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.1); 
          border-radius: 4px; padding: 4px 0; list-style: none; margin: 0;
          opacity: 0; visibility: hidden; transform: translateY(10px);
          transition: all 0.2s ease; z-index: 5000; border: 1px solid #eee;
        }
        .dropdown-parent:hover .dropdown-box { 
          opacity: 1; visibility: visible; transform: translateY(0); 
        }
        .dropdown-item-link {
          color: #444 !important; display: block; padding: 10px 16px; 
          text-decoration: none; font-size: 11px; font-weight: 700; 
          text-transform: uppercase; transition: 0.2s; white-space: nowrap;
        }
        .dropdown-item-link:hover { 
          background-color: #f5f5f5; color: var(--abah-blue) !important; 
        }

        .header-banner-right { 
          display: flex; 
          justify-content: flex-end;
          height: 110px;
          transition: 0.3s; 
          flex: 1;
        }
        .header-banner-right img { transition: all 0.4s ease; }
        .header-banner-right:hover img {
          filter: brightness(1.25) drop-shadow(0 0 15px rgba(255, 255, 255, 0.6));
          transform: scale(1.03);
        }
        
        .logo-section-left { flex: 0 0 auto; }
        .tagline-text {
          font-size: 13.8px; 
          color: #666; font-weight: 700; text-transform: uppercase;
          display: block; text-align: justify; text-align-last: justify; 
          width: 100%; margin-top: 2px;
        }
        
        .auth-btn {
          border: none; cursor: pointer; padding: 6px 15px; border-radius: 20px;
          font-size: 11px; font-weight: 800; text-transform: uppercase; transition: 0.3s;
        }

        /* 📱 RESPONSIVE INTERFACE BREAKPOINTS */
        @media (max-width: 992px) { 
          .header-banner-right { display: none !important; }
          .logo-text-box h1 { font-size: 26px !important; letter-spacing: -0.5px !important; }
          .tagline-text { font-size: 8.5px !important; letter-spacing: 0.2px; text-align: left !important; text-align-last: auto !important; margin-top: 3px !important; }
          .logo-section-left { width: 100%; justify-content: center; }
          .logo-container-box { justify-content: center !important; padding: 12px 0 !important; }
        }
        
        @media (max-width: 600px) {
          .top-right-group a, .auth-btn { padding: 5px 10px !important; font-size: 10px !important; }
          .logo-text-box h1 { font-size: 22px !important; }
          .tagline-text { font-size: 7.5px !important; }
          .logo-image-avatar { width: 45px !important; height: 45px !important; }
        }
      `}} />

      {/* LAPIS 1: TOPBAR */}
      <div className="w-full bg-white border-b border-gray-100 py-2">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between gap-4">
          
          {/* Sisi Kiri: Hamburger Menu Icon */}
          <div className="flex-1 flex justify-start items-center gap-2">
            <button 
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="flex flex-col gap-[5px] cursor-pointer z-[2100] border-none bg-transparent p-2 -ml-2 outline-none focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <span className="block w-6 h-[3px] bg-[var(--abah-blue)] rounded-sm transition-all duration-300" style={{ transform: isMenuOpen ? 'rotate(45deg) translate(6px, 5px)' : 'none' }}></span>
              <span className="block w-6 h-[3px] bg-[var(--abah-blue)] rounded-sm transition-all duration-300" style={{ opacity: isMenuOpen ? 0 : 1 }}></span>
              <span className="block w-6 h-[3px] bg-[var(--abah-blue)] rounded-sm transition-all duration-300" style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
            </button>

            {/* Ikon Kaca Pembesar khusus Mobile Layout */}
            <button 
              type="button" 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="flex lg:hidden p-2 text-[var(--abah-blue)] hover:opacity-80 outline-none focus:outline-none bg-transparent border-none"
              aria-label="Toggle Mobile Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            </button>
          </div>

          {/* 🟢 PERBAIKAN STRUKTUR CSS FORM SEARCH DESKTOP (Sesuai image_0a1814.png) */}
          <div className="hidden lg:flex flex-1 justify-center max-w-[400px]">
            <form onSubmit={handleSearch} className="flex items-center justify-between border border-gray-300 rounded-full p-1 pl-4 bg-white w-full shadow-sm group focus-within:border-[var(--abah-blue)] transition-colors">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Cari naskah khutbah atau berita..." 
                className="border-none outline-none w-full text-xs text-gray-700 bg-transparent pr-2 placeholder-gray-400 min-w-0" 
              />
              <button type="submit" className="bg-[var(--abah-blue)] hover:bg-opacity-90 border-none w-8 h-8 rounded-full cursor-pointer flex items-center justify-center shrink-0 transition-all outline-none focus:outline-none">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              </button>
            </form>
          </div>

          {/* Sisi Kanan: Action Buttons Group */}
          <div className="flex-1 flex gap-2 justify-end items-center">
            <Link href="https://sociabuzz.com/pcmkembaran/tribe" className="bg-[var(--abah-blue)] color-[#ffffff] px-4 py-1.5 rounded-full text-[11px] font-extrabold text-white no-underline tracking-wider text-center whitespace-nowrap hover:bg-opacity-90 transition-all">DONASI</Link>
            <button 
              onClick={handleAuthAction}
              className="auth-btn whitespace-nowrap hover:opacity-90 transition-all"
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

      {/* 🟢 DRAWER LACI KHUSUS MOBILE FORM SEARCH */}
      {isMobileSearchOpen && (
        <div className="w-full bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex lg:hidden animate-fade-in z-40">
          <form onSubmit={handleSearch} className="flex items-center justify-between border border-gray-300 rounded-full p-1 pl-4 bg-white w-full shadow-inner">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Cari naskah khutbah atau berita..." 
              className="border-none outline-none w-full text-xs text-gray-700 bg-transparent pr-2 placeholder-gray-400 min-w-0"
              autoFocus
            />
            <button type="submit" className="bg-[var(--abah-blue)] border-none w-8 h-8 rounded-full cursor-pointer flex items-center justify-center shrink-0 outline-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            </button>
          </form>
        </div>
      )}

      {/* SIDE DRAWER MENU */}
      <div style={{ position: 'fixed', top: 0, left: isMenuOpen ? 0 : '-100%', width: '280px', height: '100vh', backgroundColor: '#fff', zIndex: 2500, transition: '0.4s ease', boxShadow: '5px 0 15px rgba(0,0,0,0.1)', padding: '30px 20px', overflowY: 'auto' }}>
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
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2400 }}></div>}

      {/* LAPIS 2: LOGO & PHOTO BANNER */}
      <div className="w-full bg-white py-4 border-b border-gray-50">
        <div className="logo-container-box max-w-[1200px] mx-auto px-4 flex items-center justify-between gap-6">
          
          <div className="logo-section-left flex items-center">
            <Link href="/" className="no-underline inline-flex items-center gap-3 sm:gap-4">
              <div className="logo-image-avatar w-[55px] h-[55px] relative shrink-0">
                <Image src="/logo-md.png" alt="Logo" fill className="rounded-full object-cover" priority />
              </div>
              <div className="logo-text-box flex flex-col w-fit">
                <h1 style={{ color: 'var(--abah-blue)', margin: 0, fontSize: '38px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-1.5px', lineHeight: 0.9 }}>
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
               width={800} 
               height={110} 
               className="w-full h-full object-contain"
               priority
             />
          </div>

        </div>
      </div>

      {/* LAPIS 3 & 4: NAVIGATION */}
      <div className="sticky-nav-group sticky top-0 z-[1000] shadow-md">
        
        {/* Lapis 3 Menu Utama */}
        <nav className="w-full bg-[var(--abah-blue)] border-b-2 border-[var(--abah-gold)]">
          <div className="max-w-[1200px] mx-auto">
            <ul className="nav-menu-list flex list-none p-0 m-0 overflow-x-auto select-none touch-pan-x">
              <li className="bg-[var(--abah-gold)] shrink-0">
                <Link href="/" className="flex items-center h-12 px-5 color-[#000] font-extrabold no-underline text-sm text-black">HOME</Link>
              </li>
              {categoryMenus.map((m) => (
                <li key={m.slug} className="shrink-0">
                  <Link href={`/${m.slug}`} className="nav-link-item flex items-center h-12 px-5 font-bold text-xs no-underline whitespace-nowrap uppercase">{m.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Lapis 4 Menu Sekunder */}
        <nav className="w-full bg-[#f9f9f9] border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto">
            <ul className="lapis4-list flex list-none p-0 m-0 overflow-x-auto select-none touch-pan-x items-center">
              {lapis4Menus.map((m, index) => (
                <li key={m.slug} className="flex items-center shrink-0">
                  <Link href={`/${m.slug}`} className="lapis4-link">
                    {m.slug === "kajian-hari-ini" && <span className="signal-indicator"></span>}
                    {m.name.toUpperCase()}
                  </Link>
                  <span className="text-gray-300 text-[10px] pointer-events-none select-none px-1">|</span>
                </li>
              ))}

              <li className="dropdown-parent flex items-center shrink-0 relative">
                <Link href="/radio" className="lapis4-link">
                  RADIO <span className="text-[8px] ml-1">▼</span>
                </Link>
                <ul className="dropdown-box shadow-md bg-white border border-gray-100 rounded">
                  <li>
                    <Link href="/jadwal-radio" className="dropdown-item-link">
                      Jadwal Radio
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </nav>
        
      </div>
    </header>
  );
}