import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper untuk memastikan respons selalu berupa JSON yang valid
const jsonResponse = (data: any, status: number = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0" 
    },
  });
};

const JINGLE_URL = "https://sdit.my.id/radio/jingle.MP3";
const JINGLE_DURATION = 15;

const FILLER_PLAYLIST = [
  { title: "Murottal Jeda - Surah Al-Mulk", url: "https://sdit.my.id/radio/SurahAlMulk-Saad-Al-Ghamdi.mp3", duration: 415 },
  { title: "Nasyid Jeda - Rikhie Asbo", url: "https://sdit.my.id/radio/Rikhie-Asbo.mp3", duration: 5760 },
  { title: "Murottal Jeda - Surah Al-Waqiah", url: "https://sdit.my.id/radio/al-waqiah-ust-shidqy.mp3", duration: 780 },
  { title: "Nasyid Jeda - Hanya Rindu Versi Arab", url: "https://sdit.my.id/radio/hanya-rindu-versi-arab.mp3", duration: 258 },
  { title: "Murottal Jeda - Al Fatihah Syaikh Abdullah Al-Mathrud", url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/001-Al-Fatihah.mp3", duration: 27 },
  { title: "Murottal Jeda - Al Baqarah Syaikh Abdullah Al-Mathrud", url: "https://dn710102.ca.archive.org/0/items/abdullahal-mathrud/002-Al-Baqarah.mp3", duration: 7200 },
  { title: "Murottal Jeda - Ali Imron Syaikh Abdullah Al-Mathrud", url: "https://ia801406.us.archive.org/8/items/abdullahal-mathrud/003-Ali-Imran.mp3", duration: 4800 },
];

const TOTAL_FILLER_DURATION = FILLER_PLAYLIST.reduce((acc, item) => acc + item.duration, 0);

function titleFromAudioUrl(audioUrl?: string, fallback = "Radio Suara Al Muttaqin") {
  if (!audioUrl) return fallback;
  try {
    const url = new URL(audioUrl);
    const rawFilename = url.pathname.split("/").pop() || "";
    return decodeURIComponent(rawFilename.replace(/\.[a-z0-9]+$/i, "")).replace(/[_-]+/g, " ").trim() || fallback;
  } catch {
    const rawFilename = audioUrl.split("/").pop() || "";
    return rawFilename.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim() || fallback;
  }
}

function getVirtualFillerTrack(gapSeconds: number) {
  if (TOTAL_FILLER_DURATION <= 0) return { title: "Radio Suara Al Muttaqin", audio_url: "", elapsed_seconds: 0 };
  const virtualTimeline = Math.floor(Math.abs(gapSeconds)) % TOTAL_FILLER_DURATION;
  let accumulatedTime = 0;
  for (const track of FILLER_PLAYLIST) {
    if (virtualTimeline >= accumulatedTime && virtualTimeline < accumulatedTime + track.duration) {
      return { title: track.title || titleFromAudioUrl(track.url), audio_url: track.url, elapsed_seconds: virtualTimeline - accumulatedTime };
    }
    accumulatedTime += track.duration;
  }
  return { title: FILLER_PLAYLIST[0].title || titleFromAudioUrl(FILLER_PLAYLIST[0].url), audio_url: FILLER_PLAYLIST[0].url, elapsed_seconds: 0 };
}

async function getYouTubeLiveFromChannel() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID || "";
    const apiKey = process.env.YOUTUBE_API_KEY || "";
    if (!channelId || !apiKey) return null;
    
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("eventType", "live");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("key", apiKey);
    
    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) return null;
    
    const data = await res.json();
    const item = data.items?.[0];
    return item?.id?.videoId ? { 
        videoId: item.id.videoId, 
        title: item.snippet?.title || "YouTube Live", 
        thumbnail: item.snippet?.thumbnails?.high?.url || "", 
        url: `https://www.youtube.com/watch?v=${item.id.videoId}` 
    } : null;
  } catch { return null; }
}

export async function GET() {
  try {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    // 1. YouTube Live Logic
    const youtubeLive = await getYouTubeLiveFromChannel();
    if (youtubeLive) {
      return jsonResponse({ active: true, title: youtubeLive.title, program_title: "YouTube Live", audio_url: youtubeLive.url, thumbnail: youtubeLive.thumbnail, elapsed_seconds: 0, type: "youtube_live" });
    }

    if (process.env.YOUTUBE_LIVE === "1" && process.env.YOUTUBE_LIVE_URL) {
      return jsonResponse({ active: true, title: "YouTube Live", audio_url: process.env.YOUTUBE_LIVE_URL, elapsed_seconds: 0, type: "youtube_live" });
    }

    // 2. Jingle Logic
    if (currentMinute % 5 === 0 && currentMinute !== 0 && currentSecond < JINGLE_DURATION) {
      return jsonResponse({ active: true, title: titleFromAudioUrl(JINGLE_URL, "Jingle"), program_title: "Jingle", audio_url: JINGLE_URL, elapsed_seconds: currentSecond, type: "jingle" });
    }

    // 3. Main Stream Logic (DB Check)
    let currentTrack = null;
    try {
        currentTrack = await prisma.radioStream.findFirst({ orderBy: { start_time: "desc" } });
    } catch (dbError) {
        console.error("Database Query Failed:", dbError);
    }

    if (!currentTrack) {
      return jsonResponse({ active: true, ...getVirtualFillerTrack(Math.floor(Date.now() / 1000)), program_title: "Audio Cadangan", type: "filler" });
    }

    const elapsedSeconds = (Date.now() - new Date(currentTrack.start_time).getTime()) / 1000;
    if (elapsedSeconds >= currentTrack.duration) {
      return jsonResponse({ active: true, ...getVirtualFillerTrack(Math.floor(Date.now() / 1000)), program_title: "Audio Cadangan (Jeda)", type: "filler" });
    }

    return jsonResponse({ 
        active: true, 
        title: titleFromAudioUrl(currentTrack.audio_url, currentTrack.title), 
        program_title: currentTrack.title, 
        audio_url: currentTrack.audio_url, 
        elapsed_seconds: elapsedSeconds, 
        type: "main" 
    });

  } catch (error) {
    console.error("API Unexpected Error:", error);
    return jsonResponse({ 
        active: true, 
        ...getVirtualFillerTrack(Math.floor(Date.now() / 1000)), 
        program_title: "Audio Emergency", 
        type: "fallback" 
    }, 500);
  }
}