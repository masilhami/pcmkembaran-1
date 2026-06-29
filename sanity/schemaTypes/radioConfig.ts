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
    // FIELDSET 2: SISTEM JADWAL TUNGGAL 24 JAM & MINGGUAN (HYBRID)
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
              name: 'day',
              title: 'Hari Siaran',
              type: 'string',
              description: 'Pilih hari spesifik untuk jadwal ini. Pilih "Setiap Hari" jika rutin tayang tiap hari.',
              options: {
                list: [
                  { title: '🔄 Setiap Hari', value: 'everyday' },
                  { title: 'Senin', value: 'Monday' },
                  { title: 'Selasa', value: 'Tuesday' },
                  { title: 'Rabu', value: 'Wednesday' },
                  { title: 'Kamis', value: 'Thursday' },
                  { title: 'Jumat', value: 'Friday' },
                  { title: 'Sabtu', value: 'Saturday' },
                  { title: 'Minggu', value: 'Sunday' },
                ],
              },
              initialValue: 'everyday',
              validation: (rule: Rule) => rule.required().error('Hari siaran wajib ditentukan.'),
            },
            {
              name: 'eventName',
              title: 'Nama Acara / Kajian',
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
              description: 'Gunakan format 24 jam dengan batas penulisan yang ketat. Contoh: 04:30, 09:00, 18:15',
              placeholder: '04:30',
              validation: (rule: Rule) => rule.required().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { name: 'HH:MM format' }),
            },
            {
              name: 'endTime',
              title: 'Jam Selesai (Format HH:MM)',
              type: 'string',
              description: 'Contoh: 06:00, 11:30, 19:30',
              validation: (rule: Rule) => rule.required().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { name: 'HH:MM format' }),
            },
            {
              name: 'broadcastMode',
              title: 'Mode Siaran Jam Ini',
              type: 'string',
              options: {
                list: [
                  { title: '🎥 Live YouTube', value: 'youtube_live' },
                  { title: '🎵 Playlist MP3 (Archive.org Teks URL)', value: 'playlist_mp3' },
                  { title: '📻 Relay Radio FM / Live Stream Lain', value: 'relay_stream' },
                ],
                layout: 'radio',
              },
              initialValue: 'playlist_mp3',
              validation: (rule: Rule) => rule.required(),
            },
            
            // -----------------------------------------------------------------
            // FIELD KONDISIONAL: MUNCUL JIKA MEMILIH MODE RELAY RADIO FM
            // -----------------------------------------------------------------
            {
              name: 'relayAudioUrl',
              title: 'URL Stream Radio FM Target (Relay)',
              type: 'url',
              description: 'Masukkan URL Icecast/Shoutcast resmi radio target.',
              placeholder: 'http://streaming.radiomu.id:8000/stream',
              hidden: ({ parent }: any) => parent?.broadcastMode !== 'relay_stream',
              validation: (rule: Rule) =>
                rule.custom((value, context: any) => {
                  if (context.parent?.broadcastMode === 'relay_stream' && !value) {
                    return 'URL Stream Relay wajib diisi jika memilih mode Relay Radio.';
                  }
                  return true;
                }),
            },

            // -----------------------------------------------------------------
            // FIELD KONDISIONAL: MUNCUL JIKA MEMILIH MODE YOUTUBE LIVE
            // -----------------------------------------------------------------
            {
              name: 'youtubeVideoId',
              title: 'YouTube Video ID',
              type: 'string',
              description: 'Masukkan ID video saja dari tautan live streaming YouTube. (Contoh: dQw4w9WgXcQ)',
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
            // 🛑 FIELD KONDISIONAL PLAYLIST: DISECURE ANTI-UPLOAD MANUAL SANITY
            // -----------------------------------------------------------------
            {
              name: 'playlist',
              title: 'Daftar Antrean File MP3 (Bypass CDN Link)',
              type: 'array',
              hidden: ({ parent }: any) => parent?.broadcastMode !== 'playlist_mp3',
              validation: (rule: Rule) =>
                rule.custom((value, context: any) => {
                  const tracks = value as any[];
                  if (context.parent?.broadcastMode === 'playlist_mp3' && (!tracks || tracks.length === 0)) {
                    return 'Minimal harus menginput 1 track data URL ke dalam playlist.';
                  }
                  return true;
                }),
              of: [
                {
                  type: 'object',
                  name: 'track',
                  title: 'Track Audio',
                  icon: () => '🎵',
                  fields: [
                    // 🟢 PERBAIKAN SAKRAL 1: Tombol file upload dihapus total! Diganti input text URL murni.
                    { 
                      name: 'audioUrl', 
                      title: 'Direct Link MP3 Dari Archive.org', 
                      type: 'url',
                      description: 'Wajib masukkan tautan langsung berakhiran .mp3 dari archive.org (Contoh: https://archive.org/download/nama-folder/file.mp3)',
                      placeholder: 'https://archive.org/download/...',
                      validation: (rule: Rule) => 
                        rule.required()
                            .uri({ scheme: ['http', 'https'] })
                            .custom((value: string | undefined) => {
                              if (value && !value.toLowerCase().includes('archive.org')) {
                                return '🚨 BAHAYA! Wajib menggunakan server host archive.org agar kuota Sanity/Vercel tidak jebol!';
                              }
                              return true;
                            })
                    },
                    { 
                      name: 'trackTitle', 
                      title: 'Judul Track Audio / Nama Kajian', 
                      type: 'string',
                      validation: (rule: Rule) => rule.required().error('Judul rekaman wajib ditulis.')
                    },
                    { 
                      name: 'speaker', 
                      title: 'Narasumber / Pengisi Acara (Opsional)', 
                      type: 'string',
                      description: 'Kosongkan jika ingin otomatis mengikuti nama pembicara utama di atas.',
                    },
                    // 🟢 PERBAIKAN SAKRAL 2: Sediakan input durasi manual (dalam format detik)
                    // Karena file tidak lagi diupload ke Sanity, metadata duration internal tidak bisa dibaca otomatis.
                    {
                      name: 'duration',
                      title: 'Durasi Total Audio (Hitungan Detik)',
                      type: 'number',
                      description: 'Hitung durasi file dalam satuan detik murni. Contoh: Jika durasi kajian 1 jam 15 menit, maka isi: 4500.',
                      validation: (rule: Rule) => rule.required().positive().integer().error('Durasi dalam detik wajib diisi angka bulat.')
                    }
                  ],
                  preview: {
                    select: {
                      title: 'trackTitle',
                      artist: 'speaker',
                      url: 'audioUrl'
                    },
                    prepare(selection: any) {
                      const { title, artist, url } = selection;
                      return {
                        title: title || 'Track Tanpa Judul',
                        subtitle: artist ? `👤 ${artist} | 🔗 Link Aman` : `👤 Pengisi Blok | 🔗 Link Aman`,
                      }
                    },
                  },
                },
              ],
            },
          ],
          
          preview: {
            select: {
              title: 'eventName',
              start: 'startTime',
              end: 'endTime',
              mode: 'broadcastMode',
              speakerName: 'speaker',
              daySelected: 'day'
            },
            prepare(selection: any) {
              const { title, start, end, mode, speakerName, daySelected } = selection
              
              let modeLabel = '🎵 MP3 Playlist'
              if (mode === 'youtube_live') modeLabel = '🎥 YT Live'
              if (mode === 'relay_stream') modeLabel = '📻 FM Relay'
              
              const dayLabels: Record<string, string> = {
                everyday: 'Setiap Hari',
                Monday: 'Senin',
                Tuesday: 'Selasa',
                Wednesday: 'Rabu',
                Thursday: 'Kamis',
                Friday: 'Jumat',
                Saturday: 'Sabtu',
                Sunday: 'Minggu'
              }
              const activeDay = dayLabels[daySelected || 'everyday'] || 'Setiap Hari'

              return {
                title: title || 'Acara Tanpa Nama',
                subtitle: `📅 [${activeDay}] 🕒 ${start || '00:00'} - ${end || '00:00'} | ${modeLabel} — Oleh: ${speakerName || 'PCM Kembaran'}`,
              }
            },
          },
        },
      ],
    },
  ],
}