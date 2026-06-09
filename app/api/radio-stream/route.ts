import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Wajib agar tidak di-cache oleh Next.js

export async function GET() {
  const ICECAST_URL = 'http://37.157.242.105:6029/stream';

  try {
    // 1. Ambil data stream dari server Icecast gratisan
    const response = await fetch(ICECAST_URL, {
      cache: 'no-store',
      headers: {
        'Accept': 'audio/mpeg',
      },
    });

    if (!response.ok || !response.body) {
      return new NextResponse('Radio Offline', { status: 503 });
    }

    // 2. Semburkan kembali data audio sebagai ReadableStream lewat HTTPS website kamu
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error Proxy Radio:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}