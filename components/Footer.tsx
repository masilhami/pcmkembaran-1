"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Pengunci ukuran ikon agar tetap proporsional
  const iconCircleStyle = (bgColor: string) => ({
    width: '36px',
    height: '36px',
    minWidth: '36px',
    maxWidth: '36px',
    borderRadius: '50%',
    backgroundColor: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  });

  return (
    <footer style={{ backgroundColor: '#fff', borderTop: '4px solid #004a8e', padding: '60px 0 0 0', marginTop: '60px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* KOLOM 1: BRAND & SOSIAL MEDIA */}
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '20px' }}>
            <Image src="/logo-md.png" alt="Logo PCM Kembaran" width={45} height={45} style={{ borderRadius: '50%' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ 
                fontSize: '17px', 
                fontWeight: '900', 
                color: '#004a8e', 
                lineHeight: '1', 
                fontStyle: 'italic', 
                letterSpacing: '-0.3px'
              }}>
                PCM
                <span style={{ 
                  color: '#f4c300',
                  WebkitTextStroke: '0',
                  textShadow: 'none'
                }}>
                  KEMBARAN
                </span>
                <span style={{ color: '#bbb', fontWeight: '300', fontSize: '13px', marginLeft: '1px' }}>
                  .COM
                </span>
              </span>
              
              <span style={{ 
                fontSize: '9px', 
                color: '#666', 
                fontWeight: '700', 
                marginTop: '3px', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Dakwah Berkemajuan, Mencerahkan Kehidupan
              </span>
            </div>
          </Link>
          
          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.7', marginBottom: '25px', textAlign: 'justify' }}>
            Situs resmi Pimpinan Cabang Muhammadiyah (PCM) Kembaran, Kabupaten Banyumas. Wadah informasi dakwah, pendidikan, dan pemberdayaan umat untuk mewujudkan masyarakat Islam yang sebenar-benarnya di wilayah Kecamatan Kembaran.
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="#" style={iconCircleStyle('#1877F2')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </Link>
            <Link href="#" style={iconCircleStyle('#000000')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </Link>
            <Link href="#" style={{ ...iconCircleStyle(''), background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </Link>
            <Link href="#" style={iconCircleStyle('#ff0000')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </Link>
          </div>
        </div>

        {/* KOLOM 2: RUBRIK UTAMA */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', borderLeft: '4px solid #f4c300', paddingLeft: '10px', marginBottom: '20px', color: '#333' }}>Rubrik Utama</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', color: '#666', lineHeight: '2.2' }}>
            <li><Link href="/berita" style={{ textDecoration: 'none', color: 'inherit' }}>Berita Cabang</Link></li>
            <li><Link href="/artikel" style={{ textDecoration: 'none', color: 'inherit' }}>Artikel Keislaman</Link></li>
            <li><Link href="/liputan-dakwah" style={{ textDecoration: 'none', color: 'inherit' }}>Liputan Dakwah</Link></li>
            <li><Link href="/pendidikan" style={{ textDecoration: 'none', color: 'inherit' }}>Pendidikan & Sekolah</Link></li>
            <li><Link href="/bisnis" style={{ textDecoration: 'none', color: 'inherit' }}>Ekonomi & Bisnis</Link></li>
            <li><Link href="/video" style={{ textDecoration: 'none', color: 'inherit' }}>Galeri Video</Link></li>
          </ul>
        </div>

        {/* KOLOM 3: LAYANAN & ASET */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', borderLeft: '4px solid #004a8e', paddingLeft: '10px', marginBottom: '20px', color: '#333' }}>Layanan & Aset</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', color: '#666', lineHeight: '2.2' }}>
            <li><Link href="/ranting" style={{ textDecoration: 'none', color: 'inherit' }}>Data Pimpinan Ranting</Link></li>
            <li><Link href="/masjid" style={{ textDecoration: 'none', color: 'inherit' }}>Daftar Masjid & Musholla</Link></li>
            <li><Link href="/aum" style={{ textDecoration: 'none', color: 'inherit' }}>Amal Usaha (AUM)</Link></li>
            <li><Link href="/unduhan" style={{ textDecoration: 'none', color: 'inherit' }}>Pusat Unduhan Dokumen</Link></li>
            <li><Link href="/galeri" style={{ textDecoration: 'none', color: 'inherit' }}>Galeri Foto Kegiatan</Link></li>
            <li><Link href="/kontak" style={{ textDecoration: 'none', color: 'inherit' }}>Kontak Pengurus</Link></li>
          </ul>
        </div>

        {/* KOLOM 4: TAUTAN RESMI */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', borderLeft: '4px solid #ce1111', paddingLeft: '10px', marginBottom: '20px', color: '#333' }}>Tautan Resmi</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', color: '#666', lineHeight: '2.2' }}>
            <li><Link href="https://muhammadiyah.or.id" target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>PP Muhammadiyah</Link></li>
            <li><Link href="https://suaramuhammadiyah.id" target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>Suara Muhammadiyah</Link></li>
            <li><Link href="https://lazismu.org" target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>Lazismu Pusat</Link></li>
            <li style={{ marginTop: '10px' }}>
              <Link href="https://sociabuzz.com/pcmkembaran/tribe" target="_blank" style={{ color: '#004a8e', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #004a8e', padding: '5px 10px', borderRadius: '5px', display: 'inline-block' }}>
                Donasi Perjuangan Dakwah
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT AREA */}
      <div style={{ backgroundColor: '#f8f9fa', marginTop: '50px', padding: '25px 0', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '13px', color: '#888' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <p style={{ margin: 0 }}>
            © {currentYear} <strong>PCM KEMBARAN</strong> — Pimpinan Cabang Muhammadiyah Kembaran, Banyumas. <br />
            <span style={{ fontSize: '11px' }}>
              Dikelola oleh <Link href="https://onislam.web.id" target="_blank" style={{ color: '#004a8e', textDecoration: 'none', fontWeight: '700' }}>Majelis Pustaka dan Informasi (MPI) PCM Kembaran</Link>.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}