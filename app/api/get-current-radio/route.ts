import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { client } from "@/lib/sanity.client"; // Dipertahankan sesuai path impor client Sanity Anda

export const dynamic = "force-dynamic"; // Memaksa API selalu fresh tanpa membeku di cache Vercel

// =================================================================
// 1. KONFIGURASI JINGLE OTOMATIS
// =================================================================
const JINGLE_URL = "/audio/jingle-pcm.mp3";
const JINGLE_DURATION = 25;

// =================================================================
// 2. DAFTAR AUDIO CADANGAN (FILLER)
// =================================================================
const FILLER_PLAYLIST = [
  {
    title: "Murottal Jeda - Surah Al-Mulk",
    url: "https://sdit.my.id/radio/SurahAlMulk-Saad-Al-Ghamdi.mp3",
    duration: 415,
  },
  {
    title: "Nasyid Jeda - Rikhie Asbo",
    url: "https://sdit.my.id/radio/Rikhie-Asbo.mp3",
    duration: 5760,
  },
  {
    title: "Murottal Jeda - Surah Al-Waqiah",
    url: "https://sdit.my.id/radio/al-waqiah-ust-shidqy.mp3",
    duration: 780,
  },
  {
    title: "Nasyid Jeda - Hanya Rindu Versi Arab",
    url: "https://sdit.my.id/radio/hanya-rindu-versi-arab.mp3",
    duration: 258,
  },
  {
    title: "Murottal Jeda - Al Fatihah Syaikh Abdullah Al-Mathrud",
    url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/001-Al-Fatihah.mp3",
    duration: 27,
  },
  {
    title: "Murottal Jeda - Al Baqarah Syaikh Abdullah Al-Mathrud",
    url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/002-Al-Baqarah.mp3",
    duration: 7200,
  },
  {
    title: "Murottal Jeda - Ali Imron Syaikh Abdullah Al-Mathrud",
    url: "https://ia801406.us.archive.org/8/items/abdullahal-mathrud/003-Ali-Imran.mp3",
    duration: 4800,
  },
];

const TOTAL_FILLER_DURATION = FILLER_PLAYLIST.reduce(
  (acc, item) => acc + item.duration,
  0
);

// Fungsi pembantu mengubah string "HH:MM" menjadi total menit
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

function titleFromAudioUrl(audioUrl?: string, fallback = "Radio Suara Berkemajuan") {
  if (!audioUrl) return fallback;

  try {
    const url = new URL(audioUrl);
    const rawFilename = url.pathname.split("/").pop() || "";
    const withoutExtension = rawFilename.replace(/\.[a-z0-9]+$/i, "");
    return decodeURIComponent(withoutExtension).replace(/[_-]+/g, " ").trim() || fallback;
  } catch {
    const rawFilename = audioUrl.split("/").pop() || "";
    return rawFilename.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim() || fallback;
  }
}

function getVirtualFillerTrack(gapSeconds: number) {
  if (TOTAL_FILLER_DURATION <= 0) {
    return {
      title: "Radio Suara Berkemajuan",
      audio_url: "",
      elapsed_seconds: 0,
    };
  }

  const virtualTimeline = Math.floor(Math.abs(gapSeconds)) % TOTAL_FILLER_DURATION;
  let accumulatedTime = 0;

  for (const track of FILLER_PLAYLIST) {
    if (virtualTimeline >= accumulatedTime && virtualTimeline < accumulatedTime + track.duration) {
      return {
        title: track.title || titleFromAudioUrl(track.url),
        audio_url: track.url,
        elapsed_seconds: virtualTimeline - accumulatedTime,
      };
    }
    accumulatedTime += track.duration;
  }

  return {
    title: FILLER_PLAYLIST[0].title || titleFromAudioUrl(FILLER_PLAYLIST[0].url),
    audio_url: FILLER_PLAYLIST[0].url,
    elapsed_seconds: 0,
  };
}

