import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { client } from "@/lib/sanity.client";

export const dynamic = "force-dynamic";

const ADZAN_URL = "/audio/adzan.mp3";
const ADZAN_DURATION = 300; // 5 Menit otomatis memotong jadwal radio

// Jalur murni domain tempat Radio PHP kamu berada dan terbukti lancar tanpa putus
const LIVE_PHP_SERVER = "https://www.pcmkembaran.com"; 

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

async function getAdzanMinutesToday(): Promise<{ [key: string]: number }> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");

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

export async function GET(request: NextRequest) {
  // Inisialisasi data default
  let currentType = "playlist_mp3";
  let targetAudioUrl = "";
  let secondsSinceStarted = 0;
  let title = "Siaran Utama Radio";
  let artist = "Radio Suara Berkemajuan";
  let programTitle = "Radio Suara Berkemajuan";
  let thumbnail = "/bg-player.png";

  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  const timeParts = timeFormatter.formatToParts(now);
  const currentHours = Number(timeParts.find(p => p.type === "hour")?.value || 0);
  const currentMinutes = Number(timeParts.find(p => p.type === "minute")?.value || 0);
  const currentSecs = Number(timeParts.find(p => p.type === "second")?.value || 0);
  
  // 🌟 PERBAIKAN SAKTI 1: Hitung total detik hari ini secara presisi untuk mencocokkan transisi adzan
  const totalDetikSekarang = (currentHours * 3600) + (currentMinutes * 60) + currentSecs;

  // =========================================================================
  // 1. CEK INTERUPSI JADWAL ADZAN OTOMATIS (SINKRONISASI DETIK JALUR NYATA)
  // =========================================================================
  try {
    const jadwalSholat = await getAdzanMinutesToday();
    const namaWaktuSholat = Object.keys(jadwalSholat).find(key => {
      const waktuSholatMenit = jadwalSholat[key];
      const totalDetikSholat = waktuSholatMenit * 60; // Konversi jadwal sholat ke detik murni
      
      const selisihDetikMurni = totalDetikSekarang - totalDetikSholat;
      return selisihDetikMurni >= 0 && selisihDetikMurni < ADZAN_DURATION;
    });

    if (namaWaktuSholat) {
      const waktuSholatMenit = jadwalSholat[namaWaktuSholat];
      const totalDetikSholat = waktuSholatMenit * 60;
      const elapsedAdzanSeconds = totalDetikSekarang - totalDetikSholat;

      // 🚀 PERBAIKAN SAKTI 2: Bypass adzan lokal ke sirkuit stream.php milik server PHP utama.
      // Ini mencegah browser HTML5 mengalami crash buffer akibat melompat ke file statis lokal Next.js.
      const BYPASS_ADZAN_URL = `${LIVE_PHP_SERVER}/radio/stream.php?mode=adzan&stream_url=${encodeURIComponent(ADZAN_URL)}&current_seconds=${elapsedAdzanSeconds}`;

      return NextResponse.json({
        active: true,
        type: "adzan",
        youtube_video_id: null,
        thumbnail: "/bg-player.png",
        title: `Panggilan Adzan - Waktu ${namaWaktuSholat.toUpperCase()}`,
        artist: "Radio Suara Al Muttaqin",
        program_title: "Adzan Otomatis Wilayah Purwokerto",
        audio_url: BYPASS_ADZAN_URL, 
        elapsed_seconds: elapsedAdzanSeconds,
      }, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
    }
  } catch (e) {
    console.error("Gagal memproses interupsi adzan:", e);
  }

  // =========================================================================
  // 2. PARSING JADWAL SANITY CMS
  // =========================================================================
  try {
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
            "duration": audioFile.asset->metadata.duration,
            "audioFileUrl": audioFile.asset->url
          }
        }
      }
    `;

    const config = await client.fetch(sanityQuery, {}, { cache: "no-store" });
    const stationName = config?.radioName || "Radio Suara Berkemajuan";
    programTitle = stationName;

    if (config?.schedules && Array.isArray(config.schedules)) {
      const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "long" });
      const currentDayName = dayFormatter.format(now);

      let activeSchedule = null;
      for (const schedule of config.schedules) {
        const start = timeToMinutes(schedule.startTime);
        const end = timeToMinutes(schedule.endTime);
        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        const isTimeMatch = currentTotalMinutes >= start && currentTotalMinutes < end;
        const isDayMatch = schedule.day === "everyday" || schedule.day === currentDayName;

        if (isTimeMatch && isDayMatch) {
          activeSchedule = schedule;
          break;
        }
      }

      if (activeSchedule) {
        currentType = activeSchedule.broadcastMode || "playlist_mp3";
        const startMinutes = timeToMinutes(activeSchedule.startTime);
        secondsSinceStarted = ((currentHours * 60 + currentMinutes - startMinutes) * 60) + currentSecs;
        title = activeSchedule.eventName || "Live Streaming Radio";
        artist = activeSchedule.speaker || "PCM Kembaran";

        if (currentType === "youtube_live") {
          const videoId = activeSchedule.youtubeVideoId?.trim() || null;
          return NextResponse.json({
            active: true,
            type: "youtube_live",
            youtube_video_id: videoId,
            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/bg-player.png",
            title: title,
            artist: artist,
            program_title: stationName,
            audio_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
            elapsed_seconds: 0
          }, {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }

        if (currentType === "live_relay" || currentType.includes("relay")) {
          targetAudioUrl = activeSchedule.relayUrl?.trim() || "";
        } else if (activeSchedule.playlist && activeSchedule.playlist.length > 0) {
          const playlist = activeSchedule.playlist;
          const totalDuration = playlist.reduce((acc: number, item: any) => acc + (Math.floor(Number(item.duration)) || 240), 0);

          if (totalDuration > 0) {
            const virtualTimeline = Math.abs(secondsSinceStarted) % totalDuration;
            let accumulatedTime = 0;

            for (const track of playlist) {
              const d = Math.floor(Number(track.duration)) || 240;
              if (virtualTimeline >= accumulatedTime && virtualTimeline < accumulatedTime + d) {
                title = track.trackTitle || "Kajian Pilihan";
                artist = track.speaker || "PCM Kembaran";
                targetAudioUrl = track.audioFileUrl || "";
                secondsSinceStarted = virtualTimeline - accumulatedTime;
                break;
              }
              accumulatedTime += d;
            }
          }
        }
      }
    }
  } catch (sanityError) {
    console.error("Gagal membaca Sanity CMS:", sanityError);
  }

  // =========================================================================
  // 3. JALUR CADANGAN JIKA TARGET URL KOSONG (PRISMA DB FALLBACK)
  // =========================================================================
  if (!targetAudioUrl) {
    try {
      const currentTrack = await prisma.radioStream.findFirst({ orderBy: { start_time: "desc" } });
      if (currentTrack) {
        const startTime = new Date(currentTrack.start_time).getTime();
        const elapsedSeconds = (Date.now() - startTime) / 1000;

        if (elapsedSeconds < currentTrack.duration) {
          currentType = "main";
          title = currentTrack.title;
          artist = "Kajian Pilihan";
          programTitle = "Audio Utama (Database)";
          targetAudioUrl = currentTrack.audio_url;
          secondsSinceStarted = Math.floor(elapsedSeconds);
        }
      }
    } catch (dbError) {
       console.error("Gagal membaca database Prisma:", dbError);
    }
  }

  // 🌟 BYPASS UTAMA: Kirim URL terpadu langsung menembak server core stream PHP Hawkhost
  const BYPASS_DIRECT_URL = `${LIVE_PHP_SERVER}/radio/stream.php?mode=${currentType}&stream_url=${encodeURIComponent(targetAudioUrl)}&current_seconds=${secondsSinceStarted}`;

  return NextResponse.json({
    active: true,
    type: currentType,
    youtube_video_id: null,
    thumbnail: thumbnail,
    title: title,
    artist: artist,
    program_title: programTitle,
    audio_url: BYPASS_DIRECT_URL, 
    elapsed_seconds: secondsSinceStarted
  }, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}