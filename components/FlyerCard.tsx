'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Maximize2, X } from 'lucide-react'

export default function FlyerCard({ imageUrl, tema }: { imageUrl: string, tema: string }) {
  const [isZoomed, setIsZoomed] = useState(false)

  // Fungsi untuk download paksa gambar asli
  const handleDownload = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Flyer-${tema.replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative group">
      {/* 1. TAMPILAN FLYER DI HALAMAN */}
      <motion.div 
        whileHover={{ scale: 1.02, y: -5 }}
        className="relative cursor-pointer rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white aspect-[1/1] bg-slate-100"
        onClick={() => setIsZoomed(true)}
      >
        <img src={imageUrl} alt={tema} className="w-full h-full object-cover" />
        
        {/* Overlay saat hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
            <Maximize2 size={24} />
          </div>
        </div>
      </motion.div>

      {/* 2. TOMBOL DOWNLOAD DI BAWAH GAMBAR */}
      <button 
        onClick={handleDownload}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-[#004a8e] hover:text-white text-[#004a8e] font-black py-4 rounded-2xl border-2 border-[#004a8e] transition-all shadow-lg active:scale-95"
      >
        <Download size={20} /> DOWNLOAD FLYER HD
      </button>

      {/* 3. EFEK ZOOM (LIGHTBOX MODAL) */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setIsZoomed(false)}
          >
            <motion.button 
              className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-red-500 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <X size={32} />
            </motion.button>

            <motion.img 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              src={imageUrl} 
              alt={tema}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()} // Supaya tidak close saat gambar diklik
            />
            
            <div className="absolute bottom-10 flex gap-4">
               <button 
                onClick={handleDownload}
                className="bg-white text-black px-8 py-3 rounded-full font-black flex items-center gap-2 hover:bg-yellow-400 transition-colors"
               >
                 <Download size={20} /> SIMPAN KE GALERI
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}