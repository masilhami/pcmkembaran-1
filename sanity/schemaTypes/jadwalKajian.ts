import { defineType, defineField } from 'sanity'
import { CalendarIcon } from '@sanity/icons'

export default defineType({
  name: 'jadwalKajian',
  title: 'Pusat Jadwal Kajian',
  type: 'document',
  icon: CalendarIcon,
  // Mengelompokkan field agar UI tidak terlalu panjang ke bawah
  groups: [
    { name: 'waktu', title: 'Konfigurasi Waktu' },
    { name: 'detail', title: 'Detail Kajian' },
  ],
  fields: [
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

    /* --- KHUSUS RUTIN --- */
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
      description: 'Pilih pekan ke berapa kajian diadakan. KOSONGKAN jika diadakan SETIAP PEKAN.',
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

    /* --- KHUSUS INSIDENTAL --- */
    defineField({
      name: 'tanggal',
      title: 'Tanggal Pelaksanaan',
      type: 'date',
      group: 'waktu',
      description: 'Hanya untuk pengajian sekali jalan (Tabligh Akbar).',
      hidden: ({ document }) => document?.tipe !== 'insidental',
    }),

    /* --- DETAIL KAJIAN (Muncul di semua tipe) --- */
    defineField({
      name: 'masjid',
      title: 'Lokasi Masjid',
      type: 'reference',
      group: 'detail',
      to: [{ type: 'masjid' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ustadz',
      title: 'Ustadz / Pemateri',
      type: 'string',
      group: 'detail',
      placeholder: 'Contoh: Ustadz Fulan, Lc.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tema',
      title: 'Tema Kajian',
      type: 'string',
      group: 'detail',
      placeholder: 'Contoh: Kitab Riyadhus Shalihin',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'waktu',
      title: 'Waktu / Jam',
      type: 'string',
      group: 'detail',
      placeholder: 'Contoh: Ba\'da Maghrib - Selesai',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'keterangan',
      title: 'Keterangan Tambahan',
      type: 'text',
      group: 'detail',
      rows: 3,
      placeholder: 'Contoh: Khusus Ikhwan / Umum',
    }),
  ],
})