'use client'

import dynamic from 'next/dynamic'

// Kita panggil MissionaryMap asli dengan ssr: false agar tidak error di server-side
const MissionaryMap = dynamic(() => import("./MissionaryMap"), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '700px', // Disamakan dengan tinggi asli peta agar tidak "loncat"
      width: '100%',
      background: '#020617', // Match dengan tema gelap tactical
      borderRadius: '24px', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', // FIX: Menggunakan camelCase (huruf C besar)
      border: '2px solid #334155',
      gap: '15px'
    }}>
      {/* Animasi Loading Sederhana ala Radar */}
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(56, 189, 248, 0.2)',
        borderTop: '3px solid #38bdf8',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      
      <div style={{ 
        color: '#38bdf8', 
        fontFamily: 'monospace', 
        fontSize: '12px',
        letterSpacing: '2px',
        fontWeight: 'bold'
      }}>
        INITIALIZING_TACTICAL_RADAR...
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
});

export default function MapWrapper({ rantings }: { rantings: any[] }) {
  // Komponen ini bertugas sebagai jembatan yang aman untuk Leaflet di Next.js
  return <MissionaryMap rantings={rantings} />;
}