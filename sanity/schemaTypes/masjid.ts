import { defineField, defineType } from 'sanity'
import { HomeIcon, PinIcon, InfoOutlineIcon, ImageIcon, CheckmarkCircleIcon } from '@sanity/icons'

export default defineType({
  name: 'masjid',
  title: 'Pusat Masjid & Dakwah',
  type: 'document',
  icon: HomeIcon,
  // 1. PENGELOMPOKAN (Tabs) - Bikin UI Sanity jadi Modern & Rapih
  groups: [
    { name: 'utama', title: 'Informasi Utama', icon: InfoOutlineIcon },
    { name: 'media', title: 'Visual & Lokasi', icon: ImageIcon },
    { name: 'fasilitas', title: 'Sarana Fasilitas', icon: CheckmarkCircleIcon },
  ],
  fields: [
    /* --- TAB: INFORMASI UTAMA --- */
    defineField({
      name: 'name',
      title: 'Nama Masjid',
      type: 'string',
      group: 'utama',
      placeholder: 'Contoh: Masjid At-Taqwa Kembaran',
      validation: (Rule) => Rule.required().min(5).error('Nama masjid terlalu pendek.'),
    }),

    defineField({
      name: 'slug',
      title: 'Slug (Kunci URL)',
      type: 'slug',
      group: 'utama',
      description: 'WAJIB KLIK GENERATE! Ini agar masjid punya halaman detail sendiri.',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Slug kosong akan menyebabkan error "null" di website.'),
    }),

    defineField({
      name: 'address',
      title: 'Alamat Lengkap',
      type: 'text',
      group: 'utama',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'takmirContact',
      title: 'Kontak Takmir / WhatsApp',
      type: 'string',
      group: 'utama',
      placeholder: 'Contoh: 0857... (Sony Martin)',
    }),

    /* --- TAB: MEDIA & LOKASI --- */
    defineField({
      name: 'image',
      title: 'Foto Utama Masjid',
      type: 'image',
      group: 'media',
      description: 'Gunakan foto landscape berkualitas tinggi.',
      options: { hotspot: true },
      validation: (Rule) => Rule.required().error('Foto masjid wajib diunggah.'),
    }),

    defineField({
      name: 'locationUrl',
      title: 'Link Google Maps',
      type: 'url',
      group: 'media',
      description: 'Tempelkan link "Share" atau "Bagikan" dari Google Maps.',
    }),

    /* --- TAB: SARANA & FASILITAS (CANGGIH) --- */
    defineField({
      name: 'fasilitas',
      title: 'Fasilitas Tersedia',
      type: 'array',
      group: 'fasilitas',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'AC / Penyejuk Udara', value: 'AC' },
          { title: 'Parkir Luas', value: 'Parkir Luas' },
          { title: 'Akses Difabel', value: 'Akses Difabel' },
          { title: 'Area Ikhwan & Akhwat Terpisah', value: 'Hijab Syari' },
          { title: 'Free Wi-Fi', value: 'Wi-Fi' },
          { title: 'Perpustakaan Masjid', value: 'Perpustakaan' },
          { title: 'Kantin / Food Court', value: 'Kantin' },
        ],
        layout: 'grid',
      },
    }),

    defineField({
      name: 'kapasitas',
      title: 'Kapasitas Jamaah',
      type: 'number',
      group: 'fasilitas',
      description: 'Estimasi jumlah total jamaah yang bisa tertampung.',
    }),

    /* --- PENGATURAN TAMPILAN --- */
    defineField({
      name: 'order',
      title: 'Urutan Tampil (Prioritas)',
      type: 'number',
      group: 'utama',
      description: 'Semakin kecil angka, semakin atas posisinya (Contoh: 1, 2, 3).',
    }),
  ],
  
  // LOGIKA PREVIEW SIDEBAR
  preview: {
    select: {
      title: 'name',
      subtitle: 'address',
      media: 'image',
      kapasitas: 'kapasitas'
    },
    prepare(selection) {
      const { title, subtitle, media, kapasitas } = selection
      return {
        title: title,
        subtitle: `${kapasitas ? `[${kapasitas} Jemaah] ` : ''}${subtitle}`,
        media: media || HomeIcon
      }
    }
  },
})