import { client } from "@/lib/sanity.client";
import { Metadata } from "next";
import MapWrapper from "@/components/MapWrapper"; 
import { MapPin, User, Users, Briefcase, Navigation2 } from 'lucide-react';
import Image from "next/image";

async function getRantingData() {
  const query = `*[_type == "ranting"] | order(order asc) {
    _id, name, establishedYear, leader, nbm, secretary, nbmSecretary, treasurer, nbmTreasurer, address, latitude, longitude,
    "imageUrl": image.asset->url
  }`;
  return await client.fetch(query, {}, { cache: 'no-store' });
}

export default async function RantingPage() {
  const rantings = await getRantingData();

  return (
    <main style={{ background: '#f1f5f9', padding: '60px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* HEADER DASHBOARD */}
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', background: '#004a8e', color: '#fff', padding: '6px 20px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, letterSpacing: '2px', marginBottom: '15px' }}>
            GEO-PORTAL MUHAMMADIYAH
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            Data Ranting <span style={{ color: '#004a8e' }}>(PRM)</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '10px' }}>Wilayah Pimpinan Cabang Muhammadiyah Kembaran</p>
        </header>

        {/* PETA SEBARAN (Tetap Canggih) */}
        <section style={{ marginBottom: '80px' }}>
           <MapWrapper rantings={rantings} />
        </section>

        {/* GRID KARTU RANTING (KEMBALI GAGAH) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '30px' }}>
          {rantings.map((prm: any) => (
            <div key={prm._id} className="prm-card" style={{ background: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', transition: '0.3s' }}>
              
              {/* IMAGE HEADER */}
              <div style={{ position: 'relative', height: '200px', background: '#004a8e' }}>
                <img 
                  src={prm.imageUrl || "/logo-md.png"} 
                  alt={prm.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,74,142,0.9), transparent)' }}></div>
                <div style={{ position: 'absolute', bottom: '20px', left: '25px' }}>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '24px', fontWeight: 900 }}>PRM {prm.name}</h3>
                  {prm.establishedYear && (
                    <span style={{ color: '#ffc107', fontSize: '11px', fontWeight: 800, letterSpacing: '1px' }}>BERDIRI TAHUN {prm.establishedYear}</span>
                  )}
                </div>
              </div>

              {/* DATA PIMPINAN */}
              <div style={{ padding: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* KETUA */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}><User size={18} color="#004a8e" /></div>
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Ketua Ranting</p>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{prm.leader || '-'}</h4>
                      {prm.nbm && <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>NBM: {prm.nbm}</p>}
                    </div>
                  </div>

                  {/* SEKRETARIS & BENDAHARA */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Sekretaris</p>
                      <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>{prm.secretary || '-'}</h5>
                    </div>
                    <div>
                      <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Bendahara</p>
                      <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>{prm.treasurer || '-'}</h5>
                    </div>
                  </div>

                  {/* ALAMAT */}
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '16px', display: 'flex', gap: '10px' }}>
                    <MapPin size={16} color="#64748b" style={{ marginTop: '2px' }} />
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{prm.address}</p>
                  </div>

                  {/* BUTTON NAVIGASI */}
                  {prm.latitude && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${prm.latitude},${prm.longitude}`}
                      target="_blank"
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        background: '#004a8e', color: '#fff', padding: '14px', borderRadius: '16px',
                        textDecoration: 'none', fontWeight: 800, fontSize: '13px', transition: '0.3s'
                      }}
                      className="nav-btn"
                    >
                      BUKA PETUNJUK LOKASI <Navigation2 size={16} fill="white" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .prm-card:hover { transform: translateY(-10px); box-shadow: 0 25px 50px -12px rgba(0, 74, 142, 0.15) !important; }
        .nav-btn:hover { background: #ffc107 !important; color: #004a8e !important; }
      `}} />
    </main>
  );
}