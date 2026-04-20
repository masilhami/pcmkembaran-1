'use client'

import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON, FeatureGroup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'

const createTacticalIcon = () => {
  if (typeof window === 'undefined') return null;
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `
      <div class="ping-signal" style="width: 24px; height: 24px; position: absolute; top: -6px; left: -6px;"></div>
      <div style="background-color: #ffc107; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; position: relative; z-index: 10; box-shadow: 0 0 15px #ffc107;"></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

export default function MissionaryMap({ rantings = [] }: { rantings: any[] }) {
  const [icon, setIcon] = useState<any>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const center: [number, number] = [-7.4264, 109.2892];

  useEffect(() => {
    setIcon(createTacticalIcon());
    
    // MEMANGGIL DATA HASIL EKSTRAKSI TADI
    fetch('/data/kembaran-sectors.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("GAGAL MEMUAT SEKTOR:", err));
  }, []);

  // STYLE SEKTOR (HALUS & TIDAK RUNCING)
  const sectorStyle = () => ({
    fillColor: '#0ea5e9',
    fillOpacity: 0.08,
    color: '#38bdf8',
    weight: 2,           // Garis lebih tegas
    dashArray: '8, 8',   // Gaya militer
    lineJoin: 'round' as const, // ANTI-RUNCING: Menumpulkan sudut kaku
    lineCap: 'round' as const
  });

  const onEachSector = (feature: any, layer: any) => {
    const villageName = feature.properties.nm_kelurahan || feature.properties.NAMOBJ;
    
    // Tooltip Sektor (Besar & Muncul saat Hover)
    layer.bindTooltip(`SECTOR: ${villageName.toUpperCase()}`, {
      sticky: true,
      direction: 'center',
      className: 'leaflet-tooltip-tactical'
    });

    layer.on({
      mouseover: (e: any) => {
        e.target.setStyle({ fillOpacity: 0.25, weight: 3, color: '#ffc107' });
      },
      mouseout: (e: any) => {
        e.target.setStyle(sectorStyle());
      }
    });
  };

  if (!geoData) return <div className="text-pcm-blue font-mono p-10">INITIALIZING TACTICAL RADAR...</div>;

  return (
    <div className="tactical-map-container" style={{ 
      height: '700px', borderRadius: '16px', overflow: 'hidden', 
      border: '2px solid #334155', position: 'relative', backgroundColor: '#020617'
    }}>
      
      {/* HUD GRID OVERLAY */}
      <div className="tactical-grid" style={{ position: 'absolute', inset: 0, zIndex: 410 }}></div>

      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', background: '#020617' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {/* RENDER SEKTOR DESA ASLI (PRECISION MODE) */}
        <GeoJSON 
          data={geoData} 
          style={sectorStyle} 
          onEachFeature={onEachSector}
          smoothFactor={1.0} 
        />

        {/* RENDER NODES RANTING */}
        {rantings.map((prm) => {
          if (!prm.latitude || !prm.longitude) return null;
          const pos: [number, number] = [parseFloat(prm.latitude), parseFloat(prm.longitude)];
          
          return (
            <FeatureGroup key={prm._id}>
              <Circle center={pos} radius={850} pathOptions={{ fillColor: '#0ea5e9', fillOpacity: 0.05, color: '#0ea5e9', weight: 0.5, dashArray: '5, 5', className: 'radar-pulse-ring' }} />
              {icon && (
                <Marker position={pos} icon={icon}>
                  <Tooltip permanent direction="top" offset={[0, -18]} className="leaflet-tooltip-tactical">
                    <span style={{ fontSize: '12px', fontWeight: 950 }}>PRM {prm.name.toUpperCase()}</span>
                  </Tooltip>
                  <Popup className="tactical-popup">
                    <div style={{ background: '#0f172a', color: '#fff', padding: '15px', borderRadius: '10px', minWidth: '200px' }}>
                      <h4 style={{ margin: '0', fontSize: '20px', fontWeight: 950 }}>{prm.name}</h4>
                      <p style={{ margin: '5px 0 0', fontSize: '15px', color: '#ffc107', fontWeight: 800 }}>{prm.leader?.toUpperCase()}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </FeatureGroup>
          );
        })}
      </MapContainer>

      {/* HUD UI TEXT */}
      <div className="tactical-hud-text" style={{ position: 'absolute', top: 30, right: 30, zIndex: 1001, textAlign: 'right', color: '#38bdf8' }}>
        <div style={{ border: '2px solid #38bdf8', padding: '15px', background: 'rgba(2, 6, 23, 0.95)', boxShadow: '0 0 30px rgba(56, 189, 248, 0.4)' }}>
          KEMBARAN_GRID_MAP <br/>
          NODES: {rantings.length} ONLINE_
        </div>
      </div>

      <div className="tactical-hud-text" style={{ position: 'absolute', bottom: '40px', left: '40px', zIndex: 1001, color: '#38bdf8', padding: '12px 25px', background: 'rgba(2, 6, 23, 0.95)', borderLeft: '5px solid #ffc107' }}>
        SECTOR_SCAN: 100% COMPLETE // MISSION_STATUS: SECURED_
      </div>
    </div>
  );
}