"use client";

import React, { useEffect, useState } from "react";

export default function InstallationTracker() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Mencegah browser menampilkan prompt bawaan otomatis
      e.preventDefault();
      // Simpan event agar bisa dipicu nanti lewat tombol kuning
      setDeferredPrompt(e);
      setIsReadyToInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Cek apakah aplikasi sudah berjalan dalam mode PWA terinstall
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsReadyToInstall(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Tampilkan prompt instalasi PWA
    deferredPrompt.prompt();
    
    // Tunggu jawaban dari user (di-install atau di-cancel)
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Bersihkan prompt karena hanya bisa digunakan sekali
    setDeferredPrompt(null);
    setIsReadyToInstall(false);
  };

  // Jika browser tidak mendukung atau aplikasi sudah terinstall, jangan render apa pun
  if (!isReadyToInstall) return null;

  return (
    /* KUNCI UTAMA: Posisinya dipaksa pindah ke kiri bawah menggunakan class Tailwind!
      - fixed: Melayang di atas konten lain
      - bottom-20: Ditinggikan sedikit (sekitar 80px) agar di mobile tidak menutupi menu navigasi bawah jika ada
      - left-4: Mepet ke pojok kiri layar (berlawanan dengan tombol player merah di kanan)
      - z-[999]: Memastikan tombol berada di lapisan paling atas, tidak tertutup banner/artikel
    */
    <div className="fixed bottom-20 left-4 z-[999] md:bottom-6 md:left-6 animate-fade-in">
      <button
        onClick={handleInstallClick}
        className="bg-amber-400 hover:bg-amber-500 text-blue-950 font-bold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-2xl transition-all duration-300 transform hover:scale-105 border border-amber-300"
      >
        {/* Icon Download / Install */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={300}
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        <span className="text-xs md:text-sm tracking-wide">INSTALL APLIKASI</span>
      </button>
    </div>
  );
}