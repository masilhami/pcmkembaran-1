import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { client } from "@/lib/sanity.client"; 

// 🎯 KUNCI UTAMA ANTI-BONCOS VERCEL:
// Ubah ke "auto" agar Next.js dan Vercel Edge Network diizinkan menyimpan cache static (SWR)
// secara elastis di server CDN terdekat, memotong konsumsi CPU Serverless secara drastis!
export const dynamic = "auto"; 

const ADZAN_URL = "/audio/adzan.mp3"; 
const ADZAN_DURATION = 300; // 5 Menit

// Jalur rute cadangan aman menggunakan server berkapasitas badak milik archive.org
const FILLER_PLAYLIST = [
  { title: "Murottal Jeda - Surah Al-Mulk", url: "https://ia800605.us.archive.org/28/items/surah-al-mulk-saad-al-ghamdi/SurahAlMulk-Saad-Al-Ghamdi.mp3", duration: 415, speaker: "Saad Al-Ghamdi" },
  { title: "Nasyid Jeda - Rikhie Asbo", url: "https://ia800605.us.archive.org/28/items/surah-al-mulk-saad-al-ghamdi/Rikhie-Asbo.mp3", duration: 5760, speaker: "Rikhie Asbo" },
  { title: "Murottal Jeda - Surah Al-Waqiah", url: "https://ia800605.us.archive.org/28/items/surah-al-mulk-saad-al-ghamdi/al-waqiah-ust-shidqy.mp3", duration: 780, speaker: "Ust. Shidqy" },
  { title: "Nasyid Jeda - Hanya Rindu Versi Arab", url: "https://ia800605.us.archive.org/28/items/surah-al-mulk-saad-al-ghamdi/hanya-rindu-versi-arab.mp3", duration: 258, speaker: "Anonim" },
  { title: "Murottal Jeda - Al Fatihah Syaikh Abdullah Al-Mathrud", url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/001-Al-Fatihah.mp3", duration: 27, speaker: "Syaikh Abdullah Al-Mathrud" },
  { title: "Murottal Jeda - Al Baqarah Syaikh Abdullah Al-Mathrud", url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/002-Al-Baqarah.mp3", duration: 7200, speaker: "Syaikh Abdullah Al-Mathrud" },
  { title: "Murottal Jeda - Ali Imron Syaikh Abdullah Al-Mathrud", url: "https://ia801406.us.archive.org/8/items/abdullahal-mathrud/003-Ali-Imran.mp3", duration: 4800, speaker: "Syaikh Abdullah Al-Mathrud" }
];

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const cleanTime = timeStr.replace('.', ':');
  const [hours, minutes] = cleanTime.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

function getVirtualTrackFromPlaylist(
  playlist: Array<{title?: string, trackTitle?: string, duration?: number, url?: string, audioFileUrl?: string, speaker?: string, originalFilename?: string}>, 
  secondsElapsedSinceStart: number
) {
  const getDuration = (track: any) => Number(track.duration) || 240; 
  const totalDuration = playlist.reduce((acc, item) => acc + getDuration(item), 0);

  // 🟢 CLEANUP: Alihkan data fallback kosong ke Archive.org murni, bukan sdit.my.id
  if (totalDuration <= 0) {
    return { title: FILLER_PLAYLIST[0].title, audio_url: FILLER_PLAYLIST[0].url, elapsed_seconds: 0, artist: FILLER_PLAYLIST[0].speaker };
  }

  const virtualTimeline = Math.floor(Math.abs(secondsElapsedSinceStart)) % totalDuration;
  let accumulatedTime = 0;

  for (const track of playlist) {
    const d = getDuration(track);
    if (virtualTimeline >= accumulatedTime && virtualTimeline < accumulatedTime + d) {
      
      let finalTitle = track.trackTitle || track.title;
      if (!finalTitle && track.originalFilename) {
        finalTitle = track.originalFilename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
      }

      return {
        title: finalTitle || "Kajian Pilihan",
        audio_url: track.url || track.audioFileUrl || FILLER_PLAYLIST[0].url, 
        elapsed_seconds: virtualTimeline - accumulatedTime,
        artist: track.speaker || "PCM Kembaran", 
      };
    }
    accumulatedTime += d;
  }

  return {
    title: playlist[0].trackTitle || playlist[0].title || "Kajian Pilihan",
    audio_url: playlist[0].url || playlist[0].audioFileUrl || FILLER_PLAYLIST[0].url,
    elapsed_seconds: 0,
    artist: playlist[0].speaker || "PCM Kembaran",
  };
}

function getVirtualFillerTrack(gapSeconds: number) {
  return getVirtualTrackFromPlaylist(FILLER_PLAYLIST, gapSeconds);
}

async function getAdzanMinutesToday(): Promise<{ [key: string]: number }> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');

    const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/1301/${year}/${month}/${date}`, { 
      next: { revalidate: 3600 } 
    });
    const json = await res.json();

    if (json?.status && json?.data?.jadwal) {
      const j = json.data.jadwal;
      return {
        subuh: timeToMinutes(j.subuh),
        dzuhur: timeToMinutes(j.dzuhur),
        ashar: timeToMinutes(j.ashar),
        maghrib: timeToMinutes(j.maghrib),
        isya: timeToMinutes(j.isya),
      };
    }
  } catch (err) {
    console.error("Gagal mengambil API Jadwal Sholat:", err);
  }
  return { subuh: 275, dzuhur: 710, ashar: 915, maghrib: 1075, isya: 1145 };
}

// 🎯 KUNCI UTAMA ANTI-BONCOS SWR HEADERS (UNTUK SIARAN NON-ADZAN):
// Kita ubah Cache-Control agar Vercel CDN meng-cache respons data radio ini selama 7 detik di Edge.
const getSecureHeaders = () => {
  return {
    "Cache-Control": "public, max-age=7, stale-while-revalidate=15",
    "Access-Control-Allow-Origin": "*",
  };
};

export async function GET() {
  try {
    const now = new Date();
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

    // 1. CEK INTERUPSI ADZAN
    try {
      const jadwalSholat = await getAdzanMinutesToday();
      const namaWaktuSholat = Object.keys(jadwalSholat).find(key => {
        const waktuSholatMenit = jadwalSholat[key];
        const selisihDetik = ((currentTotalMinutes - waktuSholatMenit) * 60) + currentSecs;
        return selisihDetik >= 0 && selisihDetik < ADZAN_DURATION;
      });

      if (namaWaktuSholat) {
        const waktuSholatMenit = jadwalSholat[namaWaktuSholat];
        const elapsedAdzanSeconds = ((currentTotalMinutes - waktuSholatMenit) * 60) + currentSecs;

        // 🟢 FIX MUTLAK SAKRAL: Hancurkan cache CDN khusus saat adzan tiba (max-age=0)
        // Mencegah delay polling hulu agar adzan berkumandang serentak tanpa tertahan cache SWR
        const adzanHeaders = {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Access-Control-Allow-Origin": "*",
        };

        return NextResponse.json({
          active: true,
          type: "adzan",
          youtube_video_id: null,
          thumbnail: "/bg-player.png",
          title: `Panggilan Adzan - Waktu ${namaWaktuSholat.toUpperCase()}`,
          artist: "Radio Suara Berkemajuan",
          program_title: "Adzan Otomatis Wilayah Purwokerto",
          audio_url: ADZAN_URL,
          elapsed_seconds: elapsedAdzanSeconds > 10 ? 0 : elapsedAdzanSeconds, 
        }, { headers: adzanHeaders });
      }
    } catch (e) {
      console.error(e);
    }

    // 2. AMBIL DATA JADWAL SANITY CMS
    try {
      const sanityQuery = `
        *[_type == "radioSchedule" || _type == "radioConfig"][0] {
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
              "url": audioUrl, 
              "duration": audioFile.asset->metadata.duration,
              "originalFilename": audioFile.asset->originalFilename,
              "audioFileUrl": audioFile.asset->url
            }
          }
        }
      `;
      
      const config = await client.fetch(sanityQuery, {}, { next: { revalidate: 10 } });

      if (config?.schedules && Array.isArray(config.schedules)) {
        const dayFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Jakarta',
          weekday: 'long'
        });
        const currentDayName = dayFormatter.format(now).trim().toLowerCase();

        let activeSchedule = null;
        for (const schedule of config.schedules) {
          const start = timeToMinutes(schedule.startTime);
          const end = timeToMinutes(schedule.endTime);
          const isTimeMatch = currentTotalMinutes >= start && currentTotalMinutes < end;
          
          const sDay = (schedule.day || '').trim().toLowerCase();
          const isDayMatch = sDay === 'everyday' || sDay === currentDayName;

          if (isTimeMatch && isDayMatch) {
            activeSchedule = schedule;
            break;
          }
        }

        if (activeSchedule) {
          const isYoutube = activeSchedule.broadcastMode === 'youtube_live';
          const isLiveRelay = activeSchedule.broadcastMode?.includes('relay') || activeSchedule.broadcastMode === 'live_relay';
          const stationName = config.radioName || "Radio Suara Berkemajuan";
          const startMinutes = timeToMinutes(activeSchedule.startTime);
          const secondsSinceScheduleStarted = ((currentTotalMinutes - startMinutes) * 60) + currentSecs;

          if (isYoutube) {
            const videoId = activeSchedule.youtubeVideoId?.trim() || null;
            
            // 🟢 FIX MUTLAK SINKRONISASI YOUTUBE STATIS:
            // Kirim kalkulasi selisih detik riil sejak jadwal dimulai ke properti elapsed_seconds, 
            // agar frontend player bisa memaksa lompat (seekTo) ke menit yang sedang berjalan!
            return NextResponse.json({
              active: true,
              type: "youtube_live",
              youtube_video_id: videoId,
              thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/bg-player.png",
              title: activeSchedule.eventName || "Live Streaming YouTube",
              artist: activeSchedule.speaker || "PCM Kembaran",
              program_title: stationName,
              audio_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
              elapsed_seconds: Math.max(0, secondsSinceScheduleStarted)
            }, { headers: getSecureHeaders() });
          }

          if (isLiveRelay) {
            // 🟢 CLEANUP: Jika relay kosong/terputus, kembalikan audio stream default internal domain aktif
            const rawRelayUrl = activeSchedule.relayUrl?.trim() || "";
            const cleanRelayUrl = (rawRelayUrl.includes("ybmsaum.com") || !rawRelayUrl) 
              ? "/radio/stream.php" 
              : rawRelayUrl;

            return NextResponse.json({
              active: true,
              type: "live_relay",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: activeSchedule.eventName || "Live Streaming Radio",
              artist: activeSchedule.speaker || "PCM Kembaran",
              program_title: stationName,
              audio_url: cleanRelayUrl,
              elapsed_seconds: 0 
            }, { headers: getSecureHeaders() });
          }

          if (activeSchedule.playlist && activeSchedule.playlist.length > 0) {
            const virtualTrack = getVirtualTrackFromPlaylist(activeSchedule.playlist, secondsSinceScheduleStarted);
            return NextResponse.json({
              active: true,
              type: "playlist_mp3",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: virtualTrack.title,
              artist: virtualTrack.artist, 
              program_title: stationName,
              audio_url: virtualTrack.audio_url,
              elapsed_seconds: virtualTrack.elapsed_seconds,
            }, { headers: getSecureHeaders() });
          } else {
            const virtualFiller = getVirtualTrackFromPlaylist(FILLER_PLAYLIST, secondsSinceScheduleStarted);
            return NextResponse.json({
              active: true,
              type: "playlist_mp3",
              youtube_video_id: null,
              thumbnail: "/bg-player.png",
              title: virtualFiller.title,
              artist: virtualFiller.artist, 
              program_title: activeSchedule.eventName || stationName,
              audio_url: virtualFiller.audio_url,
              elapsed_seconds: virtualFiller.elapsed_seconds,
            }, { headers: getSecureHeaders() });
          }
        }
      }
    } catch (e) {
      console.error("Gagal otomatisasi pembacaan Sanity Engine:", e);
    }

    // 3. JALUR CADANGAN PRISMA DB
    const currentTrack = await prisma.radioStream.findFirst({
      orderBy: { start_time: "desc" },
    });

    if (!currentTrack) {
      const nowTimestampSeconds = Math.floor(Date.now() / 1000);
      const currentFiller = getVirtualFillerTrack(nowTimestampSeconds);
      return NextResponse.json({
        active: true,
        title: currentFiller.title,
        artist: currentFiller.artist,
        program_title: "Audio Cadangan",
        audio_url: currentFiller.audio_url,
        elapsed_seconds: currentFiller.elapsed_seconds,
        type: "filler",
      }, { headers: getSecureHeaders() });
    }

    const startTime = new Date(currentTrack.start_time).getTime();
    const nowTimestamp = Date.now();
    const elapsedSeconds = (nowTimestamp - startTime) / 1000;
    const allowedDuration = currentTrack.duration;

    if (elapsedSeconds >= allowedDuration || elapsedSeconds > currentTrack.duration) {
      const totalTimelineSeconds = Math.floor(nowTimestamp / 1000);
      const currentFiller = getVirtualFillerTrack(totalTimelineSeconds);
      return NextResponse.json({
        active: true,
        title: currentFiller.title,
        artist: currentFiller.artist,
        program_title: "Audio Cadangan (Jeda)",
        audio_url: currentFiller.audio_url,
        elapsed_seconds: currentFiller.elapsed_seconds,
        type: "filler",
      }, { headers: getSecureHeaders() });
    }

    // 🟢 CLEANUP: Jika data DB kosong/rusak, arahkan ke URL stream relatif lokal agar tidak lompat domain
    const finalTrackUrl = (currentTrack.audio_url?.includes("ybmsaum.com") || !currentTrack.audio_url)
      ? "/radio/stream.php"
      : currentTrack.audio_url;

    return NextResponse.json({
      active: true,
      title: currentTrack.title,
      artist: "Kajian Pilihan",
      program_title: currentTrack.title,
      audio_url: finalTrackUrl,
      elapsed_seconds: Math.floor(elapsedSeconds), 
      type: "main",
    }, { headers: getSecureHeaders() });

  } catch (error: any) {
    const fallbackSeconds = Math.floor(Date.now() / 1000);
    const emergencyFiller = getVirtualFillerTrack(fallbackSeconds);
    return NextResponse.json({
      active: true,
      title: emergencyFiller.title,
      artist: emergencyFiller.artist,
      program_title: "Audio Cadangan (Emergency)",
      audio_url: emergencyFiller.audio_url,
      elapsed_seconds: emergencyFiller.elapsed_seconds,
      type: "fallback",
    }, { headers: getSecureHeaders() });
  }
}