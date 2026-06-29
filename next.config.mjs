/** @type {import('next').NextConfig} */
// Menggunakan library yang lebih modern untuk menghindari WorkerError
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public", // Lokasi file service worker
  cacheOnFrontEndNav: true, // Meningkatkan kecepatan navigasi
  aggressiveFrontEndNavCaching: true, // Caching lebih agresif untuk performa
  reloadOnOnline: true, // Muat ulang otomatis saat koneksi kembali
  disable: process.env.NODE_ENV === "development", // Matikan di mode dev agar tidak mengganggu
});

const nextConfig = {
  // Solusi untuk error Turbopack & Call retries exceeded
  turbopack: {}, 
  
  /* =========================================================================
      🛡️ BENTENG DEFLEKSI ABSOLUT: DIRECT REDIRECT (ANTI-BONCOS BANDWIDTH VERCEL)
     ========================================================================= */
  async redirects() {
    return [
      {
        source: "/radio/stream.php",
        // 🟢 MENGUSIR REQUEST BINER AUDIO LANGSUNG KE BACKEND HAWKHOST RADIO BERKEMAJUAN!
        // Ganti 'https://domain-laravel-berkemajuan-antum.com' dengan domain Laravel milik Radio Berkemajuan.
        destination: "https://sdit.my.id/radio/stream.php",
        permanent: true, // Status 308 (Permanent Redirect) agar Radio Garden & browser langsung belok tanpa gedor Vercel
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io', // Tetap izinkan gambar dari Sanity
      },
    ],
  },
};

export default withPWA(nextConfig);