'use client'

import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON, FeatureGroup, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { LatLngExpression } from 'leaflet'
import { useEffect, useState, useRef } from 'react'

export default function MissionaryMap({ rantings = [] }: { rantings: any[] }) {
  const [geoData, setGeoData] = useState<any>(null);
  // State diperluas untuk menangkap koordinat real-time
  const [hoveredData, setHoveredData] = useState<{ 
    name: string; 
    type: string; 
    lat?: string; 
    lng?: string; 
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const center: LatLngExpression = [-7.4264, 109.2892];

  useEffect(() => {
    fetch('/data/kembaran-sectors.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("RADAR_ERROR:", err));
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const sectorStyle = (feature: any) => {
    const isHovered = hoveredData?.name === (feature.properties.nm_kelurahan || feature.properties.NAMOBJ).toUpperCase();
    return {
      fillColor: isHovered ? '#ffc107' : '#004a8e',
      fillOpacity: isHovered ? 0.3 : 0.05,
      color: isHovered ? '#ffc107' : '#004a8e',
      weight: isHovered ? 3 : 1.5,
      dashArray: isHovered ? '0' : '5, 5',
    };
  };

  return (
    <div 
      ref={mapContainerRef}
      onMouseMove={handleMouseMove}
      className="relative h-[700px] w-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-50 cursor-crosshair"
    >
      
      {/* 🎯 TACTICAL HUD TARGETING (Kursor Follower) - Desktop Only */}
      {hoveredData && (
        <div 
          className="absolute z-[1005] pointer-events-none hidden md:block"
          style={{ 
            left: mousePos.x + 30, 
            top: mousePos.y - 30,
            transition: 'left 0.05s linear, top 0.05s linear'
          }}
        >
          <div className="relative p-4 min-w-[200px] backdrop-blur-sm bg-slate-900/40 border border-yellow-400/20">
            {/* CORNER BRACKETS */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-400"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-400"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400"></div>

            {/* SCANLINE */}
            <div className="absolute inset-0 overflow-hidden">
               <div className="w-full h-[2px] bg-yellow-400/30 shadow-[0_0_10px_#ffc107] animate-scanline"></div>
            </div>

            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex justify-between items-center border-b border-yellow-400/30 pb-1 mb-1">
                <span className="text-[9px] font-black text-yellow-400 tracking-[0.2em] animate-pulse">
                  {hoveredData.type}_IDENTIFIED
                </span>
                <span className="text-[8px] font-mono text-white/50">TRK_ID: {Math.floor(Math.random() * 900) + 100}</span>
              </div>
              
              <div className="text-white text-xl font-black tracking-tighter uppercase leading-none italic">
                {hoveredData.name}
              </div>

              {/* DYNAMIC COORDINATES DATA */}
              <div className="flex gap-4 mt-2 border-t border-white/10 pt-2">
                <div className="flex flex-col">
                  <span className="text-[7px] text-white/40 font-mono">LAT_REF</span>
                  <span className="text-[9px] text-white font-mono">{hoveredData.lat || "-7.426"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] text-white/40 font-mono">LNG_REF</span>
                  <span className="text-[9px] text-white font-mono">{hoveredData.lng || "109.289"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] text-white/40 font-mono">SIGNAL</span>
                  <span className="text-[9px] text-green-400 font-mono">LOCK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📱 HUD MOBILE (Fixed Center Top) */}
      {hoveredData && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1002] md:hidden w-[85%] animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900/95 p-4 rounded-2xl border-b-4 border-yellow-400 shadow-2xl flex flex-col items-center">
            <span className="text-yellow-400 text-[8px] font-black tracking-[0.3em] mb-1">TARGET_LOCKED</span>
            <span className="text-white font-black uppercase text-lg tracking-tighter italic">
               {hoveredData.name}
            </span>
            <div className="flex gap-4 mt-1">
               <span className="text-[8px] text-white/50 font-mono">{hoveredData.lat}</span>
               <span className="text-[8px] text-white/50 font-mono">{hoveredData.lng}</span>
            </div>
          </div>
        </div>
      )}

      <MapContainer 
        {...({
          center: center,
          zoom: 13,
          zoomControl: false,
          style: { height: '100%', width: '100%' }
        } as any)}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <ZoomControl position="bottomright" />

        {geoData && (
          <GeoJSON 
            data={geoData} 
            style={sectorStyle} 
            onEachFeature={(feature, layer) => {
              const name = (feature.properties.nm_kelurahan || feature.properties.NAMOBJ).toUpperCase();
              // Kalkulasi titik tengah sektor untuk koordinat HUD
              const centerPoint = (layer as any).getBounds().getCenter();

              layer.on({
                mouseover: () => setHoveredData({ 
                    name, 
                    type: 'SECTOR',
                    lat: centerPoint.lat.toFixed(4),
                    lng: centerPoint.lng.toFixed(4)
                }),
                mouseout: () => setHoveredData(null),
                click: () => setHoveredData({ 
                    name, 
                    type: 'SECTOR',
                    lat: centerPoint.lat.toFixed(4),
                    lng: centerPoint.lng.toFixed(4)
                })
              });
            }}
          />
        )}

        {rantings.map((prm) => {
          if (!prm.latitude || !prm.longitude) return null;
          const pos: [number, number] = [parseFloat(prm.latitude), parseFloat(prm.longitude)];
          return (
            <FeatureGroup key={prm._id}>
              <Marker 
                position={pos} 
                eventHandlers={{
                  mouseover: () => setHoveredData({ 
                      name: `PRM ${prm.name.toUpperCase()}`, 
                      type: 'NODE',
                      lat: pos[0].toFixed(4),
                      lng: pos[1].toFixed(4)
                  }),
                  mouseout: () => setHoveredData(null),
                  click: () => setHoveredData({ 
                      name: `PRM ${prm.name.toUpperCase()}`, 
                      type: 'NODE',
                      lat: pos[0].toFixed(4),
                      lng: pos[1].toFixed(4)
                  })
                }}
                icon={new L.DivIcon({
                  className: 'military-node',
                  html: `<div class="node-scanner"></div><div class="node-core"></div>`,
                  iconSize: [20, 20], iconAnchor: [10, 10]
                })}
              >
                <Popup>
                   <div className="font-bold text-slate-800">PRM {prm.name}</div>
                </Popup>
              </Marker>
            </FeatureGroup>
          );
        })}
      </MapContainer>

      {/* 📡 SYSTEM STATUS OVERLAY - RED ALERT EDITION */}
      <div className="absolute top-8 right-8 z-[1001] hidden sm:block">
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-[1.5rem] border border-slate-200 shadow-2xl min-w-[200px]">
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-[0_0_10px_#dc2626]"></span>
                </div>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest animate-pulse">Live_Signal</span>
             </div>
             <span className="text-[8px] font-mono text-slate-400">PCM_KM_02</span>
           </div>
           
           <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{rantings.length}</div>
              <div className="text-lg font-black text-slate-400 tracking-tight uppercase">Ranting</div>
           </div>
           
           <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[8px] font-bold text-blue-600 uppercase">Grid_Map_Live</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-100 rounded-full"></div>
              </div>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
        .animate-scanline { animation: scanline 2s linear infinite; }
        .node-core { width: 12px; height: 12px; background: #ffc107; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 10px #ffc107; position: relative; z-index: 2; }
        .node-scanner { position: absolute; width: 34px; height: 34px; border: 1px solid #ffc107; border-radius: 50%; top: -11px; left: -11px; animation: scan 2.5s infinite linear; opacity: 0.4; }
        @keyframes scan { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
        .leaflet-container { background: #f8fafc !important; cursor: crosshair !important; }
        .military-node { display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}