// =================================================================
// MAIN HANDLER GET
// =================================================================
export async function GET() {
  try {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    // =================================================================
    // 0. PRIORITAS UTAMA: DETEKSI JADWAL HYBRID + HARI DARI SANITY CMS
    // =================================================================
    try {
      // 🌟 PERBAIKAN: Menambahkan 'relayUrl' ke dalam penarikan query GROQ Sanity
      const sanityQuery = `
        *[_type == "radioConfig"][0] {
          radioName,
          stationTagline,
          schedules[] {
            day,
            eventName,
            speaker,
            startTime,
            endTime,
            broadcastMode,
            youtubeVideoId,
            relayUrl,
            playlist[] {
              trackTitle,
              speaker,
              "audioFileUrl": audioFile.asset->url
            }
          }
        }
      `;
      
      const config = await client.fetch(sanityQuery, {}, { cache: 'no-store' });

      if (config && config.schedules && Array.isArray(config.schedules)) {
        // Ekstraksi Jam, Menit, dan Detik lokal Asia/Jakarta (WIB) yang antipeluru di Vercel
        const timeFormatter = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        const timeParts = timeFormatter.formatToParts(now);
        const currentHours = Number(timeParts.find(p => p.type === 'hour')?.value || 0);
        const currentMinutes = Number(timeParts.find(p => p.type === 'minute')?.value || 0);
        const currentSecs = Number(timeParts.find(p => p.type === 'second')?.value || 0);
        
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        // Ekstraksi Nama Hari Bahasa Inggris (e.g., "Monday", "Tuesday", dsb) sesuai sistem value Sanity
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Jakarta',
          weekday: 'long'
        });
        const currentDayName = dayFormatter.format(now);

        let activeSchedule = null;
        for (const schedule of config.schedules) {
          const start = timeToMinutes(schedule.startTime);
          const end = timeToMinutes(schedule.endTime);

          // Evaluasi Validasi Berlapis: Jam COCOK dan Hari COCOK (Spesifik Hari atau Setiap Hari)
          const isTimeMatch = currentTotalMinutes >= start && currentTotalMinutes < end;
          const isDayMatch = schedule.day === 'everyday' || schedule.day === currentDayName;

          if (isTimeMatch && isDayMatch) {
            activeSchedule = schedule;
            break;
          }
        }

        // JIKA MENEMUKAN JADWAL YANG COCOK SECARA JAM DAN HARI SIARAN
        if (activeSchedule) {
          const isYoutube = activeSchedule.broadcastMode === 'youtube_live';
          const isLiveRelay = activeSchedule.broadcastMode === 'live_relay' || activeSchedule.broadcastMode === 'relay_radio_fm' || activeSchedule.broadcastMode?.includes('relay');
          const stationName = config.radioName || "Radio Suara Berkemajuan";
          const startMinutes = timeToMinutes(activeSchedule.startTime);
          const secondsSinceScheduleStarted = ((currentTotalMinutes - startMinutes) * 60) + currentSecs;
          const ASSUMED_TRACK_DURATION = 3600; 

          // --- MANAJEMEN MODE TRANS-TRANSMISI: YOUTUBE LIVE ---
          if (isYoutube) {
            const videoId = activeSchedule.youtubeVideoId?.trim() || null;
            return NextResponse.json({
              active: true,
              type: "youtube_live",
              youtube_video_id: videoId,
              thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/bg-player.png",
              title: activeSchedule.eventName || "Live Streaming YouTube",
              artist: activeSchedule.speaker || "PCM Kembaran",
              program_title: stationName,
              audio_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
              elapsed_seconds: 0
            });
          }

          // --- MANAJEMEN MODE TRANS-TRANSMISI: LIVE RELAY (ICECAST/BUTT) ---
          if (isLiveRelay) {
            // 🌟 PERBAIKAN: Mengambil URL Target stasiun lain secara dinamis dari input Sanity. 
            // Jika kosong, baru melorot menggunakan internal proxy fallback.
            const dynamicRelayUrl = activeSchedule.relayUrl?.trim() || "/api/radio-stream";

            return NextResponse.json({
              active: true,
              type: "live_relay",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: activeSchedule.eventName || "Live Streaming Radio",
              artist: activeSchedule.speaker || "PCM Kembaran",
              program_title: stationName,
              audio_url: dynamicRelayUrl,
              elapsed_seconds: 0
            });
          }

          // --- MANAJEMEN MODE TRANS-TRANSMISI: PLAYLIST MP3 CLOUD ---
          if (activeSchedule.playlist && activeSchedule.playlist.length > 0) {
            const totalPlaylistTracks = activeSchedule.playlist.length;
            const totalTrackIndexTimeline = Math.floor(secondsSinceScheduleStarted / ASSUMED_TRACK_DURATION);
            const currentTrackIndex = totalTrackIndexTimeline % totalPlaylistTracks;
            
            const selectedTrack = activeSchedule.playlist[currentTrackIndex];
            const trackElapsedSeconds = secondsSinceScheduleStarted % ASSUMED_TRACK_DURATION;

            return NextResponse.json({
              active: true,
              type: "playlist_mp3",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: selectedTrack?.trackTitle || activeSchedule.eventName,
              artist: selectedTrack?.speaker || activeSchedule.speaker || "PCM Kembaran",
              program_title: stationName,
              audio_url: selectedTrack?.audioFileUrl || null,
              elapsed_seconds: trackElapsedSeconds,
            });
          } else {
            // BACKUP AMAN: Jika blok waktu aktif tapi playlist mp3 kosong, putar filler agar web tidak offline
            const totalFillerTracks = FILLER_PLAYLIST.length;
            const totalTrackIndexTimeline = Math.floor(secondsSinceScheduleStarted / ASSUMED_TRACK_DURATION);
            const currentFillerIndex = totalTrackIndexTimeline % totalFillerTracks;
            
            const selectedFiller = FILLER_PLAYLIST[currentFillerIndex];
            const trackElapsedSeconds = secondsSinceScheduleStarted % ASSUMED_TRACK_DURATION;

            return NextResponse.json({
              active: true,
              type: "playlist_mp3",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: selectedFiller.title,
              artist: activeSchedule.speaker || "PCM Kembaran",
              program_title: activeSchedule.eventName || stationName,
              audio_url: selectedFiller.url,
              elapsed_seconds: trackElapsedSeconds,
            });
          }
        }
      }
    } catch (sanityError) {
      console.error("Gagal memproses otomatisasi jadwal Sanity CMS:", sanityError);
    }

    // =================================================================
    // A. JINGLE TIAP 5 MENIT (DIKONDISIKAN SEBAGAI CRON BACKEND LAMA)
    // =================================================================
    if (currentMinute % 5 === 0 && currentMinute !== 0 && currentSecond < JINGLE_DURATION) {
      return NextResponse.json({
        active: true,
        title: titleFromAudioUrl(JINGLE_URL, "Jingle Suara Berkemajuan"),
        program_title: "Jingle Suara Berkemajuan",
        audio_url: JINGLE_URL,
        elapsed_seconds: currentSecond,
        type: "jingle",
      });
    }

    // =================================================================
    // B. JALUR CADANGAN (PRISMA DATABASE ENGINE LAMA)
    // =================================================================
    const currentTrack = await prisma.radioStream.findFirst({
      orderBy: {
        start_time: "desc",
      },
    });

    // =================================================================
    // C. JIKA TIDAK ADA JADWAL UTAMA SAMA SEKALI, PUTAR FILLER
    // =================================================================
    if (!currentTrack) {
      const nowTimestampSeconds = Math.floor(Date.now() / 1000);
      const currentFiller = getVirtualFillerTrack(nowTimestampSeconds);

      return NextResponse.json({
        active: true,
        title: currentFiller.title,
        program_title: "Audio Cadangan",
        audio_url: currentFiller.audio_url,
        elapsed_seconds: currentFiller.elapsed_seconds,
        type: "filler",
      });
    }

    const startTime = new Date(currentTrack.start_time).getTime();
    const nowTimestamp = Date.now();
    const elapsedSeconds = (nowTimestamp - startTime) / 1000;
    const allowedDuration = currentTrack.duration;

    // =================================================================
    // D. JIKA AUDIO UTAMA MELEBIHI JATAH SLOT / SELESAI -> FILLER SEAMLESS
    // =================================================================
    if (elapsedSeconds >= allowedDuration) {
      const gapSeconds = elapsedSeconds - allowedDuration;
      const totalTimelineSeconds = Math.floor(startTime / 1000) + allowedDuration + gapSeconds;
      
      const currentFiller = getVirtualFillerTrack(totalTimelineSeconds);

      return NextResponse.json({
        active: true,
        title: currentFiller.title,
        program_title: "Audio Cadangan (Jeda)",
        audio_url: currentFiller.audio_url,
        elapsed_seconds: currentFiller.elapsed_seconds,
        type: "filler",
      });
    }

    // =================================================================
    // E. KONDISI NORMAL (MP3 PRISMA UTAMA SEDANG BERJALAN)
    // =================================================================
    return NextResponse.json({
      active: true,
      title: titleFromAudioUrl(currentTrack.audio_url, currentTrack.title),
      program_title: currentTrack.title,
      audio_url: currentTrack.audio_url,
      elapsed_seconds: elapsedSeconds,
      type: "main",
    });

  } catch (error: any) {
    console.error("Gagal memuat get-current-radio emergency block:", error);
    const fallbackSeconds = Math.floor(Date.now() / 1000);
    const emergencyFiller = getVirtualFillerTrack(fallbackSeconds);
    return NextResponse.json({
      active: true,
      title: emergencyFiller.title,
      program_title: "Audio Cadangan (Emergency)",
      audio_url: emergencyFiller.audio_url,
      elapsed_seconds: emergencyFiller.elapsed_seconds,
      type: "fallback",
    });
  }
}