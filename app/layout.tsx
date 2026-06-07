// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Amiri, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

// Components
import RootClient from '@/components/RootClient';
import LayoutWrapper from "@/components/LayoutWrapper";
import InstallationTracker from "@/components/InstallationTracker"; 
import BottomPlayer from '@/components/BottomPlayer';
import YouTubeManager from '@/components/YouTubeManager';
import { AudioProvider } from '@/context/AudioContext';

// FONT LATIN
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
  weight: ["400","500","600","700","800"]
});

// FONT ARAB
const amiri = Amiri({ subsets: ["arabic"], weight: ["400","700"], variable: "--font-amiri" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400","500","600","700","900"], variable: "--font-noto-arabic" });

// VIEWPORT
export const viewport: Viewport = {
  themeColor: "#004a8e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// METADATA SEO
export const metadata: Metadata = {
  metadataBase: new URL('https://pcmkembaran.com'), 
  title: {
    default: "PCM Kembaran - Dakwah Berkemajuan, Mencerahkan Kehidupan",
    template: "%s | PCM Kembaran"
  },
  description: "Portal resmi Pimpinan Cabang Muhammadiyah Kembaran. Pusat edukasi, literasi Islam, khutbah Jumat, dan informasi dakwah berkemajuan di wilayah Banyumas.",
  keywords: ["PCM Kembaran","Muhammadiyah Kembaran","Dakwah Berkemajuan","Khutbah Jumat Banyumas","Portal Islam Kembaran","Banyumas"],
  manifest: "/manifest.json",
  robots: { index: true, follow: true, googleBot: { index:true, follow:true, 'max-video-preview':-1, 'max-image-preview':'large', 'max-snippet':-1 } },
  appleWebApp: { capable:true, statusBarStyle:"default", title:"PCM Kembaran" },
  openGraph: {
    title: "PCM Kembaran - Dakwah Berkemajuan, Mencerahkan Kehidupan",
    description: "Menyajikan konten dakwah murni yang menyejukkan, mencerahkan, dan berkemajuan.",
    url:'https://pcmkembaran.com',
    siteName:'PCM Kembaran',
    locale:'id_ID',
    type:'website',
    images:[{ url:'/opengraph-image.jpg', width:1200, height:630, alt:'PCM Kembaran'}],
  },
  twitter: { card:'summary_large_image', title:"PCM Kembaran - Dakwah Berkemajuan", description:"Portal resmi Pimpinan Cabang Muhammadiyah Kembaran.", images:['/opengraph-image.jpg'] },
  icons: { icon:[{url:"/favicon.ico",sizes:"any"},{url:"/icon.png",type:"image/png",sizes:"32x32"}], apple:[{url:"/apple-icon.png",sizes:"180x180"}] }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  const jsonLd = {
    "@context":"https://schema.org",
    "@type":"Organization",
    "name":"PCM Kembaran",
    "alternateName":"Pimpinan Cabang Muhammadiyah Kembaran",
    "description":"Portal resmi dakwah dan informasi Pimpinan Cabang Muhammadiyah Kembaran, Banyumas.",
    "url":"https://pcmkembaran.com",
    "logo":"https://pcmkembaran.com/icon.png",
    "address": { "@type":"PostalAddress", "addressLocality":"Kembaran", "addressRegion":"Banyumas", "addressCountry":"ID" },
    "sameAs":["https://www.instagram.com/pcmkembaran.bms/","https://www.youtube.com/@pcmkembaran"],
    "contactPoint": { "@type":"ContactPoint", "telephone":"+62-857-4102-5663", "contactType":"customer service", "areaServed":"ID", "availableLanguage":"Indonesian" }
  };

  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${amiri.variable} ${notoArabic.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>
      </head>
      <body className={`${plusJakartaSans.className} antialiased`} style={{ backgroundColor:'#f8fafc', color:'#0f172a', margin:0, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        
        {/* AUDIO PROVIDER MENUTUP SELURUH APPS */}
        <AudioProvider>
          {/* YOUTUBE MANAGER: PERMANEN & AMAN DARI UNMOUNT */}
          <YouTubeManager />

          {/* PWA INSTALLATION TRACKER */}
          <div className="fixed top-4 right-4 z-50">
            <InstallationTracker />
          </div>

          {/* LAYOUT WRAPPER */}
          <LayoutWrapper>
            <main style={{ flex:1, position:'relative', zIndex:1 }}>
              {children}
            </main>
          </LayoutWrapper>

          {/* Bottom Player */}
          <BottomPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}