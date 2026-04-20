'use client'

import nextDynamic from 'next/dynamic'

// Kita panggil MissionaryMap asli di sini dengan ssr: false
const MissionaryMap = nextDynamic(() => import("./MissionaryMap"), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '500px', 
      background: '#f1f5f9', 
      borderRadius: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      justify_content: 'center' 
    }}>
      Memuat Peta Dakwah...
    </div>
  )
});

export default function MapWrapper({ rantings }: { rantings: any[] }) {
  return <MissionaryMap rantings={rantings} />;
}