import { MetadataRoute } from 'next'
import { client } from "@/lib/sanity.client";

// 🌟 PERBAIKAN SAKTI 1: Paksa sitemap di-generate dinamis saat diakses user/Google bot,
// agar Netlify tidak mencoba menembak Sanity API yang sedang limit saat proses build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pcmkembaran.com';

  // 1. DAFTAR HALAMAN STATIS UTAMA (Amankan di awal agar selalu tampil)
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/ranting`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/khutbah`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  // 🌟 PERBAIKAN SAKTI 2: Bungkus fetch Sanity dengan try-catch.
  // Jika Sanity melempar error 402 (Plan Limit Reached), build tetap aman dan tidak gagal!
  try {
    // AMBIL SEMUA SLUG DARI SANITY (Berita, Artikel, Khutbah)
    const query = `*[_type == "post"] {
      "slug": slug,
      "category": category,
      "_updatedAt": _updatedAt
    }`;
    
    const posts = await client.fetch(query);

    // PETAKAN DATA DARI SANITY KE FORMAT SITEMAP
    if (Array.isArray(posts)) {
      dynamicRoutes = posts.map((post: any) => {
        // Amankan jika slug atau properti slug.current berbentuk objek/string kosong
        const postSlug = typeof post.slug === 'object' ? post.slug?.current : post.slug;
        const categoryPath = post.category?.toLowerCase().replace(/\s+/g, '-') || "berita";
        
        return {
          url: `${baseUrl}/${categoryPath}/${postSlug}`,
          lastModified: post._updatedAt ? new Date(post._updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      });
    }
  } catch (err) {
    // Jika Sanity error/limit, log tampil di konsol Netlify, tapi return halaman statis tetap lolos
    console.warn("⚠️ Sanity API error/limit dicuekin dulu demi kelolosan build:", err);
  }

  // Gabungkan rute statis dan dinamis (jika dynamicRoutes kosong karena Sanity limit, sitemap statis tetap aman)
  return [...staticRoutes, ...dynamicRoutes];
}