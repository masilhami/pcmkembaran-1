"use client"; // 🌟 Kunci utama agar ssr: false diizinkan oleh Next.js

import dynamic from "next/dynamic";

// Pindahkan pemanggilan malas (lazy load) ke dalam kasta Client Component
const LatestArticlesSidebarNoSSR = dynamic(
  () => import("@/components/LatestArticlesSidebar"),
  { 
    ssr: false,
    loading: () => <div style={{ backgroundColor: "rgb(0, 74, 142)", borderTopLeftRadius: "20px", minHeight: "400px", width: "340px" }} />
  }
);

export default function DynamicSidebar() {
  return <LatestArticlesSidebarNoSSR />;
}