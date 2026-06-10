"use client";

import React, { useEffect, useState } from "react";

export default function InstallationTracker() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Pencegah double render akibat hydration mismatch

  useEffect(() => {
    setIsMounted(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyToInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsReadyToInstall(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Aplikasi siap di-install! Jika Anda menggunakan Chrome/Edge, Anda juga bisa klik ikon instalasi langsung di bilah alamat browser.");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsReadyToInstall(false);
  };

  // Jika komponen belum terpasang sempurna di client, jangan render HTML apapun
  if (!isMounted) return null;

  return (
    /* FIX RESPONSIF & POSISI: 
      - block: Menampilkan tombol di layar HP/Mobile.
      - md:hidden: Menyembunyikan tombol secara total saat resolusi layar naik ke ukuran PC/Desktop (Medium ke atas).
      - left-4 bottom-24: Mengunci posisi melayang di pojok kiri bawah layar agar aman dari player kanan bawah.
    */
    <div className="fixed bottom-24 left-4 z-[9999] block md:hidden transition-all duration-300">
      <button
        onClick={handleInstallClick}
        className="bg-amber-400 hover:bg-amber-500 text-blue-950 font-bold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-2xl transform active:scale-95 border border-amber-300 transition-all"
      >
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
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        <span className="text-xs tracking-wide font-extrabold">INSTALL WEB</span>
      </button>
    </div>
  );
}