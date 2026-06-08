import { Rule } from 'sanity'

export default {
  name: 'radioConfig',
  title: 'Konfigurasi Radio & Live',
  type: 'document',
  icon: () => '📻',
  fieldsets: [
    {
      name: 'stationMetadata',
      title: 'Metadata Stasiun Utama',
      options: { collapsible: true, collapsed: false }
    },
    {
      name: 'broadcastingManagement',
      title: 'Sistem Otomatisasi Jadwal & Acara',
      options: { collapsible: false }
    }
  ],
  fields: [
    // =========================================================================
    // FIELDSET 1: METADATA UTAMA STASIUN
    // =========================================================================
    {
      name: 'radioName',
      title: 'Nama Stasiun Radio',
      type: 'string',
      fieldset: 'stationMetadata',
      initialValue: 'Radio Suara Berkemajuan',
      validation: (rule: Rule) => rule.required().min(3).max(50),
    },
    {
      name: 'stationTagline',
      title: 'Slogan / Tagline Radio',
      type: 'string',
      fieldset: 'stationMetadata',
      initialValue: 'Muhammadiyah Islamic Broadcast',
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: 'fallbackThumbnail',
      title: 'Cover Art Default (Fallback)',
      description: 'Gambar banner yang muncul di player jika acara tidak memiliki thumbnail khusus.',
      type: 'image',
      fieldset: 'stationMetadata',
      options: { hotspot: true },
    },

    // =========================================================================
    // FIELDSET 2: SISTEM JADWAL hybrid 24 JAM
    // =========================================================================
    {
      name: 'schedules',
      title: 'Rangkaian Jadwal Siaran 24 Jam',
      description: 'Susun daftar rangkaian acara harian berdasarkan alokasi waktu jam aktif di bawah ini.',
      fieldset: 'broadcastingManagement',
      type: 'array',
      validation: (rule: Rule) => rule.required().min(1).error('Minimal harus ada 1 jadwal siaran aktif.'),
      of: [
        {
          type: 'object',
          name: 'radioSchedule',
          title: 'Blok Jadwal Siaran',
          icon: () => '🕒',
          fields: [
            {
              name: 'eventName',
              title: 'Nama Acara / Judul Kajian',
              type: 'string',
              validation: (rule: Rule) => rule.required().error('Nama acara wajib diisi.'),
            },
            {
              name: 'speaker',
              title: 'Narasumber / Murattal Oleh',
              type: 'string',
              description: 'Contoh: Ustadz Dr. KH. Ahmad, S.Ag atau Nama Qori',
              initialValue: 'PCM Kembaran',
            },
            {
              name: 'startTime',
              title: 'Jam Mulai (Format HH:MM)',
              type: 'string',
              description: 'Gunakan format 24 jam dengan batas penulisan yang ketat. Contoh: 04:30, 09:00, 18:20',
              placeholder: '04:30',
              validation: (rule: Rule) => 
                rule.required()
                    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { name: 'format jam (HH:MM)' })
                    .error('Format jam harus valid (HH:MM), contoh: 05:00 atau 21:45'),
            },
            {
              name: 'endTime',
              title: 'Jam Selesai (Format HH:MM)',
              type: 'string',
              description: 'Contoh: 06:00, 11:30, 20:00',
              placeholder: '06:00',
              validation: (rule: Rule) => 
                rule.required()
                    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { name: 'format jam (HH:MM)' })
                    .error('Format jam harus valid (HH:MM), contoh: 06:30 atau 22:00'),
            },
            {
              name: 'broadcastMode',
              title: 'Mode Transmisi Siaran',
              type: 'string',
              options: {
                list: [
                  { title: '🎥 Live Streaming YouTube API', value: 'youtube_live' },
                  { title: '🎵 Playlist Audio MP3 Cloud', value: 'playlist_mp3' },
                ],
                layout: 'radio', 
              },
              initialValue: 'playlist_mp3',
              validation: (rule: Rule) => rule.required(),
            },
            
            // -----------------------------------------------------------------
            // FIELD KONDISIONAL: HANYA MUNCUL JIKA MEMILIH MODE YOUTUBE LIVE
            // -----------------------------------------------------------------
            {
              name: 'youtubeVideoId',
              title: 'YouTube Video ID',
              type: 'string',
              description: 'Masukkan kode unik ID videonya saja dari tautan URL live streaming YouTube. Contoh: dQw4w9WgXcQ',
              placeholder: 'dQw4w9WgXcQ',
              hidden: ({ parent }: any) => parent?.broadcastMode !== 'youtube_live',
              validation: (rule: Rule) =>
                rule.custom((value, context: any) => {
                  if (context.parent?.broadcastMode === 'youtube_live' && !value) {
                    return 'Video ID wajib diisi jika Anda memilih mode Live YouTube.';
                  }
                  return true;
                }),
            },

            // -----------------------------------------------------------------
            // FIELD KONDISIONAL: HANYA MUNCUL JIKA MEMILIH MODE PLAYLIST MP3
            // -----------------------------------------------------------------
            {
              name: 'playlist',
              title: 'Daftar File Konten MP3 (Antrean Playlist)',
              description: 'Unggah kumpulan file rekaman audio murottal/kajian yang akan diputar berurutan di jam ini.',
              type: 'array',
              hidden: ({ parent }: any) => parent?.broadcastMode !== 'playlist_mp3',
              validation: (rule: Rule) =>
                rule.custom((value, context: any) => {
                  // TYPE FIX: Casting ke array untuk menghindari error strict type check di Next.js
                  const tracks = value as any[];
                  if (context.parent?.broadcastMode === 'playlist_mp3' && (!tracks || tracks.length === 0)) {
                    return 'Minimal unggah 1 file audio MP3 ke dalam playlist antrean.';
                  }
                  return true;
                }),
              of: [
                {
                  type: 'object',
                  name: 'track',
                  title: 'Track Rekaman Audio',
                  icon: () => '🎵',
                  fields: [
                    { 
                      name: 'trackTitle', 
                      title: 'Judul Lagu / Sub-Materi', 
                      type: 'string', 
                      validation: (rule: Rule) => rule.required().error('Judul track audio tidak boleh kosong.')
                    },
                    { 
                      name: 'speaker', 
                      title: 'Artis / Pembicara Spesifik', 
                      type: 'string' 
                    },
                    { 
                      name: 'audioFile', 
                      title: 'File Audio mentah (.mp3)', 
                      type: 'file',
                      options: { accept: 'audio/mp3, audio/mpeg' },
                      validation: (rule: Rule) => rule.required().error('Wajib mengunggah file MP3 untuk track ini.')
                    },
                  ],
                  preview: {
                    select: {
                      title: 'trackTitle',
                      artist: 'speaker',
                    },
                    prepare(selection: any) {
                      const { title, artist } = selection
                      return {
                        title: title || 'Track Tanpa Judul',
                        subtitle: artist ? `👤 ${artist}` : '👤 PCM Kembaran',
                      }
                    },
                  },
                },
              ],
            },
          ],
          
          // Layout preview list item di dashboard admin agar dinamis & informatif
          preview: {
            select: {
              title: 'eventName',
              start: 'startTime',
              end: 'endTime',
              mode: 'broadcastMode',
              speakerName: 'speaker'
            },
            prepare(selection: any) {
              const { title, start, end, mode, speakerName } = selection
              const modeIcon = mode === 'youtube_live' ? '🎥 [YT LIVE]' : '🎵 [MP3 LIST]'
              return {
                title: `${start || '00:00'} - ${end || '00:00'} | ${title || 'Acara Baru'}`,
                subtitle: `${modeIcon} — Oleh: ${speakerName || 'PCM Kembaran'}`,
              }
            },
          },
        },
      ],
    },
  ],
}