import { defineType, defineField } from 'sanity'
import { CalendarIcon } from '@sanity/icons'

export default defineType({
  name: 'jadwalKajian',
  title: 'Pusat Jadwal Kajian',
  type: 'document',
  icon: CalendarIcon,
  // Kelompok agar formulir rapi (Grouping)
  groups: [
    { name: 'waktu', title: 'Konfigurasi Waktu' },
    { name: 'detail', title: 'Detail Kajian' },
    { name: 'meta', title: 'Media & Publikasi' },
  ],
  fields: [
    /* --- 1. IDENTITAS UTAMA --- */
    defineField({
      name: 'tema',
      title: 'Tema Kajian (Judul)',
      type: 'string',
      group: 'detail',
      placeholder: 'Contoh: Hati Yang Terbelenggu',
      validation: (Rule) => Rule.required().error('Tema wajib diisi untuk judul postingan.'),
    }),

    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'meta',
      options: { 
        source: 'tema', 
        maxLength: 96 
      },
      validation: (Rule) => Rule.required().error('Klik "Generate" untuk membuat link otomatis.'),
    }),

    /* --- 2. PENGATURAN WAKTU & TIPE --- */
    defineField({
      name: 'tipe',
      title: 'Tipe Kajian',
      type: 'string',
      group: 'waktu',
      options: {
        list: [
          { title: 'Rutin (Mingguan/Bulanan)', value: 'rutin' },
          { title: 'Insidental (Tabligh Akbar/Selapanan)', value: 'insidental' },
        ],
        layout: 'radio',
      },
      initialValue: 'rutin',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'hari',
      title: 'Hari Kajian',
      type: 'string',
      group: 'waktu',
      options: {
        list: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'],
      },
      hidden: ({ document }) => document?.tipe !== 'rutin',
    }),

    defineField({
      name: 'pekan',
      title: 'Pekan Ke-',
      description: 'KOSONGKAN jika SETIAP PEKAN. Pilih angka untuk ustadz bergilir (Misal: Ustadz A Pekan 1, Ustadz B Pekan 2).',
      type: 'array',
      group: 'waktu',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Pekan 1', value: '1' },
          { title: 'Pekan 2', value: '2' },
          { title: 'Pekan 3', value: '3' },
          { title: 'Pekan 4', value: '4' },
          { title: 'Pekan 5', value: '5' },
        ],
        layout: 'grid',
      },
      hidden: ({ document }) => document?.tipe !== 'rutin',
    }),

    defineField({
      name: 'tanggal',
      title: 'Tanggal Pelaksanaan',
      type: 'date',
      group: 'waktu',
      description: 'Khusus untuk Tabligh Akbar / Acara sekali jalan.',
      hidden: ({ document }) => document?.tipe !== 'insidental',
    }),

    /* --- 3. DETAIL PEMATERI & LOKASI --- */
    defineField({
      name: 'ustadz',
      title: 'Ustadz / Pemateri',
      type: 'string',
      group: 'detail',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'masjid',
      title: 'Lokasi Masjid',
      type: 'reference',
      group: 'detail',
      to: [{ type: 'masjid' }],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'waktu',
      title: 'Waktu / Jam',
      type: 'string',
      group: 'detail',
      placeholder: 'Pukul 08.00 - Selesai',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'keterangan',
      title: 'Keterangan Tambahan / Deskripsi',
      type: 'text',
      group: 'detail',
      rows: 4,
      placeholder: 'Tuliskan detail deskripsi kajian di sini agar muncul di halaman baca...',
    }),

    /* --- 4. MEDIA (SATU PINTU - ANTI BINGUNG) --- */
    defineField({
      name: 'flyerImage', // Field tunggal yang digunakan untuk semua kebutuhan
      title: 'Foto Flyer / Gambar Utama',
      type: 'image',
      group: 'meta',
      description: 'Satu gambar untuk semua: Muncul di Homepage, Flyer, dan Halaman Baca.',
      options: { hotspot: true }, // Penting agar wajah ustadz tidak terpotong otomatis
      validation: (Rule) => Rule.required().error('Wajib upload satu gambar sebagai identitas visual.'),
    }),

    defineField({
      name: 'publishedAt',
      title: 'Tanggal Publikasi',
      type: 'datetime',
      group: 'meta',
      initialValue: () => (new Date()).toISOString(),
    }),
  ],

  /* --- 🚀 PREVIEW LOGIC (SINKRONISASI SIDEBAR) --- */
  preview: {
    select: {
      title: 'tema',
      ustadz: 'ustadz',
      tipe: 'tipe',
      hari: 'hari',
      tanggal: 'tanggal',
      media: 'flyerImage', // Melihat ke field tunggal yang baru
    },
    prepare(selection) {
      const { title, ustadz, tipe, hari, tanggal, media } = selection
      const detailWaktu = tipe === 'rutin' ? `Rutin: ${hari}` : `Insidental: ${tanggal}`
      
      return {
        title: title || 'Untitled Tema',
        subtitle: `${ustadz} | ${detailWaktu}`,
        media: media || CalendarIcon
      }
    }
  }
})